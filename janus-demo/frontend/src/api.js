export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const getKpis = (hours=168)=> fetch(`${API_BASE}/kpis?hours=${hours}`).then(r=>r.json());
export const getSeriesCsv = (hours=168)=> fetch(`${API_BASE}/series.csv?hours=${hours}`).then(r=>r.text());
export const parseSeries = (csv)=> csv.trim().split('\n').slice(1).map(line=>{ const [hour,avg,peak,throughput]=line.split(','); return {hour, avg:+avg, peak:+peak, throughput:+throughput}; });