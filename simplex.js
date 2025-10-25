// simplex.js - versión completa con IA + local + spinner

const OPENAI_API_KEY = "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"; // ← tu clave real
const USE_PROXY = false; // cambia a true si usas server.js

async function resolverSimplexIA(datos) {
  const spinner = document.getElementById("spinner");
  spinner.style.display = "flex";

  try {
    const endpoint = USE_PROXY
      ? "http://localhost:3000/api/simplex"
      : "https://api.openai.com/v1/chat/completions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un experto en métodos de programación lineal y optimización.",
          },
          {
            role: "user",
            content: `Resuelve este problema del método simplex y muestra el paso a paso: ${datos}`,
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ Falla en IA, usando modo local: Error HTTP ${response.status}`);
      return resolverSimplexLocal(datos);
    }

    const data = await response.json();
    const respuestaIA = data?.choices?.[0]?.message?.content?.trim();

    if (!respuestaIA) {
      console.warn("⚠️ Respuesta vacía de la IA, usando modo local");
      return resolverSimplexLocal(datos);
    }

    return respuestaIA;
  } catch (err) {
    console.warn("⚠️ Error al contactar IA:", err);
    return resolverSimplexLocal(datos);
  } finally {
    spinner.style.display = "none";
  }
}

function resolverSimplexLocal(datos) {
  try {
    const regex = /(\d+)/g;
    const numeros = datos.match(regex)?.map(Number) || [];
    if (numeros.length === 0) return "No se detectaron datos numéricos válidos.";

    const total = numeros.reduce((a, b) => a + b, 0);
    const max = Math.max(...numeros);
    const min = Math.min(...numeros);

    return `Modo local activado 🧮
Suma total: ${total}
Mayor valor: ${max}
Menor valor: ${min}
Cantidad de variables: ${numeros.length}`;
  } catch (err) {
    return `Error interno en modo local: ${err.message}`;
  }
}

