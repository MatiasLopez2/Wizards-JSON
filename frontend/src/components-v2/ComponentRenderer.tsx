import React from "react";
import type { Component as WizardComponent } from "../types-v2";

type ComponentRendererProps = {
  component: WizardComponent;
  value: unknown;
  error?: string;
  componentState: any;
  disabled: boolean;
  onValueChange: (value: unknown) => void;
  onEvent: (eventType: string) => void;
};

export function ComponentRenderer({
  component,
  value,
  error,
  componentState,
  disabled,
  onValueChange,
  onEvent
}: ComponentRendererProps) {
  const visible = componentState.visible !== false;
  if (!visible) return null;

  const renderPosition = (position: any) => {
    if (!position?.components) return null;
    return (
      <div className={position.className}>
        {position.components.map((c: any) => (
          <SubComponentRenderer key={c.name} component={c} />
        ))}
      </div>
    );
  };

  const content = (
    <>
      {component.top && renderPosition(component.top)}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {component.left && renderPosition(component.left)}
        {renderMainComponent()}
        {component.right && renderPosition(component.right)}
      </div>
      {component.bottom && renderPosition(component.bottom)}
      {error && <div style={{ color: "crimson", fontSize: 12, marginTop: 4 }}>{error}</div>}
    </>
  );

  function renderMainComponent() {
    switch (component.componentType) {
      case "TEXT":
        return (
          <div className={component.component.className} style={{ marginBottom: 12 }}>
            {component.component.value ?? ""}
          </div>
        );

      case "LABEL":
        return (
          <label className={component.component.className} style={{ marginBottom: 6 }}>
            {component.component.value ?? ""}
          </label>
        );

      case "BUTTON":
        return (
          <button
            className={component.component.className}
            disabled={disabled || componentState.disabled || componentState.loading}
            onClick={() => onEvent("ON_CLICK")}
          >
            {componentState.loading ? "..." : component.component.label ?? component.name}
          </button>
        );

      case "ALERT":
        return (
          <div className={`alert ${component.component.variantName}`} style={{ padding: 8, marginBottom: 12 }}>
            {component.component.value ?? ""}
          </div>
        );

      case "SPINNER":
        return (
          <div className={component.component.className} style={{ textAlign: "center", marginBottom: 12 }}>
            <div
              style={{
                width: component.component.size ?? 40,
                height: component.component.size ?? 40,
                border: `${component.component.strokeWidth ?? 2}px solid #ccc`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto"
              }}
            />
          </div>
        );

      case "FIELD":
        return renderField();

      default:
        return <div>Unknown component type: {component.componentType}</div>;
    }
  }

  function renderField() {
    const fieldType = component.component.type;
    const fieldDisabled = disabled || componentState.disabled || component.component.disabled;
    const placeholder = component.component.placeholder ?? "";

    switch (fieldType) {
      case "TEXT":
      case "NUMBER":
        return (
          <input
            type={fieldType.toLowerCase()}
            value={String(value ?? "")}
            placeholder={placeholder}
            disabled={fieldDisabled}
            onChange={(e) => onValueChange(e.target.value)}
            onBlur={() => onEvent("ON_BLUR")}
            onFocus={() => onEvent("ON_FOCUS")}
            style={{ width: "100%", marginBottom: 12 }}
          />
        );

      case "SELECT": {
        const options = componentState.options ?? component.component.options ?? [];
        const isMultiple = componentState.isMultiple ?? component.component.isMultiple ?? false;

        return (
          <select
            value={isMultiple ? (Array.isArray(value) ? value : []) : String(value ?? "")}
            multiple={isMultiple}
            disabled={fieldDisabled}
            onChange={(e) => {
              if (isMultiple) {
                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                onValueChange(selected);
              } else {
                onValueChange(e.target.value);
              }
            }}
            onBlur={() => onEvent("ON_BLUR")}
            onFocus={() => onEvent("ON_FOCUS")}
            style={{ width: "100%", marginBottom: 12 }}
          >
            {!isMultiple && <option value="">--</option>}
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }

      case "DATE":
        return (
          <input
            type="date"
            value={value ? String(value) : ""}
            disabled={fieldDisabled}
            onChange={(e) => onValueChange(e.target.value)}
            onBlur={() => onEvent("ON_BLUR")}
            onFocus={() => onEvent("ON_FOCUS")}
            style={{ width: "100%", marginBottom: 12 }}
          />
        );

      case "CHECKBOX":
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={fieldDisabled}
            onChange={(e) => onValueChange(e.target.checked)}
            style={{ marginBottom: 12 }}
          />
        );

      case "FILE":
        return (
          <div style={{ marginBottom: 12 }}>
            <input
              type="file"
              multiple={component.component.restrictions?.maxNumberOfFiles > 1}
              accept={component.component.restrictions?.allowedFileTypes?.join(",")}
              disabled={fieldDisabled}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                
                // Trigger RESTRICTION_FAILED if needed
                const maxFiles = component.component.restrictions?.maxNumberOfFiles ?? Infinity;
                const minFiles = component.component.restrictions?.minNumberOfFiles ?? 0;
                
                if (files.length > maxFiles || files.length < minFiles) {
                  onEvent("RESTRICTION_FAILED");
                  return;
                }

                // Convert to base64 if encodingType is BASE64
                if (component.component.encodingType === "BASE64" && files.length > 0) {
                  const base64Files = await Promise.all(
                    files.map((file) =>
                      new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                      })
                    )
                  );
                  onValueChange(base64Files.length === 1 ? base64Files[0] : base64Files);
                } else {
                  onValueChange(files);
                }
              }}
              style={{ width: "100%" }}
            />
            {placeholder && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{placeholder}</div>}
          </div>
        );

      case "OTP":
        return (
          <input
            type="text"
            value={String(value ?? "")}
            maxLength={component.component.numInputs ?? 6}
            placeholder={"_".repeat(component.component.numInputs ?? 6)}
            disabled={fieldDisabled}
            onChange={(e) => onValueChange(e.target.value)}
            style={{ width: "100%", marginBottom: 12, letterSpacing: 8, textAlign: "center" }}
          />
        );

      case "REPEATABLE_GROUP": {
        const groups = Array.isArray(value) ? value : [];
        const maxBlocks = component.component.maxBlocksQuantity ?? 10;
        const minBlocks = component.component.minBlocksQuantity ?? 0;

        return (
          <div className={component.component.className} style={{ marginBottom: 12 }}>
            {groups.map((groupValue: any, idx: number) => (
              <div key={idx} className={component.component.componentsClassName}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Block {idx + 1}</div>
                {/* Render sub-components here - simplified for MVP */}
                <pre style={{ fontSize: 11 }}>{JSON.stringify(groupValue, null, 2)}</pre>
              </div>
            ))}
            <button
              disabled={groups.length >= maxBlocks}
              onClick={() => {
                const newGroups = [...groups, {}];
                onValueChange(newGroups);
              }}
            >
              Add Block
            </button>
          </div>
        );
      }

      default:
        return <div style={{ marginBottom: 12 }}>Unsupported field type: {fieldType}</div>;
    }
  }

  return (
    <div key={component.name} className={component.className} style={{ marginBottom: 12 }}>
      {content}
    </div>
  );
}

function SubComponentRenderer({ component }: { component: any }) {
  switch (component.componentType) {
    case "TEXT":
      return <div className={component.component.className}>{component.component.value ?? ""}</div>;
    case "LABEL":
      return <label className={component.component.className}>{component.component.value ?? ""}</label>;
    case "BUTTON":
      return <button className={component.component.className}>{component.component.label ?? component.name}</button>;
    default:
      return <div>Unknown: {component.componentType}</div>;
  }
}
