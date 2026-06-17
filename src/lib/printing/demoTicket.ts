// Compone e imprime el ticket de demo: resumen del pedido + "tarjeta" comercial
// con QR al pie. Pensado para mostrar el producto en vivo en los locales.

import type { CurrencyCode } from '@/types';
import { formatMoney } from '@/utils/format';
import { EscPosBuilder } from './escpos';
import { printViaRawBt } from './rawbt';
import { demoCard } from './demoCard';

const WIDTH = 48; // caracteres por línea a 80mm (fuente A)

export interface DemoTicketInput {
  restaurantName: string;
  orderNumber: string;
  customerName: string;
  tableName?: string;
  /** Número de turno/llamado (kiosk). Si viene, se imprime destacado. */
  queueNumber?: number | string;
  itemCount: number;
  total: number;
  currency: CurrencyCode;
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
  b.size(1, 1).bold(false).line('TICKET DEMO').feed(1);

  // --- Turno (kiosk): el dato clave para esperar el pedido ---
  if (input.queueNumber != null) {
    b.line('TURNO');
    b.bold(true).size(3, 3).line(String(input.queueNumber)).size(1, 1).bold(false).feed(1);
  }

  // --- Datos del pedido ---
  b.align('left');
  b.line(row('Pedido', input.orderNumber));
  b.line(row('Cliente', input.customerName));
  if (input.tableName) b.line(row('Mesa', input.tableName));
  b.line(row('Ítems', String(input.itemCount)));
  b.rule();
  b.bold(true).line(row('TOTAL', formatMoney(input.total, input.currency))).bold(false);
  b.rule();

  // --- Pie: tarjeta comercial con QR ---
  b.feed(1).align('center');
  b.line(demoCard.tagline);
  b.bold(true).line(demoCard.product).bold(false).feed(1);
  b.qr(demoCard.url, 7).feed(1);
  b.line(demoCard.web);
  b.line(demoCard.sellerName);
  b.line(demoCard.phone);

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
