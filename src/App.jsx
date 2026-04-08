import { useState, useEffect, useCallback, useMemo } from "react";

// ── palette ──
const C = {
  bg: "#0d0f14", surface: "#181b22", card: "#1e222b", cardHover: "#252a35",
  accent: "#00ddb3", accentDim: "rgba(0,221,179,0.12)", accentText: "#00ddb3",
  text: "#f0f2f5", textSec: "#8b919e", textTer: "#555b67",
  border: "#2a2f3a", danger: "#ff5c5c", warning: "#ffb547",
  protein: "#5b8def", carbs: "#ffb547", fat: "#ff6b8a",
  white: "#fff",
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const fmtDate = (iso) => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
const fmtFull = (iso) => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); };

// ── storage ──
function load(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } }
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

// ── seed ──
const SEED = {
  users: [
    { id: "t1", name: "Coach Alex", email: "alex@fitpro.com", role: "trainer", pin: "1234" },
    { id: "c1", name: "Sarah Chen", email: "sarah@mail.com", role: "client", trainerId: "t1", pin: "0000", age: 28, goal: "Build lean muscle", emoji: "💪" },
    { id: "c2", name: "Marcus J.", email: "marcus@mail.com", role: "client", trainerId: "t1", pin: "0000", age: 34, goal: "Lose 20 lbs", emoji: "🔥" },
    { id: "c3", name: "Priya Patel", email: "priya@mail.com", role: "client", trainerId: "t1", pin: "0000", age: 25, goal: "Marathon prep", emoji: "🏃‍♀️" },
  ],
  programs: [
    { id: "p1", trainerId: "t1", name: "Hypertrophy A", desc: "Upper/lower split for growth", exercises: [
      { id: "e1", name: "Bench Press", sets: 4, reps: 8, weight: 135 },
      { id: "e2", name: "Bent-Over Row", sets: 4, reps: 8, weight: 115 },
      { id: "e3", name: "Overhead Press", sets: 3, reps: 10, weight: 75 },
      { id: "e4", name: "Barbell Curl", sets: 3, reps: 12, weight: 50 },
    ]},
    { id: "p2", trainerId: "t1", name: "Fat Loss HIIT", desc: "Metabolic conditioning", exercises: [
      { id: "e5", name: "KB Swing", sets: 4, reps: 15, weight: 35 },
      { id: "e6", name: "Goblet Squat", sets: 4, reps: 12, weight: 40 },
      { id: "e7", name: "Burpees", sets: 3, reps: 15, weight: 0 },
    ]},
  ],
  assignments: [{ clientId: "c1", programId: "p1" }, { clientId: "c2", programId: "p2" }],
  sessions: [
    { id: "s1", clientId: "c1", programId: "p1", date: "2026-04-06T10:00:00Z", logs: [
      { exerciseId: "e1", sets: [{ reps: 8, weight: 135 }, { reps: 8, weight: 135 }, { reps: 7, weight: 135 }, { reps: 6, weight: 135 }] },
      { exerciseId: "e2", sets: [{ reps: 8, weight: 115 }, { reps: 8, weight: 115 }, { reps: 8, weight: 115 }, { reps: 7, weight: 115 }] },
    ]},
    { id: "s2", clientId: "c1", programId: "p1", date: "2026-04-03T09:00:00Z", logs: [
      { exerciseId: "e1", sets: [{ reps: 8, weight: 130 }, { reps: 8, weight: 130 }, { reps: 8, weight: 130 }, { reps: 7, weight: 130 }] },
    ]},
    { id: "s3", clientId: "c2", programId: "p2", date: "2026-04-07T14:00:00Z", logs: [
      { exerciseId: "e5", sets: [{ reps: 15, weight: 35 }, { reps: 15, weight: 35 }, { reps: 12, weight: 35 }] },
    ]},
  ],
  nutrition: [
    { id: "n1", clientId: "c1", name: "Lean Bulk 2800", cal: 2800, protein: 180, carbs: 310, fat: 80 },
    { id: "n2", clientId: "c2", name: "Cut 2000", cal: 2000, protein: 200, carbs: 150, fat: 65 },
  ],
  meals: [
    { id: "m1", clientId: "c1", date: "2026-04-08", items: [
      { name: "Oatmeal + Whey", cal: 520, protein: 40, carbs: 65, fat: 10 },
      { name: "Chicken Rice Bowl", cal: 680, protein: 50, carbs: 70, fat: 15 },
      { name: "Salmon + Sweet Potato", cal: 610, protein: 42, carbs: 55, fat: 18 },
    ]},
  ],
  notes: [
    { id: "nt1", clientId: "c1", text: "Sarah hit a PR on bench — 145×3. Bump working weight next week.", at: "2026-04-06T11:00:00Z" },
    { id: "nt2", clientId: "c1", text: "Some shoulder tightness. Extra warm-up for OHP days.", at: "2026-04-04T09:30:00Z" },
    { id: "nt3", clientId: "c2", text: "Marcus down 4 lbs this month. Energy good. Keep current plan.", at: "2026-04-07T15:00:00Z" },
  ],
};

