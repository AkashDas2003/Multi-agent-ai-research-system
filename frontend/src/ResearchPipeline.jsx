import { useState, useRef, useEffect } from "react";
import "@tabler/icons-webfont/dist/tabler-icons.min.css";
const PHASES = [
  { id: 1, key: "search", label: "Search", icon: "ti-search" },
  { id: 2, key: "extract", label: "Extract", icon: "ti-link" },
  { id: 3, key: "deep", label: "Deep Research", icon: "ti-telescope" },
  { id: 4, key: "write", label: "Write", icon: "ti-writing" },
  { id: 5, key: "critic", label: "Critic", icon: "ti-shield-check" },
];

function getTheme() {
  return {
    bg: "#080B14",
    surface: "rgba(17,24,39,0.75)",
    card: "rgba(22,27,39,0.75)",
    border: "rgba(255,255,255,0.08)",

    text: "#F8FAFC",
    textSub: "#CBD5E1",
    textMuted: "#64748B",

    accent: "#6366F1",
    accent2: "#8B5CF6",
    accent3: "#06B6D4",

    accentBg: "rgba(99,102,241,0.15)",
    accentText: "#C7D2FE",

    green: "#22C55E",
    greenBg: "rgba(34,197,94,0.12)",

    amber: "#F59E0B",
    amberBg: "rgba(245,158,11,0.12)",

    red: "#EF4444",
    redBg: "rgba(239,68,68,0.12)",

    purple: "#A78BFA",
    purpleBg: "rgba(167,139,250,0.12)",

    termBg: "#050814",
    termText: "#4ADE80",

    inputBg: "rgba(255,255,255,0.04)",
  };
}

