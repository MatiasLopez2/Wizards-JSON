#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function mapFieldToComponent(field, order) {
  const typeMap = {
    text: 'TEXT',
    email: 'TEXT',
    password: 'TEXT',
    date: 'DATE',
    select: 'SELECT'
  };

  const componentType = 'FIELD';
  const comp = {
    order,
    name: field.id,
    componentType,
    component: {
      type: (field.type === 'password') ? 'TEXT' : (field.type || 'text').toUpperCase(),
      placeholder: field.placeholder || ''
    }
  };

  if (field.type === 'select' && Array.isArray(field.options)) {
    comp.component.options = field.options.map(o => ({ label: o.label, value: o.value }));
  }

  if (field.validation) comp.component.schema = field.validation;
  return comp;
}

function buildWizardFromForm(form) {
  const wizardName = form.name || 'FormToWizard';
  const wizard = {
    name: wizardName,
    description: form.description || 'Generated wizard from form schema',
    isActive: true,
    initialStep: form.steps && form.steps[0] ? form.steps[0].name : 'step1',
    steps: []
  };

  form.steps.forEach((step, si) => {
    const stepObj = {
      name: step.name,
      description: step.title || step.description || '',
      className: step.className || 'max-w-md mx-auto p-6 bg-white rounded-lg shadow-md',
      components: [],
      events: {}
    };

    let orderBase = 5;
    // Title
    stepObj.components.push({ order: orderBase, name: 'title', componentType: 'TEXT', component: { value: step.title || '' }, className: 'text-center mb-4' });
    orderBase += 5;

    // Fields
    (step.fields || []).forEach((field, fi) => {
      const comp = mapFieldToComponent(field, orderBase + fi * 5);
      stepObj.components.push(comp);
    });

    // Navigation buttons
    const isFirst = si === 0;
    const isLast = si === form.steps.length - 1;

    if (!isFirst) {
      stepObj.components.push({
        order: 80,
        name: 'back',
        componentType: 'BUTTON',
        component: { label: 'Anterior' },
        className: 'w-full mb-2',
        events: {
          ON_CLICK: [
            { order: 1, type: 'CONDITIONAL', conditions: true, actions: [ { order: 1, type: 'GO_TO_STEP', stepName: form.steps[si - 1].name } ] }
          ]
        }
      });
    }

    // Next or Confirm
    if (isLast) {
      stepObj.components.push({
        order: 90,
        name: 'confirm',
        componentType: 'BUTTON',
        component: { label: 'Confirmar' },
        className: 'w-full bg-green-600 text-white',
        events: {
          ON_CLICK: [
            { order: 1, type: 'CONDITIONAL', conditions: true, actions: [ { order: 1, type: 'SAVE_STEP_VALUES' }, { order: 2, type: 'FINISH_WIZARD' } ] }
          ]
        }
      });
    } else {
      stepObj.components.push({
        order: 90,
        name: 'next',
        componentType: 'BUTTON',
        component: { label: 'Siguiente' },
        className: 'w-full',
        events: {
          ON_CLICK: [
            { order: 1, type: 'CONDITIONAL', conditions: true, actions: [ { order: 1, type: 'SAVE_STEP_VALUES' }, { order: 2, type: 'GO_TO_STEP', stepName: form.steps[si + 1].name } ] }
          ]
        }
      });
    }

    // Events: init
    stepObj.events.ON_MOUNTED = [ { order: 1, type: 'CONDITIONAL', conditions: true, actions: [ { order: 1, type: 'INIT_STEP_VALUES' } ] } ];

    wizard.steps.push(stepObj);
  });

  // Add a tiny confirm step update on last step to show summaries (update components if exist)
  const last = wizard.steps[wizard.steps.length - 1];
  if (last) {
    const updates = [];
    // For each field in all steps pick a summary target if present
    let order = 1;
    wizard.steps.forEach(s => {
      (s.components || []).forEach(c => {
        if (c.componentType === 'FIELD') {
          // create a UPDATE_COMPONENT action that would set a component named resumen<field>
          const targetName = `resumen_${s.name}_${c.name}`;
          // Only create action (user can add components to render it)
          updates.push({ order: order++, type: 'UPDATE_COMPONENT', params: { targetName, targetProp: 'value', context: { key: 'value', type: 'ALL_STEP_VALUES', expression: `'${c.name}: ' & ${s.name}.${c.name}` } } });
        }
      });
    });

    if (updates.length) {
      // append to last step ON_MOUNTED actions
      last.events.ON_MOUNTED[0].actions = last.events.ON_MOUNTED[0].actions || [];
      last.events.ON_MOUNTED[0].actions.push(...updates);
    }
  }

  return wizard;
}

async function main() {
  const args = process.argv.slice(2);
  const input = args[0] || path.join(__dirname, 'example-form.json');
  const output = args[1] || path.join(__dirname, '..', 'backend', 'wizards', 'GeneratedFromForm.json');

  try {
    const raw = fs.readFileSync(input, 'utf8');
    const form = JSON.parse(raw);
    const wizard = buildWizardFromForm(form);
    fs.writeFileSync(output, JSON.stringify(wizard, null, 2));
    console.log(`Generated wizard written to ${output}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) main();
