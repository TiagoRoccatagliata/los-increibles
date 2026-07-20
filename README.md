# Los Increíbles — Gestor de inversiones inmobiliarias

Panel del consorcio: los datos se cargan en el **Google Sheet** (fuente de
verdad) y la web los sincroniza para ver dashboard, gráficos e informes
(rentabilidad, flujo de caja, evolución del portfolio, comparación entre
propiedades, socios y caja). La web es de **solo lectura**.

**Stack:** Next.js 16 (App Router) · d3.js · PostgreSQL · Prisma 7 · Tailwind CSS

## Flujo de trabajo

1. El consorcio carga todo en el sheet como siempre (UNIDADES, GTS.*, CAJA, GENERAL, tabs por socio, LIQUIDACIONES).
2. En la web, tocás **⟳ Sincronizar**: se leen todas las pestañas y se reemplaza la base completa.
3. Navegás dashboard e informes para leer resultados y decidir.

Qué lee la sincronización:

| Pestaña | Se convierte en |
|---|---|
| `UNIDADES` | Propiedades (estado VENDIDA si tiene F. VENTA; VALOR VTA = precio de venta o estimado) |
| `GTS.TUCUMAN/SAN MARTIN/FUNES/ALSINA/FALUCHO` | Movimientos por propiedad (categoría inferida del concepto) |
| `GENERAL` | Socios con aportes y % |
| `JAVI/JULIA/CATA/JOACO/TIAGO` | Movimientos por socio |
| `CAJA` | Caja del consorcio (saldo y evolución) |
| `LIQUIDACIONES` | Distribuciones por socio (cuando tenga filas) |

Notas del parser: montos es-AR con o sin `$`, fechas `D/M/AA`, filas sin fecha
heredan la anterior, se saltean filas "ANULADO" y las de neto cero (mismo monto
en debe y haber). Los "egresos totales" de la web son brutos; el sheet neta los
recuperos en GASTOS TOTALES — la **ganancia coincide exactamente** con la
columna GANANCIA de UNIDADES.

Si se agrega una unidad nueva, hay que sumar su pestaña `GTS.<NOMBRE>` a la
lista `GTS_TABS` en `src/lib/sync.ts` (y el nombre en UNIDADES debe contener esa
palabra clave). Socios nuevos: agregar el nombre a `MEMBER_TABS`.

## Desarrollo local

Requisitos: Node 20+, Docker.

```bash
docker compose up -d        # Postgres (puerto 5435)
npm install
npx prisma migrate dev
npx prisma db seed          # = sincronizar desde el sheet
npm run dev
```

Abrir http://localhost:3000 — contraseña: `APP_PASSWORD` de `.env`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `APP_PASSWORD` | Contraseña única de acceso a la app |
| `SESSION_SECRET` | Secreto para firmar la cookie de sesión (string largo aleatorio) |
| `SHEET_ID` | ID del Google Sheet (el sheet debe estar compartido como "Cualquiera con el enlace: Lector") |

## Deploy en Dokploy

1. **Base de datos**: crear un servicio **PostgreSQL** en Dokploy. La URL
   interna queda `postgresql://USER:PASS@<nombre-servicio>:5432/DB`.
2. **Aplicación**: crear una **Application** apuntando a este repositorio,
   build type **Dockerfile**.
3. **Variables de entorno**:
   ```
   DATABASE_URL=postgresql://USER:PASS@<servicio-postgres>:5432/DB
   APP_PASSWORD=<tu contraseña>
   SESSION_SECRET=<openssl rand -hex 32>
   SHEET_ID=<id del sheet>
   ```
4. **Dominio**: pestaña Domains, HTTPS con Let's Encrypt, puerto **3000**.
5. Deploy: el contenedor corre `prisma migrate deploy` al arrancar y levanta el
   servidor. Después del primer deploy, entrar y tocar **Sincronizar**.

## Estructura

- `prisma/schema.prisma` — Property, Transaction, Member, MemberMovement, CajaMovement, Liquidation, SyncLog
- `src/lib/sheets.ts` — lectura del sheet (CSV gviz) y parsers es-AR
- `src/lib/sync.ts` — mapeo pestañas → base (reemplazo total transaccional)
- `src/lib/metrics.ts` — ROI, flujo de caja, evolución (única fuente de verdad de cálculos)
- `src/components/charts/` — gráficos d3
- `src/proxy.ts` — protección por contraseña
# los-increibles
