import { useState } from "react";
import { ArrowRight, CheckCircle2, Cpu, Eye, Music, Sliders, Sparkles, Terminal } from "lucide-react";
import { useStudio } from "../context/StudioContext";
import type { PipelineConfig } from "../types/arcade";

type NodeKey = keyof PipelineConfig["enabledNodes"];

interface PipelineNodeMeta {
  key: NodeKey;
  title: string;
  subtitle: string;
  icon: typeof Terminal;
  accent: string;
  x: number;
  y: number;
}

const NODES: PipelineNodeMeta[] = [
  {
    key: "parser",
    title: "01. Prompt Parser",
    subtitle: "Intent & Mechanics AST",
    icon: Terminal,
    accent: "#4cd7f6",
    x: 40,
    y: 110,
  },
  {
    key: "physics",
    title: "02. Physics & Velocity",
    subtitle: "60Hz Rigid-Body Loop",
    icon: Sliders,
    accent: "#c0c1ff",
    x: 270,
    y: 40,
  },
  {
    key: "shaders",
    title: "03. Visual FX & Shaders",
    subtitle: "Bloom, Grid & Palette",
    icon: Eye,
    accent: "#ff79b4",
    x: 270,
    y: 200,
  },
  {
    key: "audio",
    title: "04. Web Audio Synth",
    subtitle: "Oscillator SFX & BPM",
    icon: Music,
    accent: "#4cd7f6",
    x: 520,
    y: 110,
  },
  {
    key: "compiler",
    title: "05. RetroGL Runtime",
    subtitle: "Sandboxed HTML5 Build",
    icon: Cpu,
    accent: "#10b981",
    x: 750,
    y: 110,
  },
];

