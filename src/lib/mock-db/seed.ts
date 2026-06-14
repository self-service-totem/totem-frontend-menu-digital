import { isSeeded, markSeeded, setCollection } from './store';
import type {
  Tenant,
  Branch,
  DbTable,
  Zone,
  DbCategory,
  DbProduct,
  DbOrder,
  KitchenTicket,
  QueueTicket,
  WaiterCall,
  Payment,
  KioskDevice,
  ModifierGroup,
  LoyaltyCard,
  Reservation,
  WalkIn,
  ReservationSettings,
  AggregatorSettings,
  MockUser,
} from '@/lib/types';

export const BRANCH_ID_2 = 'branch-2';

const NOW = new Date().toISOString();
const TENANT_ID = 'tenant-1';
const BRANCH_ID = 'branch-1';

const tenant: Tenant = {
  id: TENANT_ID,
  name: 'Pertinho do Ceu',
  slug: 'pertinho-do-ceu',
  currency: 'BRL',
  createdAt: NOW,
  updatedAt: NOW,
};

const branch: Branch = {
  id: BRANCH_ID,
  tenantId: TENANT_ID,
  name: 'Unidade Centro',
  address: 'Rua das Flores, 123',
  serviceType: 'TABLE_SERVICE',
  queueEnabled: true,
  queueMessage: 'Acompanhe seu pedido aqui!',
  serviceFeeRate: 0.1,
  currency: 'BRL',
  createdAt: NOW,
  updatedAt: NOW,
};

