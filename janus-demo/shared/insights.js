/**
 * Auto-Generated Insights System
 * Rule-based insight generation for charts and KPIs
 */

// ============================================
// INSIGHT TEMPLATES
// ============================================

const INSIGHT_TEMPLATES = {
  comparison: [
    '{value}% {direction} than yesterday at this time',
    '{value}% {direction} compared to last week average',
    'Performing {value}% {better_worse} than typical {day}',
    '{metric} is {value}% {direction} vs. 7-day rolling average',
    'Currently {value}% {above_below} the monthly baseline'
  ],
  anomaly: [
    'Unusual {spike_drop} detected at {time} - {value}% deviation',
    'Significant {direction} trend starting around {time}',
    'Pattern break detected: {metric} {direction} by {value}%',
    'Unexpected {activity} in {zone} zone at {time}',
    'Alert: {metric} exceeded threshold by {value}%'
  ],
  prediction: [
    'At current rate, expected to reach {value} by {time}',
    'Projected to hit capacity in approximately {time}',
    'Peak traffic predicted around {time} today',
    'Trend suggests {value}% {direction} by end of day',
    'Forecast indicates {peak_low} activity between {time}'
  ],
  recommendation: [
    'Consider adjusting staffing for {zone} zone',
    'Opportunity to improve {metric} through {action}',
    'Recommend monitoring {zone} closely during {time}',
    'Suggest rebalancing traffic flow via {action}',
    'Action needed: {metric} requires attention'
  ],
  trend: [
    'Steady {direction} trend over past {period}',
    '{metric} showing consistent {pattern} pattern',
    'Week-over-week {direction} of {value}%',
    'Strong {direction} momentum in {metric}',
    '{period} average trending {direction} by {value}%'
  ],
  achievement: [
    'New daily high: {metric} reached {value}',
    'Best {period} performance: {value} achieved',
    '{metric} surpassed target by {value}%',
    'Record {timeframe}: {value} in {metric}',
    'Milestone reached: {value} total {metric}'
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const TIMES = ['9:00 AM', '10:30 AM', '11:45 AM', '12:15 PM', '1:30 PM', '2:45 PM', '3:15 PM', '4:30 PM', '5:00 PM'];
const ZONES = ['Entrance', 'Main Floor', 'Checkout', 'Electronics', 'Groceries'];
const PERIODS = ['hour', '2 hours', '3 hours', 'morning', 'afternoon'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ACTIONS = ['entrance optimization', 'queue management', 'zone rebalancing', 'staff reallocation'];

/**
 * Fill template with random values
 */
function fillTemplate(template, overrides = {}) {
  const values = {
    value: random(5, 35),
    direction: pickRandom(['higher', 'lower', 'up', 'down']),
    better_worse: pickRandom(['better', 'worse']),
    above_below: pickRandom(['above', 'below']),
    spike_drop: pickRandom(['spike', 'drop']),
    activity: pickRandom(['high activity', 'low activity', 'unusual traffic']),
    time: pickRandom(TIMES),
    zone: pickRandom(ZONES),
    metric: pickRandom(['Traffic', 'Occupancy', 'Dwell time', 'Conversion', 'Queue length']),
    period: pickRandom(PERIODS),
    day: pickRandom(DAYS),
    pattern: pickRandom(['upward', 'downward', 'cyclical', 'stable']),
    peak_low: pickRandom(['peak', 'low']),
    action: pickRandom(ACTIONS),
    timeframe: pickRandom(['hourly', 'daily', 'weekly']),
    ...overrides
  };

  let result = template;
  Object.entries(values).forEach(([key, val]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
  });

  return result;
}

// ============================================
// INSIGHT GENERATORS
// ============================================

/**
 * Generate insights for traffic trend charts
 */
export function generateTrafficInsights(data = [], count = 2) {
  const insights = [];
  const types = ['comparison', 'trend', 'prediction'];

  // Calculate basic stats from data if available
  let peak = null;
  let avg = 0;
  if (data.length > 0) {
    const values = data.map(d => d.count || d.visitors || d.value || 0);
    peak = Math.max(...values);
    avg = values.reduce((a, b) => a + b, 0) / values.length;
  }

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const template = pickRandom(INSIGHT_TEMPLATES[type]);
    const overrides = peak ? {
      value: Math.round((peak / avg - 1) * 100) || random(5, 25)
    } : {};
    insights.push({
      type,
      text: fillTemplate(template, overrides),
      icon: type === 'comparison' ? 'TrendingUp' : type === 'prediction' ? 'Target' : 'Activity'
    });
  }

  return insights;
}

/**
 * Generate insights for zone/heatmap charts
 */
export function generateZoneInsights(zoneData = [], count = 2) {
  const insights = [];

  if (zoneData.length > 0) {
    // Find most and least utilized zones
    const sorted = [...zoneData].sort((a, b) => (b.utilization || 0) - (a.utilization || 0));
    const hotZone = sorted[0];
    const coldZone = sorted[sorted.length - 1];

    if (hotZone && hotZone.zone) {
      insights.push({
        type: 'observation',
        text: `${hotZone.zone} is the busiest area at ${hotZone.utilization}% capacity`,
        icon: 'Flame'
      });
    }

    if (coldZone && coldZone.zone && insights.length < count) {
      insights.push({
        type: 'recommendation',
        text: `${coldZone.zone} underutilized - consider traffic redistribution`,
        icon: 'Lightbulb'
      });
    }
  }

  // Fill remaining with generated insights
  while (insights.length < count) {
    const template = pickRandom(INSIGHT_TEMPLATES.recommendation);
    insights.push({
      type: 'recommendation',
      text: fillTemplate(template),
      icon: 'Lightbulb'
    });
  }

  return insights;
}

/**
 * Generate insights for dwell time charts
 */
export function generateDwellInsights(count = 2) {
  const insights = [];
  const avgDwell = randomFloat(6, 14);

  insights.push({
    type: 'observation',
    text: `Average dwell time is ${avgDwell} minutes - ${avgDwell > 10 ? 'above' : 'below'} industry benchmark`,
    icon: 'Clock'
  });

  if (count > 1) {
    const bounceRate = random(12, 28);
    insights.push({
      type: bounceRate > 20 ? 'warning' : 'achievement',
      text: `Bounce rate at ${bounceRate}% - ${bounceRate > 20 ? 'consider entrance optimization' : 'performing well'}`,
      icon: bounceRate > 20 ? 'AlertTriangle' : 'CheckCircle'
    });
  }

  return insights;
}

/**
 * Generate insights for conversion funnel
 */
export function generateConversionInsights(funnelData = [], count = 2) {
  const insights = [];

  if (funnelData.length >= 2) {
    const topStage = funnelData[0];
    const bottomStage = funnelData[funnelData.length - 1];
    const overallRate = Math.round((bottomStage.value / topStage.value) * 100);

    insights.push({
      type: 'observation',
      text: `Overall conversion rate: ${overallRate}% from ${topStage.stage} to ${bottomStage.stage}`,
      icon: 'Target'
    });

    // Find biggest drop-off
    let maxDrop = 0;
    let dropStage = '';
    for (let i = 0; i < funnelData.length - 1; i++) {
      const drop = 1 - (funnelData[i + 1].value / funnelData[i].value);
      if (drop > maxDrop) {
        maxDrop = drop;
        dropStage = funnelData[i].stage;
      }
    }

    if (maxDrop > 0 && insights.length < count) {
      insights.push({
        type: 'recommendation',
        text: `Largest drop-off at ${dropStage} stage (${Math.round(maxDrop * 100)}%) - focus optimization here`,
        icon: 'AlertTriangle'
      });
    }
  }

  while (insights.length < count) {
    insights.push({
      type: 'trend',
      text: fillTemplate(pickRandom(INSIGHT_TEMPLATES.trend)),
      icon: 'TrendingUp'
    });
  }

  return insights;
}

/**
 * Generate insights for comparison charts
 */
export function generateComparisonInsights(count = 2) {
  return Array(count).fill(null).map(() => {
    const template = pickRandom(INSIGHT_TEMPLATES.comparison);
    return {
      type: 'comparison',
      text: fillTemplate(template),
      icon: 'BarChart2'
    };
  });
}

/**
 * Generate insights for KPI cards
 */
export function generateKPIInsight(kpi, value, trend) {
  const direction = trend > 0 ? 'up' : 'down';
  const magnitude = Math.abs(trend);

  if (magnitude > 15) {
    return {
      type: 'anomaly',
      text: `Significant ${direction}ward movement (${magnitude}%) - requires attention`,
      icon: 'AlertTriangle'
    };
  } else if (magnitude > 5) {
    return {
      type: 'trend',
      text: `Trending ${direction} ${magnitude}% vs. previous period`,
      icon: direction === 'up' ? 'TrendingUp' : 'TrendingDown'
    };
  } else {
    return {
      type: 'stable',
      text: 'Stable within normal range',
      icon: 'CheckCircle'
    };
  }
}

/**
 * Generate daily summary insights
 */
export function generateDailySummary() {
  const insights = [];

  // Key finding
  insights.push({
    type: 'highlight',
    text: `Peak traffic at ${pickRandom(TIMES)} with ${random(150, 400)} visitors`,
    icon: 'Star',
    priority: 'high'
  });

  // Performance indicator
  const performance = random(-15, 25);
  insights.push({
    type: performance > 0 ? 'achievement' : 'warning',
    text: `Overall performance ${Math.abs(performance)}% ${performance > 0 ? 'above' : 'below'} target`,
    icon: performance > 0 ? 'TrendingUp' : 'TrendingDown',
    priority: 'high'
  });

  // Recommendation
  insights.push({
    type: 'recommendation',
    text: fillTemplate(pickRandom(INSIGHT_TEMPLATES.recommendation)),
    icon: 'Lightbulb',
    priority: 'medium'
  });

  // Prediction
  insights.push({
    type: 'prediction',
    text: fillTemplate(pickRandom(INSIGHT_TEMPLATES.prediction)),
    icon: 'Compass',
    priority: 'medium'
  });

  // Additional observation
  insights.push({
    type: 'observation',
    text: `${pickRandom(ZONES)} zone showing ${random(10, 30)}% increased engagement`,
    icon: 'Eye',
    priority: 'low'
  });

  return insights;
}

/**
 * Generate performance score (0-100)
 */
export function generatePerformanceScore() {
  const baseScore = random(65, 95);

  const breakdown = {
    traffic: random(60, 100),
    conversion: random(50, 95),
    engagement: random(55, 98),
    efficiency: random(45, 90),
    satisfaction: random(70, 99)
  };

  const avgBreakdown = Object.values(breakdown).reduce((a, b) => a + b, 0) / 5;

  return {
    overall: Math.round((baseScore + avgBreakdown) / 2),
    breakdown,
    trend: randomFloat(-5, 10),
    grade: baseScore >= 90 ? 'A' : baseScore >= 80 ? 'B' : baseScore >= 70 ? 'C' : 'D'
  };
}

/**
 * Main insight generator for any chart type
 */
export function generateInsight(chartType, data = [], count = 2) {
  switch (chartType) {
    case 'traffic':
    case 'line':
    case 'area':
      return generateTrafficInsights(data, count);
    case 'zone':
    case 'heatmap':
    case 'radar':
      return generateZoneInsights(data, count);
    case 'dwell':
    case 'pie':
      return generateDwellInsights(count);
    case 'funnel':
    case 'conversion':
      return generateConversionInsights(data, count);
    case 'comparison':
    case 'bar':
      return generateComparisonInsights(count);
    default:
      return generateTrafficInsights(data, count);
  }
}

export default {
  generateInsight,
  generateTrafficInsights,
  generateZoneInsights,
  generateDwellInsights,
  generateConversionInsights,
  generateComparisonInsights,
  generateKPIInsight,
  generateDailySummary,
  generatePerformanceScore
};
