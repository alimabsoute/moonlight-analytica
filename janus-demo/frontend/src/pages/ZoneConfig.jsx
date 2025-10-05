import { useState, useRef, useEffect } from 'react';
import './ZoneConfig.css';

const DEFAULT_ZONES = [
  { zone_id: 1, name: 'entrance', x1: 0, y1: 0, x2: 200, y2: 480, zone_type: 'entrance', color: '#4CAF50' },
  { zone_id: 2, name: 'main_floor', x1: 200, y1: 0, x2: 440, y2: 480, zone_type: 'general', color: '#2196F3' },
  { zone_id: 3, name: 'queue', x1: 440, y1: 240, x2: 540, y2: 480, zone_type: 'queue', color: '#FF9800' },
  { zone_id: 4, name: 'checkout', x1: 540, y1: 0, x2: 640, y2: 480, zone_type: 'checkout', color: '#F44336' }
];

export default function ZoneConfig() {
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [selectedZone, setSelectedZone] = useState(null);
  const [dragging, setDragging] = useState(null); // { zoneId, handle }
  const [videoUrl, setVideoUrl] = useState('');
  const [videoConnected, setVideoConnected] = useState(false);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  // Draw zones on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame if connected
    if (videoConnected && videoRef.current) {
      try {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        // Video not ready yet
      }
    } else {
      // Draw grid background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw zones
    zones.forEach(zone => {
      const isSelected = selectedZone === zone.zone_id;

      // Draw zone rectangle
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillStyle = zone.color + '20'; // 20 = alpha transparency
      ctx.fillRect(zone.x1, zone.y1, zone.x2 - zone.x1, zone.y2 - zone.y1);
      ctx.strokeRect(zone.x1, zone.y1, zone.x2 - zone.x1, zone.y2 - zone.y1);

      // Draw zone label
      ctx.fillStyle = zone.color;
      ctx.font = 'bold 14px Arial';
      ctx.fillText(zone.name, zone.x1 + 5, zone.y1 + 20);

      // Draw resize handles if selected
      if (isSelected) {
        const handleSize = 8;
        ctx.fillStyle = zone.color;

        // Corner handles
        [[zone.x1, zone.y1], [zone.x2, zone.y1], [zone.x1, zone.y2], [zone.x2, zone.y2]].forEach(([x, y]) => {
          ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        });
      }
    });

    // Continue drawing if video is connected
    if (videoConnected) {
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Redraw
            useEffect(() => {}, [zones, selectedZone, videoConnected]);
          }
        }
      });
    }
  }, [zones, selectedZone, videoConnected]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a zone
    for (const zone of [...zones].reverse()) {
      if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) {
        setSelectedZone(zone.zone_id);
        return;
      }
    }

    setSelectedZone(null);
  };

  const handleMouseDown = (e) => {
    if (!selectedZone) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const zone = zones.find(z => z.zone_id === selectedZone);
    if (!zone) return;

    const handleSize = 8;

    // Check if clicking on a resize handle
    const handles = [
      { name: 'tl', x: zone.x1, y: zone.y1 },
      { name: 'tr', x: zone.x2, y: zone.y1 },
      { name: 'bl', x: zone.x1, y: zone.y2 },
      { name: 'br', x: zone.x2, y: zone.y2 }
    ];

    for (const handle of handles) {
      if (Math.abs(x - handle.x) < handleSize && Math.abs(y - handle.y) < handleSize) {
        setDragging({ zoneId: selectedZone, handle: handle.name });
        return;
      }
    }

    // Otherwise, drag the whole zone
    setDragging({ zoneId: selectedZone, handle: 'move', offsetX: x - zone.x1, offsetY: y - zone.y1 });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(canvas.height, e.clientY - rect.top));

    setZones(zones.map(zone => {
      if (zone.zone_id !== dragging.zoneId) return zone;

      let newZone = { ...zone };

      if (dragging.handle === 'move') {
        const dx = x - dragging.offsetX - zone.x1;
        const dy = y - dragging.offsetY - zone.y1;
        newZone.x1 += dx;
        newZone.x2 += dx;
        newZone.y1 += dy;
        newZone.y2 += dy;
      } else if (dragging.handle === 'tl') {
        newZone.x1 = Math.min(x, zone.x2 - 50);
        newZone.y1 = Math.min(y, zone.y2 - 50);
      } else if (dragging.handle === 'tr') {
        newZone.x2 = Math.max(x, zone.x1 + 50);
        newZone.y1 = Math.min(y, zone.y2 - 50);
      } else if (dragging.handle === 'bl') {
        newZone.x1 = Math.min(x, zone.x2 - 50);
        newZone.y2 = Math.max(y, zone.y1 + 50);
      } else if (dragging.handle === 'br') {
        newZone.x2 = Math.max(x, zone.x1 + 50);
        newZone.y2 = Math.max(y, zone.y1 + 50);
      }

      return newZone;
    }));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleConnectVideo = () => {
    if (!videoUrl) return;

    const video = videoRef.current;
    if (!video) return;

    video.src = videoUrl;
    video.onloadeddata = () => {
      setVideoConnected(true);
    };
    video.onerror = () => {
      alert('Failed to connect to video stream');
      setVideoConnected(false);
    };
  };

  const handleSaveConfig = () => {
    const config = {
      zones: zones.map(z => ({
        zone_id: z.zone_id,
        name: z.name,
        x1: Math.round(z.x1),
        y1: Math.round(z.y1),
        x2: Math.round(z.x2),
        y2: Math.round(z.y2),
        zone_type: z.zone_type
      }))
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zones.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetZones = () => {
    if (confirm('Reset zones to default configuration?')) {
      setZones(DEFAULT_ZONES);
      setSelectedZone(null);
    }
  };

  return (
    <div className="zone-config">
      <div className="page-header">
        <h1>Zone Configuration</h1>
        <p>Click and drag zones to reposition. Click handles to resize.</p>
      </div>

      <div className="config-controls">
        <div className="video-connect">
          <input
            type="text"
            placeholder="Video stream URL (optional)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="video-input"
          />
          <button onClick={handleConnectVideo} className="btn-primary">
            📹 Connect Video
          </button>
          {videoConnected && <span className="status-indicator">● Connected</span>}
        </div>

        <div className="action-buttons">
          <button onClick={handleSaveConfig} className="btn-primary">
            💾 Save Config
          </button>
          <button onClick={handleResetZones} className="btn-secondary">
            🔄 Reset to Default
          </button>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: dragging ? 'grabbing' : (selectedZone ? 'grab' : 'pointer') }}
        />
        <video ref={videoRef} style={{ display: 'none' }} autoPlay />
      </div>

      <div className="zone-list">
        <h3>Zones</h3>
        {zones.map(zone => (
          <div
            key={zone.zone_id}
            className={`zone-item ${selectedZone === zone.zone_id ? 'selected' : ''}`}
            onClick={() => setSelectedZone(zone.zone_id)}
          >
            <div className="zone-color" style={{ backgroundColor: zone.color }} />
            <div className="zone-info">
              <div className="zone-name">{zone.name}</div>
              <div className="zone-coords">
                ({Math.round(zone.x1)}, {Math.round(zone.y1)}) →
                ({Math.round(zone.x2)}, {Math.round(zone.y2)})
              </div>
            </div>
            <div className="zone-type">{zone.zone_type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
