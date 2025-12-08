import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Plus, 
  X, 
  Copy,
  Undo,
  Trash2,
  Maximize2,
  LogOut,
  Zap,
  Smile,
  Moon,
  Sun,
  MousePointer2,
  Twitter
} from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAhZXrFjUNLvnJtag4rbvDZ1szdzdMsggg",
  authDomain: "stupid-line.firebaseapp.com",
  projectId: "stupid-line",
  storageBucket: "stupid-line.firebasestorage.app",
  messagingSenderId: "62189713588",
  appId: "1:62189713588:web:69d7307ab4c7a83ecd3fe1"
};

const CA = "Es89L3t5YBtbzcr5AUpZLafNBpP5KCKPKWLmLZJ8pump";
const TICKER = "SUPERMAN";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Permanent+Marker&family=JetBrains+Mono:wght@700&display=swap');
    
    :root {
      --bg-color: #fffbeb;
      --card-bg: #ffffff;
      --text-color: #2f3542;
      --border-color: #000000;
      --accent: #ff4757;
      --highlight: #2ed573;
      --tape: #ffeaa7;
      --dot-color: #cbd5e1;
    }

    [data-theme='dark'] {
      --bg-color: #0f0f11;
      --card-bg: #18181b;
      --text-color: #f4f4f5;
      --border-color: #f4f4f5;
      --accent: #ff3333;
      --highlight: #00e676;
      --tape: #fbbf24;
      --dot-color: #3f3f46;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      overflow: hidden;
      font-family: 'Kalam', cursive;
      transition: background-color 0.3s ease, color 0.3s ease;
      overscroll-behavior: none; /* Prevent bounce on mobile */
      touch-action: none; /* Prevent browser zooming/scrolling */
    }

    /* Hand Drawn Box Utility */
    .sketchy-box {
      background-color: var(--card-bg);
      border: 3px solid var(--border-color);
      border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      color: var(--text-color);
    }
    .sketchy-box:hover {
      transform: scale(1.02);
    }

    /* Logo Animation */
    @keyframes wiggle {
      0%, 100% { transform: rotate(-3deg); }
      50% { transform: rotate(3deg); }
    }
    .logo-wiggle {
      animation: wiggle 2s ease-in-out infinite;
    }

    /* Marquee */
    .marquee-container {
      background: var(--border-color);
      color: var(--bg-color);
      transform: rotate(1deg) scale(1.02);
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }

    /* Range Slider */
    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      background: transparent;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 24px;
      width: 24px;
      background: var(--accent);
      border: 3px solid var(--border-color);
      border-radius: 50%;
      cursor: grab;
      margin-top: -10px;
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      background: var(--border-color);
      border-radius: 2px;
    }
  `}</style>
);

// --- MAIN APPLICATION ---
export default function SayYourStupidLine() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [createMode, setCreateMode] = useState(false);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [darkMode, setDarkMode] = useState(false);

  // Toggle Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub;
  }, []);

  // Data Listener
  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  if (!user) return <AuthScreen darkMode={darkMode} />;

  return (
    <div className="fixed inset-0 overflow-hidden select-none font-['Kalam']">
      <GlobalStyles />
      
      {/* 1. Interactive Canvas */}
      <CanvasEngine 
        notes={notes} 
        user={user} 
        view={view} 
        setView={setView}
        darkMode={darkMode}
      />

      {/* 2. HUD */}
      <HUD 
        user={user} 
        view={view} 
        setView={setView} 
        toggleCreate={() => setCreateMode(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* 3. Creation Modal */}
      {createMode && (
        <CreationStudio 
          onClose={() => setCreateMode(false)} 
          user={user}
          view={view}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// --- CANVAS ENGINE ---
const CanvasEngine = ({ notes, user, view, setView, darkMode }) => {
  const canvasRef = useRef(null);
  const [drag, setDrag] = useState({ active: false, type: null, start: {x:0,y:0}, noteId: null });
  const [hoveredNote, setHoveredNote] = useState(null);
  const [mousePos, setMousePos] = useState({ x: -9999, y: -9999 }); // Track for dot interaction
  const imageCache = useRef(new Map());
  const templateImg = useRef(null);
  
  // Pinch Zoom State
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });

  // Load Template Once
  useEffect(() => {
    const img = new Image();
    img.src = 'template.jpg';
    img.onload = () => { templateImg.current = img; };
  }, []);

  const NOTE_WIDTH = 280;

  // Render Loop
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Background
    const bgColor = darkMode ? '#0f0f11' : '#fffbeb';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 2. Transform Space
    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);

    // 3. Interactive Dots
    drawInteractiveDots(ctx, view, rect.width, rect.height);

    // 4. Notes
    [...notes].reverse().forEach(note => {
      drawCard(ctx, note, user.uid === note.uid, hoveredNote === note.id);
    });

    ctx.restore();
  }, [notes, view, user, hoveredNote, mousePos, darkMode]);

  // Interactive Dot Logic
  const drawInteractiveDots = (ctx, view, width, height) => {
    const worldLeft = -view.x / view.scale;
    const worldTop = -view.y / view.scale;
    const worldRight = worldLeft + width / view.scale;
    const worldBottom = worldTop + height / view.scale;

    const gridSize = 60; 
    const offsetX = worldLeft % gridSize;
    const offsetY = worldTop % gridSize;

    // Convert screen mouse pos to world mouse pos
    const worldMouseX = (mousePos.x - view.x) / view.scale;
    const worldMouseY = (mousePos.y - view.y) / view.scale;

    ctx.fillStyle = darkMode ? '#3f3f46' : '#cbd5e1'; 

    for (let x = worldLeft - offsetX; x < worldRight; x += gridSize) {
      for (let y = worldTop - offsetY; y < worldBottom; y += gridSize) {
        // Interaction Math
        const dx = x - worldMouseX;
        const dy = y - worldMouseY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const radius = 200; // Interaction radius
        
        let finalX = x;
        let finalY = y;

        if (dist < radius) {
          const force = (radius - dist) / radius;
          const angle = Math.atan2(dy, dx);
          const push = force * 40; // Push distance
          finalX += Math.cos(angle) * push;
          finalY += Math.sin(angle) * push;
        }

        ctx.beginPath();
        // Reduced dot size from 2 to 1.2
        ctx.arc(finalX, finalY, 1.2 / view.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawCard = (ctx, note, isOwner, isHovered) => {
    const width = NOTE_WIDTH;
    const HEADER_HEIGHT = 200; // Space for template.jpg
    const CONTENT_HEIGHT = note.type === 'draw' ? 220 : Math.max(120, (note.content.length / 1.4) + 60);
    const totalHeight = HEADER_HEIGHT + CONTENT_HEIGHT;

    ctx.save();
    ctx.translate(note.x, note.y);
    ctx.rotate((note.style?.rotation || 0) * Math.PI / 180);

    // 1. Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(-width/2 + 6, -totalHeight/2 + 6, width, totalHeight, 4);
    ctx.fill();

    // 2. Card Base (Polaroid Style)
    ctx.fillStyle = darkMode ? '#18181b' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-width/2, -totalHeight/2, width, totalHeight, 2);
    ctx.fill();
    // Border
    ctx.strokeStyle = darkMode ? '#fff' : '#000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Template Image (Superman with Mic)
    if (templateImg.current) {
      // Draw image in top section
      // Maintain aspect ratio cover or fit
      ctx.save();
      ctx.beginPath();
      // Clip top area
      ctx.rect(-width/2 + 10, -totalHeight/2 + 10, width - 20, HEADER_HEIGHT - 10);
      ctx.clip();
      ctx.drawImage(templateImg.current, -width/2 + 10, -totalHeight/2 + 10, width - 20, HEADER_HEIGHT - 10);
      ctx.restore();
      
      // Border around image
      ctx.strokeRect(-width/2 + 10, -totalHeight/2 + 10, width - 20, HEADER_HEIGHT - 10);
    }

    // 4. Content Area
    ctx.translate(-width/2 + 20, -totalHeight/2 + HEADER_HEIGHT + 20);
    
    if (note.type === 'draw') {
        // Draw Drawing
        if (imageCache.current.has(note.id)) {
            const img = imageCache.current.get(note.id);
            if(darkMode) {
                ctx.globalCompositeOperation = 'difference';
            }
            ctx.drawImage(img, 0, 0, width - 40, CONTENT_HEIGHT - 40);
            ctx.globalCompositeOperation = 'source-over';
        } else {
            const img = new Image();
            img.src = note.content;
            img.onload = () => {
                imageCache.current.set(note.id, img);
                setView(v => ({...v})); 
            };
        }
    } else {
        // Draw Text
        ctx.fillStyle = note.style?.color || (darkMode ? '#fff' : '#000');
        ctx.font = '24px "Permanent Marker"';
        wrapText(ctx, note.content, 0, 0, width - 40, 30);
    }

    // 5. Signature (Improved Visibility)
    const authorName = note.author ? `@${note.author}` : '@Anon';
    ctx.font = 'bold 12px "JetBrains Mono"';
    const textMetrics = ctx.measureText(authorName);
    const badgeWidth = textMetrics.width + 16;
    const badgeHeight = 24;
    
    // Badge Background (Solid Pill)
    ctx.fillStyle = darkMode ? '#27272a' : '#f4f4f5';
    ctx.beginPath();
    // Position at bottom right
    const badgeX = width/2 - badgeWidth - 20; // relative to translated center (which is -width/2 + 20)
    // Actually we are translated to top-left of content area.
    // Content width is (width-40).
    // Let's position bottom right of content area.
    ctx.roundRect(width - 40 - badgeWidth, CONTENT_HEIGHT - 35, badgeWidth, badgeHeight, 12);
    ctx.fill();
    ctx.strokeStyle = darkMode ? '#52525b' : '#d4d4d8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Badge Text
    ctx.fillStyle = darkMode ? '#fff' : '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(authorName, width - 40 - badgeWidth/2, CONTENT_HEIGHT - 35 + badgeHeight/2);

    // Reset baselines
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';


    // 6. Selection Highlight
    if (isHovered || isOwner) {
        ctx.strokeStyle = isOwner ? '#ff4757' : '#2ed573';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-20, -30, width, CONTENT_HEIGHT + 10);
    }

    ctx.restore();
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  // Interaction Handlers
  const toWorld = (sx, sy) => ({
    x: (sx - view.x) / view.scale,
    y: (sy - view.y) / view.scale
  });

  const handlePointerDown = (e) => {
    // If multiple touches, handle pinch in touchMove, ignore drag here for now or init pinch
    if (e.touches && e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        pinchRef.current = { active: true, startDist: dist, startScale: view.scale };
        return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const worldPos = toWorld(mx, my);

    // Hit Test
    const hit = [...notes].reverse().find(n => {
        // Approx height based on type
        const h = n.type === 'draw' ? 220 : Math.max(120, (n.content.length / 1.4) + 60);
        const totalH = 200 + h; // + Header
        return Math.abs(worldPos.x - n.x) < NOTE_WIDTH/2 && Math.abs(worldPos.y - n.y) < totalH/2;
    });

    if (hit && hit.uid === user.uid) {
      setDrag({ active: true, type: 'note', start: { x: worldPos.x - hit.x, y: worldPos.y - hit.y }, noteId: hit.id });
    } else {
      setDrag({ active: true, type: 'canvas', start: { x: clientX, y: clientY } });
    }
  };

  const handlePointerMove = (e) => {
    // Handle Pinch
    if (e.touches && e.touches.length === 2) {
        if (!pinchRef.current.active) return;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        
        if (pinchRef.current.startDist > 0) {
            const scaleFactor = dist / pinchRef.current.startDist;
            const newScale = Math.min(Math.max(pinchRef.current.startScale * scaleFactor, 0.1), 4);
            
            // Midpoint
            const rect = canvasRef.current.getBoundingClientRect();
            const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
            const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

            // Zoom around midpoint logic:
            // World point at midpoint should remain constant
            const wx = (midX - view.x) / view.scale;
            const wy = (midY - view.y) / view.scale;
            
            setView({
                scale: newScale,
                x: midX - wx * newScale,
                y: midY - wy * newScale
            });
        }
        return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    // Update Mouse Pos for Dot Effect
    setMousePos({ x: mx + view.x, y: my + view.y }); 

    if (!drag.active) return;
    
    if (drag.type === 'canvas') {
        const dx = clientX - drag.start.x;
        const dy = clientY - drag.start.y;
        setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
        setDrag(d => ({ ...d, start: { x: clientX, y: clientY } }));
    } else if (drag.type === 'note') {
        const worldPos = toWorld(mx, my);
        const idx = notes.findIndex(n => n.id === drag.noteId);
        if (idx > -1) {
            notes[idx].x = worldPos.x - drag.start.x;
            notes[idx].y = worldPos.y - drag.start.y;
            setView(v => ({...v}));
        }
    }
  };

  const handlePointerUp = async (e) => {
    // Reset Pinch if touches drop below 2
    if (e.touches && e.touches.length < 2) {
        pinchRef.current = { active: false, startDist: 0, startScale: 1 };
    }

    if (drag.type === 'note') {
        const n = notes.find(n => n.id === drag.noteId);
        if (n) await updateDoc(doc(db, "notes", drag.noteId), { x: n.x, y: n.y });
    }
    setDrag({ active: false, type: null, start: {x:0,y:0}, noteId: null });
  };

  // Mouse Events
  const onMouseDown = (e) => {
    e.preventDefault(); // Prevent text selection highlight
    handlePointerDown(e);
  };
  const onMouseMove = (e) => handlePointerMove(e);
  const onMouseUp = (e) => handlePointerUp(e);

  // Touch Events
  const onTouchStart = (e) => {
    e.preventDefault(); // Stop scroll & selection
    handlePointerDown(e);
  };
  const onTouchMove = (e) => {
    // e.preventDefault(); // handled in start
    handlePointerMove(e);
  };
  const onTouchEnd = (e) => handlePointerUp(e);

  const handleWheel = (e) => {
    if(e.ctrlKey) return; 
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(view.scale + scaleAmount * view.scale, 0.1), 4);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - view.x) / view.scale;
    const worldY = (mouseY - view.y) / view.scale;
    
    setView({
      scale: newScale,
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale
    });
  };

  return (
    <canvas 
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={handleWheel}
      className="absolute inset-0 w-full h-full block touch-none cursor-crosshair"
    />
  );
};

// --- AUTH SCREEN ---
const AuthScreen = ({ onLogin, darkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const email = `${username.toLowerCase().replace(/\s/g, '')}@stupidline.com`;
    if(isLogin) await signInWithEmailAndPassword(auth, email, password).catch(alert);
    else {
      const c = await createUserWithEmailAndPassword(auth, email, password).catch(alert);
      if(c) await updateProfile(c.user, { displayName: username });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-[#f0f0f0]">
      <GlobalStyles />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="relative w-full max-w-md sketchy-box p-8 rotate-1 bg-white">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#ffeaa7] opacity-90 rotate-2 shadow-sm"></div>
        <div className="text-center mb-6">
          <div className="w-32 h-32 mx-auto mb-4 logo-wiggle">
             <img src="superman.png" className="w-full h-full object-contain" onError={(e)=>e.target.style.display='none'} />
          </div>
          <h1 className="text-4xl font-['Permanent_Marker']">SAY YOUR <span className="text-[#ff4757]">STUPID LINE</span></h1>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="text" placeholder="Who dis?" className="w-full border-2 border-black p-3 font-bold rounded" value={username} onChange={e=>setUsername(e.target.value)} required />
          <input type="password" placeholder="Passcode" className="w-full border-2 border-black p-3 font-bold rounded" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="w-full bg-black text-white p-4 font-bold rounded hover:bg-[#ff4757] transition-colors">
            {loading ? '...' : (isLogin ? 'ENTER' : 'JOIN')}
          </button>
        </form>
        <button onClick={()=>setIsLogin(!isLogin)} className="block w-full text-center mt-4 underline decoration-wavy">
            {isLogin ? "New? Sign up" : "Have acc? Login"}
        </button>
      </div>
    </div>
  );
};

// --- CREATION STUDIO (With Touch & Undo) ---
const CreationStudio = ({ onClose, user, view, darkMode }) => {
  const [mode, setMode] = useState('text'); 
  const [text, setText] = useState('');
  const [color, setColor] = useState('#000000');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [history, setHistory] = useState([]);

  // Init Canvas
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0,0,400,260);
      saveHistory();
    }
  }, [mode]);

  const saveHistory = () => {
      const c = canvasRef.current;
      setHistory(prev => [...prev.slice(-10), c.toDataURL()]);
  };

  const undo = () => {
      if(history.length <= 1) return;
      const newHistory = [...history];
      newHistory.pop(); // Remove current
      const prevData = newHistory[newHistory.length - 1];
      const img = new Image();
      img.src = prevData;
      img.onload = () => {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0,0,460,260);
          ctx.drawImage(img,0,0);
      };
      setHistory(newHistory);
  };

  const handleSubmit = async () => {
    if(loading) return;
    setLoading(true);
    const content = mode === 'text' ? text : canvasRef.current.toDataURL();
    const centerX = (window.innerWidth/2 - view.x) / view.scale;
    const centerY = (window.innerHeight/2 - view.y) / view.scale;

    await addDoc(collection(db, "notes"), {
      uid: user.uid,
      author: user.displayName,
      content,
      type: mode,
      x: centerX + (Math.random()-0.5)*100,
      y: centerY + (Math.random()-0.5)*100,
      style: { rotation: (Math.random()*10)-5 },
      createdAt: serverTimestamp()
    });
    setLoading(false);
    onClose();
  };

  // Drawing Logic (Unified for Mouse & Touch)
  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const startDraw = (e) => {
    e.preventDefault(); // Stop scrolling
    isDrawing.current = true;
    const {x, y} = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };
  
  const moveDraw = (e) => {
    e.preventDefault(); // Stop scrolling
    if (!isDrawing.current) return;
    const {x, y} = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if(isDrawing.current) {
        isDrawing.current = false;
        saveHistory();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-['Kalam']">
      <div className="bg-white sketchy-box w-full max-w-lg overflow-hidden relative shadow-2xl text-black">
        <div className="bg-[#2ed573] border-b-2 border-black p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold font-['Permanent_Marker']">NEW STUPID THING</h2>
          <button onClick={onClose} className="bg-white border-2 border-black rounded-full p-1 hover:bg-red-200 transition-colors"><X/></button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-4 justify-center">
            <button onClick={()=>setMode('text')} className={`px-4 py-2 border-2 border-black rounded-full font-bold ${mode==='text'?'bg-[#ff4757] text-white':''}`}>WRITE</button>
            <button onClick={()=>setMode('draw')} className={`px-4 py-2 border-2 border-black rounded-full font-bold ${mode==='draw'?'bg-[#ff4757] text-white':''}`}>DRAW</button>
          </div>

          <div className="relative border-4 border-black rounded-lg min-h-[260px] bg-white overflow-hidden">
             {/* Template Preview */}
             <div className="h-[100px] w-full bg-cover bg-center border-b-2 border-black" style={{backgroundImage: "url('template.jpg')"}}></div>
             
             {mode === 'text' ? (
               <textarea 
                 autoFocus
                 value={text}
                 onChange={e => setText(e.target.value)}
                 className="w-full h-[160px] p-4 resize-none focus:outline-none text-2xl font-['Permanent_Marker'] text-center"
                 style={{ color }}
                 placeholder="Type here..."
               />
             ) : (
               <div className="relative z-10 w-full h-[160px] bg-white">
                 <canvas 
                    ref={canvasRef}
                    width={460}
                    height={160}
                    className="w-full h-full cursor-crosshair touch-none"
                    style={{ touchAction: 'none' }} // Ensure no gestures
                    onMouseDown={startDraw}
                    onMouseMove={moveDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={moveDraw}
                    onTouchEnd={endDraw}
                 />
                 <div className="absolute top-2 right-2 flex gap-2">
                    <button onClick={undo} className="p-2 bg-white border-2 border-black rounded-lg hover:bg-gray-100 shadow-sm" title="Undo">
                        <Undo size={20}/>
                    </button>
                    <button onClick={() => {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.clearRect(0,0,460,260);
                        saveHistory();
                    }} className="p-2 bg-white border-2 border-black rounded-lg hover:bg-red-100 text-red-500 shadow-sm">
                        <Trash2 size={20}/>
                    </button>
                 </div>
               </div>
             )}
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-3">
              {['#000000', '#ff4757', '#3742fa', '#2ed573', '#ffa502'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full border-2 border-black shadow-sm ${color === c ? 'scale-125 ring-2 ring-gray-300' : 'hover:scale-110'} transition-transform`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-black text-white px-8 py-3 font-['Permanent_Marker'] text-xl rounded-lg hover:bg-[#ffeaa7] hover:text-black border-2 border-transparent hover:border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
            >
              {loading ? 'Posting...' : 'Post it!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HUD ---
const HUD = ({ user, view, setView, toggleCreate, darkMode, setDarkMode }) => {
    return (
        <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-4">
            
            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
                <div 
                    className="bg-[#fffbeb] sketchy-box p-3 shadow-lg flex items-center gap-3"
                    style={{ backgroundImage: "url('image1.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                    <div className="absolute inset-0 bg-white/70 pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-3">
                        <img src="superman.png" className="w-12 h-12 object-contain" onError={(e)=>e.target.style.display='none'} />
                        <div>
                            <h1 className="font-black leading-none text-black">{TICKER}</h1>
                            <button onClick={()=>{navigator.clipboard.writeText(CA)}} className="text-[10px] bg-black text-white px-1 rounded flex gap-1 items-center mt-1">
                                COPY CA <Copy size={8}/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Socials */}
                    <a href="https://x.com/search?q=SayYourStupidLine" target="_blank" rel="noreferrer" className="bg-black text-white border-2 border-white p-2 rounded-full hover:bg-[#ff4757] transition-colors">
                        <Twitter size={20}/>
                    </a>
                    {/* TikTok - Using SVG */}
                    <a href="https://www.tiktok.com/search?q=SayYourStupidLine" target="_blank" rel="noreferrer" className="bg-black text-white border-2 border-white p-2 rounded-full hover:bg-[#ff4757] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                    </a>

                    <button onClick={()=>setDarkMode(!darkMode)} className="bg-white border-2 border-black p-2 rounded-full hover:bg-gray-100 transition-colors text-black">
                        {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                    <div 
                        className="bg-white border-2 border-black px-3 py-1 rounded-full flex items-center gap-2 text-black relative overflow-hidden"
                        style={{ backgroundImage: "url('image4.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                         <div className="absolute inset-0 bg-white/70 pointer-events-none"></div>
                         <div className="relative z-10 flex items-center gap-2">
                            <span className="font-bold">{user.displayName}</span>
                            <button onClick={()=>signOut(auth)}><LogOut size={14} className="text-red-500"/></button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="pointer-events-auto flex items-end justify-center gap-4 pb-12">
                <div 
                    className="bg-white sketchy-box p-2 w-40 flex flex-col items-center rotate-1 text-black relative overflow-hidden"
                    style={{ backgroundImage: "url('image3.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                    <div className="absolute inset-0 bg-white/70 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center w-full">
                        <span className="text-xs font-bold">ZOOM</span>
                        <input type="range" min="0.1" max="3" step="0.1" value={view.scale} onChange={e=>setView(v=>({...v, scale:parseFloat(e.target.value)}))} />
                    </div>
                </div>
                
                <button onClick={toggleCreate} className="bg-[#ff4757] text-white w-20 h-20 rounded-full border-4 border-black flex items-center justify-center shadow-xl hover:-translate-y-2 transition-transform">
                    <Plus size={40} strokeWidth={4}/>
                </button>

                <button onClick={()=>setView({x:0,y:0,scale:1})} className="bg-white sketchy-box w-12 h-12 flex items-center justify-center rotate-[-2deg] text-black">
                    <Maximize2 size={20}/>
                </button>
            </div>

            {/* Marquee */}
            <div className="fixed bottom-0 left-0 right-0 h-8 marquee-container flex items-center overflow-hidden border-t-2 border-black pointer-events-none z-[-1]">
                 <div className="animate-marquee whitespace-nowrap font-bold px-4 text-sm">
                    PROJECT: {TICKER} /// CA: {CA} /// MAKE IT STUPID /// POST YOUR LINE ///
                 </div>
            </div>
        </div>
    );
};