// ── SVG icons (simple, bold) ──
const icons = {
  home: <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/>,
  users: <><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></>,
  dumbbell: <><rect x="2" y="10" width="4" height="4" rx="1"/><rect x="18" y="10" width="4" height="4" rx="1"/><rect x="6" y="8" width="3" height="8" rx="1"/><rect x="15" y="8" width="3" height="8" rx="1"/><line x1="9" y1="12" x2="15" y2="12" strokeWidth="2.5"/></>,
  apple: <path d="M12 3c-1.5 0-2.5.5-3 1.5C8.5 3.5 7 3 5.5 4S3 7 3 9.5c0 4 3.5 9.5 6 11 1 .6 2 1 3 1s2-.4 3-1c2.5-1.5 6-7 6-11 0-2.5-1-4-2.5-5S14 3.5 13 4.5C12.5 3.5 13.5 3 12 3zm0 0c.5-1 2-2 3-2"/>,
  note: <><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  back: <polyline points="15 18 9 12 15 6"/>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  edit: <><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M10 11v6M14 11v6"/></>,
  check: <polyline points="20 6 9 17 4 12"/>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  flame: <path d="M12 2c0 4-4 6-4 10a4 4 0 008 0c0-4-4-6-4-10z"/>,
};
const Ic = ({ name, size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>
);

// ── Shared Components ──
function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={s.sheetOverlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>
        <div style={s.sheetHandle} />
        <div style={s.sheetHead}>
          <span style={s.sheetTitle}>{title}</span>
          <button style={s.sheetClose} onClick={onClose}><Ic name="x" size={20} color={C.textSec} /></button>
        </div>
        <div style={s.sheetBody}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={s.label}>{label}</label>}
      <input style={s.input} {...props} />
    </div>
  );
}
function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={s.label}>{label}</label>}
      <textarea style={{ ...s.input, minHeight: 90, resize: "vertical" }} {...props} />
    </div>
  );
}
function Btn({ children, variant = "primary", full, small, style: sx, ...props }) {
  const base = { ...s.btn, ...(variant === "primary" ? s.btnPrimary : variant === "danger" ? s.btnDanger : s.btnOutline), ...(full && { width: "100%" }), ...(small && { padding: "8px 14px", fontSize: 13 }), ...sx };
  return <button style={base} {...props}>{children}</button>;
}
function MacroRing({ value, max, color, label, size = 52 }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

// ══════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════
export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [data, setData] = useState(SEED);
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState(null); // {type, payload}
  const [sheet, setSheet] = useState(null);
  const [editProg, setEditProg] = useState(null);
  const [clientTab, setClientTab] = useState("workout");

  useEffect(() => { const d = load("fp2", null); if (d) setData(d); setReady(true); }, []);
  useEffect(() => { if (ready) save("fp2", data); }, [data, ready]);

  const up = useCallback((fn) => setData(prev => { const n = { ...prev }; fn(n); return { ...n }; }), []);
  const isTrainer = user?.role === "trainer";
  const clients = useMemo(() => data.users.filter(u => u.role === "client" && u.trainerId === (isTrainer ? user?.id : user?.trainerId)), [data.users, user, isTrainer]);

  const getProg = (cid) => { const a = data.assignments.find(x => x.clientId === cid); return a ? data.programs.find(p => p.id === a.programId) : null; };
  const getSessions = (cid) => data.sessions.filter(x => x.clientId === cid).sort((a, b) => new Date(b.date) - new Date(a.date));
  const getNotes = (cid) => data.notes.filter(x => x.clientId === cid).sort((a, b) => new Date(b.at) - new Date(a.at));
  const getNutrition = (cid) => data.nutrition.find(x => x.clientId === cid);
  const getMeals = (cid) => data.meals.filter(x => x.clientId === cid).sort((a, b) => b.date.localeCompare(a.date));

  const push = (type, payload) => { setScreen({ type, payload }); };
  const pop = () => setScreen(null);

  // ── CRUD ──
  const addClient = (c) => up(d => { d.users = [...d.users, { ...c, id: uid(), role: "client", trainerId: user.id, pin: "0000" }]; });
  const addProgram = (p) => up(d => { d.programs = [...d.programs, { ...p, id: uid(), trainerId: user.id }]; });
  const updateProgram = (id, p) => up(d => { d.programs = d.programs.map(x => x.id === id ? { ...x, ...p } : x); });
  const assignProg = (cid, pid) => up(d => {
    const existing = d.assignments.find(a => a.clientId === cid && a.programId === pid);
    if (existing) { d.assignments = d.assignments.filter(a => !(a.clientId === cid && a.programId === pid)); }
    else { d.assignments = [...d.assignments.filter(a => a.clientId !== cid), { clientId: cid, programId: pid }]; }
  });
  const addSession = (se) => up(d => { d.sessions = [...d.sessions, { ...se, id: uid() }]; });
  const addNote = (n) => up(d => { d.notes = [...d.notes, { ...n, id: uid(), at: now() }]; });
  const delNote = (id) => up(d => { d.notes = d.notes.filter(x => x.id !== id); });
  const addNutrition = (n) => up(d => { const ex = d.nutrition.find(x => x.clientId === n.clientId); if (ex) d.nutrition = d.nutrition.map(x => x.id === ex.id ? { ...x, ...n } : x); else d.nutrition = [...d.nutrition, { ...n, id: uid() }]; });
  const addMeal = (ml) => up(d => { const ex = d.meals.find(m => m.clientId === ml.clientId && m.date === ml.date); if (ex) d.meals = d.meals.map(m => m.id === ex.id ? { ...m, items: [...m.items, ...ml.items] } : m); else d.meals = [...d.meals, { ...ml, id: uid() }]; });

  // ═══════════════════════════
  // LOGIN
  // ═══════════════════════════
  if (!ready) return <div style={{ ...s.full, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: C.accent, fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 800 }}>FitPulse</div></div>;

  if (!user) {
    return <LoginScreen users={data.users} onLogin={u => { setUser(u); setTab("home"); }} onSignup={u => {
      const newUser = { ...u, id: uid() };
      up(d => { d.users = [...d.users, newUser]; });
      setUser(newUser);
      setTab("home");
    }} />;
  }

  const curClient = screen?.type === "client" ? screen.payload : (!isTrainer ? user : null);

  // ═══════════════════════════
  // SCREENS
  // ═══════════════════════════

  // -- HOME (Trainer) --
  const HomeTrainer = () => {
    const totalSessions = data.sessions.filter(s => clients.some(c => c.id === s.clientId)).length;
    return (
      <div style={s.page}>
        <div style={{ padding: "8px 0 20px" }}>
          <div style={{ fontSize: 14, color: C.textSec }}>Welcome back</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{user.name}</div>
        </div>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto" }}>
          {[
            { val: clients.length, label: "Clients", color: C.accent },
            { val: totalSessions, label: "Sessions", color: C.protein },
            { val: data.programs.filter(p => p.trainerId === user.id).length, label: "Programs", color: C.warning },
          ].map((s2, i) => (
            <div key={i} style={{ ...s.statPill, minWidth: 100, flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: s2.color }}>{s2.val}</div>
              <div style={{ fontSize: 11, color: C.textSec, textTransform: "uppercase", letterSpacing: 1 }}>{s2.label}</div>
            </div>
          ))}
        </div>
        {/* Client list */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Clients</span>
          <button style={s.addBtn} onClick={() => setSheet("add-client")}><Ic name="plus" size={18} color={C.accent} /></button>
        </div>
        {clients.map(c => {
          const prog = getProg(c.id);
          const sessCount = getSessions(c.id).length;
          return (
            <div key={c.id} style={s.clientRow} onClick={() => { push("client", c); setClientTab("workout"); }}>
              <div style={s.clientEmoji}>{c.emoji || "👤"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{c.name}</div>
                <div style={{ fontSize: 13, color: C.textSec, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.goal}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: prog ? C.accent : C.textTer, fontWeight: 600, textTransform: "uppercase" }}>{prog ? prog.name : "No plan"}</div>
                <div style={{ fontSize: 12, color: C.textSec }}>{sessCount} sessions</div>
              </div>
              <Ic name="back" size={16} color={C.textTer} style={{ transform: "rotate(180deg)" }} />
            </div>
          );
        })}
      </div>
    );
  };

  // -- HOME (Client) --
  const HomeClient = () => {
    const prog = getProg(user.id);
    const nutr = getNutrition(user.id);
    const todayMeals = getMeals(user.id).find(m => m.date === new Date().toISOString().slice(0, 10));
    const totals = todayMeals ? todayMeals.items.reduce((a, m) => ({ cal: a.cal + m.cal, p: a.p + m.protein, c: a.c + m.carbs, f: a.f + m.fat }), { cal: 0, p: 0, c: 0, f: 0 }) : { cal: 0, p: 0, c: 0, f: 0 };
    const recentNotes = getNotes(user.id).slice(0, 2);

    return (
      <div style={s.page}>
        <div style={{ padding: "8px 0 20px" }}>
          <div style={{ fontSize: 14, color: C.textSec }}>Hey there</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{user.name}</div>
        </div>
        {/* Today's macros */}
        {nutr && (
          <div style={{ ...s.cardDark, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Today's Nutrition</div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <MacroRing value={totals.cal} max={nutr.cal} color={C.accent} label="Cal" size={58} />
              <MacroRing value={totals.p} max={nutr.protein} color={C.protein} label="Protein" size={58} />
              <MacroRing value={totals.c} max={nutr.carbs} color={C.carbs} label="Carbs" size={58} />
              <MacroRing value={totals.f} max={nutr.fat} color={C.fat} label="Fat" size={58} />
            </div>
          </div>
        )}
        {/* Current program */}
        <div style={{ ...s.cardDark, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Current Program</div>
          {prog ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>{prog.name}</div>
              <div style={{ fontSize: 13, color: C.textSec, marginBottom: 12 }}>{prog.desc}</div>
              {prog.exercises.map(ex => (
                <div key={ex.id} style={s.exRow}>
                  <span style={{ fontWeight: 600, color: C.text, flex: 1 }}>{ex.name}</span>
                  <span style={{ color: C.accent, fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13 }}>{ex.sets}×{ex.reps} {ex.weight > 0 ? `@ ${ex.weight}lb` : "BW"}</span>
                </div>
              ))}
            </>
          ) : <div style={{ color: C.textTer, fontSize: 14, padding: "16px 0", textAlign: "center" }}>No program assigned yet</div>}
        </div>
        {/* Recent notes */}
        {recentNotes.length > 0 && (
          <div style={{ ...s.cardDark }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Trainer Notes</div>
            {recentNotes.map(n => (
              <div key={n.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{n.text}</div>
                <div style={{ fontSize: 11, color: C.textTer, marginTop: 4 }}>{fmtFull(n.at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // -- PROGRAMS TAB --
  const ProgramsTab = () => {
    const progs = data.programs.filter(p => p.trainerId === user.id);
    return (
      <div style={s.page}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>Programs</div>
          <button style={s.addBtn} onClick={() => { setEditProg(null); setSheet("add-program"); }}><Ic name="plus" size={18} color={C.accent} /></button>
        </div>
        {progs.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.textTer }}>No programs yet</div>}
        {progs.map(p => (
          <div key={p.id} style={{ ...s.cardDark, marginBottom: 12 }} onClick={() => push("program-detail", p)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 13, color: C.textSec, marginTop: 2 }}>{p.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ ...s.badge }}>{p.exercises.length} exercises</div>
                <button onClick={e => { e.stopPropagation(); setEditProg(p); setSheet("add-program"); }} style={{ ...s.addBtn, width: 32, height: 32, marginLeft: 0 }}><Ic name="edit" size={15} color={C.accent} /></button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              {p.exercises.slice(0, 3).map(ex => (
                <div key={ex.id} style={s.exRow}>
                  <span style={{ color: C.text, fontWeight: 500, flex: 1 }}>{ex.name}</span>
                  <span style={{ color: C.textSec, fontSize: 13 }}>{ex.sets}×{ex.reps}</span>
                </div>
              ))}
              {p.exercises.length > 3 && <div style={{ fontSize: 12, color: C.textTer, padding: "6px 0" }}>+{p.exercises.length - 3} more</div>}
            </div>
            {/* Assigned clients */}
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {clients.map(c => {
                const assigned = data.assignments.find(a => a.clientId === c.id && a.programId === p.id);
                return (
                  <button key={c.id} onClick={e => { e.stopPropagation(); assignProg(c.id, p.id); }}
                    style={{ ...s.chipBtn, ...(assigned ? { background: C.accentDim, color: C.accent, borderColor: "transparent" } : {}) }}>
                    {assigned && "✓ "}{c.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // -- CLIENT DETAIL --
  const ClientDetail = () => {
    const c = curClient;
    if (!c) return null;
    const prog = getProg(c.id);
    const sessions = getSessions(c.id);
    const notes = getNotes(c.id);
    const nutr = getNutrition(c.id);
    const mealLogs = getMeals(c.id);

    return (
      <div style={s.page}>
        {isTrainer && (
          <button style={s.backBtn} onClick={pop}><Ic name="back" size={20} color={C.textSec} /><span>Back</span></button>
        )}
        {/* Profile header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={s.bigEmoji}>{c.emoji || "👤"}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{c.name}</div>
            <div style={{ fontSize: 13, color: C.textSec }}>{c.goal}{c.age ? ` · ${c.age}y` : ""}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {["workout", "nutrition", "notes"].map(t => (
            <button key={t} style={{ ...s.tab, ...(clientTab === t ? s.tabActive : {}) }} onClick={() => setClientTab(t)}>
              {t === "workout" ? "💪 Workout" : t === "nutrition" ? "🍎 Nutrition" : "📝 Notes"}
            </button>
          ))}
        </div>

        {/* WORKOUT */}
        {clientTab === "workout" && (
          <div>
            <div style={{ ...s.cardDark, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1 }}>Program</span>
                {isTrainer && <Btn small onClick={() => setSheet("log-session")}>Log Session</Btn>}
              </div>
              {prog ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10 }}>{prog.name}</div>
                  {prog.exercises.map(ex => (
                    <div key={ex.id} style={s.exRow}>
                      <span style={{ fontWeight: 600, color: C.text, flex: 1 }}>{ex.name}</span>
                      <span style={{ color: C.accent, fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>{ex.sets}×{ex.reps} {ex.weight > 0 ? `${ex.weight}lb` : "BW"}</span>
                    </div>
                  ))}
                </>
              ) : <div style={{ color: C.textTer, textAlign: "center", padding: 20 }}>No program assigned</div>}
            </div>

            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>Session History</div>
            {sessions.length === 0 && <div style={{ color: C.textTer, textAlign: "center", padding: 20 }}>No sessions logged</div>}
            {sessions.map(se => {
              const p = data.programs.find(x => x.id === se.programId);
              return (
                <div key={se.id} style={{ ...s.cardDark, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{p?.name || "Session"}</span>
                    <span style={{ fontSize: 12, color: C.textTer }}>{fmtDate(se.date)}</span>
                  </div>
                  {se.logs.map((log, li) => {
                    const ex = p?.exercises.find(e => e.id === log.exerciseId);
                    return (
                      <div key={li} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec }}>{ex?.name}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                          {log.sets.map((st, si) => (
                            <span key={si} style={s.setChip}>{st.reps}×{st.weight}lb</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* NUTRITION */}
        {clientTab === "nutrition" && (
          <div>
            <div style={{ ...s.cardDark, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1 }}>Plan</span>
                {isTrainer && <Btn small onClick={() => setSheet("nutrition")}>{nutr ? "Edit" : "Create"}</Btn>}
              </div>
              {nutr ? (
                <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0" }}>
                  <MacroRing value={nutr.cal} max={nutr.cal} color={C.accent} label="Cal" />
                  <MacroRing value={nutr.protein} max={nutr.protein} color={C.protein} label="Protein" />
                  <MacroRing value={nutr.carbs} max={nutr.carbs} color={C.carbs} label="Carbs" />
                  <MacroRing value={nutr.fat} max={nutr.fat} color={C.fat} label="Fat" />
                </div>
              ) : <div style={{ color: C.textTer, textAlign: "center", padding: 20 }}>No nutrition plan</div>}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Meal Logs</span>
              {isTrainer && <button style={s.addBtn} onClick={() => setSheet("log-meal")}><Ic name="plus" size={18} color={C.accent} /></button>}
            </div>
            {mealLogs.length === 0 && <div style={{ color: C.textTer, textAlign: "center", padding: 20 }}>No meals logged</div>}
            {mealLogs.map(ml => {
              const tot = ml.items.reduce((a, m) => ({ cal: a.cal + m.cal, p: a.p + m.protein, c: a.c + m.carbs, f: a.f + m.fat }), { cal: 0, p: 0, c: 0, f: 0 });
              return (
                <div key={ml.id} style={{ ...s.cardDark, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>{fmtDate(ml.date + "T00:00:00Z")}</div>
                  {ml.items.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
                      <span style={{ color: C.text }}>{m.name}</span>
                      <span style={{ color: C.textSec, fontSize: 12 }}>{m.cal}cal</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: C.accent }}>{tot.cal} cal</span>
                    <span style={{ color: C.protein }}>{tot.p}g P</span>
                    <span style={{ color: C.carbs }}>{tot.c}g C</span>
                    <span style={{ color: C.fat }}>{tot.f}g F</span>
                  </div>
                  {nutr && (
                    <div style={{ height: 6, borderRadius: 3, background: C.border, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(100, (tot.cal / nutr.cal) * 100)}%`, background: tot.cal > nutr.cal ? C.danger : C.accent, transition: "width 0.4s ease" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* NOTES */}
        {clientTab === "notes" && (
          <div>
            {isTrainer && <Btn full style={{ marginBottom: 16 }} onClick={() => setSheet("add-note")}>+ Add Note</Btn>}
            {notes.length === 0 && <div style={{ color: C.textTer, textAlign: "center", padding: 20 }}>No notes yet</div>}
            {notes.map(n => (
              <div key={n.id} style={{ ...s.cardDark, marginBottom: 10, borderLeft: `3px solid ${C.accent}` }}>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 6 }}>{n.text}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.textTer }}>{fmtFull(n.at)}</span>
                  {isTrainer && (
                    <button style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }} onClick={() => delNote(n.id)}><Ic name="trash" size={14} color={C.danger} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════
  // SHEETS (bottom sheets for forms)
  // ═══════════════════════════
  const AddClientSheet = () => {
    const [name, setName] = useState(""); const [goal, setGoal] = useState(""); const [age, setAge] = useState("");
    return (
      <Sheet open title="Add Client" onClose={() => setSheet(null)}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
        <Input label="Goal" value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Build muscle" />
        <Input label="Age" type="number" value={age} onChange={e => setAge(e.target.value)} />
        <Btn full onClick={() => { if (name) { addClient({ name, goal, age: Number(age) || null, emoji: "💪" }); setSheet(null); } }}>Add Client</Btn>
      </Sheet>
    );
  };

  const AddProgramSheet = () => {
    const [name, setName] = useState(editProg?.name || ""); const [desc, setDesc] = useState(editProg?.desc || "");
    const [exs, setExs] = useState(editProg?.exercises || [{ id: uid(), name: "", sets: 3, reps: 10, weight: 0 }]);
    const addEx = () => setExs([...exs, { id: uid(), name: "", sets: 3, reps: 10, weight: 0 }]);
    const upEx = (i, f, v) => setExs(exs.map((e, j) => j === i ? { ...e, [f]: f === "name" ? v : Number(v) || 0 } : e));
    const rmEx = (i) => exs.length > 1 && setExs(exs.filter((_, j) => j !== i));
    return (
      <Sheet open title={editProg ? "Edit Program" : "New Program"} onClose={() => { setSheet(null); setEditProg(null); }}>
        <Input label="Program Name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Exercises</div>
        {exs.map((ex, i) => (
          <div key={ex.id} style={{ marginBottom: 10, padding: 12, background: C.surface, borderRadius: 12, position: "relative" }}>
            {exs.length > 1 && <button onClick={() => rmEx(i)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer" }}><Ic name="x" size={16} color={C.danger} /></button>}
            <Input label="Name" value={ex.name} onChange={e => upEx(i, "name", e.target.value)} placeholder="Bench Press" />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><Input label="Sets" type="number" value={ex.sets} onChange={e => upEx(i, "sets", e.target.value)} /></div>
              <div style={{ flex: 1 }}><Input label="Reps" type="number" value={ex.reps} onChange={e => upEx(i, "reps", e.target.value)} /></div>
              <div style={{ flex: 1 }}><Input label="lbs" type="number" value={ex.weight} onChange={e => upEx(i, "weight", e.target.value)} /></div>
            </div>
          </div>
        ))}
        <Btn variant="outline" full style={{ marginBottom: 14 }} onClick={addEx}>+ Add Exercise</Btn>
        <Btn full onClick={() => { if (name && exs.every(e => e.name)) { if (editProg) updateProgram(editProg.id, { name, desc, exercises: exs }); else addProgram({ name, desc, exercises: exs }); setSheet(null); setEditProg(null); } }}>{editProg ? "Update Program" : "Create Program"}</Btn>
      </Sheet>
    );
  };

  const LogSessionSheet = () => {
    const c = curClient;
    const prog = getProg(c?.id);
    const [logs, setLogs] = useState(() => (prog?.exercises || []).map(ex => ({ exerciseId: ex.id, sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: ex.weight })) })));
    if (!prog) return <Sheet open title="Log Session" onClose={() => setSheet(null)}><div style={{ color: C.textTer, textAlign: "center", padding: 20 }}>Assign a program first</div></Sheet>;
    const upSet = (ei, si, f, v) => setLogs(logs.map((l, i) => i === ei ? { ...l, sets: l.sets.map((st, j) => j === si ? { ...st, [f]: Number(v) || 0 } : st) } : l));
    return (
      <Sheet open title={`Log Session — ${c.name}`} onClose={() => setSheet(null)}>
        {prog.exercises.map((ex, ei) => (
          <div key={ex.id} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{ex.name}</div>
            {logs[ei]?.sets.map((st, si) => (
              <div key={si} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.textTer, width: 36 }}>Set {si + 1}</span>
                <input style={{ ...s.input, marginBottom: 0, width: 60, textAlign: "center" }} type="number" value={st.reps} onChange={e => upSet(ei, si, "reps", e.target.value)} />
                <span style={{ color: C.textTer, fontSize: 12 }}>×</span>
                <input style={{ ...s.input, marginBottom: 0, width: 70, textAlign: "center" }} type="number" value={st.weight} onChange={e => upSet(ei, si, "weight", e.target.value)} />
                <span style={{ color: C.textTer, fontSize: 12 }}>lb</span>
              </div>
            ))}
          </div>
        ))}
        <Btn full onClick={() => { addSession({ clientId: c.id, programId: prog.id, date: now(), logs }); setSheet(null); }}>Save Session</Btn>
      </Sheet>
    );
  };

  const NoteSheet = () => {
    const [text, setText] = useState("");
    return (
      <Sheet open title="Add Note" onClose={() => setSheet(null)}>
        <Textarea label="Note" value={text} onChange={e => setText(e.target.value)} placeholder="Write a note..." />
        <Btn full onClick={() => { if (text) { addNote({ clientId: curClient.id, text }); setSheet(null); } }}>Save Note</Btn>
      </Sheet>
    );
  };

  const NutritionSheet = () => {
    const existing = getNutrition(curClient?.id);
    const [name, setName] = useState(existing?.name || ""); const [cal, setCal] = useState(existing?.cal || "");
    const [pro, setPro] = useState(existing?.protein || ""); const [carbs, setCarbs] = useState(existing?.carbs || ""); const [fat, setFat] = useState(existing?.fat || "");
    return (
      <Sheet open title={existing ? "Edit Nutrition Plan" : "New Nutrition Plan"} onClose={() => setSheet(null)}>
        <Input label="Plan Name" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Input label="Calories" type="number" value={cal} onChange={e => setCal(e.target.value)} />
          <Input label="Protein (g)" type="number" value={pro} onChange={e => setPro(e.target.value)} />
          <Input label="Carbs (g)" type="number" value={carbs} onChange={e => setCarbs(e.target.value)} />
          <Input label="Fat (g)" type="number" value={fat} onChange={e => setFat(e.target.value)} />
        </div>
        <Btn full onClick={() => { if (name) { addNutrition({ clientId: curClient.id, name, cal: Number(cal)||0, protein: Number(pro)||0, carbs: Number(carbs)||0, fat: Number(fat)||0 }); setSheet(null); } }}>Save Plan</Btn>
      </Sheet>
    );
  };

  const MealSheet = () => {
    const [name, setName] = useState(""); const [cal, setCal] = useState(""); const [pro, setPro] = useState(""); const [carbs, setCarbs] = useState(""); const [fat, setFat] = useState("");
    return (
      <Sheet open title="Log Meal" onClose={() => setSheet(null)}>
        <Input label="Food / Meal" value={name} onChange={e => setName(e.target.value)} placeholder="Chicken & Rice" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Input label="Calories" type="number" value={cal} onChange={e => setCal(e.target.value)} />
          <Input label="Protein (g)" type="number" value={pro} onChange={e => setPro(e.target.value)} />
          <Input label="Carbs (g)" type="number" value={carbs} onChange={e => setCarbs(e.target.value)} />
          <Input label="Fat (g)" type="number" value={fat} onChange={e => setFat(e.target.value)} />
        </div>
        <Btn full onClick={() => { if (name) { addMeal({ clientId: curClient.id, date: new Date().toISOString().slice(0, 10), items: [{ name, cal: Number(cal)||0, protein: Number(pro)||0, carbs: Number(carbs)||0, fat: Number(fat)||0 }] }); setSheet(null); } }}>Log Meal</Btn>
      </Sheet>
    );
  };

  // ═══════════════════════════
  // BOTTOM TAB BAR
  // ═══════════════════════════
  const trainerTabs = [
    { id: "home", label: "Clients", icon: "users" },
    { id: "programs", label: "Programs", icon: "dumbbell" },
    { id: "account", label: "Account", icon: "target" },
  ];
  const clientTabs = [
    { id: "home", label: "Home", icon: "home" },
    { id: "history", label: "History", icon: "calendar" },
    { id: "account", label: "Account", icon: "target" },
  ];
  const tabItems = isTrainer ? trainerTabs : clientTabs;

  // Account tab content
  const AccountTab = () => (
    <div style={s.page}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32 }}>
        <div style={{ ...s.bigEmoji, width: 72, height: 72, fontSize: 32, marginBottom: 12 }}>{user.emoji || "👤"}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{user.name}</div>
        <div style={{ fontSize: 14, color: C.textSec, marginTop: 2 }}>{user.email}</div>
        <div style={{ ...s.badge, marginTop: 8 }}>{user.role}</div>
        <Btn variant="danger" style={{ marginTop: 32 }} onClick={() => { setUser(null); setScreen(null); setTab("home"); }}><Ic name="logout" size={18} color="#fff" /> Sign Out</Btn>
      </div>
    </div>
  );

  // Client history tab
  const HistoryTab = () => {
    const sessions = getSessions(user.id);
    return (
      <div style={s.page}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 20 }}>Session History</div>
        {sessions.length === 0 && <div style={{ color: C.textTer, textAlign: "center", padding: 40 }}>No sessions yet</div>}
        {sessions.map(se => {
          const p = data.programs.find(x => x.id === se.programId);
          return (
            <div key={se.id} style={{ ...s.cardDark, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: C.text }}>{p?.name || "Session"}</span>
                <span style={{ fontSize: 12, color: C.textTer }}>{fmtDate(se.date)}</span>
              </div>
              {se.logs.map((log, li) => {
                const ex = p?.exercises.find(e => e.id === log.exerciseId);
                return (
                  <div key={li} style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: C.textSec }}>{ex?.name}: </span>
                    {log.sets.map((st, si) => <span key={si} style={s.setChip}>{st.reps}×{st.weight}</span>)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════
  // RENDER
  // ═══════════════════════════
  let content;
  if (screen?.type === "client") content = <ClientDetail />;
  else if (screen?.type === "program-detail") {
    const p = data.programs.find(x => x.id === screen.payload.id) || screen.payload;
    content = (
      <div style={s.page}>
        <button style={s.backBtn} onClick={pop}><Ic name="back" size={20} color={C.textSec} /><span>Back</span></button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 14, color: C.textSec }}>{p.desc}</div>
          </div>
          <button style={{ ...s.addBtn, width: 44, height: 44 }} onClick={() => { setEditProg(p); setSheet("add-program"); }}><Ic name="edit" size={20} color={C.accent} /></button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Exercises</div>
        {p.exercises.map(ex => (
          <div key={ex.id} style={{ ...s.cardDark, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{ex.name}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 13, color: C.textSec }}><span style={{ color: C.accent, fontWeight: 700 }}>{ex.sets}</span> sets</span>
                <span style={{ fontSize: 13, color: C.textSec }}><span style={{ color: C.accent, fontWeight: 700 }}>{ex.reps}</span> reps</span>
                <span style={{ fontSize: 13, color: C.textSec }}><span style={{ color: C.accent, fontWeight: 700 }}>{ex.weight > 0 ? `${ex.weight}` : "BW"}</span>{ex.weight > 0 ? " lb" : ""}</span>
              </div>
            </div>
          </div>
        ))}
        <Btn full variant="outline" style={{ marginTop: 12, marginBottom: 20 }} onClick={() => { setEditProg(p); setSheet("add-program"); }}>
          <Ic name="edit" size={16} color={C.text} /> Edit Exercises
        </Btn>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Assign to clients</div>
        {clients.map(c => {
          const assigned = data.assignments.find(a => a.clientId === c.id && a.programId === p.id);
          return (
            <div key={c.id} style={{ ...s.clientRow, cursor: "pointer" }} onClick={() => assignProg(c.id, p.id)}>
              <div style={s.clientEmoji}>{c.emoji || "👤"}</div>
              <span style={{ flex: 1, fontWeight: 600, color: C.text }}>{c.name}</span>
              {assigned ? <Ic name="check" size={18} color={C.accent} /> : <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${C.border}` }} />}
            </div>
          );
        })}
      </div>
    );
  } else if (tab === "home") content = isTrainer ? <HomeTrainer /> : <HomeClient />;
  else if (tab === "programs") content = <ProgramsTab />;
  else if (tab === "history") content = <HistoryTab />;
  else if (tab === "account") content = <AccountTab />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Outfit', sans-serif; background: ${C.bg}; color: ${C.text}; overscroll-behavior: none; }
        input, textarea, button { font-family: inherit; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
      <div style={s.shell}>
        <div style={s.scrollArea}>{content}</div>
        {/* Bottom Tab Bar */}
        {!screen && (
          <div style={s.tabBar}>
            {tabItems.map(t => (
              <button key={t.id} style={{ ...s.tabBarBtn, ...(tab === t.id ? { color: C.accent } : {}) }} onClick={() => setTab(t.id)}>
                <Ic name={t.icon} size={22} color={tab === t.id ? C.accent : C.textTer} />
                <span style={{ fontSize: 10, marginTop: 2, fontWeight: tab === t.id ? 700 : 500 }}>{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sheets */}
      {sheet === "add-client" && <AddClientSheet />}
      {sheet === "add-program" && <AddProgramSheet />}
      {sheet === "log-session" && <LogSessionSheet />}
      {sheet === "add-note" && <NoteSheet />}
      {sheet === "nutrition" && <NutritionSheet />}
      {sheet === "log-meal" && <MealSheet />}
    </>
  );
}

// ═══════════════════════════
// LOGIN
// ═══════════════════════════
function LoginScreen({ users, onLogin, onSignup }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [age, setAge] = useState("");
  const [coachCode, setCoachCode] = useState("");
  const [err, setErr] = useState("");

  const goLogin = () => {
    const u = users.find(u => u.email === email && u.pin === pin);
    if (u) onLogin(u);
    else setErr("Invalid credentials");
  };

  const goSignup = () => {
    if (!name || !email || !pin) { setErr("Name, email, and password are required"); return; }
    if (pin.length < 4) { setErr("Password must be at least 4 characters"); return; }
    if (users.find(u => u.email === email)) { setErr("Email already registered"); return; }
    const trainer = users.find(u => u.role === "trainer" && (u.id === coachCode || u.email === coachCode || !coachCode));
    if (!trainer) { setErr("Coach not found. Leave blank to join default coach."); return; }
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const emojis = ["💪", "🔥", "⚡", "🏃‍♀️", "🎯", "💥", "🦾", "🏋️"];
    onSignup({
      name, email, pin, role: "client", trainerId: trainer.id,
      age: Number(age) || null, goal: goal || "Get fit",
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    });
  };

  return (
    <div style={s.full}>
      <div style={{ maxWidth: 360, width: "100%", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.accent, fontFamily: "'Outfit',sans-serif", letterSpacing: -1 }}>FitPulse</div>
          <div style={{ fontSize: 14, color: C.textSec, marginTop: 4 }}>
            {mode === "login" ? "Sign in to your account" : "Create your client account"}
          </div>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", background: C.surface, borderRadius: 14, padding: 4, marginBottom: 24 }}>
          <button onClick={() => { setMode("login"); setErr(""); }} style={{ ...togStyle, ...(mode === "login" ? togActive : {}) }}>Sign In</button>
          <button onClick={() => { setMode("signup"); setErr(""); }} style={{ ...togStyle, ...(mode === "signup" ? togActive : {}) }}>Sign Up</button>
        </div>

        {mode === "signup" && (
          <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Chen" />
        )}
        <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
        <Input label="Password" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder={mode === "signup" ? "Create a password" : "Enter password"} onKeyDown={e => e.key === "Enter" && (mode === "login" ? goLogin() : goSignup())} />

        {mode === "signup" && (
          <>
            <Input label="Your Fitness Goal" value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Build muscle, lose weight" />
            <Input label="Age (optional)" type="number" value={age} onChange={e => setAge(e.target.value)} />
            <Input label="Coach Code (email or ID — optional)" value={coachCode} onChange={e => setCoachCode(e.target.value)} placeholder="Leave blank for default coach" />
          </>
        )}

        {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{err}</div>}

        <Btn full onClick={mode === "login" ? goLogin : goSignup}>
          {mode === "login" ? "Sign In" : "Create Account"}
        </Btn>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: C.textTer, lineHeight: 1.8 }}>
          <strong style={{ color: C.textSec }}>Trainer:</strong> alex@fitpro.com / 1234<br/>
          <strong style={{ color: C.textSec }}>Client:</strong> sarah@mail.com / 0000
        </div>
      </div>
    </div>
  );
}
const togStyle = { flex: 1, padding: "10px 8px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: C.textTer, textAlign: "center", transition: "all 0.15s", fontFamily: "'Outfit',sans-serif" };
const togActive = { background: C.card, color: C.text, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" };

// ═══════════════════════════
// STYLE OBJECTS
// ═══════════════════════════
const s = {
  full: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg, padding: 24 },
  shell: { display: "flex", flexDirection: "column", height: "100vh", maxWidth: 480, margin: "0 auto", background: C.bg, position: "relative", overflow: "hidden" },
  scrollArea: { flex: 1, overflowY: "auto", paddingBottom: 80 },
  page: { padding: "16px 20px" },

  // Tab bar
  tabBar: { display: "flex", justifyContent: "space-around", alignItems: "center", height: 64, background: C.surface, borderTop: `1px solid ${C.border}`, position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: "env(safe-area-inset-bottom)" },
  tabBarBtn: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: C.textTer, cursor: "pointer", padding: "8px 16px", transition: "color 0.15s" },

  // Cards
  cardDark: { background: C.card, borderRadius: 16, padding: 18, border: `1px solid ${C.border}` },
  statPill: { background: C.card, borderRadius: 14, padding: "16px 14px", border: `1px solid ${C.border}`, textAlign: "center" },

  // Client row
  clientRow: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: C.card, borderRadius: 14, marginBottom: 8, cursor: "pointer", border: `1px solid ${C.border}`, transition: "background 0.15s" },
  clientEmoji: { width: 44, height: 44, borderRadius: 12, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 },
  bigEmoji: { width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 },

  // Exercise row
  exRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` },
  setChip: { display: "inline-block", background: C.accentDim, color: C.accent, fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6, marginRight: 4, marginTop: 2, fontFamily: "'Outfit',sans-serif" },

  // Badge
  badge: { display: "inline-flex", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, background: C.accentDim, color: C.accent },

  // Buttons
  btn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.15s", WebkitAppearance: "none" },
  btnPrimary: { background: C.accent, color: C.bg },
  btnOutline: { background: "transparent", border: `1.5px solid ${C.border}`, color: C.text },
  btnDanger: { background: C.danger, color: "#fff" },
  addBtn: { width: 40, height: 40, borderRadius: 12, background: C.accentDim, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  chipBtn: { padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "transparent", border: `1px solid ${C.border}`, color: C.textSec, cursor: "pointer" },

  // Back
  backBtn: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.textSec, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "8px 0", marginBottom: 12 },

  // Tabs
  tabs: { display: "flex", gap: 4, background: C.surface, borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: "10px 8px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", color: C.textTer, textAlign: "center", transition: "all 0.15s" },
  tabActive: { background: C.card, color: C.text, boxShadow: `0 2px 8px rgba(0,0,0,0.2)` },

  // Form
  label: { display: "block", fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 15, background: C.surface, color: C.text, outline: "none", transition: "border-color 0.15s", marginBottom: 0 },

  // Sheet
  sheetOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { background: C.surface, borderRadius: "20px 20px 0 0", maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "0 20px 32px", animation: "slideUp 0.3s ease" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, background: C.border, margin: "12px auto 16px" },
  sheetHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: 800, color: C.text },
  sheetClose: { background: "none", border: "none", cursor: "pointer", padding: 4 },
  sheetBody: {},
};