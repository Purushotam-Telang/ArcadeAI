import { useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Play, Search, Sparkles, Volume2 } from "lucide-react";
import { INITIAL_ASSETS, SAVED_TEMPLATES } from "../data/initialData";
import { useStudio } from "../context/StudioContext";
import { playSynthPreset } from "../utils/soundPreview";
import type { AssetItem } from "../types/arcade";

type CategoryFilter = "All" | "Sprite" | "Audio" | "Shader" | "Template";

function AssetPreview({ asset }: { asset: AssetItem }) {
  if (asset.category === "Audio") {
    return (
      <div className="h-28 w-full rounded-lg bg-[#0c0e12] border border-white/[0.05] flex items-center justify-center gap-1.5 px-4 overflow-hidden">
        {[28, 52, 74, 42, 88, 60, 36, 80, 48, 64, 30, 56].map((h, idx) => (
          <div
            key={idx}
            className={`w-1.5 rounded-full ${
              asset.accent === "tertiary"
                ? "bg-[#ff79b4]"
                : asset.accent === "secondary"
                ? "bg-[#c0c1ff]"
                : "bg-[#4cd7f6]"
            }`}
            style={{ height: `${h}%`, opacity: 0.55 + (idx % 3) * 0.15 }}
          />
        ))}
      </div>
    );
  }

  if (asset.previewShape === "hovercar") {
    return (
      <div className="h-28 w-full rounded-lg bg-gradient-to-b from-[#130722] to-[#04060d] border border-white/[0.05] flex items-center justify-center">
        <div className="w-24 h-12 rounded-xl bg-[#141d2b] border-2 border-[#4cd7f6] shadow-[0_0_20px_rgba(76,215,246,0.45)] flex flex-col items-center justify-between p-1.5">
          <div className="w-11 h-4 rounded-md bg-gradient-to-b from-[#4cd7f6] to-[#c0c1ff]" />
          <div className="w-full flex justify-between px-2">
            <div className="w-3.5 h-1.5 rounded-full bg-[#4cd7f6]" />
            <div className="w-3.5 h-1.5 rounded-full bg-[#4cd7f6]" />
          </div>
        </div>
      </div>
    );
  }

  if (asset.previewShape === "crystal") {
    return (
      <div className="h-28 w-full rounded-lg bg-[#0c0e12] border border-white/[0.05] flex items-center justify-center">
        <div className="w-12 h-12 rotate-45 bg-gradient-to-tr from-[#4cd7f6] to-[#c0c1ff] shadow-[0_0_24px_rgba(76,215,246,0.65)] flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-white/90" />
        </div>
      </div>
    );
  }

  if (asset.previewShape === "sun-shader") {
    return (
      <div className="h-28 w-full rounded-lg bg-gradient-to-b from-[#130722] to-[#04060d] border border-white/[0.05] flex items-center justify-center overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-t from-[#ff79b4] via-[#ffb0cd] to-transparent shadow-[0_0_32px_rgba(255,121,180,0.6)] flex flex-col justify-end overflow-hidden">
          <div className="w-full h-1 bg-[#0c0e12] mb-1.5" />
          <div className="w-full h-1.5 bg-[#0c0e12] mb-2" />
          <div className="w-full h-2 bg-[#0c0e12] mb-2.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-28 w-full rounded-lg bg-[#0c0e12] border border-white/[0.05] overflow-hidden relative">
      <svg className="w-full h-full" viewBox="0 0 240 112" preserveAspectRatio="none">
        <line x1="0" y1="30" x2="240" y2="30" stroke="#4cd7f6" strokeOpacity="0.25" />
        <line x1="0" y1="55" x2="240" y2="55" stroke="#4cd7f6" strokeOpacity="0.45" />
        <line x1="0" y1="86" x2="240" y2="86" stroke="#4cd7f6" strokeOpacity="0.8" />
        <line x1="120" y1="12" x2="10" y2="112" stroke="#4cd7f6" strokeOpacity="0.6" />
        <line x1="120" y1="12" x2="80" y2="112" stroke="#ff79b4" strokeOpacity="0.8" />
        <line x1="120" y1="12" x2="160" y2="112" stroke="#ff79b4" strokeOpacity="0.8" />
        <line x1="120" y1="12" x2="230" y2="112" stroke="#4cd7f6" strokeOpacity="0.6" />
      </svg>
    </div>
  );
}

export function AssetVaultView() {
  const { activeProject, injectAssetToPrompt, cloneTemplate, showToast } = useStudio();
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INITIAL_ASSETS.filter((item) => {
      const catOk = category === "All" || item.category === category;
      const qOk =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.format.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [category, search]);

  const copySnippet = (item: AssetItem) => {
    navigator.clipboard?.writeText(item.codeSnippet);
    setCopiedId(item.id);
    showToast(`Copied ${item.name} snippet`);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#111318] p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <p className="font-mono text-xs text-[#4cd7f6] uppercase tracking-wider mb-1">
              Procedural Media & Audio Library
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#e2e2e8] tracking-tight">
              Asset Vault
            </h1>
            <p className="text-sm text-[#bcc9cd] mt-1 max-w-2xl">
              Audition Web Audio synth patches, inspect Canvas2D shaders, and inject procedural modules directly into{" "}
              <span className="text-[#4cd7f6] font-medium">{activeProject.title}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#869397]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sprites, synth SFX, shaders..."
                className="w-64 bg-[#1a1c20] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs text-[#e2e2e8] placeholder:text-[#869397] focus:outline-none focus:border-[#4cd7f6]"
              />
            </div>

            <div className="flex items-center p-1 bg-[#1a1c20] border border-white/[0.06] rounded-lg font-mono text-xs">
              {(["All", "Sprite", "Audio", "Shader", "Template"] as CategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    category === cat
                      ? "bg-[#282a2e] text-[#4cd7f6] font-bold"
                      : "text-[#bcc9cd] hover:text-[#e2e2e8]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Procedural Assets Grid */}
        {category !== "Template" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-xl bg-[#1a1c20] border border-white/[0.07] p-4 flex flex-col justify-between gap-3 hover:border-[#4cd7f6]/40 transition-colors"
              >
                <div className="space-y-3">
                  <AssetPreview asset={asset} />

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-semibold text-[#e2e2e8] truncate">
                        {asset.name}
                      </h3>
                      <span className="font-mono text-[10px] text-[#869397] shrink-0 tabular-nums">
                        {asset.sizeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#bcc9cd] mt-0.5">
                      <span>{asset.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#4cd7f6]">{asset.format}</span>
                    </div>
                    <p className="text-xs text-[#bcc9cd] mt-2 leading-relaxed">
                      {asset.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {asset.synthPreset && (
                      <button
                        type="button"
                        onClick={() => playSynthPreset(asset.synthPreset, 0.45)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#c0c1ff] font-mono text-[10px] font-semibold cursor-pointer"
                        title="Audition Web Audio Patch"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Play</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copySnippet(asset)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-[#bcc9cd] hover:text-[#e2e2e8] font-mono text-[10px] cursor-pointer"
                      title="Copy code snippet"
                    >
                      {copiedId === asset.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === asset.id ? "Copied" : "Code"}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => injectAssetToPrompt(asset)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#06b6d4]/20 hover:bg-[#06b6d4] text-[#4cd7f6] hover:text-[#003640] font-mono text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Inject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Engine Starter Templates Section */}
        {(category === "All" || category === "Template") && (
          <div className="space-y-3 pt-2">
            <h2 className="font-display text-lg font-semibold text-[#e2e2e8]">
              Playable Engine Starters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {SAVED_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-xl bg-[#1e2024] border border-white/[0.06] p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="font-mono text-[10px] text-[#c0c1ff] uppercase tracking-wider">
                      {tpl.genre} Starter
                    </div>
                    <h3 className="font-display text-base font-bold text-[#e2e2e8] mt-1">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-[#bcc9cd] mt-1.5 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => cloneTemplate(tpl)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#282a2e] hover:bg-[#4cd7f6] text-[#e2e2e8] hover:text-[#0c0e12] font-mono text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Launch in Studio IDE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
