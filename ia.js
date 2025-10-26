// ia.js — cliente minimal para el Worker
const WORKER_URL = "https://super-cherry-f614.saulalopezg.workers.dev/explain"; // <-- cambia por tu URL real

export async function explainSimplex({ objetivo, fo, restricciones, modo }) {
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ objetivo, fo, restricciones, modo })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("❌ Worker error:", data);
    throw new Error(data?.detail || data?.error || "Error IA");
  }
  return data.text || "[IA] Respuesta vacía.";
}

export function renderText(md, target) {
  target.textContent = md;
}
