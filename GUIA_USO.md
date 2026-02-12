# 🧙‍♂️ Sistema de Wizards Dinámicos - Guía de Uso

## 📋 Descripción General

Sistema completo para crear y renderizar formularios dinámicos multi-paso (wizards) con:
- **Backend**: Express + TypeScript con motores de evaluación (LiquidJS + JSONata)
- **Frontend**: React + Vite con renderizado dinámico de componentes
- **Builder**: Editor visual para crear wizards sin escribir JSON manualmente

---

## 🚀 Inicio Rápido

### 1. Levantar el sistema

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

### 2. Usar el sistema

La interfaz tiene 2 pestañas:

#### 👁️ **Viewer** (Visualizar wizards existentes)
- Carga wizards por nombre (ej: `TurnoDNI`, `sampleWizard`)
- Ejecuta el wizard con todas sus validaciones y lógica

#### 🔧 **Builder** (Crear/editar wizards)
- Lista de wizards existentes con botón "Editar"
- Botón "Nuevo Wizard" para crear desde cero
- Editor visual con vista de formulario
- Vista JSON para edición avanzada

---

## 🏗️ Crear un Wizard Nuevo

### Opción A: Usando el Builder (Recomendado)

1. **Abrir el Builder**: http://localhost:5173 → Pestaña "Builder"

2. **Crear wizard**:
   - Click en "+ Nuevo Wizard"
   - Llenar información general:
     - **Nombre del Wizard (filename)**: Nombre del archivo (ej: `MiFormulario`)
     - **name (interno)**: Identificador interno
     - **Descripción**: Texto descriptivo
     - **Paso inicial**: Nombre del primer paso (default: `step1`)

3. **Agregar pasos**:
   - Click en "+ Agregar Paso"
   - Editar nombre del paso (ej: `datosPersonales`)
   - Editar título visible (ej: "Datos Personales")

4. **Agregar componentes a cada paso**:
   - Click en "+ Componente"
   - Configurar:
     - **Order**: Orden de aparición (1, 2, 3...)
     - **Name**: Identificador único del componente
     - **Tipo**: TEXT, LABEL, BUTTON, FIELD, ALERT, SPINNER

5. **Configurar componente** (en el textarea JSON):
   - Para TEXT: `{ "value": "Texto aquí" }`
   - Para FIELD tipo texto: `{ "type": "TEXT", "placeholder": "Ingrese aquí..." }`
   - Para BUTTON: `{ "label": "Continuar" }`
   - Para SELECT: `{ "type": "SELECT", "options": [{"value": "1", "label": "Opción 1"}] }`

6. **Guardar**:
   - Click en "💾 Guardar"
   - El wizard se guarda en `backend/wizards/{nombre}.json`

7. **Probar**:
   - Ir a pestaña "Viewer"
   - Cargar el wizard por nombre

### Opción B: Creando JSON manualmente

1. **Crear archivo**: `backend/wizards/MiWizard.json`

2. **Estructura básica**:

```json
{
  "name": "MiWizard",
  "description": "Descripción del wizard",
  "initialStep": "step1",
  "steps": [
    {
      "name": "step1",
      "title": "Paso 1",
      "components": [
        {
          "order": 1,
          "name": "nombre",
          "componentType": "FIELD",
          "component": {
            "type": "TEXT",
            "placeholder": "Tu nombre"
          },
          "top": {
            "components": [
              {
                "order": 1,
                "name": "labelNombre",
                "componentType": "LABEL",
                "component": { "value": "Nombre" }
              }
            ]
          }
        },
        {
          "order": 100,
          "name": "btnNext",
          "componentType": "BUTTON",
          "component": { "label": "Siguiente" },
          "events": {
            "ON_CLICK": [
              {
                "order": 1,
                "conditions": true,
                "then": [
                  {
                    "order": 1,
                    "type": "ACTIONS",
                    "actions": [
                      {
                        "type": "GO_TO_STEP",
                        "order": 1,
                        "stepName": "step2"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      "name": "step2",
      "title": "Paso 2",
      "components": [
        {
          "order": 1,
          "name": "mensaje",
          "componentType": "TEXT",
          "component": { "value": "¡Wizard completado!" }
        }
      ]
    }
  ]
}
```

3. **Probar**: Ir al Viewer y cargar por nombre

---

## 📚 Guía de Referencia Rápida

### Tipos de Componentes

