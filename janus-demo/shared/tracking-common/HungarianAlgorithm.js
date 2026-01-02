/**
 * Hungarian Algorithm (Munkres) for optimal assignment
 * Used to match detections to existing tracks
 */

/**
 * Solve the assignment problem using the Hungarian algorithm
 * @param {number[][]} costMatrix - NxM matrix where costMatrix[i][j] is cost of assigning i to j
 * @param {number} threshold - Maximum cost threshold for valid assignments
 * @returns {Array<[number, number]>} Array of [row, col] assignment pairs
 */
export function hungarianSolve(costMatrix, threshold = 0.5) {
  if (!costMatrix || costMatrix.length === 0) return [];

  const n = costMatrix.length;
  const m = costMatrix[0]?.length || 0;
  if (m === 0) return [];

  // Make the matrix square by padding with large values
  const size = Math.max(n, m);
  const LARGE = 1e9;

  const matrix = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = new Float32Array(size);
    for (let j = 0; j < size; j++) {
      if (i < n && j < m) {
        matrix[i][j] = costMatrix[i][j];
      } else {
        matrix[i][j] = LARGE;
      }
    }
  }

  // Step 1: Subtract row minimum from each row
  for (let i = 0; i < size; i++) {
    let minVal = Infinity;
    for (let j = 0; j < size; j++) {
      if (matrix[i][j] < minVal) minVal = matrix[i][j];
    }
    if (minVal < Infinity) {
      for (let j = 0; j < size; j++) {
        matrix[i][j] -= minVal;
      }
    }
  }

  // Step 2: Subtract column minimum from each column
  for (let j = 0; j < size; j++) {
    let minVal = Infinity;
    for (let i = 0; i < size; i++) {
      if (matrix[i][j] < minVal) minVal = matrix[i][j];
    }
    if (minVal < Infinity) {
      for (let i = 0; i < size; i++) {
        matrix[i][j] -= minVal;
      }
    }
  }

  // Tracking arrays
  const rowCover = new Uint8Array(size);
  const colCover = new Uint8Array(size);
  const starred = [];
  const primed = [];

  for (let i = 0; i < size; i++) {
    starred[i] = new Uint8Array(size);
    primed[i] = new Uint8Array(size);
  }

  // Step 3: Star zeros
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (matrix[i][j] === 0 && !rowCover[i] && !colCover[j]) {
        starred[i][j] = 1;
        rowCover[i] = 1;
        colCover[j] = 1;
      }
    }
  }
  rowCover.fill(0);
  colCover.fill(0);

  // Main loop
  let step = 1;
  let maxIterations = size * size * 10;
  let iteration = 0;

  while (iteration++ < maxIterations) {
    // Cover columns containing starred zeros
    let coveredCols = 0;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (starred[i][j]) {
          colCover[j] = 1;
          coveredCols++;
          break;
        }
      }
    }

    // Check if we're done
    if (coveredCols >= size) break;

    // Find uncovered zero and prime it
    let found = false;
    let primeRow = -1, primeCol = -1;

    outer: for (let i = 0; i < size; i++) {
      if (rowCover[i]) continue;
      for (let j = 0; j < size; j++) {
        if (colCover[j]) continue;
        if (matrix[i][j] === 0) {
          primed[i][j] = 1;
          primeRow = i;
          primeCol = j;
          found = true;
          break outer;
        }
      }
    }

    if (found) {
      // Check for starred zero in the primed row
      let starCol = -1;
      for (let j = 0; j < size; j++) {
        if (starred[primeRow][j]) {
          starCol = j;
          break;
        }
      }

      if (starCol >= 0) {
        // Cover the row and uncover the star's column
        rowCover[primeRow] = 1;
        colCover[starCol] = 0;
      } else {
        // Augmenting path starting at primed zero
        const path = [[primeRow, primeCol]];
        let pathRow = primeRow;
        let pathCol = primeCol;

        while (true) {
          // Find starred zero in column
          let starRow = -1;
          for (let i = 0; i < size; i++) {
            if (starred[i][pathCol]) {
              starRow = i;
              break;
            }
          }
          if (starRow < 0) break;

          path.push([starRow, pathCol]);
          pathRow = starRow;

          // Find primed zero in row
          let prCol = -1;
          for (let j = 0; j < size; j++) {
            if (primed[pathRow][j]) {
              prCol = j;
              break;
            }
          }
          if (prCol < 0) break;

          path.push([pathRow, prCol]);
          pathCol = prCol;
        }

        // Augment path
        for (const [r, c] of path) {
          if (starred[r][c]) {
            starred[r][c] = 0;
          } else {
            starred[r][c] = 1;
          }
        }

        // Clear covers and primes
        rowCover.fill(0);
        colCover.fill(0);
        for (let i = 0; i < size; i++) {
          primed[i].fill(0);
        }
      }
    } else {
      // Find minimum uncovered value
      let minVal = Infinity;
      for (let i = 0; i < size; i++) {
        if (rowCover[i]) continue;
        for (let j = 0; j < size; j++) {
          if (colCover[j]) continue;
          if (matrix[i][j] < minVal) minVal = matrix[i][j];
        }
      }

      // Add to covered rows, subtract from uncovered columns
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (rowCover[i]) matrix[i][j] += minVal;
          if (!colCover[j]) matrix[i][j] -= minVal;
        }
      }
    }
  }

  // Extract assignments
  const assignments = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (starred[i][j] && costMatrix[i][j] <= threshold) {
        assignments.push([i, j]);
      }
    }
  }

  return assignments;
}

