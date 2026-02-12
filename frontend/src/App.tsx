import React, { useState } from 'react';
import { WizardRendererV2 } from './components-v2/WizardRendererV2';
import { WizardBuilder } from './WizardBuilder';

export function App() {
  const [view, setView] = useState<'viewer' | 'builder'>('viewer');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🧙‍♂️ Wizard System v2</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setView('viewer')}
              className={`px-4 py-2 rounded ${
                view === 'viewer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👁️ Viewer
            </button>
            <button
              onClick={() => setView('builder')}
              className={`px-4 py-2 rounded ${
                view === 'builder'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🔧 Builder
            </button>
          </div>
        </div>
      </nav>

      <main className="py-8">
        {view === 'viewer' ? <WizardViewer /> : <WizardBuilder />}
      </main>
    </div>
  );
}

function WizardViewer() {
  const [wizardName, setWizardName] = useState('');
  const [activeWizard, setActiveWizard] = useState('');

  return (
    <div className="max-w-4xl mx-auto px-4">
      {!activeWizard ? (
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Cargar Wizard</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={wizardName}
              onChange={(e) => setWizardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && wizardName && setActiveWizard(wizardName)}
              className="flex-1 px-4 py-2 border rounded"
              placeholder="Nombre del wizard (ej: TurnoDNI, sampleWizard)"
            />
            <button
              onClick={() => wizardName && setActiveWizard(wizardName)}
              disabled={!wizardName}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              Cargar
            </button>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>Wizards disponibles:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <button
                  onClick={() => setActiveWizard('TurnoDNI')}
                  className="text-blue-600 hover:underline"
                >
                  TurnoDNI
                </button>
                {' - Ejemplo con validaciones y navegación condicional'}
              </li>
              <li>
                <button
                  onClick={() => setActiveWizard('sampleWizard')}
                  className="text-blue-600 hover:underline"
                >
                  sampleWizard
                </button>
                {' - Wizard simple original'}
              </li>
              <li>
                <button
                  onClick={() => setActiveWizard('RegistroUsuario')}
                  className="text-blue-600 hover:underline"
                >
                  Registro de Usuario
                </button>
                {' - Wizard de registro de usuario con validación y bienvenida'}
              </li>
             
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setActiveWizard('')}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            ← Volver al selector
          </button>
          <WizardRendererV2 wizardName={activeWizard} />
        </div>
      )}
    </div>
  );
}
