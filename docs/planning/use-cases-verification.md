# Casos de uso — Verificación de pantallas

Documento de referencia para recorrer el sistema como usuario real antes de implementar mejoras.
Cada caso de uso es una interacción completa de punta a punta.

---

## UC-01 · Cliente — Menú Digital (QR)

| # | Acción del usuario | Resultado esperado |
|---|---|---|
| 1 | Escanea QR / abre URL de mesa | Menú carga con nombre del restaurante, categorías e imágenes de productos |
| 2 | Toca una categoría | Scroll o filtro lleva a esa sección |
| 3 | Toca un producto | Abre detalle: imagen grande, descripción, precio, botón "Agregar" |
| 4 | Agrega al carrito | Badge del carrito se actualiza, feedback visual inmediato |
| 5 | Abre el carrito | Ve ítems, cantidades, subtotal y total |
| 6 | Confirma el pedido | Pedido se crea, muestra número/confirmación |
| 7 | Llama al mozo | Genera llamado visible en Waiter Staff |
| 8 | Pide la cuenta | Genera solicitud visible en Waiter Staff |

---

## UC-02 · Cliente — Kiosk

| # | Acción del usuario | Resultado esperado |
|---|---|---|
| 1 | Se acerca al kiosk | Pantalla de bienvenida / selector de idioma |
| 2 | Selecciona idioma | UI cambia al idioma elegido (pt-BR / es / en) |
| 3 | Navega por categorías | Rail vertical de categorías, grid de productos a la derecha |
| 4 | Toca un producto | Modal con detalle, opción de personalización si aplica |
| 5 | Agrega al carrito | Counter en el botón del carrito sube |
| 6 | Abre el carrito | Resumen de ítems y total |
| 7 | Confirma y paga | Flujo de pago, pantalla de confirmación con número de pedido |

---

## UC-03 · Kitchen Display

| # | Acción del usuario | Resultado esperado |
|---|---|---|
| 1 | Cocinero abre la pantalla | Ve pedidos activos agrupados por estado o en columnas tipo kanban |
| 2 | Cliente hace un pedido (UC-01 o UC-02) | Pedido aparece automáticamente sin recargar la página |
| 3 | Cocinero toca "Iniciar preparación" | Estado cambia a "En preparación", visible en el ticket |
| 4 | Cocinero toca "Listo" | Estado cambia a "Listo para retirar", desaparece de la cola activa o pasa a columna "Listo" |
| 5 | Hay varios pedidos simultáneos | Pantalla muestra todos sin superposición, legible desde distancia |

---

## UC-04 · Waiter Staff — Atención de mesa

| # | Acción del usuario | Resultado esperado |
|---|---|---|
| 1 | Mozo abre la app | Ve lista de mesas con badge de llamados pendientes |
| 2 | Cliente llama al mozo (UC-01 paso 7) | Badge aparece / se incrementa sin recargar |
| 3 | Mozo toca una mesa | Ve detalle: llamados pendientes, pedidos activos de la mesa |
| 4 | Mozo acepta el llamado | Llamado pasa a "en atención", badge baja |
| 5 | Mozo resuelve el llamado | Llamado desaparece de la lista de pendientes |
| 6 | Cliente pide la cuenta (UC-01 paso 8) | Aparece solicitud de cuenta en el detalle de la mesa |

---

## UC-05 · Admin — Dashboard y operación

| # | Acción del usuario | Resultado esperado |
|---|---|---|
| 1 | Admin abre el dashboard | Ve métricas del día: ingresos, pedidos activos, ticket promedio |
| 2 | Admin va a Pedidos | Ve lista de pedidos con estado humanizado y color semántico |
| 3 | Pedido llega desde kiosk/menú | Aparece en la lista sin recargar (o con refresh mínimo) |
| 4 | Admin toca un pedido | Ve detalle: ítems, cantidades, total, historial de estados |
| 5 | Admin avanza el estado | Estado cambia, se refleja en Kitchen Display |
| 6 | Admin va a Productos | Ve catálogo con imágenes |
| 7 | Admin da de alta un producto | Formulario → guardar → producto aparece en el menú del cliente |
| 8 | Admin desactiva un producto | Producto deja de aparecer en el menú del cliente |

---

## UC-06 · Flujo end-to-end (demo completa)

Recorre todas las áreas en secuencia para mostrar el sistema integrado:

1. **Admin** da de alta un producto nuevo con imagen
2. **Cliente (menú digital)** ve el producto → lo agrega al carrito → confirma el pedido
3. **Kitchen Display** recibe el pedido automáticamente → cocinero lo marca como "listo"
4. **Cliente** llama al mozo
5. **Waiter Staff** ve el llamado → lo acepta → lo resuelve
6. **Admin Dashboard** refleja el pedido en las métricas del día

---

## Notas de verificación

- Marcar cada caso como ✅ OK / ⚠️ parcial / ❌ roto al recorrerlo
- Anotar el comportamiento observado si difiere del esperado
- Priorizar los ❌ antes de la demo