/**
 * Compute IoU (Intersection over Union) between two bounding boxes
 * @param {number[]} box1 - [x1, y1, x2, y2]
 * @param {number[]} box2 - [x1, y1, x2, y2]
 * @returns {number} IoU value between 0 and 1
 */
export function computeIoU(box1, box2) {
  const [x1a, y1a, x2a, y2a] = box1;
  const [x1b, y1b, x2b, y2b] = box2;

  const xA = Math.max(x1a, x1b);
  const yA = Math.max(y1a, y1b);
  const xB = Math.min(x2a, x2b);
  const yB = Math.min(y2a, y2b);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  const areaA = (x2a - x1a) * (y2a - y1a);
  const areaB = (x2b - x1b) * (y2b - y1b);

  const unionArea = areaA + areaB - interArea;
  if (unionArea <= 0) return 0;

  return interArea / unionArea;
}

/**
 * Compute IoU cost matrix between detections and tracks
 * @param {Array} detections - Array of detection bboxes [x1, y1, x2, y2]
 * @param {Array} tracks - Array of track bboxes [x1, y1, x2, y2]
 * @returns {number[][]} Cost matrix (1 - IoU)
 */
export function computeIoUCostMatrix(detections, tracks) {
  const costMatrix = [];
  for (let i = 0; i < detections.length; i++) {
    costMatrix[i] = new Float32Array(tracks.length);
    for (let j = 0; j < tracks.length; j++) {
      const iou = computeIoU(detections[i], tracks[j]);
      costMatrix[i][j] = 1 - iou; // Convert to cost (lower is better)
    }
  }
  return costMatrix;
}

/**
 * Linear assignment with IoU matching
 * @param {Array} detections - Detection bboxes
 * @param {Array} tracks - Track bboxes
 * @param {number} iouThreshold - Minimum IoU for valid match
 * @returns {Object} { matches, unmatchedDetections, unmatchedTracks }
 */
export function linearAssignment(detections, tracks, iouThreshold = 0.3) {
  if (detections.length === 0 || tracks.length === 0) {
    return {
      matches: [],
      unmatchedDetections: detections.map((_, i) => i),
      unmatchedTracks: tracks.map((_, i) => i)
    };
  }

  const costMatrix = computeIoUCostMatrix(detections, tracks);
  const costThreshold = 1 - iouThreshold;

  const matches = hungarianSolve(costMatrix, costThreshold);

  const matchedDetections = new Set(matches.map(m => m[0]));
  const matchedTracks = new Set(matches.map(m => m[1]));

  const unmatchedDetections = [];
  const unmatchedTracks = [];

  for (let i = 0; i < detections.length; i++) {
    if (!matchedDetections.has(i)) unmatchedDetections.push(i);
  }
  for (let i = 0; i < tracks.length; i++) {
    if (!matchedTracks.has(i)) unmatchedTracks.push(i);
  }

  return { matches, unmatchedDetections, unmatchedTracks };
}

export default { hungarianSolve, computeIoU, computeIoUCostMatrix, linearAssignment };
