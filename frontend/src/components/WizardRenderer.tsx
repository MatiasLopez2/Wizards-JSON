import React from "react";
import type { Wizard, Step, Component } from "../types";
import { runAction } from "../api";

function getStep(wizard: Wizard, stepName: string): Step {
  const step = wizard.steps.find((s) => s.name === stepName);
  if (!step) throw new Error(`Step '${stepName}' not found`);
  return step;
}

export function WizardRenderer({ wizard }: { wizard: Wizard }) {
  const [values, setValues] = React.useState<Record<string, any>>({});
  const [currentStepName, setCurrentStepName] = React.useState(wizard.initialStep);
  const [history, setHistory] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const step = getStep(wizard, currentStepName);

  const goNext = () => {
    if (!step.nextStep) return;
    setHistory((h) => [...h, currentStepName]);
    setCurrentStepName(step.nextStep!);
  };

  const goBack = () => {
    setHistory((h) => {
      const next = [...h];
      const prev = next.pop();
      if (prev) setCurrentStepName(prev);
      return next;
    });
  };

  const setBoundValue = (component: Component, raw: string) => {
    const key = component.bind ?? component.name;
    setValues((v) => ({ ...v, [key]: raw }));
  };

  const handleAction = async (component: Component) => {
    if (!component.actionName) return;
    setError(null);
    setBusy(true);
    try {
      const out = await runAction(wizard.name, component.actionName, values);
      const assignKey = component.resultAssignTo ?? component.actionName;
      setValues((v) => ({ ...v, [assignKey]: out.result }));
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const renderComponent = (component: Component) => {
    const key = component.bind ?? component.name;
    const label = component.label ?? component.name;
    const val = values[key] ?? "";

    if (component.type === "display") {
      return (
        <div key={component.name} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
          <pre style={{ background: "#f6f6f6", padding: 12, overflowX: "auto" }}>
            {typeof val === "string" ? val : JSON.stringify(val, null, 2)}
          </pre>
        </div>
      );
    }

    if (component.type === "button") {
      return (
        <div key={component.name} style={{ marginBottom: 12 }}>
          <button disabled={busy} onClick={() => handleAction(component)}>
            {label}
          </button>
        </div>
      );
    }

    if (component.type === "select") {
      return (
        <div key={component.name} style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>{label}</label>
          <select
            value={String(val)}
            disabled={busy || component.readOnly}
            onChange={(e) => setBoundValue(component, e.target.value)}
          >
            <option value="">--</option>
            {(component.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    const inputType = component.type === "number" ? "number" : "text";
    return (
      <div key={component.name} style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>{label}</label>
        <input
          type={inputType}
          value={String(val)}
          disabled={busy || component.readOnly}
          onChange={(e) => setBoundValue(component, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{wizard.name}</div>
        {wizard.description ? <div style={{ color: "#555" }}>{wizard.description}</div> : null}
      </div>

      <div style={{ marginBottom: 10, fontWeight: 700 }}>{step.title ?? step.name}</div>

      {error ? <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div> : null}

      {step.components.map(renderComponent)}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={goBack} disabled={busy || history.length === 0}>
          Back
        </button>
        <button onClick={goNext} disabled={busy || !step.nextStep}>
          Next
        </button>
      </div>

      <details style={{ marginTop: 16 }}>
        <summary>State</summary>
        <pre style={{ background: "#f6f6f6", padding: 12, overflowX: "auto" }}>{JSON.stringify(values, null, 2)}</pre>
      </details>
    </div>
  );
}
