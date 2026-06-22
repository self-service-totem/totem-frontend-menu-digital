import { useLabels } from '@/i18n/I18nContext';
import { formatDateFull } from './reportsUtils';
import './reports.css';

export function SkelBlock({ h = 60 }: { h?: number }) {
  return <div className="ff-rep-skel" style={{ height: h }} />;
}

export function CardShell({
  title, subtitle, action, children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="ff-rep-card">
      <div className="ff-rep-card-header">
        <div>
          <div className="ff-rep-card-title">{title}</div>
          {subtitle && <div className="ff-rep-card-subtitle">{subtitle}</div>}
        </div>
        {action && <div className="ff-rep-card-action">{action}</div>}
      </div>
      <div className="ff-rep-card-body">{children}</div>
    </div>
  );
}

export function EmptySection({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="ff-rep-empty">
      <i className={`bi ${icon} ff-rep-empty-icon`} />
      <div className="ff-rep-empty-text">{text}</div>
    </div>
  );
}

export function NoDataState({ date }: { date: string }) {
  const { t, language } = useLabels();
  return (
    <div className="ff-empty-state ff-rep-empty-mt">
      <i className="bi bi-bar-chart ff-empty-state-icon" />
      <div className="ff-empty-state-title">{t('reports.noData.title')}</div>
      <div className="ff-empty-state-desc">
        {t('reports.noData.desc', { date: formatDateFull(date, language) })}
      </div>
    </div>
  );
}

export function PlaceholderState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="ff-empty-state ff-rep-empty-mt">
      <i className={`bi ${icon} ff-empty-state-icon`} />
      <div className="ff-empty-state-title">{title}</div>
      <div className="ff-empty-state-desc">{desc}</div>
    </div>
  );
}
