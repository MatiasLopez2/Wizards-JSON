import React from "react";
import type { Wizard, Step, Component as WizardComponent, ContextEvaluationState } from "../types-v2";
import { executeBlock, fetchWizard } from "../api-v2";
import { ComponentRenderer } from "./ComponentRenderer";

export function WizardRendererV2({ wizardName }: { wizardName: string }) {
  const [wizard, setWizard] = React.useState<Wizard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchWizard(wizardName)
      .then(setWizard)
      .catch((e) => setLoadError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, [wizardName]);

  if (loading) return <div className="p-8 text-center">Cargando wizard...</div>;
  if (loadError) return <div className="p-8 text-red-600">Error: {loadError}</div>;
  if (!wizard) return null;

  return <WizardRenderer wizard={wizard} />;
}

function WizardRenderer({ wizard }: { wizard: Wizard }) {
  const [currentStepName, setCurrentStepName] = React.useState(wizard.initialStep);
  const [history, setHistory] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // State management
  const [state, setState] = React.useState<ContextEvaluationState>({
    currentStepValues: {},
    allStepValues: {},
    componentStates: {},
    localContexts: {},
    forEachStacks: [],
    groupIndexStack: []
  });

  // Component errors
  const [componentErrors, setComponentErrors] = React.useState<Record<string, string>>({});

  const step = wizard.steps.find((s) => s.name === currentStepName);
  if (!step) {
    return <div style={{ color: "red" }}>Step '{currentStepName}' not found</div>;
  }

  const handleEvent = async (eventType: string, componentName?: string) => {
    setError(null);
    setBusy(true);

    try {
      // Gather blocks from component or step level
      let blocks: any[] = [];

      if (componentName) {
        const comp = step.components.find((c) => c.name === componentName);
        if (comp?.events?.[eventType as any]) {
          blocks = comp.events[eventType as any] ?? [];
        }
      } else if (step.events?.[eventType as any]) {
        blocks = step.events[eventType as any] ?? [];
      }

      if (blocks.length === 0) return;

      // Execute all blocks
      for (const block of blocks.sort((a, b) => a.order - b.order)) {
        const result = await executeBlock(wizard.name, block, state);

        // Process action results
        for (const actionResult of result.results) {
          if (actionResult.error) {
            console.error(`Action error:`, actionResult.error);
            continue;
          }

          switch (actionResult.type) {
            case "GO_TO_STEP": {
              const stepName = (actionResult.payload as any)?.stepName;
              if (stepName && wizard.steps.some((s) => s.name === stepName)) {
                // Guardar historia y cambiar paso
                setHistory((h) => [...h, currentStepName]);
                
                // Usar setTimeout para dar tiempo a que SAVE_STEP_VALUES actualice el estado
                setTimeout(() => {
                  setCurrentStepName(stepName);
                  
                  // Inicializar valores del nuevo paso usando el window cache
                  setState((prev) => {
                    const allSteps = (window as any).__wizardAllStepValues || prev.allStepValues;
                    const savedValues = allSteps[stepName] ?? {};
                    console.log(`[GO_TO_STEP] Inicializando paso ${stepName} con:`, savedValues);
                    console.log(`[GO_TO_STEP] allStepValues actual:`, allSteps);
                    
                    return {
                      ...prev,
                      allStepValues: allSteps,
                      currentStepValues: { ...savedValues }
                    };
                  });
                }, 10);
              }
              break;
            }

            case "SET_VALUE": {
              const { targetName, value } = actionResult.payload as any;
              setState((prev) => ({
                ...prev,
                currentStepValues: { ...prev.currentStepValues, [targetName]: value }
              }));
              break;
            }

            case "UPDATE_COMPONENT": {
              const { targetName, targetProp, value } = actionResult.payload as any;
              setState((prev) => ({
                ...prev,
                componentStates: {
                  ...prev.componentStates,
                  [targetName]: { ...(prev.componentStates[targetName] as any), [targetProp]: value }
                }
              }));
              break;
            }

            case "ADD_ERROR": {
              const { fieldName, errorMessage } = actionResult.payload as any;
              setComponentErrors((prev) => ({ ...prev, [fieldName]: errorMessage }));
              break;
            }

            case "CLEAR_ERRORS": {
              const { fieldName } = actionResult.payload as any;
              setComponentErrors((prev) => {
                const next = { ...prev };
                delete next[fieldName];
                return next;
              });
              break;
            }

            case "CONSOLE_LOG": {
              const { message } = actionResult.payload as any;
              console.log(`[WIZARD] ${message}`);
              break;
            }

            case "SET_LOCAL_CONTEXT": {
              const { contextName, value } = actionResult.payload as any;
              setState((prev) => ({
                ...prev,
                localContexts: { ...prev.localContexts, [contextName]: value }
              }));
              break;
            }

            case "SAVE_STEP_VALUES": {
              console.log(`[SAVE_STEP_VALUES] Guardando paso: ${currentStepName}`, state.currentStepValues);
              // Actualizar state y también guardar en window para acceso inmediato
              const newAllStepValues = { ...state.allStepValues, [currentStepName]: state.currentStepValues };
              console.log('[SAVE_STEP_VALUES] Nuevo allStepValues:', newAllStepValues);
              
              // Guardar en window para que GO_TO_STEP pueda accederlo inmediatamente
              (window as any).__wizardAllStepValues = newAllStepValues;
              
              setState((prev) => ({
                ...prev,
                allStepValues: newAllStepValues
              }));
              break;
            }

            case "INIT_STEP_VALUES": {
              // Ya no necesitamos esta acción porque GO_TO_STEP maneja la inicialización
              // Solo loguear para debug
              console.log(`[INIT_STEP_VALUES] Ignorando - GO_TO_STEP ya inicializó el paso`);
              break;
            }

            case "FINISH_WIZARD": {
              alert("Wizard completado!\n\n" + JSON.stringify(actionResult.payload, null, 2));
              break;
            }
          }
        }

        // Update state from backend (contexts, etc.)
        setState((prev) => ({ ...prev, ...result.state }));
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  // Trigger ON_MOUNTED on step change
  React.useEffect(() => {
    handleEvent("ON_MOUNTED");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepName]);

  const goBack = () => {
    setHistory((h) => {
      const next = [...h];
      const prev = next.pop();
      if (prev) setCurrentStepName(prev);
      return next;
    });
  };

  const setValue = (componentName: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      currentStepValues: { ...prev.currentStepValues, [componentName]: value }
    }));
  };

  const getValue = (componentName: string) => {
    return state.currentStepValues[componentName];
  };

  const getComponentState = (componentName: string) => {
    return (state.componentStates[componentName] as any) ?? {};
  };

  const getError = (componentName: string) => {
    return componentErrors[componentName];
  };

  return (
    <div className={step.className}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{wizard.name}</div>
        {wizard.description ? <div style={{ color: "#555" }}>{wizard.description}</div> : null}
      </div>

      <div style={{ marginBottom: 10, fontWeight: 700 }}>{step.title ?? step.name}</div>

      {error ? <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div> : null}

      {step.components
        .sort((a, b) => a.order - b.order)
        .map((comp) => (
          <ComponentRenderer
            key={comp.name}
            component={comp}
            value={getValue(comp.name)}
            error={getError(comp.name)}
            componentState={getComponentState(comp.name)}
            disabled={busy}
            onValueChange={(val) => {
              setValue(comp.name, val);
              handleEvent("ON_CHANGE", comp.name);
            }}
            onEvent={(eventType) => handleEvent(eventType, comp.name)}
          />
        ))}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={goBack} disabled={busy || history.length === 0}>
          Back
        </button>
      </div>

      <details style={{ marginTop: 16 }}>
        <summary>State</summary>
        <pre style={{ background: "#f6f6f6", padding: 12, overflowX: "auto" }}>
          {JSON.stringify({ currentStepValues: state.currentStepValues, allStepValues: state.allStepValues }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
