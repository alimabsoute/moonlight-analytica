/**
 * 3D Tracking Visualization Component
 * Isometric view of the floor plan with animated people
 * Uses HTML5 Canvas for 3D-like rendering (no Three.js dependency)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 600,
  ISO_ANGLE: 30, // degrees
  TILE_WIDTH: 60,
  TILE_HEIGHT: 30,
  MIN_PEOPLE: 8,
  MAX_PEOPLE: 30,
  SPAWN_RATE: 0.015,
  FPS: 30,
  FLOOR_ROWS: 10,
  FLOOR_COLS: 15
};

// Zone definitions for 3D view
const ZONES_3D = [
  { id: 'entrance', name: 'ENTRANCE', col: 0, row: 3, width: 2, depth: 4, height: 0.5, color: '#3b82f6' },
  { id: 'main_floor', name: 'MAIN FLOOR', col: 2, row: 1, width: 5, depth: 8, height: 0.3, color: '#10b981' },
  { id: 'electronics', name: 'ELECTRONICS', col: 7, row: 0, width: 3, depth: 4, height: 0.6, color: '#8b5cf6' },
  { id: 'clothing', name: 'CLOTHING', col: 7, row: 4, width: 3, depth: 4, height: 0.6, color: '#f59e0b' },
  { id: 'checkout', name: 'CHECKOUT', col: 10, row: 2, width: 3, depth: 5, height: 0.4, color: '#06b6d4' }
];

// ============================================
// 3D PERSON CLASS
// ============================================

class Person3D {
  constructor(id) {
    this.id = id;
    // Start at entrance
    this.col = 0.5;
    this.row = 4 + Math.random() * 2;
    this.z = 0; // Height for jump animation
    this.targetCol = this.col;
    this.targetRow = this.row;
    this.speed = 0.03 + Math.random() * 0.02;
    this.state = 'entering';
    this.idleFrames = 0;
    this.color = `hsl(${180 + Math.random() * 40}, 70%, 60%)`;
    this.currentZone = 'entrance';
    this.entryTime = Date.now();
  }

  update() {
    const dx = this.targetCol - this.col;
    const dy = this.targetRow - this.row;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.1) {
      this.col += (dx / distance) * this.speed;
      this.row += (dy / distance) * this.speed;
      this.idleFrames = 0;
      // Walking bounce
      this.z = Math.abs(Math.sin(Date.now() * 0.02)) * 0.15;
    } else {
      this.z = 0;
      this.idleFrames++;
      if (this.idleFrames > 60 + Math.random() * 120) {
        this.pickNewTarget();
      }
    }

    // Update current zone
    this.currentZone = this.detectZone();
  }

  detectZone() {
    for (const zone of ZONES_3D) {
      if (this.col >= zone.col && this.col < zone.col + zone.width &&
          this.row >= zone.row && this.row < zone.row + zone.depth) {
        return zone.id;
      }
    }
    return null;
  }

  pickNewTarget() {
    this.idleFrames = 0;

    switch (this.state) {
      case 'entering':
        this.targetCol = 3 + Math.random() * 3;
        this.targetRow = 2 + Math.random() * 6;
        this.state = 'browsing';
        break;

      case 'browsing':
        const rand = Math.random();
        if (rand < 0.3) {
          // Electronics
          this.targetCol = 7.5 + Math.random() * 2;
          this.targetRow = 0.5 + Math.random() * 3;
        } else if (rand < 0.6) {
          // Clothing
          this.targetCol = 7.5 + Math.random() * 2;
          this.targetRow = 4.5 + Math.random() * 3;
        } else if (rand < 0.8) {
          // Checkout
          this.targetCol = 10.5 + Math.random() * 2;
          this.targetRow = 3 + Math.random() * 3;
          this.state = 'checkout';
        } else {
          // Keep browsing
          this.targetCol = 2.5 + Math.random() * 4;
          this.targetRow = 1.5 + Math.random() * 7;
        }
        break;

      case 'checkout':
        this.targetCol = CONFIG.FLOOR_COLS + 2;
        this.targetRow = 4 + Math.random() * 2;
        this.state = 'exiting';
        break;

      case 'exiting':
        break;
    }
  }

  shouldRemove() {
    return this.col > CONFIG.FLOOR_COLS + 1;
  }
}

// ============================================
// ISOMETRIC HELPERS
// ============================================

function toIso(col, row, z = 0) {
  const angle = CONFIG.ISO_ANGLE * Math.PI / 180;
  const x = (col - row) * CONFIG.TILE_WIDTH / 2;
  const y = (col + row) * CONFIG.TILE_HEIGHT / 2 - z * 40;
  return {
    x: x + CONFIG.CANVAS_WIDTH / 2,
    y: y + 80
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Tracking3DView({ onMetricsUpdate, className = '', theme = 'dark' }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const peopleRef = useRef([]);
  const metricsRef = useRef({
    totalEntries: 0,
    totalExits: 0,
    currentCount: 0,
    zoneCounts: {},
    peakCount: 0
  });

  const [isRunning, setIsRunning] = useState(true);
  const [metrics, setMetrics] = useState(metricsRef.current);
  const [viewAngle, setViewAngle] = useState(0);

  let nextId = useRef(1);

  const colors = theme === 'dark' ? {
    bg: '#0f172a',
    floor: '#1e293b',
    grid: '#334155',
    text: '#f8fafc',
    shadow: 'rgba(0, 0, 0, 0.3)'
  } : {
    bg: '#f8fafc',
    floor: '#e2e8f0',
    grid: '#cbd5e1',
    text: '#1e293b',
    shadow: 'rgba(0, 0, 0, 0.1)'
  };

  const spawnPerson = useCallback(() => {
    const id = nextId.current++;
    const person = new Person3D(id);
    person.pickNewTarget();
    peopleRef.current.push(person);
    metricsRef.current.totalEntries++;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const people = peopleRef.current;

    // Clear
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Draw floor grid (isometric)
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    // Floor tiles
    for (let row = 0; row < CONFIG.FLOOR_ROWS; row++) {
      for (let col = 0; col < CONFIG.FLOOR_COLS; col++) {
        const p1 = toIso(col, row);
        const p2 = toIso(col + 1, row);
        const p3 = toIso(col + 1, row + 1);
        const p4 = toIso(col, row + 1);

        ctx.fillStyle = colors.floor;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Draw zones (3D boxes)
    ZONES_3D.forEach(zone => {
      const h = zone.height * 40;

      // Floor
      const f1 = toIso(zone.col, zone.row);
      const f2 = toIso(zone.col + zone.width, zone.row);
      const f3 = toIso(zone.col + zone.width, zone.row + zone.depth);
      const f4 = toIso(zone.col, zone.row + zone.depth);

      // Top
      const t1 = toIso(zone.col, zone.row, zone.height);
      const t2 = toIso(zone.col + zone.width, zone.row, zone.height);
      const t3 = toIso(zone.col + zone.width, zone.row + zone.depth, zone.height);
      const t4 = toIso(zone.col, zone.row + zone.depth, zone.height);

      // Draw sides
      ctx.globalAlpha = 0.3;

      // Right side
      ctx.fillStyle = zone.color;
      ctx.beginPath();
      ctx.moveTo(f2.x, f2.y);
      ctx.lineTo(f3.x, f3.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.closePath();
      ctx.fill();

      // Left side
      ctx.fillStyle = zone.color;
      ctx.beginPath();
      ctx.moveTo(f3.x, f3.y);
      ctx.lineTo(f4.x, f4.y);
      ctx.lineTo(t4.x, t4.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fill();

      // Top
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.lineTo(t4.x, t4.y);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;

      // Zone label
      const center = toIso(zone.col + zone.width / 2, zone.row + zone.depth / 2, zone.height + 0.3);
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, center.x, center.y);

      // Count
      const count = people.filter(p => p.currentZone === zone.id).length;
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.fillStyle = zone.color;
      ctx.fillText(count.toString(), center.x, center.y + 18);
    });

    // Spawn people
    if (Math.random() < CONFIG.SPAWN_RATE && people.length < CONFIG.MAX_PEOPLE) {
      spawnPerson();
    }

    while (people.length < CONFIG.MIN_PEOPLE) {
      spawnPerson();
    }

    // Sort people by row for correct draw order
    people.sort((a, b) => (a.row + a.col) - (b.row + b.col));

    // Update zone counts
    const zoneCounts = {};
    ZONES_3D.forEach(z => zoneCounts[z.id] = 0);

    // Update and draw people
    for (let i = people.length - 1; i >= 0; i--) {
      const person = people[i];
      person.update();

      if (person.shouldRemove()) {
        metricsRef.current.totalExits++;
        people.splice(i, 1);
        continue;
      }

      if (person.currentZone) {
        zoneCounts[person.currentZone]++;
      }

      // Draw shadow
      const shadowPos = toIso(person.col, person.row);
      ctx.fillStyle = colors.shadow;
      ctx.beginPath();
      ctx.ellipse(shadowPos.x, shadowPos.y + 5, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw person (3D capsule)
      const pos = toIso(person.col, person.row, person.z);

      // Body
      ctx.fillStyle = person.color;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y - 10, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - 25, 6, 0, Math.PI * 2);
      ctx.fill();

      // ID badge
      ctx.fillStyle = colors.text;
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(person.id.toString(), pos.x, pos.y - 35);
    }

    // Update metrics
    metricsRef.current.currentCount = people.length;
    metricsRef.current.zoneCounts = zoneCounts;
    metricsRef.current.peakCount = Math.max(metricsRef.current.peakCount, people.length);

    setMetrics({ ...metricsRef.current });

    if (onMetricsUpdate) {
      onMetricsUpdate({ ...metricsRef.current });
    }

    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, colors, spawnPerson, onMetricsUpdate]);

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

  const handleReset = () => {
    peopleRef.current = [];
    metricsRef.current = {
      totalEntries: 0,
      totalExits: 0,
      currentCount: 0,
      zoneCounts: {},
      peakCount: 0
    };
    nextId.current = 1;
    setMetrics(metricsRef.current);
  };

  return (
    <div className={className} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${colors.grid}` }}>
        <canvas
          ref={canvasRef}
          width={CONFIG.CANVAS_WIDTH}
          height={CONFIG.CANVAS_HEIGHT}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />

        {/* Controls */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              padding: '8px 16px',
              background: isRunning ? '#ef4444' : '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            {isRunning ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            ↺ Reset
          </button>
        </div>

        {/* 3D View Badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#22d3ee',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          3D ISOMETRIC VIEW
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
        marginTop: '16px'
      }}>
        {[
          { label: 'Current', value: metrics.currentCount },
          { label: 'Entries', value: metrics.totalEntries },
          { label: 'Exits', value: metrics.totalExits },
          { label: 'Peak', value: metrics.peakCount },
          { label: 'Net Flow', value: metrics.totalEntries - metrics.totalExits }
        ].map(metric => (
          <div key={metric.label} style={{
            background: colors.floor,
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#22d3ee' }}>
              {metric.value}
            </div>
            <div style={{ fontSize: '11px', color: colors.text, opacity: 0.7, textTransform: 'uppercase' }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ZONES_3D, CONFIG as CONFIG_3D };
