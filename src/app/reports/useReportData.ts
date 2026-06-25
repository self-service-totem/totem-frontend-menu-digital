import { useEffect, useState } from 'react';
import { reportService, type CloseReport } from '@/lib/services/reportService';
import { tenantService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import { useLabels } from '@/i18n/I18nContext';
import { todayStr } from './reportsUtils';

/**
 * Data orchestration for the reports screen: loads the close report for the
 * selected date, the tenant branding, and owns the CSV export. Kept separate
 * from rendering so ReportsPage stays a thin layout/section switch.
 */
export function useReportData() {
  const { t } = useLabels();
  const notify = useNotify();

  const [report, setReport] = useState<CloseReport | null>(null);
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [productSort, setProductSort] = useState<'revenue' | 'quantity'>('revenue');
  const [tenantName, setTenantName] = useState('');
  const [tenantLogo, setTenantLogo] = useState<string | undefined>();

  useEffect(() => {
    tenantService.get().then((tn) => {
      if (tn) { setTenantName(tn.name); setTenantLogo(tn.logoUrl ?? undefined); }
    });
  }, []);

  async function load() {
    setLoading(true);
    try {
      setReport(await reportService.getCloseReport(date));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [date]);

  function handleExport() {
    if (!report) return;
    const csv = reportService.exportCsv(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${date}.csv`;
    a.click();
    notify(t('reports.csvExported'));
  }

  return {
    report, date, setDate, loading, load,
    productSort, setProductSort,
    tenantName, tenantLogo, handleExport,
  };
}
