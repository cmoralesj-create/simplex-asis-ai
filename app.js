let historial = [];

document.getElementById("btnGenerar").addEventListener("click", generarCampos);
document.getElementById("btnLimpiar").addEventListener("click", limpiarTodo);
document.getElementById("btnResolver").addEventListener("click", resolverProblema);

function generarCampos() {
  const numVars = parseInt(document.getElementById("numVars").value);
  const numRestricciones = parseInt(document.getElementById("numRestricciones").value);
  const panel = document.getElementById("panelDatos");
  panel.innerHTML = "";

  if (isNaN(numVars) || isNaN(numRestricciones)) {
    alert("Ingrese números válidos.");
    return;
  }

  const foDiv = document.createElement("div");
  foDiv.innerHTML = `<h3>Función Objetivo</h3>`;
  const foLine = document.createElement("div");
  foLine.innerHTML = `${document.getElementById("objetivo").value === "max" ? "Maximizar" : "Minimizar"} Z = `;
  for (let i = 0; i < numVars; i++) {
    foLine.innerHTML += `<input type="number" class="fo" placeholder="x${i + 1}" /> x${i + 1} ${i < numVars - 1 ? "+" : ""} `;
  }
  foDiv.appendChild(foLine);
  panel.appendChild(foDiv);

  const restrDiv = document.createElement("div");
  restrDiv.innerHTML = `<h3>Restricciones</h3>`;
  for (let r = 0; r < numRestricciones; r++) {
    const line = document.createElement("div");
    for (let v = 0; v < numVars; v++) {
      line.innerHTML += `<input type="number" class="r${r}v${v}" placeholder="x${v + 1}" /> x${v + 1} ${v < numVars - 1 ? "+" : ""} `;
    }
    line.innerHTML += `<select class="op${r}"><option value="≤">≤</option><option value="≥">≥</option><option value="=">=</option></select>`;
    line.innerHTML += `<input type="number" class="const${r}" placeholder="Constante" />`;
    restrDiv.appendChild(line);
  }
  panel.appendChild(restrDiv);

  document.getElementById("btnResolver").disabled = false;
}

function limpiarTodo() {
  document.getElementById("numVars").value = "";
  document.getElementById("numRestricciones").value = "";
  document.getElementById("panelDatos").innerHTML = "";
  document.getElementById("resultado").textContent = "";
  document.getElementById("historial").innerHTML = "";
  document.getElementById("btnResolver").disabled = true;
  historial = [];
}

function resolverProblema() {
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

  let validacion = "";
  restricciones.forEach((r, i) => {
    if (r.op === "≥") validacion += `- Restricción ${i + 1}: usa '≥'. Puede convertirse a '≤'.\n`;
    r.coef.forEach((c, j) => {
      if (isNaN(c)) validacion += `- Restricción ${i + 1}, coef x${j + 1}: vacío. Puede rellenarse con 0.\n`;
    });
    if (isNaN(r.constante)) validacion += `- Restricción ${i + 1}: constante vacía. Puede rellenarse con 0.\n`;
  });

  if (validacion) {
    const opcion = confirm(`🧠 AsisSimplex:\n${validacion}\n\n¿Deseas que AsisSimplex corrija automáticamente estas restricciones?`);
    if (opcion) {
      restricciones.forEach((r, i) => {
        if (r.op === "≥") {
          r.coef = r.coef.map(c => -c);
          r.constante *= -1;
          r.op = "≤";
          document.querySelector(`.op${i}`).value = "≤";
        }
        r.coef.forEach((c, j) => {
          if (isNaN(c)) {
            r.coef[j] = 0;
            document.querySelector(`.r${i}v${j}`).value = "0";
          }
        });
        if (isNaN(r.constante)) {
          r.constante = 0;
          document.querySelector(`.const${i}`).value = "0";
        }
      });
    } else {
      alert("⚠️ AsisSimplex: El resultado puede variar o no ser correcto según el método.");
    }
  }

  const resultado = resolverSimplex(fo, restricciones, objetivo, modo);
  historial.unshift(resultado);
  if (historial.length > 3) historial.pop();

  document.getElementById("resultado").textContent = resultado;
  actualizarHistorial();
}

function actualizarHistorial() {
  const div = document.getElementById("historial");
  div.innerHTML = historial.slice(1).map((res, i) => {
    const resumen = res.split("\n").filter(line =>
      line.includes("|") || line.startsWith("x") || line.startsWith("Z")
    ).join("\n");
    return `<pre><strong>Resultado ${i + 1}</strong>\n${resumen}</pre>`;
  }).join("");
}

function limpiarHistorial() {
  historial = historial.slice(0, 1);
  actualizarHistorial();
}

function toggleHistorial() {
  const div = document.getElementById("historial");
  div.style.display = div.style.display === "none" ? "block" : "none";
}

// Service Worker con reinicio limpio
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  }).then(() => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

// Botón de instalación PWA
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  const installBtn = document.createElement("button");
  installBtn.textContent = "📥 Descargar App";
  installBtn.style = "margin-top:10px;padding:10px;background:#007acc;color:white;border:none;border-radius:5px;";
  installBtn.onclick = () => {
    e.prompt();
    e.userChoice.then(choice => {
      if (choice.outcome === "accepted") {
        installBtn.remove();
      }
    });
  };
  document.getElementById("instalarApp").appendChild(installBtn);
});