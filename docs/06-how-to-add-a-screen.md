# Cómo agregar una nueva pantalla

Guía paso a paso para implementar un nuevo feature en este frontend.
Cada sección explica **qué hacer**, **dónde ponerlo** y **con qué patrón existente**.

---

## 1. Estructura de carpetas para el feature

Cada nueva pantalla vive en su propia carpeta bajo `src/features/` (para customer/público) o `src/app/<rol>/` (para pantallas de staff: cashier, waiter-staff, kitchen, admin).

```
src/features/mi-feature/
  MiFeaturePage.tsx       ← page component (orquesta el flujo)
  useMiFeature.ts         ← hook (toda la lógica de estado y datos)
  mi-feature.css          ← estilos propios del feature (si aplica)
  components/             ← subcomponentes privados del feature
    MiWidget.tsx
```

Para pantallas de staff (operaciones internas):

```
src/app/mi-rol/
  MiRolPage.tsx
  useMiRol.ts
  miRol.css
  components/
```

**Regla:** si un componente se usa solo dentro de este feature, vive aquí. Si se reutiliza en otro feature, mueve a `src/components/`.

---

## 2. El Page component

El page es un **orquestador**: carga datos, maneja estados (loading/error/vacío/éxito) y compone UI. No renderiza markup complejo inline.

```tsx
// src/features/mi-feature/MiFeaturePage.tsx

import { useMiFeature } from './useMiFeature';
import { useLabels } from '@/i18n/I18nContext';
import { AdminLayout } from '@/components/layout';
import { AdminTable } from '@/components/admin';
import { MiWidget } from './components/MiWidget';

export function MiFeaturePage() {
  const { t } = useLabels();
  const { items, loading, error, handleAction } = useMiFeature();

  return (
    <AdminLayout /* ver sección 4 para layout */>
      <MiWidget items={items} loading={loading} onAction={handleAction} />
    </AdminLayout>
  );
}
```

**El page NO debe:**
- Contener llamadas `fetch` directas
- Tener lógica de negocio inline (cálculos, transformaciones)
- Definir componentes visuales grandes adentro

---

## 3. El hook de feature

Toda la lógica de estado y datos va en un hook co-ubicado. Esto mantiene el page limpio y hace que la lógica sea testeable.

```ts
// src/features/mi-feature/useMiFeature.ts

import { useState, useEffect } from 'react';
import { miFeatureService } from '@/lib/services';
import { useNotify } from '@/lib/notifications';
import type { MiItem } from '@/lib/types';

export function useMiFeature() {
  const notify = useNotify();
  const [items, setItems] = useState<MiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    miFeatureService.listItems()
      .then((data) => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) notify('Error al cargar los datos', 'danger'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  async function handleAction(id: string) {
    try {
      await miFeatureService.doAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      notify('Acción completada', 'success');
    } catch {
      notify('No se pudo completar la acción', 'danger');
    }
  }

  return { items, loading, handleAction };
}
```

**Patrones del hook:**
- `cancelled` flag para evitar setState en componente desmontado
- `useNotify()` para feedback al usuario (no `alert`, no `console.error`)
- Funciones handler exportadas para que el page las pase a los componentes
- Estado derivado con `useMemo` si hay filtros/search

---

## 4. Layout: qué shell usar

Toda pantalla usa un shell de layout documentado. No armar sidebars/topbars a mano.

| Tipo de pantalla | Layout a usar | Importar desde |
|---|---|---|
| Back-office (admin, cashier, waiter-staff) | `AdminLayout` | `@/components/layout` |
| Customer mobile (menu, cart, account) | `AppShell` (con `<Outlet />`) | `@/components/layout` |
| Display público (kitchen, queue) | `PublicDisplayLayout` | `@/components/layout` |
| Kiosk (pantalla táctil) | sin shell extra; estilos propios |  |

**AdminLayout** (el más común para staff):

