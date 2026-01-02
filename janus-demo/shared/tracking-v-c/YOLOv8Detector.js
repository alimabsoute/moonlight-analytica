/**
 * YOLOv8 Detector using ONNX Runtime Web
 * Provides high-accuracy person detection with multi-angle support
 * Model: YOLOv8n (~6.3MB ONNX)
 */

/**
 * YOLOv8 ONNX Detector
 */
export class YOLOv8Detector {
  constructor(options = {}) {
    this.modelPath = options.modelPath || '/models/yolov8n.onnx';
    this.confThreshold = options.confThreshold ?? 0.35;
    this.iouThreshold = options.iouThreshold ?? 0.45;
    this.inputSize = options.inputSize ?? 640;
    this.classFilter = options.classFilter ?? [0]; // Class 0 = person in COCO

    this.session = null;
    this.isReady = false;
    this.warmupDone = false;

    // Preprocessing canvas
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Initialize ONNX Runtime and load model
   */
  async initialize() {
    try {
      // Dynamic import of ONNX Runtime
      const ort = await import('onnxruntime-web');

      // Configure execution providers
      const options = {
        executionProviders: ['webgl', 'wasm'],
        graphOptimizationLevel: 'all'
      };

      console.log('[YOLOv8] Loading model from:', this.modelPath);
      this.session = await ort.InferenceSession.create(this.modelPath, options);

      // Create preprocessing canvas
      this.canvas = new OffscreenCanvas(this.inputSize, this.inputSize);
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

      this.isReady = true;
      console.log('[YOLOv8] Model loaded successfully');

      // Warmup with a dummy inference
      await this._warmup();

      return true;
    } catch (error) {
      console.error('[YOLOv8] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Warmup the model with dummy data
   */
  async _warmup() {
    if (this.warmupDone) return;

    try {
      const dummyData = new Float32Array(3 * this.inputSize * this.inputSize);
      const ort = await import('onnxruntime-web');
      const tensor = new ort.Tensor('float32', dummyData, [1, 3, this.inputSize, this.inputSize]);

      await this.session.run({ images: tensor });
      this.warmupDone = true;
      console.log('[YOLOv8] Warmup complete');
    } catch (error) {
      console.warn('[YOLOv8] Warmup failed:', error);
    }
  }

  /**
   * Detect objects in a video frame
   * @param {HTMLVideoElement|HTMLCanvasElement|ImageData} frame - Input frame
   * @returns {Array} Detections with {bbox, score, classId}
   */
  async detect(frame) {
    if (!this.isReady || !this.session) {
      console.warn('[YOLOv8] Detector not ready');
      return [];
    }

    try {
      // Get original dimensions
      const origWidth = frame.videoWidth || frame.width;
      const origHeight = frame.videoHeight || frame.height;

      // Preprocess
      const { tensor, scale, padX, padY } = await this._preprocess(frame, origWidth, origHeight);

      // Run inference
      const outputs = await this.session.run({ images: tensor });

      // Postprocess
      const detections = this._postprocess(
        outputs,
        origWidth,
        origHeight,
        scale,
        padX,
        padY
      );

      return detections;
    } catch (error) {
      console.error('[YOLOv8] Detection error:', error);
      return [];
    }
  }

  /**
   * Preprocess frame for YOLOv8
   */
  async _preprocess(frame, origWidth, origHeight) {
    const ort = await import('onnxruntime-web');

    // Calculate scaling to fit in inputSize while maintaining aspect ratio
    const scale = Math.min(
      this.inputSize / origWidth,
      this.inputSize / origHeight
    );

    const scaledWidth = Math.round(origWidth * scale);
    const scaledHeight = Math.round(origHeight * scale);

    // Center padding
    const padX = Math.round((this.inputSize - scaledWidth) / 2);
    const padY = Math.round((this.inputSize - scaledHeight) / 2);

    // Clear canvas with gray (letterbox padding)
    this.ctx.fillStyle = '#808080';
    this.ctx.fillRect(0, 0, this.inputSize, this.inputSize);

    // Draw scaled image centered
    this.ctx.drawImage(frame, padX, padY, scaledWidth, scaledHeight);

    // Get pixel data
    const imageData = this.ctx.getImageData(0, 0, this.inputSize, this.inputSize);
    const pixels = imageData.data;

    // Convert to CHW format and normalize to [0, 1]
    const inputData = new Float32Array(3 * this.inputSize * this.inputSize);
    const inputSize2 = this.inputSize * this.inputSize;

    for (let i = 0; i < inputSize2; i++) {
      const pixelIdx = i * 4;
      inputData[i] = pixels[pixelIdx] / 255.0;                    // R
      inputData[i + inputSize2] = pixels[pixelIdx + 1] / 255.0;   // G
      inputData[i + 2 * inputSize2] = pixels[pixelIdx + 2] / 255.0; // B
    }

    const tensor = new ort.Tensor('float32', inputData, [1, 3, this.inputSize, this.inputSize]);

    return { tensor, scale, padX, padY };
  }

  /**
   * Postprocess YOLOv8 output
   */
  _postprocess(outputs, origWidth, origHeight, scale, padX, padY) {
    // YOLOv8 output shape: [1, 84, 8400] (for yolov8n with 80 classes)
    // 84 = 4 (bbox) + 80 (class scores)
    // 8400 = number of predictions

    const output = outputs.output0 || outputs[Object.keys(outputs)[0]];
    const data = output.data;
    const [batch, features, numBoxes] = output.dims;

    const detections = [];
    const numClasses = features - 4;

    for (let i = 0; i < numBoxes; i++) {
      // Find best class
      let maxScore = 0;
      let maxClass = 0;

      for (let c = 0; c < numClasses; c++) {
        const score = data[i * features + 4 + c] || data[(4 + c) * numBoxes + i];
        if (score > maxScore) {
          maxScore = score;
          maxClass = c;
        }
      }

      // Filter by confidence and class
      if (maxScore < this.confThreshold) continue;
      if (this.classFilter && !this.classFilter.includes(maxClass)) continue;

      // Get bbox (center x, center y, width, height)
      let cx, cy, w, h;

      // Handle different output formats
      if (output.dims.length === 3 && output.dims[1] === features) {
        // Shape [1, 84, 8400] - transposed
        cx = data[0 * numBoxes + i];
        cy = data[1 * numBoxes + i];
        w = data[2 * numBoxes + i];
        h = data[3 * numBoxes + i];
      } else {
        // Shape [1, 8400, 84] - standard
        cx = data[i * features + 0];
        cy = data[i * features + 1];
        w = data[i * features + 2];
        h = data[i * features + 3];
      }

      // Convert to corner format and remove padding/scaling
      let x1 = cx - w / 2;
      let y1 = cy - h / 2;
      let x2 = cx + w / 2;
      let y2 = cy + h / 2;

      // Remove padding
      x1 = (x1 - padX) / scale;
      y1 = (y1 - padY) / scale;
      x2 = (x2 - padX) / scale;
      y2 = (y2 - padY) / scale;

      // Clip to image bounds
      x1 = Math.max(0, Math.min(origWidth, x1));
      y1 = Math.max(0, Math.min(origHeight, y1));
      x2 = Math.max(0, Math.min(origWidth, x2));
      y2 = Math.max(0, Math.min(origHeight, y2));

      // Skip invalid boxes
      if (x2 <= x1 || y2 <= y1) continue;

      detections.push({
        bbox: [x1, y1, x2, y2],
        score: maxScore,
        classId: maxClass,
        label: maxClass === 0 ? 'person' : `class_${maxClass}`
      });
    }

    // Apply NMS
    return this._nms(detections);
  }

  /**
   * Non-maximum suppression
   */
  _nms(detections) {
    if (detections.length === 0) return [];

    // Sort by score descending
    detections.sort((a, b) => b.score - a.score);

    const keep = [];

    for (const det of detections) {
      let shouldKeep = true;

      for (const kept of keep) {
        const iou = this._computeIoU(det.bbox, kept.bbox);
        if (iou >= this.iouThreshold) {
          shouldKeep = false;
          break;
        }
      }

      if (shouldKeep) {
        keep.push(det);
      }
    }

    return keep;
  }

  /**
   * Compute IoU between two boxes
   */
  _computeIoU(box1, box2) {
    const [x1a, y1a, x2a, y2a] = box1;
    const [x1b, y1b, x2b, y2b] = box2;

    const xA = Math.max(x1a, x1b);
    const yA = Math.max(y1a, y1b);
    const xB = Math.min(x2a, x2b);
    const yB = Math.min(y2a, y2b);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const areaA = (x2a - x1a) * (y2a - y1a);
    const areaB = (x2b - x1b) * (y2b - y1b);

    return interArea / (areaA + areaB - interArea);
  }

  /**
   * Update confidence threshold
   */
  setConfThreshold(threshold) {
    this.confThreshold = threshold;
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.session) {
      this.session = null;
    }
    this.isReady = false;
    this.canvas = null;
    this.ctx = null;
  }

  get ready() {
    return this.isReady;
  }
}

/**
 * Factory function
 */
export async function createYOLOv8Detector(options = {}) {
  const detector = new YOLOv8Detector(options);
  await detector.initialize();
  return detector;
}

export default YOLOv8Detector;
