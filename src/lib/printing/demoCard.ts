// "Tarjeta" comercial que se imprime al pie del ticket de demo.
// EDITÁ estos valores con tus datos reales antes de salir a mostrar el producto.
// El QR del ticket apunta a `url` (poné ahí la demo en vivo o un video corto).

export const demoCard = {
  tagline: 'Menú digital y autogestión para tu local',
  product: 'TÓTEM SELF-SERVICE',
  url: 'https://totem.fernandofresco.click', // <-- el QR del ticket apunta acá
  web: 'totem.fernandofresco.click',
  sellerName: 'Fernando Fresco',
  phone: 'WhatsApp +54 9 11 4049-5643',
};

export type DemoCard = typeof demoCard;
