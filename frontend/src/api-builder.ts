import type { Wizard } from './types-v2';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function listWizards(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/wizards`);
  if (!res.ok) throw new Error(`Failed to list wizards: ${res.statusText}`);
  const data = await res.json();
  return data.wizards;
}

export async function saveWizard(name: string, wizard: Wizard, isUpdate: boolean = false): Promise<void> {
  const method = isUpdate ? 'PUT' : 'POST';
  const res = await fetch(`${API_BASE}/wizards/${name}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(wizard)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || 'Failed to save wizard');
  }
}

export async function loadWizard(name: string): Promise<Wizard> {
  const res = await fetch(`${API_BASE}/wizards/${name}`);
  if (!res.ok) throw new Error(`Failed to load wizard: ${res.statusText}`);
  return res.json();
}
