import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Twitter, ArrowUpRight, Trophy, Zap, MessageCircle, Heart, Repeat, Ban, TrendingUp, AlertTriangle, X, Terminal, Power, Copy, Check } from 'lucide-react';

/* --- 1. GLOBAL STYLES & ANIMATIONS --- */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Anton&family=Cinzel:wght@900&family=Comic+Neue:wght@700&family=Jacquard+12&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

    :root {
      --bg-color: #050505;
      --text-color: #eeeeee;
      --accent: #ccff00; /* Acid Green */
      --secondary: #ff00ff; /* Hot Magenta */
      --alert: #ff3333;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      overflow-x: hidden;
      cursor: crosshair;
      user-select: none;
    }

    ::-webkit-scrollbar { width: 0px; background: transparent; }

    .font-anton { font-family: 'Anton', sans-serif; }
    .font-cinzel { font-family: 'Cinzel', serif; }
    .font-mono { font-family: 'Space Mono', monospace; }
    .font-comic { font-family: 'Comic Neue', cursive; }
    .font-gothic { font-family: 'Jacquard 12', cursive; }

    /* Noise Overlay */
    .noise {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 50; opacity: 0.05;
      background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
    }

    /* Background W gentle movement + Drift */
    @keyframes slow-drift {
        0% { transform: translate(0, 0) rotate(0deg); opacity: 0.1; }
        50% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0.05; }
        100% { transform: translate(0, 0) rotate(0deg); opacity: 0.1; }
    }
    .w-drifter {
        animation: slow-drift var(--duration) linear infinite;
        will-change: transform, opacity;
    }

    /* Glitch Animation */
    .hover-glitch:hover {
      animation: glitch 0.2s cubic-bezier(.25, .46, .45, .94) both infinite;
      color: var(--accent);
      text-shadow: 4px 4px 0px var(--secondary);
    }
    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-4px, 4px); }
      40% { transform: translate(-4px, -4px); }
      60% { transform: translate(4px, 4px); }
      80% { transform: translate(4px, -4px); }
      100% { transform: translate(0); }
    }

    /* Elastic Scroll Effect */
    .elastic-content {
      transition: transform 0.1s cubic-bezier(0.1, 0.7, 1.0, 0.1);
      will-change: transform;
    }

    /* Tweet Cards */
    .tweet-card {
      transition: all 0.3s ease;
      transform-style: preserve-3d;
      background: #0a0a0a;
    }
    .tweet-card:hover {
      transform: scale(1.02) rotateZ(-1deg);
      box-shadow: 8px 8px 0px var(--accent);
      z-index: 10;
      background: #111;
      border-color: var(--accent);
    }

    /* Click Explosion */
    @keyframes pop-fade {
      0% { transform: translate(-50%, -50%) scale(0.5) rotate(0deg); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2.5) rotate(var(--rot)); opacity: 0; }
    }
    .click-w {
      position: fixed; pointer-events: none; z-index: 100;
      animation: pop-fade 0.6s ease-out forwards;
      font-weight: 900; text-shadow: 0 0 10px var(--accent);
    }

    /* Victory Flash */
    @keyframes flash-screen {
      0% { filter: invert(0); } 10% { filter: invert(1); } 30% { filter: invert(0); } 50% { filter: invert(1); } 100% { filter: invert(0); }
    }
    .victory-mode { animation: flash-screen 0.5s ease-out; }

    /* Cursor Trail */
    .trail-w {
      position: fixed; pointer-events: none; z-index: 9999;
      font-weight: bold; color: var(--accent);
      font-family: 'Space Mono', monospace;
      animation: trail-fade 0.8s forwards;
    }
    @keyframes trail-fade {
      0% { opacity: 0.8; transform: scale(1) rotate(0deg); }
      100% { opacity: 0; transform: scale(0.2) rotate(180deg); }
    }
  `}</style>
);

/* --- 2. SOUND ENGINE (PROCEDURAL AUDIO) --- */
const SoundEngine = {
    ctx: null,
    arenaOsc: null,
    arenaGain: null,
    
    init: () => {
        if (!SoundEngine.ctx) {
            SoundEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (SoundEngine.ctx && SoundEngine.ctx.state === 'suspended') {
            SoundEngine.ctx.resume().catch(() => {});
        }
    },
    playTone: (freq, type, duration, vol = 0.1) => {
        if (!SoundEngine.ctx) return;
        const osc = SoundEngine.ctx.createOscillator();
        const gain = SoundEngine.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, SoundEngine.ctx.currentTime);
        gain.gain.setValueAtTime(vol, SoundEngine.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, SoundEngine.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(SoundEngine.ctx.destination);
        osc.start();
        osc.stop(SoundEngine.ctx.currentTime + duration);
    },
    click: () => {
        SoundEngine.init();
        SoundEngine.playTone(150, 'square', 0.1);
        SoundEngine.playTone(100, 'sawtooth', 0.15);
    },
    glitch: () => {
        SoundEngine.init();
        if (!SoundEngine.ctx) return;
        
        [0, 0.05, 0.1].forEach(offset => {
             SoundEngine.playTone(800 + Math.random() * 500, 'sawtooth', 0.04, 0.05);
        });
    },
    startArenaLoop: () => {
        SoundEngine.init();
        if (!SoundEngine.ctx) return;
        if (SoundEngine.arenaOsc) {
            SoundEngine.stopArenaLoop();
        }

        const osc = SoundEngine.ctx.createOscillator();
        const gain = SoundEngine.ctx.createGain();
        
        osc.frequency.setValueAtTime(60, SoundEngine.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, SoundEngine.ctx.currentTime + 15);
        
        gain.gain.setValueAtTime(0.2, SoundEngine.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, SoundEngine.ctx.currentTime + 15);
        
        osc.connect(gain);
        gain.connect(SoundEngine.ctx.destination);
        osc.start();
        
        SoundEngine.arenaOsc = osc;
        SoundEngine.arenaGain = gain;
    },
    stopArenaLoop: () => {
        if (SoundEngine.arenaOsc && SoundEngine.ctx) {
            const now = SoundEngine.ctx.currentTime;
            SoundEngine.arenaGain.gain.cancelScheduledValues(now);
            SoundEngine.arenaGain.gain.setValueAtTime(SoundEngine.arenaGain.gain.value, now);
            SoundEngine.arenaGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            SoundEngine.arenaOsc.stop(now + 0.1);
            
            SoundEngine.arenaOsc = null;
            SoundEngine.arenaGain = null;
        }
    }
};

/* --- 3. DATA: CONTENT MANAGEMENT --- */
const MOCK_TWEETS = [
  {
    id: 1,
    handle: "@Jeremybtc",
    comments: "2",
    content: "Manifesting big W’s in november 🙏",
    likes: "9", retweets: "1", font: "font-mono", rotation: "rotate-1",
    url: "https://x.com/Jeremybtc/status/1983924895927996450?s=20" 
  },
  {
    id: 2,
    handle: "@a1lon9",
    comments: "8",
    content: "W Shadow",
    likes: "189", retweets: "11", font: "font-cinzel", rotation: "-rotate-2",
    url: "https://x.com/a1lon9/status/1963049475858985395?s=20" 
  },
  {
    id: 3,
    handle: "@_Shadow36",
    comments: "5",
    content: "W",
    likes: "33", retweets: "13", font: "font-anton", rotation: "rotate-3", highlight: true,
    url: "https://x.com/_Shadow36/status/1991230419971273111?s=20" 
  },
  {
    id: 4,
    handle: "@_Shadow36",
    comments: "10",
    content: "Absolute w",
    likes: "117", retweets: "24", font: "font-gothic", rotation: "-rotate-1",
    url: "https://x.com/_Shadow36/status/1983657988532666614?s=20" 
  },
  {
    id: 5,
    handle: "@Dior100x",
    comments: "4",
    content: "W intern",
    likes: "21", retweets: "4", font: "font-comic", rotation: "rotate-2",
    url: "https://x.com/Dior100x/status/1983623701963927984?s=20" 
  },
  {
    id: 102,
    handle: "@ChartGazer",
    comments: "700",
    content: "I've been staring at the 1m candle for 6 hours. It only goes up. Is my monitor broken or are we just winning that hard?",
    likes: "1.2k", retweets: "400", font: "font-mono", rotation: "-rotate-2",
    url: "https://twitter.com" 
  },
  {
    id: 6,
    handle: "@AbstractArtist",
    comments: "999",
    content: "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    likes: "100k", retweets: "50k", font: "font-mono", rotation: "-rotate-3",
    url: "https://twitter.com" 
  },
  {
    id: 103,
    handle: "@VibeCheck",
    comments: "420",
    content: "Just sold my car for more $W. Walking is healthier anyway. W.",
    likes: "555", retweets: "111", font: "font-comic", rotation: "rotate-1",
    url: "https://twitter.com" 
  },
  {
    id: 104,
    handle: "@SystemAdmin",
    comments: "10",
    content: "root@server:~$ sudo apt-get remove --purge lose_condition.exe \n> Success. Only winning remains.",
    likes: "1337", retweets: "404", font: "font-mono", rotation: "rotate-0", code: true,
    url: "https://twitter.com" 
  },
  {
    id: 105,
    handle: "@FutureOracle",
    comments: "33k",
    content: "In 2030, $W will be the global reserve currency. Coffee will cost 0.00001 W.",
    likes: "88k", retweets: "22k", font: "font-cinzel", rotation: "-rotate-1",
    url: "https://twitter.com" 
  },
  {
    id: 106,
    handle: "@Anon442",
    comments: "0",
    content: "Instructions unclear, I now own 100% of the supply.",
    likes: "1", retweets: "0", font: "font-gothic", rotation: "rotate-3",
    url: "https://twitter.com" 
  }
];

// NEW: DID YOU KNOW FACTS ARRAY
const DID_YOU_KNOW_FACTS = [
    "Winning is 10% luck, 20% skill, and 70% holding $W until your hands turn into diamonds.",
    "Scientists have confirmed that the shape of the letter 'W' is aerodynamically incapable of losing.",
    "If you type 'W' 10,000 times, your portfolio automatically goes up. (Not financial advice).",
    "The letter 'L' was invented by the government to keep you humble. Reject it.",
    "In ancient Rome, gladiators didn't say 'goodbye', they whispered 'W' and walked away backwards.",
    "Your keyboard has a W key for a reason. Use it or lose it.",
    "Gravity is just the earth trying to give you an L. Jump to assert dominance.",
    "A double U is literally twice the value of a single U. Do the math.",
    "This website consumes 0% electricity and 100% pure adrenaline.",
    "Fact: 99% of people who don't buy $W eventually regret it in the metaverse."
];

/* --- 4. SUB-COMPONENTS --- */

// CONTRACT ADDRESS COMPONENT
const ContractAddress = () => {
    const [copied, setCopied] = useState(false);
    // EDIT CA HERE
    const ca = "0xW000000000000000000000000000000000000000"; 

    const handleCopy = (e) => {
        e.stopPropagation();
        SoundEngine.click();
        
        const fallbackCopy = () => {
             const textArea = document.createElement("textarea");
             textArea.value = ca;
             document.body.appendChild(textArea);
             textArea.select();
             try {
                document.execCommand("copy");
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
             } catch (err) {
                console.error('Fallback copy failed', err);
             }
             document.body.removeChild(textArea);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(ca)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch((err) => {
                    console.warn('Clipboard API blocked, using fallback', err);
                    fallbackCopy();
                });
        } else {
             fallbackCopy();
        }
    };

    return (
        <div 
            className="group relative flex items-center gap-2 bg-neutral-900 border border-neutral-700 px-4 py-2 mt-8 mb-4 font-mono text-xs md:text-sm text-neutral-400 hover:border-[var(--accent)] hover:text-white transition-all cursor-pointer select-none overflow-hidden"
            onClick={handleCopy}
        >
            <span className="text-[var(--accent)] font-bold">CA:</span>
            <span className="truncate max-w-[150px] md:max-w-xs">{ca}</span>
            <div className="ml-2 w-px h-4 bg-neutral-700 group-hover:bg-[var(--accent)]"></div>
            {copied ? <Check size={16} className="text-[var(--accent)]" /> : <Copy size={16} />}
            
            {copied && (
                <div className="absolute inset-0 bg-[var(--accent)] text-black flex items-center justify-center font-bold tracking-widest animate-in slide-in-from-bottom duration-200">
                    COPIED
                </div>
            )}
        </div>
    );
};

// Dominance Index
const DominanceIndex = ({ score }) => (
  <div className="fixed bottom-4 right-4 z-[9000] bg-black border border-[var(--accent)] p-3 font-mono text-xs md:text-sm text-[var(--accent)] uppercase tracking-wider select-none shadow-[0_0_10px_rgba(204,255,0,0.3)]">
    <span className="animate-pulse mr-2">●</span>
    Dominance Index: <span className="font-bold text-white">{score}</span> Ws
  </div>
);

// Cursor Trail
const CursorTrail = () => {
  const [trail, setTrail] = useState([]);
  useEffect(() => {
    const handleMove = (e) => {
      if (Math.random() > 0.7) {
        const id = Date.now();
        setTrail(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
        setTimeout(() => setTrail(prev => prev.filter(p => p.id !== id)), 800);
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  return (
    <>{trail.map(p => (<div key={p.id} className="trail-w text-sm" style={{ left: p.x, top: p.y }}>W</div>))}</>
  );
};

// Floating Background Ws (WITH PARALLAX SCROLL REACTION)
const FloatingWs = () => {
  const [elements, setElements] = useState([]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
        // Just capture scroll position for simple parallax
        requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fonts = ['font-anton', 'font-cinzel', 'font-mono', 'font-comic', 'font-gothic'];
    const newElements = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 8 + 2,
      font: fonts[Math.floor(Math.random() * fonts.length)],
      rotation: Math.random() * 360,
      opacity: Math.random() * 0.2 + 0.05,
      // CSS Variables for the animation
      duration: `${Math.random() * 40 + 60}s`,
      dx: `${Math.random() * 200 - 100}px`,
      dy: `${Math.random() * 200 - 100}px`,
      rot: `${Math.random() * 90 - 45}deg`
    }));
    setElements(newElements);
  }, []);

  return (
    <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }} // Subtle parallax drift
    >
      {elements.map(el => (
        <div 
            key={el.id} 
            className={`absolute text-white select-none w-drifter ${el.font}`} 
            style={{
                left: `${el.x}%`, top: `${el.y}%`, fontSize: `${el.size}rem`,
                '--duration': el.duration, 
                '--dx': el.dx, 
                '--dy': el.dy, 
                '--rot': el.rot,
                opacity: el.opacity,
            }}
        >W</div>
      ))}
    </div>
  );
};

// Velocity Marquee (UPDATED PHRASES)
const VelocityMarquee = () => {
  const [offset, setOffset] = useState(0);
  const rafRef = useRef();
  const lastScrollY = useRef(0);
  // PUNCHY PHRASES
  const phrases = ["NO Ls ALLOWED", "STRICTLY Ws", "W IS THE CODE", "WWWWWWWW"]; 

  const animate = useCallback(() => {
    const currentScrollY = window.scrollY;
    const velocity = Math.abs(currentScrollY - lastScrollY.current);
    lastScrollY.current = currentScrollY;
    const speed = 2 + (velocity * 0.5); 
    setOffset(prev => (prev - speed) % 1000); 
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return (
    <div className="relative w-full overflow-hidden bg-[var(--accent)] py-2 md:py-4 -rotate-2 scale-110 z-10 border-y-4 border-black mb-12">
      <div className="whitespace-nowrap font-black font-anton text-4xl md:text-6xl text-black flex items-center gap-8" style={{ transform: `translateX(${offset}px)` }}>
        {[...Array(20)].map((_, i) => (
          <span key={i} className="flex items-center gap-8">
            {phrases[i % phrases.length]} <Ban size={32} strokeWidth={4} />
          </span>
        ))}
      </div>
    </div>
  );
};

// Tweet Card
const TweetCard = ({ tweet }) => {
    const { comments, url, rotation, isAlert, handle, font, highlight, code, retweets, likes } = tweet;

    return (
        <div 
            className={`tweet-card w-full max-w-md mx-auto border border-neutral-800 p-6 mb-8 cursor-pointer relative overflow-hidden group ${rotation}`}
            onClick={(e) => {
                e.stopPropagation();
                SoundEngine.click();
                window.open(url, '_blank');
            }}
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isAlert ? 'bg-red-600 text-white' : 'bg-neutral-800 group-hover:bg-[var(--accent)] group-hover:text-black'}`}>
                        {isAlert ? <AlertTriangle size={20} /> : <span className="font-bold text-xl">W</span>}
                    </div>
                    <div className="flex flex-col">
                        <span className={`font-bold group-hover:text-[var(--accent)] ${isAlert ? 'text-red-500' : 'text-neutral-200'}`}>{handle}</span>
                        <span className="text-xs text-neutral-500">@w_index_</span>
                    </div>
                </div>
                <Twitter className="w-5 h-5 text-neutral-600 group-hover:text-blue-400 transition-colors" />
            </div>
            
            {code ? (
                <div className="bg-black p-3 rounded border border-neutral-800 mb-4 font-mono text-xs text-green-400">{tweet.content}</div>
            ) : (
                <p className={`text-xl mb-6 text-neutral-100 leading-snug ${font} ${highlight ? 'text-[var(--accent)]' : ''}`}>{tweet.content}</p>
            )}
            
            <div className="flex justify-between text-neutral-500 text-sm font-mono relative z-10">
                <div className="flex gap-4">
                    {/* USES EDITABLE COMMENTS FIELD */}
                    <span className="flex items-center gap-1 hover:text-pink-500 transition-colors"><MessageCircle size={14} /> {comments}</span> 
                    <span className="flex items-center gap-1 hover:text-green-500 transition-colors"><Repeat size={14} /> {retweets}</span>
                    <span className="flex items-center gap-1 hover:text-red-500 transition-colors"><Heart size={14} /> {likes}</span>
                </div>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">VIEW <ArrowUpRight size={14} /></span>
            </div>
        </div>
    );
};

