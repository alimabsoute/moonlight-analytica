import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { getKpis, getSeriesCsv, parseSeries } from "./api";

export default function Analytics(){
  const [kpis,setKpis]=useState(null);
  const [series,setSeries]=useState([]);
  const [hours,setHours]=useState(168);
  const [err,setErr]=useState(null);

  useEffect(()=>{
    Promise.all([getKpis(hours), getSeriesCsv(hours)]).then(([k, csv])=>{
      setKpis(k);
      setSeries(parseSeries(csv));
    }).catch(e=>setErr(String(e)));
  },[hours]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <h2>Analytics</h2>
        <select value={hours} onChange={e=>setHours(+e.target.value)}>
          <option value={0.167}>Last 10min</option>
          <option value={24}>Last 24h</option>
          <option value={168}>Last 7d</option>
          <option value={720}>Last 30d</option>
        </select>
      </div>

      {err && <p style={{color:"#b91c1c"}}>Error: {err}</p>}
      {!kpis && !err && <p>Loading…</p>}

      {kpis && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"12px", marginTop:"12px"}}>
          {[
            ["People Avg", kpis.people_avg],
            ["People Peak", kpis.people_peak],
            ["Throughput (sum)", kpis.throughput_total],
            ["Throughput/hr", kpis.throughput_per_hr]
          ].map(([label,val])=>(
            <div key={label} style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12, background:"#fff"}}>
              <div style={{fontSize:12, color:"#6b7280"}}>{label}</div>
              <div style={{fontSize:24, fontWeight:700}}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{height:360, marginTop:16, background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:12}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avg" name="Avg people" dot={false} />
            <Line type="monotone" dataKey="peak" name="Peak people" dot={false} />
            <Line type="monotone" dataKey="throughput" name="Throughput" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}