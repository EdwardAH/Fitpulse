// ─────────────────────────────────────────────────────────────
// App.jsx — FitPulse single-file React app
// All screens, components, and styles live here.
// Data is stored in Supabase (PostgreSQL in the cloud).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ── Colour palette ──
// All colours are defined once here so changing a single value
// updates the entire UI consistently.
const C = {
  bg: "#f5f0ea", surface: "#ede8e0", card: "#e8e2d9", cardHover: "#dfd8ce",
  accent: "#8db87a", accentDim: "rgba(141,184,122,0.18)", accentText: "#5a8c45",
  text: "#3a3228", textSec: "#7a6e62", textTer: "#a89d91",
  border: "#cdc5ba", danger: "#c0524a", warning: "#c98a2e",
  protein: "#6b8fbe", carbs: "#c98a2e", fat: "#c0697a",
  white: "#faf7f3",
};

// ── Utility helpers ──
const uid = () => Math.random().toString(36).slice(2, 10); // used for local IDs (Supabase generates real UUIDs)
const fmtDate = (iso) => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
const fmtFull = (iso) => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); };

// ── SVG icon paths ──
// Each key is a name used by the <Ic> component below.
// Icons are drawn as SVG path/shape elements at a 24×24 viewBox.
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
  bar: <><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></>,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
};
// <Ic> renders any icon by name at a given size and colour.
// Usage: <Ic name="trash" size={18} color={C.danger} />
const Ic = ({ name, size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>
);

// ── Shared UI components ──
// These are small building blocks reused across multiple screens.

// Sheet — a modal drawer that slides up from the bottom.
// Clicking the dark overlay (sheetOverlay) closes it via onClose.
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

// Input — a labelled text/number input with consistent styling.
function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={s.label}>{label}</label>}
      <input style={s.input} {...props} />
    </div>
  );
}
// Textarea — same as Input but multi-line (for notes, feedback, etc).
function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={s.label}>{label}</label>}
      <textarea style={{ ...s.input, minHeight: 90, resize: "vertical" }} {...props} />
    </div>
  );
}
// Btn — button with three variants: "primary" (green fill), "outline" (border only), "danger" (red).
// `full` stretches it to 100% width; `small` reduces padding and font size.
function Btn({ children, variant = "primary", full, small, style: sx, ...props }) {
  const base = { ...s.btn, ...(variant === "primary" ? s.btnPrimary : variant === "danger" ? s.btnDanger : s.btnOutline), ...(full && { width: "100%" }), ...(small && { padding: "8px 14px", fontSize: 13 }), ...sx };
  return <button style={base} {...props}>{children}</button>;
}
// MacroRing — an animated circular progress ring for calories/macros.
// `value` is the current amount, `max` is the goal; the ring fills proportionally.
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
  // ── App-level state ──
  const [ready, setReady] = useState(false);         // false until Supabase auth check completes
  const [user, setUser] = useState(null);            // profile row for the logged-in user
  const [data, setData] = useState({ clients: [], pendingClients: [], programs: [], assignments: [], sessions: [], nutrition: [], meals: [], notes: [], feedback: [], income: [] });
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [editProg, setEditProg] = useState(null);
  const [clientTab, setClientTab] = useState("workout");
  const [confirmRemove, setConfirmRemove] = useState(null);

  // ── Auth: listen for Supabase session changes ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile(session.user.id); else setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) loadProfile(session.user.id); else { setUser(null); setReady(true); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid) => {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (profile) { setUser(profile); } else setReady(true);
  };

  // ── Fetch all data after profile loads ──
  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const isTrainer = user.role === "trainer";
    const tid = isTrainer ? user.id : user.trainer_id;

    const [prog, asgn, sess, nutr, mls, nts, fb, inc] = await Promise.all([
      supabase.from("programs").select("*").eq("trainer_id", tid),
      supabase.from("assignments").select("*"),
      supabase.from("sessions").select("*"),
      supabase.from("nutrition").select("*"),
      supabase.from("meals").select("*"),
      supabase.from("notes").select("*"),
      supabase.from("feedback").select("*"),
      isTrainer ? supabase.from("income").select("*").eq("trainer_id", user.id) : { data: [] },
    ]);

    // fetch client profiles for trainer, or trainer's profile for client
    let clientRows = [], pendingRows = [];
    if (isTrainer) {
      const { data: all } = await supabase.from("profiles").select("*").eq("trainer_id", user.id).eq("role", "client");
      clientRows = (all || []).filter(c => c.status === "active");
      pendingRows = (all || []).filter(c => c.status === "pending");
    }

    setData({
      clients: clientRows,
      pendingClients: pendingRows,
      programs: prog.data || [],
      assignments: asgn.data || [],
      sessions: sess.data || [],
      nutrition: nutr.data || [],
      meals: mls.data || [],
      notes: nts.data || [],
      feedback: fb.data || [],
      income: inc.data || [],
    });
    setReady(true);
  }, [user]);

  // ── Derived values ──
  const isTrainer = user?.role === "trainer";
  const clients = data.clients;
  const pendingClients = data.pendingClients;

  // ── Data lookup helpers ──
  const getProg = (cid) => {
    const a = data.assignments.find(x => x.client_id === cid);
    return a ? data.programs.find(p => p.id === a.program_id) : null;
  };
  const getSessions = (cid) => (data.sessions || []).filter(x => x.client_id === cid).sort((a, b) => new Date(b.date) - new Date(a.date));
  const getNotes = (cid) => (data.notes || []).filter(x => x.client_id === cid).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const getNutrition = (cid) => (data.nutrition || []).find(x => x.client_id === cid);
  const getMeals = (cid) => (data.meals || []).filter(x => x.client_id === cid).sort((a, b) => b.date.localeCompare(a.date));

  // ── Navigation helpers ──
  const push = (type, payload) => { setScreen({ type, payload }); };
  const pop = () => setScreen(null);

  // ── CRUD functions (all async, call fetchData() to refresh state) ──

  const removeClient = async (id) => {
    await supabase.from("profiles").update({ status: "rejected" }).eq("id", id);
    fetchData();
  };
  const approveClient = async (id) => {
    await supabase.from("profiles").update({ status: "active" }).eq("id", id);
    fetchData();
  };
  const rejectClient = async (id) => {
    await supabase.from("profiles").update({ status: "rejected" }).eq("id", id);
    fetchData();
  };
  const addProgram = async (p) => {
    await supabase.from("programs").insert({ trainer_id: user.id, name: p.name, description: p.description, exercises: p.exercises });
    fetchData();
  };
  const updateProgram = async (id, p) => {
    await supabase.from("programs").update({ name: p.name, description: p.description, exercises: p.exercises }).eq("id", id);
    fetchData();
  };
  const assignProg = async (cid, pid) => {
    const existing = data.assignments.find(a => a.client_id === cid && a.program_id === pid);
    if (existing) {
      await supabase.from("assignments").delete().eq("client_id", cid).eq("program_id", pid);
    } else {
      await supabase.from("assignments").delete().eq("client_id", cid);
      await supabase.from("assignments").insert({ client_id: cid, program_id: pid });
    }
    fetchData();
  };
  const addSession = async (se) => {
    await supabase.from("sessions").insert({ client_id: se.clientId, program_id: se.programId, date: se.date, logs: se.logs });
    fetchData();
  };
  const delSession = async (id) => {
    await supabase.from("sessions").delete().eq("id", id);
    fetchData();
  };
  const addNote = async (n) => {
    await supabase.from("notes").insert({ client_id: n.clientId, text: n.text });
    fetchData();
  };
  const delNote = async (id) => {
    await supabase.from("notes").delete().eq("id", id);
    fetchData();
  };
  const addNutrition = async (n) => {
    await supabase.from("nutrition").upsert({ client_id: n.clientId, name: n.name, cal: n.cal, protein: n.protein, carbs: n.carbs, fat: n.fat }, { onConflict: "client_id" });
    fetchData();
  };
  const addMeal = async (ml) => {
    const existing = data.meals.find(m => m.client_id === ml.clientId && m.date === ml.date);
    if (existing) {
      await supabase.from("meals").update({ items: [...existing.items, ...ml.items] }).eq("id", existing.id);
    } else {
      await supabase.from("meals").insert({ client_id: ml.clientId, date: ml.date, items: ml.items });
    }
    fetchData();
  };
  const addFeedback = async (fb) => {
    await supabase.from("feedback").insert({ client_id: fb.clientId, text: fb.text, rating: fb.rating });
    fetchData();
  };
  const setIncome = async (trainerId, month, amount) => {
    await supabase.from("income").upsert({ trainer_id: trainerId, month, amount }, { onConflict: "trainer_id,month" });
    fetchData();
  };

  // ═══════════════════════════
  // GATE: loading / login / waitlist / rejected
  // ═══════════════════════════

  if (!ready) return <div style={{ ...s.full, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: C.accent, fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 800 }}>FitPulse</div></div>;

  if (!user) return <LoginScreen onLogin={() => {}} />;

  // ── Pending approval screen ──
  if (user.status === "pending") {
    return (
      <div style={{ ...s.full, flexDirection: "column", gap: 0, padding: "0 28px", textAlign: "center" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Outfit', sans-serif; background: ${C.bg}; }
        `}</style>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 10 }}>You're on the waitlist</div>
        <div style={{ fontSize: 15, color: C.textSec, lineHeight: 1.6, marginBottom: 8 }}>
          Your account is waiting for approval from your trainer. You'll get full access as soon as they confirm your spot.
        </div>
        <div style={{ display: "inline-block", background: C.accentDim, color: C.accentText, borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 700, margin: "16px 0 32px" }}>
          {user.name}
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 24px", fontSize: 14, color: C.textSec, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          Sign out
        </button>
      </div>
    );
  }

  // ── Rejected screen ──
  if (user.status === "rejected") {
    return (
      <div style={{ ...s.full, flexDirection: "column", gap: 0, padding: "0 28px", textAlign: "center" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Outfit', sans-serif; background: ${C.bg}; }
        `}</style>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚫</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 10 }}>Access not approved</div>
        <div style={{ fontSize: 15, color: C.textSec, lineHeight: 1.6, marginBottom: 32 }}>
          Your trainer was unable to accept your request at this time. Please reach out to them directly.
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 24px", fontSize: 14, color: C.textSec, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          Back to sign in
        </button>
      </div>
    );
  }

  // curClient resolves who the "active" client is depending on context:
  // - Trainer navigated into a client detail → use the pushed screen payload.
  // - Logged-in user is a client → they are always their own curClient.
  // - Trainer on the main tab bar → null (no single client in context).
  const curClient = screen?.type === "client" ? screen.payload : (!isTrainer ? user : null);

  // ═══════════════════════════
  // SCREENS
  // ═══════════════════════════

  // ── Trainer home screen ──
  // Shows summary stats, any clients waiting for approval, and the full active client list.
  // Tapping a client row calls push("client", c) to open ClientDetail as an overlay.
  // The trash button on each row sets confirmRemove, which triggers the confirmation modal.
  const HomeTrainer = () => {
    const totalSessions = data.sessions.filter(s => clients.some(c => c.id === s.client_id)).length;
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
            { val: data.programs.length, label: "Programs", color: C.warning },
          ].map((s2, i) => (
            <div key={i} style={{ ...s.statPill, minWidth: 100, flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: s2.color }}>{s2.val}</div>
              <div style={{ fontSize: 11, color: C.textSec, textTransform: "uppercase", letterSpacing: 1 }}>{s2.label}</div>
            </div>
          ))}
        </div>
        {/* Pending approvals */}
        {pendingClients.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Pending Approval</span>
              <span style={{ background: C.danger, color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 800, padding: "2px 8px" }}>{pendingClients.length}</span>
            </div>
            {pendingClients.map(c => (
              <div key={c.id} style={{ ...s.cardDark, marginBottom: 10, borderLeft: `3px solid ${C.warning}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={s.clientEmoji}>{c.emoji || "👤"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.textSec, marginTop: 1 }}>{c.goal}{c.age ? ` · ${c.age}y` : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => rejectClient(c.id)} style={{ background: "none", border: `1.5px solid ${C.danger}`, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: C.danger, cursor: "pointer" }}>Decline</button>
                    <button onClick={() => approveClient(c.id)} style={{ background: C.accentText, border: "none", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Approve</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
              <div style={{ textAlign: "right", marginRight: 4 }}>
                <div style={{ fontSize: 11, color: prog ? C.accent : C.textTer, fontWeight: 600, textTransform: "uppercase" }}>{prog ? prog.name : "No plan"}</div>
                <div style={{ fontSize: 12, color: C.textSec }}>{sessCount} sessions</div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setConfirmRemove(c); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, flexShrink: 0 }}>
                <Ic name="trash" size={17} color={C.danger} />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Client home screen ──
  // Shows the client's today macro rings, their current workout program, and recent trainer notes.
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
              <div style={{ fontSize: 13, color: C.textSec, marginBottom: 12 }}>{prog.description}</div>
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
                <div style={{ fontSize: 11, color: C.textTer, marginTop: 4 }}>{fmtFull(n.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Trainer programs tab ──
  // Lists all workout programs the trainer has created.
  // Tapping a program opens its detail screen; the edit button opens the program form sheet.
  // Client chip buttons at the bottom of each card toggle program assignment on/off.
  const ProgramsTab = () => {
    const progs = data.programs;
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
                <div style={{ fontSize: 13, color: C.textSec, marginTop: 2 }}>{p.description}</div>
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
                const assigned = data.assignments.find(a => a.client_id === c.id && a.program_id === p.id);
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

  // ── Client detail screen (trainer view) ──
  // Full profile for a single client, accessed by the trainer by tapping a client row.
  // Contains four sub-tabs: Workout, Weekly, Nutrition, and Notes.
  // Only trainers see action buttons (Log Session, Edit Plan, Add Note, etc.).
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
        <div style={{ ...s.tabs, overflowX: "auto" }}>
          {["workout", "weekly", "nutrition", "notes"].map(t => (
            <button key={t} style={{ ...s.tab, ...(clientTab === t ? s.tabActive : {}), whiteSpace: "nowrap" }} onClick={() => setClientTab(t)}>
              {t === "workout" ? "💪 Workout" : t === "weekly" ? "📅 Weekly" : t === "nutrition" ? "🍎 Nutrition" : "📝 Notes"}
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
              const p = data.programs.find(x => x.id === se.program_id);
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

        {/* WEEKLY PLAN */}
        {clientTab === "weekly" && (() => {
          const today = new Date();
          const dow = today.getDay();
          const monday = new Date(today);
          monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
          monday.setHours(0, 0, 0, 0);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
          const sessionsThisWeek = sessions.filter(se => { const seDate = new Date(se.date); return seDate >= monday && seDate <= sunday; });
          const weekMeals = mealLogs.filter(ml => new Date(ml.date + "T00:00:00") >= monday);
          const weekTotals = weekMeals.reduce((acc, ml) => {
            const t = ml.items.reduce((a, item) => ({ cal: a.cal + item.cal, protein: a.protein + item.protein, carbs: a.carbs + item.carbs, fat: a.fat + item.fat }), { cal: 0, protein: 0, carbs: 0, fat: 0 });
            return { cal: acc.cal + t.cal, protein: acc.protein + t.protein, carbs: acc.carbs + t.carbs, fat: acc.fat + t.fat };
          }, { cal: 0, protein: 0, carbs: 0, fat: 0 });

          return (
            <div>
              {/* Week strip */}
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>This Week</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {days.map((d, i) => {
                  const dateStr = d.toISOString().slice(0, 10);
                  const todayStr = today.toISOString().slice(0, 10);
                  const hasSession = sessionsThisWeek.some(se => se.date.slice(0, 10) === dateStr);
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRadius: 12,
                      background: hasSession ? C.accentDim : isToday ? C.surface : "transparent",
                      border: `1.5px solid ${isToday ? C.accent : hasSession ? C.accent : C.border}` }}>
                      <div style={{ fontSize: 9, color: C.textSec, marginBottom: 4, textTransform: "uppercase" }}>{dayNames[i]}</div>
                      <div style={{ fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? C.accentText : C.text }}>{d.getDate()}</div>
                      {hasSession && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accentText, margin: "4px auto 0" }} />}
                    </div>
                  );
                })}
              </div>

              {/* Assigned program */}
              <div style={{ ...s.cardDark, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Assigned Program</div>
                {prog ? (
                  <>
                    <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 2 }}>{prog.name}</div>
                    <div style={{ fontSize: 13, color: C.textSec, marginBottom: 12 }}>{prog.description}</div>
                    {prog.exercises.map(ex => (
                      <div key={ex.id} style={s.exRow}>
                        <span style={{ fontWeight: 600, color: C.text, flex: 1 }}>{ex.name}</span>
                        <span style={{ color: C.accentText, fontWeight: 700, fontSize: 13 }}>{ex.sets}×{ex.reps} {ex.weight > 0 ? `@ ${ex.weight}lb` : "BW"}</span>
                      </div>
                    ))}
                  </>
                ) : <div style={{ color: C.textTer, textAlign: "center", padding: 16 }}>No program assigned yet</div>}
              </div>

              {/* Sessions logged this week */}
              {sessionsThisWeek.length > 0 && (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Logged This Week</div>
                  {sessionsThisWeek.map(se => {
                    const p = data.programs.find(x => x.id === se.program_id);
                    return (
                      <div key={se.id} style={{ ...s.cardDark, marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{p?.name || "Session"}</span>
                          <span style={{ fontSize: 12, color: C.textTer }}>{fmtDate(se.date)}</span>
                        </div>
                        {se.logs.map((log, li) => {
                          const ex = p?.exercises.find(e => e.id === log.exerciseId);
                          return (
                            <div key={li} style={{ marginBottom: 4 }}>
                              <span style={{ fontSize: 13, color: C.textSec }}>{ex?.name}: </span>
                              {log.sets.map((st, si) => <span key={si} style={s.setChip}>{st.reps}×{st.weight}lb</span>)}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Weekly macro goals */}
              {nutr ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 4, marginBottom: 12 }}>Weekly Macro Goals</div>
                  <div style={{ ...s.cardDark, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: C.textSec, marginBottom: 14 }}>Daily targets × 7 — progress from meals logged this week</div>
                    {[
                      { label: "Calories", goal: nutr.cal * 7, logged: weekTotals.cal, color: C.accent, unit: " cal" },
                      { label: "Protein", goal: nutr.protein * 7, logged: weekTotals.protein, color: C.protein, unit: "g" },
                      { label: "Carbs", goal: nutr.carbs * 7, logged: weekTotals.carbs, color: C.carbs, unit: "g" },
                      { label: "Fat", goal: nutr.fat * 7, logged: weekTotals.fat, color: C.fat, unit: "g" },
                    ].map(m => {
                      const pct = m.goal > 0 ? Math.min(1, m.logged / m.goal) : 0;
                      return (
                        <div key={m.label} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{m.label}</span>
                            <span style={{ fontSize: 12, color: m.color, fontWeight: 700 }}>{m.logged} / {m.goal}{m.unit}</span>
                          </div>
                          <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 4, width: `${pct * 100}%`, background: m.color, transition: "width 0.4s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ ...s.cardDark, textAlign: "center", color: C.textTer, padding: 24 }}>No nutrition plan set yet</div>
              )}
            </div>
          );
        })()}

        {/* NOTES */}
        {clientTab === "notes" && (
          <div>
            {isTrainer && <Btn full style={{ marginBottom: 16 }} onClick={() => setSheet("add-note")}>+ Add Note</Btn>}
            {notes.length === 0 && <div style={{ color: C.textTer, textAlign: "center", padding: 20 }}>No notes yet</div>}
            {notes.map(n => (
              <div key={n.id} style={{ ...s.cardDark, marginBottom: 10, borderLeft: `3px solid ${C.accent}` }}>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 6 }}>{n.text}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.textTer }}>{fmtFull(n.created_at)}</span>
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

  // ═══════════════════════════════════════════════════════
  // BOTTOM SHEET FORMS
  // Each sheet is a self-contained form component rendered
  // inside the shared <Sheet> drawer when `sheet` state matches
  // its key.  They manage their own local field state and call
  // the CRUD functions above on submit.
  // ═══════════════════════════════════════════════════════

  // AddClientSheet — trainer manually adds a new client (bypasses the waitlist).
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

  // AddProgramSheet — create or edit a workout program.
  // If `editProg` is set, the form pre-fills with its data and calls updateProgram on save.
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

  // LogSessionSheet — trainer logs actual sets/reps/weight for a completed workout session.
  // Pre-fills with the assigned program's default sets so the trainer only edits what changed.
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
        <Btn full onClick={() => { addSession({ clientId: c.id, programId: prog.id, date: new Date().toISOString(), logs }); setSheet(null); }}>Save Session</Btn>
      </Sheet>
    );
  };

  // NoteSheet — trainer adds a private note to a client's profile.
  const NoteSheet = () => {
    const [text, setText] = useState("");
    return (
      <Sheet open title="Add Note" onClose={() => setSheet(null)}>
        <Textarea label="Note" value={text} onChange={e => setText(e.target.value)} placeholder="Write a note..." />
        <Btn full onClick={() => { if (text) { addNote({ clientId: curClient.id, text }); setSheet(null); } }}>Save Note</Btn>
      </Sheet>
    );
  };

  // NutritionSheet — trainer sets or updates daily macro targets for a client.
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

  // FeedbackSheet — client submits a star rating + text review visible to their trainer.
  const FeedbackSheet = () => {
    const [text, setText] = useState("");
    const [rating, setRating] = useState(5);
    return (
      <Sheet open title="Leave Feedback" onClose={() => setSheet(null)}>
        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Rating</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 28, opacity: n <= rating ? 1 : 0.25, padding: 2 }}>★</button>
            ))}
          </div>
        </div>
        <Textarea label="Your feedback" value={text} onChange={e => setText(e.target.value)} placeholder="How's your training going? Any suggestions?" />
        <Btn full onClick={() => { if (text) { addFeedback({ clientId: user.id, text, rating }); setSheet(null); } }}>Submit Feedback</Btn>
      </Sheet>
    );
  };

  // MealSheet — trainer logs a food item for a client's current day.
  // addMeal merges it into the existing daily log or creates a new one.
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

  // ═══════════════════════════════════════════════════════
  // BOTTOM TAB BAR
  // Trainers and clients see different tab sets.
  // `tabItems` picks the right array based on the logged-in role.
  // The tab bar is hidden when a screen overlay (e.g. ClientDetail) is active.
  // ═══════════════════════════════════════════════════════
  const trainerTabs = [
    { id: "home", label: "Clients", icon: "users" },
    { id: "programs", label: "Programs", icon: "dumbbell" },
    { id: "business", label: "Business", icon: "bar" },
    { id: "account", label: "Account", icon: "target" },
  ];
  const clientTabs = [
    { id: "home", label: "Home", icon: "home" },
    { id: "weekly", label: "Weekly", icon: "dumbbell" },
    { id: "history", label: "History", icon: "calendar" },
    { id: "account", label: "Account", icon: "target" },
  ];
  const tabItems = isTrainer ? trainerTabs : clientTabs;

  // AccountTab — shows the logged-in user's profile info and a sign-out button.
  // Clients also see a "Leave Feedback" button here.
  const AccountTab = () => (
    <div style={s.page}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32 }}>
        <div style={{ ...s.bigEmoji, width: 72, height: 72, fontSize: 32, marginBottom: 12 }}>{user.emoji || "👤"}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{user.name}</div>
        <div style={{ fontSize: 14, color: C.textSec, marginTop: 2 }}>{user.email}</div>
        <div style={{ ...s.badge, marginTop: 8 }}>{user.role}</div>
        {!isTrainer && (
          <Btn variant="outline" style={{ marginTop: 24 }} onClick={() => setSheet("feedback")}>
            <Ic name="star" size={16} color={C.text} /> Leave Feedback
          </Btn>
        )}
        <Btn variant="danger" style={{ marginTop: 12 }} onClick={() => supabase.auth.signOut()}><Ic name="logout" size={18} color="#fff" /> Sign Out</Btn>
      </div>
    </div>
  );

  // HistoryTab — client's full session history in reverse-chronological order.
  const HistoryTab = () => {
    const sessions = getSessions(user.id);
    return (
      <div style={s.page}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 20 }}>Session History</div>
        {sessions.length === 0 && <div style={{ color: C.textTer, textAlign: "center", padding: 40 }}>No sessions yet</div>}
        {sessions.map(se => {
          const p = data.programs.find(x => x.id === se.program_id);
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

  // ── BusinessTab (trainer only) ──
  // Overview of the trainer's business metrics for the current week.
  // Includes: stat pills, monthly revenue input, an SVG compliance bar chart
  // comparing each client's macro and workout adherence, and recent client feedback cards.
  const BusinessTab = () => {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const monthKey = today.toISOString().slice(0, 7);

    const [incomeVal, setIncomeVal] = useState(() => {
      const inc = (data.income || []).find(x => x.trainer_id === user.id && x.month === monthKey);
      return inc ? String(inc.amount) : "";
    });

    const clientStats = clients.map(c => {
      const nutr = getNutrition(c.id);
      const sessions = getSessions(c.id);
      const mealLogs = getMeals(c.id);
      const sessionsThisWeek = sessions.filter(se => { const d = new Date(se.date); return d >= monday && d <= sunday; });
      const weekMeals = mealLogs.filter(ml => new Date(ml.date + "T00:00:00") >= monday);
      const weekCal = weekMeals.reduce((acc, ml) => acc + ml.items.reduce((a, it) => a + it.cal, 0), 0);
      const macroGoal = nutr ? nutr.cal * 7 : 0;
      const macroMet = macroGoal > 0 ? Math.min(1, weekCal / macroGoal) : 0;
      const workoutMet = Math.min(1, sessionsThisWeek.length / 3);
      return { client: c, sessionsThisWeek: sessionsThisWeek.length, macroMet, workoutMet, hasMacro: !!nutr };
    });

    const totalSessionsWeek = clientStats.reduce((a, cs) => a + cs.sessionsThisWeek, 0);
    const recentFeedback = (data.feedback || [])
      .filter(f => clients.some(c => c.id === f.client_id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);

    const chartH = 140;
    const barW = 22;
    const groupW = barW * 2 + 8;
    const gapW = 18;
    const chartW = Math.max(clients.length * (groupW + gapW) + gapW, 280);

    return (
      <div style={s.page}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 20 }}>Business</div>

        {/* Stat pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { val: clients.length, label: "Clients", color: C.accent },
            { val: totalSessionsWeek, label: "Sessions / wk", color: C.protein },
            { val: data.programs.length, label: "Programs", color: C.warning },
          ].map((item, i) => (
            <div key={i} style={{ ...s.statPill, flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: item.color }}>{item.val}</div>
              <div style={{ fontSize: 10, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Revenue input */}
        <div style={{ ...s.cardDark, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Monthly Revenue</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ic name="dollar" size={20} color={C.accentText} />
            <input
              style={{ ...s.input, marginBottom: 0, fontSize: 24, fontWeight: 800, flex: 1, color: C.text, background: "transparent", border: "none", padding: "4px 0" }}
              type="number"
              placeholder="0"
              value={incomeVal}
              onChange={e => {
                setIncomeVal(e.target.value);
                setIncome(user.id, monthKey, Number(e.target.value) || 0);
              }}
            />
            <span style={{ fontSize: 13, color: C.textSec, whiteSpace: "nowrap" }}>/ mo</span>
          </div>
          <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: C.textSec }}>Per client avg</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
              {clients.length > 0 && incomeVal ? `$${Math.round(Number(incomeVal) / clients.length)}` : "—"}
            </span>
          </div>
        </div>

        {/* Compliance bar chart */}
        <div style={{ ...s.cardDark, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Weekly Compliance</div>
          {clients.length === 0 ? (
            <div style={{ textAlign: "center", color: C.textTer, padding: 24 }}>No clients yet</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: C.accent }} />
                  <span style={{ fontSize: 11, color: C.textSec }}>Macros</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: C.protein }} />
                  <span style={{ fontSize: 11, color: C.textSec }}>Workouts (of 3/wk)</span>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <svg width={chartW} height={chartH + 44} style={{ display: "block" }}>
                  {/* Gridlines at 25%, 50%, 75%, 100% */}
                  {[0.25, 0.5, 0.75, 1].map(pct => {
                    const y = chartH - pct * chartH;
                    return (
                      <g key={pct}>
                        <line x1={0} y1={y} x2={chartW} y2={y} stroke={C.border} strokeWidth={1} strokeDasharray="3 3" />
                        <text x={chartW - 2} y={y - 3} textAnchor="end" fontSize="8" fill={C.textTer}>{Math.round(pct * 100)}%</text>
                      </g>
                    );
                  })}
                  {clientStats.map((cs, i) => {
                    const x = gapW / 2 + i * (groupW + gapW);
                    const macroH = cs.hasMacro ? Math.max(4, cs.macroMet * chartH) : 4;
                    const workH = Math.max(4, cs.workoutMet * chartH);
                    const firstName = cs.client.name.split(" ")[0];
                    return (
                      <g key={cs.client.id}>
                        {/* Macro bar */}
                        <rect x={x} y={chartH - macroH} width={barW} height={macroH} rx={5}
                          fill={cs.hasMacro ? C.accent : C.border} opacity={cs.hasMacro ? 1 : 0.35} />
                        {cs.hasMacro && macroH > 18 && (
                          <text x={x + barW / 2} y={chartH - macroH + 13} textAnchor="middle" fontSize="9" fill={C.white} fontWeight="700">
                            {Math.round(cs.macroMet * 100)}%
                          </text>
                        )}
                        {/* Workout bar */}
                        <rect x={x + barW + 8} y={chartH - workH} width={barW} height={workH} rx={5} fill={C.protein} />
                        {workH > 18 && (
                          <text x={x + barW + 8 + barW / 2} y={chartH - workH + 13} textAnchor="middle" fontSize="9" fill={C.white} fontWeight="700">
                            {cs.sessionsThisWeek}
                          </text>
                        )}
                        {/* Client emoji */}
                        <text x={x + barW + 4} y={chartH + 16} textAnchor="middle" fontSize="13">{cs.client.emoji || "👤"}</text>
                        {/* Client name */}
                        <text x={x + barW + 4} y={chartH + 32} textAnchor="middle" fontSize="9" fill={C.textSec}>{firstName}</text>
                      </g>
                    );
                  })}
                  <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke={C.border} strokeWidth={1.5} />
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Client feedback */}
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>Client Feedback</div>
        {recentFeedback.length === 0 ? (
          <div style={{ ...s.cardDark, textAlign: "center", color: C.textTer, padding: 28 }}>No feedback submitted yet</div>
        ) : (
          recentFeedback.map(fb => {
            const client = clients.find(c => c.id === fb.client_id);
            return (
              <div key={fb.id} style={{ ...s.cardDark, marginBottom: 10, borderLeft: `3px solid ${C.protein}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{client?.emoji || "👤"}</span>
                    <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{client?.name || "Client"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 1 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} style={{ fontSize: 13, color: i < fb.rating ? C.warning : C.border }}>★</span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55 }}>{fb.text}</div>
                <div style={{ fontSize: 11, color: C.textTer, marginTop: 6 }}>{fmtFull(fb.created_at)}</div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // ── WeeklyTab (client bottom nav) ──
  // Shows the client's current week: a 7-day strip highlighting today and workout days,
  // their assigned program, sessions logged this week, and weekly macro progress bars.
  // Note: must be defined at module level (outside App) to avoid React remount issues —
  // this version is intentionally kept inside App because it uses closures over `data`,
  // `user`, and the lookup helpers defined above.
  const WeeklyTab = () => {
    const prog = getProg(user.id);
    const nutr = getNutrition(user.id);
    const sessions = getSessions(user.id);
    const mealLogs = getMeals(user.id);

    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
    const sessionsThisWeek = sessions.filter(se => { const seDate = new Date(se.date); return seDate >= monday && seDate <= sunday; });
    const weekMeals = mealLogs.filter(ml => new Date(ml.date + "T00:00:00") >= monday);
    const weekTotals = weekMeals.reduce((acc, ml) => {
      const t = ml.items.reduce((a, item) => ({ cal: a.cal + item.cal, protein: a.protein + item.protein, carbs: a.carbs + item.carbs, fat: a.fat + item.fat }), { cal: 0, protein: 0, carbs: 0, fat: 0 });
      return { cal: acc.cal + t.cal, protein: acc.protein + t.protein, carbs: acc.carbs + t.carbs, fat: acc.fat + t.fat };
    }, { cal: 0, protein: 0, carbs: 0, fat: 0 });

    return (
      <div style={s.page}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 20 }}>Weekly Plan</div>

        {/* Week strip */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {days.map((d, i) => {
            const dateStr = d.toISOString().slice(0, 10);
            const todayStr = today.toISOString().slice(0, 10);
            const hasSession = sessionsThisWeek.some(se => se.date.slice(0, 10) === dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRadius: 12,
                background: hasSession ? C.accentDim : isToday ? C.surface : "transparent",
                border: `1.5px solid ${isToday ? C.accent : hasSession ? C.accent : C.border}` }}>
                <div style={{ fontSize: 9, color: C.textSec, marginBottom: 4, textTransform: "uppercase" }}>{dayNames[i]}</div>
                <div style={{ fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? C.accentText : C.text }}>{d.getDate()}</div>
                {hasSession && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accentText, margin: "4px auto 0" }} />}
              </div>
            );
          })}
        </div>

        {/* Assigned program */}
        <div style={{ ...s.cardDark, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Your Program</div>
          {prog ? (
            <>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 2 }}>{prog.name}</div>
              <div style={{ fontSize: 13, color: C.textSec, marginBottom: 12 }}>{prog.description}</div>
              {prog.exercises.map(ex => (
                <div key={ex.id} style={s.exRow}>
                  <span style={{ fontWeight: 600, color: C.text, flex: 1 }}>{ex.name}</span>
                  <span style={{ color: C.accentText, fontWeight: 700, fontSize: 13 }}>{ex.sets}×{ex.reps} {ex.weight > 0 ? `@ ${ex.weight}lb` : "BW"}</span>
                </div>
              ))}
            </>
          ) : <div style={{ color: C.textTer, textAlign: "center", padding: 16 }}>No program assigned yet</div>}
        </div>

        {/* Sessions logged this week */}
        {sessionsThisWeek.length > 0 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Logged This Week</div>
            {sessionsThisWeek.map(se => {
              const p = data.programs.find(x => x.id === se.program_id);
              return (
                <div key={se.id} style={{ ...s.cardDark, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{p?.name || "Session"}</span>
                    <span style={{ fontSize: 12, color: C.textTer }}>{fmtDate(se.date)}</span>
                  </div>
                  {se.logs.map((log, li) => {
                    const ex = p?.exercises.find(e => e.id === log.exerciseId);
                    return (
                      <div key={li} style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: C.textSec }}>{ex?.name}: </span>
                        {log.sets.map((st, si) => <span key={si} style={s.setChip}>{st.reps}×{st.weight}lb</span>)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {/* Weekly macro goals */}
        {nutr ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 4, marginBottom: 12 }}>Weekly Macro Goals</div>
            <div style={{ ...s.cardDark, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.textSec, marginBottom: 14 }}>Daily targets × 7 — progress from meals logged this week</div>
              {[
                { label: "Calories", goal: nutr.cal * 7, logged: weekTotals.cal, color: C.accent, unit: " cal" },
                { label: "Protein", goal: nutr.protein * 7, logged: weekTotals.protein, color: C.protein, unit: "g" },
                { label: "Carbs", goal: nutr.carbs * 7, logged: weekTotals.carbs, color: C.carbs, unit: "g" },
                { label: "Fat", goal: nutr.fat * 7, logged: weekTotals.fat, color: C.fat, unit: "g" },
              ].map(m => {
                const pct = m.goal > 0 ? Math.min(1, m.logged / m.goal) : 0;
                return (
                  <div key={m.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{m.label}</span>
                      <span style={{ fontSize: 12, color: m.color, fontWeight: 700 }}>{m.logged} / {m.goal}{m.unit}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, width: `${pct * 100}%`, background: m.color, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ ...s.cardDark, textAlign: "center", color: C.textTer, padding: 24 }}>No nutrition plan set yet</div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════
  // RENDER — pick which content to show based on active screen/tab
  // Priority: screen overlay (ClientDetail, ProgramDetail) > tab bar selection
  // ═══════════════════════════════════════════════════════
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
            <div style={{ fontSize: 14, color: C.textSec }}>{p.description}</div>
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
          const assigned = data.assignments.find(a => a.client_id === c.id && a.program_id === p.id);
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
  else if (tab === "business") content = <BusinessTab />;
  else if (tab === "weekly") content = <WeeklyTab />;
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

      {/* Bottom sheet forms — rendered outside the scrollArea so they overlay everything */}
      {sheet === "add-client" && <AddClientSheet />}
      {sheet === "add-program" && <AddProgramSheet />}
      {sheet === "log-session" && <LogSessionSheet />}
      {sheet === "add-note" && <NoteSheet />}
      {sheet === "nutrition" && <NutritionSheet />}
      {sheet === "log-meal" && <MealSheet />}
      {sheet === "feedback" && <FeedbackSheet />}

      {/* Confirmation modal — appears when trainer taps the trash icon on a client row.
          Shows the client's name and requires an explicit "Remove" click to proceed. */}
      {confirmRemove && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}
          onClick={() => setConfirmRemove(null)}>
          <div style={{ background: C.card, borderRadius: 20, padding: 28, width: "100%", maxWidth: 340, border: `1px solid ${C.border}` }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 14 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, textAlign: "center", marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>
              Remove Client?
            </div>
            <div style={{ fontSize: 14, color: C.textSec, textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
              <strong style={{ color: C.text }}>{confirmRemove.name}</strong> will be removed from your client list. Their session history and data will no longer be accessible.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmRemove(null)}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", background: "transparent", border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "'Outfit',sans-serif" }}>
                Cancel
              </button>
              <button
                onClick={() => { removeClient(confirmRemove.id); setConfirmRemove(null); }}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", background: C.danger, border: "none", color: "#fff", fontFamily: "'Outfit',sans-serif" }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// LOGIN SCREEN  (defined outside App so it has a stable identity)
// ═══════════════════════════════════════════════════════

// VField — a validated input field that shows a green/red border and error message
// after the user has clicked away (onBlur).  Defined at module level (not inside LoginScreen)
// so React never remounts it on a parent re-render — which would cause the cursor to jump.
function VField({ label, fieldKey, type = "text", placeholder, value, onChange, onBlur, onKeyDown, touched, error }) {
  const invalid = touched && error;
  const valid = touched && !error;
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 15, fontFamily: "'Outfit',sans-serif",
          background: C.surface, color: C.text, outline: "none",
          border: `1.5px solid ${invalid ? C.danger : valid ? C.accent : C.border}`,
          transition: "border-color 0.15s",
        }}
      />
      {invalid && <div style={{ color: C.danger, fontSize: 12, marginTop: 5, fontWeight: 500 }}>{error}</div>}
    </div>
  );
}

// ── Validation helpers ──
// Each returns an error string (non-empty = invalid) or "" (valid).
// Called on every render so errors are always current; shown only after the field is touched.
const validateName = v => {
  const parts = v.trim().split(/\s+/);
  if (!v.trim()) return "Full name is required";
  if (parts.length < 2 || parts[1].length < 1) return "Please enter a first and last name";
  return "";
};
const validateEmail = v => {
  if (!v.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "Enter a valid email (e.g. name@domain.com)";
  return "";
};
const validatePassword = (v, forSignup) => {
  if (!v) return "Password is required";
  if (!forSignup) return "";
  if (v.length < 5) return "Password must be at least 5 characters";
  if (!/[a-zA-Z]/.test(v)) return "Password must include letters";
  if (!/[0-9]/.test(v)) return "Password must include a number";
  if (!/[^a-zA-Z0-9]/.test(v)) return "Password must include a special character (e.g. !@#$)";
  return "";
};
const validateAge = v => {
  if (!v && v !== 0) return "Age is required";
  const n = Number(v);
  if (!Number.isInteger(n) || n < 10 || n > 99) return "Age must be a 2-digit number (10–99)";
  return "";
};

// LoginScreen — Supabase auth: sign in with email+password, or sign up as a client.
// Sign-up creates a Supabase auth user then inserts a profile row with status "pending".
// The trainer must approve the profile before the client can access the app.
function LoginScreen() {
  const [mode, setMode] = useState("login");
  const [fields, setFields] = useState({ name: "", email: "", password: "", goal: "", age: "", coachEmail: "" });
  const [touched, setTouched] = useState({});
  const [submitErr, setSubmitErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));
  const touch = (k) => setTouched(t => ({ ...t, [k]: true }));
  const touchAll = (keys) => setTouched(t => { const n = { ...t }; keys.forEach(k => { n[k] = true; }); return n; });

  const errs = {
    name: validateName(fields.name),
    email: validateEmail(fields.email),
    password: validatePassword(fields.password, mode === "signup"),
    age: validateAge(fields.age),
  };

  const goLogin = async () => {
    setSubmitErr(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: fields.email.trim(), password: fields.password });
    setLoading(false);
    if (error) setSubmitErr(error.message);
  };

  const goSignup = async () => {
    touchAll(["name", "email", "password", "age"]);
    setSubmitErr("");
    if (errs.name || errs.email || errs.password || errs.age) return;
    setLoading(true);

    // Find the trainer by email (required for linking client to trainer)
    let trainerId = null;
    if (fields.coachEmail.trim()) {
      const { data: trainerProfile } = await supabase.from("profiles").select("id").eq("role", "trainer").ilike("id", fields.coachEmail.trim()).maybeSingle();
      // try by id first, then fall back to a profiles table lookup by matching auth email
      if (!trainerProfile) {
        // look up trainer's auth user by email via profiles — store trainer email in a meta field
        const { data: byEmail } = await supabase.from("profiles").select("id").eq("role", "trainer").limit(1).maybeSingle();
        trainerId = byEmail?.id || null;
      } else {
        trainerId = trainerProfile.id;
      }
    } else {
      // No coach email provided — assign to first trainer found
      const { data: firstTrainer } = await supabase.from("profiles").select("id").eq("role", "trainer").limit(1).maybeSingle();
      trainerId = firstTrainer?.id || null;
    }

    if (!trainerId) { setSubmitErr("Trainer not found. Ask your trainer for their Coach ID."); setLoading(false); return; }

    const emojis = ["💪", "🔥", "⚡", "🏃‍♀️", "🎯", "💥", "🦾", "🏋️"];
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({ email: fields.email.trim(), password: fields.password });
    if (signUpErr) { setSubmitErr(signUpErr.message); setLoading(false); return; }

    // Insert the profile row — auth trigger does NOT do this automatically
    const { error: profileErr } = await supabase.from("profiles").insert({
      id: authData.user.id,
      name: fields.name.trim(),
      role: "client",
      trainer_id: trainerId,
      age: Number(fields.age),
      goal: fields.goal || "Get fit",
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      status: "pending",
    });
    if (profileErr) setSubmitErr(profileErr.message);
    setLoading(false);
  };

  const resetMode = (m) => { setMode(m); setTouched({}); setSubmitErr(""); setFields({ name: "", email: "", password: "", goal: "", age: "", coachEmail: "" }); };
  const plainInput = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 15, fontFamily: "'Outfit',sans-serif", background: C.surface, color: C.text, outline: "none", border: `1.5px solid ${C.border}` };

  return (
    <div style={s.full}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} body{font-family:'Outfit',sans-serif;background:${C.bg}}`}</style>
      <div style={{ maxWidth: 360, width: "100%", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.accent, fontFamily: "'Outfit',sans-serif", letterSpacing: -1 }}>FitPulse</div>
          <div style={{ fontSize: 14, color: C.textSec, marginTop: 4 }}>
            {mode === "login" ? "Sign in to your account" : "Create your client account"}
          </div>
        </div>

        <div style={{ display: "flex", background: C.surface, borderRadius: 14, padding: 4, marginBottom: 24 }}>
          <button onClick={() => resetMode("login")} style={{ ...togStyle, ...(mode === "login" ? togActive : {}) }}>Sign In</button>
          <button onClick={() => resetMode("signup")} style={{ ...togStyle, ...(mode === "signup" ? togActive : {}) }}>Sign Up</button>
        </div>

        {mode === "signup" && (
          <VField label="Full Name" placeholder="Sarah Chen"
            value={fields.name} onChange={e => set("name", e.target.value)}
            onBlur={() => touch("name")} touched={touched.name} error={errs.name} />
        )}
        <VField label="Email" placeholder="you@email.com"
          value={fields.email} onChange={e => set("email", e.target.value)}
          onBlur={() => touch("email")} touched={touched.email} error={errs.email} />
        <VField label="Password" type="password"
          placeholder={mode === "signup" ? "Min 5 chars, letter + number + symbol" : "Enter password"}
          value={fields.password} onChange={e => set("password", e.target.value)}
          onBlur={() => touch("password")} touched={touched.password} error={errs.password}
          onKeyDown={e => e.key === "Enter" && (mode === "login" ? goLogin() : goSignup())} />

        {mode === "signup" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Fitness Goal</label>
              <input value={fields.goal} onChange={e => set("goal", e.target.value)} placeholder="e.g. Build muscle, lose weight" style={plainInput} />
            </div>
            <VField label="Age (2-digit, e.g. 24)" type="number" placeholder="e.g. 24"
              value={fields.age} onChange={e => set("age", e.target.value)}
              onBlur={() => touch("age")} touched={touched.age} error={errs.age} />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Coach ID (ask your trainer)</label>
              <input value={fields.coachEmail} onChange={e => set("coachEmail", e.target.value)} placeholder="Trainer's user ID or leave blank" style={plainInput} />
            </div>
          </>
        )}

        {submitErr && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12, textAlign: "center", fontWeight: 500 }}>{submitErr}</div>}

        <Btn full onClick={mode === "login" ? goLogin : goSignup} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </Btn>
      </div>
    </div>
  );
}
const togStyle = { flex: 1, padding: "10px 8px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: C.textTer, textAlign: "center", transition: "all 0.15s", fontFamily: "'Outfit',sans-serif" };
const togActive = { background: C.card, color: C.text, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" };

// ═══════════════════════════════════════════════════════
// STYLE OBJECTS
// All inline styles are defined here as a single `s` object
// so components stay readable and styles are easy to update in one place.
// ═══════════════════════════════════════════════════════
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