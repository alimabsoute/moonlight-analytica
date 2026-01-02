/**
 * Janus Mock Data Generator
 * Generates 30 days of realistic people counting data with patterns
 *
 * EASILY REMOVABLE: Set MOCK_DATA_ENABLED = false to disable all mock data
 */

// ============================================
// CONFIGURATION - Toggle mock data on/off
// ============================================
export const MOCK_DATA_ENABLED = true;
export const MOCK_DATA_DAYS = 30;

// ============================================
// UTILITY FUNCTIONS
// ============================================

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

// Gaussian-like random for more realistic distributions
const gaussianRandom = (mean, stdDev) => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
};

// ============================================
// TIME PATTERN GENERATORS
// ============================================

// Hourly traffic multiplier (24 hours)
const HOURLY_PATTERN = [
  0.1,  // 00:00 - Midnight
  0.05, // 01:00
  0.02, // 02:00
  0.02, // 03:00
  0.03, // 04:00
  0.05, // 05:00
  0.15, // 06:00
  0.35, // 07:00
  0.55, // 08:00 - Morning rush
  0.75, // 09:00
  0.85, // 10:00
  0.95, // 11:00 - Peak
  1.0,  // 12:00 - Lunch peak
  0.9,  // 13:00
  0.8,  // 14:00
  0.75, // 15:00
  0.8,  // 16:00
  0.9,  // 17:00 - Evening rush
  0.85, // 18:00
  0.7,  // 19:00
  0.5,  // 20:00
  0.35, // 21:00
  0.2,  // 22:00
  0.1   // 23:00
];

// Day of week multiplier (0 = Sunday)
const DAY_PATTERN = [
  0.6,  // Sunday
  0.85, // Monday
  0.95, // Tuesday
  1.0,  // Wednesday - Peak
  0.95, // Thursday
  0.9,  // Friday
  0.7   // Saturday
];

// ============================================
// ZONE DEFINITIONS
// ============================================

export const ZONES = [
  { id: 'entrance', name: 'Entrance', capacity: 50, x: 0, y: 0, width: 150, height: 400, color: '#3B82F6' },
  { id: 'main_floor', name: 'Main Floor', capacity: 200, x: 150, y: 0, width: 300, height: 400, color: '#10B981' },
  { id: 'electronics', name: 'Electronics', capacity: 80, x: 450, y: 0, width: 150, height: 200, color: '#8B5CF6' },
  { id: 'clothing', name: 'Clothing', capacity: 100, x: 450, y: 200, width: 150, height: 200, color: '#F59E0B' },
  { id: 'queue', name: 'Queue Area', capacity: 30, x: 600, y: 150, width: 100, height: 150, color: '#EF4444' },
  { id: 'checkout', name: 'Checkout', capacity: 40, x: 700, y: 100, width: 100, height: 250, color: '#06B6D4' }
];

// ============================================
// GENERATE 30 DAYS OF TIME SERIES DATA
// ============================================

export function generateTimeSeriesData(days = MOCK_DATA_DAYS) {
  if (!MOCK_DATA_ENABLED) return [];

  const data = [];
  const now = new Date();
  const baseTraffic = 150; // Average visitors per hour at peak

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    const dayMultiplier = DAY_PATTERN[dayOfWeek];

    // Generate hourly data points
    for (let h = 0; h < 24; h++) {
      const hourMultiplier = HOURLY_PATTERN[h];
      const baseCount = baseTraffic * dayMultiplier * hourMultiplier;

      // Add some randomness
      const count = Math.max(0, Math.round(gaussianRandom(baseCount, baseCount * 0.15)));
      const peak = Math.round(count * randomFloat(1.1, 1.4));

      const timestamp = new Date(date);
      timestamp.setHours(h, 0, 0, 0);

      data.push({
        timestamp: timestamp.toISOString(),
        ts: timestamp.getTime(),
        count_value: count,
        peak: peak,
        entries: Math.round(count * randomFloat(0.45, 0.55)),
        exits: Math.round(count * randomFloat(0.45, 0.55)),
        throughput: Math.round(count * randomFloat(0.8, 1.2))
      });
    }
  }

  return data;
}

// ============================================
// GENERATE KPI SUMMARY
// ============================================