// LIVE CHART SECTION
const LiveChartSection = () => {
    return (
        <div className="break-inside-avoid w-full border-4 border-[var(--accent)] bg-black mb-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 bg-[var(--accent)] text-black font-mono text-xs font-bold px-2 py-1 z-20">
                LIVE MARKET DATA // $W
            </div>
            {/* PASTE DEXSCREENER EMBED CODE HERE */}
            <div className="w-full h-[400px] flex items-center justify-center bg-neutral-900 text-neutral-500 font-mono text-center p-8">
                 <div className="flex flex-col items-center animate-pulse">
                    <TrendingUp size={48} className="mb-4 text-[var(--accent)]"/>
                    <p>CHART FEED INITIALIZING...</p>
                    <p className="text-xs mt-2 opacity-50">(Edit code to insert Dexscreener Iframe)</p>
                 </div>
            </div>
        </div>
    );
};

// Interactive "Did You Know" Component
const DidYouKnowBox = () => {
    const [index, setIndex] = useState(0);
    const [animating, setAnimating] = useState(false);

    const handleNext = (e) => {
        e.stopPropagation();
        SoundEngine.click();
        setAnimating(false);
        // Force reflow for animation restart
        setTimeout(() => {
            setIndex((prev) => (prev + 1) % DID_YOU_KNOW_FACTS.length);
            setAnimating(true);
        }, 10);
    };

    return (
        <div 
             className="break-inside-avoid p-8 bg-[var(--accent)] text-black mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-300 cursor-pointer select-none relative overflow-hidden group"
             onClick={handleNext}
        >
             <div className="absolute top-2 right-2 opacity-50"><Repeat size={16}/></div>
             <h3 className="font-anton text-4xl uppercase mb-2">Did you know?</h3>
             <p className={`font-mono text-sm leading-relaxed ${animating ? 'fact-slide' : ''}`} key={index}>
                {DID_YOU_KNOW_FACTS[index]}
             </p>
             <p className="text-[10px] font-bold mt-4 opacity-60 uppercase tracking-widest">TAP FOR MORE TRUTH</p>
        </div>
    );
};


