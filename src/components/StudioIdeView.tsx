import { ProjectsSidebar } from "./ProjectsSidebar";
import { AiConsolePane } from "./AiConsolePane";
import { RuntimeViewportPane } from "./RuntimeViewportPane";

export function StudioIdeView() {
  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100vh-4rem)] overflow-hidden bg-[#0c0e12] text-[#e2e2e8]">
      <ProjectsSidebar />
      <AiConsolePane />
      <RuntimeViewportPane />
    </div>
  );
}
