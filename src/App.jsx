import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ── Arzt: Standard-Praxis-Aufgaben ───────────────────────────────────────────
const DEFAULT_ARZT_TASKS = [
  { id: "aufruf", label: "Patientenaufruf", color: "#4A90D9", icon: "🔔", countsPatient: true },
  { id: "vorbereitung", label: "Vorbereitung", color: "#8E44AD", icon: "💉", countsPatient: false },
  { id: "behandlung", label: "Patientenbehandlung", color: "#27AE60", icon: "🩺", countsPatient: false },
  { id: "nachbearbeitung", label: "Nachbearbeitung", color: "#F39C12", icon: "📋", countsPatient: false },
  { id: "unterbrechung", label: "Unterbrechung", color: "#E74C3C", icon: "📞", countsPatient: false },
  { id: "kollegial", label: "Koll. Gespräch", color: "#795548", icon: "🗣️", countsPatient: false },
  { id: "telefonat", label: "Telefonat", color: "#00ACC1", icon: "📱", countsPatient: false },
  { id: "papierkram", label: "Papierkram", color: "#607D8B", icon: "📄", countsPatient: false },
  { id: "pause", label: "Pause", color: "#95A5A6", icon: "☕", countsPatient: false },
  { id: "sonstiges", label: "Sonstiges", color: "#34495E", icon: "🔄", countsPatient: false },
];

// ── MFA: Standard-Praxis-Aufgaben ────────────────────────────────────────────
const DEFAULT_MFA_TASKS = [
  { id: "mfa_pataufruf", label: "Patientenaufruf", color: "#4A90D9", icon: "🔔", countsPatient: true },
  { id: "mfa_vorbereitung", label: "Vorbereitung", color: "#8E44AD", icon: "💉", countsPatient: false },
  { id: "mfa_telefon", label: "Telefon", color: "#00ACC1", icon: "📞", countsPatient: false },
  { id: "mfa_anmeldung", label: "Anmeldung", color: "#2ECC71", icon: "🖥️", countsPatient: false },
  { id: "mfa_concierge", label: "Concierge", color: "#E67E22", icon: "🧭", countsPatient: false },
  { id: "mfa_emails", label: "Emails", color: "#3498DB", icon: "📧", countsPatient: false },
  { id: "mfa_app", label: "App", color: "#9B59B6", icon: "📲", countsPatient: false },
  { id: "mfa_rezepte", label: "Rezepte", color: "#27AE60", icon: "💊", countsPatient: false },
  { id: "mfa_diktate", label: "Diktate", color: "#F39C12", icon: "🎙️", countsPatient: false },
  { id: "mfa_anfragen", label: "Anfragen", color: "#E74C3C", icon: "📬", countsPatient: false },
  { id: "mfa_labor", label: "Labor", color: "#1ABC9C", icon: "🧪", countsPatient: false },
  { id: "mfa_wunde", label: "Wunde", color: "#C0392B", icon: "🩹", countsPatient: false },
  { id: "mfa_impfung", label: "Impfung", color: "#16A085", icon: "💉", countsPatient: false },
  { id: "mfa_pause", label: "Kaffeepause", color: "#95A5A6", icon: "☕", countsPatient: false },
  { id: "mfa_kollegial", label: "Koll. Gespräch", color: "#795548", icon: "🗣️", countsPatient: false },
];

// ── Hausbesuch (für Arzt & MFA, nicht editierbar) ────────────────────────────
const HAUSBESUCH_TASKS = [
  { id: "hb_weg", label: "Fahrzeit", color: "#16A085", icon: "🚗", countsPatient: false },
  { id: "hb_besuch", label: "Hausbesuch", color: "#2980B9", icon: "🏠", countsPatient: true },
];

// ── Farbpalette für neue Aufgaben ────────────────────────────────────────────
const COLOR_PRESETS = [
  "#4A90D9", "#E74C3C", "#27AE60", "#F39C12", "#8E44AD", "#1ABC9C",
  "#E67E22", "#607D8B", "#16A085", "#2980B9", "#C0392B", "#795548",
  "#00ACC1", "#9B59B6", "#2ECC71", "#34495E",
];

