/**
 * Janus Vision Pipeline C
 * Combines YOLOv8 detection, ReID feature extraction, and DeepSORT tracking
 * Optimized for maximum accuracy with appearance-based identity persistence
 */

import { YOLOv8Detector, createYOLOv8Detector } from './YOLOv8Detector.js';
import { ReIDExtractor, createReIDExtractor } from './ReIDExtractor.js';
import DeepSORTTracker from './DeepSORTTracker.js';
import { MultiTrackSmoother } from '../tracking-v-b/BBoxSmoother.js';
import { nms } from '../tracking-common/NMS.js';

/**
 * Main Vision Pipeline for Version C
 * Detection: YOLOv8 (ONNX)
 * Features: ReID appearance embeddings
 * Tracking: DeepSORT (appearance + motion)
 * Smoothing: EMA
 */
export class JanusVisionPipelineC {
  constructor(options = {}) {
    // Detection settings
    this.detectorOptions = {
      modelPath: options.yoloModelPath || '/models/yolov8n.onnx',
      confThreshold: options.confThreshold ?? 0.35,
      iouThreshold: options.nmsThreshold ?? 0.45,
      inputSize: options.inputSize ?? 640
    };

    // ReID settings
    this.reidOptions = {
      modelPath: options.reidModelPath || '/models/reid_lite.onnx',
      useFallback: options.useColorHistogram ?? true
    };

    // Tracking settings
    this.trackerOptions = {
      maxCosineDistance: options.maxCosineDistance ?? 0.4,
      maxIoUDistance: options.maxIoUDistance ?? 0.7,
      lambda: options.lambda ?? 0.5,
      maxAge: options.maxAge ?? 45,
      nInit: options.nInit ?? 3
    };

    // Smoothing settings
    this.smoothingOptions = {
      alpha: options.smoothingAlpha ?? 0.6,
      maxAge: options.smootherMaxAge ?? 60
    };

    // Components
    this.detector = null;
    this.reidExtractor = null;
    this.tracker = null;
    this.smoother = null;

    // State
    this.isInitialized = false;
    this.frameCount = 0;
    this.lastProcessTime = 0;
    this.fps = 0;

    // Callbacks
    this.onTrackEnter = options.onTrackEnter || null;
    this.onTrackExit = options.onTrackExit || null;
    this.onDetection = options.onDetection || null;

    // Entry/exit counting
    this.entryLine = options.entryLine || null;
    this.entryCount = 0;
    this.exitCount = 0;
    this.trackCrossings = new Map();

    // Performance monitoring
    this.perfStats = {
      detection: 0,
      reid: 0,
      tracking: 0,
      smoothing: 0
    };
  }

  /**
   * Initialize all pipeline components
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('[PipelineC] Initializing YOLOv8 + DeepSORT pipeline...');

      // Initialize detector
      this.detector = new YOLOv8Detector(this.detectorOptions);
      await this.detector.initialize();
      console.log('[PipelineC] YOLOv8 detector ready');

      // Initialize ReID extractor
      this.reidExtractor = new ReIDExtractor(this.reidOptions);
      await this.reidExtractor.initialize();
      console.log('[PipelineC] ReID extractor ready');

      // Initialize tracker
      this.tracker = new DeepSORTTracker(this.trackerOptions);
      console.log('[PipelineC] DeepSORT tracker ready');

      // Initialize smoother
      this.smoother = new MultiTrackSmoother(this.smoothingOptions);
      console.log('[PipelineC] Smoother ready');

      this.isInitialized = true;
      console.log('[PipelineC] Initialization complete');
      return true;
    } catch (error) {
      console.error('[PipelineC] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process a single video frame
   * @param {HTMLVideoElement|HTMLCanvasElement} frame - Input frame
   * @param {number} timestamp - Frame timestamp (optional)
   * @returns {Object} { tracks, detections, fps, stats }
   */
  async processFrame(frame, timestamp = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    this.frameCount++;

    // Step 1: Detection
    const detStart = performance.now();
    const rawDetections = await this.detector.detect(frame);
    this.perfStats.detection = performance.now() - detStart;

    // Step 2: NMS
    const detections = nms(rawDetections, 0.5);

    // Notify detection callback
    if (this.onDetection && detections.length > 0) {
      this.onDetection(detections);
    }

    // Step 3: Extract ReID features for each detection
    const reidStart = performance.now();
    const features = await this._extractFeatures(frame, detections);
    this.perfStats.reid = performance.now() - reidStart;

    // Step 4: DeepSORT tracking
    const trackStart = performance.now();
    const trackedObjects = this.tracker.update(detections, features);
    this.perfStats.tracking = performance.now() - trackStart;

    // Step 5: Smoothing
    const smoothStart = performance.now();
    const smoothedTracks = this.smoother.smooth(trackedObjects);
    this.perfStats.smoothing = performance.now() - smoothStart;

    // Step 6: Entry/Exit counting
    if (this.entryLine) {
      this._updateEntryCounts(smoothedTracks);
    }

    // Calculate FPS
    const processTime = performance.now() - startTime;
    this.lastProcessTime = processTime;
    this.fps = this.fps * 0.9 + (1000 / Math.max(processTime, 1)) * 0.1;

    return {
      tracks: smoothedTracks,
      detections,
      features,
      fps: Math.round(this.fps),
      processTime: Math.round(processTime * 100) / 100,
      stats: this.getStats()
    };
  }

