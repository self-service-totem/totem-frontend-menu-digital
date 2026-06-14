import { useEffect, useState } from 'react';
import { kioskDeviceService } from '@/lib/services/adminService';
import type { KioskDevice } from '@/lib/types';

const STATUS_COLOR: Record<string, string> = {
  ONLINE:      '#059669',
  OFFLINE:     '#6b7280',
  MAINTENANCE: '#d97706',
};

export function Kiosks() {
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  useEffect(() => { kioskDeviceService.list().then(setDevices); }, []);

  return (
    <div className="ff-data-card">
      <table className="table table-hover mb-0">
        <thead>
          <tr><th>Nome</th><th>Status</th></tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id}>
              <td><strong>{d.name}</strong></td>
              <td><span style={{ color: STATUS_COLOR[d.status] ?? '#6b7280', fontWeight: 600 }}>● {d.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
