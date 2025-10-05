import { useState } from 'react';
import './TimeRangePicker.css';

const PRESET_RANGES = [
  { label: '10m', hours: 0.167 },
  { label: '30m', hours: 0.5 },
  { label: '1h', hours: 1 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 }
];

export default function TimeRangePicker({ value, onChange }) {
  const [customHours, setCustomHours] = useState('');

  const handlePresetClick = (hours) => {
    onChange(hours);
    setCustomHours('');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const hours = parseFloat(customHours);
    if (!isNaN(hours) && hours > 0) {
      onChange(hours);
    }
  };

  return (
    <div className="time-range-picker">
      <div className="preset-buttons">
        {PRESET_RANGES.map(({ label, hours }) => (
          <button
            key={label}
            className={`preset-btn ${value === hours ? 'active' : ''}`}
            onClick={() => handlePresetClick(hours)}
          >
            {label}
          </button>
        ))}
      </div>
      <form className="custom-range" onSubmit={handleCustomSubmit}>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Custom hours"
          value={customHours}
          onChange={(e) => setCustomHours(e.target.value)}
        />
        <button type="submit">Go</button>
      </form>
    </div>
  );
}