export function generateKPIs(hours = 24) {
  if (!MOCK_DATA_ENABLED) {
    return {
      current_count: 0,
      avg_count: 0,
      peak_count: 0,
      total_events: 0,
      throughput: 0
    };
  }

  const series = generateTimeSeriesData(Math.ceil(hours / 24));
  const relevantData = series.slice(-hours);

  const avgCount = relevantData.reduce((sum, d) => sum + d.count_value, 0) / relevantData.length;
  const peakCount = Math.max(...relevantData.map(d => d.peak));
  const totalEvents = relevantData.reduce((sum, d) => sum + d.throughput, 0);

  // Current count based on current hour pattern
  const currentHour = new Date().getHours();
  const currentMultiplier = HOURLY_PATTERN[currentHour];
  const currentCount = Math.round(150 * currentMultiplier * randomFloat(0.8, 1.2));

  return {
    current_count: currentCount,
    avg_count: Math.round(avgCount * 10) / 10,
    peak_count: peakCount,
    total_events: totalEvents,
    throughput: Math.round(totalEvents / hours * 10) / 10
  };
}

// ============================================
// GENERATE ZONE DATA
// ============================================

export function generateZoneData(hours = 24) {
  if (!MOCK_DATA_ENABLED) return { zones: [] };

  const totalVisitors = Math.round(generateKPIs(hours).total_events * 0.4);

  return {
    zones: ZONES.map(zone => {
      // Distribute visitors based on zone importance
      const zoneMultiplier = {
        entrance: 1.0,
        main_floor: 0.95,
        electronics: 0.45,
        clothing: 0.55,
        queue: 0.35,
        checkout: 0.30
      }[zone.id] || 0.5;

      const visitors = Math.round(totalVisitors * zoneMultiplier * randomFloat(0.8, 1.2));
      const events = Math.round(visitors * randomFloat(1.5, 3.0));

      return {
        zone: zone.id,
        name: zone.name,
        capacity: zone.capacity,
        unique_visitors: visitors,
        total_events: events,
        current_occupancy: Math.round(zone.capacity * randomFloat(0.1, 0.6)),
        avg_dwell_seconds: Math.round(randomFloat(60, 600))
      };
    })
  };
}

// ============================================
// GENERATE DWELL TIME DATA
// ============================================

export function generateDwellTimeData(hours = 24) {
  if (!MOCK_DATA_ENABLED) {
    return {
      avg_dwell_seconds: 0,
      median_dwell_seconds: 0,
      min_dwell_seconds: 0,
      max_dwell_seconds: 0,
      total_sessions: 0,
      distribution: {}
    };
  }

  const totalSessions = Math.round(generateKPIs(hours).total_events * 0.3);

  // Realistic dwell time distribution
  const distribution = {
    under_1min: Math.round(totalSessions * randomFloat(0.15, 0.25)),      // Bouncers
    '1_to_5min': Math.round(totalSessions * randomFloat(0.25, 0.35)),     // Quick visits
    '5_to_15min': Math.round(totalSessions * randomFloat(0.20, 0.30)),    // Browsers
    '15_to_30min': Math.round(totalSessions * randomFloat(0.10, 0.20)),   // Shoppers
    over_30min: Math.round(totalSessions * randomFloat(0.05, 0.10))       // Deep engagement
  };

  return {
    avg_dwell_seconds: Math.round(randomFloat(420, 720)),    // 7-12 minutes average
    median_dwell_seconds: Math.round(randomFloat(300, 480)), // 5-8 minutes median
    min_dwell_seconds: randomBetween(10, 30),
    max_dwell_seconds: randomBetween(2400, 5400),            // 40-90 minutes max
    total_sessions: totalSessions,
    distribution
  };
}

// ============================================
// GENERATE ENTRIES/EXITS DATA
// ============================================

export function generateEntriesExitsData(hours = 24) {
  if (!MOCK_DATA_ENABLED) {
    return { entries: 0, exits: 0, net_traffic: 0 };
  }

  const kpis = generateKPIs(hours);
  const entries = Math.round(kpis.total_events * randomFloat(0.48, 0.52));
  const exits = Math.round(kpis.total_events * randomFloat(0.48, 0.52));

  return {
    entries,
    exits,
    net_traffic: entries - exits
  };
}

// ============================================
// GENERATE OCCUPANCY DATA
// ============================================

export function generateOccupancyData() {
  if (!MOCK_DATA_ENABLED) {
    return {
      current_occupancy: 0,
      total_capacity: 500,
      occupancy_rate: 0,
      zones: []
    };
  }

  const currentHour = new Date().getHours();
  const hourMultiplier = HOURLY_PATTERN[currentHour];
  const totalCapacity = ZONES.reduce((sum, z) => sum + z.capacity, 0);
  const currentOccupancy = Math.round(totalCapacity * hourMultiplier * randomFloat(0.3, 0.6));

  return {
    current_occupancy: currentOccupancy,
    total_capacity: totalCapacity,
    occupancy_rate: Math.round((currentOccupancy / totalCapacity) * 100 * 10) / 10,
    zones: ZONES.map(zone => ({
      zone: zone.id,
      name: zone.name,
      current: Math.round(zone.capacity * hourMultiplier * randomFloat(0.2, 0.7)),
      capacity: zone.capacity
    }))
  };
}

