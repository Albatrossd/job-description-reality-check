import { useState, useCallback } from "react";

const NEGATION_WORDS = [
  "not ", "never ", "don't ", "don't ", "no ", "isn't ", "aren't ",
  "we avoid", "we don't", "we never", "without ", "unlike ", "none of",
  "free from", "respect", "mature", "structured"
];

const RED_FLAGS = [
  {
    id: "fast_paced",
    label: "Fast-Paced Environment",
    translation: "Everything is urgent. Priorities shift daily. Reactive, interrupt-driven work.",
    risk: "red",
    baseScore: 2,
    phrases: [
      "fast-paced", "fast paced", "hair on fire", "rapid pace", "move fast",
      "high velocity", "high-velocity", "never a dull moment", "always something going on",
      "things change quickly", "rapidly evolving", "dynamic environment", "high tempo",
      "quick turnaround", "fast moving", "fast-moving", "rapid iteration",
      "hit the ground running", "always moving", "always changing"
    ]
  },
  {
    id: "cross_functional",
    label: "Cross-Functional Collaboration",
    translation: "You will attend a lot of meetings. You become the coordination layer.",
    risk: "yellow",
    baseScore: 1,
    phrases: [
      "cross-functional", "cross functional", "across teams", "multiple stakeholders",
      "partner with teams", "work with all departments", "bridge between teams",
      "liaise with", "interface with multiple", "across the organization",
      "collaborate with various", "work closely with all", "spanning teams",
      "multiple business units", "all parts of the business"
    ]
  },
  {
    id: "supports_org",
    label: "Supports the Entire Org",
    translation: "Everyone can interrupt you. You become a service desk with a salary.",
    risk: "red",
    baseScore: 2,
    phrases: [
      "supports the entire", "support the whole", "support all teams",
      "company-wide support", "organization-wide", "internal customers",
      "serve all departments", "supporting all of", "entire company relies",
      "go-to person", "go to person", "point of contact for all",
      "anyone in the company", "all employees", "business-wide"
    ]
  },
  {
    id: "many_hats",
    label: "Wear Many Hats",
    translation: "Role is poorly defined. Expect scope creep and constant context-switching.",
    risk: "red",
    baseScore: 2,
    phrases: [
      "wear many hats", "wear a lot of hats", "generalist", "do it all",
      "jack of all", "varied responsibilities", "no two days the same",
      "broad scope", "wide range of tasks", "diverse responsibilities",
      "whatever it takes", "roll up your sleeves", "scrappy",
      "all hands on deck", "fluid role", "evolving role", "swiss army"
    ]
  },
  {
    id: "ownership",
    label: "Strong Sense of Ownership",
    translation: "Responsibility without authority. You own problems you don't control.",
    risk: "yellow",
    baseScore: 1,
    phrases: [
      "sense of ownership", "strong ownership", "take ownership", "own the outcome",
      "accountable for results", "own it", "results-oriented", "drive results",
      "bias for action", "self-starter", "proactive", "takes initiative",
      "runs with things", "end-to-end ownership", "full ownership"
    ]
  },
  {
    id: "ambiguity",
    label: "Thrives in Ambiguity",
    translation: "Leadership hasn't figured things out yet. Organizational chaos likely.",
    risk: "yellow",
    baseScore: 1,
    phrases: [
      "thrives in ambiguity", "comfortable with ambiguity", "ambiguous environment",
      "undefined problems", "no playbook", "build the plane while flying",
      "0 to 1", "zero to one", "early stage", "figure it out",
      "make it up as we go", "pioneering", "uncharted", "greenfield",
      "startup mentality", "startup mindset", "entrepreneurial mindset"
    ]
  },
  {
    id: "collaborative",
    label: "Highly Collaborative Culture",
    translation: "We schedule meetings for everything. Your calendar will be consumed.",
    risk: "yellow",
    baseScore: 1,
    phrases: [
      "highly collaborative", "deeply collaborative", "team-oriented", "team oriented",
      "we work together", "collaborative culture", "open communication",
      "strong team culture", "togetherness", "no silos", "transparent culture",
      "open door policy", "we share everything", "constant communication",
      "frequent touchpoints", "regular check-ins"
    ]
  },
  {
    id: "stakeholders",
    label: "Partner with Stakeholders",
    translation: "Most dangerous. You become coordinator, explainer, and meeting participant — not a builder.",
    risk: "red",
    baseScore: 2,
    phrases: [
      "partner with stakeholders", "stakeholder management", "manage stakeholders",
      "work with leadership", "executive visibility", "present to leadership",
      "executive stakeholders", "business partners", "key partners",
      "manage relationships", "relationship management", "alignment meetings",
      "stakeholder alignment", "gain buy-in", "drive alignment",
      "work across the business"
    ]
  },
];

