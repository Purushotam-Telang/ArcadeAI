import { Activity, Cpu, Gamepad2, GitFork, Package } from "lucide-react";
import { useStudio } from "../context/StudioContext";
import type { NavSection } from "../types/arcade";

const NAV_ITEMS: { id: NavSection; label: string; icon: typeof Gamepad2 }[] = [
  { id: "studio", label: "Studio IDE", icon: Gamepad2 },
  { id: "asset-vault", label: "Asset Vault", icon: Package },
  { id: "generation-nodes", label: "Node Pipeline", icon: GitFork },
  { id: "build-telemetry", label: "Diagnostics", icon: Activity },
];

export function LeftNavRail() {
  const { activeSection, setActiveSection, telemetry } = useStudio();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-56 bg-[#1a1c20]/95 backdrop-blur-md border-r border-white/[0.06] z-40 hidden lg:flex flex-col justify-between p-2.5">
      <div className="flex flex-col gap-1">
        <div className="px-2.5 py-2 font-mono text-[10px] font-medium text-[#bcc9cd] uppercase tracking-wider">
          Arcade Library
        </div>
        <nav className="flex flex-col gap-1" aria-label="Arcade Library Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap cursor-pointer text-left ${
                  active
                    ? "bg-[#282a2e] text-[#4cd7f6] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-[#bcc9cd] hover:bg-[#282a2e]/60 hover:text-[#e2e2e8] font-normal"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Live Engine Readout */}
      <div className="p-3 bg-[#0c0e12] rounded-xl border border-white/[0.05] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#869397] uppercase tracking-wider">
            Frame Latency
          </span>
          <span className="font-mono text-[10px] text-[#4cd7f6] font-bold tabular-nums">
            {telemetry.frameTimeMs.toFixed(1)}ms
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#869397] uppercase tracking-wider">
            Active Engine
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-[#c0c1ff] font-bold">
            <Cpu className="w-3 h-3" />
            RetroGL v2
          </span>
        </div>
      </div>
    </aside>
  );
}