```tsx
import { AdminLayout } from '@/components/layout';

const navGroups = [
  {
    items: [
      { key: 'orders', label: 'Pedidos', icon: 'bi-receipt' },
      { key: 'history', label: 'Historial', icon: 'bi-clock-history' },
    ],
  },
];

<AdminLayout
  branding={{ name: 'Mi Módulo', fallbackIcon: 'bi-shop', role: 'Mi Rol' }}
  groups={navGroups}
  activeKey={section}
  onSelect={(key) => navigate(`/mi-ruta/${key}`)}
  breadcrumb={{ root: 'Sistema', active: sectionLabel }}
>
  {/* contenido */}
</AdminLayout>
```

Ver `src/app/admin/AdminPage.tsx` o `src/app/cashier/CashierPage.tsx` como referencia.

---

## 5. Estilos: propio vs global

**Regla:** usa clases globales para todo lo que ya existe. Agrega un `.css` propio **solo para layout específico del feature** (spacing, grid, proporciones de secciones).

### Cuándo usar clases globales (`theme.css` / `areas.css`)

```tsx
// Botones → siempre clases globales
<button className="ff-btn ff-btn--primary">Confirmar</button>
<button className="ff-btn ff-btn--secondary">Cancelar</button>
<button className="ff-iconbtn"><i className="bi bi-x" /></button>

// Cards
<div className="ff-admin-card">...</div>

// Badges / pills
<span className="ff-badge ff-badge--success">Activo</span>
<span className="ff-pill ff-pill--warning">Pendiente</span>

// Typography helpers
<p className="ff-text-muted">Descripción</p>
<span className="ff-label">Campo</span>
```

### Cuándo crear `mi-feature.css`

Cuando necesitas posicionamiento, grids o medidas específicas que no existen en el sistema:

```css
/* mi-feature.css */
.mi-feature-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  height: 100%;
}

.mi-feature-panel {
  overflow-y: auto;
  padding: 24px;
}
```

Importar en el page:

```tsx
import './mi-feature.css';
```

**No redefinir colores, radios, shadows o tipografía.** Esos vienen de `--ff-*` variables.

---

## 6. Servicios: cómo llamar al backend

Los servicios viven en `src/lib/services/`. Nunca llames `fetch` desde un componente o page.

### Agregar una función a un servicio existente

```ts
// src/lib/services/orderService.ts
export const orderService = {
  // ... funciones existentes ...

  async getMiRecurso(id: string): Promise<MiRecurso> {
    const response = await request<JsonApiResponse<MiRecursoAttributes>>(
      `/v1/operations/mi-recurso/${id}`
    );
    return mapMiRecurso(response.data);
  },
};
```

### Crear un nuevo archivo de servicio

```ts
// src/lib/services/miFeatureService.ts
import { request } from './api';
import type { MiItem } from '@/lib/types';

export const miFeatureService = {
  async listItems(): Promise<MiItem[]> {
    const response = await request<JsonApiCollectionResponse<MiItemAttributes>>(
      '/v1/operations/mi-feature'
    );
    return response.data.map(mapMiItem);
  },

  async createItem(payload: CreateMiItemRequest): Promise<MiItem> {
    const response = await request<JsonApiResponse<MiItemAttributes>>(
      '/v1/operations/mi-feature',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return mapMiItem(response.data);
  },
};
```

Exportar desde el barrel:

```ts
// src/lib/services/index.ts
export { miFeatureService } from './miFeatureService';
```

### Rutas del backend

Todos los endpoints usan `/v1`. Los prefijos de path según dominio:

```
/v1/public/...       ← customer-facing (menu, orders del cliente)
/v1/operations/...   ← staff (cashier, waiter, kitchen)
/v1/admin/...        ← administración
```

---

## 7. Manejo de errores

El error handling es por componente: `try/catch` + toast via `useNotify()`. No existe un error boundary global de negocio.

### Patrón en hook

```ts
const notify = useNotify();

async function handleSubmit() {
  try {
    await miFeatureService.doSomething(data);
    notify('Guardado correctamente', 'success');
  } catch (err) {
    // err puede ser ApiError (con .status) o Error genérico
    notify('Ocurrió un error. Intenta de nuevo.', 'danger');
  }
}
```

### Variantes de notify

```ts
notify('Mensaje de éxito',   'success');   // verde
notify('Advertencia',        'warning');   // amarillo
notify('Error al procesar',  'danger');    // rojo
notify('Cargando...',        'info');      // azul
```

Los toasts se auto-descartan a los 3.5s. No hay stack manual.

