/**
 * DeepSORT Tracker Implementation
 * Combines motion (Kalman) and appearance (ReID) for robust tracking
 * Paper: https://arxiv.org/abs/1703.07402
 */

import KalmanFilter from '../tracking-common/KalmanFilter.js';
import { hungarianSolve } from '../tracking-common/HungarianAlgorithm.js';
import { cosineDistance } from './ReIDExtractor.js';

/**
 * Single track managed by DeepSORT
 */
class Track {
  static nextId = 1;

  constructor(bbox, feature) {
    this.id = Track.nextId++;
    this.bbox = bbox;

    // Kalman filter for motion prediction
    this.kalman = new KalmanFilter();
    this.kalman.init(bbox);

    // Appearance feature history (for robust matching)
    this.features = [feature];
    this.maxFeatures = 100;  // Keep last N features

    // Track state
    this.state = 'tentative'; // tentative, confirmed, deleted
    this.age = 0;             // Total frames
    this.timeSinceUpdate = 0; // Frames since last matched
    this.hitStreak = 0;       // Consecutive matches

    // Thresholds
    this.nInit = 3;           // Hits to confirm
    this.maxAge = 45;         // Max frames without update (1.5 sec at 30fps)
  }

  predict() {
    this.kalman.predict();
    this.bbox = this.kalman.getState();
    this.age++;
    this.timeSinceUpdate++;

    if (this.state === 'confirmed' && this.timeSinceUpdate > 0) {
      this.hitStreak = 0;
    }
  }

  update(bbox, feature) {
    this.kalman.update(bbox);
    this.bbox = this.kalman.getState();
    this.timeSinceUpdate = 0;
    this.hitStreak++;

    // Add feature to history
    this.features.push(feature);
    if (this.features.length > this.maxFeatures) {
      this.features.shift();
    }

    // State transitions
    if (this.state === 'tentative' && this.hitStreak >= this.nInit) {
      this.state = 'confirmed';
    }
  }

  markMissed() {
    if (this.state === 'tentative') {
      this.state = 'deleted';
    } else if (this.timeSinceUpdate > this.maxAge) {
      this.state = 'deleted';
    }
  }

  /**
   * Get mean feature (average of recent features)
   */
  getMeanFeature() {
    if (this.features.length === 0) return null;

    // Use last 10 features for mean
    const recent = this.features.slice(-10);
    const embeddingSize = recent[0].length;
    const mean = new Float32Array(embeddingSize);

    for (const feat of recent) {
      for (let i = 0; i < embeddingSize; i++) {
        mean[i] += feat[i];
      }
    }

    // Normalize
    const norm = Math.sqrt(mean.reduce((s, v) => s + v * v, 0));
    if (norm > 1e-6) {
      for (let i = 0; i < embeddingSize; i++) {
        mean[i] /= norm;
      }
    }

    return mean;
  }

  /**
   * Minimum cosine distance to track's feature gallery
   */
  minCosineDistance(feature) {
    let minDist = Infinity;

    // Compare against last N features
    const recent = this.features.slice(-30);
    for (const feat of recent) {
      const dist = cosineDistance(feature, feat);
      if (dist < minDist) {
        minDist = dist;
      }
    }

    return minDist;
  }

  getPredictedBbox() {
    return this.kalman.getPrediction();
  }

  isConfirmed() {
    return this.state === 'confirmed';
  }

  isDeleted() {
    return this.state === 'deleted';
  }
}

/**
 * DeepSORT Tracker
 * Two-stage matching using appearance and motion
 */
export class DeepSORTTracker {
  constructor(options = {}) {
    // Matching thresholds
    this.maxCosineDistance = options.maxCosineDistance ?? 0.4;
    this.maxIoUDistance = options.maxIoUDistance ?? 0.7;
    this.lambda = options.lambda ?? 0.5;  // Weight for appearance vs motion

    // Track management
    this.maxAge = options.maxAge ?? 45;
    this.nInit = options.nInit ?? 3;

    // Active tracks
    this.tracks = [];

    // Frame counter
    this.frameCount = 0;

    // Reset ID counter
    Track.nextId = 1;
  }

