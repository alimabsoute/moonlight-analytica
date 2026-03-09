import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
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

  // Find which preset matches current value (if any)
  const activePreset = PRESET_RANGES.find(r => r.hours === value)?.label || 'custom';

  return (
    <div className="time-range-picker">
      <Tabs value={activePreset} className="time-tabs">
        <TabsList className="bg-[#1e293b] border border-[#374151]">
          {PRESET_RANGES.map(({ label, hours }) => (
            <TabsTrigger
              key={label}
              value={label}
              onClick={() => handlePresetClick(hours)}
              className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white text-gray-400 hover:text-white"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <form className="custom-range" onSubmit={handleCustomSubmit}>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Custom h"
          value={customHours}
          onChange={(e) => setCustomHours(e.target.value)}
          className="w-24 h-9 bg-[#1e293b] border-[#374151] text-white placeholder:text-gray-500"
        />
        <Button type="submit" size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white">
          Go
        </Button>
      </form>
    </div>
  );
}
