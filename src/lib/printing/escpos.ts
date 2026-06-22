// Constructor mínimo de comandos ESC/POS para impresoras térmicas de 80mm.
// Genera un Uint8Array de bytes crudos que luego se envía a la impresora a
// través de RawBT (ver ./rawbt.ts). Es lo justo para el ticket de demo: no
// pretende cubrir todo ESC/POS, solo lo que usamos.

const ESC = 0x1b;
const GS = 0x1d;

// Sobrescrituras CP850 (Latin occidental) para los caracteres no-ASCII que
// realmente imprimimos. Inicializamos la impresora en CP850 (ESC t 2). Si en
// alguna impresora barata los acentos salen raros, su tabla de códigos difiere
// y habría que cambiar el page en `init()`.
const CP850: Record<string, number> = {
  // Vocales con tilde/acento agudo
  á: 0xa0, é: 0x82, í: 0xa1, ó: 0xa2, ú: 0xa3,
  Á: 0xb5, É: 0x90, Í: 0xd6, Ó: 0xe0, Ú: 0xe9,
  // Portugués: tilde nasal
  ã: 0xc6, Ã: 0xc7,
  // Portugués: circunflejo
  â: 0x83, Â: 0xb6,
  ê: 0x88,
  ô: 0x93,
  û: 0x96,
  // Portugués: grave
  à: 0x85, À: 0xb7,
  è: 0x8a,
  ò: 0x95,
  ù: 0x97,
  // Portugués: õ no existe en CP850; aproximamos con 'o' para legibilidad
  õ: 0x6f, Õ: 0x4f,
  // Resto
  ñ: 0xa4, Ñ: 0xa5, ü: 0x81, Ü: 0x9a, ç: 0x87, Ç: 0x80,
  '¿': 0xa8, '¡': 0xad, '°': 0xf8,
};

function encodeCp850(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code < 0x80) out.push(code);
    else if (ch in CP850) out.push(CP850[ch]);
    else if (code === 0x00a0) out.push(0x20); // NBSP (lo mete Intl) -> espacio
    else out.push(0x3f); // '?' para lo que no sepamos mapear
  }
  return out;
}

export type Align = 'left' | 'center' | 'right';

export class EscPosBuilder {
  private bytes: number[] = [];

  /** Reset de impresora + tabla de códigos CP850. */
  init(): this {
    this.bytes.push(ESC, 0x40); // ESC @  -> inicializar
    this.bytes.push(ESC, 0x74, 0x02); // ESC t 2 -> code page CP850
    return this;
  }

  align(a: Align): this {
    this.bytes.push(ESC, 0x61, a === 'center' ? 1 : a === 'right' ? 2 : 0);
    return this;
  }

  bold(on: boolean): this {
    this.bytes.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  /** Multiplicador de ancho/alto, 1..8. size(2,2) = doble. */
  size(width: number, height: number): this {
    const w = Math.max(1, Math.min(8, width)) - 1;
    const h = Math.max(1, Math.min(8, height)) - 1;
    this.bytes.push(GS, 0x21, ((w & 0x0f) << 4) | (h & 0x0f));
    return this;
  }

  text(s: string): this {
    this.bytes.push(...encodeCp850(s));
    return this;
  }

  line(s = ''): this {
    this.text(s);
    this.bytes.push(0x0a);
    return this;
  }

  /** Línea separadora de ancho de papel (48 chars a 80mm, fuente A). */
  rule(char = '-', width = 48): this {
    return this.line(char.repeat(width));
  }

  feed(lines = 1): this {
    this.bytes.push(ESC, 0x64, Math.max(0, Math.min(255, lines)));
    return this;
  }

  /** Imprime un código QR (modelo 2) con el contenido dado. */
  qr(data: string, moduleSize = 6): this {
    const store = encodeCp850(data); // una URL: ASCII puro
    const len = store.length + 3;
    this.bytes.push(
      // Función 165: modelo de QR (2)
      GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
      // Función 167: tamaño de módulo
      GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, Math.max(1, Math.min(16, moduleSize)),
      // Función 169: corrección de errores (49 = nivel M)
      GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31,
      // Función 180: almacenar datos
      GS, 0x28, 0x6b, len & 0xff, (len >> 8) & 0xff, 0x31, 0x50, 0x30, ...store,
      // Función 181: imprimir
      GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
    );
    return this;
  }

  /** Corte total. Las portátiles sin guillotina lo ignoran (inofensivo). */
  cut(): this {
    this.bytes.push(GS, 0x56, 0x00);
    return this;
  }

  build(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}