  /**
   * Update tracker with new detections and features
   * @param {Array} detections - Array of {bbox, score}
   * @param {Array} features - Array of appearance embeddings
   * @returns {Array} Confirmed tracks
   */
  update(detections, features) {
    this.frameCount++;

    // Predict new locations for all tracks
    for (const track of this.tracks) {
      track.predict();
    }

    // Split tracks by state
    const confirmedTracks = this.tracks.filter(t => t.isConfirmed());
    const tentativeTracks = this.tracks.filter(t => t.state === 'tentative');

    // FIRST STAGE: Match confirmed tracks using appearance + motion
    const {
      matches: matches1,
      unmatchedDetections: unmatched1,
      unmatchedTracks: unmatchedConfirmed
    } = this._matchingCascade(confirmedTracks, detections, features);

    // Update matched confirmed tracks
    for (const [detIdx, trackIdx] of matches1) {
      confirmedTracks[trackIdx].update(detections[detIdx].bbox, features[detIdx]);
    }

    // SECOND STAGE: IOU matching for remaining
    const remainingDets = unmatched1.map(i => detections[i]);
    const remainingFeats = unmatched1.map(i => features[i]);
    const remainingTracks = [
      ...unmatchedConfirmed.map(i => confirmedTracks[i]),
      ...tentativeTracks
    ];

    const {
      matches: matches2,
      unmatchedDetections: unmatched2,
      unmatchedTracks: unmatchedTracks2
    } = this._iouMatching(remainingTracks, remainingDets);

    // Update matched tracks
    for (const [detIdx, trackIdx] of matches2) {
      remainingTracks[trackIdx].update(remainingDets[detIdx].bbox, remainingFeats[detIdx]);
    }

    // Mark unmatched tracks
    for (const trackIdx of unmatchedTracks2) {
      remainingTracks[trackIdx].markMissed();
    }

    // Also mark original unmatched confirmed tracks
    for (const trackIdx of unmatchedConfirmed) {
      if (!matches2.some(([_, t]) => remainingTracks.indexOf(confirmedTracks[trackIdx]) === t)) {
        confirmedTracks[trackIdx].markMissed();
      }
    }

    // Create new tracks for unmatched detections
    for (const detIdx of unmatched2) {
      const origDetIdx = unmatched1[detIdx];
      const newTrack = new Track(detections[origDetIdx].bbox, features[origDetIdx]);
      newTrack.maxAge = this.maxAge;
      newTrack.nInit = this.nInit;
      this.tracks.push(newTrack);
    }

    // Remove deleted tracks
    this.tracks = this.tracks.filter(t => !t.isDeleted());

    // Return confirmed tracks
    return this.getActiveTracks();
  }

