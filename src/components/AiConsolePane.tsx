import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Code2,
  CornerDownLeft,
  Image as ImageIcon,
  Loader2,
  Music,
  Paperclip,
  RotateCcw,
  Sliders,
  Sparkles,
} from "lucide-react";
import { MODIFIER_CHIPS } from "../data/initialData";
import { useStudio } from "../context/StudioContext";
import type { AiModelOption } from "../types/arcade";

export function AiConsolePane() {
  const {
    activeProject,
    selectedModel,
    setSelectedModel,
    isGenerating,
    generationError,
    clearGenerationError,
    sendPrompt,
    clearChatHistory,
    draftPrompt,
    setDraftPrompt,
    setActiveSection,
    setCodeModalOpen,
  } = useStudio();

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeProject.messages.length, isGenerating]);

  const handleSubmit = async () => {
    if (!draftPrompt.trim() || isGenerating) return;
    const text = draftPrompt;
    setDraftPrompt("");
    await sendPrompt(text);
  };

  const tokenEstimate = Math.min(512, Math.max(0, Math.round(draftPrompt.trim().length / 3.5)));

  return (
    <section className="w-full md:w-[350px] xl:w-[390px] shrink-0 bg-[#1a1c20] border-r border-white/[0.06] flex flex-col h-full z-10">
      {/* Chat Header */}
      <div className="px-3.5 py-3 bg-[#1e2024] border-b border-white/[0.05] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isGenerating ? "bg-[#ffb0cd] animate-ping" : "bg-[#4cd7f6]"
            }`}
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm text-[#e2e2e8] font-bold tracking-tight whitespace-nowrap">
                AI Game Engine
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#282a2e] text-[#4cd7f6] font-mono text-[10px]">
                v4.2
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#4cd7f6]/80 truncate">
              {isGenerating ? "Synthesizing Canvas2D Build..." : "Active Engine Ready"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as AiModelOption)}
              aria-label="Select AI Game Model"
              className="appearance-none bg-[#282a2e] text-[#e2e2e8] hover:text-[#4cd7f6] font-mono text-[10px] py-1.5 pl-2.5 pr-6 rounded-lg cursor-pointer border border-white/[0.05] focus:outline-none focus:ring-1 focus:ring-[#4cd7f6] transition-colors"
            >
              <option value="ArcadeCraft-v4-Turbo">ArcadeCraft-v4-Turbo</option>
              <option value="PhysicsGPT-2D">PhysicsGPT-2D</option>
              <option value="RapidProto-Lite">RapidProto-Lite</option>
            </select>
            <ChevronDown className="w-3 h-3 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#bcc9cd]" />
          </div>
          <button
            type="button"
            onClick={clearChatHistory}
            className="p-1.5 rounded-lg text-[#bcc9cd] hover:text-[#e2e2e8] hover:bg-[#282a2e] transition-colors cursor-pointer"
            title="Clear chat history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Message History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
        {activeProject.messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 mb-1 mr-1 font-mono text-[10px]">
                <span className="text-[#869397]">{msg.author}</span>
                <span className="text-[#bcc9cd]">{msg.timestamp}</span>
              </div>
              <div className="max-w-[90%] p-3 rounded-2xl rounded-tr-xs bg-[#333539] text-[#e2e2e8] text-xs leading-relaxed shadow-md">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex flex-col items-start">
              <div className="flex items-center gap-1.5 mb-1 ml-1 font-mono text-[10px]">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                    msg.isError ? "bg-[#ffb4ab] text-[#690005]" : "bg-[#4cd7f6] text-[#0c0e12]"
                  }`}
                >
                  {msg.isError ? "!" : "AI"}
                </div>
                <span className={`font-bold ${msg.isError ? "text-[#ffb4ab]" : "text-[#4cd7f6]"}`}>
                  {msg.author}
                </span>
                <span className="text-[#869397]">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[94%] p-3 rounded-2xl rounded-tl-xs shadow-md border ${
                  msg.isError
                    ? "bg-[#93000a]/30 border-[#ffb4ab]/30 text-[#ffdad6]"
                    : "bg-[#1e2024] border-white/[0.05] text-[#e2e2e8]"
                }`}
              >
                {msg.versionTag && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] font-mono text-[10px] font-bold">
                      {msg.versionTag}
                    </span>
                    {msg.hotReloadMs && (
                      <span className="font-mono text-[10px] text-[#869397] tabular-nums">
                        Hot Reload: {msg.hotReloadMs}ms
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs leading-relaxed">{msg.content}</p>

                {msg.artifacts && msg.artifacts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2.5">
                    {msg.artifacts.map((art, i) => {
                      const ArtIcon =
                        art.type === "audio"
                          ? Music
                          : art.type === "sprite"
                          ? ImageIcon
                          : Code2;
                      const colorCls =
                        art.type === "audio"
                          ? "text-[#c0c1ff]"
                          : art.type === "sprite"
                          ? "text-[#ffb0cd]"
                          : "text-[#4cd7f6]";
                      return (
                        <button
                          key={`${art.name}-${i}`}
                          type="button"
                          onClick={() => setCodeModalOpen(true)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#282a2e] hover:bg-[#333539] font-mono text-[10px] ${colorCls} cursor-pointer transition-colors`}
                        >
                          <ArtIcon className="w-3 h-3" />
                          <span>{art.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {msg.deltaLines && msg.deltaLines.length > 0 && (
                  <div className="mt-2.5 p-2 rounded-lg bg-[#0c0e12] text-[#bcc9cd] font-mono text-[10px] space-y-1 border border-white/[0.04]">
                    <div className="flex items-center justify-between text-[#869397]">
                      <span>DELTA INSPECTOR</span>
                      <span className="text-[#4cd7f6] tabular-nums">
                        +{msg.addedLinesCount ?? msg.deltaLines.length * 12} lines
                      </span>
                    </div>
                    {msg.deltaLines.map((line, idx) => (
                      <div
                        key={idx}
                        className={`truncate ${
                          idx % 3 === 0
                            ? "text-[#4cd7f6]"
                            : idx % 3 === 1
                            ? "text-[#c0c1ff]"
                            : "text-[#ffb0cd]"
                        }`}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {isGenerating && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 p-3 rounded-2xl rounded-tl-xs bg-[#1e2024] border border-[#4cd7f6]/30 text-xs text-[#e2e2e8]">
              <Loader2 className="w-4 h-4 text-[#4cd7f6] animate-spin shrink-0" />
              <span className="font-mono text-[11px] text-[#4cd7f6]">
                Compiling mechanics & Web Audio via Gemini...
              </span>
            </div>
          </div>
        )}

        {generationError && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#93000a]/30 border border-[#ffb4ab]/30 text-xs text-[#ffdad6]">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-[#ffb4ab] shrink-0" />
              <span className="truncate">{generationError}</span>
            </div>
            <button
              type="button"
              onClick={clearGenerationError}
              className="font-mono text-[10px] text-[#ffb4ab] hover:underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Prompt Input Footer */}
      <div className="p-3 bg-[#0c0e12] border-t border-white/[0.06] flex flex-col gap-2">
        {/* Modifier Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {MODIFIER_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() =>
                setDraftPrompt((prev) =>
                  prev.trim() ? `${prev.trim()} ${chip.prompt}` : chip.prompt
                )
              }
              className="px-2.5 py-1 rounded-full bg-[#1e2024] hover:bg-[#282a2e] text-[#e2e2e8] hover:text-[#4cd7f6] font-mono text-[10px] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 border border-white/[0.04] cursor-pointer"
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Textarea Box */}
        <div className="p-2.5 rounded-xl bg-[#282a2e] border border-white/[0.06] focus-within:border-[#4cd7f6]/60 focus-within:shadow-[0_0_16px_rgba(6,182,212,0.28)] transition-all">
          <textarea
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={3}
            placeholder="Describe gameplay mechanics, visual style, physics or rules (e.g., 'Add double jump and coin combos')..."
            className="w-full bg-transparent resize-none text-xs text-[#e2e2e8] placeholder:text-[#869397] focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveSection("generation-nodes")}
                className="p-1 rounded text-[#bcc9cd] hover:text-[#4cd7f6] hover:bg-[#1e2024] transition-colors cursor-pointer"
                title="Open Node Pipeline parameters"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("asset-vault")}
                className="p-1 rounded text-[#bcc9cd] hover:text-[#4cd7f6] hover:bg-[#1e2024] transition-colors cursor-pointer"
                title="Attach asset from Asset Vault"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <span className="ml-1.5 font-mono text-[10px] text-[#869397] tabular-nums hidden sm:inline">
                TOKENS: {tokenEstimate}/512
              </span>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!draftPrompt.trim() || isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#06b6d4] via-[#4cd7f6] to-[#c0c1ff] text-[#0c0e12] font-display text-[11px] font-bold shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:shadow-[0_0_22px_rgba(76,215,246,0.65)] disabled:opacity-45 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isGenerating ? "BUILDING..." : "GENERATE"}</span>
              <CornerDownLeft className="w-3 h-3 opacity-75" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
