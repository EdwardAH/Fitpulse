import { useState, useEffect, useMemo } from "react";

const C = {
  bg: "#f5f0ea", surface: "#ede8e0", card: "#e8e2d9",
  accent: "#8db87a", accentDim: "rgba(141,184,122,0.18)", accentText: "#5a8c45",
  text: "#3a3228", textSec: "#7a6e62", textTer: "#a89d91",
  border: "#cdc5ba", danger: "#c0524a", warning: "#c98a2e",
  protein: "#6b8fbe", carbs: "#c98a2e", fat: "#c0697a",
  white: "#faf7f3", sidebar: "#e0d9d0",
};

function load(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } }
const fmtDate = (iso) => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
const fmtShort = (iso) => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); };

function Ic({ name, size = 20, color = "currentColor" }) {
  const paths = {
    users: <><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></>,
    dumbbell: <><rect x="2" y="10" width="4" height="4" rx="1"/><rect x="18" y="10" width="4" height="4" rx="1"/><rect x="6" y="8" width="3" height="8" rx="1"/><rect x="15" y="8" width="3" height="8" rx="1"/><line x1="9" y1="12" x2="15" y2="12" strokeWidth="2.5"/></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function MacroBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value} / {max}</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: C.border, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 4, width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

const SEED = {
  users: [
    { id: "t1", name: "Coach Alex", email: "alex@fitpro.com", role: "trainer", pin: "1234", status: "active" },
    { id: "c1", name: "Sarah Chen", email: "sarah@mail.com", role: "client", trainerId: "t1", pin: "0000", age: 28, goal: "Build lean muscle", emoji: "\u{1F4AA}", status: "active" },
    { id: "c2", name: "Marcus J.", email: "marcus@mail.com", role: "client", trainerId: "t1", pin: "0000", age: 34, goal: "Lose 20 lbs", emoji: "\u{1F525}", status: "active" },
    { id: "c3", name: "Priya Patel", email: "priya@mail.com", role: "client", trainerId: "t1", pin: "0000", age: 25, goal: "Marathon prep", emoji: "\u{1F3C3}\u200D\u2640\uFE0F", status: "active" },
  ],
  programs: [], assignments: [], sessions: [], nutrition: [], meals: [], notes: [], feedback: [], income: [],
};

export default function TrainerDashboard() {
  const [data, setData] = useState(SEED);
  const [trainer, setTrainer] = useState(null);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClient, setSelectedClient] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const refresh = () => { const d = load("fp2", null); if (d) setData(d); setLastRefresh(new Date()); };
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, []);

  const clients = useMemo(() =>
    trainer ? data.users.filter(u => u.role === "client" && u.status === "active" && u.trainerId === trainer.id) : [],
    [data.users, trainer]);
  const pendingClients = useMemo(() =>
    trainer ? data.users.filter(u => u.role === "client" && u.status === "pending" && u.trainerId === trainer.id) : [],
    [data.users, trainer]);

  const getProg = (cid) => { const a = data.assignments.find(x => x.clientId === cid); return a ? data.programs.find(p => p.id === a.programId) : null; };
  const getSessions = (cid) => data.sessions.filter(x => x.clientId === cid).sort((a, b) => new Date(b.date) - new Date(a.date));
  const getNutrition = (cid) => data.nutrition.find(x => x.clientId === cid);
  const getMeals = (cid) => data.meals.filter(x => x.clientId === cid).sort((a, b) => b.date.localeCompare(a.date));
  const getNotes = (cid) => data.notes.filter(x => x.clientId === cid).sort((a, b) => new Date(b.at) - new Date(a.at));
  const getFeedback = () => (data.feedback || []).filter(f => clients.some(c => c.id === f.clientId)).sort((a, b) => new Date(b.at) - new Date(a.at));

  const getWeekBounds = () => {
    const today = new Date(); const dow = today.getDay();
    const monday = new Date(today); monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1)); monday.setHours(0,0,0,0);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23,59,59,999);
    return { monday, sunday };
  };

  const doLogin = () => {
    const u = data.users.find(u => u.role === "trainer" && u.email === email && u.pin === pin);
    if (u) { setTrainer(u); setLoginErr(""); } else setLoginErr("Invalid trainer credentials");
  };

  const card = { background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` };
  const th = { fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.8, padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}` };
  const td = { padding: "13px 14px", fontSize: 14, color: C.text, borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" };
  const pill = (color) => ({ display: "inline-block", background: color + "22", color, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: "3px 9px" });
  const badge = (color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + "22", color });
  const navBtn = (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", background: active ? C.accentDim : "transparent", borderLeft: active ? `3px solid ${C.accentText}` : "3px solid transparent", border: "none", cursor: "pointer", color: active ? C.accentText : C.textSec, fontWeight: active ? 700 : 500, fontSize: 14, width: "100%", textAlign: "left", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" });

  if (!trainer) {
    const inp = { width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 15, fontFamily: "'Outfit',sans-serif", background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, outline: "none", marginBottom: 14 };
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg, fontFamily: "'Outfit',sans-serif" }}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0}"}</style>
        <div style={{ width: 380, padding: "40px 36px", background: C.card, borderRadius: 24, border: `1px solid ${C.border}` }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.accentText, letterSpacing: -1, marginBottom: 6 }}>FitPulse</div>
            <div style={{ fontSize: 13, color: C.textSec }}>Trainer Dashboard</div>
          </div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="trainer@email.com" style={inp} />
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Password</label>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === "Enter" && doLogin()} style={{ ...inp, marginBottom: loginErr ? 6 : 20 }} />
          {loginErr && <div style={{ color: C.danger, fontSize: 13, marginBottom: 14, fontWeight: 500 }}>{loginErr}</div>}
          <button onClick={doLogin} style={{ width: "100%", padding: "13px 0", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", background: C.accent, border: "none", color: C.white, fontFamily: "'Outfit',sans-serif" }}>Sign In as Trainer</button>
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: C.textTer }}>Demo: alex@fitpro.com / 1234</div>
        </div>
      </div>
    );
  }

  const Overview = () => {
    const { monday, sunday } = getWeekBounds();
    const totalSessions = data.sessions.filter(s => clients.some(c => c.id === s.clientId)).length;
    const sessThisWeek = data.sessions.filter(s => clients.some(c => c.id === s.clientId) && new Date(s.date) >= monday && new Date(s.date) <= sunday).length;
    const monthKey = new Date().toISOString().slice(0, 7);
    const income = (data.income || []).find(x => x.trainerId === trainer.id && x.month === monthKey);
    const feedback = getFeedback();
    const avgRating = feedback.length > 0 ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1) : null;
    const clientStats = clients.map(c => {
      const nutr = getNutrition(c.id);
      const weekMeals = getMeals(c.id).filter(ml => new Date(ml.date + "T00:00:00") >= monday);
      const weekCal = weekMeals.reduce((acc, ml) => acc + ml.items.reduce((a, it) => a + it.cal, 0), 0);
      const macroGoal = nutr ? nutr.cal * 7 : 0;
      const macroMet = macroGoal > 0 ? Math.min(1, weekCal / macroGoal) : null;
      const sessCount = getSessions(c.id).filter(se => new Date(se.date) >= monday && new Date(se.date) <= sunday).length;
      return { c, macroMet, sessCount, hasMacro: !!nutr };
    });
    const chartH = 150, barW = 22, groupW = barW * 2 + 10, gapW = 24;
    const chartW = Math.max(clients.length * (groupW + gapW) + gapW, 360);
    return (
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24, color: C.text }}>Overview</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Active Clients", val: clients.length, color: C.accentText, icon: "users" },
            { label: "Sessions This Week", val: sessThisWeek, color: C.protein, icon: "dumbbell" },
            { label: "Total Sessions", val: totalSessions, color: C.warning, icon: "calendar" },
            { label: "Avg Rating", val: avgRating ? avgRating + " \u2605" : "\u2014", color: C.fat, icon: "star" },
          ].map((s, i) => (
            <div key={i} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: C.textSec, fontWeight: 600 }}>{s.label}</div>
                <Ic name={s.icon} size={18} color={s.color} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "'Outfit',sans-serif" }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 22 }}>
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>Weekly Compliance</div>
            {clients.length === 0 ? <div style={{ color: C.textTer, textAlign: "center", padding: 32 }}>No clients yet</div> : (
              <div style={{ overflowX: "auto" }}>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  {[{ color: C.accent, label: "Macros" }, { color: C.protein, label: "Workouts (of 3)" }].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} /><span style={{ fontSize: 11, color: C.textSec }}>{l.label}</span></div>
                  ))}
                </div>
                <svg width={chartW} height={chartH + 44} style={{ display: "block" }}>
                  {[0.25, 0.5, 0.75, 1].map(pct => { const y = chartH - pct * chartH; return <g key={pct}><line x1={0} y1={y} x2={chartW} y2={y} stroke={C.border} strokeWidth={1} strokeDasharray="3 3" /><text x={chartW - 2} y={y - 3} textAnchor="end" fontSize="9" fill={C.textTer}>{Math.round(pct * 100)}%</text></g>; })}
                  {clientStats.map((cs, i) => {
                    const x = gapW / 2 + i * (groupW + gapW);
                    const macroH = cs.hasMacro ? Math.max(4, (cs.macroMet || 0) * chartH) : 4;
                    const workH = Math.max(4, Math.min(1, cs.sessCount / 3) * chartH);
                    return (
                      <g key={cs.c.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedClient(cs.c); setActiveTab("clients"); }}>
                        <rect x={x} y={chartH - macroH} width={barW} height={macroH} rx={4} fill={cs.hasMacro ? C.accent : C.border} opacity={cs.hasMacro ? 1 : 0.3} />
                        {cs.hasMacro && macroH > 16 && <text x={x + barW / 2} y={chartH - macroH + 13} textAnchor="middle" fontSize="9" fill={C.white} fontWeight="700">{Math.round((cs.macroMet || 0) * 100)}%</text>}
                        <rect x={x + barW + 8} y={chartH - workH} width={barW} height={workH} rx={4} fill={C.protein} />
                        {workH > 16 && <text x={x + barW + 8 + barW / 2} y={chartH - workH + 13} textAnchor="middle" fontSize="9" fill={C.white} fontWeight="700">{cs.sessCount}</text>}
                        <text x={x + barW + 4} y={chartH + 16} textAnchor="middle" fontSize="14">{cs.c.emoji || "?"}</text>
                        <text x={x + barW + 4} y={chartH + 32} textAnchor="middle" fontSize="10" fill={C.textSec}>{cs.c.name.split(" ")[0]}</text>
                      </g>
                    );
                  })}
                  <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke={C.border} strokeWidth={1.5} />
                </svg>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Monthly Revenue</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: C.accentText, fontFamily: "'Outfit',sans-serif" }}>{income?.amount ? "$" + income.amount.toLocaleString() : "\u2014"}</div>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{monthKey}{clients.length > 0 && income?.amount ? " \u00b7 $" + Math.round(income.amount / clients.length) + "/client" : ""}</div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Latest Feedback</div>
              {feedback.slice(0, 2).map(fb => { const cl = clients.find(c => c.id === fb.clientId); return (
                <div key={fb.id} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontWeight: 700, fontSize: 13 }}>{cl?.name}</span><span style={{ color: C.warning, fontSize: 12 }}>{"\u2605".repeat(fb.rating)}</span></div>
                  <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{fb.text.slice(0, 80)}{fb.text.length > 80 ? "\u2026" : ""}</div>
                </div>
              ); })}
              {feedback.length === 0 && <div style={{ color: C.textTer, fontSize: 13 }}>No feedback yet</div>}
            </div>
          </div>
        </div>
        {pendingClients.length > 0 && (
          <div style={{ ...card, borderLeft: `4px solid ${C.warning}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.warning, marginBottom: 6 }}>Pending approval: {pendingClients.length}</div>
            <div style={{ fontSize: 13, color: C.textSec }}>{pendingClients.map(c => c.name).join(", ")} — approve in the FitPulse mobile app.</div>
          </div>
        )}
      </div>
    );
  };

  const ClientsView = () => {
    const c = selectedClient;
    if (c) {
      const prog = getProg(c.id); const sessions = getSessions(c.id); const nutr = getNutrition(c.id);
      const meals = getMeals(c.id); const notes = getNotes(c.id); const { monday } = getWeekBounds();
      const wt = getMeals(c.id).filter(ml => new Date(ml.date + "T00:00:00") >= monday).reduce((acc, ml) => {
        const t = ml.items.reduce((a, it) => ({ cal: a.cal + it.cal, protein: a.protein + it.protein, carbs: a.carbs + it.carbs, fat: a.fat + it.fat }), { cal:0,protein:0,carbs:0,fat:0 });
        return { cal: acc.cal+t.cal, protein: acc.protein+t.protein, carbs: acc.carbs+t.carbs, fat: acc.fat+t.fat };
      }, { cal:0,protein:0,carbs:0,fat:0 });
      return (
        <div>
          <button onClick={() => setSelectedClient(null)} style={{ background:"none",border:"none",color:C.textSec,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:20,padding:0 }}>Back to Clients</button>
          <div style={{ display:"flex",alignItems:"center",gap:18,marginBottom:28 }}>
            <div style={{ width:64,height:64,borderRadius:18,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32 }}>{c.emoji||"?"}</div>
            <div><div style={{ fontSize:26,fontWeight:800,color:C.text,fontFamily:"'Outfit',sans-serif" }}>{c.name}</div><div style={{ fontSize:14,color:C.textSec,marginTop:3 }}>{c.goal}{c.age?" | Age "+c.age:""} | {c.email}</div></div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20 }}>
            <div style={card}>
              <div style={{ fontSize:13,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12 }}>Assigned Program</div>
              {prog ? (<><div style={{ fontSize:17,fontWeight:700,color:C.text,marginBottom:4 }}>{prog.name}</div><div style={{ fontSize:13,color:C.textSec,marginBottom:12 }}>{prog.desc}</div>{prog.exercises.map(ex => <div key={ex.id} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}` }}><span style={{ fontSize:13,color:C.text }}>{ex.name}</span><span style={{ fontSize:12,color:C.accentText,fontWeight:700 }}>{ex.sets}x{ex.reps} {ex.weight>0?"@ "+ex.weight+"lb":"BW"}</span></div>)}</>) : <div style={{ color:C.textTer,textAlign:"center",padding:24 }}>No program assigned</div>}
            </div>
            <div style={card}>
              <div style={{ fontSize:13,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12 }}>Weekly Macros</div>
              {nutr ? (<><MacroBar label={"Cal (goal "+nutr.cal*7+")"} value={wt.cal} max={nutr.cal*7} color={C.accent}/><MacroBar label={"Protein "+nutr.protein*7+"g"} value={wt.protein} max={nutr.protein*7} color={C.protein}/><MacroBar label={"Carbs "+nutr.carbs*7+"g"} value={wt.carbs} max={nutr.carbs*7} color={C.carbs}/><MacroBar label={"Fat "+nutr.fat*7+"g"} value={wt.fat} max={nutr.fat*7} color={C.fat}/></>) : <div style={{ color:C.textTer,textAlign:"center",padding:24 }}>No plan</div>}
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20 }}>
            <div style={card}>
              <div style={{ fontSize:13,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12 }}>Sessions ({sessions.length})</div>
              {sessions.length===0?<div style={{ color:C.textTer,fontSize:13 }}>None</div>:sessions.slice(0,5).map(se => { const p=data.programs.find(x=>x.id===se.programId); return <div key={se.id} style={{ paddingBottom:8,marginBottom:8,borderBottom:`1px solid ${C.border}` }}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}><span style={{ fontWeight:700,fontSize:13 }}>{p?.name||"Session"}</span><span style={{ fontSize:12,color:C.textTer }}>{fmtShort(se.date)}</span></div>{se.logs.map((log,li)=>{ const ex=p?.exercises.find(e=>e.id===log.exerciseId); return <div key={li} style={{ fontSize:12,color:C.textSec }}>{ex?.name}: {log.sets.map((st,si)=><span key={si} style={{ marginRight:4 }}>{st.reps}x{st.weight}lb</span>)}</div>; })}</div>; })}
            </div>
            <div style={card}>
              <div style={{ fontSize:13,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12 }}>Meals</div>
              {meals.length===0?<div style={{ color:C.textTer,fontSize:13 }}>None</div>:meals.slice(0,3).map(ml=>{ const tot=ml.items.reduce((a,m)=>({cal:a.cal+m.cal,p:a.p+m.protein}),{cal:0,p:0}); return <div key={ml.id} style={{ marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.border}` }}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}><span style={{ fontWeight:700,fontSize:13 }}>{fmtShort(ml.date+"T00:00:00Z")}</span><span style={{ fontSize:12,color:C.accentText,fontWeight:700 }}>{tot.cal} cal</span></div>{ml.items.map((m,i)=><div key={i} style={{ fontSize:12,color:C.textSec }}>{m.name}</div>)}</div>; })}
            </div>
            <div style={card}>
              <div style={{ fontSize:13,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12 }}>Notes</div>
              {notes.length===0?<div style={{ color:C.textTer,fontSize:13 }}>None</div>:notes.map(n=><div key={n.id} style={{ paddingBottom:8,marginBottom:8,borderBottom:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,paddingLeft:8 }}><div style={{ fontSize:13,color:C.text,lineHeight:1.5 }}>{n.text}</div><div style={{ fontSize:11,color:C.textTer,marginTop:3 }}>{fmtDate(n.at)}</div></div>)}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <h2 style={{ fontSize:26,fontWeight:800,marginBottom:24,color:C.text }}>Clients</h2>
        {clients.length===0?<div style={{ textAlign:"center",color:C.textTer,padding:48 }}>No active clients</div>:(
          <div style={card}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead><tr>{["Client","Goal","Age","Program","Sessions","Nutrition",""].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{clients.map(c=>{ const prog=getProg(c.id); const cnt=getSessions(c.id).length; const nutr=getNutrition(c.id); return (
                <tr key={c.id} style={{ cursor:"pointer" }} onClick={()=>setSelectedClient(c)} onMouseEnter={e=>e.currentTarget.style.background=C.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={td}><div style={{ display:"flex",alignItems:"center",gap:10 }}><span style={{ fontSize:22 }}>{c.emoji||"?"}</span><div><div style={{ fontWeight:700 }}>{c.name}</div><div style={{ fontSize:12,color:C.textSec }}>{c.email}</div></div></div></td>
                  <td style={td}><span style={{ fontSize:13,color:C.textSec }}>{c.goal}</span></td>
                  <td style={td}>{c.age||"\u2014"}</td>
                  <td style={td}>{prog?<span style={pill(C.accentText)}>{prog.name}</span>:<span style={{ color:C.textTer }}>None</span>}</td>
                  <td style={td}><span style={{ fontWeight:700,color:C.protein }}>{cnt}</span></td>
                  <td style={td}>{nutr?<span style={pill(C.accent)}>{nutr.cal} cal/day</span>:<span style={{ color:C.textTer }}>Not set</span>}</td>
                  <td style={td}><span style={{ color:C.accentText,fontSize:13,fontWeight:600 }}>View</span></td>
                </tr>
              ); })}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const ProgramsView = () => (
    <div>
      <h2 style={{ fontSize:26,fontWeight:800,marginBottom:24,color:C.text }}>Programs</h2>
      {data.programs.filter(p=>p.trainerId===trainer.id).length===0?<div style={{ textAlign:"center",color:C.textTer,padding:48 }}>No programs yet.</div>:(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16 }}>
          {data.programs.filter(p=>p.trainerId===trainer.id).map(p=>{ const assigned=clients.filter(c=>data.assignments.some(a=>a.clientId===c.id&&a.programId===p.id)); return (
            <div key={p.id} style={card}>
              <div style={{ fontSize:17,fontWeight:700,color:C.text,marginBottom:4 }}>{p.name}</div>
              <div style={{ fontSize:13,color:C.textSec,marginBottom:14 }}>{p.desc}</div>
              {p.exercises.map(ex=><div key={ex.id} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}` }}><span style={{ fontSize:13,color:C.text }}>{ex.name}</span><span style={{ fontSize:12,color:C.accentText,fontWeight:700 }}>{ex.sets}x{ex.reps} {ex.weight>0?ex.weight+"lb":"BW"}</span></div>)}
              {assigned.length>0&&<div style={{ marginTop:12 }}><div style={{ fontSize:11,color:C.textSec,marginBottom:6 }}>Assigned to</div><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{assigned.map(c=><span key={c.id} style={pill(C.accentText)}>{c.name.split(" ")[0]}</span>)}</div></div>}
            </div>
          ); })}
        </div>
      )}
    </div>
  );

  const FeedbackView = () => { const feedback=getFeedback(); const avg=feedback.length>0?(feedback.reduce((a,f)=>a+f.rating,0)/feedback.length).toFixed(1):null; return (
    <div>
      <h2 style={{ fontSize:26,fontWeight:800,marginBottom:8,color:C.text }}>Feedback</h2>
      {avg&&<div style={{ fontSize:14,color:C.textSec,marginBottom:24 }}>Avg: <strong style={{ color:C.warning }}>{avg} \u2605</strong> ({feedback.length} reviews)</div>}
      {feedback.length===0?<div style={{ textAlign:"center",color:C.textTer,padding:48 }}>No feedback yet</div>:(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16 }}>
          {feedback.map(fb=>{ const cl=clients.find(c=>c.id===fb.clientId); return (
            <div key={fb.id} style={{ ...card,borderLeft:`4px solid ${C.protein}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}><span style={{ fontSize:22 }}>{cl?.emoji||"?"}</span><span style={{ fontWeight:700,fontSize:15 }}>{cl?.name}</span></div>
                <span style={{ color:C.warning,fontSize:15 }}>{"\u2605".repeat(fb.rating)}{"\u2606".repeat(5-fb.rating)}</span>
              </div>
              <div style={{ fontSize:14,color:C.textSec,lineHeight:1.6,marginBottom:8 }}>{fb.text}</div>
              <div style={{ fontSize:12,color:C.textTer }}>{fmtDate(fb.at)}</div>
            </div>
          ); })}
        </div>
      )}
    </div>
  ); };

  const navItems = [
    { id:"overview",label:"Overview",icon:"target" },
    { id:"clients",label:"Clients",icon:"users" },
    { id:"programs",label:"Programs",icon:"dumbbell" },
    { id:"feedback",label:"Feedback",icon:"star" },
  ];

  return (
    <div style={{ display:"flex",minHeight:"100vh",fontFamily:"'Outfit',sans-serif",background:C.bg,color:C.text }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} body{background:"+C.bg+"}"}</style>
      <div style={{ width:220,background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto",flexShrink:0 }}>
        <div style={{ padding:"24px 20px 20px",borderBottom:`1px solid ${C.border}`,marginBottom:8 }}>
          <div style={{ fontSize:20,fontWeight:800,color:C.accentText }}>FitPulse</div>
          <div style={{ fontSize:11,color:C.textSec,marginTop:2 }}>Trainer Dashboard</div>
        </div>
        <div style={{ padding:"12px 20px 16px",borderBottom:`1px solid ${C.border}`,marginBottom:8 }}>
          <div style={{ fontSize:14,fontWeight:700,color:C.text }}>{trainer.name}</div>
          <div style={{ fontSize:12,color:C.textSec,marginTop:2 }}>{trainer.email}</div>
          <div style={{ fontSize:11,marginTop:6,color:C.accentText,fontWeight:600 }}>{clients.length} active client{clients.length!==1?"s":""}</div>
        </div>
        {navItems.map(item=>(
          <button key={item.id} style={navBtn(activeTab===item.id)} onClick={()=>{ setActiveTab(item.id); setSelectedClient(null); }}>
            <Ic name={item.icon} size={17} color={activeTab===item.id?C.accentText:C.textSec}/>{item.label}
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ padding:"12px 20px",fontSize:11,color:C.textTer,borderTop:`1px solid ${C.border}` }}>
          Syncs every 10s<br/>{lastRefresh.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
        </div>
        <button onClick={()=>{ setTrainer(null); setActiveTab("overview"); setSelectedClient(null); }} style={{ ...navBtn(false),color:C.danger }}>
          <Ic name="logout" size={17} color={C.danger}/> Sign Out
        </button>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:36 }}>
        {activeTab==="overview"&&<Overview/>}
        {activeTab==="clients"&&<ClientsView/>}
        {activeTab==="programs"&&<ProgramsView/>}
        {activeTab==="feedback"&&<FeedbackView/>}
      </div>
    </div>
  );
}
