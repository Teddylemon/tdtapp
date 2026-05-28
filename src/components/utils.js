export function formatTimestamp(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatDate(value) {
  if (!value || value === "-") return value;
  return value.split(" ")[0];
}

export function showToast(message, tone = "default") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("tdt-toast", {
      detail: {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        tone,
      },
    }),
  );
}