// ============================================
// GENERATE QUEUE DATA
// ============================================

export function generateQueueData(hours = 24) {
  if (!MOCK_DATA_ENABLED) {
    return {
      current_queue_length: 0,
      avg_wait_seconds: 0,
      total_queued: 0,
      max_queue_length: 0
    };
  }

  const currentHour = new Date().getHours();
  const hourMultiplier = HOURLY_PATTERN[currentHour];
  const baseQueue = 15 * hourMultiplier;

  return {
    current_queue_length: Math.round(baseQueue * randomFloat(0.5, 1.5)),
    avg_wait_seconds: Math.round(randomFloat(120, 360)),  // 2-6 minutes
    total_queued: Math.round(generateKPIs(hours).total_events * 0.25),
    max_queue_length: Math.round(baseQueue * randomFloat(2.0, 3.0))
  };
}

// ============================================
// GENERATE CONVERSION DATA
// ============================================

export function generateConversionData(hours = 24) {
  if (!MOCK_DATA_ENABLED) {
    return {
      total_sessions: 0,
      conversions: 0,
      conversion_rate: 0,
      bounce_rate: 0,
      engagement_rate: 0
    };
  }

  const dwellData = generateDwellTimeData(hours);
  const totalSessions = dwellData.total_sessions;
  const bouncers = dwellData.distribution.under_1min;
  const engaged = totalSessions - bouncers;
  const conversions = Math.round(totalSessions * randomFloat(0.15, 0.30));

  return {
    total_sessions: totalSessions,
    conversions,
    conversion_rate: Math.round((conversions / totalSessions) * 100 * 10) / 10,
    bounce_rate: Math.round((bouncers / totalSessions) * 100 * 10) / 10,
    engagement_rate: Math.round((engaged / totalSessions) * 100 * 10) / 10
  };
}

// ============================================
// GENERATE ALERTS
// ============================================

export function generateAlerts() {
  if (!MOCK_DATA_ENABLED) return [];

  const alertTypes = [
    { type: 'warning', title: 'High Occupancy', message: 'Main Floor approaching 80% capacity', zone: 'main_floor', timestamp: new Date(Date.now() - 300000) },
    { type: 'info', title: 'Traffic Spike', message: '25% increase in entries in last 15 minutes', zone: 'entrance', timestamp: new Date(Date.now() - 900000) },
    { type: 'success', title: 'Queue Cleared', message: 'Queue area now at normal levels', zone: 'queue', timestamp: new Date(Date.now() - 1800000) },
    { type: 'warning', title: 'Long Dwell Time', message: 'Average dwell in Electronics exceeds 20 minutes', zone: 'electronics', timestamp: new Date(Date.now() - 3600000) },
    { type: 'error', title: 'Capacity Alert', message: 'Checkout area at 95% capacity', zone: 'checkout', timestamp: new Date(Date.now() - 7200000) }
  ];

  // Return random subset of alerts
  return alertTypes
    .filter(() => Math.random() > 0.3)
    .map((alert, idx) => ({ ...alert, id: idx + 1 }));
}

// ============================================
// GENERATE HOURLY BREAKDOWN (for reports)
// ============================================

export function generateHourlyBreakdown(date = new Date()) {
  if (!MOCK_DATA_ENABLED) return [];

  const dayOfWeek = date.getDay();
  const dayMultiplier = DAY_PATTERN[dayOfWeek];
  const baseTraffic = 150;

  return HOURLY_PATTERN.map((hourMultiplier, hour) => {
    const count = Math.round(baseTraffic * dayMultiplier * hourMultiplier * randomFloat(0.85, 1.15));
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      visitors: count,
      entries: Math.round(count * 0.52),
      exits: Math.round(count * 0.48),
      avgDwell: Math.round(randomFloat(5, 15))
    };
  });
}

// ============================================
// GENERATE DAILY SUMMARY (for reports)
// ============================================

export function generateDailySummary(days = 30) {
  if (!MOCK_DATA_ENABLED) return [];

  const summary = [];
  const now = new Date();

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    const dayMultiplier = DAY_PATTERN[dayOfWeek];

    const totalVisitors = Math.round(2500 * dayMultiplier * randomFloat(0.85, 1.15));
    const peakHour = [11, 12, 13, 17, 18][randomBetween(0, 4)];

    summary.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      totalVisitors,
      peakVisitors: Math.round(totalVisitors * randomFloat(0.08, 0.12)),
      peakHour: `${peakHour}:00`,
      avgDwellMinutes: Math.round(randomFloat(8, 14)),
      conversionRate: Math.round(randomFloat(18, 28) * 10) / 10,
      bounceRate: Math.round(randomFloat(15, 25) * 10) / 10
    });
  }

  return summary;
}

