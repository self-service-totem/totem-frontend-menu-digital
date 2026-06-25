// ─── Core domain types (única fuente; antes vivían en src/types) ──────────────

export type CurrencyCode = 'BRL' | 'USD' | 'ARS';

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  currency: CurrencyCode;
  serviceFeeRate: number;
}

export interface Table {
  id: string;
  number: string;
  businessId: string;
}

// Respuesta de GET /api/public/menu-context?tableId={tableId}
export interface MenuContext {
  tableId: string;
  tableName: string;
  restaurantName: string;
  restaurantLogoUrl?: string;
  language: string;
  currency: CurrencyCode;
  serviceFeeRate: number;
  tableValidationCode?: string;
}

// Respuesta de GET /api/tables/{tableId}/bill
export interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface BillCustomer {
  customerName: string;
  items: BillItem[];
  subtotal: number;
}

export interface Bill {
  tableId: string;
  tableName: string;
  customers: BillCustomer[];
  subtotal: number;
  serviceFee: number;
  tableTotal: number;
}

// Payload de POST /api/tables/{tableId}/waiter-call
export interface WaiterCallRequest {
  customerName: string;
  phone: string;
  reason?: string;
}

// Payload de POST /api/tables/{tableId}/orders
export interface PlaceOrderRequest {
  customerName: string;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  featured?: boolean;
  available: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  background?: string;
  ctaLabel?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface CartModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceModifier: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  /** Final per-unit price (base product + selected modifiers). */
  unitPrice: number;
  /** Base product price, without modifiers (for display). */
  basePrice?: number;
  quantity: number;
  note?: string;
  modifiers?: CartModifier[];
}

export type OrderStatus = 'pending' | 'preparing' | 'delivered' | 'closed';

export interface OrderLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: OrderLine[];
  subtotal: number;
  serviceFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CustomerAccount {
  customerId: string;
  customerName: string;
  orders: Order[];
  subtotal: number;
}

export interface TableAccount {
  tableNumber: string;
  customers: CustomerAccount[];
  subtotal: number;
  serviceFee: number;
  total: number;
}

// ─── Extended statuses ────────────────────────────────────────────────────────

export type FullOrderStatus =
  | 'DRAFT'
  | 'CREATED'
  | 'SENT_TO_KITCHEN'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CLOSED'
  | 'CANCELED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED'
  | 'CANCELED';

export type KitchenTicketStatus = 'NEW' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELED';

export type QueueTicketStatus = 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'CANCELED';

export type WaiterCallStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELED';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PRINTED' | 'CANCELED';

export type PaymentMethod = 'CASH' | 'CARD' | 'PIX' | 'EXTERNAL_TERMINAL';

export type ServiceType = 'TABLE_SERVICE' | 'TAKEAWAY' | 'KIOSK_SELF_SERVICE';

// ─── Domain models with tenantId/branchId/timestamps ─────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  currency: string;
  defaultLanguage?: 'es' | 'pt-BR' | 'en';
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethodId = 'CARD' | 'PIX' | 'MERCADO_PAGO' | 'CASH';

export interface BranchPaymentMethods {
  card: boolean;
  pix: boolean;
  mercadoPago: boolean;
  cash: boolean;
}

