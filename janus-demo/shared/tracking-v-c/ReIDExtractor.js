/**
 * Re-ID Feature Extractor
 * Extracts appearance embeddings for person re-identification
 * Used by DeepSORT for identity persistence across frames
 */

/**
 * Re-ID Feature Extractor using ONNX
 * Outputs a 128/256-dim normalized embedding per detection
 */
export class ReIDExtractor {
  constructor(options = {}) {
    this.modelPath = options.modelPath || '/models/reid_lite.onnx';
    this.inputWidth = options.inputWidth ?? 128;  // Standard ReID input
    this.inputHeight = options.inputHeight ?? 256;
    this.embeddingSize = options.embeddingSize ?? 128;

    this.session = null;
    this.isReady = false;

    // Preprocessing canvas
    this.canvas = null;
    this.ctx = null;

    // Fallback: use color histogram if no model
    this.useFallback = options.useFallback ?? true;
  }

  /**
   * Initialize the ReID model
   */
  async initialize() {
    try {
      const ort = await import('onnxruntime-web');

      // Try to load the model
      try {
        this.session = await ort.InferenceSession.create(this.modelPath, {
          executionProviders: ['webgl', 'wasm']
        });
        console.log('[ReID] Model loaded successfully');
      } catch (modelError) {
        if (this.useFallback) {
          console.warn('[ReID] Model not found, using color histogram fallback');
          this.session = null;
        } else {
          throw modelError;
        }
      }

      // Create preprocessing canvas
      this.canvas = new OffscreenCanvas(this.inputWidth, this.inputHeight);
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

      this.isReady = true;
      return true;
    } catch (error) {
      console.error('[ReID] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Extract appearance embedding for a detection
   * @param {HTMLVideoElement|HTMLCanvasElement} frame - Full frame
   * @param {number[]} bbox - [x1, y1, x2, y2]
   * @returns {Float32Array} Normalized embedding vector
   */
  async extract(frame, bbox) {
    if (!this.isReady) {
      await this.initialize();
    }

    if (this.session) {
      return this._extractWithModel(frame, bbox);
    } else {
      return this._extractColorHistogram(frame, bbox);
    }
  }

  /**
   * Extract embeddings for multiple detections (batched)
   * @param {HTMLVideoElement|HTMLCanvasElement} frame
   * @param {Array} bboxes - Array of [x1, y1, x2, y2]
   * @returns {Array<Float32Array>} Array of embeddings
   */
  async extractBatch(frame, bboxes) {
    const embeddings = [];

    for (const bbox of bboxes) {
      const embedding = await this.extract(frame, bbox);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Extract using the ReID model
   */
  async _extractWithModel(frame, bbox) {
    const ort = await import('onnxruntime-web');

    // Crop and resize
    const cropped = this._cropAndResize(frame, bbox);

    // Create tensor
    const tensor = new ort.Tensor('float32', cropped, [1, 3, this.inputHeight, this.inputWidth]);

    // Run inference
    const outputs = await this.session.run({ input: tensor });
    const features = outputs.output || outputs[Object.keys(outputs)[0]];

    // Normalize embedding
    return this._normalizeEmbedding(features.data);
  }

  /**
   * Crop bbox region and resize to model input size
   */
  _cropAndResize(frame, bbox) {
    const [x1, y1, x2, y2] = bbox;
    const w = x2 - x1;
    const h = y2 - y1;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.inputWidth, this.inputHeight);

    // Draw cropped region scaled to input size
    this.ctx.drawImage(
      frame,
      x1, y1, w, h,  // Source
      0, 0, this.inputWidth, this.inputHeight  // Dest
    );

    // Get pixel data
    const imageData = this.ctx.getImageData(0, 0, this.inputWidth, this.inputHeight);
    const pixels = imageData.data;

    // Convert to CHW format normalized
    const inputSize = this.inputWidth * this.inputHeight;
    const inputData = new Float32Array(3 * inputSize);

    for (let i = 0; i < inputSize; i++) {
      const pixelIdx = i * 4;
      // Normalize with ImageNet mean/std
      inputData[i] = (pixels[pixelIdx] / 255.0 - 0.485) / 0.229;           // R
      inputData[i + inputSize] = (pixels[pixelIdx + 1] / 255.0 - 0.456) / 0.224;  // G
      inputData[i + 2 * inputSize] = (pixels[pixelIdx + 2] / 255.0 - 0.406) / 0.225; // B
    }

    return inputData;
  }

  /**
   * Fallback: Extract color histogram as appearance feature
   * Less discriminative but doesn't require a model
   */
  _extractColorHistogram(frame, bbox) {
    const [x1, y1, x2, y2] = bbox;
    const w = Math.max(1, x2 - x1);
    const h = Math.max(1, y2 - y1);

    // Use a smaller canvas for histogram
    const histCanvas = new OffscreenCanvas(32, 64);
    const histCtx = histCanvas.getContext('2d', { willReadFrequently: true });

    // Draw cropped region
    histCtx.drawImage(frame, x1, y1, w, h, 0, 0, 32, 64);

    const imageData = histCtx.getImageData(0, 0, 32, 64);
    const pixels = imageData.data;

    // Build color histogram (8 bins per channel = 512 dim, then reduce to 128)
    const bins = 8;
    const histR = new Float32Array(bins);
    const histG = new Float32Array(bins);
    const histB = new Float32Array(bins);

    // Also compute spatial color features (upper/lower body)
    const histRUpper = new Float32Array(bins);
    const histGUpper = new Float32Array(bins);
    const histBUpper = new Float32Array(bins);
    const histRLower = new Float32Array(bins);
    const histGLower = new Float32Array(bins);
    const histBLower = new Float32Array(bins);

    const midY = 32; // Half of 64

    for (let i = 0; i < pixels.length; i += 4) {
      const pixelIndex = i / 4;
      const y = Math.floor(pixelIndex / 32);

      const binR = Math.min(bins - 1, Math.floor(pixels[i] / 32));
      const binG = Math.min(bins - 1, Math.floor(pixels[i + 1] / 32));
      const binB = Math.min(bins - 1, Math.floor(pixels[i + 2] / 32));

      histR[binR]++;
      histG[binG]++;
      histB[binB]++;

      if (y < midY) {
        histRUpper[binR]++;
        histGUpper[binG]++;
        histBUpper[binB]++;
      } else {
        histRLower[binR]++;
        histGLower[binG]++;
        histBLower[binB]++;
      }
    }

    // Combine into 128-dim feature vector
    // 6 histograms * 8 bins = 48 features
    // We'll pad and use color moments for remaining dimensions
    const embedding = new Float32Array(this.embeddingSize);

    // Copy histograms
    let offset = 0;
    for (const hist of [histR, histG, histB, histRUpper, histGUpper, histBUpper, histRLower, histGLower, histBLower]) {
      if (offset + bins <= this.embeddingSize) {
        embedding.set(hist, offset);
        offset += bins;
      }
    }

    // Add color statistics
    let sumR = 0, sumG = 0, sumB = 0;
    let sum2R = 0, sum2G = 0, sum2B = 0;
    const numPixels = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      sumR += pixels[i];
      sumG += pixels[i + 1];
      sumB += pixels[i + 2];
      sum2R += pixels[i] * pixels[i];
      sum2G += pixels[i + 1] * pixels[i + 1];
      sum2B += pixels[i + 2] * pixels[i + 2];
    }

    // Mean and variance
    if (offset + 6 <= this.embeddingSize) {
      embedding[offset++] = sumR / numPixels / 255;
      embedding[offset++] = sumG / numPixels / 255;
      embedding[offset++] = sumB / numPixels / 255;
      embedding[offset++] = Math.sqrt(sum2R / numPixels - (sumR / numPixels) ** 2) / 255;
      embedding[offset++] = Math.sqrt(sum2G / numPixels - (sumG / numPixels) ** 2) / 255;
      embedding[offset++] = Math.sqrt(sum2B / numPixels - (sumB / numPixels) ** 2) / 255;
    }

    // Normalize
    return this._normalizeEmbedding(embedding);
  }

  /**
   * L2 normalize embedding for cosine similarity
   */
  _normalizeEmbedding(embedding) {
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (norm > 1e-6) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm;
      }
    }
    return new Float32Array(embedding);
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
 * Compute cosine distance between two embeddings
 * Returns value in [0, 2] where 0 = identical, 2 = opposite
 */
export function cosineDistance(v1, v2) {
  if (!v1 || !v2 || v1.length !== v2.length) return 2;

  let dot = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
  }
  return 1 - dot;
}

/**
 * Compute cosine similarity between two embeddings
 * Returns value in [-1, 1] where 1 = identical
 */
export function cosineSimilarity(v1, v2) {
  return 1 - cosineDistance(v1, v2);
}

/**
 * Factory function
 */
export async function createReIDExtractor(options = {}) {
  const extractor = new ReIDExtractor(options);
  await extractor.initialize();
  return extractor;
}

export default ReIDExtractor;
