import { isSeeded, markSeeded, setCollection } from './store';
import type {
  Tenant,
  Branch,
  DbTable,
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

const tables: DbTable[] = [
  { id: 'table-1', tenantId: TENANT_ID, branchId: BRANCH_ID, number: '1', active: true, validationCode: 'ABC1', status: 'EMPTY', createdAt: NOW, updatedAt: NOW },
  { id: 'table-2', tenantId: TENANT_ID, branchId: BRANCH_ID, number: '2', active: true, validationCode: 'ABC2', status: 'OCCUPIED', createdAt: NOW, updatedAt: NOW },
  { id: 'table-3', tenantId: TENANT_ID, branchId: BRANCH_ID, number: '3', active: true, validationCode: 'ABC3', status: 'ORDER_IN_PROGRESS', createdAt: NOW, updatedAt: NOW },
  { id: 'table-4', tenantId: TENANT_ID, branchId: BRANCH_ID, number: '4', active: true, validationCode: 'ABC4', status: 'EMPTY', createdAt: NOW, updatedAt: NOW },
  { id: 'table-5', tenantId: TENANT_ID, branchId: BRANCH_ID, number: '5', active: true, validationCode: 'ABC5', status: 'WAITING_FOR_PAYMENT', createdAt: NOW, updatedAt: NOW },
  { id: 'table-6', tenantId: TENANT_ID, branchId: BRANCH_ID, number: '6', active: false, validationCode: 'ABC6', status: 'EMPTY', createdAt: NOW, updatedAt: NOW },
  { id: 'table-140', tenantId: TENANT_ID, branchId: BRANCH_ID, number: '140', active: true, validationCode: 'QR140', status: 'EMPTY', createdAt: NOW, updatedAt: NOW },
];

const categories: DbCategory[] = [
  { id: 'cat-couvert', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Couvert', imageUrl: 'https://images.unsplash.com/photo-1604908554027-9d1620270b41?w=200&q=70', order: 1, active: true, createdAt: NOW, updatedAt: NOW },
  { id: 'cat-entradas', tenantId: TENANT_ID, branchId: BRANCH_ID, name: 'Entradas', imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=200&q=70', order: 2, active: true, createdAt: NOW, updatedAt: NOW },
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
  { id: 'prod-couvert-pao', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-couvert', name: 'Couvert da casa', description: 'Pão da casa com manteigas aromatizadas', price: 18.0, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-bolinho-bacalhau', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-entradas', name: 'Bolinho de bacalhau', description: '6 unidades crocantes', price: 36.0, imageUrl: 'https://images.unsplash.com/photo-1625938145744-533e82eb12c5?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-pudim', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-sobremesas', name: 'Pudim de leite', description: 'Tradicional, com calda de caramelo', price: 16.5, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
  { id: 'prod-suco-laranja', tenantId: TENANT_ID, branchId: BRANCH_ID, categoryId: 'cat-bebidas', name: 'Suco de laranja', description: 'Natural, 400ml', price: 12.0, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=70', available: true, createdAt: NOW, updatedAt: NOW },
];

// Sample orders already in kitchen so it looks lively on first load
const pastTime = new Date(Date.now() - 12 * 60 * 1000).toISOString();
const pastTime2 = new Date(Date.now() - 5 * 60 * 1000).toISOString();

const orders: DbOrder[] = [
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
    status: 'SENT_TO_KITCHEN',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    source: 'MENU',
    orderNumber: '#1001',
    createdAt: pastTime,
    updatedAt: pastTime,
  },
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
    status: 'PREPARING',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    source: 'MENU',
    orderNumber: '#1002',
    createdAt: pastTime2,
    updatedAt: pastTime2,
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
    status: 'NEW',
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
    items: orders[1].items,
    status: 'PREPARING',
    createdAt: pastTime2,
    updatedAt: pastTime2,
  },
];

const queueTickets: QueueTicket[] = [];

const waiterCalls: WaiterCall[] = [
  {
    id: 'wc-seed-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-5',
    tableNumber: '5',
    customerName: 'Marcos Oliveira',
    status: 'PENDING',
    createdAt: pastTime2,
    updatedAt: pastTime2,
  },
];

const payments: Payment[] = [
  {
    id: 'pay-seed-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    orderId: 'order-seed-2',
    orderNumber: '#1002',
    tableId: 'table-5',
    tableNumber: '5',
    customerName: 'Carlos Souza',
    total: 59.4,
    paidAmount: 0,
    status: 'UNPAID',
    createdAt: pastTime2,
    updatedAt: pastTime2,
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
  { id: 'user-owner', name: 'Carlos Dono', email: 'owner@pertinho.com', role: 'OWNER', branchId: null, tenantId: TENANT_ID },
  { id: 'user-manager', name: 'Ana Gerente', email: 'manager@pertinho.com', role: 'MANAGER', branchId: BRANCH_ID, tenantId: TENANT_ID },
  { id: 'user-cashier', name: 'Marcos Caixa', email: 'caixa@pertinho.com', role: 'CASHIER', branchId: BRANCH_ID, tenantId: TENANT_ID },
  { id: 'user-waiter', name: 'Julia Garçom', email: 'waiter@pertinho.com', role: 'WAITER', branchId: BRANCH_ID, tenantId: TENANT_ID },
  { id: 'user-kitchen', name: 'Pedro Cozinha', email: 'kitchen@pertinho.com', role: 'KITCHEN', branchId: BRANCH_ID, tenantId: TENANT_ID },
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

const reservations: Reservation[] = [
  {
    id: 'res-1',
    tenantId: TENANT_ID,
    branchId: BRANCH_ID,
    tableId: 'table-4',
    customerName: 'Roberto Alves',
    customerPhone: '+55 81 98888-4321',
    partySize: 4,
    date: new Date().toISOString().slice(0, 10),
    time: '19:30',
    notes: 'Aniversário — bolo surpresa',
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
    date: new Date().toISOString().slice(0, 10),
    time: '20:00',
    status: 'PENDING',
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
  setCollection('aggregatorSettings', aggregatorSettings);
  setCollection('fiscalNotes', []);
  setCollection('deliveryOrders', []);

  markSeeded();
}

export { TENANT_ID, BRANCH_ID };
