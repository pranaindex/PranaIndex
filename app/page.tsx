"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndexGame() {
  const [screen, setScreen] = useState('landing');
  const [email, setEmail] = useState('');
  
  // Game Data
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [p2StartTime, setP2StartTime] = useState(0);
  const [p3Hits, setP3Hits] = useState<number[]>([]);
  
  // UI States
  const [p1Timer, setP1Timer] = useState(15);
  const [pulseSize, setPulseSize] = useState(50);
  const [isTapping, setIsTapping] = useState(false);
  const [targetPos, setTargetPos] = useState({ left: '50%', top: '50%' });
  const [finalScore, setFinalScore] = useState(0);

  // Regulation Game States (5-3-5)
  const [regPhase, setRegPhase] = useState('READY'); // READY, INHALE, HOLD, EXHALE, DONE
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycle, setRegCycle] = useState(1);

  // Audio Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const rainAudio = useRef<HTMLAudioElement | null>(null);
  const engineOsc = useRef<OscillatorNode | null>(null);
  const engineGain = useRef<GainNode | null>(null);

  // --- INITIALIZE AUDIO & RAIN ---
  const startAtmosphere = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.25;
    }
    rainAudio.current.play();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    setScreen('details');
  };

  const playTone = (freq: number, type: OscillatorType, dur: number, vol = 0.1) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + dur);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + dur);
  };

  // --- REGULATION ENGINE SOUND (REV) ---
  const startRev = (startFreq: number, endFreq: number, duration: number) => {
    if (!audioCtx.current) return;
    stopRev();
    engineOsc.current = audioCtx.current.createOscillator();
    engineGain.current = audioCtx.current.createGain();
    engineOsc.current.type = 'sawtooth';
    engineOsc.current.frequency.setValueAtTime(startFreq, audioCtx.current.currentTime);
    engineOsc.current.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.current.currentTime + duration);
    engineGain.current.gain.setValueAtTime(0.05, audioCtx.current.currentTime);
    engineGain.current.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + duration);
    engineOsc.current.connect(engineGain.current);
    engineGain.current.connect(audioCtx.current.destination);
    engineOsc.current.start();
  };

  const stopRev = () => {
    if (engineOsc.current) { engineOsc.current.stop(); engineOsc.current = null; }
  };

  // --- SCORING LOGIC ---
  const calculateScore = () => {
    let consistency = 0;
    if (p1Taps.length > 5) {
      const intervals = p1Taps.slice(1).map((t, i) => t - p1Taps[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const vari = intervals.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / intervals.length;
      consistency = Math.max(0, 100 - Math.sqrt(vari) / 8);
    }
    const reflex = Math.max(0, 100 - ((Date.now() - p2StartTime) / 65));
    const focus = p3Hits.reduce((a, b) => a + b, 0) / (p3Hits.length || 1);
    
    setFinalScore(Math.floor((consistency * 0.4) + (reflex * 0.3) + (focus * 0.3)));
    setScreen('result');
  };

  // --- GAME LOOPS ---
  useEffect(() => {
    if (screen === 'p1' && p1Timer > 0) {
      const t = setInterval(() => setP1Timer(v => v - 1), 1000);
      return () => clearInterval(t);
    } else if (screen === 'p1' && p1Timer === 0) {
      setScreen('p2');
      setP2StartTime(Date.now());
    }
  }, [screen, p1Timer]);

  useEffect(() => {
    if (screen === 'p3') {
      let frame = 0;
      const int = setInterval(() => {
        frame += 0.05;
        setPulseSize(50 + Math.sin(frame) * 50); // Smooth 0-100 pulse
      }, 20);
      return () => clearInterval(int);
    }
  }, [screen]);

  // --- REGULATION LOGIC (5-3-5) ---
  const handleRegulate = () => {
    if (regPhase !== 'READY') return;
    
    // 1. INHALE (5s)
    setRegPhase('INHALE');
    setRegTimer(5);
    startRev(100, 400, 5);
    
    let time = 5;
    const inhaleInterval = setInterval(() => {
      time -= 0.1;
      setRegTimer(Math.max(0, time));
      if (time <= 0) {
        clearInterval(inhaleInterval);
        // 2. HOLD (3s)
        setRegPhase('HOLD');
        setRegTimer(3);
        let holdTime = 3;
        const holdInterval = setInterval(() => {
          holdTime -= 0.1;
          setRegTimer(Math.max(0, holdTime));
          if (holdTime <= 0) {
            clearInterval(holdInterval);
            // 3. EXHALE (5s)
            setRegPhase('EXHALE');
            setRegTimer(5);
            startRev(400, 80, 5);
            let exhaleTime = 5;
            const exhaleInterval = setInterval(() => {
              exhaleTime -= 0.1;
              setRegTimer(Math.max(0, exhaleTime));
              if (exhaleTime <= 0) {
                clearInterval(exhaleInterval);
                if (regCycle >= 3) setRegPhase('DONE');
                else {
                  setRegCycle(c => c + 1);
                  setRegPhase('READY');
                }
              }
            }, 100);
          }
        }, 100);
      }
    }, 100);
  };

  // --- HYDERABADI VERDICTS ---
  const getVerdict = () => {
    if (finalScore >= 85) return { t: "USTAAD! KIRAAN FOCUS!", b: "Pura Hyderabad tumhare rhythm pe naachra! Ek number performance ustaad!" };
    if (finalScore >= 65) return { t: "ZABARDAST MOOD!", b: "Sahi hai mawa! Engine ek dum fit hai. Coherence full tight hai!" };
    return { t: "BAIGAN! LIGHT LELO", b: "Engine thoda thanda hai bawa. Regulation game khelo, engine garam karo!" };
  };

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', touchAction: 'none', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      
      {/* PERSISTENT HEADER */}
      {screen !== 'landing' && (
        <div style={{ position: 'absolute', top: '30px', width: '100%', textAlign: 'center', zIndex: 100 }}>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', fontStyle: 'italic' }}>PRANA INDEX</div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        
        {screen === 'landing' && (
          <div style={{ textAlign: 'center' }} className="fade-in">
            <h1 style={{ fontSize: '15px', letterSpacing: '8px', marginBottom: '40px' }}>PRANA INDEX</h1>
            <p style={{ color: '#D4AF37', fontSize: '28px', fontWeight: 900, fontStyle: 'italic' }}>"Play your rhythm"</p>
            <p style={{ letterSpacing: '2px', opacity: 0.7, marginBottom: '60px' }}>CHECK YOUR PI STRESS SCORE</p>
            <button onClick={startAtmosphere} style={{ border: '2px solid #D4AF37', color: '#D4AF37', padding: '18px 60px', borderRadius: '50px', background: 'none', fontSize: '18px', fontWeight: 900, cursor: 'pointer' }}>START</button>
          </div>
        )}

        {screen === 'details' && (
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '30px', border: '1px solid #ffffff11', textAlign: 'left', marginBottom: '40px' }}>
              <p style={{ fontSize: '13px', marginBottom: '15px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>01 CONSISTENCY:</span> Keep a steady beat on the white node for 15s.</p>
              <p style={{ fontSize: '13px', marginBottom: '15px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>02 REFLUX:</span> Nodes are running! Catch 5 fast like a cheetah.</p>
              <p style={{ fontSize: '13px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>03 FOCUS:</span> Hit the peak when the pulse turns green.</p>
            </div>
            <button onClick={() => setScreen('p1')} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '20px 60px', borderRadius: '50px', fontWeight: 900, border: 'none' }}>START ENGINE</button>
          </div>
        )}

        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 900, marginBottom: '20px' }}>PHASE 01: MAINTAIN RHYTHM</p>
            <div style={{ fontSize: '60px', fontWeight: 900, marginBottom: '40px' }}>{p1Timer}s</div>
            <div 
              onPointerDown={() => { setIsTapping(true); setP1Taps(v => [...v, Date.now()]); playTone(200, 'sine', 0.1); }}
              onPointerUp={() => setIsTapping(false)}
              style={{ 
                width: '180px', height: '180px', backgroundColor: 'white', borderRadius: '50%', 
                transform: isTapping ? 'scale(0.85)' : 'scale(1)', transition: '0.1s',
                boxShadow: isTapping ? '0 0 60px white' : '0 0 20px rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <div style={{ color: 'black', fontWeight: 900, fontSize: '30px' }}>π</div>
            </div>
          </div>
        )}

        {screen === 'p2' && (
          <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
             <p style={{ position: 'absolute', top: '120px', width: '100%', textAlign: 'center', color: '#D4AF37', fontSize: '12px', fontWeight: 900 }}>PHASE 02: CATCH THE NODES ({p2Taps.length}/5)</p>
             <button 
                onPointerDown={() => {
                    playTone(800, 'triangle', 0.1);
                    if(p2Taps.length + 1 >= 5) setScreen('p3');
                    else {
                        setP2Taps(v => [...v, Date.now()]);
                        setTargetPos({ left: Math.random()*70+15+'%', top: Math.random()*70+15+'%' });
                    }
                }}
                style={{ position: 'absolute', left: targetPos.left, top: targetPos.top, width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#D4AF37', border: 'none', color: 'black', fontWeight: 900, fontSize: '20px' }}
             >π</button>
          </div>
        )}

        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', marginBottom: '50px', fontSize: '12px', fontWeight: 900 }}>PHASE 03: HIT THE PEAK ({p3Hits.length}/3)</p>
            <div style={{ width: '280px', height: '280px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: pulseSize+'%', height: pulseSize+'%', borderRadius: '50%', backgroundColor: pulseSize > 85 ? '#39FF14' : '#D4AF37', opacity: 0.5, transition: 'background-color 0.2s' }}></div>
                <button onPointerDown={() => {
                    setP3Hits(v => [...v, pulseSize]);
                    playTone(pulseSize > 85 ? 1200 : 150, 'sine', 0.2);
                    if (p3Hits.length + 1 >= 3) calculateScore();
                }} style={{ zIndex: 10, width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'black', border: '3px solid #D4AF37', color: '#D4AF37', fontWeight: 900 }}>TAP</button>
            </div>
          </div>
        )}

        {screen === 'result' && (
          <div style={{ textAlign: 'center', maxWidth: '380px' }}>
            <p style={{ fontSize: '12px', color: '#D4AF37', letterSpacing: '4px', fontWeight: 900 }}>PI STRESS SCORE</p>
            <h3 style={{ fontSize: '120px', fontWeight: 900, color: '#D4AF37', margin: '0' }}>{finalScore}</h3>
            
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '25px', border: '1px solid #ffffff11', marginBottom: '30px' }}>
               <p style={{ color: '#D4AF37', fontWeight: 900, fontSize: '22px', marginBottom: '5px' }}>{getVerdict().t}</p>
               <p style={{ opacity: 0.8, fontSize: '14px', fontStyle: 'italic', lineHeight: 1.4 }}>{getVerdict().b}</p>
            </div>

            <div style={{ background: 'rgba(212,175,55,0.1)', padding: '20px', borderRadius: '30px', border: '1px solid #D4AF3744' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, color: '#D4AF37', marginBottom: '15px' }}>ENTER EMAIL TO GET THE PI STRESS REGULATION GAME</p>
              <input placeholder="ustaad@hyderabad.com" value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '50px', border: '1px solid #D4AF37', background: 'rgba(0,0,0,0.4)', color: 'white', textAlign: 'center', marginBottom: '15px' }} />
              <button onClick={() => {setRegPhase('READY'); setScreen('reg');}} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '18px 50px', borderRadius: '50px', fontWeight: 900, border: 'none', width: '100%' }}>CALIBRATE REGULATION</button>
            </div>
          </div>
        )}

        {screen === 'reg' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>{regPhase}</p>
            <h2 style={{ fontSize: '70px', fontWeight: 900, marginBottom: '30px' }}>{regTimer.toFixed(1)}s</h2>
            
            <div 
              onPointerDown={handleRegulate}
              style={{ 
                width: '240px', height: '240px', borderRadius: '50%', border: '2px solid #D4AF37', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
              }}
            >
                <div style={{ 
                  width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#D4AF37',
                  transform: regPhase === 'INHALE' ? `scale(${1 + (5-regTimer)*0.3})` : regPhase === 'EXHALE' ? `scale(${2.5 - (5-regTimer)*0.3})` : 'scale(1)',
                  transition: '0.1s linear', boxShadow: '0 0 50px rgba(212,175,55,0.4)'
                }}></div>
                <div style={{ position: 'absolute', color: 'white', fontWeight: 900, fontSize: '12px' }}>{regPhase === 'READY' ? 'HOLD TO REV' : ''}</div>
            </div>
            
            <p style={{ marginTop: '40px', letterSpacing: '2px', fontWeight: 900, color: '#D4AF37' }}>CYCLE {regCycle} / 3</p>
            {regPhase === 'DONE' && <button onClick={() => window.location.reload()} style={{ color: '#39FF14', fontWeight: 900, textDecoration: 'underline', marginTop: '30px', background: 'none', border: 'none' }}>COHERENCE ACHIEVED - RESTART</button>}
          </div>
        )}

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
        .fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
