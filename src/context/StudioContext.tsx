import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  AiModelOption,
  AspectRatioMode,
  AssetItem,
  ChatMessage,
  ConsoleEntry,
  DrawerTab,
  GameProject,
  GameVersion,
  LiveTelemetry,
  NavSection,
  PipelineConfig,
  SavedTemplate,
} from "../types/arcade";
import { DEFAULT_NODE_CONFIG, INITIAL_PROJECTS } from "../data/initialData";

interface StudioContextValue {
  activeSection: NavSection;
  setActiveSection: (s: NavSection) => void;
  projects: GameProject[];
  activeProject: GameProject;
  activeVersion: GameVersion;
  credits: number;
  maxCredits: number;
  addCredits: (amount: number) => void;
  selectedModel: AiModelOption;
  setSelectedModel: (m: AiModelOption) => void;
  isGenerating: boolean;
  generationError: string | null;
  clearGenerationError: () => void;
  aspectRatio: AspectRatioMode;
  setAspectRatio: (mode: AspectRatioMode) => void;
  crtEnabled: boolean;
  setCrtEnabled: (v: boolean) => void;
  isMuted: boolean;
  toggleMute: () => void;
  isPaused: boolean;
  togglePause: () => void;
  resetRuntime: () => void;
  drawerTab: DrawerTab;
  setDrawerTab: (tab: DrawerTab) => void;
  telemetry: LiveTelemetry;
  consoleLogs: ConsoleEntry[];
  clearConsoleLogs: () => void;
  registerIframe: (el: HTMLIFrameElement | null) => void;
  selectProject: (id: string) => void;
  cloneTemplate: (tpl: SavedTemplate) => void;
  createNewGame: (prompt: string, genreHint?: string) => Promise<boolean>;
  sendPrompt: (promptText: string, overrideProjectId?: string) => Promise<boolean>;
  clearChatHistory: () => void;
  rollbackVersion: (index: number) => void;
  applyDirectHtmlEdit: (newHtml: string) => void;
  updateNodeConfig: (partial: Partial<PipelineConfig>) => void;
  injectAssetToPrompt: (asset: AssetItem) => void;
  exportHtml5: () => void;
  draftPrompt: string;
  setDraftPrompt: React.Dispatch<React.SetStateAction<string>>;
  newGameModalOpen: boolean;
  setNewGameModalOpen: (v: boolean) => void;
  codeModalOpen: boolean;
  setCodeModalOpen: (v: boolean) => void;
  shareModalMode: "share" | "publish" | null;
  setShareModalMode: (m: "share" | "publish" | null) => void;
  settingsModalTab: "settings" | "upgrade" | null;
  setSettingsModalTab: (t: "settings" | "upgrade" | null) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

function formatNowTime(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function bumpVersionTag(currentTag: string): string {
  const match = currentTag.match(/v(\d+)\.(\d+)/i);
  if (!match) return "v1.1";
  const major = Number(match[1]);
  const minor = Number(match[2]) + 1;
  return `v${major}.${minor}`;
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<NavSection>("studio");
  const [projects, setProjects] = useState<GameProject[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(INITIAL_PROJECTS[0].id);
  const [credits, setCredits] = useState<number>(850);
  const maxCredits = 1000;

  const [selectedModel, setSelectedModel] = useState<AiModelOption>("ArcadeCraft-v4-Turbo");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>("16:9");
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("none");
  const [draftPrompt, setDraftPrompt] = useState<string>("");

  const [newGameModalOpen, setNewGameModalOpen] = useState<boolean>(false);
  const [codeModalOpen, setCodeModalOpen] = useState<boolean>(false);
  const [shareModalMode, setShareModalMode] = useState<"share" | "publish" | null>(null);
  const [settingsModalTab, setSettingsModalTab] = useState<"settings" | "upgrade" | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    fps: 60,
    frameTimeMs: 16.6,
    memoryMb: 42.4,
    entityCount: 148,
    score: 48290,
    highScore: 120500,
    speed: 240,
    shield: 88,
    status: "LIVE",
    fpsHistory: [59, 60, 60, 58, 60, 60, 60, 59, 60, 60, 60, 60, 59, 60, 60, 60, 60, 59, 60, 60, 60, 60, 60, 60],
    frameHistory: [16.5, 16.6, 16.4, 17.1, 16.6, 16.5, 16.6, 16.8, 16.6, 16.5, 16.6, 16.7, 16.6, 16.5, 16.6, 16.6],
  });

  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([
    {
      id: "log-init-1",
      timestamp: "10:46:12",
      level: "build",
      source: "RetroGL v2",
      message: "Mounted Cyber-Racer 2084 #v1.4.2 (60 FPS target locked)",
    },
  ]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId]
  );

