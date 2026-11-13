import { useRef, useState } from "react";
import {
  Archive,
  Code2,
  History,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Rocket,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useStudio } from "../context/StudioContext";
import { playSynthPreset } from "../utils/soundPreview";
import type { AspectRatioMode, DrawerTab } from "../types/arcade";

export function RuntimeViewportPane() {
  const {
    activeProject,
    activeVersion,
    aspectRatio,
    setAspectRatio,
    crtEnabled,
    setCrtEnabled,
    isMuted,
    toggleMute,
    isPaused,
    togglePause,
    resetRuntime,
    drawerTab,
    setDrawerTab,
    telemetry,
    consoleLogs,
    clearConsoleLogs,
    registerIframe,
    rollbackVersion,
    updateNodeConfig,
    setCodeModalOpen,
    setShareModalMode,
    exportHtml5,
  } = useStudio();

  const viewportContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [versionMenuOpen, setVersionMenuOpen] = useState(false);

  const toggleFullscreen = () => {
    const el = viewportContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleDrawer = (tab: DrawerTab) => {
    setDrawerTab(drawerTab === tab ? "none" : tab);
  };

  const frameSizeClass =
    aspectRatio === "16:9"
      ? "w-full max-h-full aspect-video"
      : aspectRatio === "4:3"
      ? "h-full max-w-full aspect-[4/3]"
      : aspectRatio === "mobile"
      ? "h-full max-w-[340px] aspect-[9/16]"
      : "w-full h-full";

  return (
    <main className="flex-1 min-w-0 bg-[#0c0e12] flex flex-col h-full overflow-hidden p-3 relative">
      {/* Top Control Toolbar */}
      <header className="w-full min-h-[44px] px-3 py-1.5 mb-2.5 rounded-xl bg-[#1e2024] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 shadow-md">
        {/* Left: Status & Playback Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#282a2e] border border-white/[0.04]">
            <span
              className={`w-2 h-2 rounded-full ${
                isPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span
              className={`font-mono text-[10px] font-bold tracking-wider whitespace-nowrap tabular-nums ${
                isPaused ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {isPaused ? "PAUSED" : `LIVE ${telemetry.fps} FPS`}
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 font-mono text-[10px] text-[#869397] px-1 whitespace-nowrap tabular-nums">
            <span>{telemetry.frameTimeMs.toFixed(1)}ms</span>
            <span>·</span>
            <span className="text-[#4cd7f6] font-bold">#{activeVersion.versionTag}</span>
          </div>

          <div className="h-4 w-px bg-[#333539] mx-0.5" />

          <button
            type="button"
            onClick={togglePause}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-emerald-400 transition-colors cursor-pointer"
            title={isPaused ? "Resume Game Engine" : "Pause Game Engine"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={resetRuntime}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#e2e2e8] hover:text-[#4cd7f6] transition-colors cursor-pointer"
            title="Reset Game Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className={`flex items-center justify-center w-7 h-7 rounded-lg bg-[#282a2e] hover:bg-[#333539] transition-colors cursor-pointer ${
              isMuted ? "text-[#ffb4ab]" : "text-[#e2e2e8] hover:text-[#c0c1ff]"
            }`}
            title={isMuted ? "Unmute Synth Audio" : "Mute Synth Audio"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Center: Aspect Ratio & CRT Toggle */}
        <div className="hidden 2xl:flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-[#282a2e] font-mono text-[10px]">
            {(
              [
                { id: "16:9", label: "16:9" },
                { id: "4:3", label: "4:3 CRT" },
                { id: "mobile", label: "Mobile" },
                { id: "auto", label: "Auto" },
              ] as { id: AspectRatioMode; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setAspectRatio(opt.id);
                  if (opt.id === "mobile") {
                    updateNodeConfig({ mobileControls: true });
                  }
                }}
                className={`px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  aspectRatio === opt.id
                    ? "bg-[#1e2024] text-[#4cd7f6] font-bold shadow-sm"
                    : "text-[#bcc9cd] hover:text-[#e2e2e8]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg bg-[#282a2e] hover:bg-[#333539] transition-colors whitespace-nowrap">
            <input
              type="checkbox"
              checked={crtEnabled}
              onChange={(e) => setCrtEnabled(e.target.checked)}
              className="w-3 h-3 accent-[#4cd7f6] cursor-pointer"
            />
            <span className="font-mono text-[10px] text-[#e2e2e8] font-semibold">
              CRT SCANLINES
            </span>
          </label>
        </div>

        {/* Right: Version History, Code/Logic, Fullscreen, Publish */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setVersionMenuOpen((v) => !v)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#e2e2e8] font-mono text-[10px] transition-colors whitespace-nowrap cursor-pointer"
            >
              <History className="w-3 h-3 text-[#4cd7f6]" />
              <span>{activeVersion.versionTag}</span>
            </button>
            {versionMenuOpen && (
              <div className="absolute right-0 top-9 w-56 bg-[#1e2024] border border-white/10 rounded-xl shadow-2xl py-1.5 z-40">
                <div className="px-3 py-1 font-mono text-[10px] text-[#869397] uppercase border-b border-white/[0.06]">
                  Build Snapshots
                </div>
                {activeProject.versions.map((ver, idx) => (
                  <button
                    key={ver.id}
                    type="button"
                    onClick={() => {
                      rollbackVersion(idx);
                      setVersionMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#282a2e] flex items-center justify-between gap-2 cursor-pointer ${
                      idx === activeProject.currentVersionIndex
                        ? "text-[#4cd7f6] font-semibold"
                        : "text-[#e2e2e8]"
                    }`}
                  >
                    <span className="font-mono">{ver.versionTag}</span>
                    <span className="text-[10px] text-[#869397] truncate">{ver.createdAt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCodeModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#e2e2e8] hover:text-[#4cd7f6] font-mono text-[10px] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Code / Logic</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#e2e2e8] hover:text-[#4cd7f6] transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShareModalMode("publish")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#3131c0] to-[#c0c1ff] text-[#07006c] font-display text-[11px] font-bold shadow-[0_0_14px_rgba(192,193,255,0.35)] hover:shadow-[0_0_20px_rgba(192,193,255,0.55)] active:scale-95 transition-all whitespace-nowrap cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>PUBLISH</span>
          </button>
        </div>
      </header>

      {/* Center Live Playable Canvas Viewport */}
      <div
        ref={viewportContainerRef}
        className="flex-1 min-h-0 w-full relative rounded-2xl overflow-hidden shadow-[0_0_36px_rgba(6,182,212,0.14)] border border-white/[0.06] flex items-center justify-center bg-[#06080d]"
      >
        <div className={`relative ${frameSizeClass} flex items-center justify-center overflow-hidden rounded-xl bg-[#04060d]`}>
          <iframe
            key={`${activeProject.id}-${activeVersion.id}`}
            ref={registerIframe}
            srcDoc={activeVersion.htmlCode}
            sandbox="allow-scripts"
            title={`${activeProject.title} Runtime`}
            className="w-full h-full border-0 block"
          />

          {crtEnabled && (
            <>
              <div className="absolute inset-0 pointer-events-none z-20 crt-scanlines opacity-35" />
              <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_70px_rgba(0,0,0,0.75)]" />
            </>
          )}
        </div>
      </div>

      {/* Expandable Bottom Drawer (Console / Physics / Audio Mixer) */}
      {drawerTab !== "none" && (
        <div className="mt-2 rounded-xl bg-[#1a1c20] border border-white/[0.08] p-3 shadow-lg">
          {drawerTab === "console" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-[#4cd7f6] uppercase tracking-wider font-bold">
                  Runtime Console Output
                </span>
                <button
                  type="button"
                  onClick={clearConsoleLogs}
                  className="flex items-center gap-1 font-mono text-[10px] text-[#869397] hover:text-[#e2e2e8] cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
              <div className="h-28 overflow-y-auto custom-scrollbar bg-[#0c0e12] rounded-lg p-2 font-mono text-[11px] space-y-1">
                {consoleLogs.length === 0 ? (
                  <div className="text-[#869397]">No console logs yet.</div>
                ) : (
                  consoleLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-[#869397] shrink-0 tabular-nums">{log.timestamp}</span>
                      <span
                        className={`shrink-0 uppercase ${
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
          )}

          {drawerTab === "physics" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-[#bcc9cd]">Speed Scalar</span>
                  <span className="text-[#4cd7f6] tabular-nums">
                    {activeProject.nodeConfig.speedMultiplier.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.2}
                  step={0.05}
                  value={activeProject.nodeConfig.speedMultiplier}
                  onChange={(e) => updateNodeConfig({ speedMultiplier: Number(e.target.value) })}
                  className="accent-[#4cd7f6] cursor-pointer"
                />
              </label>

              <label className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-[#bcc9cd]">Hazard Density</span>
                  <span className="text-[#ffb0cd] tabular-nums">
                    {activeProject.nodeConfig.hazardDensity.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2.5}
                  step={0.1}
                  value={activeProject.nodeConfig.hazardDensity}
                  onChange={(e) => updateNodeConfig({ hazardDensity: Number(e.target.value) })}
                  className="accent-[#ff79b4] cursor-pointer"
                />
              </label>

              <label className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-[#bcc9cd]">Bloom Intensity</span>
                  <span className="text-[#c0c1ff] tabular-nums">
                    {Math.round(activeProject.nodeConfig.bloomIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={2.0}
                  step={0.1}
                  value={activeProject.nodeConfig.bloomIntensity}
                  onChange={(e) => updateNodeConfig({ bloomIntensity: Number(e.target.value) })}
                  className="accent-[#c0c1ff] cursor-pointer"
                />
              </label>

              <div className="flex items-center justify-between bg-[#0c0e12] px-3 py-2 rounded-lg">
                <span className="font-mono text-[10px] text-[#e2e2e8]">Touch Controls</span>
                <input
                  type="checkbox"
                  checked={activeProject.nodeConfig.mobileControls}
                  onChange={(e) => updateNodeConfig({ mobileControls: e.target.checked })}
                  className="w-4 h-4 accent-[#4cd7f6] cursor-pointer"
                />
              </div>
            </div>
          )}

          {drawerTab === "audio" && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1 min-w-[240px]">
                <label className="flex flex-col gap-1 flex-1 max-w-xs">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-[#bcc9cd]">Master Synth Gain</span>
                    <span className="text-[#4cd7f6] tabular-nums">
                      {Math.round(activeProject.nodeConfig.masterVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={activeProject.nodeConfig.masterVolume}
                    onChange={(e) => updateNodeConfig({ masterVolume: Number(e.target.value) })}
                    className="accent-[#4cd7f6] cursor-pointer"
                  />
                </label>

                <label className="flex flex-col gap-1 flex-1 max-w-xs">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-[#bcc9cd]">Synth Tempo</span>
                    <span className="text-[#c0c1ff] tabular-nums">
                      {activeProject.nodeConfig.synthBpm} BPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={175}
                    step={2}
                    value={activeProject.nodeConfig.synthBpm}
                    onChange={(e) => updateNodeConfig({ synthBpm: Number(e.target.value) })}
                    className="accent-[#c0c1ff] cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playSynthPreset("crystal", activeProject.nodeConfig.masterVolume)}
                  className="px-3 py-1.5 rounded-lg bg-[#282a2e] hover:bg-[#333539] font-mono text-[10px] text-[#4cd7f6] cursor-pointer"
                >
                  Test Chime
                </button>
                <button
                  type="button"
                  onClick={() => playSynthPreset("bassline", activeProject.nodeConfig.masterVolume)}
                  className="px-3 py-1.5 rounded-lg bg-[#282a2e] hover:bg-[#333539] font-mono text-[10px] text-[#c0c1ff] cursor-pointer"
                >
                  Test Bassline
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Diagnostics & Drawer Toggle Bar */}
      <footer className="w-full mt-2 rounded-xl bg-[#1e2024] border border-white/[0.06] px-3 py-2 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-3 font-mono text-[10px] min-w-0">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-[#869397]">Engine:</span>
            <span className="text-[#4cd7f6] font-bold">RetroGL v2</span>
          </div>
          <div className="hidden xl:flex items-center gap-1 whitespace-nowrap tabular-nums">
            <span className="text-[#869397]">Memory:</span>
            <span className="text-[#e2e2e8] font-semibold">{telemetry.memoryMb.toFixed(1)} MB</span>
          </div>
          <div className="hidden 2xl:flex items-center gap-1 whitespace-nowrap tabular-nums">
            <span className="text-[#869397]">Latency:</span>
            <span className="text-emerald-400 font-semibold">{telemetry.frameTimeMs.toFixed(1)}ms</span>
          </div>
          <div className="hidden 2xl:flex items-center gap-1 whitespace-nowrap tabular-nums">
            <span className="text-[#869397]">Entities:</span>
            <span className="text-[#c0c1ff] font-semibold">{telemetry.entityCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
          <button
            type="button"
            onClick={() => toggleDrawer("console")}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
              drawerTab === "console"
                ? "bg-[#282a2e] text-[#4cd7f6] font-bold"
                : "text-[#bcc9cd] hover:text-[#e2e2e8] hover:bg-[#282a2e]"
            }`}
          >
            Console ({consoleLogs.length})
          </button>
          <button
            type="button"
            onClick={() => toggleDrawer("physics")}
            className={`hidden sm:inline-block px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
              drawerTab === "physics"
                ? "bg-[#282a2e] text-[#4cd7f6] font-bold"
                : "text-[#bcc9cd] hover:text-[#e2e2e8] hover:bg-[#282a2e]"
            }`}
          >
            Physics Inspector
          </button>
          <button
            type="button"
            onClick={() => toggleDrawer("audio")}
            className={`hidden md:inline-block px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
              drawerTab === "audio"
                ? "bg-[#282a2e] text-[#4cd7f6] font-bold"
                : "text-[#bcc9cd] hover:text-[#e2e2e8] hover:bg-[#282a2e]"
            }`}
          >
            Audio Mixer
          </button>
          <button
            type="button"
            onClick={exportHtml5}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#333539] hover:bg-[#4cd7f6] text-[#c0c1ff] hover:text-[#0c0e12] transition-colors font-semibold ml-1 whitespace-nowrap cursor-pointer"
          >
            <Archive className="w-3 h-3" />
            <span>HTML5 Export</span>
          </button>
        </div>
      </footer>
    </main>
  );
}