const UNICORN_SIGNALS = [
  { phrase: "own this system", label: "Own this system" },
  { phrase: "work independently", label: "Work independently" },
  { phrase: "small team", label: "Small team" },
  { phrase: "asynchronous", label: "Asynchronous" },
  { phrase: "async", label: "Async" },
  { phrase: "limited meetings", label: "Limited meetings" },
  { phrase: "few meetings", label: "Few meetings" },
  { phrase: "internal platform", label: "Internal platform" },
  { phrase: "self-directed", label: "Self-directed" },
  { phrase: "self directed", label: "Self-directed" },
  { phrase: "deep work", label: "Deep work" },
  { phrase: "no meetings", label: "No meetings" },
  { phrase: "maker schedule", label: "Maker schedule" },
  { phrase: "heads-down", label: "Heads-down" },
  { phrase: "heads down", label: "Heads-down" },
  { phrase: "minimal process", label: "Minimal process" },
  { phrase: "low overhead", label: "Low overhead" },
];

function getSentences(text) {
  return text.match(/[^.!?\n]+[.!?\n]*/g)?.map(s => s.trim()).filter(Boolean) || [text];
}

function hasNegation(sentence, matchPhrase) {
  const lower = sentence.toLowerCase();
  const idx = lower.indexOf(matchPhrase.toLowerCase());
  if (idx === -1) return false;
  const window = lower.substring(Math.max(0, idx - 80), idx + matchPhrase.length + 20);
  return NEGATION_WORDS.some(n => window.includes(n));
}

function findMatches(text, flag) {
  const sentences = getSentences(text);
  const hits = [];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const phrase of flag.phrases) {
      if (lower.includes(phrase.toLowerCase())) {
        const negated = hasNegation(sentence, phrase);
        hits.push({ phrase, sentence: sentence.trim(), negated, score: negated ? flag.baseScore * 0.5 : flag.baseScore });
        break;
      }
    }
  }
  const seen = new Set();
  return hits.filter(h => { if (seen.has(h.sentence)) return false; seen.add(h.sentence); return true; });
}

function extractRate(text) {
  const hourly = text.match(/\$(\d{2,3})(?:\s*[-–]\s*\$?(\d{2,3}))?(?:\s*\/\s*hr|\s*per\s*hour)/i);
  if (hourly) return { type: "hourly", lo: parseInt(hourly[1]), hi: hourly[2] ? parseInt(hourly[2]) : parseInt(hourly[1]) };
  const salary = text.match(/\$(\d{2,3}),?000(?:\s*[-–]\s*\$?(\d{2,3}),?000)?/i);
  if (salary) return { type: "salary", lo: parseInt(salary[1]), hi: salary[2] ? parseInt(salary[2]) : parseInt(salary[1]) };
  const kStyle = text.match(/(\d{2,3})k(?:\s*[-–]\s*(\d{2,3})k)?/i);
  if (kStyle) return { type: "salary", lo: parseInt(kStyle[1]), hi: kStyle[2] ? parseInt(kStyle[2]) : parseInt(kStyle[1]) };
  return null;
}

