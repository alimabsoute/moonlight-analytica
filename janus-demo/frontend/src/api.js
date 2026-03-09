export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
async function fetchWithRetry(url, opts={}, tries=3, backoff=[300,800,1500]){
  let lastErr;
  for (let i=0;i<tries;i++){
    try{
      const res = await fetch(url,{mode:'cors',...opts});
      if(!res.ok) throw new Error('HTTP '+res.status);
      return res;
    }catch(err){
      lastErr = err;
      if(i < tries-1) await sleep(backoff[Math.min(i, backoff.length-1)]);
    }
  }
  throw lastErr;
}

function buildParams(hours, source) {
  const p = new URLSearchParams();
  if (hours != null) p.set('hours', hours);
  if (source && source !== 'all') p.set('source', source);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export async function getKpis(hours, source){
  const qs = buildParams(hours, source);

  try {
    const res = await fetch(`${API_BASE}/kpis${qs}`, {mode:'cors'});
    const data = await res.json();

    // Handle 404 or error responses
    if (!res.ok || data.error) {
      return {
        current_count: 0,
        avg_count: 0,
        peak_count: 0,
        total_events: 0,
        throughput: 0
      };
    }

    // Map backend fields to frontend expected fields
    return {
      current_count: data.avg_people || 0,
      avg_count: data.avg_people || 0,
      peak_count: data.peak_people || 0,
      total_events: data.throughput || 0,
      throughput: data.throughput || 0
    };
  } catch (err) {
    // Return zeros on network error
    return {
      current_count: 0,
      avg_count: 0,
      peak_count: 0,
      total_events: 0,
      throughput: 0
    };
  }
}

export async function getSeriesCsv(hours, source){
  const qs = buildParams(hours, source);
  const res = await fetchWithRetry(`${API_BASE}/series.csv${qs}`);
  return res.text();
}

export async function seedDemo(){
  const res = await fetchWithRetry(`${API_BASE}/seed_demo`, { method: 'POST' });
  return res.json();
}

export function parseSeries(csvText){
  const [header, ...rows] = csvText.trim().split(/\r?\n/);
  const cols = header.split(',');
  return rows.map(r=>{
    const parts = r.split(',');
    const obj = {};
    cols.forEach((c,i)=>{
      const val = parts[i];
      // Parse numbers for count_value, peak, throughput
      if(c === 'count_value' || c === 'peak' || c === 'throughput'){
        obj[c] = parseFloat(val) || 0;
      } else {
        obj[c] = val;
      }
    });
    // Add 'ts' as alias for 'timestamp' for backwards compatibility
    if (obj.timestamp) {
      obj.ts = obj.timestamp;
    }
    return obj;
  });
}

export async function postCount(value){
  const res = await fetchWithRetry(`${API_BASE}/count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count_value: value })
  });
  return res.json();
}

export async function health(){
  const res = await fetchWithRetry(`${API_BASE}/health`);
  return res.json();
}

// New Analytics Endpoints
export async function getDwellTime(hours, source){
  const qs = buildParams(hours, source);
  try {
    const res = await fetch(`${API_BASE}/api/dwell-time${qs}`, {mode:'cors'});
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getOccupancy(){
  try {
    const res = await fetch(`${API_BASE}/api/occupancy`, {mode:'cors'});
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getEntriesExits(hours, source){
  const qs = buildParams(hours, source);
  try {
    const res = await fetch(`${API_BASE}/api/entries-exits${qs}`, {mode:'cors'});
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getConversion(hours, source){
  const qs = buildParams(hours, source);
  try {
    const res = await fetch(`${API_BASE}/api/conversion${qs}`, {mode:'cors'});
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getZones(hours, source){
  const qs = buildParams(hours, source);
  try {
    const res = await fetch(`${API_BASE}/api/zones${qs}`, {mode:'cors'});
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getQueue(hours, source){
  const qs = buildParams(hours, source);
  try {
    const res = await fetch(`${API_BASE}/api/queue${qs}`, {mode:'cors'});
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Batch Processing Endpoints
export async function getBatchJobs(){
  try {
    const res = await fetch(`${API_BASE}/api/batch/jobs`, {mode:'cors'});
    if (!res.ok) return { jobs: [] };
    return res.json();
  } catch { return { jobs: [] }; }
}

export async function startBatchJob(videoId, model='yolo11l.pt', tracker='botsort_tuned.yaml'){
  const res = await fetchWithRetry(`${API_BASE}/api/batch/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_id: videoId, model, tracker })
  });
  return res.json();
}

export async function clearBatchResults(videoId){
  const res = await fetchWithRetry(`${API_BASE}/api/batch/results/${videoId}`, {
    method: 'DELETE'
  });
  return res.json();
}