export const DEFAULT_PAYMENT_METHODS: BranchPaymentMethods = {
  card: true,
  pix: true,
  mercadoPago: true,
  cash: true,
};

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  serviceType: ServiceType;
  queueEnabled: boolean;
  queueMessage?: string;
  serviceFeeRate: number;
  currency: string;
  paymentMethods?: BranchPaymentMethods;
  logoUrl?: string;
  kioskPin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbTable {
  id: string;
  tenantId: string;
  branchId: string;
  number: string;
  active: boolean;
  validationCode: string;
  zoneId?: string;
  zoneName?: string;
  assignedWaiterName?: string;
  guestCount?: number;
  capacity?: number;
  notes?: string;
  status:
    | 'EMPTY'
    | 'OCCUPIED'
    | 'ORDER_IN_PROGRESS'
    | 'WAITING_FOR_KITCHEN'
    | 'READY_TO_SERVE'
    | 'WAITING_FOR_PAYMENT'
    | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  order: number;
  color?: string;
  active: boolean;
  defaultWaiterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbCategory {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  imageUrl: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbProduct {
  id: string;
  tenantId: string;
  branchId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  featured?: boolean;
  available: boolean;
  station?: KitchenStation;
  createdAt: string;
  updatedAt: string;
}

export interface DbOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  customerName?: string;
  modifiers?: SelectedModifier[];
}

export interface DbOrder {
  id: string;
  tenantId: string;
  branchId: string;
  tableId?: string;
  tableNumber?: string;
  customerName: string;
  items: DbOrderItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
  status: FullOrderStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  source: OrderSource;
  platform?: AggregatorPlatform;
  deliveryAddress?: DeliveryAddress;
  deliveryFee?: number;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface KitchenTicket {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  items: DbOrderItem[];
  status: KitchenTicketStatus;
  priority?: 'URGENT' | 'VIP';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueTicket {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  orderNumber: string;
  ticketNumber: number;
  customerName: string;
  status: QueueTicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WaiterCall {
  id: string;
  tenantId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  customerName: string;
  phone?: string;
  reason?: string;
  status: WaiterCallStatus;
  createdAt: string;
  updatedAt: string;
}

export type KioskAlertIssue = 'PRINT_FAILED' | 'NEEDS_HELP';
export type KioskAlertStatus = 'OPEN' | 'RESOLVED';

export interface KioskAlert {
  id: string;
  tenantId: string;
  branchId: string;
  kioskNumber: number;
  orderId: string;
  orderNumber: string;
  total: number;
  paymentStatus: PaymentStatus;
  issueType: KioskAlertIssue;
  status: KioskAlertStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  orderNumber: string;
  tableId?: string;
  tableNumber?: string;
  customerName: string;
  total: number;
  paidAmount: number;
  method?: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  paymentId: string;
  number: string;
  customerName: string;
  total: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  paymentId: string;
  number: string;
  items: DbOrderItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
  method: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface CashierSession {
  id: string;
  tenantId: string;
  branchId: string;
  openedAt: string;
  closedAt?: string;
  totalCash: number;
  totalCard: number;
  totalPix: number;
  totalOther: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KioskDevice {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  createdAt: string;
  updatedAt: string;
}

// ─── F1: Product modifiers / options ─────────────────────────────────────────

export interface ModifierOption {
  id: string;
  name: string;
  priceModifier: number; // 0 = free, positive = add to price
  available: boolean;
}

export interface ModifierGroup {
  id: string;
  tenantId: string;
  branchId: string;
  productId: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  options: ModifierOption[];
  createdAt: string;
  updatedAt: string;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceModifier: number;
}

// ─── F2: Roles / mock auth ────────────────────────────────────────────────────

export type UserRole =
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'KITCHEN'
  | 'SUPPORT';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null; // null = all branches (owner/support)
  tenantId: string;
}

// ─── F3: Multi-branch (Branch already exists; add to DbProduct/DbTable) ───────
// Already covered by branchId fields on all entities.

// ─── F4: Loyalty / stamp card ────────────────────────────────────────────────

export interface LoyaltyCard {
  id: string;
  tenantId: string;
  branchId: string;
  customerPhone: string;
  customerName: string;
  stamps: number;
  totalStampsEarned: number;
  discountsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export const STAMPS_PER_REWARD = 10;

// ─── F5: Fiscal note (NF-e mock) ─────────────────────────────────────────────

export interface FiscalNote {
  id: string;
  tenantId: string;
  branchId: string;
  invoiceId: string;
  series: string;
  number: string;
  accessKey: string; // 44-digit NF-e key mock
  cnpjEmitter: string;
  customerDocument?: string;
  totalProducts: number;
  totalTax: number;
  totalNote: number;
  status: 'AUTHORIZED' | 'CANCELED' | 'PENDING';
  issuedAt: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── F7: Delivery ─────────────────────────────────────────────────────────────

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  zipCode: string;
}

export interface DeliveryOrder {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  address: DeliveryAddress;
  fee: number;
  estimatedMinutes: number;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELED';
  driverName?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── F8: Kitchen stations ─────────────────────────────────────────────────────

export type KitchenStation = 'GRILL' | 'BAR' | 'SALAD' | 'DESSERT' | 'FRYER' | 'GENERAL';

// Added to DbProduct: station?: KitchenStation (optional field)

// ─── F9: Reservations ─────────────────────────────────────────────────────────

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';

export type ReservationTag = 'BIRTHDAY' | 'VIP' | 'ALLERGY' | 'ANNIVERSARY' | 'LATE';

export type ReservationSource = 'PHONE' | 'WALK_IN' | 'ONLINE';

export interface Reservation {
  id: string;
  tenantId: string;
  branchId: string;
  tableId?: string;
  tableNumber?: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
  tags?: ReservationTag[];
  duration?: number; // minutes
  source?: ReservationSource;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export type WalkInStatus = 'WAITING' | 'SEATED' | 'CANCELED';

export interface WalkIn {
  id: string;
  tenantId: string;
  branchId: string;
  tableId?: string;
  tableNumber?: string;
  customerName: string;
  customerPhone?: string;
  partySize: number;
  estimatedWaitMinutes?: number;
  status: WalkInStatus;
  arrivedAt: string;
  seatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationSettings {
  id: string;
  tenantId: string;
  branchId: string;
  defaultDurationMinutes: number;
  lateToleranceMinutes: number;
  openingTime: string; // HH:MM
  closingTime: string; // HH:MM
  slotIntervalMinutes: number;
  maxPartySize: number;
  createdAt: string;
  updatedAt: string;
}

// ─── F10: Aggregator (iFood / Rappi / etc.) ───────────────────────────────────

export type AggregatorPlatform = 'IFOOD' | 'RAPPI' | 'UBER_EATS' | 'DIRECT';

export interface AggregatorSettings {
  id: string;
  tenantId: string;
  branchId: string;
  platform: AggregatorPlatform;
  active: boolean;
  externalId?: string;
  autoAccept: boolean;
  createdAt: string;
  updatedAt: string;
}

// Source type extended to include aggregator platforms
export type OrderSource = 'MENU' | 'KIOSK' | 'WAITER' | 'DELIVERY' | 'IFOOD' | 'RAPPI' | 'UBER_EATS' | 'DIRECT';

// Also add station to DbProduct (extension pattern — services read this field if present)
export type DbProductWithStation = DbProduct & { station?: KitchenStation };
