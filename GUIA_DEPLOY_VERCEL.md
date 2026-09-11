# Guía de Despliegue Paso a Paso (Vercel + Supabase)

Esta guía te ayudará a instalar y desplegar el proyecto PsicoApp desde cero utilizando GitHub, Supabase (para la base de datos) y Vercel (para el hosting del frontend).

---

## 1. Requisitos Previos

Antes de empezar, asegúrate de tener cuentas creadas en las siguientes plataformas (todas tienen capa gratuita):
- [GitHub](https://github.com/) (Para guardar el código)
- [Supabase](https://supabase.com/) (Base de Datos y Autenticación)
- [Vercel](https://vercel.com/) (Hosting web)
- [Google AI Studio](https://aistudio.google.com/app/apikey) (Para obtener tu API Key de Gemini)

---

## 2. Preparar la Base de Datos (Supabase)

1. Entra a [Supabase](https://supabase.com/) y crea un **Nuevo Proyecto** (*New Project*).
2. Asigna un nombre (ej. `psico-app-db`) y una contraseña fuerte para la base de datos (guárdala bien).
3. Espera un par de minutos a que el proyecto termine de crearse.
4. En el panel izquierdo de Supabase, ve a **SQL Editor**.
5. Haz clic en **New query** (Nueva consulta).
6. Copia todo el contenido del archivo `init_database_full.sql` que está en este repositorio y pégalo en el editor.
7. Presiona el botón **Run** (Ejecutar).
   - *Este script creará todas las tablas, configurará la seguridad (RLS), e insertará los roles y plantillas necesarias para que el sistema funcione.*

### Obtener tus Llaves de Supabase
1. En el panel izquierdo, ve a **Project Settings** (el ícono de engranaje ⚙️) y luego a **API**.
2. Copia y guarda en un bloc de notas temporal estos dos valores:
   - **Project URL** (Esa será tu `VITE_SUPABASE_URL`)
   - **Project API Keys -> anon / public** (Esa será tu `VITE_SUPABASE_ANON_KEY`)

---

## 3. Subir el Proyecto a GitHub

Si ya tienes el código en GitHub, puedes saltar este paso. Si no:
1. Crea un nuevo repositorio en GitHub (puede ser privado).
2. Abre la terminal en la carpeta del proyecto en tu computadora y ejecuta:
   ```bash
   git add .
   git commit -m "Versión inicial lista para producción"
   git push
   ```

---

## 4. Desplegar en Vercel

1. Entra a tu cuenta de [Vercel](https://vercel.com/) y haz clic en **Add New... -> Project**.
2. En la lista, busca tu repositorio de GitHub y haz clic en **Import**.
3. En la pantalla de configuración del proyecto (*Configure Project*), asegúrate de que:
   - **Framework Preset**: Esté seleccionado **Vite**.
   - **Root Directory**: `./` (por defecto).
4. **¡IMPORTANTE!** Antes de darle clic a Deploy, abre la sección **Environment Variables** y agrega las siguientes variables (usando las llaves que guardaste de Supabase y Google):

   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://tucodigo.supabase.co` *(La URL que copiaste)*
   
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUz...` *(La llave pública larga de Supabase)*
   
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** `AIzaSyB...` *(Tu llave de Google AI Studio)*

5. Ahora sí, haz clic en el botón azul **Deploy**.
6. Espera alrededor de 1 o 2 minutos. ¡Verás confeti cuando esté listo! 🎉

---

## 5. Notas Finales y Resolución de Problemas

- **Error 404 al recargar la página:** Este proyecto incluye un archivo `vercel.json` para arreglar el enrutamiento. Asegúrate de que este archivo se subió correctamente a GitHub.
- **Error "Faltan variables de entorno":** Si olvidaste agregar las variables en el paso 4, puedes ir a **Settings -> Environment Variables** en Vercel, agregarlas y luego ir a **Deployments** y hacer clic en **Redeploy** para que Vercel compile el código nuevamente con las nuevas llaves.
- **Creación del primer usuario:** Al entrar a la web por primera vez, regístrate normalmente. El sistema detectará que eres el primer usuario y te convertirá automáticamente en el **SuperAdmin** del SaaS.