// ── PDF export using jsPDF ──────────────────────────────────────
async function exportToPDF(result, topic) {
  // Dynamically load jsPDF from CDN
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210, H = 297;
  const ml = 18, mr = 18, mt = 20;
  const contentW = W - ml - mr;
  let y = mt;

  const COLORS = {
    primary:   [15,  23,  42],
    secondary: [71,  85, 105],
    muted:     [148,163,184],
    accent:    [37,  99, 235],
    green:     [22, 163,  74],
    amber:     [217,119,  6],
    red:       [220, 38,  38],
    white:     [255,255,255],
    lightGray: [248,249,252],
    border:    [226,232,240],
  };

  // ── helpers ──────────────────────────────────────────────────
  const setColor = (rgb, type = "fill") => {
    if (type === "fill") doc.setFillColor(...rgb);
    else doc.setTextColor(...rgb);
  };

  const checkPage = (needed = 10) => {
    if (y + needed > H - 15) {
      doc.addPage();
      y = mt;
      drawPageFooter();
    }
  };

  const drawPageFooter = () => {
    const pg = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(8);
    setColor(COLORS.muted, "text");
    doc.text(`ResearchAI — Multi-Agent Research Report`, ml, H - 8);
    doc.text(`Page ${pg}`, W - mr, H - 8, { align: "right" });
    doc.setDrawColor(...COLORS.border);
    doc.line(ml, H - 12, W - mr, H - 12);
  };

  const sectionHeading = (label, color = COLORS.accent) => {
    checkPage(16);
    // colored left bar
    doc.setFillColor(...color);
    doc.rect(ml, y, 3, 6, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    setColor(color, "text");
    doc.text(label.toUpperCase(), ml + 6, y + 4.5);
    y += 10;
    doc.setFont("helvetica", "normal");
  };

  const bodyText = (text, fontSize = 10, color = COLORS.secondary, indent = 0) => {
    doc.setFontSize(fontSize);
    setColor(color, "text");
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentW - indent);
    lines.forEach(line => {
      checkPage(6);
      doc.text(line, ml + indent, y);
      y += 5.5;
    });
  };

  const labelText = (label, fontSize = 8, color = COLORS.muted) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    setColor(color, "text");
    doc.text(label.toUpperCase(), ml, y);
    y += 5;
    doc.setFont("helvetica", "normal");
  };

  const divider = (margin = 6) => {
    checkPage(8);
    y += margin / 2;
    doc.setDrawColor(...COLORS.border);
    doc.line(ml, y, W - mr, y);
    y += margin / 2;
  };

  const badge = (text, x, bY, color, bgColor) => {
    doc.setFontSize(8);
    const tw = doc.getTextWidth(text) + 6;
    doc.setFillColor(...bgColor);
    doc.roundedRect(x, bY - 3.5, tw, 5.5, 1.5, 1.5, "F");
    setColor(color, "text");
    doc.text(text, x + 3, bY);
    return tw + 4;
  };

  const infoBox = (label, text, iconChar, color, bgColor) => {
    checkPage(24);
    const boxH = Math.max(24, Math.ceil(doc.splitTextToSize(text, contentW / 2 - 10).length * 5.5) + 14);
    return { label, text, iconChar, color, bgColor, boxH };
  };

  const drawTwoBoxes = (box1, box2) => {
    const halfW = contentW / 2 - 3;
    const maxH = Math.max(box1.boxH, box2.boxH);
    checkPage(maxH + 4);

    [box1, box2].forEach((box, idx) => {
      const bx = ml + idx * (halfW + 6);
      doc.setFillColor(...box.bgColor);
      doc.roundedRect(bx, y, halfW, maxH, 2, 2, "F");
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(bx, y, halfW, maxH, 2, 2, "S");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      setColor(box.color, "text");
      doc.text(box.label.toUpperCase(), bx + 6, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(COLORS.secondary, "text");
      const wrapped = doc.splitTextToSize(box.text, halfW - 10);
      wrapped.forEach((line, li) => {
        doc.text(line, bx + 6, y + 14 + li * 5.2);
      });
    });
    y += maxH + 6;
  };

  // ══════════════════════════════════════════════
  // PAGE 1 — COVER
  // ══════════════════════════════════════════════

  // Deep navy header block
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 70, "F");

  // Accent stripe
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 68, W, 3, "F");

  // Brand
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.accent, "text");
  doc.text("RESEARCHAI  ·  MULTI-AGENT", ml, 16);

  // Title
  doc.setFontSize(22);
  setColor(COLORS.white, "text");
  const titleLines = doc.splitTextToSize("Research Report", contentW);
  titleLines.forEach((line, i) => { doc.text(line, ml, 32 + i * 10); });

  // Topic badge
  doc.setFontSize(11);
  setColor([147, 197, 253], "text");
  const topicLines = doc.splitTextToSize(topic || "Research Report", contentW);
  topicLines.forEach((line, i) => { doc.text(line, ml, 50 + i * 7); });

  // Date
  doc.setFontSize(8);
  setColor([100, 116, 139], "text");
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" })}`, ml, 63);

  y = 85;

  // Cover summary stats
  const stats = [
    { label: "Key Findings", value: String(result.final_report.key_findings?.length || 0) },
    { label: "Sources Scraped", value: String(result.urls?.length || 0) },
    { label: "Quality Score", value: `${result.critique?.score || "—"}/10` },
    { label: "Phases Run", value: "5" },
  ];

  const statW = contentW / 4 - 3;
  stats.forEach((s, i) => {
    const sx = ml + i * (statW + 4);
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(sx, y, statW, 22, 2, 2, "F");
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(sx, y, statW, 22, 2, 2, "S");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.accent, "text");
    doc.text(s.value, sx + statW / 2, y + 12, { align: "center" });
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.muted, "text");
    doc.text(s.label, sx + statW / 2, y + 18, { align: "center" });
  });
  y += 30;

  // Pipeline phases visual
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.muted, "text");
  doc.text("PIPELINE PHASES", ml, y);
  y += 6;

  const phaseLabels = ["Search", "Extract", "Deep Research", "Write", "Critic"];
  const phaseW = contentW / 5;
  phaseLabels.forEach((ph, i) => {
    const px = ml + i * phaseW;
    doc.setFillColor(37, 99, 235);
    doc.circle(px + phaseW / 2, y + 5, 4, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.white, "text");
    doc.text(String(i + 1), px + phaseW / 2, y + 6.5, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.secondary, "text");
    doc.text(ph, px + phaseW / 2, y + 14, { align: "center" });
    if (i < 4) {
      doc.setDrawColor(37, 99, 235);
      doc.line(px + phaseW / 2 + 4, y + 5, px + phaseW - 4, y + 5);
    }
  });
  y += 22;
  divider(6);

  // Table of contents
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary, "text");
  doc.text("Table of Contents", ml, y);
  y += 8;

  [
    { label: "1.  Executive Summary & Detailed Analysis", pg: "2" },
    { label: "2.  Key Findings", pg: "3" },
    { label: "3.  Quality Critique", pg: "4" },
    { label: "4.  Sources & References", pg: "5" },
  ].forEach(item => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.secondary, "text");
    doc.text(item.label, ml + 4, y);
    setColor(COLORS.accent, "text");
    doc.text(item.pg, W - mr, y, { align: "right" });
    // dotted line
    doc.setDrawColor(...COLORS.border);
    const labelW = doc.getTextWidth(item.label) + ml + 8;
    doc.setLineDash([0.5, 1.5]);
    doc.line(labelW, y - 0.5, W - mr - 8, y - 0.5);
    doc.setLineDash([]);
    y += 7;
  });

  drawPageFooter();

  // ══════════════════════════════════════════════
  // PAGE 2 — REPORT
  // ══════════════════════════════════════════════
  doc.addPage();
  y = mt;
  drawPageFooter();

  // Page header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 12, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.white, "text");
  doc.text("SECTION 1 — REPORT", ml, 8);
  y = 20;

  sectionHeading("Executive Summary", COLORS.accent);
  bodyText(result.final_report.executive_summary, 10, COLORS.primary);
  y += 4;

  divider(6);
  sectionHeading("Detailed Analysis", COLORS.accent);
  bodyText(result.final_report.detailed_analysis, 10, COLORS.secondary);
  y += 4;

  divider(6);
  const limBox  = infoBox("Limitations",  result.final_report.limitations,     "!", COLORS.amber, [255,251,235]);
  const concBox = infoBox("Conclusion",   result.final_report.final_conclusion, "✓", COLORS.green, [240,253,244]);
  drawTwoBoxes(limBox, concBox);

  // ══════════════════════════════════════════════
  // PAGE 3 — KEY FINDINGS
  // ══════════════════════════════════════════════
  doc.addPage();
  y = mt;
  drawPageFooter();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 12, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.white, "text");
  doc.text("SECTION 2 — KEY FINDINGS", ml, 8);
  y = 20;

  sectionHeading(`Key Findings  (${result.final_report.key_findings.length} identified)`, COLORS.accent);

  result.final_report.key_findings.forEach((f, i) => {
    const textLines = doc.splitTextToSize(f.finding, contentW - 22);
    const evidLines = doc.splitTextToSize(`Evidence: ${f.supporting_evidence}`, contentW - 22);
    const boxH = (textLines.length + evidLines.length) * 5.5 + 26;
    checkPage(boxH + 6);

    // card bg
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(ml, y, contentW, boxH, 2, 2, "F");
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(ml, y, contentW, boxH, 2, 2, "S");

    // number badge
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(ml + 4, y + 4, 8, 8, 1.5, 1.5, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.white, "text");
    doc.text(String(i + 1), ml + 8, y + 9.5, { align: "center" });

    // finding text
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.primary, "text");
    let ty = y + 9;
    textLines.forEach(line => { doc.text(line, ml + 16, ty); ty += 5.5; });

    // confidence badge
    const conf = f.confidence === "High";
    const bx = badge(
      `${f.confidence} Confidence`,
      ml + 16, ty,
      conf ? COLORS.green : COLORS.amber,
      conf ? [240,253,244] : [255,251,235]
    );

    ty += 8; // Prevent overlap: Move down after confidence badge before drawing evidence

    // evidence
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.muted, "text");
    evidLines.forEach(line => { doc.text(line, ml + 16, ty); ty += 5; });

    y += boxH + 5;
  });

  // ══════════════════════════════════════════════
  // PAGE 4 — CRITIQUE
  // ══════════════════════════════════════════════
  doc.addPage();
  y = mt;
  drawPageFooter();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 12, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.white, "text");
  doc.text("SECTION 3 — QUALITY CRITIQUE", ml, 8);
  y = 20;

  sectionHeading("Quality Assessment", COLORS.accent);

  // Score card
  checkPage(36);
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(ml, y, contentW, 34, 3, 3, "F");
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(ml, y, contentW, 34, 3, 3, "S");

  // big score
  const score = result.critique.score;
  const scoreColor = score >= 8 ? COLORS.green : score >= 6 ? COLORS.amber : COLORS.red;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  setColor(scoreColor, "text");
  doc.text(`${score}/10`, ml + 16, y + 22);

  // score bar
  const barX = ml + 46, barY = y + 14, barW = contentW - 50, barH = 6;
  doc.setFillColor(...COLORS.border);
  doc.roundedRect(barX, barY, barW, barH, 2, 2, "F");
  doc.setFillColor(...scoreColor);
  doc.roundedRect(barX, barY, barW * (score / 10), barH, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary, "text");
  doc.text(result.critique.verdict, barX, y + 10);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.secondary, "text");
  doc.text("Automated quality assessment by critic agent", barX, y + 27);
  y += 42;

  // Three columns: strengths, weaknesses, improvements
  const critiqueGroups = [
    { label: "Strengths",    items: result.critique.strengths,            color: COLORS.green, bg: [240,253,244] },
    { label: "Weaknesses",   items: result.critique.weaknesses,           color: COLORS.red,   bg: [254,242,242] },
    { label: "Improvements", items: result.critique.areas_for_improvement,color: COLORS.accent,bg: [239,246,255] },
  ];

  const colW = (contentW - 8) / 3;
  const maxItems = Math.max(...critiqueGroups.map(g => g.items.length));
  const colH = maxItems * 16 + 16;
  checkPage(colH + 6);

  critiqueGroups.forEach((grp, gi) => {
    const cx = ml + gi * (colW + 4);
    doc.setFillColor(...grp.bg);
    doc.roundedRect(cx, y, colW, colH, 2, 2, "F");
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(cx, y, colW, colH, 2, 2, "S");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(grp.color, "text");
    doc.text(grp.label.toUpperCase(), cx + 6, y + 8);

    doc.setFont("helvetica", "normal");
    grp.items.forEach((item, ii) => {
      const itemLines = doc.splitTextToSize(`• ${item}`, colW - 10);
      doc.setFontSize(8);
      setColor(COLORS.secondary, "text");
      itemLines.forEach((line, li) => {
        doc.text(line, cx + 6, y + 16 + ii * 14 + li * 5);
      });
    });
  });
  y += colH + 8;

  // ══════════════════════════════════════════════
  // PAGE 5 — SOURCES
  // ══════════════════════════════════════════════
  doc.addPage();
  y = mt;
  drawPageFooter();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 12, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.white, "text");
  doc.text("SECTION 4 — SOURCES & REFERENCES", ml, 8);
  y = 20;

  sectionHeading(`Sources  (${result.urls?.length || 0} scraped)`, COLORS.accent);

  (result.urls || []).forEach((url, i) => {
    checkPage(14);
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(ml, y, contentW, 12, 2, 2, "F");
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(ml, y, contentW, 12, 2, 2, "S");

    // number
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(ml + 3, y + 2, 7, 7, 1.5, 1.5, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.white, "text");
    doc.text(String(i + 1), ml + 6.5, y + 7.5, { align: "center" });

    // url
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.accent, "text");
    const truncUrl = url.length > 80 ? url.slice(0, 80) + "…" : url;
    doc.text(truncUrl, ml + 14, y + 7.5);

    // scraped badge
    badge("Scraped", W - mr - 24, y + 7.5, COLORS.green, [240,253,244]);
    y += 15;
  });

  if (result.search_results) {
    y += 4;
    divider(4);
    sectionHeading("Raw Search Output", COLORS.muted);
    bodyText(result.search_results, 9, COLORS.muted);
  }

  // ── final footer on every page ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pg = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(8);
    setColor(COLORS.muted, "text");
    doc.text(`ResearchAI — Multi-Agent Research Report`, ml, H - 8);
    doc.text(`Page ${pg} of ${totalPages}`, W - mr, H - 8, { align: "right" });
    doc.setDrawColor(...COLORS.border);
    doc.line(ml, H - 12, W - mr, H - 12);
  }

  const safeFilename = (topic || "research_report").replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 40);
  doc.save(`${safeFilename}.pdf`);
}

