let historial = [];

const spinner = document.createElement("div");
spinner.id = "spinner";
spinner.style = `
  display:none;
  position:fixed;
  top:0; left:0;
  width:100%; height:100%;
  background:rgba(255,255,255,0.7);
  backdrop-filter:blur(2px);
  z-index:9999;
  justify-content:center;
  align-items:center;
  font-size:22px;
  color:#007acc;
`;
spinner.innerHTML = "🤖 Procesando, por favor espera...";
document.body.appendChild(spinner);

function mostrarSpinner() { spinner.style.display = "flex"; }
function ocultarSpinner() { spinner.style.display = "none"; }

document.getElementById("btnGenerar").addEventListener("click", generarCampos);
document.getElementById("btnLimpiar").addEventListener("click", limpiarTodo);
document.getElementById("btnResolver").addEventListener("click", resolverProblema);

async function resolverProblema() {
  const modo = document.querySelector('input[name="modo"]:checked').value;
  const numVars = parseInt(document.getElementById("numVars").value);
  const numRestricciones = parseInt(document.getElementById("numRestricciones").value);
  const objetivo = document.getElementById("objetivo").value;

  const fo = Array.from(document.querySelectorAll(".fo")).map(e => parseFloat(e.value) || 0);
  const restricciones = [];

  for (let r = 0; r < numRestricciones; r++) {
    const fila = [];
    for (let v = 0; v < numVars; v++) {
      fila.push(parseFloat(document.querySelector(`.r${r}v${v}`).value));
    }
    const rawOp = document.querySelector(`.op${r}`).value;
    const op = rawOp === "<" ? "≤" : rawOp === ">" ? "≥" : rawOp;
    const constante = parseFloat(document.querySelector(`.const${r}`).value);
    restricciones.push({ coef: fila, op, constante });
  }

  mostrarSpinner();

  let resultado = "";
  const OPENAI_API_KEY = "sk-proj-XXXXXXXXXXXXXXXXXXXX"; // Tu clave
  const prompt = `
Resuelve el siguiente problema de programación lineal con el método Simplex.
Modo: ${modo}
Objetivo: ${objetivo === "max" ? "Maximizar" : "Minimizar"}
Función objetivo: ${fo.map((c, i) => `${c}x${i + 1}`).join(" + ")}
Restricciones:
${restricciones.map(r => r.coef.map((c, i) => `${c}x${i + 1}`).join(" + ") + " " + r.op + " " + r.constante).join("\n")}
Da el resultado en texto claro, con los pasos o solo la matriz según el modo.
`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 s límite
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    resultado = data.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.warn("⚠️ Falla en IA, usando modo local:", err.message);
    // Fallback local con tu versión correcta del Simplex
    resultado = resolverSimplex(fo, restricciones, objetivo, modo);
  }

  ocultarSpinner();

  document.getElementById("resultado").textContent = resultado;
  historial.unshift(typeof resultado === "string" ? resultado : JSON.stringify(resultado));
  if (historial.length > 3) historial.pop();
  actualizarHistorial();
}

function actualizarHistorial() {
  const div = document.getElementById("historial");
  div.innerHTML = historial.slice(1).map((res, i) => {
    if (typeof res !== "string") return "";
    const resumen = res.split("\n").filter(line =>
      line.includes("|") || line.startsWith("x") || line.startsWith("Z")
    ).join("\n");
    return `<pre><strong>Resultado ${i + 1}</strong>\n${resumen}</pre>`;
  }).join("");
}
