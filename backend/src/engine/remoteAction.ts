import { RemoteAction } from "../types.js";
import { renderTemplate } from "./liquid.js";
import { evalJsonata } from "./jsonata.js";

function looksLikeLiquid(template: string) {
  return template.includes("{{") || template.includes("{% ");
}

function tryParseJsonObject(raw: string, fieldName: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${fieldName} must be a JSON string after interpolation`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${fieldName} must be a JSON object string after interpolation`);
  }
  return parsed as Record<string, unknown>;
}

function appendQueryParams(url: string, params?: Record<string, unknown>) {
  if (!params || Object.keys(params).length === 0) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

export async function runRemoteAction(action: RemoteAction, contexts: Record<string, unknown>) {
  const urlRendered = await renderTemplate(action.url, contexts);

  const headersObj = action.headers
    ? tryParseJsonObject(await renderTemplate(action.headers, contexts), "headers")
    : {};

  const paramsObj = action.params
    ? tryParseJsonObject(await renderTemplate(action.params, contexts), "params")
    : undefined;

  const urlWithParams = appendQueryParams(urlRendered, paramsObj);

  let body: any = undefined;
  if (action.body !== undefined) {
    const bodyRendered = await renderTemplate(action.body, contexts);

    if (action.contentType === "JSON") {
      body = JSON.parse(bodyRendered);
    } else if (action.contentType === "TEXT") {
      body = bodyRendered;
    } else {
      // Minimal MVP: treat URL_ENCODING/FORM_DATA as a JSON object string.
      body = tryParseJsonObject(bodyRendered, "body");
    }
  }

  const headers = new Headers(headersObj as any);
  if (action.contentType === "JSON" && action.method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(urlWithParams, {
    method: action.method,
    headers,
    body:
      action.method === "GET" || action.method === "DELETE"
        ? undefined
        : action.contentType === "JSON"
          ? body !== undefined
            ? JSON.stringify(body)
            : undefined
          : action.contentType === "TEXT"
            ? body
            : undefined
  });

  const contentType = res.headers.get("content-type") ?? "";
  const rawText = await res.text();
  let data: unknown = rawText;

  if (contentType.includes("application/json")) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  } else {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  let result: unknown = data;
  if (action.expression && action.expression.trim().length > 0) {
    if (looksLikeLiquid(action.expression)) {
      const rendered = await renderTemplate(action.expression, { ...contexts, data });
      result = rendered;
    } else {
      result = await evalJsonata(action.expression, data, { context: contexts });
    }
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
    result
  };
}