// ARENA MODE: THE W-VORTEX
const ArenaOverlay = ({ onExit }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    
    // UI State
    const [dominance, setDominance] = useState(0); 
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState('IDLE'); 
    const [activePerk, setActivePerk] = useState(null); // 'LEVERAGE' or 'HODL' or null
    const [currentStage, setCurrentStage] = useState("VOID");

    // Mutable State
    const state = useRef({
        grid: [],
        cols: 0,
        rows: 0,
        pointers: new Map(),
        frame: 0,
        sessionHigh: 0,
        hasStarted: false,
        // Power Up State
        floatingItem: null, // { x, y, dx, dy, type, trail: [] }
        perkTimer: 0,       // How many frames the perk lasts
        nextSpawnTime: 300, // Frames until next spawn
    });

    // Audio Ref
    const audioRef = useRef({ ctx: null, oscillator: null, gainNode: null, noiseNode: null, noiseGain: null, filter: null });

    const config = {
        fontSize: 16,
        baseDecay: 1.5,
        dragDecay: 0.06, 
        inputSensitivity: 35,
    };

    // --- AUDIO SYSTEM ---
    const stopAudio = () => {
        if (audioRef.current.ctx) {
            try { audioRef.current.ctx.close(); } catch (e) {}
            audioRef.current = { ctx: null, oscillator: null, gainNode: null, noiseNode: null, noiseGain: null, filter: null };
        }
    };

    const initAudio = () => {
        if (!audioRef.current.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            
            // Order Sound (Synth)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth'; 
            osc.frequency.value = 60; 
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 100;
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            gain.gain.value = 0;

            // Chaos Sound (Static) - LOW VOLUME
            const bufferSize = ctx.sampleRate * 2; 
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            const noiseGain = ctx.createGain();
            noise.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start();
            noiseGain.gain.value = 0.02; // Quiet static

            audioRef.current = { ctx, oscillator: osc, gainNode: gain, noiseNode: noise, noiseGain, filter };
        } else if (audioRef.current.ctx.state === 'suspended') {
            audioRef.current.ctx.resume();
        }
    };

    const updateAudio = (avg, perk) => {
        if (audioRef.current.ctx) {
            const { oscillator, gainNode, filter, ctx } = audioRef.current;
            const normalized = avg / 100;

            // Pitch effect
            let targetFreq = 60 + (normalized * normalized * 400); 
            if (perk === 'HODL') targetFreq = 600; // High freeze tone
            if (perk === 'LEVERAGE') targetFreq = 40; // Low bass rumble

            oscillator.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);

            const targetFilter = 100 + (normalized * 5000);
            filter.frequency.setTargetAtTime(targetFilter, ctx.currentTime, 0.1);

            const targetVol = avg < 30 ? 0 : normalized * 0.15;
            gainNode.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.1);
        }
    };

    // --- GAME LOGIC ---
    useEffect(() => {
        const savedScore = localStorage.getItem('w_dominance_highscore');
        if (savedScore) setHighScore(parseInt(savedScore));

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const initGrid = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            state.current.cols = Math.ceil(canvas.width / config.fontSize);
            state.current.rows = Math.ceil(canvas.height / config.fontSize);
            state.current.grid = new Array(state.current.cols * state.current.rows).fill(0);
        };
        initGrid();

        // --- ITEM SPAWNER ---
        const spawnItem = () => {
            const types = ['LEVERAGE', 'HODL'];
            const type = types[Math.floor(Math.random() * types.length)];
            const isLeft = Math.random() > 0.5;
            
            state.current.floatingItem = {
                x: isLeft ? 0 : canvas.width,
                y: Math.random() * (canvas.height - 200) + 100,
                dx: isLeft ? (Math.random() * 5 + 3) : -(Math.random() * 5 + 3), 
                dy: (Math.random() - 0.5) * 4, 
                type: type,
                trail: [] 
            };
        };

        // --- INPUTS ---
        const updatePointer = (id, x, y) => {
            const prev = state.current.pointers.get(id);
            let velocity = 0;
            if (prev) {
                const dx = x - prev.x;
                const dy = y - prev.y;
                velocity = Math.sqrt(dx*dx + dy*dy);
            }
            state.current.pointers.set(id, { x, y, velocity });
        };

        const handleStartInteraction = () => {
            if (!state.current.hasStarted && gameState === 'IDLE') {
                state.current.hasStarted = true;
                setGameState('ACTIVE');
                initAudio();
            }
        };

        const handleInputMove = (x, y) => { if (state.current.pointers.has('mouse')) updatePointer('mouse', x, y); };
        const onMouseDown = (e) => { handleStartInteraction(); updatePointer('mouse', e.clientX, e.clientY); };
        const onMouseMove = (e) => handleInputMove(e.clientX, e.clientY);
        const onMouseUp = () => state.current.pointers.delete('mouse');
        const onTouchStart = (e) => {
            e.preventDefault(); handleStartInteraction();
            for (let i=0; i<e.touches.length; i++) updatePointer(e.touches[i].identifier, e.touches[i].clientX, e.touches[i].clientY);
        };
        const onTouchMove = (e) => {
            e.preventDefault();
            const newMap = new Map();
            for (let i=0; i<e.touches.length; i++) {
                const t = e.touches[i];
                const prev = state.current.pointers.get(t.identifier);
                let v = 0;
                if(prev) v = Math.sqrt(Math.pow(t.clientX-prev.x, 2) + Math.pow(t.clientY-prev.y, 2));
                newMap.set(t.identifier, {x: t.clientX, y: t.clientY, velocity: v});
            }
            state.current.pointers = newMap;
        };

        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchStart, { passive: false });
        window.addEventListener('resize', initGrid);

        // --- RENDER LOOP ---
        const render = () => {
            if (gameState === 'GAME_OVER') return;

            state.current.frame++;
            const { cols, grid, pointers, floatingItem, perkTimer } = state.current;

            // 1. MANAGE ACTIVE PERK
            if (perkTimer > 0) {
                state.current.perkTimer--;
                if (state.current.perkTimer <= 0) setActivePerk(null);
            }

            // 2. SPAWN LOGIC
            state.current.nextSpawnTime--;
            if (state.current.nextSpawnTime <= 0) {
                spawnItem();
                state.current.nextSpawnTime = Math.random() * 500 + 400; // Random spawn 7-15 seconds
            }

            // 3. BACKGROUND & STAGE COLORS
            // Determine base colors from Score or Perk
            let bgFill = 'rgba(5, 5, 5, 0.2)';
            let primaryText = '#ccff00';
            let secondaryText = '#330000';
            
            // Calculate temp avg for color logic
            let tempTotal = 0;
            for(let i=0; i<grid.length; i+=50) tempTotal += grid[i];
            const currentAvg = tempTotal / (grid.length/50);

            if (activePerk === 'HODL') {
                bgFill = 'rgba(0, 20, 20, 0.1)'; 
                primaryText = '#00ffff';
                secondaryText = '#003333';
            } else if (activePerk === 'LEVERAGE') {
                bgFill = 'rgba(0, 0, 20, 0.1)';
                primaryText = '#4444ff';
                secondaryText = '#000033';
            } else if (currentAvg >= 90) { // GOD MODE
                bgFill = 'rgba(204, 255, 0, 0.3)'; // Inverted
                primaryText = '#000000';
                secondaryText = '#ffffff';
            } else if (currentAvg >= 65) {
                primaryText = '#ffffff';
            }

            ctx.fillStyle = bgFill;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 4. DRAW FLOATING ITEM
            if (floatingItem) {
                floatingItem.x += floatingItem.dx;
                floatingItem.y += floatingItem.dy;
                
                if (state.current.frame % 3 === 0) {
                    floatingItem.trail.push({x: floatingItem.x, y: floatingItem.y});
                    if (floatingItem.trail.length > 20) floatingItem.trail.shift();
                }

                // Collision
                let caught = false;
                for (let [id, ptr] of pointers) {
                    const dist = Math.sqrt(Math.pow(floatingItem.x - ptr.x, 2) + Math.pow(floatingItem.y - ptr.y, 2));
                    if (dist < 80) caught = true; 
                }

                if (caught) {
                    setActivePerk(floatingItem.type);
                    state.current.perkTimer = 400; 
                    state.current.floatingItem = null; 
                } else if (floatingItem.x < -100 || floatingItem.x > canvas.width + 100) {
                    state.current.floatingItem = null;
                } else {
                    // Draw Trail
                    ctx.fillStyle = floatingItem.type === 'HODL' ? '#00ffff' : '#3333ff';
                    floatingItem.trail.forEach((t, i) => {
                        ctx.globalAlpha = i / 20;
                        ctx.font = '20px monospace';
                        ctx.fillText(floatingItem.type === 'HODL' ? '❄' : '▲', t.x, t.y);
                    });
                    ctx.globalAlpha = 1.0;
                    ctx.font = '40px monospace';
                    ctx.fillText(floatingItem.type === 'HODL' ? '[❄]' : '[▲]', floatingItem.x, floatingItem.y);
                }
            }

            // 5. GRID PHYSICS
            ctx.font = `bold ${config.fontSize}px monospace`;
            ctx.textBaseline = 'top';
            
            let totalEnergy = 0;

            // Physics Modifiers
            let currentDecay = config.baseDecay;
            let currentRadius = 100;
            let currentSensitivity = config.inputSensitivity;

            if (activePerk === 'HODL') {
                currentDecay = 0; // FREEZE
            } 
            if (activePerk === 'LEVERAGE') {
                currentRadius = 300; 
                currentSensitivity = 100; 
            } else {
                 if (activePerk !== 'HODL') currentDecay += (currentAvg * config.dragDecay);
            }

            for (let i = 0; i < grid.length; i++) {
                const x = (i % cols) * config.fontSize;
                const y = Math.floor(i / cols) * config.fontSize;

                let inputImpact = 0;
                for (let [id, ptr] of pointers) {
                    const dist = Math.sqrt(Math.pow(x - ptr.x, 2) + Math.pow(y - ptr.y, 2));
                    if (dist < currentRadius) {
                        const vMult = Math.min(ptr.velocity, 40) / 4; 
                        const impactCalc = ((currentRadius - dist) / currentRadius);
                        inputImpact += impactCalc * (currentSensitivity + vMult);
                    }
                }

                grid[i] = Math.min(100, Math.max(0, grid[i] + inputImpact - currentDecay));
                totalEnergy += grid[i];
                
                // RENDERING
                const g = grid[i];
                if (g > 30) {
                    ctx.fillStyle = primaryText;
                    // God Mode Glitch
                    if (currentAvg >= 90 && activePerk === null && Math.random() > 0.8) ctx.fillStyle = '#ffffff';
                    
                    const char = (g >= 90) ? "W" : (Math.random() > 0.9 ? "$" : "W");
                    ctx.fillText(char, x, y);
                } else {
                     if (Math.random() > 0.6) {
                        ctx.fillStyle = secondaryText;
                        const char = Math.random() > 0.5 ? "L" : ".";
                        ctx.fillText(char, x, y);
                    }
                }
            }

            // 6. UI & LOGIC
            const avg = Math.floor(totalEnergy / grid.length);
            
            if (state.current.frame % 4 === 0) {
                setDominance(avg);
                updateAudio(avg, activePerk);

                // Stage Logic
                if (avg >= 90) setCurrentStage("GOD MODE");
                else if (avg >= 65) setCurrentStage("VOLATILITY");
                else if (avg >= 50) setCurrentStage("MOMENTUM");
                else if (avg >= 30) setCurrentStage("AWAKENING");
                else setCurrentStage("VOID");

                if (state.current.hasStarted && avg <= 0) {
                    setGameState('GAME_OVER');
                    stopAudio();
                }

                if (avg > state.current.sessionHigh) {
                    state.current.sessionHigh = avg;
                    if (avg > parseInt(localStorage.getItem('w_dominance_highscore') || '0')) {
                        localStorage.setItem('w_dominance_highscore', avg.toString());
                        setHighScore(avg);
                    }
                }
            }

            requestRef.current = requestAnimationFrame(render);
        };
        requestRef.current = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('resize', initGrid);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchStart);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            stopAudio();
        };
    }, [gameState, activePerk]);

    const handleRetry = () => {
        state.current.sessionHigh = 0;
        state.current.hasStarted = false; 
        state.current.grid.fill(0);
        state.current.nextSpawnTime = 100;
        state.current.floatingItem = null;
        state.current.perkTimer = 0;
        setDominance(0);
        setActivePerk(null);
        setGameState('IDLE');
        setCurrentStage("VOID");
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-black cursor-crosshair overflow-hidden font-mono select-none">
            
            <canvas ref={canvasRef} className={`absolute inset-0 block w-full h-full touch-none transition-opacity duration-1000 ${gameState === 'GAME_OVER' ? 'opacity-20' : 'opacity-100'}`} />

            {/* HUD */}
            <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-40 pointer-events-none mix-blend-exclusion text-white">
                <div className="flex flex-col">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                        ENTROPY<br/>ENGINE
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        {activePerk ? (
                            <span className={`px-2 py-1 text-sm font-black inline-block animate-pulse border-2
                                ${activePerk === 'HODL' ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'bg-[#3333ff] text-white border-white'}`}>
                                {activePerk === 'HODL' ? '❄ SYSTEM FROZEN ❄' : '▲ LEVERAGE ACTIVE ▲'}
                            </span>
                        ) : (
                            <span className={`px-2 py-1 text-xs font-bold inline-block animate-pulse 
                                ${currentStage === 'GOD MODE' ? 'bg-black text-[#ccff00] border border-[#ccff00]' : 'bg-[#ccff00] text-black'}`}>
                                {gameState === 'IDLE' ? 'TOUCH TO START' : `ZONE: ${currentStage}`}
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest mb-1 opacity-70">Buying Pressure</div>
                    <div className={`text-6xl font-black tabular-nums transition-colors duration-300
                        ${activePerk === 'HODL' ? 'text-[#00ffff]' : activePerk === 'LEVERAGE' ? 'text-[#5555ff]' : currentStage === 'GOD MODE' ? 'text-white' : 'text-[#ccff00]'}`}>
                        {dominance}%
                    </div>
                    <div className="text-xs text-white/50">Rec: {highScore}%</div>
                </div>
            </div>

            {/* GAME OVER SCREEN */}
            {gameState === 'GAME_OVER' && (
                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="border-2 border-red-600 p-8 md:p-12 bg-black text-center max-w-lg w-full relative overflow-hidden shadow-[0_0_100px_rgba(255,0,0,0.3)] animate-in fade-in zoom-in duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
                        <h2 className="text-red-600 text-4xl md:text-5xl font-black uppercase mb-2 tracking-tighter">LIQUIDATED</h2>
                        <p className="text-white/50 text-xs font-mono mb-8 uppercase tracking-widest">Momentum Reached Zero</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 p-4 border-l-2 border-red-600">
                                <div className="text-red-600 text-xs uppercase mb-1">Session Peak</div>
                                <div className="text-white text-4xl font-black">{state.current.sessionHigh}%</div>
                            </div>
                            <div className="bg-white/5 p-4 border border-white/10">
                                <div className="text-white/50 text-xs uppercase mb-1">All-Time High</div>
                                <div className="text-white text-4xl font-black">{highScore}%</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 justify-center">
                            <button onClick={handleRetry} className="w-full bg-white text-black px-6 py-4 font-black uppercase text-xl hover:bg-[#ccff00] transition-colors skew-x-[-10deg]">
                                Re-Enter Arena
                            </button>
                            <button onClick={onExit} className="w-full text-white/50 px-6 py-2 font-mono text-xs uppercase hover:text-white transition-colors">
                                Accept Defeat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


/* --- 5. MAIN APP --- */
const App = () => {
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [isVictoryMode, setIsVictoryMode] = useState(false);
  const [claimText, setClaimText] = useState("Claim Victory");
  const [dominanceScore, setDominanceScore] = useState(0);
  const [clicks, setClicks] = useState([]);
  const [inArena, setInArena] = useState(false);
  
  const lastScrollY = useRef(0);
  const containerRef = useRef(null);

  // Scroll Velocity Logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const velocity = currentScrollY - lastScrollY.current;
      setScrollVelocity(v => v * 0.9 + velocity * 0.1);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Idle reset
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollVelocity(v => {
        if (Math.abs(v) < 0.1) return 0;
        return v * 0.8;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Global Click Handler
  useEffect(() => {
    const fonts = ['font-anton', 'font-cinzel', 'font-mono', 'font-comic', 'font-gothic'];
    const handleClick = (e) => {
      SoundEngine.init(); 
      SoundEngine.click();
      setDominanceScore(prev => prev + 1); 

      const id = Date.now();
      const newClick = {
        id, x: e.clientX, y: e.clientY,
        rot: Math.random() * 90 - 45 + 'deg',
        font: fonts[Math.floor(Math.random() * fonts.length)],
        color: Math.random() > 0.5 ? 'var(--accent)' : '#fff'
      };
      setClicks(prev => [...prev, newClick]);
      setTimeout(() => setClicks(prev => prev.filter(c => c.id !== id)), 700);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleClaimVictory = (e) => {
      e.stopPropagation();
      SoundEngine.click();
      setIsVictoryMode(true);
      setClaimText("WINNER DETECTED");
      setTimeout(() => setIsVictoryMode(false), 600);
      setTimeout(() => setClaimText("Claim Victory"), 3000);
  };

  const skewAmount = Math.min(Math.max(scrollVelocity * 0.2, -10), 10);

  // RENDER ARENA
  if (inArena) {
      return (
        <>
            <GlobalStyles />
            <ArenaOverlay onExit={() => setInArena(false)} />
        </>
      );
  }

  return (
    <div className={`min-h-screen bg-black text-white overflow-x-hidden selection:bg-[var(--accent)] selection:text-black ${isVictoryMode ? 'victory-mode' : ''}`}>
      <GlobalStyles />
      <div className="noise" />
      <FloatingWs />
      <CursorTrail />
      <DominanceIndex score={dominanceScore} />

      {/* Click Explosions Render */}
      {clicks.map(c => (
        <div key={c.id} className={`click-w text-4xl ${c.font}`} style={{ left: c.x, top: c.y, '--rot': c.rot, color: c.color }}>W</div>
      ))}

      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference">
        <div className="text-4xl font-black font-anton tracking-tighter hover:scale-110 transition-transform cursor-pointer">W</div>
        <button 
          className="border-2 border-[var(--accent)] text-[var(--accent)] px-6 py-2 md:px-8 md:py-2 rounded-full font-mono text-xs md:text-sm bg-black hover:bg-[var(--accent)] hover:text-black transition-all hover:scale-105 hover:rotate-2 uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(204,255,0,0.3)]"
          onClick={() => {
              window.open('https://app.uniswap.org/', '_blank');
          }}
        >
          <span>ACQUIRE $W</span>
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-4 z-10">
        <div className="elastic-content text-center flex flex-col items-center" style={{ transform: `skewY(${skewAmount}deg)` }}>
          <div className="mb-4 text-[var(--accent)] font-mono text-sm tracking-[0.5em] animate-bounce">
            TICKER: $W
          </div>
          
          <div 
             className="text-[15vw] leading-[0.8] font-black font-anton uppercase mb-4 cursor-default select-none hover-glitch mix-blend-screen transition-transform duration-100 hover:scale-110 hover:skew-x-12"
             onMouseEnter={() => SoundEngine.glitch()}
             onClick={() => SoundEngine.glitch()}
          >
             JUST<br />WIN
          </div>

          <ContractAddress />

          <p className="max-w-xl text-center text-neutral-400 font-mono text-lg md:text-xl leading-relaxed mb-12 mix-blend-exclusion select-none px-4">
            Not a project. A state of being. The ticker is $W. The vibe is absolute victory. Welcome to the winner's circle.
          </p>

          <button 
            className="group relative px-12 py-6 bg-white text-black font-black text-2xl uppercase tracking-tighter overflow-hidden border-2 border-white hover:border-[var(--accent)] transition-colors"
            onClick={(e) => {
                e.stopPropagation();
                SoundEngine.click();
                setInArena(true);
            }}
          >
            <span className="relative z-10 group-hover:text-[var(--accent)] mix-blend-difference transition-colors">Enter The Arena</span>
            <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          </button>
        </div>
      </section>

      <VelocityMarquee />

      {/* MAIN CONTENT FEED */}
      <section className="relative z-20 pb-24 px-4 md:px-12 bg-black/50 backdrop-blur-sm">
        
        <div className="mb-24 text-center">
          <h2 className="text-6xl md:text-8xl font-gothic text-white mb-4 transform -rotate-2 select-none">THE FEED</h2>
          <div className="w-24 h-2 bg-[var(--accent)] mx-auto animate-pulse" />
        </div>

        <div ref={containerRef} className="elastic-content max-w-7xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8" style={{ transform: `skewY(${skewAmount * 0.5}deg)` }}>
          
          <LiveChartSection />

          {MOCK_TWEETS.map((tweet) => (
            <div key={tweet.id} className="break-inside-avoid">
              <TweetCard tweet={tweet} />
            </div>
          ))}
          
          <DidYouKnowBox />

          <div 
              className={`break-inside-avoid p-12 border-4 ${claimText === 'WINNER DETECTED' ? 'border-[var(--accent)] bg-[var(--accent)] text-black scale-110' : 'border-white text-white hover:bg-white hover:text-black'} mb-8 text-center transition-all duration-100 cursor-pointer group select-none`}
              onClick={handleClaimVictory}
          >
            <Trophy size={64} className={`mx-auto mb-4 ${claimText === 'WINNER DETECTED' ? 'animate-bounce' : 'group-hover:animate-spin'}`} />
            <h3 className="font-cinzel text-2xl font-bold">{claimText}</h3>
          </div>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="relative z-20 py-24 bg-[var(--accent)] text-black overflow-hidden">
        <div className="absolute inset-0 opacity-10">
           {Array.from({length: 10}).map((_, i) => (
             <div key={i} className="absolute text-9xl font-black" style={{ 
               top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, transform: `rotate(${Math.random() * 360}deg)`
             }}>W</div>
           ))}
        </div>

        <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-end">
          <div>
            <h2 className="text-9xl font-black font-anton leading-none tracking-tighter mb-4 select-none">KEEP<br/>WINNING</h2>
            <div className="flex gap-4 font-mono text-sm uppercase font-bold tracking-widest">
              <a href="#" className="hover:underline decoration-4">Twitter</a>
              <a href="#" className="hover:underline decoration-4">Dexscreener</a>
            </div>
          </div>
          
          <div className="mt-12 md:mt-0 text-right">
            <p className="font-mono text-xs max-w-xs ml-auto mb-4 font-bold">Paper hands are a myth. We only know diamond grips and green candles. This is financial advice: Win.</p>
            <div className="text-4xl font-gothic animate-pulse">© 2025</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;