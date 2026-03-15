export function trustLabelColor(label: "trusted" | "caution" | "high_risk") {
  if (label === "trusted") return "#1f7a4c";
  if (label === "caution") return "#b7791f";
  return "#c53030";
}

export function statusDot(status: "idle" | "listening" | "analyzing" | "stopped" | "error") {
  if (status === "idle") return "#64748b";
  if (status === "listening") return "#2563eb";
  if (status === "analyzing") return "#0f766e";
  if (status === "stopped") return "#4b5563";
  return "#dc2626";
}
