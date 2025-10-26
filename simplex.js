function resolverSimplex(fo, restricciones, objetivo, modo) {
  let log = "🧠 AsisSimplex: Resolviendo con método Simplex...\n\n";

  const objetivoConvertido = objetivo === "min" ? fo.map(c => -c) : fo.slice();
  log += "Función Objetivo:\nZ = " + objetivoConvertido.map((c, i) => `${c}x${i + 1}`).join(" + ") + "\n\n";

  const numVars = fo.length;
  const numRestricciones = restricciones.length;
  const tabla = [];
  const base = [];

  // Construcción de tabla inicial con variables de holgura
  for (let i = 0; i < numRestricciones; i++) {
    const fila = restricciones[i].coef.slice();
    for (let j = 0; j < numRestricciones; j++) {
      fila.push(i === j ? 1 : 0);
    }
    fila.push(restricciones[i].constante);
    tabla.push(fila);
    base.push(numVars + i); // h1, h2, ...
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
      }
      );
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

  // Extraer solución
  const resultado = [];
  for (let i = 0; i < numVars; i++) {
    const idx = base.indexOf(i);
    const valor = idx !== -1 ? tabla[idx][tabla[idx].length - 1] : 0;
    resultado.push(`x${i + 1} = ${valor.toFixed(2)}`);
  }

  const zFinal = tabla[tabla.length - 1][tabla[0].length - 1];
  resultado.push(`Z = ${zFinal.toFixed(2)}`);

  if (modo === "completo") {
    log += "\n📌 Solución final:\n" + resultado.join("\n");
    return log;
  } else {
    return "🔎 Resultado simplificado:\n\n" + resultado.join("\n");
  }
}
