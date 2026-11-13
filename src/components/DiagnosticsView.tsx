import { useState } from "react";
import { Activity, Cpu, Download, Layers, RotateCcw, Trash2 } from "lucide-react";
import { useStudio } from "../context/StudioContext";

function Sparkline({
  values,
  maxVal,
  stroke,
}: {
  values: number[];
  maxVal: number;
  stroke: string;
}) {
  const w = 420;
  const h = 96;
  const pts = values
    .map((v, i) => {
      const x = values.length > 1 ? (i / (values.length - 1)) * w : w;
      const y = h - Math.max(4, Math.min(h - 4, (v / maxVal) * (h - 12)));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="w-full h-24 overflow-visible" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <line x1="0" y1={h * 0.5} x2={w} y2={h * 0.5} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
      <polyline fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

export function DiagnosticsView() {
  const {
    activeProject,
    activeVersion,
    telemetry,
    consoleLogs,
    clearConsoleLogs,
    rollbackVersion,
    exportHtml5,
    setActiveSection,
    credits,
    maxCredits,
  } = useStudio();

  const [logFilter, setLogFilter] = useState<"all" | "build" | "info" | "warn">("all");

  const filteredLogs = consoleLogs.filter(
    (entry) => logFilter === "all" || entry.level === logFilter
  );

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#111318] p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <p className="font-mono text-xs text-[#4cd7f6] uppercase tracking-wider mb-1">
              Runtime Telemetry · {activeProject.title}
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#e2e2e8] tracking-tight">
              Diagnostics & Build Telemetry
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("studio")}
              className="px-3.5 py-2 rounded-lg bg-[#282a2e] hover:bg-[#333539] font-mono text-xs text-[#e2e2e8] cursor-pointer"
            >
              Back to Studio IDE
            </button>
            <button
              type="button"
              onClick={exportHtml5}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#003640] font-mono text-xs font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {activeVersion.versionTag}</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#1a1c20] border border-white/[0.06]">
            <div className="flex items-center justify-between text-[#869397] font-mono text-[10px] uppercase">
              <span>Frame Rate</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-display text-2xl font-bold text-emerald-400 mt-2 tabular-nums">
              {telemetry.fps} FPS
            </div>
            <div className="font-mono text-[10px] text-[#bcc9cd] mt-1">
              Status: {telemetry.status}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1a1c20] border border-white/[0.06]">
            <div className="flex items-center justify-between text-[#869397] font-mono text-[10px] uppercase">
              <span>Frame Latency</span>
              <Cpu className="w-3.5 h-3.5 text-[#4cd7f6]" />
            </div>
            <div className="font-display text-2xl font-bold text-[#4cd7f6] mt-2 tabular-nums">
              {telemetry.frameTimeMs.toFixed(1)} ms
            </div>
            <div className="font-mono text-[10px] text-[#bcc9cd] mt-1 tabular-nums">
              Heap: {telemetry.memoryMb.toFixed(1)} MB
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1a1c20] border border-white/[0.06]">
            <div className="flex items-center justify-between text-[#869397] font-mono text-[10px] uppercase">
              <span>Active Entities</span>
              <Layers className="w-3.5 h-3.5 text-[#c0c1ff]" />
            </div>
            <div className="font-display text-2xl font-bold text-[#c0c1ff] mt-2 tabular-nums">
              {telemetry.entityCount}
            </div>
            <div className="font-mono text-[10px] text-[#bcc9cd] mt-1 tabular-nums">
              Live Score: {telemetry.score.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1a1c20] border border-white/[0.06]">
            <div className="flex items-center justify-between text-[#869397] font-mono text-[10px] uppercase">
              <span>Prompt Credits</span>
              <span className="text-[#ffb0cd]">Session</span>
            </div>
            <div className="font-display text-2xl font-bold text-[#e2e2e8] mt-2 tabular-nums">
              {credits} / {maxCredits}
            </div>
            <div className="font-mono text-[10px] text-[#bcc9cd] mt-1 tabular-nums">
              Builds Compiled: {activeProject.versions.length}
            </div>
          </div>
        </div>

        {/* Live Telemetry Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-[#1a1c20] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[#e2e2e8]">
                Frame Rate Stability (60 Hz Target)
              </h2>
              <span className="font-mono text-xs text-emerald-400 tabular-nums">
                {telemetry.fps} FPS
              </span>
            </div>
            <Sparkline values={telemetry.fpsHistory} maxVal={65} stroke="#10b981" />
          </div>

          <div className="p-5 rounded-xl bg-[#1a1c20] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[#e2e2e8]">
                Frame Budget Execution (ms)
              </h2>
              <span className="font-mono text-xs text-[#4cd7f6] tabular-nums">
                {telemetry.frameTimeMs.toFixed(1)} ms
              </span>
            </div>
            <Sparkline values={telemetry.frameHistory} maxVal={34} stroke="#4cd7f6" />
          </div>
        </div>

        {/* Build Version History & Live Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Build History Table */}
          <div className="lg:col-span-6 rounded-xl bg-[#1a1c20] border border-white/[0.06] p-4 space-y-3">
            <h2 className="font-display text-sm font-semibold text-[#e2e2e8]">
              Build Snapshot History — {activeProject.title}
            </h2>
            <div className="divide-y divide-white/[0.05]">
              {activeProject.versions.map((ver, idx) => {
                const isCurrent = idx === activeProject.currentVersionIndex;
                return (
                  <div key={ver.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#4cd7f6]">
                          {ver.versionTag}
                        </span>
                        <span className="font-mono text-[10px] text-[#869397]">{ver.createdAt}</span>
                        {isCurrent && (
                          <span className="font-mono text-[10px] text-emerald-400 font-semibold">
                            · Mounted
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#bcc9cd] truncate mt-0.5">{ver.summary}</p>
                    </div>
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => rollbackVersion(idx)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#282a2e] hover:bg-[#333539] font-mono text-[10px] text-[#e2e2e8] shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Console Stream */}
          <div className="lg:col-span-6 rounded-xl bg-[#1a1c20] border border-white/[0.06] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold text-[#e2e2e8]">
                Runtime Event Stream
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#0c0e12] rounded-lg p-0.5 font-mono text-[10px]">
                  {(["all", "build", "info", "warn"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLogFilter(lvl)}
                      className={`px-2 py-1 rounded capitalize cursor-pointer ${
                        logFilter === lvl ? "bg-[#282a2e] text-[#4cd7f6]" : "text-[#869397]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={clearConsoleLogs}
                  className="p-1.5 rounded-lg bg-[#282a2e] text-[#bcc9cd] hover:text-[#e2e2e8] cursor-pointer"
                  title="Clear logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="h-52 overflow-y-auto custom-scrollbar bg-[#0c0e12] rounded-lg p-3 font-mono text-[11px] space-y-1.5">
              {filteredLogs.length === 0 ? (
                <div className="text-[#869397]">No matching runtime events.</div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-[#869397] shrink-0 tabular-nums">{log.timestamp}</span>
                    <span
                      className={`shrink-0 ${
                        log.level === "warn"
                          ? "text-[#ffb0cd]"
                          : log.level === "build"
                          ? "text-[#c0c1ff]"
                          : "text-[#4cd7f6]"
                      }`}
                    >
                      [{log.source}]
                    </span>
                    <span className="text-[#e2e2e8]">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
