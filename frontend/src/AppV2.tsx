import React from "react";
import { WizardRendererV2 } from "./components-v2/WizardRendererV2";

export function AppV2() {
  const [wizardName, setWizardName] = React.useState("sampleWizard");
  const [ready, setReady] = React.useState(false);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: 16, maxWidth: 720 }}>
      <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <input value={wizardName} onChange={(e) => setWizardName(e.target.value)} placeholder="wizard name" />
        <button onClick={() => setReady(true)}>
          Load
        </button>
      </div>

      {ready ? <WizardRendererV2 wizardName={wizardName} /> : <div>Enter wizard name and click Load.</div>}
    </div>
  );
}
