import express from "express";
import cors from "cors";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { WizardSchema, type Wizard } from "./types-v2.js";
import { renderTemplate } from "./engine/liquid.js";
import { evalJsonata } from "./engine/jsonata.js";
import { runRemoteAction } from "./engine/remoteAction.js";
import { executeBlock, type ActionExecutionResult } from "./engine/actionExecutor.js";
import { evaluateCondition } from "./engine/conditionEvaluator.js";
import type { ContextEvaluationState } from "./engine/contextResolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = Number(process.env.PORT ?? 4000);

async function loadWizardByName(name: string): Promise<Wizard> {
  const filePath = path.join(__dirname, "..", "wizards", `${name}.json`);
  const raw = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  return WizardSchema.parse(parsed);
}

app.get("/", (_req, res) => {
  res
    .status(200)
    .type("text/plain")
    .send(
      [
        "wizard-backend v2 is running.",
        "\nOpen the frontend dev server at http://localhost:5173",
        "\nAPI endpoints:",
        "- GET  /api/health",
        "- GET  /api/wizards",
        "- GET  /api/wizards/:name",
        "- POST /api/wizards/:name",
        "- PUT  /api/wizards/:name",
        "- POST /api/wizards/:name/execute-block",
        "- POST /api/wizards/:name/evaluate-condition",
        "- POST /api/wizards/:name/actions/:actionName/run"
      ].join("\n")
    );
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/wizards", async (_req, res) => {
  try {
    const { readdirSync } = await import("node:fs");
    const wizardsDir = path.join(__dirname, "..", "wizards");
    const files = readdirSync(wizardsDir);
    const wizardNames = files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
    res.json({ wizards: wizardNames });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.get("/api/wizards/:name", async (req, res) => {
  try {
    const wizard = await loadWizardByName(req.params.name);
    res.json(wizard);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.post("/api/wizards/:name", async (req, res) => {
  try {
    const wizard = WizardSchema.parse(req.body);
    const filePath = path.join(__dirname, "..", "wizards", `${req.params.name}.json`);
    await writeFile(filePath, JSON.stringify(wizard, null, 2), "utf-8");
    res.json({ success: true, message: `Wizard '${req.params.name}' created` });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.put("/api/wizards/:name", async (req, res) => {
  try {
    const wizard = WizardSchema.parse(req.body);
    const filePath = path.join(__dirname, "..", "wizards", `${req.params.name}.json`);
    await writeFile(filePath, JSON.stringify(wizard, null, 2), "utf-8");
    res.json({ success: true, message: `Wizard '${req.params.name}' updated` });
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
  const Body = z.object({
    expression: z.string(),
    data: z.unknown(),
    bindings: z.record(z.unknown()).optional()
  });
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
    const action = (wizard.remoteActions ?? []).find((a) => a.name === req.params.actionName);
    if (!action) {
      res.status(404).json({ error: `Action '${req.params.actionName}' not found` });
      return;
    }

    const output = await runRemoteAction(action, contexts);
    res.json(output);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.post("/api/wizards/:name/execute-block", async (req, res) => {
  const Body = z.object({
    block: z.any(),
    state: z.object({
      currentStepValues: z.record(z.unknown()).default({}),
      allStepValues: z.record(z.record(z.unknown())).default({}),
      componentStates: z.record(z.unknown()).default({}),
      localContexts: z.record(z.unknown()).default({}),
      forEachStacks: z.array(z.any()).default([]),
      groupIndexStack: z.array(z.number()).default([])
    })
  });

  try {
    const { block, state } = Body.parse(req.body);
    const wizard = await loadWizardByName(req.params.name);

    const results: ActionExecutionResult[] = await executeBlock(block, state, wizard);

    res.json({ results, state });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.post("/api/wizards/:name/evaluate-condition", async (req, res) => {
  const Body = z.object({
    condition: z.any(),
    state: z.object({
      currentStepValues: z.record(z.unknown()).default({}),
      allStepValues: z.record(z.record(z.unknown())).default({}),
      componentStates: z.record(z.unknown()).default({}),
      localContexts: z.record(z.unknown()).default({}),
      forEachStacks: z.array(z.any()).default([]),
      groupIndexStack: z.array(z.number()).default([])
    })
  });

  try {
    const { condition, state } = Body.parse(req.body);
    const wizard = await loadWizardByName(req.params.name);

    const result = await evaluateCondition(condition, state, wizard);

    res.json({ result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`wizard-backend v2 listening on http://localhost:${PORT}`);
});