// ============================================
// DISABLE MOCK DATA (call this to use real API)
// ============================================

export function disableMockData() {
  // This function can be called to switch to real API
  console.log('Mock data disabled. Switching to real API...');
  // In real implementation, this would update a global state or config
}

// ============================================
// CHART-READY DATA FORMATTERS (for Analytics pages)
// ============================================

/**
 * Generate time series data formatted for Recharts
 * @param {number} hours - Number of hours of data to generate
 * @returns {Array} Array of { time, count, previousCount } objects
 */
export function generateChartTimeSeriesData(hours = 24) {
  if (!MOCK_DATA_ENABLED) return [];

  const data = [];
  const now = new Date();
  const baseTraffic = 150;
  const currentHour = now.getHours();

  for (let h = 0; h < hours; h++) {
    const hourIndex = (currentHour - hours + h + 24) % 24;
    const hourMultiplier = HOURLY_PATTERN[hourIndex];
    const count = Math.round(baseTraffic * hourMultiplier * randomFloat(0.8, 1.2));
    const previousCount = Math.round(baseTraffic * hourMultiplier * randomFloat(0.7, 1.1));

    data.push({
      time: `${hourIndex.toString().padStart(2, '0')}:00`,
      count,
      previousCount
    });
  }

  return data;
}

/**
 * Generate zone data formatted for Radar charts
 * @returns {Array} Array of zone objects with utilization, efficiency, visitors, etc.
 */
export function generateChartZoneData() {
  if (!MOCK_DATA_ENABLED) return [];

  return ZONES.map(zone => ({
    zone: zone.name,
    utilization: Math.round(randomFloat(40, 95)),
    efficiency: Math.round(randomFloat(50, 90)),
    visitors: Math.round(randomFloat(500, 3000)),
    avgDwell: Math.round(randomFloat(5, 20)),
    trend: Math.round(randomFloat(-15, 25))
  }));
}

/**
 * Generate dwell time data formatted for Pie charts
 * @returns {Array} Array of { name, value } objects
 */
export function generateChartDwellTimeData() {
  if (!MOCK_DATA_ENABLED) return [];

  return [
    { name: '<1 min', value: Math.round(randomFloat(15, 25)) },
    { name: '1-5 min', value: Math.round(randomFloat(25, 35)) },
    { name: '5-15 min', value: Math.round(randomFloat(20, 30)) },
    { name: '15-30 min', value: Math.round(randomFloat(10, 20)) },
    { name: '>30 min', value: Math.round(randomFloat(5, 15)) }
  ];
}

/**
 * Generate conversion funnel data
 * @returns {Array} Array of { stage, value } objects
 */
export function generateChartConversionData() {
  if (!MOCK_DATA_ENABLED) return [];

  const visitors = Math.round(randomFloat(8000, 12000));
  return [
    { stage: 'Visitors', value: visitors },
    { stage: 'Engaged', value: Math.round(visitors * randomFloat(0.65, 0.80)) },
    { stage: 'Interested', value: Math.round(visitors * randomFloat(0.35, 0.50)) },
    { stage: 'Intent', value: Math.round(visitors * randomFloat(0.20, 0.30)) },
    { stage: 'Converted', value: Math.round(visitors * randomFloat(0.10, 0.20)) }
  ];
}

/**
 * Generate entries/exits data for bar charts (by day)
 * @param {number} days - Number of days of data
 * @returns {Array} Array of { day, entries, exits } objects
 */
export function generateChartEntriesExitsData(days = 7) {
  if (!MOCK_DATA_ENABLED) return [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const data = [];

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dayIndex = date.getDay();
    const dayMultiplier = DAY_PATTERN[dayIndex];

    const baseValue = Math.round(2500 * dayMultiplier * randomFloat(0.85, 1.15));
    data.push({
      day: dayNames[dayIndex],
      entries: Math.round(baseValue * randomFloat(0.48, 0.52)),
      exits: Math.round(baseValue * randomFloat(0.48, 0.52))
    });
  }

  return data;
}

// ============================================
// EXPORT ALL GENERATORS
// ============================================

export default {
  MOCK_DATA_ENABLED,
  ZONES,
  generateTimeSeriesData,
  generateKPIs,
  generateZoneData,
  generateDwellTimeData,
  generateEntriesExitsData,
  generateOccupancyData,
  generateQueueData,
  generateConversionData,
  generateAlerts,
  generateHourlyBreakdown,
  generateDailySummary,
  disableMockData,
  // Chart-ready formatters
  generateChartTimeSeriesData,
  generateChartZoneData,
  generateChartDwellTimeData,
  generateChartConversionData,
  generateChartEntriesExitsData
};
