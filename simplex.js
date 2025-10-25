// ✅ simplex.js - versión híbrida con IA + local + spinner + timeout

// ⚙️ Configura tu API Key de OpenAI
const OPENAI_API_KEY = "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";

// 🔸 Tiempo máximo de espera para la IA (en milisegundos)
const OPENAI_TIMEOUT = 10000; // 10 segundos

// 🔹 Función principal
async function resolverSimplex(fo, restricciones, objetivo, modo) {
  const resultadoDiv = document.getElementById("resultado");
  mostrarSpinner(resultadoDiv, "🧠 AsisSimplex está pensando...");

  // 🔹 Construimos el prompt para la IA
  const prompt = `
Eres un asistente experto en programación lineal.
Resuelve el siguiente problema utilizando el MÉTODO SIMPLEX paso a paso.
Devuelve la respuesta en español, clara y legible para un estudiante.

Objetivo: ${objetivo === "max" ? "Maximizar" : "Minimizar"}
Función objetivo: Z = ${fo.map((c, i) => `${c}x${i + 1}`).join(" + ")}

Restricciones:
${restricciones.map((r) =>
    r.coef.map((c, j) => `${c}x${j + 1}`).join(" + ") + " " + r.op + " " + r.constante
  ).join("\n")}

Modo de explicación: ${modo === "completo"
    ? "Mostrar cada iteración, pivote y tabla intermedia del método Simplex."
    : "Mostrar solo el resultado final (valores de variables y Z)."}
`;

  // 🔸 Intentar primero con IA
  try {
    if (!navigator.onLine) throw new Error("Sin conexión a Internet.");
    if (!OPENAI_API_KEY.startsWith("sk-proj")) throw new Error("Clave API no configurada.");

    resultadoDiv.innerHTML = spinnerHTML("🤖 Consultando inteligencia artificial...");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un experto en programación lineal y optimización Simplex." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1200
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

    const data = await response.json();
    const texto = data.choices?.[0]?.message?.content?.trim();

    if (texto) {
      resultadoDiv.innerHTML = `<pre>${texto}</pre>`;
      return texto;
    } else {
      throw new Error("Respuesta vacía de la IA.");
    }
  } catch (error) {
    console.warn("⚠️ Falla en IA, usando modo local:", error.message);
    resultadoDiv.innerHTML = spinnerHTML("⚙️ Usando método Simplex local (offline)...");
    await esperar(1000);
    const resLocal = resolverSimplexLocal(fo, restricciones, objetivo, modo);
    return resLocal;
  }
}

/* ============================================================
   🧮 FUNCIÓN LOCAL: Método Simplex original (offline)
   ============================================================ */
function resolverSimplexLocal(fo, restricciones, objetivo, modo) {
  let log = "🧮 Modo local: Resolviendo con método Simplex...\n\n";

  const objetivoConvertido = objetivo === "min" ? fo.map(c => -c) : fo.slice();
  log += "Función Objetivo:\nZ = " + objetivoConvertido.map((c, i) => `${c}x${i + 1}`).join(" + ") + "\n\n";

  const numVars = fo.length;
  const numRestricciones = restricciones.length;
  const tabla = [];
  const base = [];

  for (let i = 0; i < numRestricciones; i++) {
    const fila = restricciones[i].coef.slice();
    for (let j = 0; j < numRestricciones; j++) {
      fila.push(i === j ? 1 : 0);
    }
    fila.push(restricciones[i].constante);
    tabla.push(fila);
    base.push(numVars + i);
  }

  const zFila = objetivoConvertido.map(c => -c);
  for (let i = 0; i < numRestricciones; i++) zFila.push(0);
  zFila.push(0);
  tabla.push(zFila);

  const nombres = [];
  for (let i = 0; i < numVars; i++) nombres.push(`x${i + 1}`);
  for (let i = 0; i < numRestricciones; i++) nombres.push(`h${i + 1}`);
  nombres.push("CT");

  let iteracion = 0;
  while (true) {
    iteracion++;
    if (modo === "completo") {
      log += `📋 Iteración ${iteracion}:\n`;
      tabla.forEach((fila, i) => {
        const nombre = i < numRestricciones ? nombres[base[i]] : "Z ";
        log += `${nombre} | ` + fila.map(n => n.toFixed(2)).join("  ") + "\n";
      });
    }

    const z = tabla[tabla.length - 1];
    const colPivote = z.slice(0, z.length - 1).reduce((idx, val, i, arr) =>
      val < arr[idx] ? i : idx, 0);

    if (z[colPivote] >= 0) {
      if (modo === "completo") log += "\n✅ Solución óptima alcanzada.\n";
      break;
    }

    const razones = tabla.slice(0, numRestricciones).map(fila =>
      fila[colPivote] > 0 ? fila[fila.length - 1] / fila[colPivote] : Infinity
    );
    const filaPivote = razones.indexOf(Math.min(...razones));

    if (razones[filaPivote] === Infinity) {
      log += "\n❌ Solución no factible: no hay razón mínima válida.\n";
      document.getElementById("resultado").innerHTML = `<pre>${log}</pre>`;
      return log;
    }

    base[filaPivote] = colPivote;
    if (modo === "completo") {
      log += `🔁 Pivoteando: columna ${nombres[colPivote]}, fila ${nombres[base[filaPivote]]}\n`;
    }

    const pivote = tabla[filaPivote][colPivote];
    tabla[filaPivote] = tabla[filaPivote].map(v => v / pivote);

    for (let i = 0; i < tabla.length; i++) {
      if (i !== filaPivote) {
        const factor = tabla[i][colPivote];
        tabla[i] = tabla[i].map((v, j) => v - factor * tabla[filaPivote][j]);
      }
    }
  }

  const resultado = [];
  for (let i = 0; i < numVars; i++) {
    const idx = base.indexOf(i);
    const valor = idx !== -1 ? tabla[idx][tabla[idx].length - 1] : 0;
    resultado.push(`x${i + 1} = ${valor.toFixed(2)}`);
  }

  const zFinal = tabla[tabla.length - 1][tabla[0].length - 1];
  resultado.push(`Z = ${zFinal.toFixed(2)}`);

  const texto = (modo === "completo")
    ? log + "\n📌 Solución final:\n" + resultado.join("\n")
    : "🔎 Resultado simplificado:\n\n" + resultado.join("\n");

  document.getElementById("resultado").innerHTML = `<pre>${texto}</pre>`;
  return texto;
}

/* ============================================================
   🎛️ FUNCIONES AUXILIARES
   ============================================================ */
function esperar(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function mostrarSpinner(element, mensaje) {
  element.innerHTML = spinnerHTML(mensaje);
}

function spinnerHTML(mensaje) {
  return `
    <div style="text-align:center; color:#00bfff; font-family:monospace;">
      <div class="spinner" style="
        border:4px solid rgba(255,255,255,0.2);
        border-top:4px solid #00bfff;
        border-radius:50%;
        width:40px; height:40px;
        margin:10px auto;
        animation: spin 1s linear infinite;
      "></div>
      <p>${mensaje}</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
}