| Tipo | Uso | Ejemplo de `component` |
|------|-----|------------------------|
| `TEXT` | Mostrar texto | `{ "value": "Hola" }` |
| `LABEL` | Etiqueta de campo | `{ "value": "Nombre:" }` |
| `BUTTON` | Botón clickeable | `{ "label": "Continuar" }` |
| `FIELD` | Entrada de datos | Ver sección "Tipos de Field" |
| `ALERT` | Mensaje destacado | `{ "message": "Info", "variant": "info" }` |
| `SPINNER` | Indicador de carga | `{}` |

### Tipos de Field

```json
// Texto
{ "type": "TEXT", "placeholder": "Escribe aquí" }

// Número
{ "type": "NUMBER", "placeholder": "Solo números" }

// Select simple
{
  "type": "SELECT",
  "options": [
    { "value": "1", "label": "Opción 1" },
    { "value": "2", "label": "Opción 2" }
  ]
}

// Select múltiple
{
  "type": "SELECT",
  "multiple": true,
  "options": [...]
}

// Fecha
{ "type": "DATE" }

// Checkbox
{ "type": "CHECKBOX" }

// Archivo
{
  "type": "FILE",
  "restrictions": {
    "maxSize": 5000000,
    "acceptedTypes": ["image/png", "image/jpeg"]
  }
}

// OTP (código de verificación)
{ "type": "OTP" }
```

### Posiciones de Sub-componentes

Puedes agregar componentes alrededor de otro usando:

```json
{
  "order": 1,
  "name": "email",
  "componentType": "FIELD",
  "component": { "type": "TEXT" },
  "top": {
    "components": [
      { "order": 1, "name": "label", "componentType": "LABEL", "component": { "value": "Email" } }
    ]
  },
  "bottom": {
    "components": [
      { "order": 1, "name": "hint", "componentType": "TEXT", "component": { "value": "Formato: usuario@dominio.com" } }
    ]
  }
}
```

Posiciones disponibles: `top`, `bottom`, `left`, `right`

---

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Formulario Simple (2 pasos)

**Caso**: Formulario de contacto básico

**Archivo**: `backend/wizards/Contacto.json`

```json
{
  "name": "Contacto",
  "description": "Formulario de contacto simple",
  "initialStep": "datos",
  "steps": [
    {
      "name": "datos",
      "title": "Tus Datos",
      "components": [
        {
          "order": 1,
          "name": "nombre",
          "componentType": "FIELD",
          "component": { "type": "TEXT", "placeholder": "Juan Pérez" },
          "top": {
            "components": [
              { "order": 1, "name": "lblNombre", "componentType": "LABEL", "component": { "value": "Nombre completo" } }
            ]
          }
        },
        {
          "order": 2,
          "name": "email",
          "componentType": "FIELD",
          "component": { "type": "TEXT", "placeholder": "juan@ejemplo.com" },
          "top": {
            "components": [
              { "order": 1, "name": "lblEmail", "componentType": "LABEL", "component": { "value": "Email" } }
            ]
          }
        },
        {
          "order": 100,
          "name": "btnNext",
          "componentType": "BUTTON",
          "component": { "label": "Enviar" },
          "events": {
            "ON_CLICK": [
              {
                "order": 1,
                "conditions": true,
                "then": [
                  {
                    "order": 1,
                    "type": "ACTIONS",
                    "actions": [
                      { "type": "SAVE_STEP_VALUES", "order": 1 },
                      { "type": "GO_TO_STEP", "order": 2, "stepName": "confirmacion" }
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      "name": "confirmacion",
      "title": "Confirmación",
      "components": [
        {
          "order": 1,
          "name": "mensaje",
          "componentType": "TEXT",
          "component": { "value": "✅ Formulario enviado correctamente" }
        },
        {
          "order": 2,
          "name": "btnFinish",
          "componentType": "BUTTON",
          "component": { "label": "Finalizar" },
          "events": {
            "ON_CLICK": [
              {
                "order": 1,
                "conditions": true,
                "then": [
                  {
                    "order": 1,
                    "type": "ACTIONS",
                    "actions": [
                      { "type": "FINISH_WIZARD", "order": 1 }
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Ejemplo 2: Wizard con Validaciones

Referencia completa: `backend/wizards/TurnoDNI.json`

Características implementadas:
- ✅ Validación de campos requeridos
- ✅ Validación con regex
- ✅ Navegación condicional basada en API remota
- ✅ Limpiar errores en ON_CHANGE
- ✅ Inicialización de valores en ON_MOUNTED
- ✅ Loading state en botones

---

## 🔗 Endpoints del Backend

### Gestión de Wizards

```http
# Listar todos los wizards
GET http://localhost:4000/api/wizards
Response: { "wizards": ["TurnoDNI", "sampleWizard", ...] }

