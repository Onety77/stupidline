
import './App.css'
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

    /* ARENA MODE: W-VORTEX STYLES */
    .arena-container {
      perspective: 1000px;
      overflow: hidden;
      background: #000;
    }
    .tunnel-w {
      position: absolute;
      top: 50%; left: 50%;
      transform-style: preserve-3d;
      font-family: 'Anton', sans-serif;
      color: transparent;
      -webkit-text-stroke: 1px var(--accent);
    }
    @keyframes tunnel-move {
      0% { transform: translate(-50%, -50%) translateZ(-1000px) rotate(0deg); opacity: 0; }
      20% { opacity: 1; }
      100% { transform: translate(-50%, -50%) translateZ(1000px) rotate(180deg); opacity: 0; }
    }
    
    /* Slide Animation for Facts */
    @keyframes slide-in-right {
        0% { transform: translateX(20px); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
    }
    .fact-slide {
        animation: slide-in-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
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
        
        // NEW: Harsh, rapid stutter for the JUST WIN text
        [0, 0.05, 0.1].forEach(offset => {
             SoundEngine.playTone(800 + Math.random() * 500, 'sawtooth', 0.04, 0.05);
        });
    },
    // UPDATED: Faster Loop for Arena
    startArenaLoop: () => {
        SoundEngine.init();
        if (!SoundEngine.ctx) return;
        if (SoundEngine.arenaOsc) {
            SoundEngine.stopArenaLoop();
        }

        const osc = SoundEngine.ctx.createOscillator();
        const gain = SoundEngine.ctx.createGain();
        
        // Start audible immediately
        osc.frequency.setValueAtTime(60, SoundEngine.ctx.currentTime);
        // Ramp up faster (15 seconds instead of 60) for immediate tension
        osc.frequency.exponentialRampToValueAtTime(400, SoundEngine.ctx.currentTime + 15);
        
        // Louder start
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
    handle: "@WinnerMindset",
    content: "If you aren't collecting Ws, you are functionally invisible. The W is not a letter, it is a lifestyle choice.",
    likes: "8.2k", retweets: "4.1k", font: "font-mono", rotation: "rotate-1",
    url: "https://twitter.com" 
  },
  {
    id: 2,
    handle: "@TypographyNerd",
    content: "Consider the geometry of the W. Two Vs connected. Double victory. It is structurally the strongest letter in the alphabet.",
    likes: "12k", retweets: "900", font: "font-cinzel", rotation: "-rotate-2",
    url: "https://twitter.com" 
  },
  {
    id: 3,
    handle: "@CryptoDegenz",
    content: "$W ticker is live. We are not going to the moon. We are going to a completely different dimension where gravity is optional.",
    likes: "44k", retweets: "12k", font: "font-anton", rotation: "rotate-3", highlight: true,
    url: "https://twitter.com" 
  },
  {
    id: 101,
    handle: "@NoLs_Official",
    content: "WARNING: Holding Ls is strictly prohibited in this sector. Violators will be mocked.",
    likes: "99k", retweets: "12k", font: "font-mono", rotation: "rotate-2", isAlert: true,
    url: "https://twitter.com" 
  },
  {
    id: 4,
    handle: "@PhilosophyBot",
    content: "L is merely a W waiting to happen. Invert your perspective. Literally turn your phone upside down.",
    likes: "300", retweets: "50", font: "font-gothic", rotation: "-rotate-1",
    url: "https://twitter.com" 
  },
  {
    id: 5,
    handle: "@DesignCrimes",
    content: "Why stick to grid systems when you can just scatter Ws everywhere? Chaos is the new UX.",
    likes: "9k", retweets: "2k", font: "font-comic", rotation: "rotate-6",
    url: "https://twitter.com" 
  },
  {
    id: 102,
    handle: "@ChartGazer",
    content: "I've been staring at the 1m candle for 6 hours. It only goes up. Is my monitor broken or are we just winning that hard?",
    likes: "1.2k", retweets: "400", font: "font-mono", rotation: "-rotate-2",
    url: "https://twitter.com" 
  },
  {
    id: 6,
    handle: "@AbstractArtist",
    content: "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    likes: "100k", retweets: "50k", font: "font-mono", rotation: "-rotate-3",
    url: "https://twitter.com" 
  },
  {
    id: 103,
    handle: "@VibeCheck",
    content: "Just sold my car for more $W. Walking is healthier anyway. W.",
    likes: "555", retweets: "111", font: "font-comic", rotation: "rotate-1",
    url: "https://twitter.com" 
  },
  {
    id: 104,
    handle: "@SystemAdmin",
    content: "root@server:~$ sudo apt-get remove --purge lose_condition.exe \n> Success. Only winning remains.",
    likes: "1337", retweets: "404", font: "font-mono", rotation: "rotate-0", code: true,
    url: "https://twitter.com" 
  },
  {
    id: 105,
    handle: "@FutureOracle",
    content: "In 2030, $W will be the global reserve currency. Coffee will cost 0.00001 W.",
    likes: "88k", retweets: "22k", font: "font-cinzel", rotation: "-rotate-1",
    url: "https://twitter.com" 
  },
  {
    id: 106,
    handle: "@Anon442",
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
            // Removed onMouseEnter hover sound
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

// Floating Background Ws
const FloatingWs = () => {
  const [elements, setElements] = useState([]);
  useEffect(() => {
    const fonts = ['font-anton', 'font-cinzel', 'font-mono', 'font-comic', 'font-gothic'];
    const newElements = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 8 + 2,
      font: fonts[Math.floor(Math.random() * fonts.length)],
      rotation: Math.random() * 360,
      opacity: Math.random() * 0.2 + 0.05
    }));
    setElements(newElements);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map(el => (
        <div key={el.id} className={`absolute text-white select-none ${el.font}`} style={{
            left: `${el.x}%`, top: `${el.y}%`, fontSize: `${el.size}rem`,
            transform: `rotate(${el.rotation}deg)`, opacity: el.opacity,
            transition: 'top 20s linear, left 20s linear',
          }}>W</div>
      ))}
    </div>
  );
};

