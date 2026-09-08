-- ==========================================
-- SCRIPT: 03_evaluaciones_psicometricas.sql
-- DESCRIPCIÓN: Crea las tablas para gestionar tests psicométricos
-- ==========================================

-- 1. TABLA DE PLANTILLAS DE EVALUACIÓN
CREATE TABLE IF NOT EXISTS public.evaluaciones_plantillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID REFERENCES public.clinicas(id) ON DELETE CASCADE, -- NULL significa que es global
    titulo TEXT NOT NULL,
    descripcion TEXT,
    preguntas JSONB NOT NULL DEFAULT '[]'::jsonb,
    escalas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.evaluaciones_plantillas ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos pueden leer las globales (clinica_id IS NULL) o las de su propia clínica
CREATE POLICY "user_select_evaluaciones_plantillas" ON public.evaluaciones_plantillas 
FOR SELECT USING (clinica_id IS NULL OR clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "user_insert_evaluaciones_plantillas" ON public.evaluaciones_plantillas 
FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "user_update_evaluaciones_plantillas" ON public.evaluaciones_plantillas 
FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "user_delete_evaluaciones_plantillas" ON public.evaluaciones_plantillas 
FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));


-- 2. TABLA DE EVALUACIONES REALIZADAS A PACIENTES
CREATE TABLE IF NOT EXISTS public.evaluaciones_pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    plantilla_id UUID NOT NULL REFERENCES public.evaluaciones_plantillas(id) ON DELETE RESTRICT,
    respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
    puntaje_total INTEGER NOT NULL DEFAULT 0,
    interpretacion TEXT,
    estado TEXT NOT NULL DEFAULT 'completado',
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.evaluaciones_pacientes ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "user_select_evaluaciones_pacientes" ON public.evaluaciones_pacientes 
FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "user_insert_evaluaciones_pacientes" ON public.evaluaciones_pacientes 
FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "user_update_evaluaciones_pacientes" ON public.evaluaciones_pacientes 
FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "user_delete_evaluaciones_pacientes" ON public.evaluaciones_pacientes 
FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));


-- ==========================================
-- INSERCIÓN DE DATOS SEMILLA (GLOBALES)
-- ==========================================

-- Insertar GAD-7 (Ansiedad)
INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'GAD-7 (Trastorno de Ansiedad Generalizada)',
    'Herramienta de detección breve para medir la gravedad de la ansiedad.',
    '[
      {"id": "q1", "texto": "Sentirse nervioso/a, intranquilo/a o con los nervios de punta", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q2", "texto": "No poder dejar de preocuparse o no poder controlar la preocupación", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q3", "texto": "Preocuparse demasiado por diferentes cosas", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q4", "texto": "Dificultad para relajarse", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q5", "texto": "Estar tan inquieto/a que es difícil quedarse quieto/a", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q6", "texto": "Estar fácilmente irritable o molestarse con facilidad", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q7", "texto": "Sentir miedo como si algo terrible fuera a pasar", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 4, "interpretacion": "Ansiedad Mínima"},
      {"min": 5, "max": 9, "interpretacion": "Ansiedad Leve"},
      {"min": 10, "max": 14, "interpretacion": "Ansiedad Moderada"},
      {"min": 15, "max": 21, "interpretacion": "Ansiedad Severa"}
    ]'::jsonb
);

-- Insertar PHQ-9 (Depresión)
INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'PHQ-9 (Cuestionario de Salud del Paciente)',
    'Herramienta de detección para evaluar la presencia y gravedad de la depresión.',
    '[
      {"id": "q1", "texto": "Poco interés o placer en hacer las cosas", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q2", "texto": "Sentirse desanimado/a, deprimido/a o sin esperanza", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q3", "texto": "Problemas para dormir o mantenerse dormido/a, o dormir demasiado", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q4", "texto": "Sentirse cansado/a o tener poca energía", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q5", "texto": "Tener poco apetito o comer en exceso", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q6", "texto": "Sentirse mal con usted mismo/a, o que es un fracaso, o que se ha decepcionado a usted mismo/a o a su familia", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q7", "texto": "Dificultad para concentrarse en cosas tales como leer el periódico o ver la televisión", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q8", "texto": "Moverse o hablar tan lentamente que otras personas podrían haberlo notado. O, por el contrario, estar tan inquieto/a o agitado/a que se ha estado moviendo mucho más de lo normal", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
      {"id": "q9", "texto": "Pensamientos de que estaría mejor muerto/a o de lastimarse de alguna manera", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 4, "interpretacion": "Depresión Mínima"},
      {"min": 5, "max": 9, "interpretacion": "Depresión Leve"},
      {"min": 10, "max": 14, "interpretacion": "Depresión Moderada"},
      {"min": 15, "max": 19, "interpretacion": "Depresión Moderadamente Severa"},
      {"min": 20, "max": 27, "interpretacion": "Depresión Severa"}
    ]'::jsonb
);

