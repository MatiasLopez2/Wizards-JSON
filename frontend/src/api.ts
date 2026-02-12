import type { Wizard } from "./types";

export async function fetchWizard(name: string): Promise<Wizard> {
  const res = await fetch(`/api/wizards/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function runAction(wizardName: string, actionName: string, contexts: Record<string, unknown>) {
  const res = await fetch(
    `/api/wizards/${encodeURIComponent(wizardName)}/actions/${encodeURIComponent(actionName)}/run`,
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
