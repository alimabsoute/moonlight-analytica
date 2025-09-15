const API_BASE = 'http://localhost:8000';

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

export async function getKpis(hours){
  const h = hours!=null ? `?hours=${hours}` : '';
  const res = await fetchWithRetry(`${API_BASE}/kpis${h}`);
  return res.json();
}

export async function getSeriesCsv(hours){
  const h = hours!=null ? `?hours=${hours}` : '';
  const res = await fetchWithRetry(`${API_BASE}/series.csv${h}`);
  return res.text();
}

export function parseSeries(csvText){
  // very light CSV -> array parsing
  const [header, ...rows] = csvText.trim().split(/\r?\n/);
  const cols = header.split(',');
  return rows.map(r=>{
    const parts = r.split(',');
    const obj = {};
    cols.forEach((c,i)=>obj[c]=parts[i]);
    return obj;
  });
}