-- Insertar PSS-14 (Estrés Percibido)
INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'PSS-14 (Escala de Estrés Percibido)',
    'Evalúa el grado en que las situaciones de la vida son valoradas como estresantes.',
    '[
      {"id": "q1", "texto": "En el último mes, ¿con qué frecuencia ha estado afectado por algo que ha ocurrido inesperadamente?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q2", "texto": "En el último mes, ¿con qué frecuencia se ha sentido incapaz de controlar las cosas importantes en su vida?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q3", "texto": "En el último mes, ¿con qué frecuencia se ha sentido nervioso o estresado?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q4", "texto": "En el último mes, ¿con qué frecuencia ha manejado con éxito los pequeños problemas irritantes de la vida?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q5", "texto": "En el último mes, ¿con qué frecuencia ha sentido que ha afrontado efectivamente los cambios importantes que han estado ocurriendo en su vida?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q6", "texto": "En el último mes, ¿con qué frecuencia ha estado seguro sobre su capacidad para manejar sus problemas personales?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q7", "texto": "En el último mes, ¿con qué frecuencia ha sentido que las cosas le van bien?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q8", "texto": "En el último mes, ¿con qué frecuencia ha sentido que no podía afrontar todas las cosas que tenía que hacer?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q9", "texto": "En el último mes, ¿con qué frecuencia ha podido controlar las dificultades de su vida?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q10", "texto": "En el último mes, ¿con qué frecuencia se ha sentido dueño de la situación?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q11", "texto": "En el último mes, ¿con qué frecuencia ha estado enfadado porque las cosas que le han ocurrido estaban fuera de su control?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q12", "texto": "En el último mes, ¿con qué frecuencia ha pensado sobre las cosas que le quedan por hacer?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q13", "texto": "En el último mes, ¿con qué frecuencia ha podido controlar la forma de pasar el tiempo?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q14", "texto": "En el último mes, ¿con qué frecuencia ha sentido que las dificultades se acumulan tanto que no puede superarlas?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 14, "interpretacion": "Casi nunca o nunca está estresado"},
      {"min": 15, "max": 28, "interpretacion": "De vez en cuando está estresado"},
      {"min": 29, "max": 42, "interpretacion": "A menudo está estresado"},
      {"min": 43, "max": 56, "interpretacion": "Muy a menudo está estresado"}
    ]'::jsonb
);

-- Insertar RSES (Escala de Autoestima de Rosenberg)
INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'Escala de Autoestima de Rosenberg',
    'Uno de los instrumentos más utilizados para evaluar la autoestima global.',
    '[
      {"id": "q1", "texto": "Siento que soy una persona digna de aprecio, al menos en igual medida que los demás", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q2", "texto": "Siento que tengo cualidades positivas", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q3", "texto": "En general, me inclino a pensar que soy un fracasado/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
      {"id": "q4", "texto": "Soy capaz de hacer las cosas tan bien como la mayoría de los demás", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q5", "texto": "Siento que no tengo mucho de lo que sentirme orgulloso/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
      {"id": "q6", "texto": "Tomo una actitud positiva hacia mí mismo/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q7", "texto": "En general, estoy satisfecho/a conmigo mismo/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q8", "texto": "Me gustaría poder sentir más respeto por mí mismo/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
      {"id": "q9", "texto": "A veces me siento inútil", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
      {"id": "q10", "texto": "A veces pienso que no sirvo para nada", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]}
    ]'::jsonb,
    '[
      {"min": 10, "max": 25, "interpretacion": "Autoestima Baja"},
      {"min": 26, "max": 29, "interpretacion": "Autoestima Media (Normal)"},
      {"min": 30, "max": 40, "interpretacion": "Autoestima Alta"}
    ]'::jsonb
);
