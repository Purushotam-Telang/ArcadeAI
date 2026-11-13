import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const MODEL_MAP: Record<string, { model: string; focus: string; thinking: ThinkingLevel }> = {
  "ArcadeCraft-v4-Turbo": {
    model: "gemini-4-hydrogen",
    focus: "High-octane 60 FPS arcade gameplay, neon procedural rendering, and tactile Web Audio synth SFX.",
    thinking: ThinkingLevel.LOW,
  },
  "PhysicsGPT-2D": {
    model: "gemini-4-hydrogen",
    focus: "Rigid-body momentum, elastic collisions, gravity wells, particle physics, and responsive input tuning.",
    thinking: ThinkingLevel.MEDIUM,
  },
  "RapidProto-Lite": {
    model: "gemini-3.1-flash-lite",
    focus: "Ultra-fast minimal arcade prototyping with crisp geometric visuals and clean collision loops.",
    thinking: ThinkingLevel.MINIMAL,
  },
};

const GAME_RUNTIME_CONTRACT = `
CRITICAL RUNTIME CONTRACT FOR GENERATED HTML5 GAME:
1. Return a COMPLETE, valid, self-contained <!DOCTYPE html> document with inline <style> and <script>.
2. The page body must have margin:0; overflow:hidden; background:#04060d; with a full-bleed <canvas id="game"></canvas> that automatically resizes to window.innerWidth x window.innerHeight.
3. Implement immediate, super-fun 60 FPS gameplay (WASD / Arrow keys + Space action + optional click/touch support). Never block gameplay behind a complex login or modal—start directly or allow instant Space/Click start & automatic play.
4. Include procedural Web Audio API sound effects (using AudioContext oscillators/gain envelopes unlocked safely on first keydown/pointerdown) and respect a local \`let isMuted = false\` and \`let masterVolume = 0.6\` variable.
5. Listen to host IDE messages via \`window.addEventListener('message', (e) => { ... })\`:
   - \`e.data?.type === 'PA_PAUSE'\`: pause simulation loop.
   - \`e.data?.type === 'PA_RESUME'\`: resume simulation loop.
   - \`e.data?.type === 'PA_RESET'\`: reset score, shield/health, entities, and restart cleanly.
   - \`e.data?.type === 'PA_MUTE'\`: set \`isMuted = Boolean(e.data.muted)\`.
   - \`e.data?.type === 'PA_PARAMS'\`: apply live tuning values from \`e.data.params\` (\`speedMultiplier\`, \`hazardDensity\`, \`bloomIntensity\`, \`synthBpm\`, \`mobileControls\`, \`paletteMode\`, \`masterVolume\`).
6. Emit telemetry to parent every ~250ms:
   \`window.parent.postMessage({ type: 'PA_TELEMETRY', fps, frameTimeMs, memoryMb, entityCount, score, highScore, speed, shield, status: paused ? 'PAUSED' : 'LIVE' }, '*');\`
   And emit console events on milestones or collisions via:
   \`window.parent.postMessage({ type: 'PA_LOG', level: 'info' | 'warn', message: '...' }, '*');\`
7. Include a clean, sleek in-canvas arcade HUD (Score, High Score, Shield/HP, Velocity/Wave) styled with neon cyan (#4cd7f6), indigo (#c0c1ff), and hot magenta (#ff79b4) on deep obsidian (#04060d) without cluttering the playfield.
8. If \`mobileControls\` is true, render translucent touch D-pad / action buttons at the bottom corners.
9. Ensure zero external network dependencies (no external CDN scripts, fonts, or external image URLs inside the generated game HTML) so it works offline when exported as a standalone HTML5 file!
`;