# Obtener wizard específico
GET http://localhost:4000/api/wizards/TurnoDNI
Response: { ...wizard JSON... }

# Crear nuevo wizard
POST http://localhost:4000/api/wizards/MiWizard
Content-Type: application/json
Body: { ...wizard JSON... }

# Actualizar wizard existente
PUT http://localhost:4000/api/wizards/MiWizard
Content-Type: application/json
Body: { ...wizard JSON... }
```

### Ejecución de Wizards

```http
# Ejecutar bloque de eventos
POST http://localhost:4000/api/wizards/TurnoDNI/execute-block
Content-Type: application/json
Body: {
  "block": { ...block definition... },
  "state": { ...current state... }
}

# Evaluar condición
POST http://localhost:4000/api/wizards/TurnoDNI/evaluate-condition
Content-Type: application/json
Body: {
  "condition": { ...condition definition... },
  "state": { ...current state... }
}
```

---

## 🎨 Estructura del Wizard (Referencia Completa)

### Nivel Wizard

```typescript
{
  name: string;                      // Identificador único
  description: string;               // Descripción
  initialStep: string;               // Nombre del paso inicial
  remoteActions?: RemoteAction[];    // Acciones remotas (APIs)
  steps: Step[];                     // Array de pasos
}
```

### Nivel Step

```typescript
{
  name: string;                      // Identificador único del paso
  title: string;                     // Título visible
  className?: string;                // Clases CSS del contenedor
  components: Component[];           // Componentes del paso
  events?: {                         // Eventos del paso
    ON_MOUNTED?: Block[];
  };
}
```

### Nivel Component

```typescript
{
  order: number;                     // Orden de renderizado
  name: string;                      // Identificador único
  componentType: "TEXT" | "LABEL" | "BUTTON" | "FIELD" | "ALERT" | "SPINNER";
  component: {                       // Configuración específica del tipo
    // Ver sección "Tipos de Componentes"
  };
  top?: { components: Component[] };    // Componentes arriba
  bottom?: { components: Component[] }; // Componentes abajo
  left?: { components: Component[] };   // Componentes izquierda
  right?: { components: Component[] };  // Componentes derecha
  events?: {                         // Eventos del componente
    ON_CLICK?: Block[];
    ON_CHANGE?: Block[];
    ON_MOUNTED?: Block[];
    ON_BLUR?: Block[];
    ON_FOCUS?: Block[];
    RESTRICTION_FAILED?: Block[];
  };
}
```

### Nivel Block (Ejecución de Lógica)

```typescript
{
  order: number;                     // Orden de ejecución
  conditions: Condition | true;      // Condición para ejecutar
  then: BlockType[];                 // Bloques a ejecutar si cumple
}

