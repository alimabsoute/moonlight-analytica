/**
 * ByteTrack Implementation
 * Key innovation: Uses LOW-confidence detections to prevent track loss during occlusion
 * Paper: https://arxiv.org/abs/2110.06864
 */

import KalmanFilter from '../tracking-common/KalmanFilter.js';
import { linearAssignment, computeIoU } from '../tracking-common/HungarianAlgorithm.js';

/**
 * Single track object managed by ByteTrack
 */
class STrack {
  static nextId = 1;

  constructor(bbox, score) {
    this.id = STrack.nextId++;
    this.bbox = bbox;
    this.score = score;
    this.kalman = new KalmanFilter();
    this.kalman.init(bbox);

    this.state = 'tentative'; // tentative, confirmed, lost
    this.age = 0;            // Frames since creation
    this.timeSinceUpdate = 0; // Frames since last detection match
    this.hitStreak = 0;       // Consecutive detection matches

    this.history = [{ bbox, score, frame: 0 }];
  }

  predict() {
    this.kalman.predict();
    this.age++;
    this.timeSinceUpdate++;
    this.bbox = this.kalman.getState();
  }

  update(bbox, score) {
    this.kalman.update(bbox);
    this.bbox = this.kalman.getState();
    this.score = score;
    this.timeSinceUpdate = 0;
    this.hitStreak++;

    // Promote to confirmed after 3 consecutive matches
    if (this.state === 'tentative' && this.hitStreak >= 3) {
      this.state = 'confirmed';
    }

    this.history.push({ bbox, score, frame: this.age });
    if (this.history.length > 30) this.history.shift();
  }

  markLost() {
    this.state = 'lost';
    this.hitStreak = 0;
  }

  getPredictedBbox() {
    return this.kalman.getPrediction();
  }
}

/**
 * ByteTrack Tracker
 * Two-stage matching: high-conf first, then low-conf for remaining tracks
 */
export class ByteTrack {
  constructor(options = {}) {
    // Confidence thresholds
    this.highThresh = options.highThresh ?? 0.5;   // High confidence threshold
    this.lowThresh = options.lowThresh ?? 0.1;     // Low confidence threshold

    // Track management
    this.maxAge = options.maxAge ?? 30;            // Max frames without update (1 sec at 30fps)
    this.minHits = options.minHits ?? 3;           // Min hits to confirm track
    this.iouThreshold = options.iouThreshold ?? 0.3; // IoU threshold for matching

    // Active tracks
    this.confirmedTracks = [];
    this.tentativeTracks = [];
    this.lostTracks = [];

    // Frame counter
    this.frameCount = 0;

    // Reset ID counter
    STrack.nextId = 1;
  }