async function generateWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        throw err;
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  app.post("/api/games/generate", async (req, res) => {
    const startedAt = Date.now();
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured in server secrets.",
        });
      }

      const {
        prompt,
        modelId = "ArcadeCraft-v4-Turbo",
        currentTitle = "Untitled Arcade",
        currentGenre = "Arcade",
        currentHtmlCode = "",
        nodeConfig = {},
        mode = "iterate",
      } = req.body ?? {};

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "Prompt text is required." });
      }

      const route = MODEL_MAP[modelId] ?? MODEL_MAP["ArcadeCraft-v4-Turbo"];

      const systemInstruction = `You are PromptArcade Engine, an elite 2D HTML5 Canvas & Web Audio arcade game architect.
Specialization: ${route.focus}
${GAME_RUNTIME_CONTRACT}

When iterating on an existing game (\`mode === "iterate"\`), preserve what already works well in the provided HTML5 source code while thoughtfully implementing every requested mechanic, visual change, difficulty tweak, or audio upgrade.
When creating a brand-new game (\`mode === "create"\`), invent a complete, immediately playable, juicy 2D arcade game tailored to the user's prompt.`;

      const userContents =
        mode === "iterate" && currentHtmlCode
          ? `CURRENT PROJECT: "${currentTitle}" (${currentGenre})
PIPELINE TUNING PARAMS: ${JSON.stringify(nodeConfig)}

USER ITERATION REQUEST:
${prompt.trim()}

CURRENT HTML5 GAME SOURCE TO MODIFY:
\`\`\`html
${currentHtmlCode.slice(0, 32000)}
\`\`\`

Return updated JSON adhering strictly to the schema.`
          : `NEW GAME REQUEST:
${prompt.trim()}

PIPELINE TUNING PARAMS: ${JSON.stringify(nodeConfig)}

Build a complete, immediately playable HTML5 Canvas + Web Audio game from scratch and return JSON adhering strictly to the schema.`;

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: route.model,
          contents: userContents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: route.thinking },
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Concise game title (2-4 words).",
                },
                genre: {
                  type: Type.STRING,
                  description: "Single word genre label such as Arcade, Shooter, Roguelike, Physics, Action, or Platformer.",
                },
                summary: {
                  type: Type.STRING,
                  description: "Clear 1-2 sentence summary of the generated or updated mechanics, visuals, and audio.",
                },
                deltaLines: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 to 5 concise representative code lines or logic changes applied in this build.",
                },
                artifacts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING },
                    },
                    required: ["name", "type"],
                  },
                  description: "2 to 3 module badges such as Canvas2D.js, SynthBeats.mp3, or ParticleFX.glsl.",
                },
                htmlCode: {
                  type: Type.STRING,
                  description: "Complete self-contained <!DOCTYPE html> playable HTML5 Canvas game implementing the PA_TELEMETRY and PA_PAUSE/PA_RESUME/PA_RESET/PA_MUTE/PA_PARAMS postMessage contract.",
                },
              },
              required: ["title", "genre", "summary", "deltaLines", "artifacts", "htmlCode"],
            },
          },
        })
      );

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        return res.status(502).json({ error: "Gemini returned an empty response." });
      }

      const parsed = JSON.parse(rawText) as {
        title: string;
        genre: string;
        summary: string;
        deltaLines: string[];
        artifacts: { name: string; type: string }[];
        htmlCode: string;
      };

      if (!parsed.htmlCode || !parsed.htmlCode.toLowerCase().includes("<canvas")) {
        return res.status(502).json({
          error: "Generated game payload did not include a playable <canvas> runtime.",
        });
      }

      const elapsedMs = Date.now() - startedAt;
      const estimatedTokens = Math.max(
        18,
        Math.min(120, Math.round(prompt.trim().length / 4 + parsed.htmlCode.length / 320))
      );

      res.json({
        title: parsed.title || currentTitle,
        genre: parsed.genre || currentGenre,
        summary: parsed.summary || "Compiled updated HTML5 Canvas build.",
        deltaLines: Array.isArray(parsed.deltaLines) ? parsed.deltaLines.slice(0, 5) : [],
        artifacts: Array.isArray(parsed.artifacts)
          ? parsed.artifacts.slice(0, 4).map((a) => ({
              name: a.name,
              type: a.type === "audio" || a.type === "sprite" ? a.type : "js",
            }))
          : [{ name: "Canvas2D.js", type: "js" }],
        htmlCode: parsed.htmlCode,
        hotReloadMs: Math.min(480, Math.max(95, Math.round(elapsedMs * 0.08))),
        tokensUsed: estimatedTokens,
        modelUsed: route.model,
      });
    } catch (err: unknown) {
      console.error("Error in /api/games/generate:", err);
      const status = (err as { status?: number })?.status;
      const message = err instanceof Error ? err.message : "Failed to generate game build.";
      if (status === 403 || status === 400) {
        return res.status(status).json({
          error: "Gemini API key invalid or unauthorized. Please verify GEMINI_API_KEY in Settings > Secrets.",
        });
      }
      if (status === 429) {
        return res.status(429).json({
          error: "Gemini API rate limit reached. Please wait a moment and try again.",
        });
      }
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PromptArcade Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
