const fs = require('fs');
const path = 'C:\\Users\\mike8\\.gemini\\antigravity-ide\\scratch\\psico-app\\src\\pages\\Perfil.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace corrupted strings with the correct ones
content = content.replace(/Informaci.n/g, 'Información');
content = content.replace(/B.sica/g, 'Básica');
content = content.replace(/Direcci.n/g, 'Dirección');
content = content.replace(/G.nero/g, 'Género');
content = content.replace(/Profesi.nal/g, 'Profesional');
content = content.replace(/Contrase.a/g, 'Contraseña');
content = content.replace(/electr.nico/g, 'electrónico');
content = content.replace(/Electr.nico/g, 'Electrónico');
content = content.replace(/.nico de Identificaci.n/g, 'Único de Identificación');
content = content.replace(/contrase.a/g, 'contraseña');
content = content.replace(/direcci.n/g, 'dirección');

// Replace the remaining SectionTitle
content = content.replace(/<SectionTitle icon=\{<Briefcase size=\{20\} \/>\} title="Información Profesional" \/>/g, '<h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><span className="text-slate-400"><Briefcase size={20} /></span>Información Profesional</h3>');

fs.writeFileSync(path, content, 'utf8');
