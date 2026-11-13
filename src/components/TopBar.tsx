import { useState } from "react";
import { Download, Share2, Zap, Gamepad2 } from "lucide-react";
import { BRAND_LOGO_URL, PROFILE_AVATAR_URL } from "../data/initialData";
import { useStudio } from "../context/StudioContext";

export function TopBar() {
  const {
    activeProject,
    activeVersion,
    credits,
    exportHtml5,
    setShareModalMode,
    setSettingsModalTab,
    isGenerating,
  } = useStudio();

  const [logoError, setLogoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0c0e12]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_12px_rgba(0,0,0,0.55)]">
      <div className="h-full w-full px-4 flex items-center justify-between gap-4">
        {/* Left: Brand + Active Project Status */}
        <div className="flex items-center gap-3 min-w-0">
          {!logoError ? (
            <img
              src={BRAND_LOGO_URL}
              alt="PromptArcade Logo"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-8 w-auto object-contain shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/20 border border-[#4cd7f6]/40 flex items-center justify-center text-[#4cd7f6] shrink-0">
              <Gamepad2 className="w-4 h-4" />
            </div>
          )}

          <span className="font-display text-lg font-semibold text-[#e2e2e8] tracking-tight whitespace-nowrap shrink-0">
            PromptArcade Studio
          </span>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#282a2e] rounded-full border border-white/[0.05] max-w-[260px]">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isGenerating ? "bg-[#ffb0cd] animate-ping" : "bg-[#4cd7f6]"
              }`}
            />
            <span className="font-mono text-[10px] font-medium text-[#4cd7f6] uppercase tracking-wider truncate">
              {activeProject.title} {activeVersion.versionTag}
            </span>
          </div>
        </div>

        {/* Right: Credits, Share, Export, Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSettingsModalTab("upgrade")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e2024] hover:bg-[#282a2e] border border-white/[0.06] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="View Prompt Credits"
          >
            <Zap className="w-3.5 h-3.5 text-[#4cd7f6]" />
            <span className="font-mono text-xs font-medium text-[#4cd7f6] tabular-nums">
              {credits} Credits
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShareModalMode("share")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#282a2e] hover:bg-[#333539] text-[#e2e2e8] rounded-lg font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={exportHtml5}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#003640] rounded-lg font-mono text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-[0_0_14px_rgba(6,182,212,0.3)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsModalTab("settings")}
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4cd7f6] cursor-pointer shrink-0"
            title="Studio Preferences"
          >
            {!avatarError ? (
              <img
                src={PROFILE_AVATAR_URL}
                alt="Raven_Dev Profile"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#4cd7f6]/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#3131c0] text-[#e1e0ff] font-mono text-xs font-bold flex items-center justify-center">
                RD
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
