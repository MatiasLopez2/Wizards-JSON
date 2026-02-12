import { z } from "zod";

export const nameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;

const uniqueBy = <T>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
};

export const ContentTypeSchema = z.enum(["JSON", "URL_ENCODING", "FORM_DATA", "TEXT"]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const HttpMethodSchema = z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

export const RemoteActionSchema = z
  .object({
    name: z.string().regex(nameRegex),
    contentType: ContentTypeSchema,
    method: HttpMethodSchema,
    url: z.string().min(1),
    body: z.string().optional(),
    params: z.string().optional(),
    headers: z.string().optional(),
    expression: z.string().optional(),
    certificateName: z.string().optional()
  })
  .strict();
export type RemoteAction = z.infer<typeof RemoteActionSchema>;

export const ComponentSchema = z
  .object({
    name: z.string().regex(nameRegex),
    type: z.enum(["text", "number", "select", "button", "display"]),
    label: z.string().optional(),
    bind: z.string().regex(nameRegex).optional(),
    readOnly: z.boolean().optional(),
    options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    actionName: z.string().regex(nameRegex).optional(),
    resultAssignTo: z.string().regex(nameRegex).optional()
  })
  .strict();
export type Component = z.infer<typeof ComponentSchema>;

export const StepSchema = z
  .object({
    name: z.string().regex(nameRegex),
    title: z.string().optional(),
    components: z.array(ComponentSchema),
    nextStep: z.string().regex(nameRegex).optional()
  })
  .strict();
export type Step = z.infer<typeof StepSchema>;

export const WizardSchema = z
  .object({
    name: z.string().regex(nameRegex),
    description: z.string().optional(),
    initialStep: z.string().regex(nameRegex),
    steps: z.array(StepSchema),
    actions: z.array(RemoteActionSchema).optional()
  })
  .strict()
  .superRefine((wizard, ctx) => {
    if (!uniqueBy(wizard.steps, (s) => s.name)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate step names" });
      return;
    }

    for (const step of wizard.steps) {
      if (!uniqueBy(step.components, (c) => c.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate component names in step '${step.name}'`
        });
      }
    }

    const actions = wizard.actions ?? [];
    if (!uniqueBy(actions, (a) => a.name)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate action names" });
    }

    if (!wizard.steps.some((s) => s.name === wizard.initialStep)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `initialStep '${wizard.initialStep}' not found in steps`
      });
    }

    for (const step of wizard.steps) {
      if (step.nextStep && !wizard.steps.some((s) => s.name === step.nextStep)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `nextStep '${step.nextStep}' from step '${step.name}' not found`
        });
      }
    }
  });

export type Wizard = z.infer<typeof WizardSchema>;
