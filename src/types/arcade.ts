export type NavSection = "studio" | "asset-vault" | "generation-nodes" | "build-telemetry";

export type AspectRatioMode = "16:9" | "4:3" | "mobile" | "auto";

export type DrawerTab = "none" | "console" | "physics" | "audio";

export type AiModelOption = "ArcadeCraft-v4-Turbo" | "PhysicsGPT-2D" | "RapidProto-Lite";

export interface ArtifactBadge {
  name: string;
  type: "js" | "audio" | "sprite";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  author: string;
  timestamp: string;
  content: string;
  versionTag?: string;
  hotReloadMs?: number;
  artifacts?: ArtifactBadge[];
  deltaLines?: string[];
  addedLinesCount?: number;
  isError?: boolean;
}

export interface PipelineConfig {
  speedMultiplier: number;
  hazardDensity: number;
  bloomIntensity: number;
  synthBpm: number;
  paletteMode: "synthwave" | "cyber-cyan" | "crimson-void";
  mobileControls: boolean;
  masterVolume: number;
  enabledNodes: {
    parser: boolean;
    physics: boolean;
    shaders: boolean;
    audio: boolean;
    compiler: boolean;
  };
}

export interface GameVersion {
  id: string;
  versionTag: string;
  createdAt: string;
  summary: string;
  htmlCode: string;
  deltaLines: string[];
  artifacts: ArtifactBadge[];
}

export interface GameProject {
  id: string;
  title: string;
  genre: string;
  iconName: "motorsports" | "skull" | "rocket" | "pinball" | "swords" | "layers" | "runner" | "flare" | "space";
  updatedAtLabel: string;
  currentVersionIndex: number;
  versions: GameVersion[];
  messages: ChatMessage[];
  nodeConfig: PipelineConfig;
  highScore: number;
}

export interface SavedTemplate {
  id: string;
  title: string;
  genre: string;
  iconName: "layers" | "runner" | "flare" | "space";
  description: string;
  htmlCode: string;
  defaultPrompt: string;
}

export interface LiveTelemetry {
  fps: number;
  frameTimeMs: number;
  memoryMb: number;
  entityCount: number;
  score: number;
  highScore: number;
  speed: number;
  shield: number;
  status: "LIVE" | "PAUSED";
  fpsHistory: number[];
  frameHistory: number[];
}

export interface ConsoleEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "build";
  source: string;
  message: string;
}

export interface AssetItem {
  id: string;
  name: string;
  category: "Sprite" | "Audio" | "Shader" | "Template";
  format: string;
  sizeLabel: string;
  description: string;
  accent: "primary" | "secondary" | "tertiary";
  promptDirective: string;
  codeSnippet: string;
  synthPreset?: "laser" | "boost" | "crystal" | "bassline" | "collision";
  previewShape?: "hovercar" | "crystal" | "drone" | "grid-shader" | "sun-shader" | "dungeon-tile";
}
