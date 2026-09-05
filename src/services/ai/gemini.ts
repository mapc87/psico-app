import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'PEGAR_AQUI_TU_LLAVE_DE_GEMINI') {
  ai = new GoogleGenAI({ apiKey });
}

const SYSTEM_PROMPT = `
Eres un asistente experto para psicólogos clínicos. Tu objetivo es convertir un borrador desordenado o notas rápidas de un psicólogo en una Nota Clínica estructurada y profesional utilizando el formato SOAP.

El formato SOAP es:
- **S** (Subjetivo): Lo que el paciente refiere, sus síntomas, percepciones y quejas (puedes usar citas textuales breves).
- **O** (Objetivo): Lo que el terapeuta observa: estado mental, afecto, lenguaje, postura, conducta durante la sesión.
- **A** (Análisis/Assessment): Tu análisis clínico, impresión diagnóstica, progreso y mecanismos psicológicos observados.
- **P** (Plan): Los pasos a seguir, tareas asignadas, técnicas aplicadas hoy y objetivos para la siguiente cita.

REGLAS ESTRICTAS:
1. NO inventes síntomas que el psicólogo no haya mencionado.
2. Utiliza terminología técnica, clínica y formal propia de la psicología clínica y psiquiatría.
3. El resultado DEBE ser un texto en formato Markdown simple.
4. Usa los títulos: S: (Subjetivo), O: (Objetivo), A: (Análisis), P: (Plan).
5. Si el borrador está incompleto, deduce el objetivo y el análisis de la forma más conservadora posible basándote solo en lo que hay.
`;

export async function generarNotaSOAP(borrador: string): Promise<string> {
  if (!ai) {
    throw new Error('La API Key de Gemini no está configurada o es inválida. Revisa tu archivo .env.local');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nAquí están mis notas de la sesión de hoy:\n"""\n${borrador}\n"""\n\nPor favor, genera la nota clínica en formato SOAP.` }]
        }
      ],
      config: {
        temperature: 0.3, // Menor temperatura para textos clínicos (más precisos)
      }
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error('No se pudo generar el texto de la nota.');
    }
  } catch (error) {
    console.error('Error al llamar a Gemini:', error);
    throw error;
  }
}
