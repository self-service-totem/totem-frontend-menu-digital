// Puente para imprimir desde la web a una impresora térmica vía RawBT
// (app Android: https://rawbt.ru). RawBT registra el esquema de URL
// `rawbt:base64,<datos>` — al navegar a esa URL, RawBT recibe los bytes ESC/POS
// y los manda a la impresora Bluetooth/USB emparejada. No necesita backend.
//
// Requisitos en la tablet de demo:
//   1. App RawBT instalada y la impresora (p.ej. GOOJPRT MTP-3) emparejada por Bluetooth.
//   2. Abrir esta web en Chrome (el esquema rawbt: funciona en Android/Chrome).

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000; // evita "Maximum call stack" al hacer spread
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Envía bytes ESC/POS crudos a RawBT. */
export function printViaRawBt(bytes: Uint8Array): void {
  window.location.href = 'rawbt:base64,' + bytesToBase64(bytes);
}