  /**
   * Extract ReID features for all detections
   */
  async _extractFeatures(frame, detections) {
    const features = [];

    for (const det of detections) {
      try {
        const feature = await this.reidExtractor.extract(frame, det.bbox);
        features.push(feature);
      } catch (error) {
        console.warn('[PipelineC] Feature extraction failed:', error);
        // Use zero vector as fallback
        features.push(new Float32Array(128));
      }
    }

    return features;
  }

  /**
   * Update entry/exit counts based on track movements
   */
  _updateEntryCounts(tracks) {
    const lineY = this.entryLine.y;

    for (const track of tracks) {
      const trackId = track.id;
      const centerY = (track.bbox[1] + track.bbox[3]) / 2;

      if (!this.trackCrossings.has(trackId)) {
        this.trackCrossings.set(trackId, {
          lastY: centerY,
          crossed: false
        });
        continue;
      }

      const crossing = this.trackCrossings.get(trackId);
      const lastY = crossing.lastY;

      // Check if crossed the line
      if (!crossing.crossed) {
        if (lastY < lineY && centerY >= lineY) {
          this.exitCount++;
          crossing.crossed = true;
          if (this.onTrackExit) {
            this.onTrackExit(track, 'down');
          }
        } else if (lastY > lineY && centerY <= lineY) {
          this.entryCount++;
          crossing.crossed = true;
          if (this.onTrackEnter) {
            this.onTrackEnter(track, 'up');
          }
        }
      }

      crossing.lastY = centerY;
    }

    // Clean up old crossings
    const activeIds = new Set(tracks.map(t => t.id));
    for (const [id] of this.trackCrossings) {
      if (!activeIds.has(id)) {
        this.trackCrossings.delete(id);
      }
    }
  }

  /**
   * Get current pipeline statistics
   */
  getStats() {
    return {
      frameCount: this.frameCount,
      fps: Math.round(this.fps),
      lastProcessTime: Math.round(this.lastProcessTime * 100) / 100,
      performance: {
        detection: Math.round(this.perfStats.detection * 100) / 100,
        reid: Math.round(this.perfStats.reid * 100) / 100,
        tracking: Math.round(this.perfStats.tracking * 100) / 100,
        smoothing: Math.round(this.perfStats.smoothing * 100) / 100
      },
      tracking: this.tracker?.getStats() || {},
      smoothing: this.smoother?.getStats() || {},
      counting: {
        entries: this.entryCount,
        exits: this.exitCount,
        currentOccupancy: this.tracker?.getActiveTracks()?.length || 0
      }
    };
  }

  /**
   * Get all active tracks
   */
  getActiveTracks() {
    return this.tracker?.getActiveTracks() || [];
  }

  /**
   * Get all tracks (including tentative and lost)
   */
  getAllTracks() {
    return this.tracker?.getAllTracks() || { confirmed: [], tentative: [], lost: [] };
  }

  /**
   * Set the entry/exit counting line
   */
  setEntryLine(y) {
    this.entryLine = { y };
    this.trackCrossings.clear();
  }

  /**
   * Reset entry/exit counts
   */
  resetCounts() {
    this.entryCount = 0;
    this.exitCount = 0;
    this.trackCrossings.clear();
  }

  /**
   * Reset all state
   */
  reset() {
    this.tracker?.reset();
    this.smoother?.reset();
    this.resetCounts();
    this.frameCount = 0;
    this.fps = 0;
  }

  /**
   * Update settings at runtime
   */
  updateSettings(settings) {
    if (settings.smoothingAlpha !== undefined) {
      this.smoother?.setAlpha(settings.smoothingAlpha);
    }
    if (settings.confThreshold !== undefined) {
      this.detector?.setConfThreshold(settings.confThreshold);
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.detector?.dispose();
    this.reidExtractor?.dispose();
    this.smoother?.reset();
    this.tracker?.reset();
    this.isInitialized = false;
  }

  /**
   * Check if pipeline is ready
   */
  get ready() {
    return this.isInitialized && this.detector?.ready && this.reidExtractor?.ready;
  }
}

/**
 * Factory function for creating the pipeline
 */
export async function createPipelineC(options = {}) {
  const pipeline = new JanusVisionPipelineC(options);
  await pipeline.initialize();
  return pipeline;
}

export default JanusVisionPipelineC;
