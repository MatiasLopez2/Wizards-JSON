import jsonata from "jsonata";

export async function evalJsonata(expression: string, data: unknown, bindings?: Record<string, unknown>) {
  const expr = jsonata(expression);
  return expr.evaluate(data as any, bindings as any);
}
