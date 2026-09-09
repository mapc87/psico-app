-- ==========================================
-- SCRIPT: 04_evaluaciones_psicometricas_extras.sql
-- DESCRIPCIÓN: Inserta tests psicométricos adicionales (DASS-21, BAI, ISI, AUDIT, ASRS-v1.1)
-- ==========================================

-- Insertar DASS-21 (Depresión, Ansiedad y Estrés)
INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'DASS-21 (Escala de Depresión, Ansiedad y Estrés)',
    'Evalúa los estados emocionales de depresión, ansiedad y estrés.',
    '[
      {"id": "q1", "texto": "Me costó mucho relajarme", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco aplicable", "puntaje": 1}, {"texto": "Bastante aplicable", "puntaje": 2}, {"texto": "Muy aplicable", "puntaje": 3}]},
      {"id": "q2", "texto": "Me di cuenta de que tenía la boca seca", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q3", "texto": "No podía sentir ningún sentimiento positivo", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q4", "texto": "Tuve dificultad para respirar", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q5", "texto": "Se me hizo difícil tomar la iniciativa para hacer cosas", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q6", "texto": "Reaccioné exageradamente en ciertas situaciones", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q7", "texto": "Sentí que mis manos temblaban", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q8", "texto": "He sentido que estaba gastando mucha energía nerviosa", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q9", "texto": "Estaba preocupado por situaciones en las que podía tener pánico", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q10", "texto": "He sentido que no había nada que me ilusionara", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q11", "texto": "Me he sentido inquieto", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q12", "texto": "Se me hizo difícil relajarme", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q13", "texto": "Me sentí triste y deprimido", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q14", "texto": "No toleré nada que no me permitiera continuar con lo que estaba haciendo", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q15", "texto": "Sentí que estaba a punto de pánico", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q16", "texto": "Fui incapaz de entusiasmarme con nada", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q17", "texto": "Sentí que valía poco como persona", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q18", "texto": "He tendido a sentirme muy susceptible", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q19", "texto": "Noté latidos de mi corazón sin haber hecho esfuerzo físico", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q20", "texto": "Tuve miedo sin razón", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q21", "texto": "Sentí que la vida no tenía sentido", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 14, "interpretacion": "Normal (Sin síntomas clínicos significativos)"},
      {"min": 15, "max": 23, "interpretacion": "Sintomatología Leve"},
      {"min": 24, "max": 33, "interpretacion": "Sintomatología Moderada"},
      {"min": 34, "max": 63, "interpretacion": "Sintomatología Severa"}
    ]'::jsonb
);

-- Insertar BAI (Inventario de Ansiedad de Beck)
INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'BAI (Inventario de Ansiedad de Beck)',
    'Mide la severidad de los síntomas de ansiedad, especialmente los físicos.',
    '[
      {"id": "q1", "texto": "Hormigueo o entumecimiento", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Levemente", "puntaje": 1}, {"texto": "Moderadamente", "puntaje": 2}, {"texto": "Severamente", "puntaje": 3}]},
      {"id": "q2", "texto": "Sensación de calor", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q3", "texto": "Temblores en las piernas", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q4", "texto": "Incapacidad de relajarse", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q5", "texto": "Miedo a que ocurra lo peor", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q6", "texto": "Mareos o aturdimiento", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q7", "texto": "Latidos del corazón fuertes y acelerados", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q8", "texto": "Inseguridad", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q9", "texto": "Terrores", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q10", "texto": "Nerviosismo", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q11", "texto": "Sensación de ahogo", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q12", "texto": "Temblores en las manos", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q13", "texto": "Miedo a perder el control", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q14", "texto": "Dificultad para respirar", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q15", "texto": "Miedo a morir", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q16", "texto": "Miedo o susto", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q17", "texto": "Indigestión o malestar estomacal", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q18", "texto": "Desmayos", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q19", "texto": "Rubor facial", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q20", "texto": "Sudoración (no debida al calor)", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 7, "interpretacion": "Ansiedad Mínima"},
      {"min": 8, "max": 15, "interpretacion": "Ansiedad Leve"},
      {"min": 16, "max": 25, "interpretacion": "Ansiedad Moderada"},
      {"min": 26, "max": 63, "interpretacion": "Ansiedad Severa"}
    ]'::jsonb
);