// ── Sub-components ──────────────────────────────────────────────
function PhaseStep({ phase, status, tk, isLast }) {
  const stateColor = status === "done" ? tk.green : status === "active" ? tk.accent : tk.textMuted;
  const stateBg = status === "done" ? tk.greenBg : status === "active" ? tk.accentBg : "transparent";
  return (
    <div style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `2px solid ${stateColor}`, background: stateBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.4s ease",
          boxShadow: status === "active" ? `0 0 0 4px ${tk.accentBg}` : "none",
        }}>
          {status === "done"
            ? <i className="ti ti-check" style={{ fontSize: 14, color: stateColor }} />
            : status === "active"
            ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: tk.accent, animation: "pulse 1.2s ease infinite" }} />
            : <i className={`ti ${phase.icon}`} style={{ fontSize: 14, color: stateColor }} />
          }
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: stateColor, whiteSpace: "nowrap" }}>{phase.label}</span>
      </div>
      {!isLast && (
        <div style={{ flex: 1, height: 2, margin: "0 4px", marginBottom: 20, background: status === "done" ? tk.green : tk.border, transition: "background 0.4s ease" }} />
      )}
    </div>
  );
}

function ScoreRing({ score, tk }) {
  const r = 32, circ = 2 * Math.PI * r;
  const color = score >= 8 ? tk.green : score >= 6 ? tk.amber : tk.red;
  return (
    <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
      <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke={tk.border} strokeWidth="5" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 10)}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: tk.textMuted }}>/10</span>
      </div>
    </div>
  );
}