  /**
   * Process detections for a single frame
   * @param {Array} detections - Array of {bbox: [x1,y1,x2,y2], score: 0.85}
   * @returns {Array} Active tracks with IDs
   */
  update(detections) {
    this.frameCount++;

    // Separate high and low confidence detections
    const highDets = detections.filter(d => d.score >= this.highThresh);
    const lowDets = detections.filter(d => d.score >= this.lowThresh && d.score < this.highThresh);

    // Predict new locations for all active tracks
    const activeTracks = [...this.confirmedTracks, ...this.tentativeTracks];
    for (const track of activeTracks) {
      track.predict();
    }

    // FIRST ASSOCIATION: Match high-confidence detections to confirmed tracks
    const confirmedBboxes = this.confirmedTracks.map(t => t.bbox);
    const highDetBboxes = highDets.map(d => d.bbox);

    const { matches: matches1, unmatchedDetections: unmatchedHighDets, unmatchedTracks: unmatchedConfirmed } =
      linearAssignment(highDetBboxes, confirmedBboxes, this.iouThreshold);

    // Update matched confirmed tracks
    for (const [detIdx, trackIdx] of matches1) {
      this.confirmedTracks[trackIdx].update(highDets[detIdx].bbox, highDets[detIdx].score);
    }

    // SECOND ASSOCIATION: Match LOW-confidence detections to unmatched confirmed tracks
    // This is the key ByteTrack innovation - uses low-conf detections to prevent track loss
    const remainingConfirmed = unmatchedConfirmed.map(i => this.confirmedTracks[i]);
    const remainingConfirmedBboxes = remainingConfirmed.map(t => t.bbox);
    const lowDetBboxes = lowDets.map(d => d.bbox);

    const { matches: matches2, unmatchedTracks: stillUnmatchedConfirmed } =
      linearAssignment(lowDetBboxes, remainingConfirmedBboxes, this.iouThreshold);

    // Update with low-confidence matches
    for (const [detIdx, trackIdx] of matches2) {
      remainingConfirmed[trackIdx].update(lowDets[detIdx].bbox, lowDets[detIdx].score);
    }

    // Mark still-unmatched confirmed tracks as lost
    for (const idx of stillUnmatchedConfirmed) {
      remainingConfirmed[idx].markLost();
      this.lostTracks.push(remainingConfirmed[idx]);
    }

    // THIRD ASSOCIATION: Match remaining high-conf detections to tentative tracks
    const remainingHighDets = unmatchedHighDets.map(i => highDets[i]);
    const remainingHighBboxes = remainingHighDets.map(d => d.bbox);
    const tentativeBboxes = this.tentativeTracks.map(t => t.bbox);

    const { matches: matches3, unmatchedDetections: newDetections, unmatchedTracks: unmatchedTentative } =
      linearAssignment(remainingHighBboxes, tentativeBboxes, this.iouThreshold);

    // Update matched tentative tracks
    for (const [detIdx, trackIdx] of matches3) {
      this.tentativeTracks[trackIdx].update(remainingHighDets[detIdx].bbox, remainingHighDets[detIdx].score);
    }

    // Remove unmatched tentative tracks (they haven't confirmed yet)
    const newTentative = [];
    for (let i = 0; i < this.tentativeTracks.length; i++) {
      if (!unmatchedTentative.includes(i)) {
        // Matched - check if promoted to confirmed
        if (this.tentativeTracks[i].state === 'confirmed') {
          this.confirmedTracks.push(this.tentativeTracks[i]);
        } else {
          newTentative.push(this.tentativeTracks[i]);
        }
      }
      // Unmatched tentative tracks are simply dropped
    }
    this.tentativeTracks = newTentative;

    // Create new tentative tracks for unmatched high-conf detections
    for (const detIdx of newDetections) {
      const det = remainingHighDets[detIdx];
      const newTrack = new STrack(det.bbox, det.score);
      this.tentativeTracks.push(newTrack);
    }

    // TRY TO REACTIVATE: Match new detections to lost tracks
    const lostBboxes = this.lostTracks.map(t => t.getPredictedBbox());
    const newDetBboxes = newDetections.map(i => remainingHighDets[i].bbox);

    if (this.lostTracks.length > 0 && newDetBboxes.length > 0) {
      const { matches: matches4 } = linearAssignment(newDetBboxes, lostBboxes, this.iouThreshold * 0.8);

      for (const [detIdx, lostIdx] of matches4) {
        const reactivated = this.lostTracks[lostIdx];
        reactivated.update(remainingHighDets[newDetections[detIdx]].bbox, remainingHighDets[newDetections[detIdx]].score);
        reactivated.state = 'confirmed';
        this.confirmedTracks.push(reactivated);
        this.lostTracks.splice(lostIdx, 1);
      }
    }

    // Remove confirmed tracks that became lost
    this.confirmedTracks = this.confirmedTracks.filter(t => t.state !== 'lost');

    // Age out old lost tracks
    this.lostTracks = this.lostTracks.filter(t => t.timeSinceUpdate < this.maxAge);

    // Return all confirmed tracks
    return this.getActiveTracks();
  }

  /**
   * Get all active (confirmed) tracks
   * @returns {Array} Tracks with {id, bbox, score, age}
   */
  getActiveTracks() {
    return this.confirmedTracks.map(track => ({
      id: track.id,
      bbox: track.bbox,
      score: track.score,
      age: track.age,
      hitStreak: track.hitStreak
    }));
  }

  /**
   * Get all tracks including tentative and lost
   * @returns {Object} { confirmed, tentative, lost }
   */
  getAllTracks() {
    return {
      confirmed: this.confirmedTracks.map(t => ({ id: t.id, bbox: t.bbox, state: 'confirmed' })),
      tentative: this.tentativeTracks.map(t => ({ id: t.id, bbox: t.bbox, state: 'tentative' })),
      lost: this.lostTracks.map(t => ({ id: t.id, bbox: t.bbox, state: 'lost', timeLost: t.timeSinceUpdate }))
    };
  }

  /**
   * Reset all tracks
   */
  reset() {
    this.confirmedTracks = [];
    this.tentativeTracks = [];
    this.lostTracks = [];
    this.frameCount = 0;
    STrack.nextId = 1;
  }

  /**
   * Get tracking statistics
   */
  getStats() {
    return {
      frameCount: this.frameCount,
      confirmedCount: this.confirmedTracks.length,
      tentativeCount: this.tentativeTracks.length,
      lostCount: this.lostTracks.length,
      totalTracksCreated: STrack.nextId - 1
    };
  }
}

export default ByteTrack;
