// Compone e imprime el ticket de demo: resumen del pedido + "tarjeta" comercial
// con QR al pie. Pensado para mostrar el producto en vivo en los locales.

import type { CurrencyCode } from '@/types';
import { formatMoney } from '@/utils/format';
import { EscPosBuilder } from './escpos';
import { printViaRawBt } from './rawbt';
import { demoCard } from './demoCard';

const WIDTH = 48; // caracteres por línea a 80mm (fuente A)

export interface DemoTicketItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface DemoTicketInput {
  restaurantName: string;
  orderNumber: string;
  customerName: string;
  tableName?: string;
  /** Número de turno/llamado (kiosk). Si viene, se imprime destacado. */
  queueNumber?: number | string;
  items?: DemoTicketItem[];
  itemCount: number;
  total: number;
  currency: CurrencyCode;
  /** Mensaje al pie, centrado y en negrita. Usar para instrucciones de pago en efectivo. */
  footerNote?: string;
}

/** Fila etiqueta-valor justificada a los extremos del papel. */
function row(label: string, value: string): string {
  const pad = Math.max(1, WIDTH - label.length - value.length);
  return label + ' '.repeat(pad) + value;
}

export function buildDemoTicket(input: DemoTicketInput): Uint8Array {
  const b = new EscPosBuilder().init();

  // --- Cabecera: nombre del local ---
  b.align('center').bold(true).size(2, 2).line(input.restaurantName);
  b.size(1, 1).bold(false);
  if (input.tableName) b.line(input.tableName);
  b.feed(1);

  // --- Turno: número grande y centrado ---
  if (input.queueNumber != null) {
    b.align('center');
    b.line('TURNO');
    b.bold(true).size(4, 4).line(String(input.queueNumber)).size(1, 1).bold(false);
    b.feed(1);
  }

  // --- Número de pedido ---
  b.align('center');
  b.line('PEDIDO');
  b.bold(true).size(3, 3).line(String(input.orderNumber)).size(1, 1).bold(false);
  b.rule().feed(1);

  // --- Detalle de ítems ---
  b.align('left');
  if (input.items && input.items.length > 0) {
    for (const item of input.items) {
      const qty   = `${item.quantity}x`;
      const price = formatMoney(item.unitPrice * item.quantity, input.currency);
      const nameW = WIDTH - qty.length - price.length - 2;
      const name  = item.name.length > nameW ? item.name.slice(0, nameW - 1) + '.' : item.name;
      const pad   = Math.max(1, WIDTH - qty.length - name.length - price.length);
      b.bold(true).text(qty + ' ').bold(false);
      b.text(name + ' '.repeat(pad));
      b.line(price);
    }
  } else {
    b.line(row('Ítems', String(input.itemCount)));
  }

  b.rule();
  b.bold(true).line(row('TOTAL', formatMoney(input.total, input.currency))).bold(false);
  b.rule();

  // --- Cliente ---
  b.align('center').feed(1);
  b.line(input.customerName);

  // --- Nota al pie (ej: "Presentate en caja para pagar") ---
  if (input.footerNote) {
    b.feed(1);
    b.bold(true).line(input.footerNote).bold(false);
  }

  b.feed(4).cut();
  return b.build();
}

export function printDemoTicket(input: DemoTicketInput): void {
  printViaRawBt(buildDemoTicket(input));
}

/** Solo la "tarjeta" comercial con QR — para repartir en los locales. */
export function buildBusinessCard(): Uint8Array {
  const b = new EscPosBuilder().init();
  b.align('center');
  b.bold(true).size(2, 2).line(demoCard.product).size(1, 1).bold(false);
  b.line(demoCard.tagline).feed(1);
  b.qr(demoCard.url, 8).feed(1);
  b.bold(true).line(demoCard.web).bold(false);
  b.line(demoCard.sellerName);
  b.line(demoCard.phone);
  b.feed(4).cut();
  return b.build();
}

export function printBusinessCard(): void {
  printViaRawBt(buildBusinessCard());
}
