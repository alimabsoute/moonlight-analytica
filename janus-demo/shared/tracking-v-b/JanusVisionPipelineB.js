/**
 * Janus Vision Pipeline B
 * Combines MediaPipe detection, ByteTrack tracking, and bbox smoothing
 * Optimized for high FPS (40+) with good accuracy
 */

import { MediaPipeDetector, createMediaPipeDetector } from './MediaPipeDetector.js';
import ByteTrack from './ByteTrack.js';
import { MultiTrackSmoother } from './BBoxSmoother.js';
import { nms } from '../tracking-common/NMS.js';

/**
 * Main Vision Pipeline for Version B
 * Detection: MediaPipe (EfficientDet)
 * Tracking: ByteTrack (low-conf matching)
 * Smoothing: EMA with adaptive jitter reduction
 */
export class JanusVisionPipelineB {
  constructor(options = {}) {
    // Detection settings
    this.detectionOptions = {
      minConfidence: options.minConfidence ?? 0.35,
      maxResults: options.maxResults ?? 100,
      delegate: options.delegate ?? 'GPU',
      wasmPath: options.wasmPath,
      modelPath: options.modelPath
    };

    // Tracking settings
    this.trackingOptions = {
      highThresh: options.highThresh ?? 0.5,
      lowThresh: options.lowThresh ?? 0.1,
      maxAge: options.maxAge ?? 30,
      minHits: options.minHits ?? 3,
      iouThreshold: options.iouThreshold ?? 0.3
    };

    // Smoothing settings
    this.smoothingOptions = {
      alpha: options.smoothingAlpha ?? 0.7,
      maxAge: options.smootherMaxAge ?? 60
    };

    // NMS settings
    this.nmsThreshold = options.nmsThreshold ?? 0.5;

    // Components (initialized lazily)
    this.detector = null;
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
    this.entryLine = options.entryLine || null; // { y: number } for horizontal line
    this.entryCount = 0;
    this.exitCount = 0;
    this.trackCrossings = new Map();
  }

  /**
   * Initialize all pipeline components
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('[PipelineB] Initializing...');

      // Initialize detector
      this.detector = await createMediaPipeDetector(this.detectionOptions);
      console.log('[PipelineB] Detector ready');

      // Initialize tracker
      this.tracker = new ByteTrack(this.trackingOptions);
      console.log('[PipelineB] Tracker ready');

      // Initialize smoother
      this.smoother = new MultiTrackSmoother(this.smoothingOptions);
      console.log('[PipelineB] Smoother ready');

      this.isInitialized = true;
      console.log('[PipelineB] Initialization complete');
      return true;
    } catch (error) {
      console.error('[PipelineB] Initialization failed:', error);
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
    const rawDetections = await this.detector.detect(frame, timestamp);

    // Step 2: NMS to remove overlapping detections
    const detections = nms(rawDetections, this.nmsThreshold);

    // Notify detection callback
    if (this.onDetection && detections.length > 0) {
      this.onDetection(detections);
    }

    // Step 3: Tracking
    const trackedObjects = this.tracker.update(detections);

    // Step 4: Smoothing
    const smoothedTracks = this.smoother.smooth(trackedObjects);

    // Step 5: Entry/Exit counting (if line configured)
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
      fps: Math.round(this.fps),
      processTime: Math.round(processTime * 100) / 100,
      stats: this.getStats()
    };
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
          // Crossed downward = exit (or entry depending on setup)
          this.exitCount++;
          crossing.crossed = true;
          if (this.onTrackExit) {
            this.onTrackExit(track, 'down');
          }
        } else if (lastY > lineY && centerY <= lineY) {
          // Crossed upward = entry
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
      tracking: this.tracker?.getStats() || {},
      smoothing: this.smoother?.getStats() || {},
      counting: {
        entries: this.entryCount,
        exits: this.exitCount,
        currentOccupancy: this.tracker?.confirmedTracks?.length || 0
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
   * @param {number} y - Y coordinate of the counting line
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
    // Note: Other settings require reinitialization
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.detector?.dispose();
    this.smoother?.reset();
    this.tracker?.reset();
    this.isInitialized = false;
  }

  /**
   * Check if pipeline is ready
   */
  get ready() {
    return this.isInitialized && this.detector?.ready;
  }
}

/**
 * Factory function for creating the pipeline
 */
export async function createPipelineB(options = {}) {
  const pipeline = new JanusVisionPipelineB(options);
  await pipeline.initialize();
  return pipeline;
}

export default JanusVisionPipelineB;
