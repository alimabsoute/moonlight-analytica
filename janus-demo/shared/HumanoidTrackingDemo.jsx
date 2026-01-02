/**
 * Humanoid Tracking Demo Component
 * Real-time simulation of people moving through zones with tracking visualization
 *
 * Features:
 * - Animated humanoid figures (stick figures with smooth movement)
 * - Zone detection and dwell time tracking
 * - Real-time metrics capture
 * - Visual bounding boxes around detected people
 * - Path trails showing movement history
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 500,
  MIN_PEOPLE: 5,
  MAX_PEOPLE: 25,
  SPAWN_RATE: 0.02,      // Probability of spawning per frame
  EXIT_RATE: 0.005,      // Probability of exiting per frame
  MOVEMENT_SPEED: 1.5,
  TRAIL_LENGTH: 20,
  FPS: 30,
  COLORS: {
    background: '#0f172a',
    grid: '#1e293b',
    person: '#22d3ee',
    personGlow: 'rgba(34, 211, 238, 0.3)',
    boundingBox: '#22d3ee',
    trail: 'rgba(34, 211, 238, 0.2)',
    text: '#f8fafc',
    zoneDefault: 'rgba(59, 130, 246, 0.1)',
    zoneBorder: 'rgba(59, 130, 246, 0.5)'
  }
};

// Zone definitions matching the layout
const ZONES = [
  { id: 'entrance', name: 'Entrance', x: 0, y: 0, width: 120, height: 500, color: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6' },
  { id: 'main_floor', name: 'Main Floor', x: 120, y: 0, width: 280, height: 500, color: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' },
  { id: 'electronics', name: 'Electronics', x: 400, y: 0, width: 150, height: 250, color: 'rgba(139, 92, 246, 0.15)', borderColor: '#8b5cf6' },
  { id: 'clothing', name: 'Clothing', x: 400, y: 250, width: 150, height: 250, color: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' },
  { id: 'queue', name: 'Queue', x: 550, y: 175, width: 100, height: 175, color: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' },
  { id: 'checkout', name: 'Checkout', x: 650, y: 125, width: 150, height: 250, color: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4' }
];

// ============================================
// PERSON CLASS
// ============================================

class Person {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.speed = CONFIG.MOVEMENT_SPEED * (0.5 + Math.random() * 0.5);
    this.trail = [];
    this.currentZone = null;
    this.zoneEnterTime = {};
    this.dwellTimes = {};
    this.entryTime = Date.now();
    this.exitTime = null;
    this.state = 'entering'; // entering, browsing, queuing, checking_out, exiting
    this.color = CONFIG.COLORS.person;
    this.size = 12 + Math.random() * 4;
    this.idleTime = 0;
    this.maxIdleTime = 30 + Math.random() * 60; // frames before picking new target
  }

  update() {
    // Update trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > CONFIG.TRAIL_LENGTH) {
      this.trail.shift();
    }

    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.speed) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
      this.idleTime = 0;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
      this.idleTime++;

      // Pick new target if idle too long
      if (this.idleTime > this.maxIdleTime) {
        this.pickNewTarget();
      }
    }

    // Update current zone
    const newZone = this.detectZone();
    if (newZone !== this.currentZone) {
      // Left previous zone
      if (this.currentZone && this.zoneEnterTime[this.currentZone]) {
        const dwellTime = Date.now() - this.zoneEnterTime[this.currentZone];
        this.dwellTimes[this.currentZone] = (this.dwellTimes[this.currentZone] || 0) + dwellTime;
      }
      // Entered new zone
      if (newZone) {
        this.zoneEnterTime[newZone] = Date.now();
      }
      this.currentZone = newZone;
    }

    return this;
  }

  detectZone() {
    for (const zone of ZONES) {
      if (this.x >= zone.x && this.x <= zone.x + zone.width &&
          this.y >= zone.y && this.y <= zone.y + zone.height) {
        return zone.id;
      }
    }
    return null;
  }

  pickNewTarget() {
    this.idleTime = 0;
    this.maxIdleTime = 30 + Math.random() * 90;

    // State machine for realistic movement
    switch (this.state) {
      case 'entering':
        // Move to main floor
        this.targetX = 200 + Math.random() * 150;
        this.targetY = 100 + Math.random() * 300;
        this.state = 'browsing';
        break;

      case 'browsing':
        // Random chance to visit different areas
        const rand = Math.random();
        if (rand < 0.3) {
          // Go to electronics
          this.targetX = 420 + Math.random() * 100;
          this.targetY = 50 + Math.random() * 180;
        } else if (rand < 0.6) {
          // Go to clothing
          this.targetX = 420 + Math.random() * 100;
          this.targetY = 270 + Math.random() * 180;
        } else if (rand < 0.75) {
          // Go to queue (ready to checkout)
          this.targetX = 560 + Math.random() * 70;
          this.targetY = 200 + Math.random() * 130;
          this.state = 'queuing';
        } else {
          // Keep browsing main floor
          this.targetX = 150 + Math.random() * 200;
          this.targetY = 50 + Math.random() * 400;
        }
        break;

      case 'queuing':
        // Move to checkout
        this.targetX = 680 + Math.random() * 80;
        this.targetY = 150 + Math.random() * 200;
        this.state = 'checking_out';
        break;

      case 'checking_out':
        // Exit
        this.state = 'exiting';
        this.targetX = CONFIG.CANVAS_WIDTH + 50;
        this.targetY = 200 + Math.random() * 100;
        break;

      case 'exiting':
        // Already heading out
        break;

      default:
        this.state = 'browsing';
    }
  }

  shouldExit() {
    return this.x > CONFIG.CANVAS_WIDTH + 30 || this.state === 'exiting' && this.x > CONFIG.CANVAS_WIDTH;
  }

  getTotalDwellTime() {
    let total = 0;
    for (const zone in this.dwellTimes) {
      total += this.dwellTimes[zone];
    }
    // Add current zone time
    if (this.currentZone && this.zoneEnterTime[this.currentZone]) {
      total += Date.now() - this.zoneEnterTime[this.currentZone];
    }
    return total;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function HumanoidTrackingDemo({ onMetricsUpdate, className = '' }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const peopleRef = useRef([]);
  const metricsRef = useRef({
    totalEntries: 0,
    totalExits: 0,
    currentCount: 0,
    zoneCounts: {},
    avgDwellTime: 0,
    peakCount: 0,
    totalDwellSamples: 0,
    totalDwellTime: 0
  });

  const [isRunning, setIsRunning] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showZoneLabels, setShowZoneLabels] = useState(true);
  const [metrics, setMetrics] = useState(metricsRef.current);
  const [speed, setSpeed] = useState(1);

  let nextId = useRef(1);

  // Spawn a new person at entrance
  const spawnPerson = useCallback(() => {
    const id = nextId.current++;
    const person = new Person(id, -20, 200 + Math.random() * 100);
    person.pickNewTarget();
    peopleRef.current.push(person);
    metricsRef.current.totalEntries++;
  }, []);

  // Main animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const people = peopleRef.current;

    // Clear canvas
    ctx.fillStyle = CONFIG.COLORS.background;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = CONFIG.COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CONFIG.CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw zones
    ZONES.forEach(zone => {
      // Fill
      ctx.fillStyle = zone.color;
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

      // Border
      ctx.strokeStyle = zone.borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

      // Label
      if (showZoneLabels) {
        ctx.fillStyle = zone.borderColor;
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.fillText(zone.name, zone.x + 8, zone.y + 20);

        // Count in zone
        const count = people.filter(p => p.currentZone === zone.id).length;
        ctx.font = '24px Inter, system-ui, sans-serif';
        ctx.fillStyle = CONFIG.COLORS.text;
        ctx.fillText(count.toString(), zone.x + zone.width / 2 - 8, zone.y + zone.height / 2 + 8);
      }
    });

    // Spawn new people
    if (Math.random() < CONFIG.SPAWN_RATE * speed && people.length < CONFIG.MAX_PEOPLE) {
      spawnPerson();
    }

    // Ensure minimum people
    while (people.length < CONFIG.MIN_PEOPLE) {
      spawnPerson();
    }

    // Update and draw people
    const zoneCounts = {};
    ZONES.forEach(z => zoneCounts[z.id] = 0);

    for (let i = people.length - 1; i >= 0; i--) {
      const person = people[i];

      // Update position
      for (let s = 0; s < speed; s++) {
        person.update();
      }

      // Check if should exit
      if (person.shouldExit()) {
        metricsRef.current.totalExits++;
        const dwellTime = person.getTotalDwellTime();
        metricsRef.current.totalDwellTime += dwellTime;
        metricsRef.current.totalDwellSamples++;
        people.splice(i, 1);
        continue;
      }

      // Count zones
      if (person.currentZone) {
        zoneCounts[person.currentZone]++;
      }

      // Draw trail
      if (showTrails && person.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = CONFIG.COLORS.trail;
        ctx.lineWidth = 2;
        ctx.moveTo(person.trail[0].x, person.trail[0].y);
        for (let j = 1; j < person.trail.length; j++) {
          ctx.lineTo(person.trail[j].x, person.trail[j].y);
        }
        ctx.stroke();
      }

      // Draw glow
      const gradient = ctx.createRadialGradient(
        person.x, person.y, 0,
        person.x, person.y, person.size * 2
      );
      gradient.addColorStop(0, CONFIG.COLORS.personGlow);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(person.x, person.y, person.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw stick figure
      drawStickFigure(ctx, person.x, person.y, person.size, person.color);

      // Draw bounding box
      if (showBoundingBoxes) {
        ctx.strokeStyle = CONFIG.COLORS.boundingBox;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          person.x - person.size * 1.5,
          person.y - person.size * 2,
          person.size * 3,
          person.size * 4
        );
        ctx.setLineDash([]);

        // ID label
        ctx.fillStyle = CONFIG.COLORS.boundingBox;
        ctx.font = '10px monospace';
        ctx.fillText(`ID:${person.id}`, person.x - person.size * 1.5, person.y - person.size * 2 - 4);
      }
    }

    // Update metrics
    metricsRef.current.currentCount = people.length;
    metricsRef.current.zoneCounts = zoneCounts;
    metricsRef.current.peakCount = Math.max(metricsRef.current.peakCount, people.length);
    metricsRef.current.avgDwellTime = metricsRef.current.totalDwellSamples > 0
      ? metricsRef.current.totalDwellTime / metricsRef.current.totalDwellSamples
      : 0;

    setMetrics({ ...metricsRef.current });

    if (onMetricsUpdate) {
      onMetricsUpdate({ ...metricsRef.current });
    }

    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, showBoundingBoxes, showTrails, showZoneLabels, speed, spawnPerson, onMetricsUpdate]);

  // Draw stick figure helper
  function drawStickFigure(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(x, y - size * 1.2, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.8);
    ctx.lineTo(x, y + size * 0.5);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(x - size * 0.6, y - size * 0.3);
    ctx.lineTo(x, y - size * 0.5);
    ctx.lineTo(x + size * 0.6, y - size * 0.3);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y + size * 1.2);
    ctx.lineTo(x, y + size * 0.5);
    ctx.lineTo(x + size * 0.5, y + size * 1.2);
    ctx.stroke();
  }

  // Start/stop animation
  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, animate]);

  // Reset simulation
  const handleReset = () => {
    peopleRef.current = [];
    metricsRef.current = {
      totalEntries: 0,
      totalExits: 0,
      currentCount: 0,
      zoneCounts: {},
      avgDwellTime: 0,
      peakCount: 0,
      totalDwellSamples: 0,
      totalDwellTime: 0
    };
    nextId.current = 1;
    setMetrics(metricsRef.current);
  };

  return (
    <div className={`humanoid-tracking-demo ${className}`} style={styles.container}>
      {/* Canvas */}
      <div style={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          width={CONFIG.CANVAS_WIDTH}
          height={CONFIG.CANVAS_HEIGHT}
          style={styles.canvas}
        />

        {/* Overlay controls */}
        <div style={styles.overlayControls}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{ ...styles.controlBtn, background: isRunning ? '#ef4444' : '#22c55e' }}
          >
            {isRunning ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={handleReset} style={styles.controlBtn}>
            ↺ Reset
          </button>
          <button onClick={spawnPerson} style={styles.controlBtn}>
            + Add Person
          </button>
        </div>
      </div>

      {/* Controls Panel */}
      <div style={styles.controlsPanel}>
        <div style={styles.controlGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showBoundingBoxes}
              onChange={(e) => setShowBoundingBoxes(e.target.checked)}
            />
            Show Bounding Boxes
          </label>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showTrails}
              onChange={(e) => setShowTrails(e.target.checked)}
            />
            Show Movement Trails
          </label>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showZoneLabels}
              onChange={(e) => setShowZoneLabels(e.target.checked)}
            />
            Show Zone Labels
          </label>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.sliderLabel}>
            Simulation Speed: {speed}x
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              style={styles.slider}
            />
          </label>
        </div>
      </div>

      {/* Live Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{metrics.currentCount}</div>
          <div style={styles.metricLabel}>Current Count</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{metrics.totalEntries}</div>
          <div style={styles.metricLabel}>Total Entries</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{metrics.totalExits}</div>
          <div style={styles.metricLabel}>Total Exits</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{metrics.peakCount}</div>
          <div style={styles.metricLabel}>Peak Count</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>
            {metrics.avgDwellTime > 0 ? `${Math.round(metrics.avgDwellTime / 1000)}s` : '0s'}
          </div>
          <div style={styles.metricLabel}>Avg Dwell Time</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{metrics.totalEntries - metrics.totalExits}</div>
          <div style={styles.metricLabel}>Net Traffic</div>
        </div>
      </div>

      {/* Zone Breakdown */}
      <div style={styles.zoneBreakdown}>
        <h4 style={styles.sectionTitle}>Zone Occupancy</h4>
        <div style={styles.zoneGrid}>
          {ZONES.map(zone => (
            <div key={zone.id} style={{ ...styles.zoneCard, borderColor: zone.borderColor }}>
              <div style={{ ...styles.zoneName, color: zone.borderColor }}>{zone.name}</div>
              <div style={styles.zoneCount}>{metrics.zoneCounts[zone.id] || 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    background: '#0f172a',
    borderRadius: '12px',
    padding: '20px',
    color: '#f8fafc'
  },
  canvasWrapper: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #334155'
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: 'auto',
    maxWidth: '800px'
  },
  overlayControls: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    gap: '8px'
  },
  controlBtn: {
    padding: '8px 16px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  controlsPanel: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    marginTop: '16px',
    padding: '16px',
    background: '#1e293b',
    borderRadius: '8px'
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  sliderLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px'
  },
  slider: {
    width: '150px',
    cursor: 'pointer'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginTop: '16px'
  },
  metricCard: {
    background: '#1e293b',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#22d3ee'
  },
  metricLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  zoneBreakdown: {
    marginTop: '16px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  zoneGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '8px'
  },
  zoneCard: {
    background: '#1e293b',
    padding: '12px',
    borderRadius: '6px',
    textAlign: 'center',
    borderLeft: '3px solid'
  },
  zoneName: {
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  zoneCount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f8fafc'
  }
};

// Export for use in both dashboard versions
export { ZONES, CONFIG };
