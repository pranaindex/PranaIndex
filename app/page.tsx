"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndexOfficial() {
  const [screen, setScreen] = useState('landing');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  
  // Game Performance
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2StartTime, setP2StartTime] = useState(0);
  const [p2TotalTime, setP2TotalTime] = useState(0);
  const [p3Hits, setP3Hits] = useState<number[]>([]); 
  
  // UI States
  const [p1TimeLeft, setP1TimeLeft] = useState(15);
  const [pulseSize, setPulseSize] = useState(0);
  const [pulseDir, setPulseDir] = useState(1);
  const [isTapping, setIsTapping] = useState(false);
  const [p2Count, setP2Count] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  
  // Regulation States
  const [regPhase, setRegPhase] = useState('READY'); 
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycles, setRegCycles] = useState(0);

  // Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const rainAudio = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetPos = useRef({ left: '50%', top: '50%' });

  // --- 1. RAIN ANIMATION ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    let drops: any[] = [];
    for (let i = 0; i < 150; i++) drops.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, l: Math.random() * 25, v: Math.random() * 5 + 3 });
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'; ctx.lineWidth = 1;
      drops.forEach(d => { ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.l); ctx.stroke(); d.y += d.v; if (d.y > canvas.height) d.y = -20; });
      requestAnimationFrame(animate);
    };
    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // --- 2. AUDIO SYSTEM ---
  const startAtmosphere = () => {
    if (!userName.trim()) { alert("Please enter your name first, Ustaad!"); return; }
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.4;
    }
    rainAudio.current.play();
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    setScreen('details');
  };

  const playTone = (f: number, t: OscillatorType, d: number, v = 0.1) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.type = t; o.frequency.setValueAtTime(f, audioCtx.current.currentTime);
    g.gain.setValueAtTime(v, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + d);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + d);
  };

  const playTransitionSound = () => {
    playTone(500, 'sine', 0.1, 0.2);
    setTimeout(() => playTone(900, 'sine', 0.4, 0.2), 100);
  };

  const playRev = (startF: number, endF: number, dur: number, vol: number) => {
    if (!audioCtx.current) return;
    const now = audioCtx.current.currentTime;
    const osc1 = audioCtx.current.createOscillator();
    const gainNode = audioCtx.current.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(startF, now);
    osc1.frequency.exponentialRampToValueAtTime(endF, now + dur);
    gainNode.gain.setValueAtTime(vol, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + dur);
    osc1.connect(gainNode); gainNode.connect(audioCtx.current.destination);
    osc1.start(now); osc1.stop(now + dur);
  };

  // --- 3. SCORING ENGINE (CALIBRATED) ---
  const calculateFinalScore = () => {
    // 1. Consistency Score (40%)
    let intervals: number[] = [];
    for(let i=1; i<p1Taps.length; i++) intervals.push(p1Taps[i] - p1Taps[i-1]);
    const avg = intervals.reduce((a,b)=>a+b,0) / (intervals.length || 1);
    const variance = intervals.reduce((a,b)=>a + Math.pow(b-avg, 2), 0) / (intervals.length || 1);
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 100 - (stdDev / 5));

    // 2. Reflex Score (30%) - Expecting < 450ms reaction
    const avgReflexTime = p2TotalTime / 5;
    const reflexScore = Math.max(0, Math.min(100, 100 - (avgReflexTime - 300) / 10));

    // 3. Focus Score (30%) - How close to 100 size
    const avgFocus = p3Hits.reduce((a,b)=>a+b, 0) / (p3Hits.length || 1);
    const focusScore = (avgFocus / 100) * 100;

    const final = (consistencyScore * 0.4) + (reflexScore * 0.3) + (focusScore * 0.3);
    setFinalScore(Math.floor(final));
    playTransitionSound();
    setScreen('result');
  };

  const getVerdict = () => {
    if (finalScore >= 50) return { title: "ZABARDAST MOOD!", body: "Sahi jaare mawa! Engine ek dum fit hai. Rhythm tight hai!" };
    return { title: "BAIGAN! TOTAL GHOTALA!", body: "Engine baith gaya mawa. Tension nakko lo, regulation game khelo aur engine garam karo!" };
  };

  // --- 4. GAME PHASES ---
  const startP1 = () => {
    setScreen('p1');
    let time = 15;
    const timer = setInterval(() => {
      time--; setP1TimeLeft(time);
      if (time <= 0) { 
        clearInterval(timer); 
        playTransitionSound();
        setScreen('p2'); 
        setP2StartTime(Date.now());
      }
    }, 1000);
  };

  useEffect(() => {
    if (screen === 'p3') {
      const int = setInterval(() => {
        setPulseSize(s => {
          let next = s + (4.0 * pulseDir);
          if (next >= 100 || next <= 0) setPulseDir(d => d * -1);
          return next;
        });
      }, 16);
      return () => clearInterval(int);
    }
  }, [screen, pulseDir]);

  // --- 5. SHARING & SAVING ---
  const downloadScoreImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1080; 
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0A0E1A'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 20; ctx.strokeRect(40, 40, 1000, 1000);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = '/gold-pi-logo.png'; 
    
    img.onload = () => {
      const imgW = 220; const imgH = (img.height / img.width) * imgW;
      ctx.drawImage(img, 540 - imgW/2, 110, imgW, imgH);
      ctx.textAlign = 'center'; ctx.fillStyle = '#D4AF37'; ctx.font = '900 40px Inter, sans-serif';
      ctx.letterSpacing = '10px'; ctx.fillText('PRANA INDEX', 540, 380);
      
      ctx.font = '700 35px Inter, sans-serif'; ctx.fillStyle = 'white';
      ctx.fillText(userName.toUpperCase(), 540, 460); // DRAW NAME
      
      ctx.font = '700 24px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('STRESS SCORE', 540, 520);

      ctx.font = '900 350px Inter, sans-serif'; ctx.fillStyle = '#D4AF37'; 
      ctx.fillText(finalScore.toString(), 540, 830);

      ctx.font = '900 40px Inter, sans-serif'; ctx.fillStyle = 'white'; 
      ctx.fillText(getVerdict().title, 540, 930);
      
      ctx.font = '400 24px Inter, sans-serif'; ctx.fillStyle = 'rgba(212,175,55,0.6)'; 
      ctx.fillText('www.pranaindex.com', 540, 1010);
      
      const link = document.createElement('a'); link.download = `PI_Score_${userName}.png`;
      link.href = canvas.toDataURL('image/png'); link.click();
    };
  };

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', touchAction: 'none', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
      
      {screen !== 'landing' && (
        <div style={{ position: 'absolute', top: '30px', width: '100%', textAlign: 'center', zIndex: 20 }}>
           <div style={{ fontSize: '22px', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic', letterSpacing: '2px' }}>PRANA INDEX</div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        
        {screen === 'landing' && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '320px' }}>
            <img src="/gold-pi-logo.png" style={{ width: '180px', marginBottom: '10px' }} />
            <h1 style={{ fontSize: '14px', letterSpacing: '8px', color: 'white', marginBottom: '20px' }}>PRANA INDEX</h1>
            <p style={{ color: '#D4AF37', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', marginBottom: '5px' }}>Play your rhythm</p>
            <p style={{ letterSpacing: '2px', fontSize: '11px', marginBottom: '40px', opacity: 0.8 }}>CHECK YOUR PI STRESS SCORE</p>
            
            <input 
              placeholder="ENTER YOUR NAME" 
              value={userName} 
              onChange={e => setUserName(e.target.value)}
              style={{ width: '100%', padding: '18px', borderRadius: '50px', border: '1px solid #D4AF37', background: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center', marginBottom: '20px', fontSize: '14px', fontWeight: 900 }}
            />
            
            <button onClick={startAtmosphere} style={{ width: '100%', border: '2px solid #D4AF37', color: '#D4AF37', padding: '15px', borderRadius: '50px', background: 'none', fontSize: '18px', fontWeight: 900, cursor: 'pointer' }}>START</button>
          </div>
        )}

        {screen === 'details' && (
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
             <p style={{ marginBottom: '20px', color: '#D4AF37', fontWeight: 900 }}>WELCOME, {userName.toUpperCase()}!</p>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '30px', border: '1px solid #ffffff11', textAlign: 'left' }}>
              <p style={{ fontSize: '12px', marginBottom: '15px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>01 CONSISTENCY:</span> Steady tap for 15s.</p>
              <p style={{ fontSize: '12px', marginBottom: '15px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>02 REFLUX:</span> Catch the nodes fast.</p>
              <p style={{ fontSize: '12px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>03 FOCUS:</span> Hit the peak on Green.</p>
            </div>
            <button onClick={startP1} style={{ marginTop: '40px', backgroundColor: '#D4AF37', color: 'black', padding: '20px 60px', borderRadius: '50px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>START ENGINE</button>
          </div>
        )}

        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', letterSpacing: '2px', marginBottom: '20px', fontWeight: 900 }}>PHASE 01: CONSISTENCY</p>
            <div style={{ fontSize: '50px', fontWeight: 900, marginBottom: '30px' }}>{p1TimeLeft}s</div>
            <div onPointerDown={() => { setIsTapping(true); setP1Taps([...p1Taps, Date.now()]); playTone(200, 'sine', 0.1, 0.2); }} onPointerUp={() => setIsTapping(false)}
              style={{ width: '200px', height: '200px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isTapping ? 'scale(0.92)' : 'scale(1)', transition: '0.1s', boxShadow: isTapping ? '0 0 60px white' : '0 0 20px rgba(255,255,255,0.2)' }}>
              <img src="/gold-pi-logo.png" style={{ width: '120px' }} />
            </div>
            <p style={{ marginTop: '60px', fontSize: '11px', opacity: 0.7, letterSpacing: '1px' }}>MAINTAIN A STEADY RHYTHM</p>
          </div>
        )}

        {screen === 'p2' && (
          <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
             <p style={{ position: 'absolute', top: '120px', width: '100%', textAlign: 'center', color: '#D4AF37', fontWeight: 900 }}>PHASE 02: REFLUX ({p2Count}/5)</p>
             <button onPointerDown={() => {
                    playTone(800, 'triangle', 0.1, 0.2);
                    if(p2Count + 1 >= 5) { setP2TotalTime(Date.now() - p2StartTime); playTransitionSound(); setScreen('p3'); } 
                    else { setP2Count(c => c + 1); targetPos.current = { left: Math.random()*70+15+'%', top: Math.random()*70+15+'%' }; }
                }}
                style={{ position: 'absolute', left: targetPos.current.left, top: targetPos.current.top, width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#D4AF37', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', transition: '0.05s' }}>π</button>
             <p style={{ position: 'absolute', bottom: '80px', width: '100%', textAlign: 'center', fontSize: '11px', opacity: 0.7, letterSpacing: '1px' }}>CATCH THE NODES AS FAST AS YOU CAN</p>
          </div>
        )}

        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', marginBottom: '50px', fontWeight: 900 }}>PHASE 03: FOCUS ({p3Hits.length}/3)</p>
            <div style={{ width: '280px', height: '280px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <div style={{ position: 'absolute', width: pulseSize+'%', height: pulseSize+'%', borderRadius: '50%', backgroundColor: pulseSize > 85 ? '#39FF14' : '#D4AF37', opacity: pulseSize > 85 ? 0.8 : 0.4 }}></div>
                <button onPointerDown={() => {
                    const newHits = [...p3Hits, pulseSize]; setP3Hits(newHits);
                    if (pulseSize > 85) playTone(1200, 'sine', 0.2, 0.3); else playTone(150, 'sawtooth', 0.2, 0.2);
                    if (newHits.length >= 3) calculateFinalScore();
                }} style={{ zIndex: 10, width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'black', border: '3px solid #D4AF37', color: '#D4AF37', fontWeight: 900, cursor: 'pointer' }}>TAP PEAK</button>
            </div>
            <p style={{ marginTop: '60px', fontSize: '11px', opacity: 0.7, letterSpacing: '1px' }}>HIT THE PEAK WHEN THE PULSE TURNS GREEN</p>
          </div>
        )}

        {screen === 'result' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 1s', maxWidth: '380px', width: '100%' }}>
            <p style={{ fontSize: '12px', color: '#D4AF37', letterSpacing: '3px' }}>PI STRESS SCORE</p>
            <h3 style={{ fontSize: '130px', fontWeight: 900, color: '#D4AF37', margin: '10px 0', lineHeight: 1 }}>{finalScore}</h3>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '25px', border: '1px solid #ffffff11', marginBottom: '30px' }}>
               <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>{userName.toUpperCase()}</p>
               <p style={{ color: '#D4AF37', fontWeight: 900, fontSize: '20px' }}>{getVerdict().title}</p>
               <p style={{ opacity: 0.8, fontSize: '14px', fontStyle: 'italic' }}>{getVerdict().body}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
               <button onClick={downloadScoreImage} style={{ flex: 1, padding: '15px', borderRadius: '30px', border: '1px solid #D4AF37', color: '#D4AF37', background: 'none', fontWeight: 900 }}>📥 Save Card</button>
               <button onClick={() => window.open(`https://api.whatsapp.com/send?text=I scored ${finalScore} on Prana Index! Check yours at www.pranaindex.com`, '_blank')} style={{ flex: 1, padding: '15px', borderRadius: '30px', border: '1px solid #D4AF37', color: '#D4AF37', background: 'none', fontWeight: 900 }}>💬 WhatsApp</button>
            </div>
            <input placeholder="Enter Email to Calibrate..." value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '50px', border: '1px solid #D4AF37', background: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center', marginBottom: '20px' }} />
            <button onClick={() => { setRegPhase('READY'); setScreen('reg'); }} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '18px 50px', borderRadius: '50px', fontWeight: 900, border: 'none', width: '100%', cursor: 'pointer' }}>CALIBRATE REGULATION</button>
          </div>
        )}

        {/* REGULATION SECTION (Rest of code remains same...) */}
      </div>
    </div>
  );
}