function assessRate(rate) {
  if (!rate) return { label: "No comp listed", color: "gray", pass: false };
  const avg = (rate.lo + rate.hi) / 2;
  if (rate.type === "hourly") {
    if (avg >= 90) return { label: `$${rate.lo}–$${rate.hi}/hr ✓ Clears threshold`, color: "green", pass: true };
    if (avg >= 70) return { label: `$${rate.lo}–$${rate.hi}/hr — borderline`, color: "yellow", pass: null };
    return { label: `$${rate.lo}–$${rate.hi}/hr ✗ Below threshold`, color: "red", pass: false };
  } else {
    if (avg >= 150) return { label: `$${rate.lo}k–$${rate.hi}k ✓ Clears threshold`, color: "green", pass: true };
    if (avg >= 120) return { label: `$${rate.lo}k–$${rate.hi}k — borderline`, color: "yellow", pass: null };
    return { label: `$${rate.lo}k–$${rate.hi}k ✗ Below threshold`, color: "red", pass: false };
  }
}

function analyzePosting(text) {
  const lower = text.toLowerCase();
  const flagResults = RED_FLAGS.map(flag => ({ flag, matches: findMatches(text, flag) })).filter(r => r.matches.length > 0);
  const totalScore = flagResults.reduce((sum, r) => sum + r.matches.reduce((s, m) => s + m.score, 0), 0);
  const redCount = flagResults.filter(r => r.flag.risk === "red" && r.matches.some(m => !m.negated)).length;
  const yellowCount = flagResults.filter(r => r.flag.risk === "yellow" && r.matches.some(m => !m.negated)).length;
  const negatedCount = flagResults.reduce((n, r) => n + r.matches.filter(m => m.negated).length, 0);
  const unicornFound = UNICORN_SIGNALS.filter(s => lower.includes(s.phrase));
  const rate = extractRate(text);
  const rateAssessment = assessRate(rate);

  let verdict, sub;
  if (unicornFound.length >= 2 && totalScore <= 1) {
    verdict = "SMASH"; sub = "Rare. Proceed carefully — but this looks like the unicorn.";
  } else if (totalScore >= 5 && !rateAssessment.pass) {
    verdict = "PASS"; sub = "Fast, emotionless, no guilt. Move on.";
  } else if (totalScore >= 5 && rateAssessment.pass) {
    verdict = "YES, IF"; sub = "High swallow risk — but cash may compensate. Set boundaries early. Plan the exit.";
  } else if (totalScore >= 2) {
    verdict = "INVESTIGATE"; sub = "Could work. Interrogate meeting load, scope, and cash before committing.";
  } else {
    verdict = "INVESTIGATE"; sub = "Looks manageable. Verify the details before saying yes.";
  }

  return { flagResults, unicornFound, rateAssessment, verdict, sub, redCount, yellowCount, negatedCount, totalScore };
}

