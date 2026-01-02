/**
 * Non-Maximum Suppression (NMS)
 * Filters overlapping detections, keeping only the highest confidence ones
 */

import { computeIoU } from './HungarianAlgorithm.js';

/**
 * Apply Non-Maximum Suppression to filter overlapping detections
 * @param {Array} detections - Array of detections with bbox and confidence
 * @param {number} iouThreshold - IoU threshold for considering boxes as overlapping (default 0.5)
 * @returns {Array} Filtered detections
 */
export function nms(detections, iouThreshold = 0.5) {
  if (!detections || detections.length === 0) return [];

  // Sort by confidence (descending)
  const sorted = [...detections].sort((a, b) => {
    const confA = a.confidence ?? a.conf ?? a.score ?? 0;
    const confB = b.confidence ?? b.conf ?? b.score ?? 0;
    return confB - confA;
  });

  const keep = [];

  for (const detection of sorted) {
    const bbox = detection.bbox || detection.boundingBox || detection;

    // Check if this detection overlaps too much with any kept detection
    let shouldKeep = true;

    for (const kept of keep) {
      const keptBbox = kept.bbox || kept.boundingBox || kept;
      const iou = computeIoU(bbox, keptBbox);

      if (iou >= iouThreshold) {
        shouldKeep = false;
        break;
      }
    }

    if (shouldKeep) {
      keep.push(detection);
    }
  }

  return keep;
}

/**
 * Soft-NMS: Instead of removing overlapping boxes, reduce their confidence
 * This is gentler and can help preserve partially occluded detections
 * @param {Array} detections - Array of detections with bbox and confidence
 * @param {number} sigma - Gaussian penalty parameter (default 0.5)
 * @param {number} scoreThreshold - Minimum score to keep (default 0.3)
 * @returns {Array} Detections with adjusted confidences
 */
export function softNms(detections, sigma = 0.5, scoreThreshold = 0.3) {
  if (!detections || detections.length === 0) return [];

  // Clone detections to avoid mutating originals
  const dets = detections.map(d => ({
    ...d,
    score: d.confidence ?? d.conf ?? d.score ?? 0
  }));

  // Sort by score descending
  dets.sort((a, b) => b.score - a.score);

  const keep = [];

  while (dets.length > 0) {
    // Pick the detection with highest score
    const best = dets.shift();
    keep.push(best);

    const bestBbox = best.bbox || best.boundingBox || best;

    // Update scores of remaining detections
    for (const det of dets) {
      const detBbox = det.bbox || det.boundingBox || det;
      const iou = computeIoU(bestBbox, detBbox);

      // Gaussian decay
      const penalty = Math.exp(-(iou * iou) / sigma);
      det.score *= penalty;
    }

    // Filter out low-score detections and re-sort
    const remaining = dets.filter(d => d.score >= scoreThreshold);
    dets.length = 0;
    dets.push(...remaining.sort((a, b) => b.score - a.score));
  }

  return keep;
}

/**
 * Class-aware NMS: Apply NMS separately for each class
 * @param {Array} detections - Array of detections with bbox, confidence, and classId
 * @param {number} iouThreshold - IoU threshold (default 0.5)
 * @returns {Array} Filtered detections
 */
export function classNms(detections, iouThreshold = 0.5) {
  if (!detections || detections.length === 0) return [];

  // Group by class
  const byClass = new Map();
  for (const det of detections) {
    const classId = det.classId ?? det.class ?? 0;
    if (!byClass.has(classId)) {
      byClass.set(classId, []);
    }
    byClass.get(classId).push(det);
  }

  // Apply NMS to each class separately
  const keep = [];
  for (const [, classDets] of byClass) {
    keep.push(...nms(classDets, iouThreshold));
  }

  // Sort by confidence for consistent output
  keep.sort((a, b) => {
    const confA = a.confidence ?? a.conf ?? a.score ?? 0;
    const confB = b.confidence ?? b.conf ?? b.score ?? 0;
    return confB - confA;
  });

  return keep;
}

/**
 * Batched NMS for processing multiple frames efficiently
 * @param {Array<Array>} batchDetections - Array of detection arrays (one per frame)
 * @param {number} iouThreshold - IoU threshold
 * @returns {Array<Array>} Filtered detections for each frame
 */
export function batchNms(batchDetections, iouThreshold = 0.5) {
  return batchDetections.map(dets => nms(dets, iouThreshold));
}

export default { nms, softNms, classNms, batchNms };
