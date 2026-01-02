/**
 * Version C: YOLOv8 + DeepSORT + ReID Pipeline
 * Optimized for maximum accuracy with appearance-based tracking
 */

export {
  YOLOv8Detector,
  createYOLOv8Detector
} from './YOLOv8Detector.js';
export {
  ReIDExtractor,
  createReIDExtractor,
  cosineDistance,
  cosineSimilarity
} from './ReIDExtractor.js';
export { DeepSORTTracker, default as DeepSORTTrackerDefault } from './DeepSORTTracker.js';
export {
  JanusVisionPipelineC,
  createPipelineC,
  default as PipelineC
} from './JanusVisionPipelineC.js';
