import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
const PRAXIS_TASKS = [
  { id: "aufruf", label: "Patientenaufruf", color: "#4A90D9", icon: "🔔", countsPatient: true },
  { id: "vorbereitung", label: "Vorbereitung", color: "#8E44AD", icon: "💉", countsPatient: false },
  { id: "behandlung", label: "Patientenbehandlung", color: "#27AE60", icon: "🩺", countsPatient: false },
  { id: "nachbearbeitung", label: "Nachbearbeitung", color: "#F39C12", icon: "📋", countsPatient: false },
  { id: "unterbrechung", label: "Unterbrechung", color: "#E74C3C", icon: "📞", countsPatient: false },
  { id: "kollegial", label: "Koll. Gespräch", color: "#795548", icon: "🗣️", countsPatient: false },
  { id: "telefonat", label: "Telefonat", color: "#00ACC1", icon: "📱", countsPatient: false },
  { id: "papierkram", label: "Papierkram", color: "#607D8B", icon: "📄", countsPatient: false },
];
const HAUSBESUCH_TASKS = [
  { id: "hb_weg", label: "Fahrzeit", color: "#16A085", icon: "🚗", countsPatient: false },
  { id: "hb_besuch", label: "Hausbesuch", color: "#2980B9", icon: "🏠", countsPatient: true },
];
const ALL_TASKS = [...PRAXIS_TASKS, ...HAUSBESUCH_TASKS];
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
const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
    background: active ? "#1a2e44" : "white", color: active ? "white" : "#555",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)", transition: "all 0.15s"
  }}>{children}</button>
);
export default function App() {
  const [mode, setMode] = useState("praxis"); // praxis | hausbesuch
  const [view, setView] = useState("tracker"); // tracker | stats
  const [activeTask, setActiveTask] = useState(null);
  const [taskStart, setTaskStart] = useState(null);
  const [log, setLog] = useState([]);
  const [totals, setTotals] = useState({});
  const [now, setNow] = useState(Date.now());
  // Patient counter
  const [praxisPatients, setPraxisPatients] = useState(0);
  const [hbPatients, setHbPatients] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const currentDuration = activeTask && taskStart ? now - taskStart : 0;
  const stopCurrent = (timestamp) => {
    if (!activeTask || !taskStart) return;
    const duration = timestamp - taskStart;
    const entry = { task: activeTask, start: taskStart, end: timestamp, duration, mode };
    setLog(prev => [...prev, entry]);
    setTotals(prev => ({ ...prev, [activeTask]: (prev[activeTask] || 0) + duration }));
  };
  const handleTask = (taskId) => {
    const ts = Date.now();
    const task = ALL_TASKS.find(t => t.id === taskId);
    stopCurrent(ts);
    if (activeTask === taskId) {
      setActiveTask(null);
      setTaskStart(null);
    } else {
      // Count patient if task triggers it
      if (task?.countsPatient) {
        if (mode === "praxis") setPraxisPatients(p => p + 1);
        else setHbPatients(p => p + 1);
      }
      setActiveTask(taskId);
      setTaskStart(ts);
    }
  };
  const handleStop = () => {
    stopCurrent(Date.now());
    setActiveTask(null);
    setTaskStart(null);
  };
  const reset = () => {
    handleStop();
    setLog([]);
    setTotals({});
    setPraxisPatients(0);
    setHbPatients(0);
  };
  const exportCSV = () => {
    const rows = [["Modus", "Aufgabe", "Start", "Ende", "Dauer (s)"]];
    log.forEach(e => {
      const task = ALL_TASKS.find(t => t.id === e.task);
      rows.push([e.mode === "praxis" ? "Praxis" : "Hausbesuch", task?.label || e.task, formatTime(e.start), formatTime(e.end), Math.round(e.duration / 1000)]);
    });
    rows.push([]);
    rows.push(["=== Zusammenfassung ==="]);
    rows.push(["Praxis-Patienten", praxisPatients]);
    rows.push(["Hausbesuch-Patienten", hbPatients]);
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zeittracker_${new Date().toLocaleDateString("de-DE").replace(/\./g, "-")}.csv`;
    a.click();
  };
  const tasks = mode === "praxis" ? PRAXIS_TASKS : HAUSBESUCH_TASKS;
  // Stats
  const praxisTotals = PRAXIS_TASKS.map(t => ({
    name: t.label, color: t.color,
    value: Math.round(((totals[t.id] || 0) + (activeTask === t.id ? currentDuration : 0)) / 1000)
  })).filter(d => d.value > 0);
  const hbTotals = HAUSBESUCH_TASKS.map(t => ({
    name: t.label, color: t.color,
    value: Math.round(((totals[t.id] || 0) + (activeTask === t.id ? currentDuration : 0)) / 1000)
  })).filter(d => d.value > 0);
  const totalPraxisMs = PRAXIS_TASKS.reduce((a, t) => a + (totals[t.id] || 0) + (activeTask === t.id ? currentDuration : 0), 0);
  const totalHbMs = HAUSBESUCH_TASKS.reduce((a, t) => a + (totals[t.id] || 0) + (activeTask === t.id ? currentDuration : 0), 0);
  const avgPraxis = praxisPatients > 0 ? totalPraxisMs / praxisPatients : 0;
  const avgHb = hbPatients > 0 ? totalHbMs / hbPatients : 0;
  const activeTaskInfo = ALL_TASKS.find(t => t.id === activeTask);
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", padding: 16, background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#1a2e44", color: "white", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🏥 Praxis Zeit-Tracker</h1>
        <p style={{ margin: "3px 0 0", fontSize: 12, opacity: 0.65 }}>
          {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      {/* Mode Switch */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, background: "white", borderRadius: 10, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <TabBtn active={mode === "praxis"} onClick={() => setMode("praxis")}>🏥 Praxis</TabBtn>
        <TabBtn active={mode === "hausbesuch"} onClick={() => setMode("hausbesuch")}>🚗 Hausbesuch</TabBtn>
      </div>
      {/* View Switch */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <TabBtn active={view === "tracker"} onClick={() => setView("tracker")}>⏱ Tracker</TabBtn>
        <TabBtn active={view === "stats"} onClick={() => setView("stats")}>📊 Statistik</TabBtn>
      </div>
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
                <div style={{ fontSize: 30, fontWeight: 800, color: "#1a2e44", fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>
                  {formatDuration(currentDuration)}
                </div>
              </>
            ) : (
              <div style={{ color: "#bbb", fontSize: 14, padding: "4px 0" }}>⏸ Keine aktive Aufgabe</div>
            )}
          </div>
          {/* Patient counter display */}
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
          {/* Task Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: mode === "praxis" ? "1fr 1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {tasks.map(task => {
              const isActive = activeTask === task.id;
              const taskTotal = (totals[task.id] || 0) + (isActive ? currentDuration : 0);
              return (
                <button key={task.id} onClick={() => handleTask(task.id)} style={{
                  padding: "16px 12px", borderRadius: 12, border: `2px solid ${isActive ? task.color : "transparent"}`,
                  background: isActive ? task.color : "white", color: isActive ? "white" : "#333",
                  cursor: "pointer", textAlign: "left", boxShadow: isActive ? `0 4px 14px ${task.color}55` : "0 1px 4px rgba(0,0,0,0.08)",
                  transition: "all 0.15s", position: "relative"
                }}>
                  {task.countsPatient && (
                    <div style={{ position: "absolute", top: 8, right: 10, fontSize: 10, fontWeight: 700,
                      background: isActive ? "rgba(255,255,255,0.3)" : task.color + "22", color: isActive ? "white" : task.color,
                      borderRadius: 99, padding: "2px 6px" }}>+1 Patient</div>
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
      {view === "stats" && (
        <>
          {(praxisTotals.length > 0 || hbTotals.length > 0) ? (
            <>
              {/* Summary Cards */}
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
              {/* Praxis Chart */}
              {praxisTotals.length > 0 && (
                <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#1a2e44" }}>🏥 Praxis-Zeitverteilung</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={praxisTotals} dataKey="value" cx="50%" cy="50%" outerRadius={70}
                        label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                        {praxisTotals.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={v => formatDuration(v * 1000)} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {PRAXIS_TASKS.map(task => {
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
              {/* Hausbesuch Chart */}
              {hbTotals.length > 0 && (
                <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#1a2e44" }}>🚗 Hausbesuch-Zeitverteilung</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={hbTotals} dataKey="value" cx="50%" cy="50%" outerRadius={65}
                        label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                        {hbTotals.map((e, i) => <Cell key={i} fill={e.color} />)}
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
                width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#1a2e44",
                color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer"
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
    </div>
  );
}
