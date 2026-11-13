import { useEffect, useState } from "react";
import { Check, Code2, Copy, Download, Loader2, Rocket, Sparkles, X, Zap } from "lucide-react";
import { useStudio } from "../context/StudioContext";

export function StudioModals() {
  const {
    activeProject,
    activeVersion,
    newGameModalOpen,
    setNewGameModalOpen,
    createNewGame,
    isGenerating,
    generationError,
    codeModalOpen,
    setCodeModalOpen,
    applyDirectHtmlEdit,
    shareModalMode,
    setShareModalMode,
    exportHtml5,
    settingsModalTab,
    setSettingsModalTab,
    credits,
    maxCredits,
    addCredits,
    crtEnabled,
    setCrtEnabled,
    selectedModel,
    setSelectedModel,
    showToast,
  } = useStudio();

  const [newPrompt, setNewPrompt] = useState("");
  const [genreHint, setGenreHint] = useState("Arcade");
  const [codeDraft, setCodeDraft] = useState(activeVersion.htmlCode);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    setCodeDraft(activeVersion.htmlCode);
  }, [activeVersion.id, activeVersion.htmlCode, codeModalOpen]);

  const handleCreate = async () => {
    if (!newPrompt.trim() || isGenerating) return;
    const ok = await createNewGame(newPrompt, genreHint);
    if (ok) setNewPrompt("");
  };

  return (
    <>
      {/* 1. New Game Modal */}
      {newGameModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#1a1c20] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#1e2024] border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4cd7f6]" />
                <h2 className="font-display text-base font-bold text-[#e2e2e8]">
                  Create New AI Arcade Game
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setNewGameModalOpen(false)}
                className="p-1 rounded-lg text-[#bcc9cd] hover:text-[#e2e2e8] hover:bg-[#282a2e] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-[#bcc9cd] uppercase mb-1.5">
                  Genre Focus
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Arcade", "Shooter", "Roguelike", "Platformer", "Physics"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenreHint(g)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors cursor-pointer ${
                        genreHint === g
                          ? "bg-[#282a2e] border-[#4cd7f6] text-[#4cd7f6] font-bold"
                          : "bg-[#0c0e12] border-white/[0.06] text-[#bcc9cd]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-[#bcc9cd] uppercase mb-1.5">
                  Game Prompt
                </label>
                <textarea
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={4}
                  placeholder="Describe your game concept, mechanics, win/loss rules, and visual style (e.g., 'A neon asteroid mining game with grappling hooks and laser turrets')..."
                  className="w-full rounded-xl bg-[#0c0e12] border border-white/[0.08] p-3 text-sm text-[#e2e2e8] placeholder:text-[#869397] focus:outline-none focus:border-[#4cd7f6]"
                />
              </div>

              {generationError && (
                <div className="p-2.5 rounded-lg bg-[#93000a]/30 border border-[#ffb4ab]/30 text-xs text-[#ffdad6]">
                  {generationError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewGameModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#282a2e] text-xs font-mono text-[#bcc9cd] hover:text-[#e2e2e8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newPrompt.trim() || isGenerating}
                  onClick={handleCreate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#06b6d4] via-[#4cd7f6] to-[#c0c1ff] text-[#0c0e12] font-display text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{isGenerating ? "Generating..." : "Generate Game"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Code / Logic Inspector & Editor Modal */}
      {codeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[82vh] rounded-2xl bg-[#1a1c20] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-[#1e2024] border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#4cd7f6]" />
                <h2 className="font-display text-sm font-bold text-[#e2e2e8]">
                  Code / Logic Inspector — {activeProject.title} ({activeVersion.versionTag})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(codeDraft);
                    showToast("Copied HTML5 game source");
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#282a2e] hover:bg-[#333539] font-mono text-[10px] text-[#e2e2e8] cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Source</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCodeModalOpen(false)}
                  className="p-1 rounded-lg text-[#bcc9cd] hover:text-[#e2e2e8] hover:bg-[#282a2e] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              value={codeDraft}
              onChange={(e) => setCodeDraft(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-[#0c0e12] p-4 font-mono text-xs text-[#acedff] leading-relaxed focus:outline-none resize-none"
            />

            <div className="px-5 py-3 bg-[#1e2024] border-t border-white/[0.06] flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#869397]">
                Edit HTML5 Canvas or Web Audio logic directly and hot-reload into the sandboxed viewport.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCodeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#282a2e] font-mono text-xs text-[#bcc9cd] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => applyDirectHtmlEdit(codeDraft)}
                  className="px-4 py-1.5 rounded-lg bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#003640] font-mono text-xs font-bold cursor-pointer"
                >
                  Hot-Reload Patch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Share & Publish Modal */}
      {shareModalMode && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1c20] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#1e2024] border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[#c0c1ff]" />
                <h2 className="font-display text-base font-bold text-[#e2e2e8]">
                  {shareModalMode === "publish" ? "Publish Playable Build" : "Share Arcade Project"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShareModalMode(null)}
                className="p-1 rounded-lg text-[#bcc9cd] hover:text-[#e2e2e8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#0c0e12] border border-white/[0.06] space-y-1">
                <div className="font-display text-sm font-bold text-[#4cd7f6]">
                  {activeProject.title} · {activeVersion.versionTag}
                </div>
                <p className="text-xs text-[#bcc9cd]">{activeVersion.summary}</p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    exportHtml5();
                    setShareModalMode(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] via-[#4cd7f6] to-[#c0c1ff] text-[#0c0e12] font-display text-xs font-bold cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Standalone HTML5 Game (.html)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(activeVersion.htmlCode);
                    setCopiedShare(true);
                    showToast("Copied self-contained HTML5 bundle");
                    window.setTimeout(() => setCopiedShare(false), 1800);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#282a2e] hover:bg-[#333539] text-[#e2e2e8] font-mono text-xs cursor-pointer"
                >
                  {copiedShare ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedShare ? "Bundle Copied to Clipboard" : "Copy Embeddable HTML5 Source"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Studio Settings & Credits Modal */}
      {settingsModalTab && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1c20] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#1e2024] border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4cd7f6]" />
                <h2 className="font-display text-base font-bold text-[#e2e2e8]">
                  {settingsModalTab === "upgrade" ? "Session Prompt Credits" : "Studio Preferences"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalTab(null)}
                className="p-1 rounded-lg text-[#bcc9cd] hover:text-[#e2e2e8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#0c0e12] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[#bcc9cd]">Available Session Credits</span>
                  <span className="text-[#4cd7f6] font-bold tabular-nums">
                    {credits} / {maxCredits}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#282a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4cd7f6] to-[#c0c1ff]"
                    style={{ width: `${Math.round((credits / maxCredits) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      addCredits(250);
                      showToast("Refilled +250 session prompt credits");
                    }}
                    className="font-mono text-[10px] text-[#c0c1ff] hover:underline cursor-pointer"
                  >
                    + Refill 250 Session Credits
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06] cursor-pointer">
                <span className="text-xs text-[#e2e2e8]">CRT Scanlines Overlay</span>
                <input
                  type="checkbox"
                  checked={crtEnabled}
                  onChange={(e) => setCrtEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#4cd7f6]"
                />
              </label>

              <div>
                <label className="block font-mono text-[10px] text-[#bcc9cd] uppercase mb-1.5">
                  Default AI Game Engine
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                  className="w-full bg-[#0c0e12] border border-white/[0.08] rounded-lg px-3 py-2 font-mono text-xs text-[#e2e2e8]"
                >
                  <option value="ArcadeCraft-v4-Turbo">ArcadeCraft-v4-Turbo (Gemini 4 Hydrogen)</option>
                  <option value="PhysicsGPT-2D">PhysicsGPT-2D (Physics Tuned)</option>
                  <option value="RapidProto-Lite">RapidProto-Lite (Flash Lite)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