### Error de carga inicial

Para errores en `useEffect` que impiden mostrar la pantalla, mostrar un estado de error visual:

```tsx
if (error) return (
  <AdminEmptyState
    icon="bi-exclamation-triangle"
    title="No se pudo cargar"
    message="Intenta recargar la página"
  />
);
```

---

## 8. Tablas

Para cualquier tabla de datos en pantallas de staff, usar `AdminTable`. No hacer `<table>` a mano.

```tsx
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import type { MiItem } from '@/lib/types';

const columns: AdminTableColumn<MiItem>[] = [
  {
    key: 'name',
    label: 'Nombre',
    sortable: true,
    render: (row) => row.name,
  },
  {
    key: 'status',
    label: 'Estado',
    render: (row) => <AdminBadge variant={row.status === 'active' ? 'success' : 'neutral'}>{row.status}</AdminBadge>,
  },
  {
    key: 'amount',
    label: 'Monto',
    align: 'right',
    sortable: true,
    render: (row) => formatMoney(row.amount, currency),
  },
];

// En el componente:
const [sortBy, setSortBy] = useState('name');
const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

<AdminTable
  columns={columns}
  rows={items}
  sortBy={sortBy}
  sortDir={sortDir}
  onSort={setSortBy}
  onRowClick={(row) => setSelected(row)}
  selectedId={selected?.id}
  loading={loading}
  emptyTitle="Sin resultados"
  emptyMessage="No hay ítems para mostrar"
/>
```

Ver `src/app/cashier/CashierPage.tsx` o `src/app/reservations/ReservationsPage.tsx` como referencia de uso real.

---

## 9. Botones

**Regla:** usar los componentes `PrimaryButton` / `SecondaryButton` (customer-facing) o las clases `ff-btn` directamente (staff/admin). No crear botones custom.

### Customer-facing

```tsx
import { PrimaryButton } from '@/components/common';
import { SecondaryButton } from '@/components/common';

<PrimaryButton onClick={handleConfirm} disabled={submitting}>
  Confirmar pedido
</PrimaryButton>

<SecondaryButton onClick={handleCancel}>
  Cancelar
</SecondaryButton>
```

### Staff / admin

```tsx
// Botón primario
<button className="ff-btn ff-btn--primary" onClick={handle}>
  <i className="bi bi-check-lg" /> Guardar
</button>

// Botón secundario
<button className="ff-btn ff-btn--secondary" onClick={handle}>
  Cancelar
</button>

// Botón ghost (acción terciaria)
<button className="ff-btn ff-btn--ghost" onClick={handle}>
  Ver detalle
</button>

// Botón ícono (barra de herramientas)
<button className="ff-iconbtn" onClick={handle} title="Cerrar">
  <i className="bi bi-x-lg" />
</button>

// Botón con carga
<button className="ff-btn ff-btn--primary" disabled={submitting}>
  {submitting ? <span className="spinner-border spinner-border-sm" /> : 'Guardar'}
</button>
```

**Variantes disponibles:** `ff-btn--primary`, `ff-btn--secondary`, `ff-btn--ghost`.  
**Modificadores:** `ff-btn--sm` (compacto), `ff-btn--block` (ancho completo).

---

## 10. Modales

Ver `docs/04-modal-toast-standard.md` para la regla completa. Resumen de patrones:

### Modal con estado local (el más común)

```tsx
import { Modal } from '@/components/common';

const [open, setOpen] = useState(false);

<button className="ff-btn ff-btn--primary" onClick={() => setOpen(true)}>
  Abrir
</button>

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Título del modal"
>
  <p>Contenido</p>
  <div className="d-flex gap-2 mt-3">
    <SecondaryButton onClick={() => setOpen(false)}>Cancelar</SecondaryButton>
    <PrimaryButton onClick={handleConfirm}>Confirmar</PrimaryButton>
  </div>
</Modal>
```

### Modal de admin (panel lateral)

```tsx
import { AdminModal } from '@/components/admin';

<AdminModal
  title="Editar ítem"
  onClose={() => setSelected(null)}
  footer={
    <>
      <button className="ff-btn ff-btn--secondary" onClick={() => setSelected(null)}>
        Cancelar
      </button>
      <button className="ff-btn ff-btn--primary" onClick={handleSave}>
        Guardar
      </button>
    </>
  }
>
  {/* form */}
</AdminModal>
```