// BlockType puede ser:
{
  type: "ACTIONS";
  actions: Action[];                 // Ver "Tipos de Actions"
}
// o
{
  type: "CONDITIONAL";
  condition: Condition;
  then: BlockType[];
  else?: BlockType[];
}
// o
{
  type: "FOREACH";
  context: Context;
  do: BlockType[];
}
```

---

## ⚡ Tipos de Actions (15+ implementadas)

| Action | Descripción | Payload |
|--------|-------------|---------|
| `GO_TO_STEP` | Navegar a otro paso | `{ stepName: string }` |
| `SAVE_STEP_VALUES` | Guardar valores del paso actual | - |
| `INIT_STEP_VALUES` | Inicializar valores desde historial | - |
| `FINISH_WIZARD` | Terminar wizard | - |
| `UPDATE_COMPONENT` | Actualizar propiedad de componente | `{ targetName, targetProp, context }` |
| `SET_VALUE` | Establecer valor de campo | `{ targetName, value }` |
| `ADD_ERROR` | Agregar error a campo | `{ fieldName, errorMessage }` |
| `CLEAR_ERRORS` | Limpiar errores de campo | `{ fieldName }` |
| `CONSOLE_LOG` | Log en consola | `{ message }` |
| `SET_LOCAL_CONTEXT` | Guardar contexto local | `{ contextName, value }` |
| `ADD_GROUP` | Agregar bloque a grupo repetible | `{ targetName }` |
| `REMOVE_GROUP` | Eliminar bloque de grupo | `{ targetName, index }` |

---

## 🧪 Probar el Sistema

### Test 1: Wizard Básico
1. Ir a Builder → Nuevo Wizard
2. Crear wizard "Test1" con 1 paso
3. Agregar componente TEXT con mensaje
4. Guardar
5. Ir a Viewer → Cargar "Test1"

### Test 2: Wizard con Navegación
1. Usar el wizard de ejemplo `TurnoDNI`
2. Probar con DNI entre 1-10 (válidos)
3. Verificar navegación a `secondA`
4. Probar con DNI > 10
5. Verificar navegación a `secondB`

### Test 3: Validaciones
1. Cargar `TurnoDNI`
2. Click en "Siguiente" sin llenar campos
3. Verificar mensajes de error
4. Llenar campos y ver errores limpiarse

---

## 📖 Recursos Adicionales

### Documentación de Referencia

Revisa estos archivos del proyecto para casos avanzados:

- **Postman Collections**: `postman-collections/` - Especificaciones completas del sistema real
- **Backend Types**: `backend/src/types-v2.ts` - Definiciones TypeScript completas
- **Ejemplo Completo**: `backend/wizards/TurnoDNI.json` - Wizard con todas las features

### Arquitectura del Sistema

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │ WizardBuilder│         │ WizardRenderer  │  │
│  │   (Editor)   │         │   (Ejecución)   │  │
│  └──────┬───────┘         └────────┬────────┘  │
│         │                          │            │
│         └──────────┬───────────────┘            │
└────────────────────┼──────────────────────────┘
                     │ HTTP API
┌────────────────────┼──────────────────────────┐
│                    ▼        BACKEND            │
│  ┌─────────────────────────────────────────┐  │
│  │         Express API Server              │  │
│  │  - POST/PUT wizards (guardar)           │  │
│  │  - GET wizards (cargar)                 │  │
│  │  - POST execute-block (ejecutar)        │  │
│  └────────┬─────────────────────────┬──────┘  │
│           │                         │          │
│  ┌────────▼────────┐      ┌─────────▼───────┐ │
│  │ contextResolver │      │ actionExecutor  │ │
│  │ (9 tipos)       │      │ (15+ acciones)  │ │
│  └─────────────────┘      └─────────────────┘ │
│           │                         │          │
│  ┌────────▼────────┐      ┌─────────▼───────┐ │
│  │conditionEvaluator│     │  LiquidJS       │ │
│  │(8 operadores)   │      │  JSONata        │ │
│  └─────────────────┘      └─────────────────┘ │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │      wizards/ (archivos .json)          │  │
│  └─────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## ❓ FAQ

**P: ¿Cómo agrego validaciones a un campo?**
R: Usa eventos `ON_CLICK` en el botón de navegación con bloques CONDITIONAL que evalúen las condiciones y ejecuten `ADD_ERROR` si fallan.

**P: ¿Puedo cargar opciones de un SELECT dinámicamente?**
R: Sí, usa evento `ON_MOUNTED` con action `UPDATE_COMPONENT` para actualizar la propiedad `options`.

**P: ¿Cómo hago navegación condicional?**
R: En el evento `ON_CLICK` del botón, crea múltiples bloques con diferentes condiciones. Cada uno ejecuta `GO_TO_STEP` a diferentes pasos según la condición.

**P: ¿Se pueden hacer llamadas a APIs externas?**
R: Sí, define `remoteActions` en el wizard y úsalas en condiciones tipo `remote` o en actions tipo `REMOTE_UPDATE_COMPONENT`.

**P: ¿Cómo guardo los datos del wizard completo?**
R: Los datos se acumulan en `state.allStepValues`. Al hacer `FINISH_WIZARD`, tienes acceso a todos los valores ingresados en todos los pasos.

---

## 🎓 Próximos Pasos

1. **Familiarízate con el Builder**: Crea 2-3 wizards simples
2. **Estudia TurnoDNI.json**: Analiza cómo se implementan validaciones y navegación condicional
3. **Experimenta con eventos**: Prueba ON_CHANGE, ON_MOUNTED, ON_CLICK
4. **Personaliza componentes**: Modifica el JSON de configuración de componentes
5. **Integra APIs**: Añade `remoteActions` y úsalas en condiciones

---

**¡Listo para crear wizards dinámicos! 🚀**

Si necesitas ayuda, revisa los ejemplos en `backend/wizards/` o la documentación técnica en `backend/src/types-v2.ts`.
