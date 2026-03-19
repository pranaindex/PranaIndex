<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>PI | Play Your Rhythm</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
        body { background-color: #0A0E1A; color: white; -webkit-tap-highlight-color: transparent; font-family: 'Inter', sans-serif; overflow: hidden; touch-action: none; }
        .gold-text { color: #D4AF37; }
        .gold-bg { background-color: #D4AF37; }
        .pi-logo { font-weight: 900; font-style: italic; color: #D4AF37; font-size: 2.5rem; }
        #wave-pulse { border-radius: 50%; position: absolute; background-color: #D4AF37; width: 0%; height: 0%; opacity: 0; }
        #prana-bubble { 
            border-radius: 50%; 
            background: radial-gradient(circle, rgba(212,175,55,1) 0%, rgba(0,0,0,1) 100%);
            box-shadow: 0 0 60px rgba(212,175,55,0.4);
            width: 140px; height: 140px; 
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; color: #D4AF37; font-size: 20px;
        }
        .ring { border-radius: 50%; position: absolute; border: 1px solid rgba(212,175,55,0.2); pointer-events: none;}
        #inner-ring { width: 140px; height: 140px; border-style: dashed; }
        #outer-ring { width: 320px; height: 320px; border-width: 3px; border-color: rgba(212,175,55,0.5); }
        .fade-in { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen p-4 select-none">

    <div class="absolute top-6 flex flex-col items-center z-50">
        <div class="pi-logo drop-shadow-md">π</div>
        <div id="status-bar" class="text-[8px] tracking-[0.4em] uppercase opacity-60 mt-1 italic font-bold text-[#D4AF37]">SYSTEM: ONLINE</div>
    </div>

    <div id="screen-start-stress" class="text-center flex flex-col items-center max-w-xs fade-in">
        <h2 class="text-4xl font-black mb-1 gold-text italic tracking-tighter uppercase">PI STRESS SCORE</h2>
        <p class="text-[12px] tracking-[0.2em] gold-text font-bold mb-8 uppercase italic">"Play Your Rhythm, Ustaad!"</p>
        
        <div class="bg-white/5 p-6 rounded-3xl border border-white/10 text-left text-[11px] mb-8 w-full space-y-4 shadow-2xl">
            <p><span class="gold-text font-black uppercase text-[12px]">01 CONSISTENCY:</span> Tap a steady beat. Maintain that Miyabhai rhythm for 15s.</p>
            <p><span class="gold-text font-black uppercase text-[12px]">02 REFLUX:</span> Nodes are running! Catch 5 of them fast like a cheetah.</p>
            <p><span class="gold-text font-black uppercase text-[12px]">03 FOCUS:</span> Wait for it... Hit the button exactly at the green peak.</p>
        </div>
        
        <button onclick="startPhase1()" class="gold-bg text-black font-black px-16 py-5 rounded-full text-xl shadow-[0_0_40_rgba(212,175,55,0.4)] active:scale-95 transition-all uppercase tracking-tighter italic">START ENGINE</button>
    </div>

    <div id="screen-p1" class="hidden w-full max-w-xs text-center fade-in">
        <h3 class="text-xs tracking-[0.3em] gold-text font-black mb-10 uppercase italic">"Kya toh bhi rhythm hai!"</h3>
        <button id="tap-btn" class="w-44 h-44 bg-white rounded-full mx-auto flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.3)] touch-none transition-all active:scale-90">
            <img src="PI LOGO TM.png" alt="π" class="w-28 h-28 object-contain pointer-events-none" onerror="this.src='https://via.placeholder.com/150?text=PI';">
        </button>
        <div class="mt-12 w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div id="p1-progress" class="h-full gold-bg w-0 transition-all duration-100"></div>
        </div>
        <p class="mt-6 text-[10px] gold-text uppercase font-black tracking-widest animate-pulse">DON'T BREAK THE FLOW...</p>
    </div>

    <div id="screen-p2" class="hidden w-full max-w-xs text-center fade-in">
        <h3 class="text-xs tracking-widest gold-text font-black mb-6 uppercase italic">Haule! Catch the nodes!</h3>
        <div id="arena" class="relative w-full h-80 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-inner">
            <button id="target" class="absolute w-16 h-16 gold-bg rounded-full text-black font-black flex items-center justify-center touch-none text-2xl active:scale-90 shadow-lg">π</button>
        </div>
    </div>

    <div id="screen-p3" class="hidden w-full max-w-xs text-center fade-in">
        <h3 class="text-xs tracking-widest gold-text font-black mb-6 uppercase italic">Sahi Point Pe Tap Karo</h3>
        <div class="relative w-64 h-64 mx-auto flex items-center justify-center bg-white/5 rounded-full border border-white/10">
            <div id="wave-pulse"></div>
            <button id="flow-btn" class="absolute w-24 h-24 bg-black/80 border-2 border-[#D4AF37] rounded-full z-10 font-black text-[10px] gold-text uppercase active:bg-white active:text-black">TAP PEAK</button>
        </div>
        <div id="p3-dots" class="flex justify-center gap-4 mt-12">
            <div id="dot-0" class="w-3 h-3 rounded-full bg-white/10"></div>
            <div id="dot-1" class="w-3 h-3 rounded-full bg-white/10"></div>
            <div id="dot-2" class="w-3 h-3 rounded-full bg-white/10"></div>
        </div>
    </div>

    <div id="screen-result" class="hidden text-center flex flex-col items-center px-4 w-full max-w-md fade-in">
        <p class="text-[10px] tracking-[0.4em] gold-text opacity-70 uppercase italic font-bold">PI STRESS SCORE</p>
        <h3 id="score-val" class="text-[110px] font-black gold-text leading-none mb-4 tracking-tighter">--</h3>
        
        <div id="verdict-box" class="p-6 rounded-3xl border border-white/10 bg-white/5 mb-6 w-full shadow-2xl">
            <p id="v-title" class="text-2xl font-black italic mb-2 tracking-tighter uppercase gold-text"></p>
            <p id="v-body" class="text-xs opacity-90 italic leading-relaxed"></p>
        </div>

        <div class="w-full bg-[#D4AF37]/10 p-6 rounded-3xl border border-[#D4AF37]/40 mb-6 backdrop-blur-md">
            <p class="text-[10px] gold-text font-black mb-3 uppercase tracking-widest">Enter email to get the PI Stress Regulation Game</p>
            <input type="email" id="user-email" placeholder="ustaad@hyderabad.com" class="w-full bg-black/40 border border-white/20 rounded-full px-6 py-4 text-xs mb-3 focus:outline-none focus:border-[#D4AF37] text-white text-center">
            <button onclick="transitionToRegulation()" class="w-full gold-bg text-black font-black py-4 rounded-full text-[10px] uppercase tracking-widest active:scale-95 transition-all">CALIBRATE REGULATION</button>
        </div>
    </div>

    <script>
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioCtx, engineOsc, engineGain, rainAudio;

        function initAudio() {
            if (!audioCtx) audioCtx = new AudioContext();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            if (!rainAudio) {
                rainAudio = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
                rainAudio.loop = true;
                rainAudio.volume = 0.3;
            }
            rainAudio.play().catch(e => console.log("Audio block"));
        }

        function playTone(f, t, d, v=0.1) {
            if(!audioCtx) return;
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = t; o.frequency.setValueAtTime(f, audioCtx.currentTime);
            g.gain.setValueAtTime(v, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + d);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(); o.stop(audioCtx.currentTime + d);
        }

        let p1Taps = [], p2Taps = [], p3Hits = [], p2Start, hitCount = 0;
        let pulseSize = 0, pulseDir = 1;

        function startPhase1() {
            initAudio(); 
            playTone(440, 'sine', 0.2);
            document.getElementById('screen-start-stress').classList.add('hidden');
            document.getElementById('screen-p1').classList.remove('hidden');
        }

        document.getElementById('tap-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault(); 
            playTone(200, 'sine', 0.1, 0.4);
            if(p1Taps.length === 0) {
                const start = performance.now();
                const ticker = setInterval(() => {
                    const elap = performance.now() - start;
                    document.getElementById('p1-progress').style.width = (elap/15000*100) + "%";
                    if(elap >= 15000) { clearInterval(ticker); startPhase2(); }
                }, 50);
            }
            p1Taps.push(performance.now());
        });

        function startPhase2() {
            document.getElementById('screen-p1').classList.add('hidden');
            document.getElementById('screen-p2').classList.remove('hidden');
            moveTarget();
        }

        document.getElementById('target').addEventListener('pointerdown', (e) => {
            e.preventDefault(); playTone(800, 'triangle', 0.1);
            if(p2Taps.length === 0) p2Start = performance.now();
            p2Taps.push(performance.now());
            if(p2Taps.length >= 5) startPhase3(); else moveTarget();
        });

        function moveTarget() {
            const t = document.getElementById('target');
            t.style.left = Math.random() * 75 + 10 + "%"; t.style.top = Math.random() * 75 + 10 + "%";
        }

        function startPhase3() {
            document.getElementById('screen-p2').classList.add('hidden');
            document.getElementById('screen-p3').classList.remove('hidden');
            requestAnimationFrame(animatePulse);
        }

        function animatePulse() {
            const p = document.getElementById('wave-pulse');
            pulseSize += 2.2 * pulseDir; 
            if(pulseSize >= 100 || pulseSize <= 0) pulseDir *= -1;
            p.style.width = pulseSize + "%"; p.style.height = pulseSize + "%"; 
            p.style.opacity = pulseSize / 100;
            p.style.backgroundColor = pulseSize > 85 ? "#39FF14" : "#D4AF37"; // Flash green at peak
            if(hitCount < 3) requestAnimationFrame(animatePulse);
        }

        document.getElementById('flow-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault(); 
            if(pulseSize > 85) playTone(1200, 'sine', 0.2, 0.2); else playTone(150, 'sawtooth', 0.2);
            p3Hits.push(pulseSize);
            document.getElementById(`dot-${hitCount}`).style.backgroundColor = pulseSize > 85 ? "#39FF14" : "#D4AF37";
            hitCount++;
            if(hitCount >= 3) setTimeout(calculateFinal, 600);
        });

        function calculateFinal() {
            document.getElementById('screen-p3').classList.add('hidden');
            document.getElementById('screen-result').classList.remove('hidden');

            let cScore = 0;
            if(p1Taps.length > 5) {
                let intervals = [];
                for(let i=1; i<p1Taps.length; i++) intervals.push(p1Taps[i] - p1Taps[i-1]);
                let mean = intervals.reduce((a,b)=>a+b)/intervals.length;
                let std = Math.sqrt(intervals.map(x=>Math.pow(x-mean,2)).reduce((a,b)=>a+b)/intervals.length);
                cScore = Math.max(0, 100 * Math.exp(-6 * (std/mean))); 
            }

            let rScore = 0;
            if(p2Taps.length >= 5) rScore = Math.max(0, Math.min(100, 120 - ((p2Taps[4] - p2Start) / 40)));

            let fScore = (p3Hits.reduce((a,b)=>a+b,0)/3);
            let final = Math.round((cScore * 0.4) + (rScore * 0.3) + (fScore * 0.3));

            document.getElementById('score-val').innerText = final;
            const t = document.getElementById('v-title');
            const b = document.getElementById('v-body');

            // HYDERABADI DYNAMIC FEEDBACK
            if(final >= 85) {
                t.innerText = "USTAAD! KHAAS FOCUS!";
                b.innerText = "Baigan... You're the King of Koti. Full Kirrak performance, maza aagaya!";
            } else if(final >= 65) {
                t.innerText = "ZABARDAST MOOD!";
                b.innerText = "Good rhythm ustaad. Thoda aur focus kare toh Charminar pe chadh jate!";
            } else if(final >= 40) {
                t.innerText = "LIGHT LELO!";
                b.innerText = "Kya toh bhi karre? Engine thoda thanda hai. Regulation game khelo, sahi hojata.";
            } else {
                t.innerText = "BAIGAN! TOTAL GHOTALA!";
                b.innerText = "Engine hi baith gaya ustaad. Dimag khali hogaya kya? Breathing pe dhyan de re bawa.";
            }
        }

        function transitionToRegulation() {
            if(!document.getElementById('user-email').value.includes('@')) return alert("Ustaad, email toh dalo calibration ke waste!");
            location.reload(); // Or transition to your regulation screens
        }
    </script>
</body>
</html>