const VERDICT_STYLES = {
  SMASH:       { bg: "#0a1a0a", accent: "#22c55e", glow: "0 0 40px rgba(34,197,94,0.25)" },
  "YES, IF":   { bg: "#1a1200", accent: "#f59e0b", glow: "0 0 40px rgba(245,158,11,0.25)" },
  INVESTIGATE: { bg: "#0d0d1a", accent: "#818cf8", glow: "0 0 40px rgba(129,140,248,0.25)" },
  PASS:        { bg: "#1a0a0a", accent: "#ef4444", glow: "0 0 40px rgba(239,68,68,0.25)" },
};

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = useCallback(() => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setTimeout(() => { setResult(analyzePosting(text)); setAnalyzing(false); }, 500);
  }, [text]);

  const reset = () => { setText(""); setResult(null); };
  const vs = result ? VERDICT_STYLES[result.verdict] : null;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'IBM Plex Mono','Courier New',monospace", color: "#e0e0e0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        .scan-btn { background: #e0e0e0; color: #080808; border: none; padding: 14px 36px; font-family: 'IBM Plex Mono',monospace; font-weight: 600; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
        .scan-btn:hover { background: #fff; transform: translateY(-1px); }
        .scan-btn:disabled { opacity: 0.4; cursor: default; transform: none; }
        .reset-btn { background: transparent; color: #999; border: 1px solid #555; padding: 10px 24px; font-family: 'IBM Plex Mono',monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
        .reset-btn:hover { color: #e0e0e0; border-color: #888; }
        textarea { width: 100%; background: #0f0f0f; border: 1px solid #222; color: #c0c0c0; font-family: 'IBM Plex Mono',monospace; font-size: 13px; line-height: 1.7; padding: 20px; resize: vertical; outline: none; transition: border-color 0.2s; }
        textarea:focus { border-color: #444; }
        textarea::placeholder { color: #333; }
        .tag { display: inline-block; padding: 4px 10px; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; border: 1px solid; margin: 3px; }
        .reveal { animation: reveal 0.35s ease-out; }
        @keyframes reveal { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .match-block { border-left: 3px solid; padding: 14px 16px; margin-bottom: 10px; background: rgba(255,255,255,0.02); }
        .sentence-quote { font-size: 12px; color: #aaa; line-height: 1.7; margin-top: 8px; padding: 10px 14px; background: #0a0a0a; border-left: 2px solid #333; font-style: italic; }
        .negated-badge { display: inline-block; font-size: 9px; letter-spacing: 1.5px; padding: 2px 7px; border: 1px solid #555; color: #888; margin-left: 8px; vertical-align: middle; }
      `}</style>

      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "24px 40px", display: "flex", alignItems: "baseline", gap: "16px" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "28px", letterSpacing: "4px" }}>JOB POSTING REALITY CHECK</div>
        <div style={{ color: "#333", fontSize: "11px", letterSpacing: "2px" }}>SMASH / INVESTIGATE / PASS</div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px" }}>
        {!result ? (
          <>
            <div style={{ border: "1px solid #1e1e1e", padding: "20px 24px", marginBottom: "32px", background: "#0c0c0c" }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", marginBottom: "12px" }}>PRIME DIRECTIVE</div>
              <div style={{ fontSize: "12px", color: "#aaa", lineHeight: "1.8" }}>
                "Yes, if the cash compensates me for the risk of exit."<br/>
                <span style={{ color: "#777" }}>Threshold → Hourly: $85–100+ &nbsp;|&nbsp; W2: $150k+ &nbsp;|&nbsp; Exit window: 6 months</span>
              </div>
            </div>
            <div style={{ marginBottom: "8px", fontSize: "10px", letterSpacing: "2px", color: "#888" }}>PASTE JOB POSTING BELOW</div>
            <textarea rows={12} value={text} onChange={e => setText(e.target.value)} placeholder="Paste the full job description here — idioms, jargon, and all..." />
            <div style={{ marginTop: "16px" }}>
              <button className="scan-btn" onClick={analyze} disabled={!text.trim() || analyzing}>
                {analyzing ? "Scanning..." : "▶ Run Reality Check"}
              </button>
            </div>
          </>
        ) : (
          <div className="reveal">
            {/* Verdict */}
            <div style={{ background: vs.bg, border: `1px solid ${vs.accent}`, boxShadow: vs.glow, padding: "32px", marginBottom: "32px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "64px", letterSpacing: "8px", color: vs.accent, lineHeight: 1, marginBottom: "12px" }}>{result.verdict}</div>
              <div style={{ fontSize: "13px", color: "#999", letterSpacing: "1px" }}>{result.sub}</div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "24px" }}>
              {[
                { label: "Red Flags", value: result.redCount, color: "#ef4444" },
                { label: "Investigate", value: result.yellowCount, color: "#f59e0b" },
                { label: "Negated*", value: result.negatedCount, color: "#555" },
                { label: "Unicorn Signals", value: result.unicornFound.length, color: "#22c55e" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "34px", fontFamily: "'Bebas Neue',sans-serif", color: s.color, letterSpacing: "2px" }}>{s.value}</div>
                  <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#777", marginTop: "4px" }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {result.negatedCount > 0 && (
              <div style={{ fontSize: "10px", color: "#777", marginBottom: "24px", letterSpacing: "1px" }}>
                * Negated matches score at half weight. Still shown below — human call required.
              </div>
            )}

            {/* Compensation */}
            <div style={{ border: "1px solid #1a1a1a", padding: "16px 20px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0c0c0c" }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#888" }}>COMPENSATION</div>
              <div style={{ fontSize: "13px", letterSpacing: "0.5px", color: result.rateAssessment.color === "green" ? "#22c55e" : result.rateAssessment.color === "yellow" ? "#f59e0b" : result.rateAssessment.color === "red" ? "#ef4444" : "#555" }}>
                {result.rateAssessment.label}
              </div>
            </div>

            {/* Flags */}
            {result.flagResults.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", marginBottom: "16px" }}>
                  PHRASES DETECTED — READ EACH SENTENCE, MAKE THE CALL
                </div>
                {result.flagResults.map(({ flag, matches }) => (
                  <div key={flag.id} style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "1px", color: flag.risk === "red" ? "#ef4444" : "#f59e0b" }}>{flag.label}</div>
                      <div style={{ fontSize: "10px", color: "#777", letterSpacing: "1px" }}>{flag.risk === "red" ? "🔴 PASS signal" : "🟡 INVESTIGATE"}</div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "10px", lineHeight: "1.5" }}>{flag.translation}</div>
                    {matches.map((m, i) => (
                      <div key={i} className="match-block" style={{ borderLeftColor: m.negated ? "#444" : flag.risk === "red" ? "#ef4444" : "#f59e0b" }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "10px", letterSpacing: "1.5px", color: m.negated ? "#777" : flag.risk === "red" ? "#ef4444" : "#f59e0b" }}>
                            MATCHED: "{m.phrase}"
                          </span>
                          {m.negated && <span className="negated-badge">⚠ POSSIBLY NEGATED — HALF WEIGHT</span>}
                        </div>
                        <div className="sentence-quote">"{m.sentence}"</div>
                        {m.negated && (
                          <div style={{ fontSize: "10px", color: "#777", marginTop: "8px", letterSpacing: "0.5px" }}>
                            → Does this sentence neutralize the concern? Your call.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Unicorns */}
            {result.unicornFound.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", marginBottom: "12px" }}>UNICORN SIGNALS FOUND</div>
                {result.unicornFound.map(s => (
                  <span key={s.phrase} className="tag" style={{ color: "#22c55e", borderColor: "#166534" }}>{s.label}</span>
                ))}
              </div>
            )}

            {/* Decision rules */}
            <div style={{ border: "1px solid #1a1a1a", background: "#0c0c0c", padding: "20px 24px", marginBottom: "32px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#888", marginBottom: "14px" }}>DECISION RULES</div>
              {[
                "Could this swallow me? → Acceptable if cash compensates.",
                "If it does, will I exit calmly at 6 months? → That's the only question.",
                "No sunk-cost thinking. No 'just another sprint.' No 'they need me.'",
              ].map((r, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#bbb", lineHeight: "1.7", borderBottom: i < 2 ? "1px solid #222" : "none", paddingBottom: i < 2 ? "10px" : "0", marginBottom: i < 2 ? "10px" : "0" }}>
                  <span style={{ color: "#555", marginRight: "12px" }}>{String(i+1).padStart(2,"0")}</span>{r}
                </div>
              ))}
            </div>

            <button className="reset-btn" onClick={reset}>← Check Another Posting</button>
          </div>
        )}

        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #222", fontSize: "10px", color: "#555", letterSpacing: "2px", display: "flex", justifyContent: "space-between" }}>
          <span>JOB POSTING REALITY CHECK</span>
          <span>PROTECT DEEP WORK. PRICE THE RISK.</span>
        </div>
      </div>
    </div>
  );
}