function LogLine({ line, tk }) {
  const isSystem = line.startsWith("[SYSTEM]");
  const isSuccess = line.startsWith("✓");
  const isError = line.startsWith("✗");
  const isPhase = line.startsWith("PHASE");
  const color = isSystem ? tk.accent : isSuccess ? tk.green : isError ? tk.red : isPhase ? tk.purple : tk.termText;
  return (
    <div style={{ fontSize: 12, lineHeight: 1.8, fontFamily: "monospace", color }}>
      {isPhase && <span style={{ color: tk.textMuted, marginRight: 8 }}>▶</span>}
      {line}
    </div>
  );
}

function SectionLabel({ children, tk }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: tk.textMuted, marginBottom: 10 }}>
      {children}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────
export default function ResearchPipeline() {
  const [topic, setTopic]         = useState("");
  const [phase, setPhase]         = useState(0);
  const [logs, setLogs]           = useState([]);
  const [result, setResult]       = useState(null);
  const [running, setRunning]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("report");
  const logRef = useRef(null);
  const tk = getTheme();

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = (msg) => setLogs(prev => [...prev, msg]);

  const handleRun = async () => {
    const t = topic.trim();
    if (!t) return;
    setRunning(true); setLogs([]); setResult(null); setPhase(0);
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    addLog(`─── Pipeline started for: "${t}" ───`);
    addLog("[SYSTEM] Connecting to backend...");
    try {
      await delay(600);  setPhase(1); addLog("PHASE 1 — SEARCH: Querying sources...");
      await delay(800);  setPhase(2); addLog("PHASE 2 — EXTRACT: Finding URLs...");
      await delay(800);  setPhase(3); addLog("PHASE 3 — DEEP RESEARCH: Scraping content...");
      addLog("[SYSTEM] Waiting for backend response (this may take 30–60s)...");
      // This will use the Render URL in production and fallback to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setPhase(4); addLog("PHASE 4 — WRITE: Synthesizing report...");
      await delay(400);
      setPhase(5); addLog("PHASE 5 — CRITIC: Evaluating quality...");
      await delay(300);
      addLog(`Quality Score: ${data.critique?.score ?? "N/A"}/10`);
      addLog(`Verdict: ${data.critique?.verdict ?? ""}`);
      addLog("─── Pipeline complete ───");
      setResult({
        search_results: data.search_results ?? "",
        urls: data.scraped_content ? (data.scraped_content.match(/https?:\/\/[^\s)"']+/g) || []) : [],
        final_report: data.final_report,
        critique: data.critique,
      });
    } catch (err) {
      addLog(`✗ Error: ${err.message}`);
      addLog("Make sure backend is running: python -m uvicorn app:app --reload");
    }
    setRunning(false);
  };

  const handleExport = async () => {
    if (!result || exporting) return;
    setExporting(true);
    try {
      await exportToPDF(result, topic);
    } catch (e) {
      console.error("PDF export failed:", e);
    }
    setExporting(false);
  };

  const cardStyle = {
  background: tk.card,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: `1px solid ${tk.border}`,
  borderRadius: 22,
  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
};
  const tabBtn = (key) => ({
    padding: "8px 16px", fontSize: 13, fontWeight: 500,
    cursor: "pointer", borderRadius: 8, border: "none",
    background: activeTab === key ? tk.accentBg : "transparent",
    color: activeTab === key ? tk.accentText : tk.textSub,
    transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
  });


 return (
  <div
    style={{
      minHeight: "100vh",
      background: tk.bg,
      fontFamily: "Inter, sans-serif",
      color: tk.text,
    }}
  >
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        background: `
          radial-gradient(circle at 15% 15%, rgba(99,102,241,.18), transparent 30%),
          radial-gradient(circle at 85% 15%, rgba(139,92,246,.15), transparent 30%),
          radial-gradient(circle at 50% 85%, rgba(6,182,212,.12), transparent 35%)
        `,
      }}
    />

    {/* Navbar */}
    ...
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  background: ${tk.bg};
  overflow-x: hidden;
}
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${tk.border}; border-radius: 4px; }
        input::placeholder { color: ${tk.textMuted}; }
        input:focus { outline: 2px solid ${tk.accent}; outline-offset: -1px; }
      `}</style>

      {/* Navbar */}
      <div style={{ borderBottom: `1px solid ${tk.border}`, background: tk.surface, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: tk.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-brain" style={{ fontSize: 16, color: tk.accent }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: tk.text }}>Omni Research</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: tk.purpleBg, color: tk.purple, letterSpacing: "0.05em" }}>MULTI-AGENT</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: tk.textMuted }}>
            {running ? "Pipeline running..." : result ? "Pipeline complete" : "Ready"}
          </span>
          {result && (
            <button
              onClick={handleExport}
              disabled={exporting}
              title="Export all sections to PDF"
              style={{
                height: 36, padding: "0 14px", fontSize: 13, fontWeight: 500,
                borderRadius: 8, border: `1px solid ${tk.border}`,
                background: exporting ? tk.border : tk.greenBg,
                color: exporting ? tk.textMuted : tk.green,
                cursor: exporting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 7,
                transition: "all 0.2s",
              }}
            >
              <i className={`ti ${exporting ? "ti-loader" : "ti-file-download"}`}
                style={{ fontSize: 15, animation: exporting ? "spin 1s linear infinite" : "none" }} />
              {exporting ? "Exporting..." : "Export PDF"}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 80px" }}>
       <div
  style={{
    textAlign: "center",
    marginBottom: 40,
  }}
>
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 14px",
      borderRadius: 999,
      background: tk.accentBg,
      color: tk.accentText,
      marginBottom: 18,
      border: `1px solid ${tk.border}`,
    }}
  >
    <i className="ti ti-sparkles" />
    AI-Powered Research Platform
  </div>

  <h1
    style={{
      margin: 0,
      fontSize: 56,
      fontWeight: 700,
      lineHeight: 1.1,
      background:
        "linear-gradient(135deg,#FFFFFF,#C7D2FE,#8B5CF6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}
  >
    Research Smarter.
    <br />
    Not Harder.
  </h1>

  <p
    style={{
      marginTop: 18,
      fontSize: 18,
      color: tk.textSub,
      maxWidth: 700,
      marginInline: "auto",
      lineHeight: 1.7,
    }}
  >
    Autonomous multi-agent workflow for search,
    extraction, deep research, report generation,
    and quality evaluation.
  </p>
</div>

        {/* Input */}
        <div style={{ ...cardStyle, padding: "20px 24px", marginBottom: 20 }}>
          <SectionLabel tk={tk}>Research topic</SectionLabel>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: tk.textMuted, pointerEvents: "none" }} />
              <input
                type="text" value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !running && handleRun()}
                placeholder="Enter any research topic..."
                style={{ width: "100%", height: 42, paddingLeft: 38, paddingRight: 14, fontSize: 14, borderRadius: 9, border: `1px solid ${tk.border}`, background: tk.inputBg, color: tk.text, fontFamily: "inherit" }}
              />
            </div>
            <button onClick={handleRun} disabled={running || !topic.trim()} style={{
              height: 42, padding: "0 22px", fontSize: 13, fontWeight: 600, borderRadius: 9, border: "none",
              cursor: (running || !topic.trim()) ? "not-allowed" : "pointer",
              background: (running || !topic.trim()) ? tk.border : tk.accent,
              color: (running || !topic.trim()) ? tk.textMuted : "#fff",
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              <i className={`ti ${running ? "ti-loader" : "ti-player-play"}`} style={{ fontSize: 15, animation: running ? "spin 1s linear infinite" : "none" }} />
              {running ? "Running..." : "Run pipeline"}
            </button>
          </div>
        </div>

        {/* Phase stepper */}
        <div style={{ ...cardStyle, padding: "20px 24px", marginBottom: 20 }}>
          <SectionLabel tk={tk}>Pipeline phases</SectionLabel>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {PHASES.map((p, i) => (
              <PhaseStep key={p.id} phase={p} tk={tk} isLast={i === PHASES.length - 1}
                status={phase === 0 ? "idle" : phase > p.id ? "done" : phase === p.id ? "active" : "idle"} />
            ))}
          </div>
        </div>

        {/* Terminal */}
        {logs.length > 0 && (
          <div style={{ background: tk.termBg, border: `1px solid ${tk.border}`, borderRadius: 14, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${tk.border}`, background: "#0A0F18" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#FF5F57","#FFBD2E","#28C840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                </div>
                <span style={{ fontSize: 12, color: "#64748B", fontFamily: "monospace" }}>pipeline.log</span>
              </div>
              {running && <span style={{ fontSize: 11, color: tk.green, fontFamily: "monospace" }}>● LIVE</span>}
            </div>
            <div ref={logRef} style={{ padding: "14px 16px", maxHeight: 200, overflowY: "auto" }}>
              {logs.map((line, i) => <LogLine key={i} line={line} tk={tk} />)}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ ...cardStyle, overflow: "hidden", animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${tk.border}`, background: tk.surface }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { key: "report",   label: "Report",       icon: "ti-file-description" },
                  { key: "findings", label: "Key Findings", icon: "ti-list-search" },
                  { key: "critique", label: "Critique",     icon: "ti-shield-check" },
                  { key: "sources",  label: "Sources",      icon: "ti-link" },
                ].map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabBtn(t.key)}>
                    <i className={`ti ${t.icon}`} style={{ fontSize: 13 }} />{t.label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: tk.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                <i className="ti ti-file-download" style={{ fontSize: 13 }} />
                All 4 sections included in PDF export
              </span>
            </div>

            <div style={{ padding: "24px" }}>

              {activeTab === "report" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <SectionLabel tk={tk}>Executive summary</SectionLabel>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: tk.text }}>{result.final_report.executive_summary}</p>
                  </div>
                  <div style={{ height: 1, background: tk.border }} />
                  <div>
                    <SectionLabel tk={tk}>Detailed analysis</SectionLabel>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: tk.textSub }}>{result.final_report.detailed_analysis}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {[
                      { label: "Limitations", text: result.final_report.limitations, icon: "ti-alert-triangle", color: tk.amber, bg: tk.amberBg },
                      { label: "Conclusion",  text: result.final_report.final_conclusion, icon: "ti-circle-check", color: tk.green, bg: tk.greenBg },
                    ].map(c => (
                      <div key={c.label} style={{ background: c.bg, borderRadius: 10, border: `1px solid ${tk.border}`, padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                          <i className={`ti ${c.icon}`} style={{ fontSize: 14, color: c.color }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.label}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: tk.textSub }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "findings" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <SectionLabel tk={tk}>{result.final_report.key_findings.length} findings identified</SectionLabel>
                  {result.final_report.key_findings.map((f, i) => (
                    <div key={i} style={{ border: `1px solid ${tk.border}`, borderRadius: 10, padding: "16px", background: tk.surface, display: "flex", gap: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: tk.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: tk.accent }}>{i + 1}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 500, color: tk.text, lineHeight: 1.5 }}>{f.finding}</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: f.confidence === "High" ? tk.greenBg : tk.amberBg, color: f.confidence === "High" ? tk.green : tk.amber }}>
                            {f.confidence} confidence
                          </span>
                          <span style={{ fontSize: 12, color: tk.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                            <i className="ti ti-database" style={{ fontSize: 12 }} />{f.supporting_evidence}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "critique" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px", borderRadius: 12, background: "#0D1520", border: `1px solid ${tk.border}` }}>
                    <ScoreRing score={result.critique.score} tk={tk} />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: tk.text, marginBottom: 4 }}>{result.critique.verdict}</div>
                      <div style={{ fontSize: 13, color: tk.textSub }}>Automated quality assessment by critic agent</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Strengths",    items: result.critique.strengths,            icon: "ti-thumb-up",    color: tk.green,  bg: tk.greenBg },
                      { label: "Weaknesses",   items: result.critique.weaknesses,            icon: "ti-thumb-down",  color: tk.red,    bg: tk.redBg },
                      { label: "Improvements", items: result.critique.areas_for_improvement, icon: "ti-trending-up", color: tk.accent, bg: tk.accentBg },
                    ].map(sec => (
                      <div key={sec.label} style={{ background: sec.bg, borderRadius: 10, border: `1px solid ${tk.border}`, padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                          <i className={`ti ${sec.icon}`} style={{ fontSize: 14, color: sec.color }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: sec.color }}>{sec.label}</span>
                        </div>
                        {sec.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: sec.color, marginTop: 6, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, lineHeight: 1.6, color: tk.textSub }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "sources" && (
                <div>
                  <SectionLabel tk={tk}>{result.urls.length} sources scraped</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {result.urls.map((url, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, border: `1px solid ${tk.border}`, background: tk.surface }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: tk.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: tk.accent }}>{i + 1}</span>
                        </div>
                        <span style={{ fontSize: 13, color: tk.textSub, flex: 1, wordBreak: "break-all", fontFamily: "monospace" }}>{url}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, flexShrink: 0, background: tk.greenBg, color: tk.green, display: "flex", alignItems: "center", gap: 4 }}>
                          <i className="ti ti-check" style={{ fontSize: 11 }} /> Scraped
                        </span>
                      </div>
                    ))}
                  </div>
                  {result.search_results && (
                    <>
                      <div style={{ height: 1, background: tk.border, marginBottom: 16 }} />
                      <SectionLabel tk={tk}>Raw search output</SectionLabel>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: tk.textSub, fontFamily: "monospace" }}>{result.search_results}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!running && !result && (
          <div style={{ textAlign: "center", padding: "56px 20px", border: `1px dashed ${tk.border}`, borderRadius: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px", background: tk.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-telescope" style={{ fontSize: 26, color: tk.accent }} />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 500, color: tk.text }}>Ready to research</p>
            <p style={{ margin: 0, fontSize: 13, color: tk.textMuted }}>
              Type any topic above and click Run pipeline to start the autonomous research process.
            </p>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <span style={{ fontSize: 11, color: tk.textMuted }}>
            Multi-Agent Research System · Powered by LangGraph + LangChain
          </span>
        </div>
      </div>
    </div>
  );
}