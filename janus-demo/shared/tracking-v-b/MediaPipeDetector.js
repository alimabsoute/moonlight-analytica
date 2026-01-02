/**
 * MediaPipe Person Detector Wrapper
 * Uses MediaPipe Tasks Vision for fast, accurate person detection
 * Model: ~3MB, runs at 60+ FPS on modern browsers
 */

/**
 * MediaPipe Person Detector
 * Wraps the MediaPipe Vision API for person detection
 */
export class MediaPipeDetector {
  constructor(options = {}) {
    this.minConfidence = options.minConfidence ?? 0.35;
    this.maxResults = options.maxResults ?? 100;
    this.delegate = options.delegate ?? 'GPU'; // GPU or CPU

    this.detector = null;
    this.vision = null;
    this.isReady = false;
    this.lastTimestamp = 0;
  }

  /**
   * Initialize the detector
   * @param {string} wasmPath - Path to MediaPipe WASM files
   * @param {string} modelPath - Path to the detection model
   */
  async initialize(wasmPath = null, modelPath = null) {
    try {
      // Dynamic import of MediaPipe Vision
      const vision = await import('@mediapipe/tasks-vision');
      this.vision = vision;

      const { ObjectDetector, FilesetResolver } = vision;

      // Use CDN paths if not provided
      const wasmFileset = await FilesetResolver.forVisionTasks(
        wasmPath || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Create object detector configured for person detection
      this.detector = await ObjectDetector.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: modelPath ||
            'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/latest/efficientdet_lite0.tflite',
          delegate: this.delegate
        },
        runningMode: 'VIDEO',
        scoreThreshold: this.minConfidence,
        maxResults: this.maxResults,
        categoryAllowlist: ['person'] // Only detect people
      });

      this.isReady = true;
      console.log('[MediaPipeDetector] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[MediaPipeDetector] Initialization failed:', error);
      this.isReady = false;
      throw error;
    }
  }

  /**
   * Initialize with a person-specific detector model (smaller, faster)
   */
  async initializePersonDetector(wasmPath = null) {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      this.vision = vision;

      const { ObjectDetector, FilesetResolver } = vision;

      const wasmFileset = await FilesetResolver.forVisionTasks(
        wasmPath || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Use the lightweight person detector model
      this.detector = await ObjectDetector.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/latest/efficientdet_lite0.tflite',
          delegate: this.delegate
        },
        runningMode: 'VIDEO',
        scoreThreshold: this.minConfidence,
        maxResults: this.maxResults
      });

      this.isReady = true;
      console.log('[MediaPipeDetector] Person detector initialized');
      return true;
    } catch (error) {
      console.error('[MediaPipeDetector] Person detector init failed:', error);
      throw error;
    }
  }

  /**
   * Detect people in a video frame
   * @param {HTMLVideoElement|HTMLCanvasElement|ImageData} frame - Input frame
   * @param {number} timestamp - Frame timestamp in milliseconds
   * @returns {Array} Detections with {bbox: [x1,y1,x2,y2], score, label}
   */
  async detect(frame, timestamp = null) {
    if (!this.isReady || !this.detector) {
      console.warn('[MediaPipeDetector] Detector not ready');
      return [];
    }

    // Ensure monotonically increasing timestamps
    const ts = timestamp ?? performance.now();
    if (ts <= this.lastTimestamp) {
      this.lastTimestamp += 1;
    } else {
      this.lastTimestamp = ts;
    }

    try {
      // Get frame dimensions
      const width = frame.videoWidth || frame.width;
      const height = frame.videoHeight || frame.height;

      // Run detection
      const results = this.detector.detectForVideo(frame, this.lastTimestamp);

      // Convert to standard format
      const detections = [];
      for (const detection of results.detections) {
        // Filter for person category
        const category = detection.categories?.[0];
        if (!category) continue;

        const isPerson = category.categoryName?.toLowerCase() === 'person';
        if (!isPerson) continue;

        const bbox = detection.boundingBox;
        if (!bbox) continue;

        // Convert to [x1, y1, x2, y2] format (pixel coordinates)
        const x1 = bbox.originX;
        const y1 = bbox.originY;
        const x2 = bbox.originX + bbox.width;
        const y2 = bbox.originY + bbox.height;

        detections.push({
          bbox: [x1, y1, x2, y2],
          score: category.score,
          label: 'person',
          width,
          height
        });
      }

      return detections;
    } catch (error) {
      console.error('[MediaPipeDetector] Detection error:', error);
      return [];
    }
  }

  /**
   * Detect from image element (single image mode)
   * @param {HTMLImageElement} image - Input image
   * @returns {Array} Detections
   */
  async detectImage(image) {
    if (!this.isReady || !this.detector) {
      return [];
    }

    try {
      // Switch to image mode temporarily
      const results = this.detector.detect(image);

      const detections = [];
      for (const detection of results.detections) {
        const category = detection.categories?.[0];
        if (!category || category.categoryName?.toLowerCase() !== 'person') continue;

        const bbox = detection.boundingBox;
        if (!bbox) continue;

        detections.push({
          bbox: [bbox.originX, bbox.originY, bbox.originX + bbox.width, bbox.originY + bbox.height],
          score: category.score,
          label: 'person'
        });
      }

      return detections;
    } catch (error) {
      console.error('[MediaPipeDetector] Image detection error:', error);
      return [];
    }
  }

  /**
   * Update detection settings
   */
  setMinConfidence(confidence) {
    this.minConfidence = confidence;
    // Note: MediaPipe doesn't support runtime threshold changes,
    // would need to reinitialize the detector
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.detector) {
      this.detector.close();
      this.detector = null;
    }
    this.isReady = false;
  }

  /**
   * Check if detector is ready
   */
  get ready() {
    return this.isReady;
  }
}

/**
 * Create a MediaPipe detector with fallback options
 */
export async function createMediaPipeDetector(options = {}) {
  const detector = new MediaPipeDetector(options);

  try {
    await detector.initialize(options.wasmPath, options.modelPath);
    return detector;
  } catch (error) {
    console.warn('[MediaPipeDetector] GPU initialization failed, trying CPU:', error);

    // Fallback to CPU
    const cpuDetector = new MediaPipeDetector({ ...options, delegate: 'CPU' });
    await cpuDetector.initialize(options.wasmPath, options.modelPath);
    return cpuDetector;
  }
}

export default MediaPipeDetector;
