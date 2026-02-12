import { Liquid } from "liquidjs";

const engine = new Liquid({
  strictVariables: false,
  strictFilters: false
});

// Add prettyjson filter
engine.registerFilter("prettyjson", (value: unknown) => {
  return JSON.stringify(value, null, 2);
});

export async function renderTemplate(template: string, context: unknown): Promise<string> {
  return engine.parseAndRender(template, context as any);
}
