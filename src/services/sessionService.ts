import type { Customer } from '@/types';
import { mockCustomer } from '@/mocks';
import { delay } from './api';

const STORAGE_KEYS = {
  customer: 'ffresco.customer',
  tableId: 'ffresco.tableId',
} as const;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage indisponível */
  }
}

export const sessionService = {
  async getCustomerSnapshot(): Promise<Customer | null> {
    const stored = readJson<Customer>(STORAGE_KEYS.customer);
    if (stored && stored.name?.trim()) return delay(stored, 50);
    return null;
  },
  async getDemoCustomer(): Promise<Customer> {
    return delay(mockCustomer, 50);
  },
  saveCustomer(customer: Customer) {
    writeJson(STORAGE_KEYS.customer, customer);
  },
  saveTableId(tableId: string) {
    writeJson(STORAGE_KEYS.tableId, tableId);
  },
  loadTableId(): string | null {
    return readJson<string>(STORAGE_KEYS.tableId);
  },
};
