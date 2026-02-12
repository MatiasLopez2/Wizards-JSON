export type ContentType = "JSON" | "URL_ENCODING" | "FORM_DATA" | "TEXT";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type RemoteAction = {
  name: string;
  contentType: ContentType;
  method: HttpMethod;
  url: string;
  body?: string;
  params?: string;
  headers?: string;
  expression?: string;
  certificateName?: string;
};

export type Component = {
  name: string;
  type: "text" | "number" | "select" | "button" | "display";
  label?: string;
  bind?: string;
  readOnly?: boolean;
  options?: Array<{ label: string; value: string }>;
  actionName?: string;
  resultAssignTo?: string;
};

export type Step = {
  name: string;
  title?: string;
  components: Component[];
  nextStep?: string;
};

export type Wizard = {
  name: string;
  description?: string;
  initialStep: string;
  steps: Step[];
  actions?: RemoteAction[];
};
