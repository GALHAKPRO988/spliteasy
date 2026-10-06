# SplitEasy

**Divide gastos entre amigos sin líos.** Una alternativa pequeña, open source y selfhosteable a Splitwise.

Crea un grupo, añade personas, apunta quién pagó qué… y SplitEasy te dice quién paga a quién, con el **mínimo número de transferencias**.

![Inicio](docs/screenshot-home.png)
![Grupo](docs/screenshot-group.png)

> _Capturas pendientes: añade tus imágenes en la carpeta `docs/`._

---

## Funcionalidades

- Grupos con nombre y participantes (solo nombre, sin cuentas).
- Gastos con concepto, importe, fecha, quién pagó y entre quiénes se divide (todos o algunos).
- Editar y eliminar gastos. Eliminar personas sin gastos asociados.
- Balance por persona: cuánto pagó, cuánto le tocaba y su saldo.
- **Quién paga a quién**, simplificando deudas al máximo.
- Marcar pagos como realizados, copiar y compartir el resumen.
- Datos guardados en tu propio servidor, en un único archivo.
- Diseño mobile-first.

## ¿Por qué selfhostear SplitEasy?

Tus gastos dicen mucho de ti. Con SplitEasy los datos **se quedan en tu servidor**: no hay terceros, ni anuncios, ni analítica, ni cuentas obligatorias. Tampoco dependes de que un servicio externo siga existiendo o cambie sus precios.

---

## Instalación con Docker (recomendado)

Solo necesitas tener [Docker](https://docs.docker.com/get-docker/) instalado. No hace falta saber programar.

```bash
git clone https://github.com/TU-USUARIO/spliteasy.git
cd spliteasy
cp .env.example .env
docker compose up -d
```

Abre **http://localhost:3000** en tu navegador. ¡Listo!

Para pararlo: `docker compose down`.

### Variables de entorno

Edita el archivo `.env`:

| Variable    | Por defecto | Qué hace |
|-------------|-------------|----------|
| `PORT`      | `3000`      | Puerto en el que se abre la app. |
| `DATA_DIR`  | `/data`     | Carpeta (dentro del contenedor) donde se guarda la base de datos. |
| `SEED_DEMO` | `false`     | Si es `true`, crea un grupo de ejemplo la primera vez. |

No hay secretos que configurar.

### Backup de los datos

Todos los datos están en un único archivo: `./data/spliteasy.json`.

```bash
cp data/spliteasy.json backup-$(date +%F).json
```

Para restaurar: para la app, copia el archivo de vuelta a `data/spliteasy.json` y arráncala de nuevo.

### Actualizar

```bash
git pull
docker compose up -d --build
```

Tus datos en `./data` no se tocan.

---

## Ejecutar en local (desarrollo)

Necesitas [Bun](https://bun.sh) (o Node 22 + npm).

```bash
bun install
bun run dev
```

Abre la URL que aparece en la terminal. Los datos se guardan en `./data/spliteasy.json`.

### Stack

- [TanStack Start](https://tanstack.com/start) (React + server functions) y Tailwind CSS.
- Base de datos: un archivo JSON con escrituras atómicas. Cero dependencias, cero servicios externos.
- Validación de todos los datos en el servidor con Zod.

Estructura principal:

```
src/lib/splits.ts            cálculos de balances y transferencias
src/lib/db.server.ts         almacenamiento en archivo
src/lib/groups.functions.ts  API del servidor (con validación)
src/routes/                  páginas
```

## Seguridad

- Sin autenticación en esta versión: cualquiera con acceso a tu servidor puede ver los grupos. Si lo expones a Internet, ponlo detrás de un proxy con contraseña (p. ej. Caddy o Nginx con basic auth) o de una VPN.
- Todo lo que llega al servidor se valida (longitudes, importes, referencias).
- Solo se guarda lo imprescindible: nombres, conceptos, importes y fechas.
- El contenedor corre como usuario sin privilegios.

## Contribuir

1. Haz un fork y crea una rama: `git checkout -b mi-mejora`.
2. Mantén las cosas simples: pocas dependencias, código fácil de leer.
3. Abre un Pull Request explicando el cambio.

Issues y sugerencias son bienvenidos.

## Licencia

[MIT](LICENSE)
