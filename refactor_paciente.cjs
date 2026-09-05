const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/PacienteDetalle.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(/import ModalNuevaFactura from '..\/components\/finanzas\/ModalNuevaFactura';\n/g, '');
content = content.replace(/import ModalRegistrarPago from '..\/components\/finanzas\/ModalRegistrarPago';\n/g, '');
content = content.replace(/, Factura/g, '');

// 2. States
content = content.replace(/const \[isFacturaModalOpen.*?\n/g, '');
content = content.replace(/const \[isPagoModalOpen.*?\n/g, '');
content = content.replace(/const \[facturaSeleccionada.*?\n/g, '');
content = content.replace(/const \[facturas.*?\n/g, '');

content = content.replace(/const \[isFirmaModalOpen, setIsFirmaModalOpen\] = useState\(false\);/, 'const [isFirmaModalOpen, setIsFirmaModalOpen] = useState(false);\n  const [isGestorDocumentosOpen, setIsGestorDocumentosOpen] = useState(false);');

// 3. Fetch
content = content.replace(/const { data: fData } = await supabase\.from\('facturas'\).*?\n\s*if \(fData\) setFacturas\(fData\);\n/g, '');

// 4. Tabs array
const newTabs = `  const allTabs = [
    { id: 'resumen', label: 'Resumen', icon: <User size={18} />, key: 'verResumen' },
    { id: 'citas', label: 'Citas', icon: <CalendarPlus size={18} />, key: 'verCitas' },
    { id: 'examenes', label: 'Exámenes', icon: <ClipboardList size={18} />, key: 'verExamenes' },
    { id: 'signos', label: 'Signos Vitales', icon: <Heart size={18} />, key: 'verSignos' },
    { id: 'historial', label: 'Historial', icon: <FileText size={18} />, key: 'verHistorial' },
    { id: 'diagnosticos', label: 'Diagnósticos', icon: <Activity size={18} />, key: 'verDiagnosticos' },
    { id: 'medicamentos', label: 'Medicamentos', icon: <Pill size={18} />, key: 'verMedicamentos' },
  ];`;
content = content.replace(/const allTabs = \[[\s\S]*?\];/, newTabs);

// 5. Header Back Button
const oldHeaderBack = `      {/* Botón de Regresar */}
      <div>
        <Link to="/pacientes" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors group">
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Volver a Pacientes
        </Link>
      </div>`;
const newHeaderBack = `      {/* Botón de Regresar y Acciones Globales */}
      <div className="flex justify-between items-center">
        <Link to="/pacientes" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors group">
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Volver a Pacientes
        </Link>
        <button 
          onClick={() => setIsGestorDocumentosOpen(true)}
          className="flex items-center px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl border border-slate-200 shadow-sm text-sm font-bold transition-all cursor-pointer"
        >
          <FileSignature size={16} className="mr-2" />
          Documentos Legales
        </button>
      </div>`;
content = content.replace(oldHeaderBack, newHeaderBack);

// 6. Extracción del body de Documentos
const docTabMatch = content.match(/{\/\* Pestaña: Documentos Legales \*\/}[\s\S]*?(?={\/\* Pestaña: Notas IA \*\/})/);
let docBody = '';
if (docTabMatch) {
  docBody = docTabMatch[0].replace(/{\/\* Pestaña: Documentos Legales \*\/}\s*{activeTab === 'documentos' && \(\s*<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">/, '<div className="space-y-6">').replace(/<\/div>\s*\)\s*}$/m, '</div>');
  content = content.replace(docTabMatch[0], ''); // Eliminar pestaña de documentos
}

// 7. Eliminar Pestaña: Notas IA
content = content.replace(/{\/\* Pestaña: Notas IA \*\/}[\s\S]*?(?={\/\* Pestaña: Historial \*\/})/, '');

// 8. Reemplazar Historial
const newHistorial = `{/* Pestaña: Historial */}
          {activeTab === 'historial' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Notas Clínicas y Evolución</h3>
                  <p className="text-sm text-slate-500">Historial médico del paciente.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsNotaModalOpen(true)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm rounded-xl text-sm font-bold transition-all cursor-pointer"
                  >
                    + Nota Manual
                  </button>
                  <button 
                    onClick={() => setIsNotaIAModalOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-600/20 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center"
                  >
                    <Sparkles size={16} className="mr-2" />
                    Redactar con IA
                  </button>
                </div>
              </div>
              
              {notas && notas.length > 0 ? (
                <div className="relative pl-8 border-l-2 border-violet-200/50 space-y-8 py-2">
                  {notas.map((nota) => (
                    <div key={nota.id} className="relative group">
                      <div className="absolute -left-[41px] bg-white w-5 h-5 rounded-full border-4 border-violet-500 shadow-sm group-hover:scale-125 transition-transform duration-300"></div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 group-hover:border-violet-200 group-hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-violet-700 bg-violet-100 px-3 py-1 rounded-full flex items-center">
                            {nota.titulo.toLowerCase().includes('ia') || nota.titulo.toLowerCase().includes('soap') ? <BrainCircuit size={14} className="mr-1.5" /> : <FileText size={14} className="mr-1.5" />}
                            {nota.titulo}
                          </span>
                          <span className="text-sm font-medium text-slate-400">
                            {new Date(nota.fecha).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{nota.contenido}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-semibold text-slate-500">Aún no hay notas clínicas</p>
                  <p className="text-sm text-slate-400 mt-2">Usa "+ Nota Manual" o "Redactar con IA" para registrar la primera evolución del paciente.</p>
                </div>
              )}
            </div>
          )}`;
content = content.replace(/{\/\* Pestaña: Historial \*\/}[\s\S]*?(?={\/\* Pestaña: Diagnósticos \*\/})/, newHistorial + '\n\n          ');

// 9. Eliminar Finanzas
content = content.replace(/{\/\* Pestaña: Finanzas \*\/}[\s\S]*?(?=<\/div>\s*<\/div>\s*{isCitaModalOpen)/, '');

// 10. Agregar GestorDocumentos Modal y limpiar Modales de Finanzas al final
const finanzasModalsRegex = /{isFacturaModalOpen[\s\S]*?isPagoModalOpen[\s\S]*?<\/ModalRegistrarPago>\s*\)}/m;
content = content.replace(finanzasModalsRegex, '');

const newModalDocumentos = `
      {/* Modal Lateral de Gestor de Documentos */}
      {isGestorDocumentosOpen && (
        <div className="fixed inset-0 z-50 flex justify-end p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-right-8 duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <FileSignature className="mr-2 text-indigo-600" size={24} />
                Gestor de Documentos Legales
              </h3>
              <button 
                onClick={() => setIsGestorDocumentosOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
               ${docBody}
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(/<\/div>\s*\);\s*}\s*$/, newModalDocumentos + '    </div>\n  );\n}\n');

fs.writeFileSync(file, content);
console.log('Done refactoring PacienteDetalle.tsx');
