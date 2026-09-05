const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/PacienteDetalle.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Quitar 'historial' de allTabs
content = content.replace(/\s*{ id: 'historial', label: 'Historial', icon: <FileText size={18} \/>, key: 'verHistorial' },\n/g, '\n');

// 2. Extraer el bloque historial
const historialRegex = /{\/\* Pestaña: Historial \*\/}\s*{activeTab === 'historial' && \(\s*<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">([\s\S]*?)<\/div>\s*\)\s*}/;
const match = content.match(historialRegex);

if (match) {
  let historialContent = match[1]; // El contenido de la pestaña historial
  
  // 3. Eliminar la pestaña historial completa del código
  content = content.replace(historialRegex, '');

  // 4. Inyectar historialContent al final de la pestaña resumen
  const resumenEndRegex = /({\/\* Pestaña: Resumen \*\/}[\s\S]*?)(<\/div>\s*\)\s*})/;
  const matchResumen = content.match(resumenEndRegex);
  
  if (matchResumen) {
    const nuevoResumen = matchResumen[1] + `
              {/* --- Inicio Historial integrado en Resumen --- */}
              <div className="mt-12 border-t border-slate-100 pt-8">
${historialContent}
              </div>
` + matchResumen[2];
    
    content = content.replace(resumenEndRegex, nuevoResumen);
  } else {
    console.log("No se encontro resumenEndRegex");
  }

} else {
  console.log("No se encontro historialRegex");
}

fs.writeFileSync(file, content);
console.log('Merged Resumen and Historial successfully');
