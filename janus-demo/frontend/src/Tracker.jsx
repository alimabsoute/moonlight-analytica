import { useEffect, useRef, useState } from "react";

export default function Tracker(){
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Starting...");
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedCounts, setRecordedCounts] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    canvas.width = 1200;
    canvas.height = 600;
    
    let animationId;
    let startTime = Date.now();
    let lastRecordTime = Date.now();
    setIsRunning(true);
    
    // Trail system - store position history for each object
    const trails = [];
    const maxTrailLength = 30; // Shorter trails for faster movement
    
    // Random movement system for each object
    const objects = [];
    
    // Initialize trails and random movement for each object
    for(let i = 0; i < 6; i++) {
      trails[i] = [];
      objects[i] = {
        x: Math.random() * (canvas.width - 100) + 50,
        y: Math.random() * (canvas.height - 100) + 50,
        vx: (Math.random() - 0.5) * 8, // Random velocity X (-4 to +4 pixels/frame)
        vy: (Math.random() - 0.5) * 8, // Random velocity Y (-4 to +4 pixels/frame)
        dirChangeTime: Math.random() * 60 + 30 // Change direction every 30-90 frames
      };
    }
    
    // Function to record count data to backend
    const recordCount = async (count) => {
      try {
        const response = await fetch('http://localhost:8000/count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count })
        });
        if (response.ok) {
          setRecordedCounts(prev => prev + 1);
        }
      } catch (error) {
        console.error('Failed to record count:', error);
      }
    };
    
    function drawFrame() {
      const t = (Date.now() - startTime) / 1000; // time in seconds
      
      // Clear canvas with dark background
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw zones (queue and entrance areas)
      ctx.strokeStyle = "rgba(255,165,0,0.8)";
      ctx.fillStyle = "rgba(255,165,0,0.1)";
      ctx.lineWidth = 2;
      
      // Queue zone
      const queueX = canvas.width * 0.55;
      const queueY = canvas.height * 0.55;
      const queueW = canvas.width * 0.4;
      const queueH = canvas.height * 0.4;
      ctx.fillRect(queueX, queueY, queueW, queueH);
      ctx.strokeRect(queueX, queueY, queueW, queueH);
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.fillText("QUEUE ZONE", queueX + 10, queueY + 25);
      
      // Entrance zone  
      const entranceX = canvas.width * 0.05;
      const entranceY = canvas.height * 0.55;
      const entranceW = canvas.width * 0.25;
      const entranceH = canvas.height * 0.4;
      ctx.fillStyle = "rgba(255,165,0,0.1)";
      ctx.fillRect(entranceX, entranceY, entranceW, entranceH);
      ctx.strokeRect(entranceX, entranceY, entranceW, entranceH);
      ctx.fillStyle = "white";
      ctx.fillText("ENTRANCE", entranceX + 10, entranceY + 25);
      
      // Draw 6 moving objects with trails
      const numObjects = 6;
      let inQueue = 0;
      
      for(let i = 0; i < numObjects; i++) {
        // Random erratic movement for each object
        const obj = objects[i];
        
        // Randomly change direction occasionally
        if (Math.random() < 0.02) { // 2% chance each frame
          obj.vx = (Math.random() - 0.5) * 10; // Even faster random velocity
          obj.vy = (Math.random() - 0.5) * 10;
        }
        
        // Update position with velocity
        obj.x += obj.vx;
        obj.y += obj.vy;
        
        // Bounce off walls with some randomness
        if (obj.x < 30 || obj.x > canvas.width - 30) {
          obj.vx = -obj.vx * (0.8 + Math.random() * 0.4); // Random bounce factor
          obj.vx += (Math.random() - 0.5) * 3; // Add random component
        }
        if (obj.y < 30 || obj.y > canvas.height - 30) {
          obj.vy = -obj.vy * (0.8 + Math.random() * 0.4);
          obj.vy += (Math.random() - 0.5) * 3;
        }
        
        // Keep objects in bounds
        obj.x = Math.max(30, Math.min(canvas.width - 30, obj.x));
        obj.y = Math.max(30, Math.min(canvas.height - 30, obj.y));
        
        const x = obj.x;
        const y = obj.y;
        
        // Add current position to trail
        trails[i].push({ x, y, time: t });
        
        // Keep trail length manageable
        if (trails[i].length > maxTrailLength) {
          trails[i].shift();
        }
        
        // Object color based on ID
        const hue = (i * 60) % 360;
        
        // Draw trail first (behind the object)
        if (trails[i].length > 1) {
          ctx.strokeStyle = "hsl(" + hue + ", 60%, 40%)";
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.6;
          
          ctx.beginPath();
          ctx.moveTo(trails[i][0].x, trails[i][0].y);
          
          for (let j = 1; j < trails[i].length; j++) {
            const alpha = j / trails[i].length; // Fade trail
            ctx.globalAlpha = 0.3 + (alpha * 0.3);
            ctx.lineTo(trails[i][j].x, trails[i][j].y);
          }
          
          ctx.stroke();
          ctx.globalAlpha = 1.0; // Reset alpha
        }
        
        // Draw object (on top of trail)
        ctx.fillStyle = "hsl(" + hue + ", 80%, 60%)";
        ctx.strokeStyle = "hsl(" + hue + ", 80%, 50%)";
        
        // Draw bounding box
        const boxW = 40;
        const boxH = 60;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - boxW/2, y - boxH/2, boxW, boxH);
        
        // Draw small circle for the actual object
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw ID label
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(x - boxW/2, y - boxH/2 - 20, 30, 18);
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.fillText("ID " + (i+1), x - boxW/2 + 2, y - boxH/2 - 6);
        
        // Check if in queue zone
        if (x >= queueX && x <= queueX + queueW && y >= queueY && y <= queueY + queueH) {
          inQueue++;
        }
      }
      
      // Draw HUD
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(10, 10, 300, 120);
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.fillText("🎯 Tracker Status", 20, 30);
      ctx.fillText("Mode: Procedural Simulation", 20, 50);
      ctx.fillText("People in frame: " + numObjects, 20, 70);
      ctx.fillText("In queue zone: " + inQueue, 20, 90);
      ctx.fillText("Recording: " + (isRecording ? "ON" : "OFF"), 20, 110);
      
      // Record data every 2 seconds if recording is enabled
      const now = Date.now();
      if (isRecording && now - lastRecordTime > 2000) {
        recordCount(inQueue);
        lastRecordTime = now;
      }
      
      setStatus("Running - Frame: " + Math.floor(t));
      animationId = requestAnimationFrame(drawFrame);
    }
    
    drawFrame();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      setIsRunning(false);
    };
  }, [isRecording]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🎯 Object Tracker</h2>
      <p>Status: <strong>{status}</strong></p>
      <p>Animation: <strong>{isRunning ? "✅ Running" : "❌ Stopped"}</strong></p>
      <p>Recording: <strong>{isRecording ? "🔴 ON" : "⚫ OFF"}</strong></p>
      <p>Data Points Recorded: <strong>{recordedCounts}</strong></p>
      
      <button 
        onClick={() => setIsRecording(!isRecording)}
        style={{
          padding: "10px 20px",
          margin: "10px 5px",
          backgroundColor: isRecording ? "#dc2626" : "#16a34a",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px"
        }}
      >
        {isRecording ? "🛑 Stop Recording" : "🔴 Start Recording"}
      </button>
      
      <div style={{ 
        border: "2px solid #e5e7eb", 
        borderRadius: "12px", 
        overflow: "hidden", 
        marginTop: "20px",
        maxWidth: "1200px"
      }}>
        <canvas 
          ref={canvasRef}
          style={{ 
            width: "100%", 
            height: "auto", 
            display: "block",
            background: "#1f2937"
          }}
        />
      </div>
      
      <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
        You should see 6 colored objects moving in circles with bounding boxes and ID labels.
        Orange zones show queue and entrance areas.
      </div>
    </div>
  );
}