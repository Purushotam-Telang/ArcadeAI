import { useMemo, useState } from "react";
import {
  Disc,
  FastForward,
  Flame,
  Gamepad2,
  Layers,
  MoreVertical,
  PlusCircle,
  Rocket,
  Search,
  Settings,
  Skull,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";
import { PROFILE_AVATAR_URL, SAVED_TEMPLATES } from "../data/initialData";
import { useStudio } from "../context/StudioContext";
import type { GameProject } from "../types/arcade";

function ProjectIcon({ name, active }: { name: GameProject["iconName"]; active: boolean }) {
  const cls = `w-4 h-4 ${active ? "text-[#4cd7f6]" : "text-[#bcc9cd] group-hover:text-[#4cd7f6]"}`;
  switch (name) {
    case "motorsports":
      return <Gamepad2 className={cls} />;
    case "skull":
      return <Skull className={cls} />;
    case "rocket":
      return <Rocket className={cls} />;
    case "pinball":
      return <Disc className={cls} />;
    case "swords":
      return <Swords className={cls} />;
    case "layers":
      return <Layers className={cls} />;
    case "runner":
      return <FastForward className={cls} />;
    case "flare":
      return <Flame className={cls} />;
    default:
      return <Sparkles className={cls} />;
  }
}

export function ProjectsSidebar() {
  const {
    projects,
    activeProject,
    selectProject,
    cloneTemplate,
    setNewGameModalOpen,
    credits,
    maxCredits,
    setSettingsModalTab,
    exportHtml5,
    showToast,
  } = useStudio();

  const [query, setQuery] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.genre.toLowerCase().includes(q) ||
        p.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [projects, query]);

  const pct = Math.min(100, Math.round((credits / maxCredits) * 100));

  return (
    <aside className="w-[248px] xl:w-[260px] shrink-0 bg-[#0c0e12] border-r border-white/[0.06] flex flex-col justify-between p-2.5 h-full z-20">
      {/* Top Section */}
      <div className="flex flex-col gap-2.5 flex-1 min-h-0">
        {/* New Game CTA */}
        <button
          type="button"
          onClick={() => setNewGameModalOpen(true)}
          className="group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] via-[#4cd7f6] to-[#c0c1ff] text-[#0c0e12] font-display text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_26px_rgba(76,215,246,0.65)] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <PlusCircle className="w-4 h-4" />
            <span className="tracking-wide">NEW GAME</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#0c0e12]/25 font-mono text-[10px] text-[#0c0e12] font-bold">
            ⌘N
          </span>
        </button>

        {/* Search Filter */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#869397]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter prompts & builds..."
            className="w-full bg-[#1a1c20] pl-8 pr-2.5 py-1.5 rounded-lg text-xs text-[#e2e2e8] placeholder:text-[#869397] border border-white/[0.04] focus:outline-none focus:border-[#4cd7f6]/50 focus:bg-[#282a2e] transition-colors"
          />
        </div>

        {/* Section Label */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="font-mono text-[10px] text-[#869397] uppercase tracking-wider">
            Recent Projects
          </span>
          <span className="font-mono text-[10px] text-[#4cd7f6] tabular-nums">
            {filteredProjects.length} ACTIVE
          </span>
        </div>

        {/* Scrollable Project List + Saved Templates */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
          {filteredProjects.length === 0 ? (
            <div className="px-2 py-4 text-center text-xs text-[#869397]">
              No matching builds.{" "}
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[#4cd7f6] hover:underline cursor-pointer"
              >
                Reset filter
              </button>
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const isActive = proj.id === activeProject.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => selectProject(proj.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectProject(proj.id);
                    }
                  }}
                  className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? "bg-[#282a2e] shadow-[inset_0_0_12px_rgba(76,215,246,0.14)] border border-[#4cd7f6]/25"
                      : "hover:bg-[#1e2024] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? "bg-[#4cd7f6]/20" : "bg-[#282a2e]"
                      }`}
                    >
                      <ProjectIcon name={proj.iconName} active={isActive} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-display text-xs font-semibold truncate ${
                            isActive ? "text-[#4cd7f6]" : "text-[#e2e2e8] group-hover:text-[#acedff]"
                          }`}
                        >
                          {proj.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] text-[#869397]">
                        <span className="text-[#bcc9cd]">{proj.genre}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{proj.updatedAtLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === proj.id ? null : proj.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[#bcc9cd] hover:text-[#e2e2e8] p-1 rounded cursor-pointer transition-opacity"
                      title="Project options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {menuOpenId === proj.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-7 w-36 bg-[#1e2024] border border-white/10 rounded-lg shadow-xl py-1 z-30"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            selectProject(proj.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#e2e2e8] hover:bg-[#282a2e] cursor-pointer"
                        >
                          Open in Runtime
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            selectProject(proj.id);
                            exportHtml5();
                            setMenuOpenId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#4cd7f6] hover:bg-[#282a2e] cursor-pointer"
                        >
                          Export HTML5
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(proj.title);
                            showToast(`Copied title: ${proj.title}`);
                            setMenuOpenId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#bcc9cd] hover:bg-[#282a2e] cursor-pointer"
                        >
                          Copy Build Name
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Saved Templates */}
          <div className="pt-3 pb-1 px-1">
            <span className="font-mono text-[10px] text-[#869397] uppercase tracking-wider">
              Saved Templates
            </span>
          </div>
          <div className="space-y-1">
            {SAVED_TEMPLATES.map((tpl) => {
              const Icon =
                tpl.iconName === "layers"
                  ? Layers
                  : tpl.iconName === "runner"
                  ? FastForward
                  : tpl.iconName === "flare"
                  ? Flame
                  : Sparkles;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => cloneTemplate(tpl)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[#bcc9cd] hover:text-[#4cd7f6] hover:bg-[#1e2024] text-xs transition-colors text-left cursor-pointer"
                  title={`Clone ${tpl.title}`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#c0c1ff] shrink-0" />
                  <span className="truncate">{tpl.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Quota & Profile Card */}
      <div className="mt-2 pt-2 border-t border-white/[0.05] flex flex-col gap-2">
        <div className="p-2.5 rounded-xl bg-[#1a1c20] border border-white/[0.04]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#4cd7f6]" />
              <span className="font-mono text-[10px] text-[#e2e2e8] font-bold">
                Prompt Tokens
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#4cd7f6] tabular-nums">
              {credits} / {maxCredits}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#333539] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-[#4cd7f6] via-[#06b6d4] to-[#c0c1ff] rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-[#869397]">Session Pool</span>
            <button
              type="button"
              onClick={() => setSettingsModalTab("upgrade")}
              className="text-[#c0c1ff] hover:text-[#e1e0ff] font-bold hover:underline cursor-pointer"
            >
              Refill / Plan
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-[#1e2024] border border-white/[0.04]">
          <div className="flex items-center gap-2 min-w-0">
            {!avatarError ? (
              <img
                src={PROFILE_AVATAR_URL}
                alt="Raven_Dev"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#4cd7f6]/40 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#3131c0] text-[#e1e0ff] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                RD
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-display text-xs text-[#e2e2e8] font-semibold truncate leading-tight">
                Raven_Dev
              </span>
              <span className="font-mono text-[10px] text-[#4cd7f6] uppercase tracking-tight">
                Pro Studio Tier
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettingsModalTab("settings")}
            className="p-1.5 rounded-md text-[#bcc9cd] hover:text-[#e2e2e8] hover:bg-[#282a2e] transition-colors cursor-pointer"
            title="Studio Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