// ── Emoji-Schnellauswahl ─────────────────────────────────────────────────────
const QUICK_ICONS = ["📌", "⭐", "❤️", "🔵", "🟢", "🟡", "🔶", "🏷️", "📍", "🔑", "💡", "🛠️", "📝", "🗂️", "🔔", "💬", "🚀", "⚡", "🎯", "🧩"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateId() {
  return "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function loadTasks(key, defaults) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaults; }
  catch { return defaults; }
}

// ── Shared Tab Button ────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, children, color }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: 13,
    background: active ? (color || "#1a2e44") : "white",
    color: active ? "white" : "#555",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)", transition: "all 0.15s"
  }}>{children}</button>
);

// ── Role Button (big, prominent) ─────────────────────────────────────────────
const RoleBtn = ({ active, onClick, children, accentColor }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: "12px 0", borderRadius: 10, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: 15,
    background: active ? accentColor : "#e8edf2",
    color: active ? "white" : "#777",
    boxShadow: active ? `0 3px 10px ${accentColor}55` : "none",
    transition: "all 0.2s",
  }}>{children}</button>
);

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {

  // ── Role & Mode & View ───────────────────────────────────────────────────
  const [role, setRole] = useState(() => localStorage.getItem("praxis_role") || "arzt");
  const [mode, setMode] = useState(() => localStorage.getItem("praxis_mode") || "praxis");
  const [view, setView] = useState("tracker"); // tracker | stats | settings

  // ── Customisable task lists (persisted) ──────────────────────────────────
  const [arztTasks, setArztTasks] = useState(() => loadTasks("praxis_arzt_tasks", DEFAULT_ARZT_TASKS));
  const [mfaTasks, setMfaTasks] = useState(() => loadTasks("praxis_mfa_tasks", DEFAULT_MFA_TASKS));

  useEffect(() => { localStorage.setItem("praxis_arzt_tasks", JSON.stringify(arztTasks)); }, [arztTasks]);
  useEffect(() => { localStorage.setItem("praxis_mfa_tasks", JSON.stringify(mfaTasks)); }, [mfaTasks]);

  // Derived: all tasks (for lookup)
  const allTasks = [...arztTasks, ...mfaTasks, ...HAUSBESUCH_TASKS];

  // ── Tracker state ────────────────────────────────────────────────────────
  const [activeTask, setActiveTask] = useState(() => localStorage.getItem("praxis_activeTask") || null);
  const [taskStart, setTaskStart] = useState(() => {
    const ts = localStorage.getItem("praxis_taskStart");
    return ts ? parseInt(ts, 10) : null;
  });
  const [log, setLog] = useState(() => JSON.parse(localStorage.getItem("praxis_log") || "[]"));
  const [totals, setTotals] = useState(() => JSON.parse(localStorage.getItem("praxis_totals") || "{}"));
  const [now, setNow] = useState(Date.now());

  // ── Patient counters ─────────────────────────────────────────────────────
  const [praxisPatients, setPraxisPatients] = useState(() => parseInt(localStorage.getItem("praxis_patients") || "0", 10));
  const [hbPatients, setHbPatients] = useState(() => parseInt(localStorage.getItem("hb_patients") || "0", 10));

  // ── Consent / Impressum ──────────────────────────────────────────────────
  const [showConsent, setShowConsent] = useState(() => !localStorage.getItem("praxis_consent"));
  const [showImpressum, setShowImpressum] = useState(false);

  // ── Settings page state ──────────────────────────────────────────────────
  const [settingsRole, setSettingsRole] = useState("arzt");
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("📌");
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0]);
  const [newCounts, setNewCounts] = useState(false);

  // ── localStorage sync ────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem("praxis_role", role); }, [role]);
  useEffect(() => { localStorage.setItem("praxis_mode", mode); }, [mode]);
  useEffect(() => { localStorage.setItem("praxis_log", JSON.stringify(log)); }, [log]);
  useEffect(() => { localStorage.setItem("praxis_totals", JSON.stringify(totals)); }, [totals]);
  useEffect(() => { localStorage.setItem("praxis_patients", praxisPatients.toString()); }, [praxisPatients]);
  useEffect(() => { localStorage.setItem("hb_patients", hbPatients.toString()); }, [hbPatients]);
  useEffect(() => {
    if (activeTask) localStorage.setItem("praxis_activeTask", activeTask);
    else localStorage.removeItem("praxis_activeTask");
  }, [activeTask]);
  useEffect(() => {
    if (taskStart) localStorage.setItem("praxis_taskStart", taskStart.toString());
    else localStorage.removeItem("praxis_taskStart");
  }, [taskStart]);

  // Ticker
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const acceptConsent = () => { localStorage.setItem("praxis_consent", "true"); setShowConsent(false); };

  // ── Derived values ───────────────────────────────────────────────────────
  const currentDuration = activeTask && taskStart ? now - taskStart : 0;
  const activePraxisTasks = role === "arzt" ? arztTasks : mfaTasks;
  const visibleTasks = mode === "praxis" ? activePraxisTasks : HAUSBESUCH_TASKS;
  const activeTaskInfo = allTasks.find(t => t.id === activeTask);

  // Accent colour depending on role
  const arztColor = "#1a2e44";
  const mfaColor = "#6B3FA0";
  const accent = role === "arzt" ? arztColor : mfaColor;

  // ── Tracker logic ────────────────────────────────────────────────────────
  const stopCurrent = (timestamp) => {
    if (!activeTask || !taskStart) return;
    const duration = timestamp - taskStart;
    setLog(prev => [...prev, { task: activeTask, start: taskStart, end: timestamp, duration, mode, role }]);
    setTotals(prev => ({ ...prev, [activeTask]: (prev[activeTask] || 0) + duration }));
  };

  const handleTask = (taskId) => {
    const ts = Date.now();
    const task = allTasks.find(t => t.id === taskId);
    stopCurrent(ts);
    if (activeTask === taskId) { setActiveTask(null); setTaskStart(null); }
    else {
      if (task?.countsPatient) {
        if (mode === "praxis") setPraxisPatients(p => p + 1);
        else setHbPatients(p => p + 1);
      }
      setActiveTask(taskId);
      setTaskStart(ts);
    }
  };

  const handleStop = () => { stopCurrent(Date.now()); setActiveTask(null); setTaskStart(null); };

  const reset = () => {
    handleStop(); setLog([]); setTotals({}); setPraxisPatients(0); setHbPatients(0);
  };

  const exportCSV = () => {
    const rows = [["Rolle", "Modus", "Aufgabe", "Start", "Ende", "Dauer (s)"]];
    log.forEach(e => {
      const task = allTasks.find(t => t.id === e.task);
      rows.push([
        e.role === "arzt" ? "Arzt" : "MFA",
        e.mode === "praxis" ? "Praxis" : "Hausbesuch",
        task?.label || e.task,
        formatTime(e.start), formatTime(e.end),
        Math.round(e.duration / 1000)
      ]);
    });
    rows.push([], ["=== Zusammenfassung ==="], ["Praxis-Patienten", praxisPatients], ["Hausbesuch-Patienten", hbPatients]);
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zeittracker_${new Date().toLocaleDateString("de-DE").replace(/\./g, "-")}.csv`;
    a.click();
  };

  // ── Settings logic ───────────────────────────────────────────────────────
  const editTasks = settingsRole === "arzt" ? arztTasks : mfaTasks;
  const setEditTasks = settingsRole === "arzt" ? setArztTasks : setMfaTasks;

  const addTask = () => {
    if (!newLabel.trim()) return;
    const task = { id: generateId(), label: newLabel.trim(), icon: newIcon, color: newColor, countsPatient: newCounts };
    setEditTasks(prev => [...prev, task]);
    setNewLabel(""); setNewIcon("📌"); setNewCounts(false);
  };

  const deleteTask = (taskId) => {
    if (activeTask === taskId) { stopCurrent(Date.now()); setActiveTask(null); setTaskStart(null); }
    setEditTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const resetToDefaults = () => {
    if (!window.confirm("Alle Anpassungen für diese Rolle zurücksetzen? Eigene Kategorien gehen verloren.")) return;
    if (settingsRole === "arzt") setArztTasks(DEFAULT_ARZT_TASKS);
    else setMfaTasks(DEFAULT_MFA_TASKS);
  };

  // ── Stats data ───────────────────────────────────────────────────────────
  const praxisTotalsData = activePraxisTasks.map(t => ({
    name: t.label, color: t.color,
    value: Math.round(((totals[t.id] || 0) + (activeTask === t.id ? currentDuration : 0)) / 1000)
  })).filter(d => d.value > 0);

  const hbTotalsData = HAUSBESUCH_TASKS.map(t => ({
    name: t.label, color: t.color,
    value: Math.round(((totals[t.id] || 0) + (activeTask === t.id ? currentDuration : 0)) / 1000)
  })).filter(d => d.value > 0);

  const totalPraxisMs = activePraxisTasks.reduce((a, t) =>
    a + (totals[t.id] || 0) + (activeTask === t.id ? currentDuration : 0), 0);
  const totalHbMs = HAUSBESUCH_TASKS.reduce((a, t) =>
    a + (totals[t.id] || 0) + (activeTask === t.id ? currentDuration : 0), 0);
  const avgPraxis = praxisPatients > 0 ? totalPraxisMs / praxisPatients : 0;
  const avgHb = hbPatients > 0 ? totalHbMs / hbPatients : 0;

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", padding: 16, background: "#f0f2f5", minHeight: "100vh" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: accent, color: "white", borderRadius: 12, padding: "14px 18px", marginBottom: 14, transition: "background 0.3s" }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🏥 Praxis Zeit-Tracker</h1>
        <p style={{ margin: "3px 0 0", fontSize: 12, opacity: 0.65 }}>
          {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Rolle ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, background: "white", borderRadius: 10, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <RoleBtn active={role === "arzt"} onClick={() => setRole("arzt")} accentColor={arztColor}>👨‍⚕️ Arzt</RoleBtn>
        <RoleBtn active={role === "mfa"} onClick={() => setRole("mfa")} accentColor={mfaColor} >👩‍⚕️ MFA</RoleBtn>
      </div>

      {/* ── Modus (nur im Tracker/Stats sichtbar) ──────────────────────── */}
      {view !== "settings" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, background: "white", borderRadius: 10, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <TabBtn active={mode === "praxis"} onClick={() => setMode("praxis")} color={accent}>🏥 Praxis</TabBtn>
          <TabBtn active={mode === "hausbesuch"} onClick={() => setMode("hausbesuch")} color={accent}>🚗 Hausbesuch</TabBtn>
        </div>
      )}

      {/* ── View Navigation ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <TabBtn active={view === "tracker"} onClick={() => setView("tracker")} color={accent}>⏱ Tracker</TabBtn>
        <TabBtn active={view === "stats"} onClick={() => setView("stats")} color={accent}>📊 Statistik</TabBtn>
        <TabBtn active={view === "settings"} onClick={() => setView("settings")} color={accent}>⚙️ Einstellungen</TabBtn>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TRACKER VIEW
      ══════════════════════════════════════════════════════════════════ */}
      {view === "tracker" && (
        <>
          {/* Active indicator */}
          <div style={{ background: "white", borderRadius: 12, padding: 14, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", textAlign: "center" }}>
            {activeTask ? (
              <>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>Aktive Aufgabe</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: activeTaskInfo?.color }}>
                  {activeTaskInfo?.icon} {activeTaskInfo?.label}
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>
                  {formatDuration(currentDuration)}
                </div>
              </>
            ) : (
              <div style={{ color: "#bbb", fontSize: 14, padding: "4px 0" }}>⏸ Keine aktive Aufgabe</div>
            )}
          </div>

          {/* Patient counter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {mode === "praxis" ? (
              <div style={{ flex: 1, background: "#4A90D920", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#4A90D9", fontWeight: 600 }}>PATIENTEN HEUTE</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#4A90D9" }}>{praxisPatients}</div>
                {avgPraxis > 0 && <div style={{ fontSize: 11, color: "#888" }}>Ø {formatDuration(avgPraxis)} / Pat.</div>}
              </div>
            ) : (
              <>
                <div style={{ flex: 1, background: "#2980B920", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#2980B9", fontWeight: 600 }}>HAUSBESUCHE</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#2980B9" }}>{hbPatients}</div>
                  {avgHb > 0 && <div style={{ fontSize: 11, color: "#888" }}>Ø {formatDuration(avgHb)} / Pat.</div>}
                </div>
                <div style={{ flex: 1, background: "#16A08520", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#16A085", fontWeight: 600 }}>FAHRZEIT GESAMT</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#16A085", marginTop: 4 }}>
                    {formatDuration((totals["hb_weg"] || 0) + (activeTask === "hb_weg" ? currentDuration : 0))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Task Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {visibleTasks.map(task => {
              const isActive = activeTask === task.id;
              const taskTotal = (totals[task.id] || 0) + (isActive ? currentDuration : 0);
              return (
                <button key={task.id} onClick={() => handleTask(task.id)} style={{
                  padding: "16px 12px", borderRadius: 12, border: `2px solid ${isActive ? task.color : "transparent"}`,
                  background: isActive ? task.color : "white", color: isActive ? "white" : "#333",
                  cursor: "pointer", textAlign: "left",
                  boxShadow: isActive ? `0 4px 14px ${task.color}55` : "0 1px 4px rgba(0,0,0,0.08)",
                  transition: "all 0.15s", position: "relative"
                }}>
                  {task.countsPatient && (
                    <div style={{
                      position: "absolute", top: 8, right: 10, fontSize: 10, fontWeight: 700,
                      background: isActive ? "rgba(255,255,255,0.3)" : task.color + "22",
                      color: isActive ? "white" : task.color, borderRadius: 99, padding: "2px 6px"
                    }}>+1 Patient</div>
                  )}
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{task.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2, marginBottom: 6 }}>{task.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>
                    {taskTotal > 0 ? formatDuration(taskTotal) : "—"}
                  </div>
                  {isActive && <div style={{ fontSize: 11, marginTop: 3, opacity: 0.9 }}>● Läuft…</div>}
                </button>
              );
            })}
          </div>

          {activeTask && (
            <button onClick={handleStop} style={{
              width: "100%", padding: 12, borderRadius: 10, border: "2px solid #e74c3c", background: "white",
              color: "#e74c3c", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8
            }}>⏹ Stoppen</button>
          )}
          {(log.length > 0 || activeTask) && (
            <button onClick={reset} style={{
              width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd", background: "white",
              color: "#aaa", fontSize: 13, cursor: "pointer"
            }}>🗑 Alles zurücksetzen</button>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STATS VIEW
      ══════════════════════════════════════════════════════════════════ */}
      {view === "stats" && (
        <>
          <div style={{
            textAlign: "center", marginBottom: 12, background: accent, color: "white",
            borderRadius: 8, padding: "6px 0", fontSize: 13, fontWeight: 700
          }}>
            {role === "arzt" ? "👨‍⚕️ Arzt-Statistik" : "👩‍⚕️ MFA-Statistik"}
          </div>

          {(praxisTotalsData.length > 0 || hbTotalsData.length > 0) ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "white", borderRadius: 10, padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>PRAXIS GESAMT</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1a2e44" }}>{formatDuration(totalPraxisMs)}</div>
                  <div style={{ fontSize: 12, color: "#4A90D9" }}>{praxisPatients} Patienten</div>
                  {avgPraxis > 0 && <div style={{ fontSize: 11, color: "#aaa" }}>Ø {formatDuration(avgPraxis)}/Pat.</div>}
                </div>
                <div style={{ background: "white", borderRadius: 10, padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>HAUSBESUCHE</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1a2e44" }}>{formatDuration(totalHbMs)}</div>
                  <div style={{ fontSize: 12, color: "#2980B9" }}>{hbPatients} Besuche</div>
                  {avgHb > 0 && <div style={{ fontSize: 11, color: "#aaa" }}>Ø {formatDuration(avgHb)}/Pat.</div>}
                </div>
              </div>

              {praxisTotalsData.length > 0 && (
                <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#1a2e44" }}>🏥 Praxis-Zeitverteilung</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={praxisTotalsData} dataKey="value" cx="50%" cy="50%" outerRadius={70}
                        label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                        {praxisTotalsData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={v => formatDuration(v * 1000)} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {activePraxisTasks.map(task => {
                    const ms = (totals[task.id] || 0) + (activeTask === task.id ? currentDuration : 0);
                    if (!ms) return null;
                    const pct = totalPraxisMs > 0 ? Math.round(ms / totalPraxisMs * 100) : 0;
                    return (
                      <div key={task.id} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span>{task.icon} {task.label}</span>
                          <span style={{ fontWeight: 700 }}>{formatDuration(ms)} <span style={{ color: "#aaa" }}>({pct}%)</span></span>
                        </div>
                        <div style={{ background: "#eee", borderRadius: 99, height: 5 }}>
                          <div style={{ width: `${pct}%`, background: task.color, height: 5, borderRadius: 99 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {hbTotalsData.length > 0 && (
                <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#1a2e44" }}>🚗 Hausbesuch-Zeitverteilung</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={hbTotalsData} dataKey="value" cx="50%" cy="50%" outerRadius={65}
                        label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                        {hbTotalsData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={v => formatDuration(v * 1000)} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {HAUSBESUCH_TASKS.map(task => {
                    const ms = (totals[task.id] || 0) + (activeTask === task.id ? currentDuration : 0);
                    if (!ms) return null;
                    const pct = totalHbMs > 0 ? Math.round(ms / totalHbMs * 100) : 0;
                    return (
                      <div key={task.id} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span>{task.icon} {task.label}</span>
                          <span style={{ fontWeight: 700 }}>{formatDuration(ms)} <span style={{ color: "#aaa" }}>({pct}%)</span></span>
                        </div>
                        <div style={{ background: "#eee", borderRadius: 99, height: 5 }}>
                          <div style={{ width: `${pct}%`, background: task.color, height: 5, borderRadius: 99 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button onClick={exportCSV} style={{
                width: "100%", padding: 14, borderRadius: 10, border: "none",
                background: accent, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer"
              }}>⬇ Als CSV exportieren</button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "#bbb" }}>
              <div style={{ fontSize: 48 }}>📊</div>
              <p>Noch keine Daten vorhanden.<br />Starte eine Aufgabe im Tracker.</p>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SETTINGS VIEW
      ══════════════════════════════════════════════════════════════════ */}
      {view === "settings" && (
        <div>
          {/* Settings role sub-tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, background: "white", borderRadius: 10, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <RoleBtn active={settingsRole === "arzt"} onClick={() => setSettingsRole("arzt")} accentColor={arztColor}>👨‍⚕️ Arzt</RoleBtn>
            <RoleBtn active={settingsRole === "mfa"} onClick={() => setSettingsRole("mfa")} accentColor={mfaColor} >👩‍⚕️ MFA</RoleBtn>
          </div>

          {/* Current task list */}
          <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e44", marginBottom: 12 }}>
              Aktuelle Kategorien – {settingsRole === "arzt" ? "Arzt Praxis" : "MFA Praxis"}
              <span style={{ fontSize: 12, fontWeight: 400, color: "#999", marginLeft: 8 }}>({editTasks.length})</span>
            </div>

            {editTasks.length === 0 && (
              <div style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                Keine Kategorien. Füge unten eine hinzu.
              </div>
            )}

            {editTasks.map(task => (
              <div key={task.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8, marginBottom: 6,
                background: "#f8f9fa", border: "1px solid #eee"
              }}>
                {/* Color dot */}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: task.color, flexShrink: 0 }} />
                {/* Icon + label */}
                <span style={{ fontSize: 18, lineHeight: 1 }}>{task.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#333" }}>{task.label}</span>
                {/* Badges */}
                {task.countsPatient && (
                  <span style={{ fontSize: 10, background: "#4A90D922", color: "#4A90D9", borderRadius: 99, padding: "2px 6px", fontWeight: 700 }}>
                    +1 Pat.
                  </span>
                )}
                {/* Delete button */}
                <button onClick={() => deleteTask(task.id)} title="Löschen" style={{
                  background: "#fee", border: "none", borderRadius: 6, padding: "4px 8px",
                  color: "#e74c3c", cursor: "pointer", fontSize: 14, fontWeight: 700, lineHeight: 1,
                  flexShrink: 0
                }}>×</button>
              </div>
            ))}

            {/* Reset to defaults */}
            <button onClick={resetToDefaults} style={{
              marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 8,
              border: "1px dashed #ccc", background: "none",
              color: "#999", fontSize: 12, cursor: "pointer"
            }}>↩ Standard wiederherstellen</button>
          </div>

          {/* Add new task */}
          <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e44", marginBottom: 14 }}>
              ➕ Neue Kategorie hinzufügen
            </div>

            {/* Emoji + Name */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={newIcon}
                onChange={e => setNewIcon(e.target.value.slice(-2) || "📌")}
                placeholder="😊"
                style={{
                  width: 52, padding: "10px 6px", borderRadius: 8, border: "1px solid #ddd",
                  fontSize: 20, textAlign: "center", background: "#f8f9fa"
                }}
              />
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
                placeholder="Kategoriename..."
                maxLength={25}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd",
                  fontSize: 14, background: "#f8f9fa"
                }}
              />
            </div>

            {/* Quick emoji picks */}
            <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Emoji-Schnellauswahl:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {QUICK_ICONS.map(ic => (
                <button key={ic} onClick={() => setNewIcon(ic)} style={{
                  fontSize: 18, background: newIcon === ic ? "#e8edf8" : "#f8f9fa",
                  border: newIcon === ic ? "2px solid #4A90D9" : "1px solid #eee",
                  borderRadius: 6, padding: "4px 6px", cursor: "pointer", lineHeight: 1
                }}>{ic}</button>
              ))}
            </div>

            {/* Color picker */}
            <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Farbe wählen:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12, alignItems: "center" }}>
              {COLOR_PRESETS.map(c => (
                <button key={c} onClick={() => setNewColor(c)} title={c} style={{
                  width: 26, height: 26, borderRadius: "50%", background: c, border: "none",
                  cursor: "pointer",
                  outline: newColor === c ? `3px solid ${c}` : "none",
                  outlineOffset: 2,
                  transform: newColor === c ? "scale(1.25)" : "scale(1)",
                  transition: "all 0.12s"
                }} />
              ))}
              {/* Custom color input */}
              <label title="Eigene Farbe" style={{ position: "relative", width: 26, height: 26, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px dashed #ccc" }}>
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#999" }}>+</span>
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                  style={{ position: "absolute", opacity: 0, inset: 0, width: "100%", height: "100%", cursor: "pointer" }} />
              </label>
              {/* Preview swatch */}
              <div style={{ marginLeft: 4, width: 26, height: 26, borderRadius: "50%", background: newColor, border: "2px solid white", boxShadow: "0 0 0 2px " + newColor }} />
            </div>

            {/* countsPatient toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", marginBottom: 14 }}>
              <input type="checkbox" checked={newCounts} onChange={e => setNewCounts(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: accent, cursor: "pointer" }} />
              <span style={{ color: "#555" }}>Zählt als Patient <span style={{ color: "#999" }}>(erhöht den Patientenzähler)</span></span>
            </label>

            {/* Preview + Add button */}
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              {/* Live preview */}
              <div style={{
                flex: 1, padding: "10px 12px", borderRadius: 8,
                background: newColor + "18", border: `2px solid ${newColor}44`,
                display: "flex", alignItems: "center", gap: 8
              }}>
                <span style={{ fontSize: 20 }}>{newIcon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: newColor }}>
                  {newLabel.trim() || <span style={{ color: "#ccc" }}>Vorschau</span>}
                </span>
              </div>
              <button onClick={addTask} disabled={!newLabel.trim()} style={{
                padding: "10px 18px", borderRadius: 8, border: "none",
                background: newLabel.trim() ? accent : "#ddd",
                color: "white", fontWeight: 700, fontSize: 14, cursor: newLabel.trim() ? "pointer" : "default",
                transition: "background 0.15s"
              }}>Hinzufügen</button>
            </div>
          </div>

          {/* Hausbesuch hint */}
          <div style={{
            background: "#f0f8ff", borderRadius: 10, padding: "12px 14px",
            border: "1px solid #cce3f5", fontSize: 12, color: "#4a7aaa"
          }}>
            ℹ️ <strong>Hausbesuch-Kategorien</strong> (Fahrzeit, Hausbesuch) sind fest und können nicht bearbeitet werden – sie gelten für alle Rollen.
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginTop: 40, paddingBottom: 20 }}>
        <button onClick={() => setShowImpressum(true)} style={{
          background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", textDecoration: "underline"
        }}>Impressum &amp; Datenschutz</button>
      </div>

      {/* ── Impressum Modal ─────────────────────────────────────────────── */}
      {showImpressum && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: 20
        }}>
          <div style={{ background: "white", padding: 24, borderRadius: 12, maxWidth: 400, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginTop: 0 }}>Impressum &amp; Datenschutz</h2>
            <h3>Impressum</h3>
            <p><strong>Angaben gemäß § 5 TMG:</strong><br />
              Florian Rasche<br />Huttenstr. 6<br />97072 Würzburg<br />
              E-Mail: <a href="mailto:florian.rasche@googlemail.com">florian.rasche@googlemail.com</a>
            </p>
            <h3>Datenschutzerklärung</h3>
            <p><strong>1. Lokale Speicherung (Local Storage)</strong><br />
              Diese App speichert die von Ihnen erfassten Zeiten, Statistiken und den aktuellen Status direkt in Ihrem Browser (Local Storage).
              Es werden keine Tracking-Cookies verwendet und die Daten werden nicht an Dritte gesendet.
            </p>
            <p><strong>2. Hosting über GitHub Pages</strong><br />
              Diese Webseite wird über GitHub Pages gehostet. GitHub erfasst systembedingt Verbindungsdaten (z. B. IP-Adresse).
              Weitere Informationen finden Sie in der Datenschutzerklärung von GitHub.
            </p>
            <button onClick={() => setShowImpressum(false)} style={{
              width: "100%", padding: 12, borderRadius: 8, border: "none",
              background: "#1a2e44", color: "white", fontWeight: "bold", cursor: "pointer", marginTop: 16
            }}>Schließen</button>
          </div>
        </div>
      )}

      {/* ── Consent Banner ──────────────────────────────────────────────── */}
      {showConsent && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, background: "#1a2e44", color: "white",
          padding: 16, zIndex: 999, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 -2px 10px rgba(0,0,0,0.2)"
        }}>
          <div style={{ maxWidth: 480, margin: "0 auto", fontSize: 13, lineHeight: 1.5 }}>
            <strong>Datenschutzhinweis:</strong> Diese App speichert Ihre erfassten Zeiten lokal auf Ihrem Gerät (Local Storage).
            Da diese Seite auf GitHub gehostet wird, speichert GitHub systembedingt Verbindungsdaten (z.B. Ihre IP-Adresse).
            <div style={{ marginTop: 8 }}>
              <button onClick={() => setShowImpressum(true)}
                style={{ background: "none", border: "none", color: "#4A90D9", padding: 0, textDecoration: "underline", cursor: "pointer" }}>
                Mehr erfahren (Impressum &amp; Datenschutz)
              </button>
            </div>
          </div>
          <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
            <button onClick={acceptConsent} style={{
              width: "100%", padding: 12, borderRadius: 8, border: "none",
              background: "#4A90D9", color: "white", fontWeight: "bold", cursor: "pointer"
            }}>Einverstanden</button>
          </div>
        </div>
      )}
    </div>
  );
}
