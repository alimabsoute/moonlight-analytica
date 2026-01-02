/**
 * Version B: MediaPipe + ByteTrack Pipeline
 * Optimized for high FPS (40+) with good accuracy
 */

export { ByteTrack, default as ByteTrackDefault } from './ByteTrack.js';
export {
  MediaPipeDetector,
  createMediaPipeDetector
} from './MediaPipeDetector.js';
export {
  BBoxSmoother,
  MultiTrackSmoother,
  AdaptiveSmoother
} from './BBoxSmoother.js';
export {
  JanusVisionPipelineB,
  createPipelineB,
  default as PipelineB
} from './JanusVisionPipelineB.js';