  const activeVersion = useMemo(
    () =>
      activeProject.versions[activeProject.currentVersionIndex] ??
      activeProject.versions[activeProject.versions.length - 1],
    [activeProject]
  );

  const postToIframe = useCallback((payload: unknown) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(payload, "*");
    } catch {
      // ignore sandbox post errors
    }
  }, []);

  const registerIframe = useCallback(
    (el: HTMLIFrameElement | null) => {
      iframeRef.current = el;
      if (el) {
        window.setTimeout(() => {
          postToIframe({ type: "PA_MUTE", muted: isMuted });
          postToIframe({ type: "PA_PARAMS", params: activeProject.nodeConfig });
          if (isPaused) postToIframe({ type: "PA_PAUSE" });
        }, 120);
      }
    },
    [activeProject.nodeConfig, isMuted, isPaused, postToIframe]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "PA_TELEMETRY") {
        const nextFps = typeof data.fps === "number" ? data.fps : 60;
        const nextFrame = typeof data.frameTimeMs === "number" ? data.frameTimeMs : 16.6;
        setTelemetry((prev) => ({
          fps: nextFps,
          frameTimeMs: nextFrame,
          memoryMb: typeof data.memoryMb === "number" ? data.memoryMb : prev.memoryMb,
          entityCount: typeof data.entityCount === "number" ? data.entityCount : prev.entityCount,
          score: typeof data.score === "number" ? data.score : prev.score,
          highScore: typeof data.highScore === "number" ? data.highScore : prev.highScore,
          speed: typeof data.speed === "number" ? data.speed : prev.speed,
          shield: typeof data.shield === "number" ? data.shield : prev.shield,
          status: data.status === "PAUSED" ? "PAUSED" : "LIVE",
          fpsHistory: [...prev.fpsHistory.slice(-23), nextFps],
          frameHistory: [...prev.frameHistory.slice(-15), nextFrame],
        }));
      } else if (data.type === "PA_LOG" && typeof data.message === "string") {
        setConsoleLogs((prev) => [
          ...prev.slice(-79),
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            level: data.level === "warn" ? "warn" : data.level === "build" ? "build" : "info",
            source: "Runtime",
            message: data.message,
          },
        ]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Keyboard shortcut Cmd/Ctrl + N -> New Game modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setNewGameModalOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      postToIframe({ type: "PA_MUTE", muted: next });
      return next;
    });
  }, [postToIframe]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      postToIframe({ type: next ? "PA_PAUSE" : "PA_RESUME" });
      return next;
    });
  }, [postToIframe]);

  const resetRuntime = useCallback(() => {
    setIsPaused(false);
    postToIframe({ type: "PA_RESET" });
    showToast("Game session reset");
  }, [postToIframe, showToast]);

  const selectProject = useCallback(
    (id: string) => {
      setActiveProjectId(id);
      setIsPaused(false);
      setGenerationError(null);
      const target = projects.find((p) => p.id === id);
      if (target) {
        setConsoleLogs((prev) => [
          ...prev.slice(-79),
          {
            id: `sel-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            level: "build",
            source: "Studio",
            message: `Switched workspace to ${target.title} (${target.versions[target.currentVersionIndex]?.versionTag ?? "v1.0"})`,
          },
        ]);
      }
    },
    [projects]
  );

  const cloneTemplate = useCallback(
    (tpl: SavedTemplate) => {
      const id = `${tpl.id}-${Date.now()}`;
      const nowStr = formatNowTime();
      const newProj: GameProject = {
        id,
        title: tpl.title.replace(" Engine", "").replace(" Base", ""),
        genre: tpl.genre,
        iconName: tpl.iconName,
        updatedAtLabel: "Just now",
        currentVersionIndex: 0,
        highScore: 0,
        nodeConfig: { ...DEFAULT_NODE_CONFIG },
        versions: [
          {
            id: `${id}-v1`,
            versionTag: "v1.0",
            createdAt: nowStr,
            summary: tpl.description,
            htmlCode: tpl.htmlCode,
            deltaLines: [
              `initTemplate('${tpl.title}');`,
              `engine.fpsTarget = 60;`,
            ],
            artifacts: [
              { name: "Canvas2D.js", type: "js" },
              { name: "RetroSynth.mp3", type: "audio" },
            ],
          },
        ],
        messages: [
          {
            id: `${id}-m1`,
            role: "assistant",
            author: "ArcadeCraft v4",
            timestamp: nowStr,
            versionTag: "COMPILED #v1.0",
            hotReloadMs: 95,
            content: `Loaded ${tpl.title} starter template. Play right now in the viewport or type a prompt below to customize mechanics, visuals, and audio!`,
            artifacts: [
              { name: "Canvas2D.js", type: "js" },
              { name: "RetroSynth.mp3", type: "audio" },
            ],
          },
        ],
      };
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(id);
      setActiveSection("studio");
      setDraftPrompt(tpl.defaultPrompt);
      showToast(`Cloned template: ${tpl.title}`);
    },
    [showToast]
  );

  const sendPrompt = useCallback(
    async (promptText: string, overrideProjectId?: string): Promise<boolean> => {
      const trimmed = promptText.trim();
      if (!trimmed || isGenerating) return false;

      const targetId = overrideProjectId ?? activeProjectId;
      const targetProject = projects.find((p) => p.id === targetId);
      if (!targetProject) return false;

      const currentVer =
        targetProject.versions[targetProject.currentVersionIndex] ??
        targetProject.versions[targetProject.versions.length - 1];

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        author: "Raven_Dev",
        timestamp: formatNowTime(),
        content: trimmed,
      };

      setGenerationError(null);
      setIsGenerating(true);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetId
            ? { ...p, messages: [...p.messages, userMsg], updatedAtLabel: "Compiling..." }
            : p
        )
      );

      try {
        const res = await fetch("/api/games/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            modelId: selectedModel,
            currentTitle: targetProject.title,
            currentGenre: targetProject.genre,
            currentHtmlCode: currentVer.htmlCode,
            nodeConfig: targetProject.nodeConfig,
            mode: "iterate",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Generation failed (${res.status})`);
        }

        const nextVersionTag = bumpVersionTag(currentVer.versionTag);
        const newVersion: GameVersion = {
          id: `ver-${Date.now()}`,
          versionTag: nextVersionTag,
          createdAt: formatNowTime(),
          summary: data.summary,
          htmlCode: data.htmlCode,
          deltaLines: data.deltaLines ?? [],
          artifacts: data.artifacts ?? [{ name: "Canvas2D.js", type: "js" }],
        };

        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          author: selectedModel === "PhysicsGPT-2D" ? "PhysicsGPT-2D" : "ArcadeCraft v4",
          timestamp: formatNowTime(),
          versionTag: `COMPILED #${nextVersionTag}`,
          hotReloadMs: data.hotReloadMs ?? 120,
          addedLinesCount: Math.max(12, (data.deltaLines?.length ?? 3) * 14),
          content: data.summary,
          deltaLines: data.deltaLines,
          artifacts: data.artifacts,
        };

        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== targetId) return p;
            const nextVersions = [...p.versions, newVersion];
            return {
              ...p,
              genre: data.genre || p.genre,
              updatedAtLabel: "Just now",
              versions: nextVersions,
              currentVersionIndex: nextVersions.length - 1,
              messages: [...p.messages, aiMsg],
            };
          })
        );

        setCredits((c) => Math.max(0, c - (data.tokensUsed || 28)));
        setIsPaused(false);
        setConsoleLogs((prev) => [
          ...prev.slice(-79),
          {
            id: `bld-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            level: "build",
            source: data.modelUsed || "Gemini",
            message: `Hot-reloaded ${targetProject.title} ${nextVersionTag} in ${data.hotReloadMs ?? 120}ms`,
          },
        ]);
        showToast(`Compiled ${nextVersionTag} — Hot Reloaded`);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to generate build.";
        setGenerationError(msg);
        const errMsg: ChatMessage = {
          id: `e-${Date.now()}`,
          role: "assistant",
          author: "Engine Guard",
          timestamp: formatNowTime(),
          content: msg,
          isError: true,
        };
        setProjects((prev) =>
          prev.map((p) =>
            p.id === targetId
              ? { ...p, updatedAtLabel: "Error", messages: [...p.messages, errMsg] }
              : p
          )
        );
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [activeProjectId, isGenerating, projects, selectedModel, showToast]
  );

  const createNewGame = useCallback(
    async (prompt: string, genreHint = "Arcade"): Promise<boolean> => {
      const trimmed = prompt.trim();
      if (!trimmed || isGenerating) return false;

      setGenerationError(null);
      setIsGenerating(true);

      try {
        const res = await fetch("/api/games/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `${trimmed} (Genre focus: ${genreHint})`,
            modelId: selectedModel,
            nodeConfig: DEFAULT_NODE_CONFIG,
            mode: "create",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to create game (${res.status})`);
        }

        const id = `proj-${Date.now()}`;
        const nowStr = formatNowTime();
        const newProj: GameProject = {
          id,
          title: data.title || "AI Arcade Build",
          genre: data.genre || genreHint,
          iconName: "rocket",
          updatedAtLabel: "Just now",
          currentVersionIndex: 0,
          highScore: 0,
          nodeConfig: { ...DEFAULT_NODE_CONFIG },
          versions: [
            {
              id: `${id}-v1`,
              versionTag: "v1.0",
              createdAt: nowStr,
              summary: data.summary,
              htmlCode: data.htmlCode,
              deltaLines: data.deltaLines ?? [],
              artifacts: data.artifacts ?? [{ name: "Canvas2D.js", type: "js" }],
            },
          ],
          messages: [
            {
              id: `${id}-u1`,
              role: "user",
              author: "Raven_Dev",
              timestamp: nowStr,
              content: trimmed,
            },
            {
              id: `${id}-a1`,
              role: "assistant",
              author: "ArcadeCraft v4",
              timestamp: nowStr,
              versionTag: "COMPILED #v1.0",
              hotReloadMs: data.hotReloadMs ?? 135,
              addedLinesCount: 84,
              content: data.summary,
              deltaLines: data.deltaLines,
              artifacts: data.artifacts,
            },
          ],
        };

        setProjects((prev) => [newProj, ...prev]);
        setActiveProjectId(id);
        setActiveSection("studio");
        setCredits((c) => Math.max(0, c - (data.tokensUsed || 35)));
        setNewGameModalOpen(false);
        showToast(`Created ${newProj.title} v1.0`);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to generate new game.";
        setGenerationError(msg);
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, selectedModel, showToast]
  );

  const clearChatHistory = useCallback(() => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        return {
          ...p,
          messages: [
            {
              id: `clr-${Date.now()}`,
              role: "assistant",
              author: "ArcadeCraft v4",
              timestamp: formatNowTime(),
              versionTag: `ACTIVE #${activeVersion.versionTag}`,
              content: `Chat context cleared for ${p.title}. Current runtime (${activeVersion.versionTag}) remains loaded and playable.`,
            },
          ],
        };
      })
    );
    showToast("Cleared AI console thread");
  }, [activeProjectId, activeVersion.versionTag, showToast]);

  const rollbackVersion = useCallback(
    (index: number) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== activeProjectId) return p;
          const clamped = Math.max(0, Math.min(p.versions.length - 1, index));
          return { ...p, currentVersionIndex: clamped, updatedAtLabel: "Just now" };
        })
      );
      const ver = activeProject.versions[index];
      if (ver) showToast(`Switched runtime to ${ver.versionTag}`);
    },
    [activeProject.versions, activeProjectId, showToast]
  );

  const applyDirectHtmlEdit = useCallback(
    (newHtml: string) => {
      const nextTag = bumpVersionTag(activeVersion.versionTag);
      const manualVer: GameVersion = {
        id: `manual-${Date.now()}`,
        versionTag: nextTag,
        createdAt: formatNowTime(),
        summary: "Manual Code / Logic IDE patch applied.",
        htmlCode: newHtml,
        deltaLines: ["// Manual source patch applied via Code Inspector"],
        artifacts: [{ name: "Canvas2D.js", type: "js" }],
      };
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== activeProjectId) return p;
          const nextVersions = [...p.versions, manualVer];
          return {
            ...p,
            versions: nextVersions,
            currentVersionIndex: nextVersions.length - 1,
            updatedAtLabel: "Just now",
          };
        })
      );
      setCodeModalOpen(false);
      showToast(`Applied source edit (${nextTag})`);
    },
    [activeProjectId, activeVersion.versionTag, showToast]
  );

  const updateNodeConfig = useCallback(
    (partial: Partial<PipelineConfig>) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== activeProjectId) return p;
          const merged = { ...p.nodeConfig, ...partial };
          postToIframe({ type: "PA_PARAMS", params: merged });
          return { ...p, nodeConfig: merged };
        })
      );
    },
    [activeProjectId, postToIframe]
  );

  const injectAssetToPrompt = useCallback(
    (asset: AssetItem) => {
      setDraftPrompt((prev) =>
        prev.trim() ? `${prev.trim()} ${asset.promptDirective}` : asset.promptDirective
      );
      setActiveSection("studio");
      showToast(`Loaded ${asset.name} into AI Prompt Console`);
    },
    [showToast]
  );

  const exportHtml5 = useCallback(() => {
    const slug = activeProject.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const blob = new Blob([activeVersion.htmlCode], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-${activeVersion.versionTag}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${slug}-${activeVersion.versionTag}.html`);
  }, [activeProject.title, activeVersion.htmlCode, activeVersion.versionTag, showToast]);

  return (
    <StudioContext.Provider
      value={{
        activeSection,
        setActiveSection,
        projects,
        activeProject,
        activeVersion,
        credits,
        maxCredits,
        addCredits: (amt) => setCredits((c) => Math.min(maxCredits, c + amt)),
        selectedModel,
        setSelectedModel,
        isGenerating,
        generationError,
        clearGenerationError: () => setGenerationError(null),
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
        clearConsoleLogs: () => setConsoleLogs([]),
        registerIframe,
        selectProject,
        cloneTemplate,
        createNewGame,
        sendPrompt,
        clearChatHistory,
        rollbackVersion,
        applyDirectHtmlEdit,
        updateNodeConfig,
        injectAssetToPrompt,
        exportHtml5,
        draftPrompt,
        setDraftPrompt,
        newGameModalOpen,
        setNewGameModalOpen,
        codeModalOpen,
        setCodeModalOpen,
        shareModalMode,
        setShareModalMode,
        settingsModalTab,
        setSettingsModalTab,
        toast,
        showToast,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used inside StudioProvider");
  return ctx;
}