// Velocity Marquee
const VelocityMarquee = () => {
  const [offset, setOffset] = useState(0);
  const rafRef = useRef();
  const lastScrollY = useRef(0);

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
          <span key={i} className="flex items-center gap-4">NO Ls ALLOWED <Ban size={32} strokeWidth={4} /></span>
        ))}
      </div>
    </div>
  );
};

// Tweet Card
const TweetCard = ({ tweet }) => {
  return (
    <div 
      className={`tweet-card w-full max-w-md mx-auto border border-neutral-800 p-6 mb-8 cursor-pointer relative overflow-hidden group ${tweet.rotation}`}
      onClick={(e) => {
          e.stopPropagation();
          SoundEngine.click();
          window.open(tweet.url, '_blank');
      }}
      // Removed onMouseEnter hover sound
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${tweet.isAlert ? 'bg-red-600 text-white' : 'bg-neutral-800 group-hover:bg-[var(--accent)] group-hover:text-black'}`}>
            {tweet.isAlert ? <AlertTriangle size={20} /> : <span className="font-bold text-xl">W</span>}
          </div>
          <div className="flex flex-col">
            <span className={`font-bold group-hover:text-[var(--accent)] ${tweet.isAlert ? 'text-red-500' : 'text-neutral-200'}`}>{tweet.handle}</span>
            <span className="text-xs text-neutral-500">@project_w</span>
          </div>
        </div>
        <Twitter className="w-5 h-5 text-neutral-600 group-hover:text-blue-400 transition-colors" />
      </div>
      
      {tweet.code ? (
        <div className="bg-black p-3 rounded border border-neutral-800 mb-4 font-mono text-xs text-green-400">{tweet.content}</div>
      ) : (
        <p className={`text-xl mb-6 text-neutral-100 leading-snug ${tweet.font} ${tweet.highlight ? 'text-[var(--accent)]' : ''}`}>{tweet.content}</p>
      )}
      
      <div className="flex justify-between text-neutral-500 text-sm font-mono relative z-10">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 hover:text-pink-500 transition-colors"><MessageCircle size={14} /> 22</span>
          <span className="flex items-center gap-1 hover:text-green-500 transition-colors"><Repeat size={14} /> {tweet.retweets}</span>
          <span className="flex items-center gap-1 hover:text-red-500 transition-colors"><Heart size={14} /> {tweet.likes}</span>
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

// NEW: Interactive "Did You Know" Component
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
             // Removed onMouseEnter hover sound
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
// REPLACEMENT COMPONENT: THE HIVEMIND (3D Neural Network)
const ArenaOverlay = ({ onExit }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const [nodeCount, setNodeCount] = useState(0); // Fake UI counter
    
    // Mutable State for Physics
    const state = useRef({
        nodes: [],
        pulses: [], // Active shockwaves
        rotation: { x: 0, y: 0 },
        targetRotation: { x: 0, y: 0 },
        mouse: { x: 0, y: 0 },
        active: true
    });

    useEffect(() => {
        // 1. Audio Start
        if (typeof SoundEngine !== 'undefined') {
            SoundEngine.init();
            SoundEngine.startArenaLoop(); 
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // --- CONFIGURATION ---
        const NODE_COUNT = width < 768 ? 80 : 180;
        const CONNECTION_DIST = 100;
        const ROTATION_SPEED = 0.05;
        
        // --- INITIALIZE 3D NODES ---
        // We create points on a sphere surface + some internal volume
        for (let i = 0; i < NODE_COUNT; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 200 + Math.random() * 200; // Radius variation
            
            state.current.nodes.push({
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi),
                baseX: r * Math.sin(phi) * Math.cos(theta),
                baseY: r * Math.sin(phi) * Math.sin(theta),
                baseZ: r * Math.cos(phi),
                pulse: 0, // Light up intensity
                id: Math.random().toString(36).substr(2, 4).toUpperCase()
            });
        }

        // --- EVENTS ---
        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        
        const handleMouseMove = (e) => {
            // Map mouse to rotation angles
            const nx = (e.clientX / width) * 2 - 1;
            const ny = (e.clientY / height) * 2 - 1;
            state.current.targetRotation.y = nx * 2;
            state.current.targetRotation.x = -ny * 2;
            state.current.mouse = { x: e.clientX, y: e.clientY };
        };

        const handleClick = () => {
            // Spawn a pulse
            if (typeof SoundEngine !== 'undefined') SoundEngine.click();
            state.current.pulses.push({
                r: 0,
                speed: 15,
                life: 1.0
            });
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);

        // --- 3D MATH HELPERS ---
        const rotate3D = (x, y, z, rotX, rotY) => {
            // Rotate Y
            let cosY = Math.cos(rotY);
            let sinY = Math.sin(rotY);
            let x1 = x * cosY - z * sinY;
            let z1 = z * cosY + x * sinY;
            
            // Rotate X
            let cosX = Math.cos(rotX);
            let sinX = Math.sin(rotX);
            let y2 = y * cosX - z1 * sinX;
            let z2 = z1 * cosX + y * sinX;
            
            return { x: x1, y: y2, z: z2 };
        };

        // --- RENDER LOOP ---
        const loop = () => {
            if (!state.current.active) return;
            
            // Fake UI Update
            setNodeCount(prev => Math.min(prev + 11, NODE_COUNT * 442));

            // Smooth Rotation
            state.current.rotation.x += (state.current.targetRotation.x - state.current.rotation.x) * ROTATION_SPEED;
            state.current.rotation.y += (state.current.targetRotation.y - state.current.rotation.y) * ROTATION_SPEED;
            // Auto spin
            state.current.rotation.y += 0.002;

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            
            // 1. Process Nodes & Project to 2D
            const projectedNodes = state.current.nodes.map(node => {
                // Decay pulse
                if (node.pulse > 0) node.pulse -= 0.05;

                // Rotate
                const r = rotate3D(node.baseX, node.baseY, node.baseZ, state.current.rotation.x, state.current.rotation.y);
                
                // Project (Perspective)
                const fov = 800;
                const scale = fov / (fov + r.z + 400); // +400 pushes it back slightly
                const x2d = (r.x * scale) + centerX;
                const y2d = (r.y * scale) + centerY;

                // Check Pulses collision
                state.current.pulses.forEach(p => {
                     // Simple distance check in 3D space isn't perfect but good enough visual
                     // Actually, check against the "Pulse Radius" in 3D
                     // Let's assume pulse originates from center (0,0,0)
                     const distFromCenter = Math.sqrt(node.baseX**2 + node.baseY**2 + node.baseZ**2);
                     if (Math.abs(distFromCenter - p.r) < 30) {
                         node.pulse = 1.0;
                     }
                });

                return { ...node, x2d, y2d, scale, z: r.z };
            });

            // 2. Sort by Z for depth (painter's algorithm)
            projectedNodes.sort((a, b) => b.z - a.z);

            // 3. Draw Connections
            ctx.lineWidth = 1;
            for (let i = 0; i < projectedNodes.length; i++) {
                const n1 = projectedNodes[i];
                // Optimization: only check nearby in array (not perfect but faster) 
                // or just check all (expensive but N is low enough)
                for (let j = i + 1; j < projectedNodes.length; j++) {
                    const n2 = projectedNodes[j];
                    const dx = n1.x2d - n2.x2d;
                    const dy = n1.y2d - n2.y2d;
                    const dist = Math.sqrt(dx*dx + dy*dy);

                    if (dist < CONNECTION_DIST * n1.scale) {
                        const alpha = 1 - (dist / (CONNECTION_DIST * n1.scale));
                        // If either node is pulsing, line is bright
                        const pulseFactor = Math.max(n1.pulse, n2.pulse);
                        
                        ctx.strokeStyle = pulseFactor > 0.1 
                            ? `rgba(255, 255, 255, ${alpha})` // White hot
                            : `rgba(204, 255, 0, ${alpha * 0.3})`; // Dim Green
                        
                        ctx.beginPath();
                        ctx.moveTo(n1.x2d, n1.y2d);
                        ctx.lineTo(n2.x2d, n2.y2d);
                        ctx.stroke();
                    }
                }
            }

            // 4. Draw Nodes
            projectedNodes.forEach(node => {
                const size = 3 * node.scale + (node.pulse * 5);
                ctx.fillStyle = node.pulse > 0.1 ? '#fff' : '#ccff00';
                
                ctx.beginPath();
                ctx.arc(node.x2d, node.y2d, size, 0, Math.PI * 2);
                ctx.fill();

                // Draw Text IDs for "Close" nodes
                if (node.scale > 0.8 && node.pulse > 0.1) {
                    ctx.font = '10px monospace';
                    ctx.fillStyle = '#fff';
                    ctx.fillText(node.id, node.x2d + 10, node.y2d);
                }
            });

            // 5. Update Pulses
            for (let i = state.current.pulses.length - 1; i >= 0; i--) {
                const p = state.current.pulses[i];
                p.r += p.speed;
                p.life -= 0.01;
                if (p.life <= 0 || p.r > 1000) state.current.pulses.splice(i, 1);
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (typeof SoundEngine !== 'undefined') SoundEngine.stopArenaLoop();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[10000] bg-black cursor-crosshair overflow-hidden">
            <canvas ref={canvasRef} className="block w-full h-full" />
            
            {/* UI OVERLAY */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-8 flex flex-col justify-between">
                
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-[var(--accent)] font-black font-anton text-2xl tracking-widest animate-pulse">
                            THE HIVEMIND
                        </div>
                        <div className="text-white font-mono text-xs opacity-70">
                            GLOBAL CONSENSUS: 100%
                        </div>
                    </div>
                    <div className="text-right font-mono text-xs text-[var(--accent)]">
                        <div>ACTIVE NODES: {nodeCount}</div>
                        <div>LATENCY: 0ms</div>
                    </div>
                </div>

                {/* Center Message */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mix-blend-difference">
                    <div className="text-white font-mono text-xs tracking-[0.5em] mb-4 opacity-50">
                        CLICK TO BROADCAST SIGNAL
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end">
                    <div className="font-mono text-xs text-neutral-500 max-w-xs">
                        Connected to mainnet. You are Node #001. 
                        Do not break the chain.
                    </div>
                    <button 
                        onClick={onExit}
                        className="pointer-events-auto border border-white text-white hover:bg-white hover:text-black px-8 py-3 font-mono font-bold tracking-widest uppercase transition-all flex items-center gap-2 backdrop-blur-md"
                    >
                        <Power size={18} /> DISCONNECT
                    </button>
                </div>
            </div>
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
          // Removed onMouseEnter hover sound
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
             // Updated to use glitch sound on hover and click
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
            // Removed onMouseEnter hover sound
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
          
          {/* Replaced static Did You Know with interactive box */}
          <DidYouKnowBox />

          <div 
              className={`break-inside-avoid p-12 border-4 ${claimText === 'WINNER DETECTED' ? 'border-[var(--accent)] bg-[var(--accent)] text-black scale-110' : 'border-white text-white hover:bg-white hover:text-black'} mb-8 text-center transition-all duration-100 cursor-pointer group select-none`}
              onClick={handleClaimVictory}
              // Removed onMouseEnter hover sound
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