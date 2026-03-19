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
        canvas { position: absolute; top: 0; left: 0; z-index: 1; pointer-events: none; }
        #wave-pulse { border-radius: 50%; position: absolute; background-color: #D4AF37; width: 0%; height: 0%; opacity: 0; }
        .fade-in { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        #prana-bubble { 
            border-radius: 50%; background: radial-gradient(circle, rgba(212,175,55,1) 0%, rgba(0,0,0,1) 100%);
            box-shadow: 0 0 60px rgba(212,175,55,0.4); width: 140px; height: 140px; 
            display: flex; align-items: center; justify-content: center; font-weight: 900; color: #D4AF37;
        }
    </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen p-4 select-none">
    <canvas id="rainCanvas"></canvas>
    
    <div class="absolute top-6 flex flex-col items-center z-50">
        <div class="pi-logo drop-shadow-md">π</div>
        <div class="text-[8px] tracking-[0.4em] uppercase opacity-60 mt-1 italic font-bold text-[#D4AF37]">SYSTEM: ONLINE</div>
    </div>

    <div id="screen-start" class="text-center flex flex-col items-center max-w-xs z-10 fade-in">
        <h2 class="text-4xl font-black mb-1 gold-text italic tracking-tighter uppercase">PRANA INDEX</h2>
        <p class="text-[12px] tracking-[0.2em] gold-text font-bold mb-8 uppercase italic">"Play Your Rhythm, Ustaad!"</p>
        <button onclick="initGame()" class="gold-bg text-black font-black px-16 py-5 rounded-full text-xl shadow-2xl active:scale-95 transition-all uppercase italic">START ENGINE</button>
    </div>

    <div id="screen-p1" class="hidden w-full max-w-xs text-center z-10 fade-in">
        <h3 class="text-xs tracking-[0.3em] gold-text font-black mb-10 uppercase italic">"Kya toh bhi rhythm hai!"</h3>
        <button id="tap-btn" class="w-44 h-44 bg-white rounded-full mx-auto flex items-center justify-center shadow-2xl active:scale-90 transition-all">
            <div class="pi-logo text-black">π</div>
        </button>
        <div class="mt-12 w-full h-2 bg-white/10 rounded-full overflow-hidden"><div id="p1-progress" class="h-full gold-bg w-0 transition-all"></div></div>
        <p class="mt-6 text-[10px] gold-text uppercase font-black tracking-widest animate-pulse">DON'T BREAK THE FLOW...</p>
    </div>

    <div id="screen-p2" class="hidden w-full max-w-xs text-center z-10">
        <h3 class="text-xs tracking-widest gold-text font-black mb-6 uppercase italic">Haule! Catch the nodes!</h3>
        <div id="arena" class="relative w-full h-80 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-inner">
            <button id="target" class="absolute w-16 h-16 gold-bg rounded-full text-black font-black flex items-center justify-center touch-none text-2xl active:scale-90 shadow-lg">π</button>
        </div>
    </div>

    <div id="screen-p3" class="hidden w-full max-w-xs text-center z-10">
        <h3 class="text-xs tracking-widest gold-text font-black mb-6 uppercase italic">Sahi Point Pe Tap Karo</h3>
        <div class="relative w-64 h-64 mx-auto flex items-center justify-center bg-white/5 rounded-full border border-white/10">
            <div id="wave-pulse"></div>
            <button id="flow-btn" class="absolute w-24 h-24 bg-black/80 border-2 border-[#D4AF37] rounded-full z-10 font-black text-[10px] gold-text uppercase active:bg-white active:text-black">TAP PEAK</button>
        </div>
    </div>

    <div id="screen-result" class="hidden text-center flex flex-col items-center px-4 w-full max-w-md z-10 fade-in">
        <p class="text-[10px] tracking-[0.4em] gold-text opacity-70 uppercase italic font-bold">PI STRESS SCORE</p>
        <h3 id="score-val" class="text-[110px] font-black gold-text leading-none mb-4 tracking-tighter">--</h3>
        
        <div class="p-6 rounded-3xl border border-white/10 bg-white/5 mb-6 w-full shadow-2xl">
            <p id="v-title" class="text-2xl font-black italic mb-2 tracking-tighter uppercase gold-text"></p>
            <p id="v-body" class="text-xs opacity-90 italic leading-relaxed"></p>
        </div>

        <div class="w-full bg-[#D4AF37]/10 p-6 rounded-3xl border border-[#D4AF37]/40 mb-6 backdrop-blur-md">
            <p class="text-[10px] gold-text font-black mb-3 uppercase tracking-widest">Enter email to get the PI Stress Regulation Game</p>
            <input type="email" id="user-email" placeholder="ustaad@hyderabad.com" class="w-full bg-black/40 border border-white/20 rounded-full px-6 py-4 text-xs mb-3 text-center">
            <button onclick="location.reload()" class="w-full gold-bg text-black font-black py-4 rounded-full text-[10px] uppercase tracking-widest">CALIBRATE REGULATION</button>
        </div>
    </div>

    <audio id="rainAudio" loop><source src="https://www.soundjay.com/nature/rain-01.mp3" type="audio/mpeg"></audio>

    <script>
        // --- RAIN & AUDIO ---
        const canvas = document.getElementById("rainCanvas");
        const ctx = canvas.getContext("2d");
        let rain = [];
        function initRain() {
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            for(let i=0; i<150; i++) rain.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, l: Math.random()*20, s: Math.random()*5+2});
        }
        function drawRain() {
            ctx.fillStyle = "rgba(10, 14, 26, 0.2)"; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
            rain.forEach(r => { ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y+r.l); ctx.stroke(); r.y+=r.s; if(r.y > canvas.height) r.y=0; });
            requestAnimationFrame(drawRain);
        }
        initRain(); drawRain();

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioCtx, p1Taps = [], p2Taps = [], p3Hits = [], p2Start, hitCount = 0, pulseSize = 0, pulseDir = 1;

        function initGame() {
            audioCtx = new AudioContext();
            document.getElementById("rainAudio").play();
            document.getElementById("screen-start").classList.add("hidden");
            document.getElementById("screen-p1").classList.remove("hidden");
        }

        // --- PHASE LOGIC ---
        document.getElementById('tap-btn').onpointerdown = () => {
            if(p1Taps.length === 0) {
                const start = performance.now();
                const ticker = setInterval(() => {
                    const elap = performance.now() - start;
                    document.getElementById('p1-progress').style.width = (elap/15000*100) + "%";
                    if(elap >= 15000) { clearInterval(ticker); startP2(); }
                }, 50);
            }
            p1Taps.push(performance.now());
        };

        function startP2() {
            document.getElementById("screen-p1").classList.add("hidden");
            document.getElementById("screen-p2").classList.remove("hidden");
            moveTarget();
        }

        document.getElementById('target').onpointerdown = () => {
            if(p2Taps.length === 0) p2Start = performance.now();
            p2Taps.push(performance.now());
            if(p2Taps.length >= 5) startP3(); else moveTarget();
        };

        function moveTarget() {
            const t = document.getElementById('target');
            t.style.left = Math.random()*70+10+"%"; t.style.top = Math.random()*70+10+"%";
        }

        function startP3() {
            document.getElementById("screen-p2").classList.add("hidden");
            document.getElementById("screen-p3").classList.remove("hidden");
            requestAnimationFrame(animatePulse);
        }

        function animatePulse() {
            pulseSize += 2.2 * pulseDir; if(pulseSize >= 100 || pulseSize <= 0) pulseDir *= -1;
            const p = document.getElementById('wave-pulse');
            p.style.width = p.style.height = pulseSize + "%"; p.style.opacity = pulseSize/100;
            p.style.backgroundColor = pulseSize > 85 ? "#39FF14" : "#D4AF37";
            if(hitCount < 3) requestAnimationFrame(animatePulse);
        }

        document.getElementById('flow-btn').onpointerdown = () => {
            p3Hits.push(pulseSize); hitCount++;
            if(hitCount >= 3) calculateScore();
        };

        function calculateScore() {
            document.getElementById("screen-p3").classList.add("hidden");
            document.getElementById("screen-result").classList.remove("hidden");
            
            // Logic for consistency, reflex, and focus
            let rScore = Math.max(0, 100 - ((p2Taps[4]-p2Start)/50));
            let fScore = p3Hits.reduce((a,b)=>a+b,0)/3;
            let final = Math.round((rScore*0.5) + (fScore*0.5));

            document.getElementById('score-val').innerText = final;
            const t = document.getElementById('v-title');
            const b = document.getElementById('v-body');

            if(final >= 85) {
                t.innerText = "USTAAD! KHAAS FOCUS!";
                b.innerText = "Baigan... You're the King of Koti. Full Kirrak performance, maza aagaya!";
            } else if(final >= 65) {
                t.innerText = "ZABARDAST MOOD!";
                b.innerText = "Good rhythm ustaad. Thoda aur focus kare toh Charminar pe chadh jate!";
            } else {
                t.innerText = "LIGHT LELO!";
                b.innerText = "Engine thoda thanda hai ustaad. Regulation game khelo, mood sahi hojata.";
            }
        }
    </script>
</body>
</html>
