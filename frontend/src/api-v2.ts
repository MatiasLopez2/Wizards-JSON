import type { Wizard } from "./types-v2";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function fetchWizard(name: string): Promise<Wizard> {
  const res = await fetch(`${API_BASE}/wizards/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function runAction(wizardName: string, actionName: string, contexts: Record<string, unknown>) {
  const res = await fetch(
    `${API_BASE}/wizards/${encodeURIComponent(wizardName)}/actions/${encodeURIComponent(actionName)}/run`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contexts })
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? "Action failed");
  return json as { ok: boolean; status: number; data: unknown; result: unknown };
}

export async function executeBlock(wizardName: string, block: any, state: any) {
  const res = await fetch(`${API_BASE}/wizards/${encodeURIComponent(wizardName)}/execute-block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ block, state })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? "Block execution failed");
  return json as { results: any[]; state: any };
}

export async function evaluateCondition(wizardName: string, condition: any, state: any) {
  const res = await fetch(`${API_BASE}/wizards/${encodeURIComponent(wizardName)}/evaluate-condition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ condition, state })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? "Condition evaluation failed");
  return json as { result: boolean };
}
