# Wizard MVP (LiquidJS + JSONata)

MVP para definir wizards en JSON y renderizarlos en un frontend, con soporte para:
- Interpolación LiquidJS (strings tipo `"...{{userId}}..."`)
- Expresiones JSONata para mapear la respuesta de acciones remotas

## Requisitos
- Node.js **18+** (por `fetch` nativo)

## Correr en dev (2 terminales)

### Backend
```powershell
cd "d:\ITRIO - PROJCTS\PFB\wizard-mvp\backend"
npm install
npm run dev
```

### Frontend
```powershell
cd "d:\ITRIO - PROJCTS\PFB\wizard-mvp\frontend"
npm install
npm run dev
```

Abrí `http://localhost:5173`.

## Probar el wizard ejemplo
- Wizard: `sampleWizard`
- Archivo: `backend/wizards/sampleWizard.json`

La acción `getUserProfile` pega a `jsonplaceholder.typicode.com` y usa JSONata `"name"` para extraer el nombre.
"# Wizards-JSON" 
"# Wizards-JSON" 
