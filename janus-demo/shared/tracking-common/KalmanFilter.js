/**
 * Kalman Filter for 2D bounding box tracking
 * State vector: [x, y, w, h, vx, vy] - position, size, and velocity
 */
export class KalmanFilter {
  constructor() {
    // State: [x_center, y_center, width, height, velocity_x, velocity_y]
    this.state = new Float32Array(6);

    // State transition matrix (constant velocity model)
    // x' = x + vx, y' = y + vy, w' = w, h' = h, vx' = vx, vy' = vy
    this.F = [
      [1, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0, 1],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1]
    ];

    // Measurement matrix (we observe x, y, w, h)
    this.H = [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0]
    ];

    // Covariance matrix (uncertainty in state)
    this.P = this._eye(6, 10.0);

    // Process noise covariance
    this.Q = this._eye(6, 0.1);

    // Measurement noise covariance
    this.R = this._eye(4, 1.0);

    this.initialized = false;
  }

  /**
   * Initialize the filter with a bounding box
   * @param {Array} bbox - [x1, y1, x2, y2] format
   */
  init(bbox) {
    const [x1, y1, x2, y2] = bbox;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const w = x2 - x1;
    const h = y2 - y1;

    this.state = new Float32Array([cx, cy, w, h, 0, 0]);
    this.P = this._eye(6, 10.0);
    this.initialized = true;
  }

  /**
   * Predict the next state (motion model)
   */
  predict() {
    if (!this.initialized) return;

    // x = F * x
    const newState = new Float32Array(6);
    for (let i = 0; i < 6; i++) {
      newState[i] = 0;
      for (let j = 0; j < 6; j++) {
        newState[i] += this.F[i][j] * this.state[j];
      }
    }
    this.state = newState;

    // P = F * P * F^T + Q
    const FP = this._matMul(this.F, this.P, 6, 6, 6);
    const FT = this._transpose(this.F, 6, 6);
    const FPFT = this._matMul(FP, FT, 6, 6, 6);
    this.P = this._matAdd(FPFT, this.Q, 6, 6);
  }

  /**
   * Update the state with a new measurement
   * @param {Array} bbox - [x1, y1, x2, y2] format
   */
  update(bbox) {
    if (!this.initialized) {
      this.init(bbox);
      return;
    }

    const [x1, y1, x2, y2] = bbox;
    const measurement = [
      (x1 + x2) / 2,
      (y1 + y2) / 2,
      x2 - x1,
      y2 - y1
    ];

    // y = z - H * x (innovation)
    const Hx = new Float32Array(4);
    for (let i = 0; i < 4; i++) {
      Hx[i] = 0;
      for (let j = 0; j < 6; j++) {
        Hx[i] += this.H[i][j] * this.state[j];
      }
    }
    const y = measurement.map((z, i) => z - Hx[i]);

    // S = H * P * H^T + R (innovation covariance)
    const HP = this._matMul(this.H, this.P, 4, 6, 6);
    const HT = this._transpose(this.H, 4, 6);
    const HPHT = this._matMul(HP, HT, 4, 6, 4);
    const S = this._matAdd(HPHT, this.R, 4, 4);

    // K = P * H^T * S^-1 (Kalman gain)
    const PHT = this._matMul(this.P, HT, 6, 6, 4);
    const SInv = this._invert4x4(S);
    const K = this._matMul(PHT, SInv, 6, 4, 4);

    // x = x + K * y
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 4; j++) {
        this.state[i] += K[i][j] * y[j];
      }
    }

    // P = (I - K * H) * P
    const KH = this._matMul(K, this.H, 6, 4, 6);
    const I = this._eye(6, 1.0);
    const IKH = this._matSub(I, KH, 6, 6);
    this.P = this._matMul(IKH, this.P, 6, 6, 6);
  }

  /**
   * Get the current state as a bounding box
   * @returns {Array} [x1, y1, x2, y2]
   */
  getState() {
    const [cx, cy, w, h] = this.state;
    return [
      cx - w / 2,
      cy - h / 2,
      cx + w / 2,
      cy + h / 2
    ];
  }

  /**
   * Get predicted bounding box (without updating state)
   * @returns {Array} [x1, y1, x2, y2]
   */
  getPrediction() {
    const cx = this.state[0] + this.state[4];
    const cy = this.state[1] + this.state[5];
    const w = this.state[2];
    const h = this.state[3];
    return [
      cx - w / 2,
      cy - h / 2,
      cx + w / 2,
      cy + h / 2
    ];
  }

  // Matrix utility functions
  _eye(n, scale = 1.0) {
    const m = [];
    for (let i = 0; i < n; i++) {
      m[i] = new Float32Array(n);
      m[i][i] = scale;
    }
    return m;
  }

  _matMul(A, B, m, n, p) {
    const C = [];
    for (let i = 0; i < m; i++) {
      C[i] = new Float32Array(p);
      for (let j = 0; j < p; j++) {
        C[i][j] = 0;
        for (let k = 0; k < n; k++) {
          C[i][j] += (A[i]?.[k] || 0) * (B[k]?.[j] || 0);
        }
      }
    }
    return C;
  }

  _transpose(A, m, n) {
    const AT = [];
    for (let i = 0; i < n; i++) {
      AT[i] = new Float32Array(m);
      for (let j = 0; j < m; j++) {
        AT[i][j] = A[j]?.[i] || 0;
      }
    }
    return AT;
  }

  _matAdd(A, B, m, n) {
    const C = [];
    for (let i = 0; i < m; i++) {
      C[i] = new Float32Array(n);
      for (let j = 0; j < n; j++) {
        C[i][j] = (A[i]?.[j] || 0) + (B[i]?.[j] || 0);
      }
    }
    return C;
  }

  _matSub(A, B, m, n) {
    const C = [];
    for (let i = 0; i < m; i++) {
      C[i] = new Float32Array(n);
      for (let j = 0; j < n; j++) {
        C[i][j] = (A[i]?.[j] || 0) - (B[i]?.[j] || 0);
      }
    }
    return C;
  }

  _invert4x4(M) {
    // Simple 4x4 matrix inversion using Gauss-Jordan elimination
    const A = M.map(row => [...row]);
    const I = this._eye(4, 1.0);

    for (let i = 0; i < 4; i++) {
      // Find pivot
      let maxEl = Math.abs(A[i][i]);
      let maxRow = i;
      for (let k = i + 1; k < 4; k++) {
        if (Math.abs(A[k][i]) > maxEl) {
          maxEl = Math.abs(A[k][i]);
          maxRow = k;
        }
      }

      // Swap rows
      [A[i], A[maxRow]] = [A[maxRow], A[i]];
      [I[i], I[maxRow]] = [I[maxRow], I[i]];

      // Scale pivot row
      const pivot = A[i][i];
      if (Math.abs(pivot) < 1e-10) {
        // Matrix is singular, return identity
        return this._eye(4, 1.0);
      }

      for (let j = 0; j < 4; j++) {
        A[i][j] /= pivot;
        I[i][j] /= pivot;
      }

      // Eliminate column
      for (let k = 0; k < 4; k++) {
        if (k !== i) {
          const factor = A[k][i];
          for (let j = 0; j < 4; j++) {
            A[k][j] -= factor * A[i][j];
            I[k][j] -= factor * I[i][j];
          }
        }
      }
    }

    return I;
  }
}

export default KalmanFilter;
