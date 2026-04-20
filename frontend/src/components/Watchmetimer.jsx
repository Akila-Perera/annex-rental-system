// frontend/src/pages/WatchMeTimer.jsx
import { useState, useEffect, useRef } from "react";

const CORRECT_PIN = "1234";

const DURATIONS = [
  { label: "10 sec (test)", seconds: 10 },
  { label: "5 min",         seconds: 300 },
  { label: "15 min",        seconds: 900 },
  { label: "30 min",        seconds: 1800 },
  { label: "60 min",        seconds: 3600 },
];

export default function WatchMeTimer({ studentName = "Student" }) {
  const [step, setStep]               = useState("setup");
  const [selectedDuration, setSelectedDuration] = useState(900);
  const [pin, setPin]                 = useState("");
  const [pinError, setPinError]       = useState(false);
  const [phone, setPhone]             = useState("");
  const [phoneError, setPhoneError]   = useState("");
  const [remaining, setRemaining]     = useState(900);
  const [coords, setCoords]           = useState(null);
  const [gpsStatus, setGpsStatus]     = useState("idle");
  const [sending, setSending]         = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");

  const intervalRef  = useRef(null);
  const watchRef     = useRef(null);
  const remainingRef = useRef(900);
  const coordsRef    = useRef(null);

  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { coordsRef.current = coords; }, [coords]);
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  function formatTime(s) {
    if (s <= 0) return "00:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function selectDuration(sec) {
    if (step !== "setup") return;
    setSelectedDuration(sec);
    setRemaining(sec);
    remainingRef.current = sec;
  }

  function handleNext() {
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    if (!cleaned || cleaned.length < 9) {
      setPhoneError("Enter a valid number e.g. 0771234567 or +94771234567");
      return;
    }
    setPhoneError("");
    setStep("pin");
    setPin("");
    setPinError(false);
  }

  function pinPress(key) {
    setPinError(false);
    if (key === "del")   { setPin(p => p.slice(0, -1)); return; }
    if (key === "clear") { setPin(""); return; }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) setTimeout(() => validatePin(next), 150);
  }

  function validatePin(entered) {
    if (entered === CORRECT_PIN) {
      startCountdown();
    } else {
      setPinError(true);
      setTimeout(() => { setPin(""); setPinError(false); }, 600);
    }
  }

  function startCountdown() {
    const dur = selectedDuration;
    setRemaining(dur);
    remainingRef.current = dur;
    setStep("running");
    acquireGPS();
    intervalRef.current = setInterval(() => {
      const next = remainingRef.current - 1;
      remainingRef.current = next;
      setRemaining(next);
      if (next <= 0) {
        clearInterval(intervalRef.current);
        sendAlert();
      }
    }, 1000);
  }

  function acquireGPS() {
    if (!navigator.geolocation) { setGpsStatus("denied"); return; }
    setGpsStatus("acquiring");
    watchRef.current = navigator.geolocation.watchPosition(
      pos => { setCoords(pos.coords); coordsRef.current = pos.coords; setGpsStatus("ok"); },
      ()  => setGpsStatus("denied"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function cancelCountdown() {
    clearInterval(intervalRef.current);
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    resetAll();
  }

  async function sendAlert() {
    setSending(true);
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    const c = coordsRef.current;
    const mapsLink = c ? `https://maps.google.com/?q=${c.latitude},${c.longitude}` : null;
    try {
      const res = await fetch("/api/watchme/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          phone: phone.replace(/[\s\-\(\)]/g, ""),
          locationUrl: mapsLink,
          lat: c?.latitude,
          lng: c?.longitude,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setStep("sent");
    } catch (err) {
      setErrorMsg(err.message || "Could not send SMS. Check backend logs.");
      setStep("failed");
    } finally {
      setSending(false);
    }
  }

  function resetAll() {
    clearInterval(intervalRef.current);
    setStep("setup");
    setPin(""); setPinError(false);
    setPhone(""); setPhoneError("");
    setCoords(null); coordsRef.current = null;
    setGpsStatus("idle");
    setRemaining(selectedDuration);
    remainingRef.current = selectedDuration;
    setErrorMsg("");
  }

  const pct        = selectedDuration > 0 ? (remaining / selectedDuration) * 100 : 0;
  const isLow      = pct <= 30;
  const isCritical = pct <= 10;
  const timerColor = isCritical ? "#ef4444" : isLow ? "#f59e0b" : "#3b82f6";

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <div style={s.shieldBadge}>🛡️</div>
        <div>
          <div style={s.title}>Watch Me Timer</div>
          <div style={s.subtitle}>
            Start a safety countdown before you head out. If you don't cancel it
            in time, your contact receives an SMS with your name &amp; live location.
          </div>
        </div>
      </div>

      {step === "setup" && (
        <div style={s.card}>
          <div style={s.sectionLabel}>Choose duration</div>
          <div style={s.durationRow}>
            {DURATIONS.map(d => (
              <button
                key={d.seconds}
                style={{ ...s.durBtn, ...(selectedDuration === d.seconds ? s.durBtnActive : {}) }}
                onClick={() => selectDuration(d.seconds)}
              >{d.label}</button>
            ))}
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <div style={s.sectionLabel}>Contact's phone number (SMS)</div>
            <div style={s.hint}>They will receive a text message if you don't cancel in time</div>
            <input
              style={{ ...s.input, ...(phoneError ? s.inputErr : {}) }}
              type="tel"
              placeholder="e.g. 0771234567 or +94771234567"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPhoneError(""); }}
            />
            {phoneError && <div style={s.errText}>{phoneError}</div>}
          </div>
          <button style={s.btnPrimary} onClick={handleNext}>Next — Enter PIN →</button>
        </div>
      )}

      {step === "pin" && (
        <div style={s.card}>
          <div style={{ ...s.sectionLabel, textAlign: "center" }}>Enter PIN to start timer</div>
          <div style={s.pinDots}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                ...s.pinDot,
                ...(i < pin.length ? s.pinDotFilled : {}),
                ...(pinError ? s.pinDotErr : {}),
              }} />
            ))}
          </div>
          {pinError && <div style={{ ...s.errText, textAlign: "center", marginBottom: 8 }}>Incorrect PIN — try again</div>}
          <div style={s.pinGrid}>
            {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map((k, idx) => {
              const key = k === "C" ? "clear" : k === "⌫" ? "del" : k;
              return (
                <button key={idx} style={{ ...s.pinKey, ...(k === "C" || k === "⌫" ? s.pinKeyUtil : {}) }} onClick={() => pinPress(key)}>{k}</button>
              );
            })}
          </div>
          <button style={{ ...s.btnSecondary, marginTop: "1rem" }} onClick={() => setStep("setup")}>← Back</button>
        </div>
      )}

      {step === "running" && (
        <div style={s.card}>
          <div style={{ ...s.timerBig, color: timerColor }}>{formatTime(remaining)}</div>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: Math.max(0, pct) + "%", background: timerColor }} />
          </div>
          <div style={s.gpsRow}>
            <span style={{ fontSize: 16 }}>{gpsStatus === "ok" ? "📍" : gpsStatus === "acquiring" ? "🔄" : "⚠️"}</span>
            <span style={s.gpsText}>
              {gpsStatus === "ok"
                ? `GPS locked — ${coords?.latitude?.toFixed(5)}, ${coords?.longitude?.toFixed(5)}`
                : gpsStatus === "acquiring" ? "Acquiring GPS location..."
                : "GPS unavailable — location won't be included in SMS"}
            </span>
          </div>
          {isCritical && <div style={s.urgentBanner}>⚡ Time almost up! Press Cancel now or your contact will be texted.</div>}
          <div style={s.infoBox}>
            Press <strong>Cancel Countdown</strong> before it hits <strong>00:00</strong> — otherwise <strong>{phone}</strong> receives an SMS with your location automatically.
          </div>
          <button style={s.btnCancel} onClick={cancelCountdown}>✕&nbsp;&nbsp;Cancel Countdown</button>
        </div>
      )}

      {step === "sent" && (
        <div style={s.card}>
          <div style={s.sentBox}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📱</div>
            <div style={s.sentTitle}>SMS Alert Sent!</div>
            <div style={s.sentSub}><strong>{studentName}</strong>'s name and location were sent to <strong>{phone}</strong> via SMS.</div>
          </div>
          <button style={s.btnPrimary} onClick={resetAll}>Start a new timer</button>
        </div>
      )}

      {step === "failed" && (
        <div style={s.card}>
          <div style={s.failBox}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>❌</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>SMS failed to send</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{errorMsg}</div>
          </div>
          <button style={s.btnPrimary} onClick={resetAll}>Try again</button>
        </div>
      )}

      {sending && (
        <div style={s.overlay}>
          <div style={s.overlayBox}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📤</div>
            <div style={{ fontWeight: 500, color: "#e2e8f0" }}>Sending SMS alert...</div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper: { background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 16, padding: "1.5rem", marginTop: "2rem", position: "relative", fontFamily: "inherit", color: "#e2e8f0" },
  header: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid #1e3a5f" },
  shieldBadge: { fontSize: 30, lineHeight: 1, flexShrink: 0, marginTop: 2 },
  title:    { fontSize: 18, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#64748b", lineHeight: 1.55 },
  card: { background: "#1e293b", borderRadius: 12, padding: "1.25rem" },
  sectionLabel: { fontSize: 12, fontWeight: 500, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 },
  hint: { fontSize: 12, color: "#475569", marginBottom: 6, lineHeight: 1.4 },
  durationRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  durBtn: { flex: "1 1 70px", padding: "8px 6px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" },
  durBtnActive: { border: "1px solid #3b82f6", background: "#172554", color: "#93c5fd", fontWeight: 500 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  inputErr: { border: "1px solid #ef4444" },
  errText:  { fontSize: 12, color: "#f87171", marginTop: 4 },
  btnPrimary: { marginTop: "1rem", width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  btnSecondary: { width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  btnCancel: { marginTop: "1rem", width: "100%", padding: "13px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em", fontFamily: "inherit" },
  pinDots: { display: "flex", gap: 14, justifyContent: "center", margin: "1rem 0 0.5rem" },
  pinDot: { width: 14, height: 14, borderRadius: "50%", border: "2px solid #334155", transition: "all 0.15s" },
  pinDotFilled: { background: "#3b82f6", borderColor: "#3b82f6" },
  pinDotErr:    { borderColor: "#ef4444", background: "#ef4444" },
  pinGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: "0.75rem" },
  pinKey: { padding: "15px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: 20, fontWeight: 500, cursor: "pointer", textAlign: "center", fontFamily: "inherit" },
  pinKeyUtil: { color: "#94a3b8", fontSize: 14 },
  timerBig: { fontSize: 64, fontWeight: 700, textAlign: "center", letterSpacing: 4, fontVariantNumeric: "tabular-nums", fontFamily: "monospace", marginBottom: "0.75rem", transition: "color 0.5s" },
  progressTrack: { height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden", marginBottom: "1rem" },
  progressFill: { height: "100%", borderRadius: 3, transition: "width 1s linear, background 0.5s" },
  gpsRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" },
  gpsText: { fontSize: 12, color: "#475569", lineHeight: 1.4 },
  urgentBanner: { background: "#450a0a", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#fca5a5", marginBottom: "0.75rem", fontWeight: 500, textAlign: "center" },
  infoBox: { background: "#1c1917", border: "1px solid #292524", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#78716c", lineHeight: 1.55, marginBottom: "0.25rem" },
  sentBox: { textAlign: "center", background: "#052e16", border: "1px solid #16a34a", borderRadius: 10, padding: "1.75rem 1rem", marginBottom: "1rem", color: "#86efac" },
  sentTitle: { fontWeight: 700, fontSize: 18, marginBottom: 6 },
  sentSub:   { fontSize: 13, color: "#4ade80", lineHeight: 1.5 },
  failBox: { textAlign: "center", background: "#450a0a", border: "1px solid #ef4444", borderRadius: 10, padding: "1.75rem 1rem", marginBottom: "1rem", color: "#fca5a5" },
  overlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 },
  overlayBox: { background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: "2rem 2.5rem", textAlign: "center" },
};