import os

files = [
    'src/types/index.ts',
    'src/pages/NuevoPaciente.tsx',
    'src/pages/EditarPaciente.tsx',
    'src/pages/Pacientes.tsx'
]

replacements = {
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã±': 'ñ',
    'Ã‘': 'Ñ',
    'Ã“': 'Ó',
    'Ã‰': 'É',
    'Ã\x81': 'Á',
    'Ã\x8d': 'Í',
    'Ã\x9a': 'Ú',
    'Ã“': 'Ó',
    'Ã“': 'Ó',
    'Ã“': 'Ó'
}

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        # There might be some tricky ones, let's also try to just encode/decode latin1
        try:
            # If the file was written as utf-8 but the content was latin-1 bytes masquerading as utf-8...
            content = original.encode('latin1').decode('utf-8')
        except:
            # Fallback to simple replace
            for bad, good in replacements.items():
                content = content.replace(bad, good)
                
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed {filepath}')
