"use client";
import React, { useState } from 'react';

export default function PranaIndex() {
  // This "state" tells the app which screen to show
  const [screen, setScreen] = useState('landing'); 
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen text-white font-sans flex flex-col">
      
      {/* 1. NAVIGATION / BRANDING */}
      <nav className="p-6 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* This pulls your logo from the public folder */}
          <img src="/gold-pi-logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <span className="text-xl font-bold tracking-tighter text-cyan-400">PRANA INDEX</span>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-6 text-center">
        
        {/* SCREEN A: THE LANDING PAGE */}
        {screen === 'landing' && (
          <div className="animate-in fade-in duration-700">
            <h2 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Master Your Focus.
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-md">
              A 60-second test to index your current vitality and stress levels.
            </p>
            <button 
              onClick={() => setScreen('game')}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-4 px-10 rounded-full transition-all transform hover:scale-105"
            >
              Start Stress Test
            </button>
          </div>
        )}

        {/* SCREEN B: THE GAME (Placeholder for now) */}
        {screen === 'game' && (
          <div className="w-full max-w-2xl p-10 bg-slate-800/50 rounded-3xl border border-slate-700">
            <h3 className="text-2xl mb-4">Game Loading...</h3>
            <p className="text-slate-400 mb-8">Ready to test your reaction time?</p>
            <button 
              onClick={() => setScreen('email')}
              className="text-cyan-400 underline"
            >
              (Skip to Email Screen for Setup)
            </button>
          </div>
        )}

        {/* SCREEN C: EMAIL COLLECTION */}
        {screen === 'email' && (
          <div className="max-w-md w-full animate-in zoom-in duration-300">
            <h3 className="text-3xl font-bold mb-4">Test Complete.</h3>
            <p className="text-slate-400 mb-8 text-lg">Enter your email to see your Index Score and unlock the Regulation Exercise.</p>
            <input 
              type="email" 
              placeholder="your@email.com"
              className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button 
              onClick={() => setScreen('regulation')}
              className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition"
            >
              Get My Score
            </button>
          </div>
        )}

        {/* SCREEN D: REGULATION GAME */}
        {screen === 'regulation' && (
          <div className="text-center">
            <h3 className="text-4xl font-bold text-green-400 mb-4">Regulation Mode</h3>
            <p className="text-slate-400 italic">Breathe in... Breathe out...</p>
            <button 
              onClick={() => setScreen('landing')}
              className="mt-10 text-slate-500 hover:text-white"
            >
              Restart
            </button>
          </div>
        )}

      </main>

      <footer className="p-10 text-slate-600 text-sm text-center">
        &copy; 2026 PRANA INDEX
      </footer>
    </div>
  );
}
