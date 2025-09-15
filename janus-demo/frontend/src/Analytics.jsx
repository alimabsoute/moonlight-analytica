import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getKpis, getSeriesCsv, parseSeries, seedDemo } from './api';

export default function Analytics(){
  const [hours, setHours] = useState(0.167); // 10 minutes default
  const [kpis, setKpis] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const chartData = useMemo(() => {
    return series.map(d => ({ ...d, count_value: Number(d.count_value) }));
  }, [series]);

  async function reload(){
    try{
      setLoading(true); setError(null);
      const [k, t] = await Promise.all([getKpis(hours), getSeriesCsv(hours)]);
      setKpis(k);
      setSeries(parseSeries(t));
    }catch(e){
      setError(String(e?.message || e));
    }finally{
      setLoading(false);
    }
  }

  async function onResetDemo(){
    try{
      setLoading(true); setError(null);
      await seedDemo();
      await reload();
    }catch(e){
      setError(String(e?.message || e));
    }finally{
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [hours]);

  useEffect(() => {
    if(!autoRefresh) return;
    const id = setInterval(reload, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, hours]);

  return (
    <div style={{padding:16}}>
      {error ? (
        <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b',padding:10,borderRadius:8,marginBottom:12}}>
          <strong>Failed to fetch analytics.</strong>
          <button onClick={reload} style={{marginLeft:8,padding:'4px 10px',borderRadius:6,border:'1px solid #e5e7eb'}}>Retry</button>
        </div>
      ) : null}

      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <h2 style={{margin:'0 0 4px'}}>📊 Analytics</h2>
          <small>View KPIs and time series. Auto-refresh to watch live updates.</small>
        </div>

        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label>
            Range:{' '}
            <select value={hours} onChange={e=>setHours(+e.target.value)}>
              <option value={0.167}>Last 10min</option>
              <option value={24}>Last 24h</option>
              <option value={168}>Last 7d</option>
              <option value={720}>Last 30d</option>
            </select>
          </label>

          <button onClick={reload} disabled={loading} style={{padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:8}}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>

          <label style={{display:'inline-flex',alignItems:'center',gap:6,border:'1px solid #e5e7eb',padding:'6px 10px',borderRadius:8}}>
            <input type='checkbox' checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} />
            Auto-refresh (5s)
          </label>

          <button onClick={onResetDemo} disabled={loading} style={{padding:'6px 10px',border:'1px solid #ef4444',color:'#ef4444',borderRadius:8}}>
            Reset Demo Data
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,marginBottom:12}}>
        {kpis ? Object.entries(kpis).slice(0,4).map(([k,v])=>(
          <div key={k} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:12}}>
            <div style={{fontSize:12,color:'#6b7280',textTransform:'uppercase'}}>{k}</div>
            <div style={{fontSize:22,fontWeight:700}}>{String(v)}</div>
          </div>
        )) : Array.from({length:4}).map((_,i)=>(
          <div key={i} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:12,opacity:0.6}}>
            <div style={{fontSize:12,color:'#6b7280'}}>loading…</div>
            <div style={{fontSize:22,fontWeight:700}}>-</div>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div style={{height:360,background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:8}}>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='timestamp' minTickGap={24} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type='monotone' dataKey='count_value' dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}