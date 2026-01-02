/**
 * Bounding Box Smoother
 * Uses Exponential Moving Average (EMA) to reduce jitter in bounding boxes
 * Essential for smooth visual tracking without flickering
 */

/**
 * Single-track bounding box smoother using EMA
 */
export class BBoxSmoother {
  constructor(alpha = 0.7) {
    // Alpha: weight for new measurements (higher = more responsive, lower = smoother)
    this.alpha = alpha;
    this.lastBbox = null;
    this.lastVelocity = null;
  }

  /**
   * Smooth a bounding box
   * @param {number[]} bbox - [x1, y1, x2, y2]
   * @returns {number[]} Smoothed bounding box
   */
  smooth(bbox) {
    if (!bbox || bbox.length !== 4) return bbox;

    if (!this.lastBbox) {
      this.lastBbox = [...bbox];
      this.lastVelocity = [0, 0, 0, 0];
      return bbox;
    }

    // Calculate velocity (change in position)
    const velocity = bbox.map((v, i) => v - this.lastBbox[i]);

    // Smooth velocity
    const smoothedVelocity = velocity.map((v, i) =>
      this.alpha * v + (1 - this.alpha) * this.lastVelocity[i]
    );

    // Apply EMA to position
    const smoothed = bbox.map((v, i) =>
      this.alpha * v + (1 - this.alpha) * this.lastBbox[i]
    );

    this.lastBbox = smoothed;
    this.lastVelocity = smoothedVelocity;

    return smoothed;
  }

  /**
   * Reset the smoother state
   */
  reset() {
    this.lastBbox = null;
    this.lastVelocity = null;
  }

  /**
   * Get predicted next position based on velocity
   */
  predict() {
    if (!this.lastBbox || !this.lastVelocity) return null;

    return this.lastBbox.map((v, i) => v + this.lastVelocity[i]);
  }
}

/**
 * Multi-track bounding box smoother
 * Maintains separate smoothers for each track ID
 */
export class MultiTrackSmoother {
  constructor(options = {}) {
    this.alpha = options.alpha ?? 0.7;
    this.smoothers = new Map();
    this.maxAge = options.maxAge ?? 60; // Remove inactive smoothers after N frames
    this.frameCount = 0;
    this.lastSeen = new Map();
  }

  /**
   * Smooth multiple tracks
   * @param {Array} tracks - Array of {id, bbox, ...}
   * @returns {Array} Tracks with smoothed bboxes
   */
  smooth(tracks) {
    this.frameCount++;

    const smoothedTracks = tracks.map(track => {
      const { id, bbox, ...rest } = track;

      // Get or create smoother for this track
      if (!this.smoothers.has(id)) {
        this.smoothers.set(id, new BBoxSmoother(this.alpha));
      }

      const smoother = this.smoothers.get(id);
      const smoothedBbox = smoother.smooth(bbox);

      // Update last seen
      this.lastSeen.set(id, this.frameCount);

      return {
        id,
        bbox: smoothedBbox,
        rawBbox: bbox,
        ...rest
      };
    });

    // Clean up old smoothers
    this._cleanup();

    return smoothedTracks;
  }

  /**
   * Remove smoothers for tracks not seen recently
   */
  _cleanup() {
    for (const [id, lastFrame] of this.lastSeen.entries()) {
      if (this.frameCount - lastFrame > this.maxAge) {
        this.smoothers.delete(id);
        this.lastSeen.delete(id);
      }
    }
  }

  /**
   * Get predicted positions for all active tracks
   */
  getPredictions() {
    const predictions = [];
    for (const [id, smoother] of this.smoothers.entries()) {
      const pred = smoother.predict();
      if (pred) {
        predictions.push({ id, bbox: pred });
      }
    }
    return predictions;
  }

  /**
   * Reset all smoothers
   */
  reset() {
    this.smoothers.clear();
    this.lastSeen.clear();
    this.frameCount = 0;
  }

  /**
   * Set smoothing factor
   */
  setAlpha(alpha) {
    this.alpha = alpha;
    // Update existing smoothers
    for (const smoother of this.smoothers.values()) {
      smoother.alpha = alpha;
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      activeSmootherCount: this.smoothers.size,
      frameCount: this.frameCount
    };
  }
}

/**
 * Advanced smoother with jitter detection
 * Applies stronger smoothing when jitter is detected
 */
export class AdaptiveSmoother extends BBoxSmoother {
  constructor(options = {}) {
    super(options.baseAlpha ?? 0.7);

    this.baseAlpha = options.baseAlpha ?? 0.7;
    this.smoothAlpha = options.smoothAlpha ?? 0.3; // Stronger smoothing for jitter
    this.jitterThreshold = options.jitterThreshold ?? 5; // Pixels
    this.history = [];
    this.historyLength = options.historyLength ?? 5;
  }

  smooth(bbox) {
    if (!bbox || bbox.length !== 4) return bbox;

    // Calculate jitter score
    const jitter = this._calculateJitter(bbox);

    // Adaptive alpha based on jitter
    if (jitter > this.jitterThreshold) {
      this.alpha = this.smoothAlpha; // Apply stronger smoothing
    } else {
      // Gradually return to base alpha
      this.alpha = this.alpha * 0.9 + this.baseAlpha * 0.1;
    }

    // Add to history
    this.history.push(bbox);
    if (this.history.length > this.historyLength) {
      this.history.shift();
    }

    return super.smooth(bbox);
  }

  _calculateJitter(bbox) {
    if (this.history.length < 2) return 0;

    // Calculate variance in recent positions
    const recent = this.history.slice(-3);
    let totalVariance = 0;

    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      const change = Math.sqrt(
        Math.pow(curr[0] - prev[0], 2) +
        Math.pow(curr[1] - prev[1], 2)
      );
      totalVariance += change;
    }

    return totalVariance / (recent.length - 1);
  }

  reset() {
    super.reset();
    this.history = [];
    this.alpha = this.baseAlpha;
  }
}

export default { BBoxSmoother, MultiTrackSmoother, AdaptiveSmoother };
