# SplitEasy como APK de Android (sin servidor)

El móvil habla directamente con tu proyecto Supabase. No necesitas servidor propio.

## 1. Base de datos
En Supabase → **SQL Editor**, pega `docs/apk-supabase.sql` y pulsa **Run**.
(Si ya creaste la tabla `groups`, no pasa nada: el script la respeta.)

## 2. Variables
Crea `.env.apk` en la raíz (no lo subas a git):

```
VITE_DIRECT_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_DIRECT_SUPABASE_KEY=sb_publishable_xxx   # la clave pública / anon, NUNCA la service_role
```

## 3. Compilar la web estática
```
bun install
bun run build:apk
```
Genera la app en `.output/public` (con `index.html`).

## 4. Empaquetar con Capacitor
Requisitos: Android Studio + JDK 17.
```
bun add @capacitor/core @capacitor/android
bun add -d @capacitor/cli
bunx cap add android        # solo la primera vez
bunx cap sync android
bunx cap open android       # Build → Build APK(s)
```
Cada vez que cambies código: `bun run build:apk && bunx cap sync android`.

## Notas
- Rota en Supabase la `service_role` key que se compartió por chat; el APK no la usa.
- Sin cuentas: cada móvil ve solo sus grupos. Quien tenga el id de un grupo puede verlo y editarlo.
- Para compartir grupos entre móviles, comparte el enlace/id del grupo.