### Modal via query param (navegación deep-linkable)

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const selectedId = searchParams.get('item');

<AdminTable onRowClick={(row) => setSearchParams({ item: row.id })} ... />

{selectedId && (
  <MiDetailModal id={selectedId} onClose={() => setSearchParams({})} />
)}
```

---

## 11. Internacionalización (i18n)

Si la pantalla es customer-facing (o multilenguaje), usar el sistema de labels.

```tsx
import { useLabels } from '@/i18n/I18nContext';

function MiPage() {
  const { t } = useLabels();

  return <h1>{t('mi.titulo')}</h1>;
}
```

Agregar las keys en `src/i18n/labels.ts`:

```ts
// En el objeto labels, bajo cada idioma:
'pt-BR': {
  // ... keys existentes ...
  'mi.titulo': 'Meu título',
  'mi.accion': 'Confirmar',
},
'es': {
  'mi.titulo': 'Mi título',
  'mi.accion': 'Confirmar',
},
'en': {
  'mi.titulo': 'My title',
  'mi.accion': 'Confirm',
},
```

Para pantallas de staff con lenguaje único (idioma del tenant), texto puede ser string directo. Agregar i18n solo cuando sea requerido.

---

## 12. Registrar la ruta

Todas las rutas se definen en `src/app/router.tsx`. Agregar la nueva ruta en la sección correspondiente:

```tsx
// src/app/router.tsx
import { MiFeaturePage } from '@/features/mi-feature/MiFeaturePage';

// Dentro del array de routes:
{ path: '/mi-feature', element: <MiFeaturePage /> },

// Con parámetro:
{ path: '/mi-feature/:id', element: <MiFeaturePage /> },

// Con redirect:
{ path: '/mi-feature', element: <Navigate to="/mi-feature/overview" replace /> },
{ path: '/mi-feature/:section', element: <MiFeaturePage /> },
```

---

## 13. Tipos

Los tipos de dominio van en `src/lib/types/index.ts`. Los tipos específicos de una feature que no se comparten pueden vivir en un `types.ts` local al feature.

```ts
// src/lib/types/index.ts — para tipos compartidos
export interface MiItem {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  amount: number;
  createdAt: string;
}

// src/features/mi-feature/types.ts — para tipos solo de este feature
export interface MiFormValues {
  name: string;
  amount: string; // string porque viene de input
}
```

Los tipos de JSON:API (contratos de respuesta del backend) van en `src/lib/jsonapi/`:

```ts
// src/lib/jsonapi/mappers.ts
export interface MiItemAttributes {
  name: string;
  status: string;
  amount: number;
  createdAt: string;
}

export function mapMiItem(resource: JsonApiResource<MiItemAttributes>): MiItem {
  return {
    id: resource.id,
    name: resource.attributes.name,
    status: resource.attributes.status as MiItem['status'],
    amount: resource.attributes.amount,
    createdAt: resource.attributes.createdAt,
  };
}
```

---

## Checklist rápido

Antes de dar por terminado un nuevo feature, verificar:

```
[ ] La carpeta del feature existe bajo src/features/ o src/app/<rol>/
[ ] El page no tiene fetch directo ni lógica de negocio inline
[ ] El hook maneja loading, error y cancelled flag en useEffect
[ ] Los errores usan useNotify() — no console.error, no alert
[ ] El layout usa AdminLayout / AppShell / PublicDisplayLayout según el tipo de pantalla
[ ] Los estilos reutilizan clases ff-* antes de crear CSS propio
[ ] Los botones usan PrimaryButton/SecondaryButton o clases ff-btn
[ ] Las tablas usan AdminTable
[ ] Los modales usan Modal o AdminModal — sin dialogs HTML nativos
[ ] Los strings visibles tienen keys de i18n si la pantalla es customer-facing
[ ] La ruta está registrada en router.tsx
[ ] Los tipos nuevos están en src/lib/types o en types.ts local al feature
[ ] El servicio nuevo está exportado desde src/lib/services/index.ts
```
