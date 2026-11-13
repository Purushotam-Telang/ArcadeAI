import { StudioProvider, useStudio } from "./context/StudioContext";
import { TopBar } from "./components/TopBar";
import { LeftNavRail } from "./components/LeftNavRail";
import { StudioIdeView } from "./components/StudioIdeView";
import { AssetVaultView } from "./components/AssetVaultView";
import { NodePipelineView } from "./components/NodePipelineView";
import { DiagnosticsView } from "./components/DiagnosticsView";
import { StudioModals } from "./components/Modals";
import type { NavSection } from "./types/arcade";

const MOBILE_TABS: { id: NavSection; label: string }[] = [
  { id: "studio", label: "Studio IDE" },
  { id: "asset-vault", label: "Asset Vault" },
  { id: "generation-nodes", label: "Node Pipeline" },
  { id: "build-telemetry", label: "Diagnostics" },
];

function StudioWorkspace() {
  const { activeSection, setActiveSection, toast } = useStudio();

  return (
    <div className="min-h-screen bg-[#111318] text-[#e2e2e8]">
      <TopBar />
      <LeftNavRail />

      <div className="lg:pl-56 pt-16 min-h-screen flex flex-col">
        {/* Compact navigation bar for < lg screens */}
        <div className="flex lg:hidden items-center gap-1 px-3 py-2 bg-[#1a1c20] border-b border-white/[0.06] overflow-x-auto no-scrollbar">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === tab.id
                  ? "bg-[#282a2e] text-[#4cd7f6] font-bold"
                  : "text-[#bcc9cd]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeSection === "studio" && <StudioIdeView />}
          {activeSection === "asset-vault" && <AssetVaultView />}
          {activeSection === "generation-nodes" && <NodePipelineView />}
          {activeSection === "build-telemetry" && <DiagnosticsView />}
        </div>
      </div>

      <StudioModals />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#1e2024] border border-[#4cd7f6]/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] font-mono text-xs text-[#4cd7f6]">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <StudioWorkspace />
    </StudioProvider>
  );
}
