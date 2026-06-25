// F5: Fiscal note (NF-e mock)
import { getCollection, insertOne, updateOne } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { FiscalNote, Invoice } from '@/lib/types';

function delay<T>(v: T, ms = 200): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

function generateAccessKey(): string {
  // NF-e access key is 44 digits
  return Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');
}

const MOCK_CNPJ = '12.345.678/0001-99';
const FISCAL_SERIES = '001';
let fiscalSeq = 1000;

export const fiscalService = {
  async generateFiscalNote(invoiceId: string, customerDocument?: string): Promise<FiscalNote> {
    const invoices = getCollection<Invoice>('invoices');
    const invoice = invoices.find((i) => i.id === invoiceId);
    const now = new Date().toISOString();

    const tax = invoice ? +(invoice.total * 0.12).toFixed(2) : 0;
    const totalProducts = invoice ? +(invoice.total - tax).toFixed(2) : 0;

    const note: FiscalNote = {
      id: `nfe-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      invoiceId,
      series: FISCAL_SERIES,
      number: String(++fiscalSeq).padStart(9, '0'),
      accessKey: generateAccessKey(),
      cnpjEmitter: MOCK_CNPJ,
      customerDocument,
      totalProducts,
      totalTax: tax,
      totalNote: invoice?.total ?? 0,
      status: 'AUTHORIZED',
      issuedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    return delay(insertOne('fiscalNotes', note));
  },

  async cancelFiscalNote(id: string): Promise<FiscalNote | null> {
    return delay(
      updateOne<FiscalNote>('fiscalNotes', id, {
        status: 'CANCELED',
        canceledAt: new Date().toISOString(),
      }),
    );
  },

  async listAll(): Promise<FiscalNote[]> {
    return delay(
      getCollection<FiscalNote>('fiscalNotes').sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  },

  async getByInvoice(invoiceId: string): Promise<FiscalNote | null> {
    const notes = getCollection<FiscalNote>('fiscalNotes');
    return delay(notes.find((n) => n.invoiceId === invoiceId) ?? null);
  },
};