  /**
   * Matching cascade: prioritize tracks with recent updates
   */
  _matchingCascade(tracks, detections, features) {
    if (tracks.length === 0 || detections.length === 0) {
      return {
        matches: [],
        unmatchedDetections: detections.map((_, i) => i),
        unmatchedTracks: tracks.map((_, i) => i)
      };
    }

    const allMatches = [];
    const unmatchedDetections = new Set(detections.map((_, i) => i));
    const unmatchedTracks = new Set(tracks.map((_, i) => i));

    // Group tracks by time since update (cascade levels)
    const maxCascade = 30;
    for (let level = 0; level <= maxCascade; level++) {
      const levelTracks = [];
      const levelTrackIndices = [];

      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].timeSinceUpdate === level && unmatchedTracks.has(i)) {
          levelTracks.push(tracks[i]);
          levelTrackIndices.push(i);
        }
      }

      if (levelTracks.length === 0) continue;

      // Build cost matrix for this level
      const detsArray = Array.from(unmatchedDetections);
      const costMatrix = this._buildCostMatrix(
        levelTracks,
        detsArray.map(i => detections[i]),
        detsArray.map(i => features[i])
      );

      // Solve assignment
      const matches = hungarianSolve(costMatrix, this.maxCosineDistance);

      for (const [localDetIdx, localTrackIdx] of matches) {
        const detIdx = detsArray[localDetIdx];
        const trackIdx = levelTrackIndices[localTrackIdx];

        allMatches.push([detIdx, trackIdx]);
        unmatchedDetections.delete(detIdx);
        unmatchedTracks.delete(trackIdx);
      }
    }

    return {
      matches: allMatches,
      unmatchedDetections: Array.from(unmatchedDetections),
      unmatchedTracks: Array.from(unmatchedTracks)
    };
  }

  /**
   * Build combined cost matrix (appearance + motion)
   */
  _buildCostMatrix(tracks, detections, features) {
    const costMatrix = [];

    for (let i = 0; i < detections.length; i++) {
      costMatrix[i] = new Float32Array(tracks.length);

      for (let j = 0; j < tracks.length; j++) {
        // Appearance distance
        const appearanceDist = tracks[j].minCosineDistance(features[i]);

        // Motion distance (IoU-based)
        const motionDist = 1 - this._computeIoU(detections[i].bbox, tracks[j].bbox);

        // Gating: reject if appearance distance too high
        if (appearanceDist > this.maxCosineDistance) {
          costMatrix[i][j] = 1e9;
          continue;
        }

        // Combined distance
        costMatrix[i][j] = this.lambda * appearanceDist + (1 - this.lambda) * motionDist;
      }
    }

    return costMatrix;
  }

  /**
   * IOU-only matching for second stage
   */
  _iouMatching(tracks, detections) {
    if (tracks.length === 0 || detections.length === 0) {
      return {
        matches: [],
        unmatchedDetections: detections.map((_, i) => i),
        unmatchedTracks: tracks.map((_, i) => i)
      };
    }

    // Build IOU cost matrix
    const costMatrix = [];
    for (let i = 0; i < detections.length; i++) {
      costMatrix[i] = new Float32Array(tracks.length);
      for (let j = 0; j < tracks.length; j++) {
        const iou = this._computeIoU(detections[i].bbox, tracks[j].bbox);
        costMatrix[i][j] = 1 - iou;
      }
    }

    const matches = hungarianSolve(costMatrix, this.maxIoUDistance);

    const matchedDets = new Set(matches.map(m => m[0]));
    const matchedTracks = new Set(matches.map(m => m[1]));

    return {
      matches,
      unmatchedDetections: detections.map((_, i) => i).filter(i => !matchedDets.has(i)),
      unmatchedTracks: tracks.map((_, i) => i).filter(i => !matchedTracks.has(i))
    };
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

    const union = areaA + areaB - interArea;
    return union > 0 ? interArea / union : 0;
  }

  /**
   * Get all confirmed tracks
   */
  getActiveTracks() {
    return this.tracks
      .filter(t => t.isConfirmed())
      .map(t => ({
        id: t.id,
        bbox: t.bbox,
        age: t.age,
        hitStreak: t.hitStreak,
        timeSinceUpdate: t.timeSinceUpdate
      }));
  }

  /**
   * Get all tracks including tentative
   */
  getAllTracks() {
    return {
      confirmed: this.tracks.filter(t => t.isConfirmed()).map(t => ({
        id: t.id,
        bbox: t.bbox,
        state: 'confirmed'
      })),
      tentative: this.tracks.filter(t => t.state === 'tentative').map(t => ({
        id: t.id,
        bbox: t.bbox,
        state: 'tentative'
      })),
      lost: this.tracks.filter(t => t.timeSinceUpdate > 0 && t.isConfirmed()).map(t => ({
        id: t.id,
        bbox: t.bbox,
        state: 'lost',
        timeLost: t.timeSinceUpdate
      }))
    };
  }

  /**
   * Get tracking statistics
   */
  getStats() {
    return {
      frameCount: this.frameCount,
      totalTracks: this.tracks.length,
      confirmedCount: this.tracks.filter(t => t.isConfirmed()).length,
      tentativeCount: this.tracks.filter(t => t.state === 'tentative').length,
      totalCreated: Track.nextId - 1
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.tracks = [];
    this.frameCount = 0;
    Track.nextId = 1;
  }
}

export default DeepSORTTracker;
