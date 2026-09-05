import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    for (const [search, replace] of replacements) {
        const newContent = content.split(search).join(replace);
        if (newContent !== content) {
            content = newContent;
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. Fix "doctor" -> "admin" in several files
const doctorToAdmin = [
    ['=== "doctor"', '=== "admin"'],
    ["=== 'doctor'", "=== 'admin'"],
    ['"admin" | "doctor"', '"superadmin" | "admin" | "personal"'],
    ["'admin' | 'doctor'", '"superadmin" | "admin" | "personal"']
];
replaceInFile('src/components/ProtectedRoute.tsx', doctorToAdmin);
replaceInFile('src/layouts/MainLayout.tsx', doctorToAdmin);
replaceInFile('src/pages/PacienteDetalle.tsx', doctorToAdmin);
replaceInFile('src/pages/Personal.tsx', doctorToAdmin);
replaceInFile('src/pages/Roles.tsx', doctorToAdmin);
replaceInFile('src/pages/CrearUsuario.tsx', doctorToAdmin);

// 2. Fix ModalNuevoSigno.tsx
replaceInFile('src/components/signos/ModalNuevoSigno.tsx', [
    ['presionArterial', 'presion_arterial'],
    ['frecuenciaCardiaca', 'frecuencia_cardiaca'],
    ['saturacionOxigeno', 'saturacion_oxigeno']
]);

// 3. Fix Roles.tsx missing verFinanzas
replaceInFile('src/pages/Roles.tsx', [
    ['verMedicamentos: false }', 'verMedicamentos: false, verFinanzas: false }']
]);

// 4. Fix PacienteDetalle.tsx properties
replaceInFile('src/pages/PacienteDetalle.tsx', [
    ['presionArterial', 'presion_arterial'],
    ['frecuenciaCardiaca', 'frecuencia_cardiaca'],
    ['saturacionOxigeno', 'saturacion_oxigeno'],
    ['tipoExamen', 'tipo_examen'],
    ['fechaSolicitud', 'fecha_solicitud'],
    ['ultimoSigno.temperatura', '(ultimoSigno.temperatura || 0)'],
    ['ultimoSigno.imc', '(ultimoSigno.imc || 0)'],
    ['pacienteId: pacienteId', 'paciente_id: pacienteId'],
    ['<ModalNuevaNotaIA isOpen={showIA} onClose={() => setShowIA(false)} onSave={handleSaveAINote} />', '<ModalNuevaNotaIA isOpen={showIA} onClose={() => setShowIA(false)} onSave={handleSaveAINote} pacienteNombre={paciente?.nombre || ""} />'],
    ['<ModalNuevaFactura\n        isOpen={showFacturaModal}\n        onClose={() => setShowFacturaModal(false)}\n        onSave={handleSaveFactura}\n        pacienteId={id || \'\'}\n      />', '<ModalNuevaFactura\n        isOpen={showFacturaModal}\n        onClose={() => setShowFacturaModal(false)}\n        onSave={handleSaveFactura}\n        pacienteId={id || \'\'}\n        pacienteNombre={paciente?.nombre || \'\'}\n      />']
]);

// 5. Fix OrdenExamenPrint.tsx properties
replaceInFile('src/components/examenes/OrdenExamenPrint.tsx', [
    ['fechaSolicitud', 'fecha_solicitud'],
    ['tipoExamen', 'tipo_examen']
]);

// 6. Fix ProtectedRoute.tsx catch promise error
replaceInFile('src/components/ProtectedRoute.tsx', [
    ['}).catch((err) => {', '});\n    /*']
]);

console.log("Fixes applied!");
