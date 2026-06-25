// Puente para imprimir desde la web a una impresora térmica vía RawBT
// (app Android: https://rawbt.ru). RawBT registra el esquema de URL
// `rawbt:base64,<datos>` — al navegar a esa URL, RawBT recibe los bytes ESC/POS
// y los manda a la impresora Bluetooth/USB emparejada. No necesita backend.
//
// Requisitos en la tablet de demo:
//   1. App RawBT instalada y la impresora (p.ej. GOOJPRT MTP-3) emparejada por Bluetooth.
//   2. Chrome: el esquema rawbt: se resuelve directo.
//   3. Fully Kiosk: el WebView bloquea custom schemes; se usa window.fully.openBrowser()
//      que sale del WebView y deja que Android resuelva el intent de RawBT.

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000; // evita "Maximum call stack" al hacer spread
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * True when a native bridge is available and can print without a user gesture.
 * On plain Chrome (HTTPS) custom schemes require a user-initiated event.
 */
export function canAutoPrint(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return !!(w.AndroidPrint?.print || w.fully?.openBrowser);
}

/** Envía bytes ESC/POS crudos a RawBT. */
export function printViaRawBt(bytes: Uint8Array): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;

  // 1. Bridge nativo de la app Android (totem-android-kiosk) — impresión silenciosa.
  if (w.AndroidPrint?.print) {
    w.AndroidPrint.print(bytesToBase64(bytes));
    return;
  }

  const url = 'rawbt:base64,' + bytesToBase64(bytes);

  // 2. Fully Kiosk Browser — delega al sistema Android vía openBrowser().
  if (w.fully?.openBrowser) {
    w.fully.openBrowser(url);
    return;
  }

  // 3. Chrome / browser estándar — anchor click dispara el intent rawbt:.
  const a = document.createElement('a');
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