export function NodePipelineView() {
  const {
    activeProject,
    activeVersion,
    updateNodeConfig,
    sendPrompt,
    setActiveSection,
    isGenerating,
    showToast,
  } = useStudio();

  const [selectedNode, setSelectedNode] = useState<NodeKey>("physics");
  const cfg = activeProject.nodeConfig;

  const toggleNode = (key: NodeKey) => {
    updateNodeConfig({
      enabledNodes: {
        ...cfg.enabledNodes,
        [key]: !cfg.enabledNodes[key],
      },
    });
  };

  const handleAiRecompile = async () => {
    const prompt = `Re-compile ${activeProject.title} applying pipeline tuning: speedMultiplier=${cfg.speedMultiplier.toFixed(
      2
    )}, hazardDensity=${cfg.hazardDensity.toFixed(2)}, palette=${cfg.paletteMode}, mobileControls=${
      cfg.mobileControls
    }, synthBpm=${cfg.synthBpm}.`;
    setActiveSection("studio");
    await sendPrompt(prompt);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#111318] p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <p className="font-mono text-xs text-[#c0c1ff] uppercase tracking-wider mb-1">
              Procedural Generation Graph · {activeProject.title} ({activeVersion.versionTag})
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#e2e2e8] tracking-tight">
              Node Pipeline
            </h1>
            <p className="text-sm text-[#bcc9cd] mt-1 max-w-2xl">
              Select any pipeline node to tune live runtime physics, shaders, and Web Audio synthesis, or re-synthesize the source build via Gemini.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveSection("studio");
                showToast("Pipeline tuning synced to live runtime");
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#e2e2e8] font-mono text-xs font-semibold cursor-pointer"
            >
              <span>Open Live Viewport</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleAiRecompile}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#06b6d4] via-[#4cd7f6] to-[#c0c1ff] text-[#0c0e12] font-display text-xs font-bold shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:shadow-[0_0_24px_rgba(76,215,246,0.6)] disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Re-Synthesizing..." : "Re-Synthesize via AI"}</span>
            </button>
          </div>
        </div>

        {/* Interactive Node Graph + Parameter Inspector */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* Graph Canvas */}
          <div className="xl:col-span-8 rounded-2xl bg-[#0c0e12] border border-white/[0.07] p-4 relative overflow-x-auto min-h-[380px]">
            <div className="relative min-w-[940px] h-[340px]">
              {/* SVG Laser Edges */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 960 340">
                <defs>
                  <linearGradient id="edgeCyan" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#c0c1ff" stopOpacity="0.85" />
                  </linearGradient>
                  <linearGradient id="edgePink" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#ff79b4" stopOpacity="0.85" />
                  </linearGradient>
                </defs>
                {/* Parser -> Physics */}
                <path d="M 220 155 C 245 155, 245 85, 270 85" fill="none" stroke="url(#edgeCyan)" strokeWidth="2.5" />
                {/* Parser -> Shaders */}
                <path d="M 220 155 C 245 155, 245 245, 270 245" fill="none" stroke="url(#edgePink)" strokeWidth="2.5" />
                {/* Physics -> Audio */}
                <path d="M 455 85 C 488 85, 488 155, 520 155" fill="none" stroke="url(#edgeCyan)" strokeWidth="2.5" />
                {/* Shaders -> Audio */}
                <path d="M 455 245 C 488 245, 488 155, 520 155" fill="none" stroke="url(#edgePink)" strokeWidth="2.5" />
                {/* Audio -> Compiler */}
                <path d="M 705 155 L 750 155" fill="none" stroke="#10b981" strokeWidth="2.5" />
              </svg>

              {/* Node Cards */}
              {NODES.map((node) => {
                const Icon = node.icon;
                const enabled = cfg.enabledNodes[node.key];
                const isSelected = selectedNode === node.key;
                return (
                  <div
                    key={node.key}
                    onClick={() => setSelectedNode(node.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedNode(node.key);
                      }
                    }}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    className={`absolute w-[185px] rounded-xl p-3.5 cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-[#282a2e] border-[#4cd7f6] shadow-[0_0_24px_rgba(76,215,246,0.22)]"
                        : "bg-[#1a1c20] border-white/[0.08] hover:border-white/25"
                    } ${!enabled ? "opacity-55" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${node.accent}22`, color: node.accent }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(node.key);
                        }}
                        className={`font-mono text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                          enabled
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-[#333539] text-[#869397]"
                        }`}
                      >
                        {enabled ? "ACTIVE" : "BYPASS"}
                      </button>
                    </div>
                    <div className="font-display text-xs font-bold text-[#e2e2e8]">
                      {node.title}
                    </div>
                    <div className="font-mono text-[10px] text-[#869397] mt-0.5">
                      {node.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Node Inspector */}
          <div className="xl:col-span-4 rounded-2xl bg-[#1a1c20] border border-white/[0.07] p-5 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <span className="font-mono text-[10px] text-[#4cd7f6] uppercase tracking-wider">
                    Node Inspector
                  </span>
                  <h2 className="font-display text-lg font-bold text-[#e2e2e8]">
                    {NODES.find((n) => n.key === selectedNode)?.title}
                  </h2>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>

              {/* Controls tailored to active project */}
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#bcc9cd]">Velocity Multiplier</span>
                    <span className="text-[#4cd7f6] tabular-nums">{cfg.speedMultiplier.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.2}
                    step={0.05}
                    value={cfg.speedMultiplier}
                    onChange={(e) => updateNodeConfig({ speedMultiplier: Number(e.target.value) })}
                    className="w-full accent-[#4cd7f6] cursor-pointer"
                  />
                </label>

                <label className="block space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#bcc9cd]">Hazard Spawn Density</span>
                    <span className="text-[#ffb0cd] tabular-nums">{cfg.hazardDensity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={2.5}
                    step={0.1}
                    value={cfg.hazardDensity}
                    onChange={(e) => updateNodeConfig({ hazardDensity: Number(e.target.value) })}
                    className="w-full accent-[#ff79b4] cursor-pointer"
                  />
                </label>

                <label className="block space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#bcc9cd]">Phosphor Bloom Intensity</span>
                    <span className="text-[#c0c1ff] tabular-nums">{Math.round(cfg.bloomIntensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={2.0}
                    step={0.1}
                    value={cfg.bloomIntensity}
                    onChange={(e) => updateNodeConfig({ bloomIntensity: Number(e.target.value) })}
                    className="w-full accent-[#c0c1ff] cursor-pointer"
                  />
                </label>

                <div className="space-y-1.5">
                  <span className="font-mono text-xs text-[#bcc9cd] block">Color Palette Shader</span>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                    {(
                      [
                        { id: "synthwave", label: "Synthwave" },
                        { id: "cyber-cyan", label: "Cyber Cyan" },
                        { id: "crimson-void", label: "Crimson" },
                      ] as const
                    ).map((pal) => (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => updateNodeConfig({ paletteMode: pal.id })}
                        className={`py-2 px-2 rounded-lg border transition-colors cursor-pointer ${
                          cfg.paletteMode === pal.id
                            ? "bg-[#282a2e] border-[#4cd7f6] text-[#4cd7f6] font-bold"
                            : "bg-[#0c0e12] border-white/[0.06] text-[#bcc9cd]"
                        }`}
                      >
                        {pal.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e12] border border-white/[0.05] cursor-pointer">
                  <span className="font-mono text-xs text-[#e2e2e8]">On-Screen Touch Controls</span>
                  <input
                    type="checkbox"
                    checked={cfg.mobileControls}
                    onChange={(e) => updateNodeConfig({ mobileControls: e.target.checked })}
                    className="w-4 h-4 accent-[#4cd7f6] cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#869397] pt-3 border-t border-white/[0.05]">
              Changes stream live to the sandboxed runtime via <span className="text-[#4cd7f6]">PA_PARAMS</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
