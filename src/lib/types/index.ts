// Re-export existing types so new areas can import from @/lib/types
export type {
  CurrencyCode,
  Money,
  Business,
  Table,
  MenuContext,
  Bill,
  BillItem,
  BillCustomer,
  WaiterCallRequest,
  PlaceOrderRequest,
  Category,
  Product,
  Promotion,
  Customer,
  CartItem,
  OrderLine,
  Order,
  CustomerAccount,
  TableAccount,
} from '@/types';
export type { OrderStatus } from '@/types';

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
  createdAt: string;
  updatedAt: string;
}

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
  logoUrl?: string;
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
  source: 'MENU' | 'KIOSK' | 'WAITER';
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
  status: WaiterCallStatus;
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
