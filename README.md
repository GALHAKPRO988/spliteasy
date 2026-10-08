# SplitEasy

**Divide gastos entre amigos sin líos.** Una alternativa pequeña, open source y selfhosteable a Splitwise.

Crea un grupo, añade personas, apunta quién pagó qué… y SplitEasy te dice quién paga a quién, con el **mínimo número de transferencias**.

## Cómo usar SplitEasy

La forma principal de utilizar SplitEasy es **descargar el APK e instalarlo directamente en tu teléfono Android**.

Las versiones disponibles de la aplicación se publican en **[GitHub Releases](../../releases)**, donde puedes descargar el APK de la versión que quieras.

También puedes utilizar SplitEasy como aplicación web. Puedes desplegarla en un servidor y acceder a ella desde **cualquier dispositivo y desde cualquier lugar**, siempre que tengas acceso al servidor.

```text
                SplitEasy
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
   APK Android            Aplicación web
        ↓                     ↓
     Teléfono          Cualquier dispositivo
```

El proyecto completo está disponible en GitHub.

---

## Funcionalidades

* Grupos con nombre y participantes (solo nombre, sin cuentas).
* Gastos con concepto, importe, fecha, quién pagó y entre quiénes se divide (todos o algunos).
* Editar y eliminar gastos.
* Eliminar personas sin gastos asociados.
* Balance por persona: cuánto pagó, cuánto le tocaba y su saldo.
* **Quién paga a quién**, simplificando las deudas al máximo.
* Marcar pagos como realizados.
* Copiar y compartir el resumen.
* Datos guardados en tu propio servidor, en un único archivo.
* Diseño mobile-first.
* Aplicación Android mediante APK.
* Aplicación web accesible desde cualquier dispositivo.

## ¿Por qué SplitEasy?

Los gastos de un grupo no deberían requerir una plataforma complicada.

SplitEasy está pensado para ser **simple, ligero y transparente**. No necesitas crear cuentas para usarlo y no dependes de una plataforma externa para gestionar tus gastos.

El proyecto es **open source** y su código está disponible públicamente en GitHub.

---

## Android

La forma principal de utilizar SplitEasy es mediante su aplicación Android.

Las versiones oficiales del APK están disponibles en **[GitHub Releases](../../releases)**.

Solo tienes que descargar el APK de la versión que quieras e instalarlo en tu teléfono Android.

El proyecto Android se encuentra en:

```text
android/
```

Para generar el APK a partir del proyecto:

```bash
npx vite build --config vite.config.capacitor.ts
npx cap sync
npx cap open android
```

Después puedes generar el APK desde Android Studio.

La aplicación Android utiliza el mismo código de SplitEasy que la versión web.

---

## Aplicación web

También puedes ejecutar SplitEasy como aplicación web y acceder a ella desde cualquier dispositivo.

Esto permite utilizarla desde:

* Ordenadores.
* Teléfonos Android.
* Tablets.
* Otros dispositivos con un navegador web.

Una vez desplegada en un servidor, puedes acceder a SplitEasy desde cualquier lugar donde ese servidor sea accesible.

---

## Instalación con Docker

Solo necesitas tener [Docker](https://docs.docker.com/get-docker/) instalado.

```bash
git clone https://github.com/TU-USUARIO/spliteasy.git
cd spliteasy
cp .env.example .env
docker compose up -d
```

Abre:

```text
http://localhost:3000
```

Para pararlo:

```bash
docker compose down
```

### Variables de entorno

Edita el archivo `.env`:

| Variable    | Por defecto | Qué hace                                                  |
| ----------- | ----------- | --------------------------------------------------------- |
| `PORT`      | `3000`      | Puerto en el que se abre la aplicación.                   |
| `DATA_DIR`  | `/data`     | Carpeta dentro del contenedor donde se guardan los datos. |
| `SEED_DEMO` | `false`     | Si es `true`, crea un grupo de ejemplo la primera vez.    |

No hay secretos obligatorios que configurar.

### Backup de los datos

Los datos se almacenan en un único archivo:

```text
./data/spliteasy.json
```

Para crear una copia de seguridad:

```bash
cp data/spliteasy.json backup-$(date +%F).json
```

Para restaurar los datos, detén la aplicación, sustituye `data/spliteasy.json` por la copia de seguridad y vuelve a iniciarla.

### Actualizar

```bash
git pull
docker compose up -d --build
```

Los datos almacenados en `./data` no se eliminan.

---

## Ejecutar en local

Para desarrollo necesitas [Bun](https://bun.sh) o Node.js con npm.

Con Bun:

```bash
bun install
bun run dev
```

Con npm:

```bash
npm install
npm run dev
```

Abre la URL que aparezca en la terminal.

---

## Stack

* [TanStack Start](https://tanstack.com/start) (React + server functions).
* [Tailwind CSS](https://tailwindcss.com/).
* [Capacitor](https://capacitorjs.com/) para Android.
* JSON como almacenamiento, con escrituras atómicas.
* [Zod](https://zod.dev/) para la validación de datos en el servidor.

### Estructura principal

```text
src/lib/splits.ts            cálculos de balances y transferencias
src/lib/db.server.ts         almacenamiento en archivo
src/lib/groups.functions.ts  API del servidor con validación
src/routes/                  páginas de la aplicación
android/                     proyecto Android de Capacitor
```

---

## Seguridad

* Esta versión no incluye autenticación.
* Cualquiera con acceso al servidor puede ver los grupos.
* Si expones SplitEasy a Internet, utiliza una capa adicional de protección, como un proxy con autenticación o una VPN.
* Los datos recibidos por el servidor se validan.
* Solo se almacena la información necesaria para gestionar los gastos.
* El contenedor se ejecuta con un usuario sin privilegios.

---

## Contribuir

1. Haz un fork del repositorio.
2. Crea una rama para tu cambio:

```bash
git checkout -b mi-mejora
```

3. Mantén el proyecto simple y fácil de mantener.
4. Abre un Pull Request explicando los cambios realizados.

Los issues y las sugerencias son bienvenidos.

## Licencia

[MIT](LICENSE)

---

Se utilizó IA para desarrollar este proyecto. Recibió también cambios humanos. El código fue revisado por completo antes de subirse.

---
