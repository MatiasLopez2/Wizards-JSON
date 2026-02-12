import express from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { WizardSchema, type Wizard, RemoteActionSchema } from "./types.js";
import { renderTemplate } from "./engine/liquid.js";
import { evalJsonata } from "./engine/jsonata.js";
import { runRemoteAction } from "./engine/remoteAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT ?? 4000);

async function loadWizardByName(name: string): Promise<Wizard> {
  const filePath = path.join(__dirname, "..", "wizards", `${name}.json`);
  const raw = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  return WizardSchema.parse(parsed);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res
    .status(200)
    .type("text/plain")
    .send(
      [
        "wizard-backend is running.",
        "\nOpen the frontend dev server at http://localhost:5173",
        "\nAPI endpoints:",
        "- GET  /api/health",
        "- GET  /api/wizards/sampleWizard"
      ].join("\n")
    );
});

app.get("/api/wizards/:name", async (req, res) => {
  try {
    const wizard = await loadWizardByName(req.params.name);
    res.json(wizard);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.post("/api/evaluate/liquid", async (req, res) => {
  const Body = z.object({ template: z.string(), context: z.record(z.unknown()) });
  try {
    const { template, context } = Body.parse(req.body);
    const rendered = await renderTemplate(template, context);
    res.json({ rendered });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.post("/api/evaluate/jsonata", async (req, res) => {
  const Body = z.object({ expression: z.string(), data: z.unknown(), bindings: z.record(z.unknown()).optional() });
  try {
    const { expression, data, bindings } = Body.parse(req.body);
    const result = await evalJsonata(expression, data, bindings);
    res.json({ result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.post("/api/wizards/:name/actions/:actionName/run", async (req, res) => {
  const Body = z.object({ contexts: z.record(z.unknown()).default({}) });
  try {
    const { contexts } = Body.parse(req.body);
    const wizard = await loadWizardByName(req.params.name);
    const action = (wizard.actions ?? []).find((a) => a.name === req.params.actionName);
    if (!action) {
      res.status(404).json({ error: `Action '${req.params.actionName}' not found` });
      return;
    }

    // Re-validate single action (helps error messages if wizard is partially valid in future)
    const actionValidated = RemoteActionSchema.parse(action);

    const output = await runRemoteAction(actionValidated, contexts);
    res.json(output);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`wizard-backend listening on http://localhost:${PORT}`);
});
