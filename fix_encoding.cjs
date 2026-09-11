const fs = require('fs');

const files = [
    'src/types/index.ts',
    'src/pages/NuevoPaciente.tsx',
    'src/pages/EditarPaciente.tsx',
    'src/pages/Pacientes.tsx'
];

files.forEach(filepath => {
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf8');
        const original = content;
        
        const replacements = {
            'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
            'Ã±': 'ñ', 'Ã‘': 'Ñ', 'Ã“': 'Ó', 'Ã‰': 'É', 'Ã\x81': 'Á',
            'Ã\x8d': 'Í', 'Ã\x9a': 'Ú'
        };
        for (const [bad, good] of Object.entries(replacements)) {
            content = content.replaceAll(bad, good);
        }
        
        if (content !== original) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log('Fixed ' + filepath);
        }
    }
});