-- Insertar ISI (Índice de Severidad del Insomnio)
INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'ISI (Índice de Severidad del Insomnio)',
    'Cuestionario breve para evaluar la severidad del insomnio.',
    '[
      {"id": "q1", "texto": "Dificultad para quedarse dormido/a", "opciones": [{"texto": "Ninguna", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderada", "puntaje": 2}, {"texto": "Severa", "puntaje": 3}, {"texto": "Muy severa", "puntaje": 4}]},
      {"id": "q2", "texto": "Dificultad para mantenerse dormido/a", "opciones": [{"texto": "Ninguna", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderada", "puntaje": 2}, {"texto": "Severa", "puntaje": 3}, {"texto": "Muy severa", "puntaje": 4}]},
      {"id": "q3", "texto": "Problemas de despertar demasiado temprano", "opciones": [{"texto": "Ninguna", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderada", "puntaje": 2}, {"texto": "Severa", "puntaje": 3}, {"texto": "Muy severa", "puntaje": 4}]},
      {"id": "q4", "texto": "¿Qué tan satisfecho/a está con su patrón actual de sueño?", "opciones": [{"texto": "Muy satisfecho", "puntaje": 0}, {"texto": "Satisfecho", "puntaje": 1}, {"texto": "Neutral", "puntaje": 2}, {"texto": "Insatisfecho", "puntaje": 3}, {"texto": "Muy insatisfecho", "puntaje": 4}]},
      {"id": "q5", "texto": "¿Qué tan notable considera que es su problema de sueño para los demás en términos de su calidad de vida?", "opciones": [{"texto": "Nada notable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}, {"texto": "Extremadamente", "puntaje": 4}]},
      {"id": "q6", "texto": "¿Qué tan preocupado/a o afligido/a está por su problema actual de sueño?", "opciones": [{"texto": "Nada preocupado", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Moderadamente", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}, {"texto": "Extremadamente", "puntaje": 4}]},
      {"id": "q7", "texto": "¿Hasta qué punto interfiere su problema de sueño con su funcionamiento diario (fatiga, concentración, memoria)?", "opciones": [{"texto": "No interfiere", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Moderadamente", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}, {"texto": "Extremadamente", "puntaje": 4}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 7, "interpretacion": "Sin insomnio clínicamente significativo"},
      {"min": 8, "max": 14, "interpretacion": "Insomnio Subclínico"},
      {"min": 15, "max": 21, "interpretacion": "Insomnio Clínico Moderado"},
      {"min": 22, "max": 28, "interpretacion": "Insomnio Clínico Severo"}
    ]'::jsonb
);

-- Insertar AUDIT (Alcohol)
INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'AUDIT (Cuestionario de Identificación de Trastornos Debidos al Consumo de Alcohol)',
    'Prueba de la OMS para detectar el consumo perjudicial y de riesgo de alcohol.',
    '[
      {"id": "q1", "texto": "¿Con qué frecuencia consume alguna bebida alcohólica?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "1 o menos veces al mes", "puntaje": 1}, {"texto": "2 a 4 veces al mes", "puntaje": 2}, {"texto": "2 a 3 veces a la semana", "puntaje": 3}, {"texto": "4 o más veces a la semana", "puntaje": 4}]},
      {"id": "q2", "texto": "¿Cuántas bebidas alcohólicas suele consumir en un día de consumo normal?", "opciones": [{"texto": "1 o 2", "puntaje": 0}, {"texto": "3 o 4", "puntaje": 1}, {"texto": "5 o 6", "puntaje": 2}, {"texto": "7 a 9", "puntaje": 3}, {"texto": "10 o más", "puntaje": 4}]},
      {"id": "q3", "texto": "¿Con qué frecuencia toma 6 o más bebidas alcohólicas en un solo día?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q4", "texto": "¿Con qué frecuencia en el curso del último año ha sido incapaz de parar de beber una vez había empezado?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q5", "texto": "¿Con qué frecuencia en el curso del último año no pudo hacer lo que se esperaba de usted porque había bebido?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q6", "texto": "¿Con qué frecuencia en el curso del último año ha necesitado beber en ayunas para recuperarse después de haber bebido mucho el día anterior?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q7", "texto": "¿Con qué frecuencia en el curso del último año ha tenido remordimientos o sentimientos de culpa después de haber bebido?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q8", "texto": "¿Con qué frecuencia en el curso del último año no ha podido recordar lo que sucedió la noche anterior porque había estado bebiendo?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q9", "texto": "¿Usted o alguna otra persona ha resultado herido porque usted había bebido?", "opciones": [{"texto": "No", "puntaje": 0}, {"texto": "Sí, pero no en el curso del último año", "puntaje": 2}, {"texto": "Sí, el último año", "puntaje": 4}]},
      {"id": "q10", "texto": "¿Algún familiar, amigo, médico o profesional sanitario ha mostrado preocupación por su consumo de alcohol o le ha sugerido que deje de beber?", "opciones": [{"texto": "No", "puntaje": 0}, {"texto": "Sí, pero no en el curso del último año", "puntaje": 2}, {"texto": "Sí, el último año", "puntaje": 4}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 7, "interpretacion": "Consumo de bajo riesgo"},
      {"min": 8, "max": 15, "interpretacion": "Consumo de Riesgo"},
      {"min": 16, "max": 19, "interpretacion": "Consumo Perjudicial"},
      {"min": 20, "max": 40, "interpretacion": "Posible Dependencia del Alcohol"}
    ]'::jsonb
);

-- Insertar ASRS-v1.1 (TDAH Screener)
INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'ASRS-v1.1 (Cuestionario Corto para TDAH)',
    'Herramienta de despistaje (Screener de 6 preguntas) de la OMS para detectar el TDAH en adultos.',
    '[
      {"id": "q1", "texto": "¿Con qué frecuencia tiene dificultad para concentrarse en lo que la gente le dice, incluso cuando están hablándole directamente?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q2", "texto": "¿Con qué frecuencia abandona su asiento en reuniones o en otras situaciones en las que se espera que permanezca sentado?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q3", "texto": "¿Con qué frecuencia le cuesta relajarse o descansar cuando tiene tiempo libre?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q4", "texto": "¿Con qué frecuencia se encuentra a sí mismo terminando las frases de las personas con las que habla, antes de que ellas puedan terminarlas?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q5", "texto": "¿Con qué frecuencia posterga las cosas hasta el último minuto?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q6", "texto": "¿Con qué frecuencia depende de otros para mantener su vida en orden o para atender detalles?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 3, "interpretacion": "Sintomatología Negativa para TDAH"},
      {"min": 4, "max": 6, "interpretacion": "Sintomatología Altamente Sugestiva de TDAH"}
    ]'::jsonb
);
