import { useState } from "react";

export default function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert("Copy failed. Select the text and press Ctrl+C.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {label && <div style={{ fontSize: 13, color: "#a7b0c0" }}>{label}</div>}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            flex: 1, padding: "9px 10px", borderRadius: 10,
            border: "1px solid #24314a", background: "#0e1220", color: "white"
          }}
        />
        <button type="button" className="btn" onClick={onCopy}>Copy</button>
      </div>
      {copied && <div style={{ color: "#39d98a", fontSize: 12 }}>Copied!</div>}
    </div>
  );
}
