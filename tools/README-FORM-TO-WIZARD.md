Form → Wizard converter

Usage

- Convert the example form to a wizard JSON and write to `backend/wizards/GeneratedFromForm.json`:

```powershell
cd "d:/ITRIO - PROJCTS/PFB/wizard-mvp"
node tools/form-to-wizard.js tools/example-form.json backend/wizards/GeneratedFromForm.json
```

- The script maps simple `formSchema` steps/fields into wizard steps and adds navigation buttons.

Notes
- This is a minimal converter to help bootstrap forms. Extend the mapping (validations, select options, custom components) as needed.
