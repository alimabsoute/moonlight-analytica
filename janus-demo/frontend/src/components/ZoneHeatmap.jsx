import { useEffect, useRef, useState } from 'react';
import './ZoneHeatmap.css';

export default function ZoneHeatmap({ zonesData, occupancyData }) {
  const canvasRef = useRef(null);
  const [hoveredZone, setHoveredZone] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || !zonesData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Prepare zone data with normalized heat values
    const zones = Object.entries(zonesData).map(([name, data]) => ({
      name,
      value: data.total_events || 0,
      visitors: data.unique_visitors || 0
    }));

    const maxValue = Math.max(...zones.map(z => z.value), 1);

    // Grid layout - 3 columns
    const cols = 3;
    const rows = Math.ceil(zones.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const padding = 10;

    // Draw heatmap cells
    zones.forEach((zone, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellWidth + padding;
      const y = row * cellHeight + padding;
      const w = cellWidth - padding * 2;
      const h = cellHeight - padding * 2;

      // Calculate heat intensity (0-1)
      const intensity = zone.value / maxValue;

      // Color gradient from cool (blue) to hot (red)
      const color = getHeatColor(intensity);

      // Draw cell background
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);

      // Draw border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Draw zone name
      ctx.fillStyle = intensity > 0.5 ? '#fff' : '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(zone.name, x + w / 2, y + 10);

      // Draw event count
      ctx.font = '24px Arial';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.value.toString(), x + w / 2, y + h / 2);

      // Draw visitor count
      ctx.font = '12px Arial';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${zone.visitors} visitors`, x + w / 2, y + h - 10);
    });

    // Draw legend
    drawLegend(ctx, width, height);
  }, [zonesData]);

  const getHeatColor = (intensity) => {
    // Blue -> Green -> Yellow -> Orange -> Red
    if (intensity < 0.2) {
      return `rgb(${Math.floor(intensity * 5 * 100)}, ${Math.floor(intensity * 5 * 150)}, 255)`;
    } else if (intensity < 0.4) {
      const t = (intensity - 0.2) / 0.2;
      return `rgb(${Math.floor(100 + t * 100)}, ${Math.floor(200 + t * 55)}, ${Math.floor(255 - t * 155)})`;
    } else if (intensity < 0.6) {
      const t = (intensity - 0.4) / 0.2;
      return `rgb(${Math.floor(200 + t * 55)}, 255, ${Math.floor(100 - t * 100)})`;
    } else if (intensity < 0.8) {
      const t = (intensity - 0.6) / 0.2;
      return `rgb(255, ${Math.floor(255 - t * 100)}, 0)`;
    } else {
      const t = (intensity - 0.8) / 0.2;
      return `rgb(255, ${Math.floor(155 - t * 100)}, 0)`;
    }
  };

  const drawLegend = (ctx, width, height) => {
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - 20;
    const legendY = height - legendHeight - 20;

    // Draw gradient
    const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
    gradient.addColorStop(0, 'rgb(0, 50, 255)');
    gradient.addColorStop(0.25, 'rgb(100, 200, 100)');
    gradient.addColorStop(0.5, 'rgb(255, 255, 0)');
    gradient.addColorStop(0.75, 'rgb(255, 155, 0)');
    gradient.addColorStop(1, 'rgb(255, 55, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

    // Draw legend border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // Draw legend labels
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Low', legendX, legendY + legendHeight + 5);
    ctx.textAlign = 'right';
    ctx.fillText('High', legendX + legendWidth, legendY + legendHeight + 5);
  };

  return (
    <div className="zone-heatmap-container">
      <h3>Zone Activity Heatmap</h3>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="zone-heatmap-canvas"
      />
      {hoveredZone && (
        <div className="zone-tooltip">
          <h4>{hoveredZone.name}</h4>
          <p>Events: {hoveredZone.value}</p>
          <p>Visitors: {hoveredZone.visitors}</p>
        </div>
      )}
    </div>
  );
}
