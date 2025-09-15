import { useState, useEffect } from "react";
import { useHashTabs } from "./useHashTabs";
import Analytics from "./Analytics";
import Tracker from "./Tracker";
import "./App.css";

const API_BASE = "http://localhost:8000";

export default function App(){
  const [tab, setTab] = useHashTabs("tracker");
  const [sessions,setSessions]=useState([]);
  const [currentSession,setCurrentSession]=useState(null);
  const [counts,setCounts]=useState([]);
  const [newSessionName,setNewSessionName]=useState("");
  const [currentCount,setCurrentCount]=useState(0);
  const [isLoading,setIsLoading]=useState(false);

  useEffect(()=>{ fetchSessions(); }, []);
  useEffect(()=>{ if(currentSession){ fetchCounts(currentSession.id); } }, [currentSession]);

  const fetchSessions = async ()=>{
    const r = await fetch(`${API_BASE}/sessions`); setSessions(await r.json());
  };
  const fetchCounts = async (sid)=>{
    const r = await fetch(`${API_BASE}/sessions/${sid}/counts`);
    const data = await r.json();
    setCounts(data);
    setCurrentCount(data.length ? data[data.length-1].value : 0);
  };
  const createSession = async ()=>{
    if(!newSessionName.trim()) return;
    setIsLoading(true);
    const r = await fetch(`${API_BASE}/sessions`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newSessionName})});
    const s = await r.json();
    setSessions([s,...sessions]); setNewSessionName(""); setCurrentSession(s); setIsLoading(false);
  };
  const addCount = async (inc)=>{
    if(!currentSession) return;
    const newVal = Math.max(0, currentCount + inc);
    await fetch(`${API_BASE}/sessions/${currentSession.id}/counts`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({count_value:newVal})});
    setCurrentCount(newVal);
    fetchCounts(currentSession.id);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 Project Janus</h1>
        <p>Video tracking demo + counting + analytics</p>
        <div style={{marginTop:12}}>
          <button onClick={() => { location.hash = "#tracker"; }} style={{marginRight:8, padding:"6px 12px", borderRadius:8, border:"1px solid #e5e7eb", background: tab==="tracker"?"#fff":"#f3f4f6"}} id="tab-tracker">Tracker</button>
          <button onClick={() => { location.hash = "#counter"; }} style={{marginRight:8, padding:"6px 12px", borderRadius:8, border:"1px solid #e5e7eb", background: tab==="counter"?"#fff":"#f3f4f6"}} id="tab-counter">Counter</button>
          <button onClick={() => { location.hash = "#analytics"; }} style={{padding:"6px 12px", borderRadius:8, border:"1px solid #e5e7eb", background: tab==="analytics"?"#fff":"#f3f4f6"}} id="tab-analytics">Analytics</button>
        </div>
      </header>

      {tab==="tracker" && (
        <div style={{maxWidth:1200, margin:"0 auto", padding:"16px"}}>
          <Tracker />
        </div>
      )}

      {tab==="analytics" && (
        <div style={{maxWidth:1200, margin:"0 auto", padding:"16px"}}>
          <Analytics />
        </div>
      )}

      {tab==="counter" && (
        <div className="main-content">
          <div className="session-panel">
            <h2>Sessions</h2>
            <div className="session-creator">
              <input type="text" placeholder="New session name..." value={newSessionName} onChange={e=>setNewSessionName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createSession()} />
              <button onClick={createSession} disabled={isLoading}>{isLoading? "Creating...":"Create Session"}</button>
            </div>
            <div className="session-list">
              {sessions.map(s=>(
                <div key={s.id} className={`session-item ${currentSession?.id===s.id?'active':''}`} onClick={()=>setCurrentSession(s)}>
                  <strong>{s.name}</strong>
                  <small>{new Date(s.created_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="counter-panel">
            {currentSession ? (
              <>
                <h2>Counter: {currentSession.name}</h2>
                <div className="counter-display"><div className="count-value">{currentCount}</div></div>
                <div className="counter-controls">
                  <button onClick={()=>addCount(-1)} className="btn-decrement">-1</button>
                  <button onClick={()=>addCount(-10)} className="btn-decrement">-10</button>
                  <button onClick={()=>addCount(1)} className="btn-increment">+1</button>
                  <button onClick={()=>addCount(10)} className="btn-increment">+10</button>
                </div>
                <div className="count-history">
                  <h3>Recent Counts ({counts.length} total)</h3>
                  <div className="history-list">
                    {counts.slice(-10).reverse().map((c,i)=>(
                      <div key={i} className="history-item">
                        <span className="count">{c.value}</span>
                        <span className="time">{new Date(c.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="no-session">
                <h2>No Session Selected</h2>
                <p>Create or select a session to start counting</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}