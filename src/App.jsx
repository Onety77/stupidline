import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
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
  Plus, X, Copy, Undo, Trash2, Maximize2, LogOut, 
  Sun, Moon, Twitter, Menu, Loader2, Check, AlertCircle, Share2
} from 'lucide-react';

// --- CONSTANTS & CONFIG ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAhZXrFjUNLvnJtag4rbvDZ1szdzdMsggg",
  authDomain: "stupid-line.firebaseapp.com",
  projectId: "stupid-line",
  storageBucket: "stupid-line.firebasestorage.app",
  messagingSenderId: "62189713588",
  appId: "1:62189713588:web:69d7307ab4c7a83ecd3fe1"
};

const APP_CONSTANTS = {
  CA: "Es89L3t5YBtbzcr5AUpZLafNBpP5KCKPKWLmLZJ8pump",
  TICKER: "SUPERMAN",
  NOTE_WIDTH: 280,
  GRID_SIZE: 50,
  CONNECTION_RADIUS: 100 // Reduced radius for subtler feel
};

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Permanent+Marker&family=JetBrains+Mono:wght@700&display=swap');
    
    :root {
      --bg-color: #fdf6e3; /* Solarized Light-ish */
      --card-bg: #ffffff;
      --text-main: #2d3436;
      --text-sub: #636e72;
      --accent: #ff4757;
      --accent-hover: #ff6b81;
      --border: #2d3436;
      --grid-dot: #b2bec3;
      --glass: rgba(255, 255, 255, 0.85);
      --glass-border: rgba(255, 255, 255, 0.5);
    }

    [data-theme='dark'] {
      --bg-color: #0f0f11;
      --card-bg: #18181b;
      --text-main: #f4f4f5;
      --text-sub: #a1a1aa;
      --accent: #ff4757; /* Keep accent pop */
      --accent-hover: #ff6348;
      --border: #f4f4f5;
      --grid-dot: #27272a;
      --glass: rgba(24, 24, 27, 0.85);
      --glass-border: rgba(255, 255, 255, 0.1);
    }

    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      outline: none;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      overflow: hidden;
      font-family: 'Kalam', cursive;
      transition: background-color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      overscroll-behavior: none;
      user-select: none;
    }

    /* Professional "Sketchy" Utilities */
    .sketch-box {
      background-color: var(--card-bg);
      border: 2px solid var(--border);
      border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
      box-shadow: 4px 4px 0px var(--border);
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .sketch-box:active {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px var(--border);
    }

    .glass-panel {
      background: var(--glass);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
    }

    .animate-float {
      animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }

    /* Infinite Marquee */
    .marquee-track {
      display: flex;
      width: max-content;
      animation: scroll 60s linear infinite; /* Slower scroll for readability */
    }
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* Range Input Styling */
    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      background: transparent;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 20px;
      width: 20px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid var(--border);
      margin-top: -8px;
      cursor: pointer;
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      background: var(--border);
      border-radius: 2px;
    }
  `}</style>
);

// --- TOAST SYSTEM ---
const ToastContext = React.createContext();
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`sketch-box p-3 flex items-center gap-3 bg-white text-black shadow-lg animate-float pointer-events-auto
            ${t.type === 'error' ? 'border-red-500 text-red-600' : 'border-black'}`}>
            {t.type === 'success' ? <Check size={18} className="text-green-500"/> : 
             t.type === 'error' ? <AlertCircle size={18} className="text-red-500"/> : 
             <Share2 size={18}/>}
            <span className="font-bold text-sm">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
const useToast = () => React.useContext(ToastContext);

// --- MAIN APPLICATION ---
export default function SayYourStupidLinePro() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize Theme
  useEffect(() => {
    // Check system preference or default
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub;
  }, []);

  if (loading) return null; // Or a splash screen

  return (
    <ToastProvider>
      <div className="fixed inset-0 overflow-hidden font-['Kalam']">
        <GlobalStyles />
        {!user ? (
          <AuthScreen darkMode={darkMode} />
        ) : (
          <AppWorkspace user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
        )}
      </div>
    </ToastProvider>
  );
}

// --- WORKSPACE (CANVAS + UI) ---
const AppWorkspace = ({ user, darkMode, setDarkMode }) => {
  const [notes, setNotes] = useState([]);
  const [createMode, setCreateMode] = useState(false);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  
  // Fetch Data
  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe;
  }, []);

  return (
    <>
      <CanvasEngine 
        notes={notes} 
        user={user} 
        view={view} 
        setView={setView}
        darkMode={darkMode}
      />

      <HUD 
        user={user}
        view={view}
        setView={setView}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        toggleCreate={() => setCreateMode(true)}
        notes={notes}
      />

      {createMode && (
        <CreationStudio 
          onClose={() => setCreateMode(false)}
          user={user}
          view={view}
          darkMode={darkMode}
        />
      )}
    </>
  );
};

// --- HIGH PERFORMANCE CANVAS ENGINE ---
const CanvasEngine = ({ notes, user, view, setView, darkMode }) => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const mouseRef = useRef({ x: -9999, y: -9999 }); // Keep mouse separate from state to avoid re-renders
  const imageCache = useRef(new Map());
  const templateImg = useRef(null);
  const viewRef = useRef(view); // Mutable ref for animation loop
  const dragRef = useRef({ active: false, type: null, start: {x:0,y:0}, noteId: null, initialNotePos: {x:0,y:0} });
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });

  // Sync ref with prop
  useEffect(() => { viewRef.current = view; }, [view]);

  // Load Template Asset
  useEffect(() => {
    const img = new Image();
    img.src = 'template.jpg';
    img.onload = () => { templateImg.current = img; };
  }, []);

  // --- THE RENDER LOOP ---
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize
    
    // Handle DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Resize if needed
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    } else {
        // Reset transform for clear
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { x: vx, y: vy, scale } = viewRef.current;
    const width = rect.width;
    const height = rect.height;

    // 1. Clear & Background
    const bgColor = darkMode ? '#0f0f11' : '#fdf6e3';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Render Interactive Grid (The "Surprise")
    // We render grid in screen space for performance optimization (don't render infinite world)
    renderInteractiveGrid(ctx, vx, vy, scale, width, height, mouseRef.current, darkMode);

    // 3. Render Notes (World Space)
    ctx.save();
    ctx.translate(vx, vy);
    ctx.scale(scale, scale);

    // Render in reverse to have newest on top usually, but let's stick to standard z-index
    // Actually, reverse creates proper painter's algorithm if list is new -> old
    [...notes].reverse().forEach(note => {
      drawNote(ctx, note, user.uid, imageCache, templateImg, darkMode, mouseRef.current, vx, vy, scale);
    });

    ctx.restore();

    requestRef.current = requestAnimationFrame(render);
  }, [notes, user, darkMode]); // Dependencies that *require* a functional update logic

  // Start Loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(requestRef.current);
  }, [render]);
  // --- GRID PHYSICS LOGIC (SUBTLE VERSION) ---
  const renderInteractiveGrid = (ctx, vx, vy, scale, width, height, mouse, isDark) => {
    const dotBaseColor = isDark ? 'rgba(82, 82, 91, 0.5)' : 'rgba(189, 195, 199, 0.5)';
    // const dotActiveColor = '#ff4757'; // Removed active color
    
    const gridSize = APP_CONSTANTS.GRID_SIZE * scale;
    // Scale the interaction radius so it affects same visual area regardless of zoom
    const radius = APP_CONSTANTS.CONNECTION_RADIUS * scale; 
    
    // Calculate visible grid start/end
    const startX = (vx % gridSize);
    const startY = (vy % gridSize);

    ctx.lineCap = "round";

    for (let x = startX - gridSize; x < width + gridSize; x += gridSize) {
      for (let y = startY - gridSize; y < height + gridSize; y += gridSize) {
        
        // Physics Calculation
        const dx = mouse.x - x;
        const dy = mouse.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let drawX = x;
        let drawY = y;
        let dotSize = 2;
        let color = dotBaseColor;

        if (dist < radius) {
          // Magnetic Attraction (Ultra Subtle)
          const force = (radius - dist) / radius; // 0 to 1
          
          // Barely move the dot towards the cursor (0.1 factor instead of 0.4)
          drawX += dx * force * 0.1;
          drawY += dy * force * 0.1;
          
          // Slight size increase
          dotSize = 2 + (force * 1.5);
          
          // REMOVED: color change logic
          // color = dotActiveColor; 
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // --- INTERACTION HANDLERS ---
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Pinch Zoom Check
    if (e.touches && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchRef.current = { active: true, startDist: dist, startScale: viewRef.current.scale };
      return;
    }

    // Hit Testing (World Space)
    const wx = (x - viewRef.current.x) / viewRef.current.scale;
    const wy = (y - viewRef.current.y) / viewRef.current.scale;

    const hit = [...notes].find(n => {
      const h = n.type === 'draw' ? 220 : Math.max(120, (n.content.length / 1.4) + 60);
      const totalH = 200 + h;
      return Math.abs(wx - n.x) < APP_CONSTANTS.NOTE_WIDTH/2 && Math.abs(wy - n.y) < totalH/2;
    });

    if (hit && hit.uid === user.uid) {
      dragRef.current = { 
        active: true, 
        type: 'note', 
        start: { x: wx, y: wy }, 
        noteId: hit.id,
        initialNotePos: { x: hit.x, y: hit.y }
      };
    } else {
      dragRef.current = { 
        active: true, 
        type: 'canvas', 
        start: { x: clientX, y: clientY },
        initialView: { ...viewRef.current } 
      };
    }
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Update Mouse Ref for Grid Physics
    mouseRef.current = { x: clientX - rect.left, y: clientY - rect.top };

    // Pinch Handling
    if (e.touches && e.touches.length === 2 && pinchRef.current.active) {
       const t1 = e.touches[0];
       const t2 = e.touches[1];
       const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
       const scaleFactor = dist / pinchRef.current.startDist;
       
       const newScale = Math.min(Math.max(pinchRef.current.startScale * scaleFactor, 0.1), 4);
       
       // Zoom towards center
       const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
       const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
       
       const wx = (midX - viewRef.current.x) / viewRef.current.scale;
       const wy = (midY - viewRef.current.y) / viewRef.current.scale;
       
       const newView = {
         scale: newScale,
         x: midX - wx * newScale,
         y: midY - wy * newScale
       };
       setView(newView); // React Update
       viewRef.current = newView; // Ref Update (for loop)
       return;
    }

    if (!dragRef.current.active) return;

    if (dragRef.current.type === 'canvas') {
      const dx = clientX - dragRef.current.start.x;
      const dy = clientY - dragRef.current.start.y;
      const newView = { 
        ...viewRef.current, 
        x: dragRef.current.initialView.x + dx, 
        y: dragRef.current.initialView.y + dy 
      };
      setView(newView);
      viewRef.current = newView;
    } else if (dragRef.current.type === 'note') {
       const wx = (mouseRef.current.x - viewRef.current.x) / viewRef.current.scale;
       const wy = (mouseRef.current.y - viewRef.current.y) / viewRef.current.scale;
       const dx = wx - dragRef.current.start.x;
       const dy = wy - dragRef.current.start.y;
       
       // Update Local Note (Visual Feedback)
       const noteIndex = notes.findIndex(n => n.id === dragRef.current.noteId);
       if (noteIndex > -1) {
         notes[noteIndex].x = dragRef.current.initialNotePos.x + dx;
         notes[noteIndex].y = dragRef.current.initialNotePos.y + dy;
       }
    }
  };

  const handlePointerUp = async () => {
    if (dragRef.current.type === 'note') {
      const n = notes.find(n => n.id === dragRef.current.noteId);
      if (n) {
        await updateDoc(doc(db, "notes", n.id), { x: n.x, y: n.y });
      }
    }
    dragRef.current = { active: false, type: null, start: {x:0,y:0}, noteId: null };
    pinchRef.current = { active: false };
  };

  const handleWheel = (e) => {
      e.preventDefault();
      const scaleAmount = -e.deltaY * 0.001;
      const newScale = Math.min(Math.max(viewRef.current.scale + scaleAmount * viewRef.current.scale, 0.1), 4);
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - viewRef.current.x) / viewRef.current.scale;
      const worldY = (mouseY - viewRef.current.y) / viewRef.current.scale;
      
      const newView = { scale: newScale, x: mouseX - worldX * newScale, y: mouseY - worldY * newScale };
      setView(newView);
      viewRef.current = newView;
  };

  return (
    <canvas 
      ref={canvasRef}
      onMouseDown={(e) => { e.preventDefault(); handlePointerDown(e); }}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => { if(e.touches.length > 1) e.preventDefault(); handlePointerDown(e); }}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onWheel={handleWheel}
      className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    />
  );
};

// Helper: Draw single note
const drawNote = (ctx, note, currentUid, imageCache, templateImg, isDark, mouse, vx, vy, scale) => {
    const width = APP_CONSTANTS.NOTE_WIDTH;
    const HEADER_HEIGHT = 200;
    const CONTENT_HEIGHT = note.type === 'draw' ? 220 : Math.max(120, (note.content.length / 1.4) + 60);
    const totalHeight = HEADER_HEIGHT + CONTENT_HEIGHT;

    // Check Hover
    // Convert mouse to world
    const wx = (mouse.x - vx) / scale;
    const wy = (mouse.y - vy) / scale;
    const isHovered = Math.abs(wx - note.x) < width/2 && Math.abs(wy - note.y) < totalHeight/2;
    const isOwner = note.uid === currentUid;

    ctx.save();
    ctx.translate(note.x, note.y);
    // Smooth rotation on hover
    const targetRot = isHovered ? 0 : (note.style?.rotation || 0);
    ctx.rotate(targetRot * Math.PI / 180);

    // 1. Drop Shadow (Dynamic)
    ctx.fillStyle = isHovered ? 'rgba(0,0,0,0.3)' : 'rgba(0, 0, 0, 0.15)';
    const shadowOffset = isHovered ? 12 : 6;
    ctx.beginPath();
    ctx.roundRect(-width/2 + shadowOffset, -totalHeight/2 + shadowOffset, width, totalHeight, 4);
    ctx.fill();

    // 2. Card Body
    ctx.fillStyle = isDark ? '#18181b' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-width/2, -totalHeight/2, width, totalHeight, 2);
    ctx.fill();
    ctx.strokeStyle = isDark ? '#3f3f46' : '#e4e4e7';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Image Header
    if (templateImg.current) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-width/2 + 10, -totalHeight/2 + 10, width - 20, HEADER_HEIGHT - 10, 2);
      ctx.clip();
      ctx.drawImage(templateImg.current, -width/2 + 10, -totalHeight/2 + 10, width - 20, HEADER_HEIGHT - 10);
      ctx.restore();
      // Inner Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(-width/2 + 10, -totalHeight/2 + 10, width - 20, HEADER_HEIGHT - 10);
    }

    // 4. Content
    ctx.translate(-width/2 + 20, -totalHeight/2 + HEADER_HEIGHT + 20);
    
    if (note.type === 'draw') {
        if (imageCache.current.has(note.id)) {
            const img = imageCache.current.get(note.id);
            // Invert colors smartly for dark mode drawing
            if(isDark) ctx.globalCompositeOperation = 'difference';
            ctx.drawImage(img, 0, 0, width - 40, CONTENT_HEIGHT - 40);
            if(isDark) ctx.globalCompositeOperation = 'source-over';
        } else {
            const img = new Image();
            img.src = note.content;
            img.onload = () => imageCache.current.set(note.id, img);
        }
    } else {
        ctx.fillStyle = note.style?.color || (isDark ? '#e4e4e7' : '#2d3436');
        ctx.font = '22px "Permanent Marker"';
        wrapText(ctx, note.content, 0, 0, width - 40, 28);
    }

    // 5. Selection/Owner UI
    if (isHovered || isOwner) {
       ctx.strokeStyle = isOwner ? '#ff4757' : '#2ed573';
       ctx.lineWidth = 3;
       ctx.setLineDash([8, 6]);
       ctx.strokeRect(-20, -30, width, CONTENT_HEIGHT + 10);
       ctx.setLineDash([]);
    }

    // 6. Author Badge (Clean Pill)
    const authorName = note.author ? `@${note.author}` : '@Anon';
    ctx.font = 'bold 12px "JetBrains Mono"';
    const textW = ctx.measureText(authorName).width;
    const badgeW = textW + 20;
    
    ctx.fillStyle = isDark ? '#27272a' : '#f4f4f5';
    ctx.strokeStyle = isDark ? '#52525b' : '#d4d4d8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width - 50 - badgeW, CONTENT_HEIGHT - 45, badgeW, 26, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#fff' : '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(authorName, width - 50 - badgeW/2, CONTENT_HEIGHT - 45 + 13);
    
    // Reset defaults
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

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


// --- AUTH SCREEN ---
const AuthScreen = ({ onLogin, darkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAuth = async (e) => {
    e.preventDefault();
    if(!username || !password) { toast("Please fill fields", "error"); return; }
    
    setLoading(true);
    const email = `${username.toLowerCase().replace(/\s/g, '')}@stupidline.com`;
    
    try {
      if(isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const c = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(c.user, { displayName: username });
      }
      toast("Welcome!", "success");
    } catch (err) {
      toast(err.message.replace('Firebase:', ''), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-pattern">
       {/* Background Noise/Grid */}
       <div className="absolute inset-0 opacity-5" 
            style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
       </div>

       <div className="relative w-full max-w-md sketch-box p-8 bg-white dark:bg-zinc-900 transition-all rotate-1 hover:rotate-0">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-200 opacity-90 rotate-[-2deg] shadow-sm z-0"></div>
          
          <div className="text-center mb-8 relative z-10">
            <div className="w-24 h-24 mx-auto mb-4 animate-bounce">
               <img src="superman.png" className="w-full h-full object-contain" onError={(e)=>e.target.style.display='none'} />
            </div>
            <h1 className="text-4xl font-['Permanent_Marker'] leading-none">
              SAY YOUR <span className="text-[#ff4757]">LINE</span>
            </h1>
            <p className="text-sm text-gray-500 font-bold mt-2">THE STUPID ONE</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4 relative z-10">
            <div className="group">
              <input 
                type="text" 
                placeholder="Who is this?" 
                className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-gray-600 p-4 font-bold rounded focus:border-[#ff4757] transition-colors" 
                value={username} 
                onChange={e=>setUsername(e.target.value)} 
              />
            </div>
            <div className="group">
              <input 
                type="password" 
                placeholder="Secret Code" 
                className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-black dark:border-gray-600 p-4 font-bold rounded focus:border-[#ff4757] transition-colors" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-black text-white p-4 font-bold rounded shadow-[4px_4px_0px_#ff4757] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 flex justify-center"
            >
              {loading ? <Loader2 className="animate-spin"/> : (isLogin ? 'ENTER THE VOID' : 'JOIN THE CULT')}
            </button>
          </form>

          <button onClick={()=>setIsLogin(!isLogin)} className="block w-full text-center mt-6 text-sm text-gray-500 underline decoration-wavy hover:text-[#ff4757] transition-colors relative z-10">
              {isLogin ? "Need an identity? Sign up" : "Have an identity? Login"}
          </button>
       </div>
    </div>
  );
};

// --- CREATION STUDIO ---
const CreationStudio = ({ onClose, user, view, darkMode }) => {
  const [mode, setMode] = useState('text'); 
  const [text, setText] = useState('');
  const [color, setColor] = useState('#000000');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [history, setHistory] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      // Set white background for draw mode so image saves correctly
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,460,260);
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
      newHistory.pop();
      const prevData = newHistory[newHistory.length - 1];
      const img = new Image();
      img.src = prevData;
      img.onload = () => {
          const ctx = canvasRef.current.getContext('2d');
          ctx.drawImage(img,0,0);
      };
      setHistory(newHistory);
  };

  const handleSubmit = async () => {
    if(loading) return;
    if(mode === 'text' && !text.trim()) { toast("Type something stupid!", "error"); return; }
    
    setLoading(true);
    try {
      const content = mode === 'text' ? text : canvasRef.current.toDataURL();
      const centerX = (window.innerWidth/2 - view.x) / view.scale;
      const centerY = (window.innerHeight/2 - view.y) / view.scale;

      await addDoc(collection(db, "notes"), {
        uid: user.uid,
        author: user.displayName,
        content,
        type: mode,
        x: centerX + (Math.random()-0.5)*150,
        y: centerY + (Math.random()-0.5)*150,
        style: { rotation: (Math.random()*8)-4, color },
        createdAt: serverTimestamp()
      });
      toast("Posted successfully!", "success");
      onClose();
    } catch(e) {
      toast("Failed to post.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-zinc-900 sketch-box w-full max-w-lg overflow-hidden relative shadow-2xl text-black">
        
        {/* Header */}
        <div className="bg-[#2ed573] border-b-2 border-black p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold font-['Permanent_Marker']">NEW STUPID THING</h2>
          <button onClick={onClose} className="bg-white hover:bg-red-100 border-2 border-black rounded-full p-1 transition-colors"><X size={18}/></button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6 justify-center">
            {['text', 'draw'].map(m => (
              <button key={m} onClick={()=>setMode(m)} className={`px-6 py-2 border-2 border-black rounded-full font-bold uppercase transition-all ${mode===m ? 'bg-[#ff4757] text-white shadow-[2px_2px_0px_black] -translate-y-1' : 'bg-white hover:bg-gray-100'}`}>
                {m}
              </button>
            ))}
          </div>

          <div className="relative border-2 border-black rounded-lg min-h-[260px] bg-white overflow-hidden shadow-inner">
             {/* Template Header Preview */}
             <div className="h-[100px] w-full bg-cover bg-center border-b-2 border-black opacity-80" style={{backgroundImage: "url('template.jpg')"}}></div>
             
             {mode === 'text' ? (
               <textarea 
                 autoFocus
                 value={text}
                 onChange={e => setText(e.target.value)}
                 className="w-full h-[160px] p-4 resize-none bg-transparent text-2xl font-['Permanent_Marker'] text-center placeholder:text-gray-300 focus:bg-yellow-50/30 transition-colors"
                 style={{ color }}
                 placeholder="Make it stupid..."
               />
             ) : (
               <div className="relative z-10 w-full h-[160px] bg-white">
                 <canvas 
                    ref={canvasRef}
                    width={460}
                    height={160}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                     <button onClick={undo} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-sm"><Undo size={16}/></button>
                     <button onClick={() => {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,460,260);
                        saveHistory();
                     }} className="p-2 bg-white border border-red-200 rounded hover:bg-red-50 text-red-500 shadow-sm"><Trash2 size={16}/></button>
                  </div>
               </div>
             )}
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
              {['#000000', '#ff4757', '#3742fa', '#2ed573', '#ffa502'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 border-black shadow-sm transition-transform ${color === c ? 'scale-125 ring-2 ring-gray-300 translate-y-[-2px]' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-black text-white px-6 py-2 font-['Permanent_Marker'] text-lg rounded-lg hover:bg-[#ffeaa7] hover:text-black border-2 border-transparent hover:border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1"
            >
              {loading ? <Loader2 className="animate-spin"/> : 'POST IT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HEADS UP DISPLAY (HUD) ---
const HUD = ({ user, view, setView, toggleCreate, darkMode, setDarkMode, notes = [] }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const toast = useToast();

    const copyCA = () => {
      navigator.clipboard.writeText(APP_CONSTANTS.CA);
      toast("CA Copied to clipboard!", "success");
    };

    // Marquee Logic - Memoized for performance
    const marqueeItems = useMemo(() => {
        const caItem = `PROJECT: ${APP_CONSTANTS.TICKER} /// CA: ${APP_CONSTANTS.CA}`;
        let items = [];
        
        if (notes && notes.length > 0) {
            // Take the latest 20 notes to keep the DOM light
            const recent = notes.slice(0, 20).map(n => {
                 const text = n.type === 'text' ? n.content.replace(/\s+/g, ' ').trim() : '🎨 [Masterpiece]';
                 // Truncate long messages
                 return `${text.slice(0, 40)}${text.length>40?'...':''} (@${n.author})`;
            });
            // Combine CA + Notes
            items = [caItem, ...recent];
        } else {
            // Default placeholder if no notes exist yet
            items = [caItem, "MAKE IT STUPID", "POST YOUR LINE"];
        }

        // Duplicate the list once. This is a classic trick for seamless CSS infinite scrolling.
        // It ensures that when the animation hits -50% (end of first list), it jumps back to 0% (start of identical first list) invisibly.
        return [...items, ...items];
    }, [notes]);

    return (
        <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-6">
            
            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
                {/* Profile / CA Card */}
                <div 
                    className="glass-panel p-2 pr-4 rounded-xl shadow-lg flex items-center gap-3 transition-transform hover:scale-[1.02] bg-cover bg-center relative overflow-hidden"
                    style={{ backgroundImage: "url('image1.jpg')" }}
                >
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-0 backdrop-blur-[2px]"></div>
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg border-2 border-black overflow-hidden flex items-center justify-center p-1">
                        <img src="superman.png" className="w-full h-full object-contain" onError={(e)=>e.target.style.display='none'} />
                      </div>
                      <div>
                          <h1 className="font-black leading-none text-sm text-black dark:text-white tracking-wider drop-shadow-md">{APP_CONSTANTS.TICKER}</h1>
                          <button onClick={copyCA} className="text-[10px] font-mono bg-black text-white px-2 py-1 rounded flex gap-1 items-center mt-1 hover:bg-[#ff4757] transition-colors shadow-sm">
                              {APP_CONSTANTS.CA.slice(0, 4)}...{APP_CONSTANTS.CA.slice(-4)} <Copy size={8}/>
                          </button>
                      </div>
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex gap-3">
                    <SocialButton href="https://www.tiktok.com/search?q=SayYourStupidLine" icon={<TikTokIcon />} />
                    <SocialButton href="https://x.com/search?q=SayYourStupidLine" icon={<Twitter size={20}/>} />
                    <button onClick={()=>setDarkMode(!darkMode)} className="glass-panel w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 transition-colors dark:text-white">
                        {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                    <div className="glass-panel px-3 py-1 rounded-full flex items-center gap-2 dark:text-white cursor-default bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: "url('image2.jpg')" }}>
                         <div className="absolute inset-0 bg-white/60 dark:bg-black/60 z-0"></div>
                         <div className="relative z-10 flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse box-content border border-white"></div>
                           <span className="font-bold text-sm max-w-[100px] truncate text-black dark:text-white drop-shadow-sm">{user.displayName}</span>
                           <button onClick={()=>signOut(auth)} className="ml-2 p-1 hover:bg-red-100 rounded-full hover:text-red-500 transition-colors"><LogOut size={14}/></button>
                         </div>
                    </div>
                </div>

                {/* Mobile Toggle */}
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden glass-panel p-2 rounded-lg text-black dark:text-white active:scale-95">
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="pointer-events-auto fixed inset-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-xl p-8 flex flex-col animate-in slide-in-from-right duration-200">
                 <button onClick={() => setMobileMenuOpen(false)} className="self-end p-2 bg-gray-100 dark:bg-zinc-800 rounded-full mb-8"><X/></button>
                 <div className="flex flex-col gap-4 text-center">
                    <h2 className="text-3xl font-black dark:text-white">{user.displayName}</h2>
                    <div className="h-px bg-gray-200 dark:bg-zinc-800 w-full my-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <a href="https://www.tiktok.com/music/original-sound-7527600299981867798?is_from_webapp=1&sender_device=pc" target="_blank" className="p-4 bg-black text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2">
                        <TikTokIcon size={24}/> TIKTOK
                      </a>
                      <a href="https://x.com/saystupidline" target="_blank" className="p-4 bg-blue-400 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2">
                        <Twitter size={24}/> TWITTER
                      </a>
                    </div>
                    <button onClick={() => { setDarkMode(!darkMode); setMobileMenuOpen(false); }} className="p-4 bg-gray-200 dark:bg-zinc-800 font-bold rounded-xl dark:text-white mt-4">
                       {darkMode ? 'LIGHT MODE' : 'DARK MODE'}
                    </button>
                    <button onClick={() => signOut(auth)} className="p-4 bg-red-100 text-red-600 font-bold rounded-xl mt-8">LOGOUT</button>
                 </div>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="pointer-events-auto flex items-end justify-center gap-6 pb-12 relative z-20">
                
                {/* Zoom Slider */}
                <div 
                  className="glass-panel px-4 py-2 rounded-full flex flex-col items-center w-32 transition-all hover:w-40 bg-cover bg-center relative overflow-hidden"
                  style={{ backgroundImage: "url('image3.jpg')" }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 z-0"></div>
                    <div className="relative z-10 flex flex-col items-center w-full">
                      <span className="text-[10px] font-bold tracking-widest opacity-80 mb-1 text-black dark:text-white">ZOOM</span>
                      <input type="range" min="0.1" max="3" step="0.1" value={view.scale} onChange={e=>setView(v=>({...v, scale:parseFloat(e.target.value)}))} />
                    </div>
                </div>
                
                {/* Big Plus Button */}
                <button onClick={toggleCreate} className="group relative">
                   <div className="absolute inset-0 bg-black rounded-full translate-y-2 transition-transform group-hover:translate-y-3"></div>
                   <div className="relative bg-[#ff4757] text-white w-20 h-20 rounded-full border-4 border-black flex items-center justify-center transition-transform group-hover:-translate-y-1 group-active:translate-y-1">
                      <Plus size={40} strokeWidth={4}/>
                   </div>
                </button>

                {/* Reset View */}
                <button onClick={()=>setView({x:0,y:0,scale:1})} className="glass-panel w-12 h-12 flex items-center justify-center rounded-full hover:rotate-90 transition-transform dark:text-white" title="Reset View">
                    <Maximize2 size={20}/>
                </button>
            </div>

            {/* Infinite Marquee */}
            <div className="fixed bottom-0 left-0 right-0 h-8 bg-[#ff4757] text-white flex items-center overflow-hidden border-t-4 border-black pointer-events-none z-10">
                 <div className="marquee-track font-bold text-sm tracking-widest whitespace-nowrap">
                   {marqueeItems.map((text, i) => (
                      <span key={i} className="mx-4">
                         {text} /// 
                      </span>
                   ))}
                 </div>
            </div>
        </div>
    );
};

const SocialButton = ({ href, icon }) => (
  <a href={href} target="_blank" rel="noreferrer" className="glass-panel w-10 h-10 flex items-center justify-center rounded-full hover:bg-black hover:text-white transition-all dark:text-white dark:hover:bg-white dark:hover:text-black">
    {icon}
  </a>
);

const TikTokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
     <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);