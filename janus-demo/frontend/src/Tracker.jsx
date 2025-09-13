import { useEffect, useRef, useState } from "react";

const ZONES=[{id:"queue",x:0.55,y:0.55,w:0.4,h:0.4},{id:"entrance",x:0.05,y:0.55,w:0.25,h:0.4}];

function rainbow(id){ const h=(id*57)%360; return `hsl(${h} 90% 55%)`; }
function inZone(o,z){const cx=o.x+o.w/2, cy=o.y+o.h/2; return cx>z.x&&cx<z.x+z.w&&cy>z.y&&cy<z.y+z.h;}

export default function Tracker(){
  const videoRef=useRef(null), canvasRef=useRef(null);
  const heatRef=useRef(null);
  const trailsRef=useRef(new Map());
  const [useProcedural,setUseProcedural]=useState(true);
  const [tracks,setTracks]=useState(null);
  const [status,setStatus]=useState("init");

  // Try to load /tracks.json (optional). If found, use it; else use procedural paths.
  useEffect(()=>{ fetch("/tracks.json").then(r=>r.ok?r.json():null).then(j=>{ if(j){ setTracks(j); setUseProcedural(false);} }).catch(()=>{}); },[]);

  useEffect(()=>{
    const canvas=canvasRef.current; const ctx=canvas.getContext("2d");
    const heat=heatRef.current=document.createElement("canvas");
    heat.width=1920; heat.height=1080; const hctx=heat.getContext("2d");
    let stop=false;

    function sizeFromVideo(){
      const vid=videoRef.current;
      const W=vid&&vid.videoWidth? vid.videoWidth:1280;
      const H=vid&&vid.videoHeight? vid.videoHeight:720;
      canvas.width=W; canvas.height=H;
      canvas.style.width="100%";
      return {W,H};
    }

    function objsAt(t){
      if(!useProcedural && tracks?.fps && Array.isArray(tracks.frames)){
        const i=Math.min(tracks.frames.length-1, Math.max(0, Math.round(t*tracks.fps)));
        return tracks.frames[i]?.objects||[];
      }
      // Procedural: 6 actors moving on smooth loops (normalized coords)
      const n=6, objs=[];
      for(let i=0;i<n;i++){
        const cx=0.5+0.35*Math.cos(0.3*t+i*1.3);
        const cy=0.5+0.35*Math.sin(0.27*t+i*1.1);
        const w=0.08, h=0.16;
        objs.push({id:i+1, x:cx-w/2, y:cy-h/2, w, h});
      }
      return objs;
    }

    function draw(){
      if(stop) return;
      const {W,H}=sizeFromVideo();
      const vid=videoRef.current;
      const hasVideo = vid && vid.readyState>=2;
      setStatus(hasVideo? "video":"simulated");

      // Background (video behind; canvas for overlays)
      if(!hasVideo){
        const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,"#0f172a"); g.addColorStop(1,"#1f2937");
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      } else {
        ctx.clearRect(0,0,W,H);
      }

      // Zones
      ctx.lineWidth=2;
      ZONES.forEach(z=>{
        ctx.strokeStyle="rgba(255,165,0,0.9)";
        ctx.fillStyle="rgba(255,165,0,0.08)";
        ctx.fillRect(z.x*W, z.y*H, z.w*W, z.h*H);
        ctx.strokeRect(z.x*W, z.y*H, z.w*W, z.h*H);
        ctx.fillStyle="#fff"; ctx.font="12px system-ui"; ctx.fillText(z.id, z.x*W+6, z.y*H+16);
      });

      const t = hasVideo? vid.currentTime : performance.now()/1000;
      const objs = objsAt(t);

      // Draw detections, trails, and heat
      let inQueue=0;
      const radius=18;
      const hctx=heat.getContext("2d");
      objs.forEach(o=>{
        const box={x:o.x*W,y:o.y*H,w:o.w*W,h:o.h*H};
        // Heatmap splat
        const grd=hctx.createRadialGradient(box.x+box.w/2, box.y+box.h/2, 0, box.x+box.w/2, box.y+box.h/2, radius);
        grd.addColorStop(0,"rgba(255,0,0,0.022)"); grd.addColorStop(1,"rgba(255,0,0,0)");
        hctx.fillStyle=grd; hctx.beginPath(); hctx.arc(box.x+box.w/2, box.y+box.h/2, radius, 0, Math.PI*2); hctx.fill();

        // Box + label
        ctx.strokeStyle=rainbow(o.id); ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(box.x, box.y-18, 58, 18);
        ctx.fillStyle="#fff"; ctx.font="12px system-ui"; ctx.fillText(`ID ${o.id}`, box.x+6, box.y-5);

        // Trails
        const m=trailsRef.current; const arr=m.get(o.id)||[];
        arr.push({x:box.x+box.w/2, y:box.y+box.h}); if(arr.length>120) arr.shift(); m.set(o.id,arr);
        ctx.beginPath(); ctx.strokeStyle=rainbow(o.id);
        arr.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();

        if(inZone(o, ZONES[0])) inQueue++;
      });

      // Heatmap composite
      ctx.globalAlpha=0.6; ctx.drawImage(heat,0,0,W,H); ctx.globalAlpha=1;

      // HUD
      ctx.fillStyle="rgba(0,0,0,0.55)"; ctx.fillRect(8,8,260,64);
      ctx.fillStyle="#fff"; ctx.font="12px system-ui";
      ctx.fillText(`Mode: ${status}`, 16, 26);
      ctx.fillText(`People in frame: ${objs.length}`, 16, 44);
      ctx.fillText(`In queue zone: ${inQueue}`, 136, 44);

      requestAnimationFrame(draw);
    }

    const raf = requestAnimationFrame(draw);
    return ()=>{ cancelAnimationFrame(raf); stop=true; };
  },[useProcedural, tracks, status]);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <strong>Tracker</strong>
        <button onClick={()=>setUseProcedural(s=>!s)}>{useProcedural? "Switch to tracks.json (if present)":"Use procedural"}</button>
        <span style={{fontSize:12,opacity:0.7}}>Put your video at <code>frontend/public/demo.mp4</code> (falls back to simulation).</span>
      </div>
      <div style={{position:"relative",width:"100%",maxWidth:1200}}>
        <video ref={videoRef} src="/demo.mp4" autoPlay loop muted playsInline style={{width:"100%",display: status==="video"?"block":"none"}} />
        <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} />
      </div>
    </div>
  );
}