const zones: Zone[] = [
  { id: 'zone-1', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Salão Interno', order: 1, createdAt: NOW, updatedAt: NOW },
  { id: 'zone-2', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Varanda',       order: 2, createdAt: NOW, updatedAt: NOW },
  { id: 'zone-3', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Barra',         order: 3, createdAt: NOW, updatedAt: NOW },
];

const tables: DbTable[] = [
  { id: 'table-1',   tenantId: TENANT_ID, branchId: BRANCH_ID, number: '1',   active: true,  validationCode: 'ABC1',  zoneName: 'Salão Interno', assignedWaiterName: 'Fernando', guestCount: 4, capacity: 4, status: 'READY_TO_SERVE',      createdAt: NOW, updatedAt: NOW },
  { id: 'table-2',   tenantId: TENANT_ID, branchId: BRANCH_ID, number: '2',   active: true,  validationCode: 'ABC2',  zoneName: 'Salão Interno', assignedWaiterName: 'Fernando', guestCount: 3, capacity: 4, status: 'WAITING_FOR_PAYMENT', createdAt: NOW, updatedAt: NOW },
  { id: 'table-3',   tenantId: TENANT_ID, branchId: BRANCH_ID, number: '3',   active: true,  validationCode: 'ABC3',  zoneName: 'Salão Interno', assignedWaiterName: 'Júnior',   guestCount: 2, capacity: 4, status: 'WAITING_FOR_PAYMENT', createdAt: NOW, updatedAt: NOW },
  { id: 'table-4',   tenantId: TENANT_ID, branchId: BRANCH_ID, number: '4',   active: true,  validationCode: 'ABC4',  zoneName: 'Salão Interno', assignedWaiterName: 'Júnior',   guestCount: 5, capacity: 6, status: 'ORDER_IN_PROGRESS',   createdAt: NOW, updatedAt: NOW },
  { id: 'table-5',   tenantId: TENANT_ID, branchId: BRANCH_ID, number: '5',   active: true,  validationCode: 'ABC5',  zoneName: 'Varanda',       assignedWaiterName: 'Rafael',   guestCount: 2, capacity: 2, status: 'WAITING_FOR_PAYMENT', createdAt: NOW, updatedAt: NOW },
  { id: 'table-6',   tenantId: TENANT_ID, branchId: BRANCH_ID, number: '6',   active: true,  validationCode: 'ABC6',  zoneName: 'Varanda',       assignedWaiterName: 'Rafael',   guestCount: 0, capacity: 4, status: 'EMPTY',               createdAt: NOW, updatedAt: NOW },
  { id: 'table-7',   tenantId: TENANT_ID, branchId: BRANCH_ID, number: '7',   active: true,  validationCode: 'ABC7',  zoneName: 'Varanda',       assignedWaiterName: 'Rafael',   guestCount: 3, capacity: 4, status: 'WAITING_FOR_KITCHEN', createdAt: NOW, updatedAt: NOW },
  { id: 'table-140', tenantId: TENANT_ID, branchId: BRANCH_ID, number: '140', active: true,  validationCode: 'QR140', zoneName: 'Barra',         assignedWaiterName: 'Fernando', guestCount: 1, capacity: 2, status: 'EMPTY',               createdAt: NOW, updatedAt: NOW },
];

const categories: DbCategory[] = [
  { id: 'cat-entradas', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Entradas', imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=200&q=70', order: 1, active: true, createdAt: NOW, updatedAt: NOW },
  { id: 'cat-bebidas', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Bebidas', imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=200&q=70', order: 3, active: true, createdAt: NOW, updatedAt: NOW },
  { id: 'cat-pratos', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Pratos principais', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=70', order: 4, active: true, createdAt: NOW, updatedAt: NOW },
  { id: 'cat-sobremesas', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Sobremesas', imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70', order: 5, active: true, createdAt: NOW, updatedAt: NOW },
  { id: 'cat-cafeteria', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Cafeteria', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&q=70', order: 6, active: true, createdAt: NOW, updatedAt: NOW },
];

const products: DbProduct[] = [
  { id: 'prod-coca-zero', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-bebidas', name: 'Coca Cola Zero', description: 'Lata 350ml gelada', price: 8.9, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=70', featured: true, available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-coca-normal', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-bebidas', name: 'Coca Cola Normal', description: 'Lata 350ml gelada', price: 8.9, imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-agua-sem-gas', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-bebidas', name: 'Água sem gás', description: 'Garrafa 500ml', price: 5.5, imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-entrada-mirante', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-entradas', name: 'Entrada Mirante', description: 'Mix de queijos, embutidos e pães artesanais', price: 42.0, imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&q=70', featured: true, available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-carne-de-sol', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-pratos', name: 'Carne de sol c/ aipim', description: 'Carne de sol desfiada com aipim frito e manteiga de garrafa', price: 78.9, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=70', featured: true, available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-isquinha-frango', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-pratos', name: 'Isquinha de Frango Kids', description: 'Iscas de frango com fritas e suco natural', price: 34.5, imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=70', available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-cafe-com-leite', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-cafeteria', name: 'Café com leite', description: 'Café expresso com leite vaporizado', price: 9.5, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-helado', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-sobremesas', name: 'Helado 1/4 kg', description: 'Sorvete artesanal — sabores variados', price: 22.0, imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&q=70', featured: true, available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-bolinho-bacalhau', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-entradas', name: 'Bolinho de bacalhau', description: '6 unidades crocantes', price: 36.0, imageUrl: 'https://images.unsplash.com/photo-1625938145744-533e82eb12c5?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-pudim', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-sobremesas', name: 'Pudim de leite', description: 'Tradicional, com calda de caramelo', price: 16.5, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-suco-laranja', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-bebidas', name: 'Suco de laranja', description: 'Natural, 400ml', price: 12.0, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
];

// Sample orders across multiple tables so the Cashier view looks realistic on first load
const pastTime = new Date(Date.now() - 55 * 60 * 1000).toISOString();
const pastTime2 = new Date(Date.now() - 40 * 60 * 1000).toISOString();
const pastTime3 = new Date(Date.now() - 30 * 60 * 1000).toISOString();
const pastTime4 = new Date(Date.now() - 20 * 60 * 1000).toISOString();
const pastTime5 = new Date(Date.now() - 10 * 60 * 1000).toISOString();
const pastTime6 = new Date(Date.now() - 5 * 60 * 1000).toISOString();

// Realistic waiter call times (2–8 min — should be resolved quickly)
const callTime1 = new Date(Date.now() - 3 * 60 * 1000).toISOString(); //  3 min — pending
const callTime2 = new Date(Date.now() - 8 * 60 * 1000).toISOString(); //  8 min — acknowledged

// Recent times for realistic KDS demo (2–14 min ago)
const kdsTime1  = new Date(Date.now() -  2 * 60 * 1000).toISOString(); //  2 min
const kdsTime2  = new Date(Date.now() -  4 * 60 * 1000).toISOString(); //  4 min
const kdsTime3  = new Date(Date.now() -  7 * 60 * 1000).toISOString(); //  7 min
const kdsTime4  = new Date(Date.now() -  8 * 60 * 1000).toISOString(); //  8 min
const kdsTime5  = new Date(Date.now() - 11 * 60 * 1000).toISOString(); // 11 min
const kdsTime6  = new Date(Date.now() - 14 * 60 * 1000).toISOString(); // 14 min
const kdsTime7  = new Date(Date.now() -  1 * 60 * 1000).toISOString(); //  1 min
const kdsTime8  = new Date(Date.now() -  3 * 60 * 1000).toISOString(); //  3 min

const orders: DbOrder[] = [
  // ── Table 3 ─────────────────────────────────────────────────────────────
  {
    id: 'order-seed-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-3',
    tableNumber: '3',
    customerName: 'Ana Lima',
    items: [
      { productId: 'prod-carne-de-sol', name: 'Carne de sol c/ aipim', quantity: 1, unitPrice: 78.9 },
      { productId: 'prod-coca-zero', name: 'Coca Cola Zero', quantity: 2, unitPrice: 8.9 },
    ],
    subtotal: 96.7,
    serviceFee: 9.67,
    total: 106.37,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paidAmount: 106.37,
    source: 'MENU',
    orderNumber: '#1001',
    createdAt: pastTime,
    updatedAt: pastTime,
  },
  {
    id: 'order-seed-4',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-3',
    tableNumber: '3',
    customerName: 'Pedro Lima',
    items: [
      { productId: 'prod-helado', name: 'Helado 1/4 kg', quantity: 1, unitPrice: 22.0 },
      { productId: 'prod-cafe-com-leite', name: 'Café com leite', quantity: 1, unitPrice: 9.5 },
    ],
    subtotal: 31.5,
    serviceFee: 3.15,
    total: 34.65,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paidAmount: 34.65,
    source: 'MENU',
    orderNumber: '#1004',
    createdAt: pastTime2,
    updatedAt: pastTime2,
  },
  // ── Table 2 ─────────────────────────────────────────────────────────────
  {
    id: 'order-seed-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-2',
    tableNumber: '2',
    customerName: 'Carlos Souza',
    items: [
      { productId: 'prod-entrada-mirante', name: 'Entrada Mirante', quantity: 1, unitPrice: 42.0 },
      { productId: 'prod-suco-laranja', name: 'Suco de laranja', quantity: 1, unitPrice: 12.0 },
    ],
    subtotal: 54.0,
    serviceFee: 5.4,
    total: 59.4,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paidAmount: 59.4,
    source: 'MENU',
    orderNumber: '#1002',
    createdAt: pastTime3,
    updatedAt: pastTime3,
  },
  {
    id: 'order-seed-3',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-2',
    tableNumber: '2',
    customerName: 'Maria Fontes',
    items: [
      { productId: 'prod-coca-zero', name: 'Coca Cola Zero', quantity: 2, unitPrice: 8.9 },
      { productId: 'prod-bolinho-bacalhau', name: 'Bolinho de bacalhau', quantity: 1, unitPrice: 36.0 },
    ],
    subtotal: 53.8,
    serviceFee: 5.38,
    total: 59.18,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paidAmount: 59.18,
    source: 'MENU',
    orderNumber: '#1003',
    createdAt: pastTime4,
    updatedAt: pastTime4,
  },
  // ── Table 5 ─────────────────────────────────────────────────────────────
  {
    id: 'order-seed-5',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-5',
    tableNumber: '5',
    customerName: 'Marcos Oliveira',
    items: [
      { productId: 'prod-isquinha-frango', name: 'Isquinha de Frango Kids', quantity: 1, unitPrice: 34.5 },
      { productId: 'prod-agua-sem-gas', name: 'Água sem gás', quantity: 2, unitPrice: 5.5 },
    ],
    subtotal: 45.5,
    serviceFee: 4.55,
    total: 50.05,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paidAmount: 50.05,
    source: 'MENU',
    orderNumber: '#1005',
    createdAt: pastTime5,
    updatedAt: pastTime5,
  },
  {
    id: 'order-seed-6',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-5',
    tableNumber: '5',
    customerName: 'Patrícia Costa',
    items: [
      { productId: 'prod-entrada-mirante', name: 'Entrada Mirante', quantity: 1, unitPrice: 42.0 },
      { productId: 'prod-coca-normal', name: 'Coca Cola Normal', quantity: 1, unitPrice: 8.9 },
    ],
    subtotal: 50.9,
    serviceFee: 5.09,
    total: 55.99,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paidAmount: 55.99,
    source: 'MENU',
    orderNumber: '#1006',
    createdAt: pastTime6,
    updatedAt: pastTime6,
  },
  // ── Table 1 (READY_TO_SERVE demo) ────────────────────────────────────────
  {
    id: 'order-seed-7',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-1',
    tableNumber: '1',
    customerName: 'Grupo Silva',
    items: [
      { productId: 'prod-carne-de-sol', name: 'Carne de sol c/ aipim', quantity: 2, unitPrice: 78.9 },
      { productId: 'prod-suco-laranja', name: 'Suco de laranja', quantity: 4, unitPrice: 12.0 },
    ],
    subtotal: 205.8,
    serviceFee: 20.58,
    total: 226.38,
    status: 'READY',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    source: 'MENU',
    orderNumber: '#1007',
    createdAt: pastTime5,
    updatedAt: pastTime5,
  },
  // ── Table 4 (ORDER_IN_PROGRESS demo) ─────────────────────────────────────
  {
    id: 'order-seed-8',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-4',
    tableNumber: '4',
    customerName: 'Grupo Mesa 4',
    items: [
      { productId: 'prod-entrada-mirante', name: 'Entrada Mirante', quantity: 2, unitPrice: 42.0 },
      { productId: 'prod-coca-normal', name: 'Coca Cola Normal', quantity: 5, unitPrice: 8.9 },
    ],
    subtotal: 128.5,
    serviceFee: 12.85,
    total: 141.35,
    status: 'PREPARING',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    source: 'MENU',
    orderNumber: '#1008',
    createdAt: pastTime4,
    updatedAt: pastTime4,
  },
  // ── Table 7 (WAITING_FOR_KITCHEN demo) ───────────────────────────────────
  {
    id: 'order-seed-9',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-7',
    tableNumber: '7',
    customerName: 'Família Torres',
    items: [
      { productId: 'prod-carne-de-sol', name: 'Carne de sol c/ aipim', quantity: 3, unitPrice: 78.9 },
    ],
    subtotal: 236.7,
    serviceFee: 23.67,
    total: 260.37,
    status: 'SENT_TO_KITCHEN',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    source: 'MENU',
    orderNumber: '#1009',
    createdAt: pastTime5,
    updatedAt: pastTime5,
  },
  // ── KDS demo orders – recent timestamps for realistic board ──────────────
  {
    id: 'order-kds-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-2',
    tableNumber: '2',
    customerName: 'Luiza Mendes',
    items: [
      { productId: 'prod-carne-de-sol', name: 'Carne de sol c/ aipim', quantity: 1, unitPrice: 78.9 },
      { productId: 'prod-agua-sem-gas', name: 'Água sem gás', quantity: 2, unitPrice: 5.5 },
    ],
    subtotal: 89.9,
    serviceFee: 8.99,
    total: 98.89,
    status: 'SENT_TO_KITCHEN',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    source: 'MENU',
    orderNumber: '#1010',
    createdAt: kdsTime1,
    updatedAt: kdsTime1,
  },
  {
    id: 'order-kds-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Felipe Castro',
    items: [
      { productId: 'prod-bolinho-bacalhau', name: 'Bolinho de bacalhau', quantity: 1, unitPrice: 36.0 },
      { productId: 'prod-coca-zero', name: 'Coca Cola Zero', quantity: 1, unitPrice: 8.9 },
    ],
    subtotal: 44.9,
    serviceFee: 0,
    total: 44.9,
    status: 'SENT_TO_KITCHEN',
    paymentStatus: 'PAID',
    paidAmount: 44.9,
    source: 'KIOSK',
    orderNumber: '#2005',
    createdAt: kdsTime2,
    updatedAt: kdsTime2,
  },
  {
    id: 'order-kds-3',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-5',
    tableNumber: '5',
    customerName: 'Família Melo',
    items: [
      { productId: 'prod-carne-de-sol', name: 'Carne de sol c/ aipim', quantity: 2, unitPrice: 78.9 },
      { productId: 'prod-suco-laranja', name: 'Suco de laranja', quantity: 3, unitPrice: 12.0 },
    ],
    subtotal: 193.8,
    serviceFee: 19.38,
    total: 213.18,
    status: 'SENT_TO_KITCHEN',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    source: 'MENU',
    orderNumber: '#1011',
    createdAt: kdsTime3,
    updatedAt: kdsTime3,
  },
  {
    id: 'order-kds-4',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-6',
    tableNumber: '6',
    customerName: 'Grupo Andrade',
    items: [
      { productId: 'prod-entrada-mirante', name: 'Entrada Mirante', quantity: 2, unitPrice: 42.0 },
      { productId: 'prod-coca-normal', name: 'Coca Cola Normal', quantity: 3, unitPrice: 8.9 },
    ],
    subtotal: 110.7,
    serviceFee: 11.07,
    total: 121.77,
    status: 'PREPARING',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    source: 'MENU',
    orderNumber: '#1012',
    createdAt: kdsTime4,
    updatedAt: kdsTime4,
  },
  {
    id: 'order-kds-5',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Roberta Nunes',
    items: [
      { productId: 'prod-helado', name: 'Helado 1/4 kg', quantity: 1, unitPrice: 22.0 },
      { productId: 'prod-cafe-com-leite', name: 'Café com leite', quantity: 1, unitPrice: 9.5 },
    ],
    subtotal: 31.5,
    serviceFee: 0,
    total: 31.5,
    status: 'READY',
    paymentStatus: 'PAID',
    paidAmount: 31.5,
    source: 'KIOSK',
    orderNumber: '#2006',
    createdAt: kdsTime7,
    updatedAt: kdsTime7,
  },
  // ── Kiosk / balcão takeaway orders (paid upfront — feed the pickup queue) ──
  {
    id: 'order-take-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Bruno Alves',
    items: [
      { productId: 'prod-isquinha-frango', name: 'Isquinha de Frango Kids', quantity: 1, unitPrice: 34.5 },
      { productId: 'prod-coca-zero', name: 'Coca Cola Zero', quantity: 1, unitPrice: 8.9 },
    ],
    subtotal: 43.4,
    serviceFee: 0,
    total: 43.4,
    status: 'PREPARING',
    paymentStatus: 'PAID',
    paidAmount: 43.4,
    source: 'KIOSK',
    orderNumber: '#2001',
    createdAt: pastTime4,
    updatedAt: pastTime4,
  },
  {
    id: 'order-take-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Camila Reis',
    items: [
      { productId: 'prod-carne-de-sol', name: 'Carne de sol c/ aipim', quantity: 1, unitPrice: 78.9 },
      { productId: 'prod-suco-laranja', name: 'Suco de laranja', quantity: 1, unitPrice: 12.0 },
    ],
    subtotal: 90.9,
    serviceFee: 0,
    total: 90.9,
    status: 'PREPARING',
    paymentStatus: 'PAID',
    paidAmount: 90.9,
    source: 'KIOSK',
    orderNumber: '#2002',
    createdAt: pastTime4,
    updatedAt: pastTime4,
  },
  {
    id: 'order-take-3',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Diego Martins',
    items: [
      { productId: 'prod-bolinho-bacalhau', name: 'Bolinho de bacalhau', quantity: 1, unitPrice: 36.0 },
      { productId: 'prod-agua-sem-gas', name: 'Água sem gás', quantity: 2, unitPrice: 5.5 },
    ],
    subtotal: 47.0,
    serviceFee: 0,
    total: 47.0,
    status: 'READY',
    paymentStatus: 'PAID',
    paidAmount: 47.0,
    source: 'KIOSK',
    orderNumber: '#2003',
    createdAt: pastTime5,
    updatedAt: pastTime5,
  },
  {
    id: 'order-take-4',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Elena Souza',
    items: [
      { productId: 'prod-helado', name: 'Helado 1/4 kg', quantity: 2, unitPrice: 22.0 },
    ],
    subtotal: 44.0,
    serviceFee: 0,
    total: 44.0,
    status: 'READY',
    paymentStatus: 'PAID',
    paidAmount: 44.0,
    source: 'KIOSK',
    orderNumber: '#2004',
    createdAt: pastTime6,
    updatedAt: pastTime6,
  },
];

const kitchenTickets: KitchenTicket[] = [
  {
    id: 'kt-seed-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-1',
    orderNumber: '#1001',
    tableNumber: '3',
    items: orders[0].items,
    status: 'DELIVERED',
    createdAt: pastTime,
    updatedAt: pastTime,
  },
  {
    id: 'kt-seed-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-2',
    orderNumber: '#1002',
    tableNumber: '2',
    items: orders[2].items,
    status: 'DELIVERED',
    createdAt: pastTime3,
    updatedAt: pastTime3,
  },
  // Active tickets — visible in Kitchen Display
  {
    id: 'kt-seed-3',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-9',
    orderNumber: '#1009',
    tableNumber: '7',
    items: orders[8].items,
    status: 'NEW',
    createdAt: kdsTime5,   // 11 min → red urgency
    updatedAt: kdsTime5,
  },
  {
    id: 'kt-seed-4',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-8',
    orderNumber: '#1008',
    tableNumber: '4',
    items: orders[7].items,
    status: 'PREPARING',
    createdAt: kdsTime6,   // 14 min → red urgency
    updatedAt: kdsTime6,
  },
  {
    id: 'kt-seed-5',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-7',
    orderNumber: '#1007',
    tableNumber: '1',
    items: orders[6].items,
    status: 'READY',
    createdAt: kdsTime8,   // 3 min
    updatedAt: kdsTime8,
  },
  // KDS demo — recent realistic tickets
  {
    id: 'kt-kds-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-kds-1',
    orderNumber: '#1010',
    tableNumber: '2',
    items: [{ productId: 'prod-carne-de-sol', name: 'Carne de sol c/ aipim', quantity: 1, unitPrice: 78.9 }, { productId: 'prod-agua-sem-gas', name: 'Água sem gás', quantity: 2, unitPrice: 5.5 }],
    status: 'NEW',
    priority: 'URGENT',
    createdAt: kdsTime1,   // 2 min — green timer but flagged urgent
    updatedAt: kdsTime1,
  },
  {
    id: 'kt-kds-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-kds-2',
    orderNumber: '#2005',
    items: [{ productId: 'prod-bolinho-bacalhau', name: 'Bolinho de bacalhau', quantity: 1, unitPrice: 36.0 }, { productId: 'prod-coca-zero', name: 'Coca Cola Zero', quantity: 1, unitPrice: 8.9 }],
    status: 'NEW',
    createdAt: kdsTime2,   // 4 min — green timer
    updatedAt: kdsTime2,
  },
  {
    id: 'kt-kds-3',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-kds-3',
    orderNumber: '#1011',
    tableNumber: '5',
    items: [{ productId: 'prod-carne-de-sol', name: 'Carne de sol c/ aipim', quantity: 2, unitPrice: 78.9 }, { productId: 'prod-suco-laranja', name: 'Suco de laranja', quantity: 3, unitPrice: 12.0 }],
    status: 'NEW',
    priority: 'VIP',
    createdAt: kdsTime3,   // 7 min — yellow timer
    updatedAt: kdsTime3,
  },
  {
    id: 'kt-kds-4',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-kds-4',
    orderNumber: '#1012',
    tableNumber: '6',
    items: [{ productId: 'prod-entrada-mirante', name: 'Entrada Mirante', quantity: 2, unitPrice: 42.0 }, { productId: 'prod-coca-normal', name: 'Coca Cola Normal', quantity: 3, unitPrice: 8.9 }],
    status: 'PREPARING',
    createdAt: kdsTime4,   // 8 min — yellow timer
    updatedAt: kdsTime4,
  },
  {
    id: 'kt-kds-5',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-kds-5',
    orderNumber: '#2006',
    items: [{ productId: 'prod-helado', name: 'Helado 1/4 kg', quantity: 1, unitPrice: 22.0 }, { productId: 'prod-cafe-com-leite', name: 'Café com leite', quantity: 1, unitPrice: 9.5 }],
    status: 'READY',
    createdAt: kdsTime7,   // 1 min
    updatedAt: kdsTime7,
  },
];

const queueTickets: QueueTicket[] = [
  {
    id: 'qt-seed-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-take-1',
    orderNumber: '#2001',
    ticketNumber: 41,
    customerName: 'Bruno Alves',
    status: 'WAITING',
    createdAt: pastTime4,
    updatedAt: pastTime4,
  },
  {
    id: 'qt-seed-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-take-2',
    orderNumber: '#2002',
    ticketNumber: 42,
    customerName: 'Camila Reis',
    status: 'WAITING',
    createdAt: pastTime4,
    updatedAt: pastTime4,
  },
  {
    id: 'qt-seed-3',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-take-3',
    orderNumber: '#2003',
    ticketNumber: 39,
    customerName: 'Diego Martins',
    status: 'CALLED',
    createdAt: pastTime5,
    updatedAt: pastTime5,
  },
  {
    id: 'qt-seed-4',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-take-4',
    orderNumber: '#2004',
    ticketNumber: 40,
    customerName: 'Elena Souza',
    status: 'SERVING',
    createdAt: pastTime6,
    updatedAt: pastTime6,
  },
];

const waiterCalls: WaiterCall[] = [
  {
    id: 'wc-seed-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-5',
    tableNumber: '5',
    customerName: 'Marcos Oliveira',
    reason: 'call',
    status: 'PENDING',
    createdAt: callTime1,
    updatedAt: callTime1,
  },
  {
    id: 'wc-seed-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-4',
    tableNumber: '4',
    customerName: 'Grupo Mesa 4',
    reason: 'bill',
    status: 'ACKNOWLEDGED',
    createdAt: callTime2,
    updatedAt: callTime2,
  },
];

const payments: Payment[] = [
  // ── Table 3 ─────────────────────────────────────────────────────────────
  {
    id: 'pay-seed-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-1',
    orderNumber: '#1001',
    tableId: 'table-3',
    tableNumber: '3',
    customerName: 'Ana Lima',
    total: 106.37,
    paidAmount: 106.37,
    status: 'PAID',
    createdAt: pastTime,
    updatedAt: pastTime,
  },
  {
    id: 'pay-seed-4',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-4',
    orderNumber: '#1004',
    tableId: 'table-3',
    tableNumber: '3',
    customerName: 'Pedro Lima',
    total: 34.65,
    paidAmount: 34.65,
    status: 'PAID',
    createdAt: pastTime2,
    updatedAt: pastTime2,
  },
  // ── Table 2 ─────────────────────────────────────────────────────────────
  {
    id: 'pay-seed-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-2',
    orderNumber: '#1002',
    tableId: 'table-2',
    tableNumber: '2',
    customerName: 'Carlos Souza',
    total: 59.4,
    paidAmount: 59.4,
    status: 'PAID',
    createdAt: pastTime3,
    updatedAt: pastTime3,
  },
  {
    id: 'pay-seed-3',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-3',
    orderNumber: '#1003',
    tableId: 'table-2',
    tableNumber: '2',
    customerName: 'Maria Fontes',
    total: 59.18,
    paidAmount: 59.18,
    status: 'PAID',
    createdAt: pastTime4,
    updatedAt: pastTime4,
  },
  // ── Table 5 ─────────────────────────────────────────────────────────────
  {
    id: 'pay-seed-5',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-5',
    orderNumber: '#1005',
    tableId: 'table-5',
    tableNumber: '5',
    customerName: 'Marcos Oliveira',
    total: 50.05,
    paidAmount: 50.05,
    status: 'PAID',
    createdAt: pastTime5,
    updatedAt: pastTime5,
  },
  {
    id: 'pay-seed-6',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-6',
    orderNumber: '#1006',
    tableId: 'table-5',
    tableNumber: '5',
    customerName: 'Patrícia Costa',
    total: 55.99,
    paidAmount: 55.99,
    status: 'PAID',
    createdAt: pastTime6,
    updatedAt: pastTime6,
  },
  // ── Open balances — active orders the cashier still has to collect ────────
  {
    id: 'pay-seed-7',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-7',
    orderNumber: '#1007',
    tableId: 'table-1',
    tableNumber: '1',
    customerName: 'Grupo Silva',
    total: 226.38,
    paidAmount: 0,
    status: 'UNPAID',
    createdAt: pastTime5,
    updatedAt: pastTime5,
  },
  {
    id: 'pay-seed-8',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-8',
    orderNumber: '#1008',
    tableId: 'table-4',
    tableNumber: '4',
    customerName: 'Grupo Mesa 4',
    total: 141.35,
    paidAmount: 0,
    status: 'UNPAID',
    createdAt: pastTime4,
    updatedAt: pastTime4,
  },
  {
    id: 'pay-seed-9',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-9',
    orderNumber: '#1009',
    tableId: 'table-7',
    tableNumber: '7',
    customerName: 'Família Torres',
    total: 260.37,
    paidAmount: 0,
    status: 'UNPAID',
    createdAt: pastTime5,
    updatedAt: pastTime5,
  },
];

const kioskDevices: KioskDevice[] = [
  { id: 'kiosk-1', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Totem 01 — Entrada', status: 'ONLINE', createdAt: NOW, updatedAt: NOW },
  { id: 'kiosk-2', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Totem 02 — Corredor', status: 'OFFLINE', createdAt: NOW, updatedAt: NOW },
];

// ─── F3: Second branch ────────────────────────────────────────────────────────

const branch2: Branch = {
  id: BRANCH_ID_2,
  tenantId: TENANT_ID,
  name: 'Unidade Shopping',
  address: 'Av. Principal, 456 — Shopping Center',
  serviceType: 'KIOSK_SELF_SERVICE',
  queueEnabled: true,
  queueMessage: 'Retire seu pedido no balcão!',
  serviceFeeRate: 0.0,
  currency: 'BRL',
  createdAt: NOW,
  updatedAt: NOW,
};

// ─── F1: Modifier groups ──────────────────────────────────────────────────────

const modifierGroups: ModifierGroup[] = [
  {
    id: 'mg-burger-size',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    productId: 'prod-carne-de-sol',
    name: 'Tamanho da porção',
    required: true,
    min: 1,
    max: 1,
    options: [
      { id: 'mg-bs-1', name: 'Individual', priceModifier: 0, available: true },
      { id: 'mg-bs-2', name: 'Para 2 pessoas', priceModifier: 30, available: true },
      { id: 'mg-bs-3', name: 'Família (4+)', priceModifier: 55, available: true },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'mg-bebida-temp',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    productId: 'prod-coca-zero',
    name: 'Temperatura',
    required: true,
    min: 1,
    max: 1,
    options: [
      { id: 'mg-bt-1', name: 'Gelada', priceModifier: 0, available: true },
      { id: 'mg-bt-2', name: 'Natural', priceModifier: 0, available: true },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'mg-cafe-leite',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    productId: 'prod-cafe-com-leite',
    name: 'Tipo de leite',
    required: false,
    min: 0,
    max: 1,
    options: [
      { id: 'mg-cl-1', name: 'Integral', priceModifier: 0, available: true },
      { id: 'mg-cl-2', name: 'Desnatado', priceModifier: 0, available: true },
      { id: 'mg-cl-3', name: 'Sem lactose', priceModifier: 2, available: true },
      { id: 'mg-cl-4', name: 'Vegetal (aveia)', priceModifier: 3, available: true },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'mg-sobremesa-topping',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    productId: 'prod-helado',
    name: 'Coberturas (até 2)',
    required: false,
    min: 0,
    max: 2,
    options: [
      { id: 'mg-st-1', name: 'Calda de chocolate', priceModifier: 3, available: true },
      { id: 'mg-st-2', name: 'Granulado', priceModifier: 2, available: true },
      { id: 'mg-st-3', name: 'Castanha triturada', priceModifier: 4, available: true },
      { id: 'mg-st-4', name: 'Frutas vermelhas', priceModifier: 5, available: true },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─── F2: Mock users ───────────────────────────────────────────────────────────

const mockUsers: MockUser[] = [
  { id: 'user-owner',    name: 'Carlos Dono',  email: 'owner@pertinho.com',    role: 'OWNER',   branchId: null,       tenantId: TENANT_ID },
  { id: 'user-manager',  name: 'Ana Gerente',  email: 'manager@pertinho.com',  role: 'MANAGER', branchId: BRANCH_ID,  tenantId: TENANT_ID },
  { id: 'user-cashier',  name: 'Marcos Caixa', email: 'caixa@pertinho.com',    role: 'CASHIER', branchId: BRANCH_ID,  tenantId: TENANT_ID },
  { id: 'user-waiter',   name: 'Julia',        email: 'waiter@pertinho.com',   role: 'WAITER',  branchId: BRANCH_ID,  tenantId: TENANT_ID },
  { id: 'user-waiter-2', name: 'Fernando',     email: 'fernando@pertinho.com', role: 'WAITER',  branchId: BRANCH_ID,  tenantId: TENANT_ID },
  { id: 'user-waiter-3', name: 'Júnior',       email: 'junior@pertinho.com',   role: 'WAITER',  branchId: BRANCH_ID,  tenantId: TENANT_ID },
  { id: 'user-waiter-4', name: 'Rafael',       email: 'rafael@pertinho.com',   role: 'WAITER',  branchId: BRANCH_ID,  tenantId: TENANT_ID },
  { id: 'user-kitchen',  name: 'Pedro Cozinha',email: 'kitchen@pertinho.com',  role: 'KITCHEN', branchId: BRANCH_ID,  tenantId: TENANT_ID },
];

// ─── F4: Loyalty cards ────────────────────────────────────────────────────────

const loyaltyCards: LoyaltyCard[] = [
  {
    id: 'lc-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerPhone: '+55 81 99999-1234',
    customerName: 'Fernanda Ribeiro',
    stamps: 7,
    totalStampsEarned: 17,
    discountsUsed: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─── F9: Reservations ────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const TOMORROW = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

const reservations: Reservation[] = [
  {
    id: 'res-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-4',
    tableNumber: '4',
    customerName: 'Roberto Alves',
    customerPhone: '+55 81 98888-4321',
    partySize: 4,
    date: TODAY,
    time: '19:30',
    notes: 'Bolo surpresa',
    tags: ['BIRTHDAY'],
    source: 'PHONE',
    duration: 90,
    status: 'CONFIRMED',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'res-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Beatriz Santos',
    customerPhone: '+55 81 97777-9999',
    partySize: 2,
    date: TODAY,
    time: '20:00',
    source: 'ONLINE',
    status: 'PENDING',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'res-3',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-1',
    tableNumber: '1',
    customerName: 'Carlos Mendes',
    customerPhone: '+55 81 96666-1234',
    partySize: 6,
    date: TODAY,
    time: '18:00',
    tags: ['VIP'],
    source: 'PHONE',
    duration: 120,
    status: 'SEATED',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'res-4',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Luciana Ferreira',
    customerPhone: '+55 81 95555-7890',
    partySize: 3,
    date: TODAY,
    time: '21:00',
    notes: 'Alergia a amendoim',
    tags: ['ALLERGY'],
    source: 'ONLINE',
    status: 'CONFIRMED',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'res-5',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Diego Costa',
    customerPhone: '+55 81 94444-5678',
    partySize: 2,
    date: TODAY,
    time: '19:00',
    tags: ['ANNIVERSARY'],
    source: 'PHONE',
    status: 'CONFIRMED',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'res-6',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-6',
    tableNumber: '6',
    customerName: 'Fernanda Lima',
    customerPhone: '+55 81 93333-2345',
    partySize: 5,
    date: TODAY,
    time: '12:30',
    source: 'WALK_IN',
    status: 'COMPLETED',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'res-7',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Paulo Rocha',
    customerPhone: '+55 81 92222-3456',
    partySize: 2,
    date: TODAY,
    time: '13:00',
    status: 'CANCELED',
    source: 'ONLINE',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'res-8',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Márcia Barbosa',
    customerPhone: '+55 81 91111-4567',
    partySize: 4,
    date: TODAY,
    time: '20:30',
    status: 'NO_SHOW',
    source: 'PHONE',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'res-9',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'André Tavares',
    customerPhone: '+55 81 99999-0001',
    partySize: 3,
    date: TOMORROW,
    time: '19:00',
    source: 'ONLINE',
    status: 'PENDING',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'res-10',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-2',
    tableNumber: '2',
    customerName: 'Renata Souza',
    customerPhone: '+55 81 99999-0002',
    partySize: 2,
    date: YESTERDAY,
    time: '20:00',
    source: 'PHONE',
    status: 'COMPLETED',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const walkIns: WalkIn[] = [
  {
    id: 'wi-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Grupo Silva',
    partySize: 4,
    estimatedWaitMinutes: 15,
    status: 'WAITING',
    arrivedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'wi-2',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    customerName: 'Casal Araújo',
    customerPhone: '+55 81 98765-4321',
    partySize: 2,
    estimatedWaitMinutes: 5,
    status: 'WAITING',
    arrivedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const reservationSettings: ReservationSettings[] = [
  {
    id: 'res-settings-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    defaultDurationMinutes: 90,
    lateToleranceMinutes: 15,
    openingTime: '11:30',
    closingTime: '23:00',
    slotIntervalMinutes: 30,
    maxPartySize: 12,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─── F10: Aggregator settings ─────────────────────────────────────────────────

const aggregatorSettings: AggregatorSettings[] = [
  { id: 'agg-1', tenantId: TENANT_ID, branchId: BRANCH_ID, platform: 'IFOOD', active: true, externalId: 'if-99887766', autoAccept: false, createdAt: NOW, updatedAt: NOW },
  { id: 'agg-2', tenantId: TENANT_ID, branchId: BRANCH_ID, platform: 'RAPPI', active: false, autoAccept: false, createdAt: NOW, updatedAt: NOW },
];

export function seedDb(): void {
  if (isSeeded()) return;

  setCollection('tenants', [tenant]);
  setCollection('branches', [branch, branch2]);
  setCollection('zones', zones);
  setCollection('tables', tables);
  setCollection('categories', categories);
  setCollection('products', products);
  setCollection('orders', orders);
  setCollection('kitchenTickets', kitchenTickets);
  setCollection('queueTickets', queueTickets);
  setCollection('waiterCalls', waiterCalls);
  setCollection('payments', payments);
  setCollection('paymentTransactions', []);
  setCollection('invoices', []);
  setCollection('receipts', []);
  setCollection('cashierSessions', []);
  setCollection('kioskDevices', kioskDevices);
  setCollection('modifierGroups', modifierGroups);
  setCollection('mockUsers', mockUsers);
  setCollection('loyaltyCards', loyaltyCards);
  setCollection('reservations', reservations);
  setCollection('walkIns', walkIns);
  setCollection('reservationSettings', reservationSettings);
  setCollection('aggregatorSettings', aggregatorSettings);
  setCollection('fiscalNotes', []);
  setCollection('deliveryOrders', []);

  markSeeded();
}

export { TENANT_ID, BRANCH_ID };
