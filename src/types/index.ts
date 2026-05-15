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

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  note?: string;
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
