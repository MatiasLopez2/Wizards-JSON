import React, { useState, useEffect } from 'react';
import type { Wizard, Step, Component as WizardComponent } from './types-v2';
import { listWizards, loadWizard, saveWizard } from './api-builder';

export function WizardBuilder() {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [wizards, setWizards] = useState<string[]>([]);
  const [currentWizard, setCurrentWizard] = useState<Wizard | null>(null);
  const [wizardName, setWizardName] = useState('');
  const [jsonView, setJsonView] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'list') {
      listWizards().then(setWizards).catch(e => setError(e.message));
    }
  }, [mode]);

  const handleNew = () => {
    setCurrentWizard({
      name: '',
      description: '',
      initialStep: 'step1',
      steps: [{
        name: 'step1',
        title: 'Paso 1',
        components: []
      }]
    });
    setWizardName('');
    setMode('create');
    setError('');
  };

  const handleLoad = async (name: string) => {
    try {
      const wizard = await loadWizard(name);
      setCurrentWizard(wizard);
      setWizardName(name);
      setMode('edit');
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSave = async () => {
    if (!currentWizard || !wizardName.trim()) {
      setError('Nombre del wizard es requerido');
      return;
    }

    try {
      await saveWizard(wizardName, currentWizard, mode === 'edit');
      setError('');
      alert(`Wizard '${wizardName}' guardado exitosamente`);
      setMode('list');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateWizard = (updates: Partial<Wizard>) => {
    if (currentWizard) {
      setCurrentWizard({ ...currentWizard, ...updates });
    }
  };

  const addStep = () => {
    if (!currentWizard) return;
    const newStepName = `step${currentWizard.steps.length + 1}`;
    updateWizard({
      steps: [...currentWizard.steps, {
        name: newStepName,
        title: `Paso ${currentWizard.steps.length + 1}`,
        components: []
      }]
    });
  };

  const updateStep = (index: number, updates: Partial<Step>) => {
    if (!currentWizard) return;
    const steps = [...currentWizard.steps];
    steps[index] = { ...steps[index], ...updates };
    updateWizard({ steps });
  };

  const deleteStep = (index: number) => {
    if (!currentWizard) return;
    if (currentWizard.steps.length <= 1) {
      setError('Debe haber al menos un paso');
      return;
    }
    const steps = currentWizard.steps.filter((_, i) => i !== index);
    updateWizard({ steps });
  };

  const addComponent = (stepIndex: number) => {
    if (!currentWizard) return;
    const steps = [...currentWizard.steps];
    const newComponent: WizardComponent = {
      order: steps[stepIndex].components.length + 1,
      name: `component_${Date.now()}`,
      componentType: 'TEXT',
      component: { value: 'Nuevo componente' }
    };
    steps[stepIndex].components.push(newComponent);
    updateWizard({ steps });
  };

  const updateComponent = (stepIndex: number, compIndex: number, updates: Partial<WizardComponent>) => {
    if (!currentWizard) return;
    const steps = [...currentWizard.steps];
    steps[stepIndex].components[compIndex] = { ...steps[stepIndex].components[compIndex], ...updates };
    updateWizard({ steps });
  };

  const deleteComponent = (stepIndex: number, compIndex: number) => {
    if (!currentWizard) return;
    const steps = [...currentWizard.steps];
    steps[stepIndex].components.splice(compIndex, 1);
    updateWizard({ steps });
  };

  if (mode === 'list') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Wizard Builder</h1>
        
        <button
          onClick={handleNew}
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Nuevo Wizard
        </button>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <div className="space-y-2">
          {wizards.map(name => (
            <div key={name} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <span className="font-mono">{name}</span>
              <button
                onClick={() => handleLoad(name)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentWizard) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          {mode === 'create' ? 'Crear Wizard' : 'Editar Wizard'}
        </h1>
        <div className="space-x-2">
          <button
            onClick={() => setJsonView(!jsonView)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {jsonView ? '📝 Editor' : '🔍 Ver JSON'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            💾 Guardar
          </button>
          <button
            onClick={() => setMode('list')}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            ← Volver
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {jsonView ? (
        <div className="space-y-4">
          <textarea
            value={JSON.stringify(currentWizard, null, 2)}
            onChange={(e) => {
              try {
                setCurrentWizard(JSON.parse(e.target.value));
                setError('');
              } catch (err: any) {
                setError('JSON inválido: ' + err.message);
              }
            }}
            className="w-full h-[600px] p-4 font-mono text-sm border rounded"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metadata */}
          <div className="p-4 border rounded bg-white">
            <h2 className="text-xl font-bold mb-4">Información General</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Wizard (filename)</label>
                <input
                  type="text"
                  value={wizardName}
                  onChange={(e) => setWizardName(e.target.value)}
                  disabled={mode === 'edit'}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="MiWizard"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">name (interno)</label>
                <input
                  type="text"
                  value={currentWizard.name}
                  onChange={(e) => updateWizard({ name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <input
                  type="text"
                  value={currentWizard.description}
                  onChange={(e) => updateWizard({ description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Paso inicial</label>
                <select
                  value={currentWizard.initialStep}
                  onChange={(e) => updateWizard({ initialStep: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  {currentWizard.steps.map(step => (
                    <option key={step.name} value={step.name}>{step.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="p-4 border rounded bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Pasos ({currentWizard.steps.length})</h2>
              <button
                onClick={addStep}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Agregar Paso
              </button>
            </div>

            <div className="space-y-4">
              {currentWizard.steps.map((step, stepIdx) => (
                <div key={`step-${stepIdx}-${step.name}`} className="p-3 border-l-4 border-blue-500 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateStep(stepIdx, { name: e.target.value })}
                        className="w-full px-2 py-1 border rounded font-mono text-sm"
                        placeholder="step name"
                      />
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateStep(stepIdx, { title: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                        placeholder="Título del paso"
                      />
                    </div>
                    <button
                      onClick={() => deleteStep(stepIdx)}
                      className="ml-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Components */}
                  <div className="ml-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Componentes ({step.components.length})</span>
                      <button
                        onClick={() => addComponent(stepIdx)}
                        className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        + Componente
                      </button>
                    </div>

                    {step.components.map((comp, compIdx) => (
                      <div key={`comp-${stepIdx}-${compIdx}-${comp.name}`} className="p-2 bg-white border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              value={comp.order}
                              onChange={(e) => updateComponent(stepIdx, compIdx, { order: Number.parseInt(e.target.value) })}
                              className="px-2 py-1 border rounded text-sm"
                              placeholder="Order"
                            />
                            <input
                              type="text"
                              value={comp.name}
                              onChange={(e) => updateComponent(stepIdx, compIdx, { name: e.target.value })}
                              className="px-2 py-1 border rounded text-sm font-mono"
                              placeholder="name"
                            />
                            <select
                              value={comp.componentType}
                              onChange={(e) => {
                                const type = e.target.value as WizardComponent['componentType'];
                                let defaultComponent: any = { value: '' };
                                if (type === 'FIELD') defaultComponent = { type: 'TEXT' };
                                if (type === 'BUTTON') defaultComponent = { label: 'Button' };
                                updateComponent(stepIdx, compIdx, { componentType: type, component: defaultComponent });
                              }}
                              className="px-2 py-1 border rounded text-sm"
                            >
                              <option value="TEXT">TEXT</option>
                              <option value="LABEL">LABEL</option>
                              <option value="BUTTON">BUTTON</option>
                              <option value="FIELD">FIELD</option>
                              <option value="ALERT">ALERT</option>
                              <option value="SPINNER">SPINNER</option>
                            </select>
                          </div>
                          <button
                            onClick={() => deleteComponent(stepIdx, compIdx)}
                            className="ml-2 px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            ×
                          </button>
                        </div>

                        {/* Component config - simplified */}
                        <div className="text-xs">
                          <textarea
                            value={JSON.stringify(comp.component, null, 2)}
                            onChange={(e) => {
                              try {
                                updateComponent(stepIdx, compIdx, { component: JSON.parse(e.target.value) });
                              } catch {}
                            }}
                            className="w-full p-1 font-mono text-xs border rounded"
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
