'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/apiClient';

type Application = {
  id: string;
  status: string;
  job?: { title: string; url: string };
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState('');

  const loadApplications = async () => {
    const res = await authedFetch('/api/applications');
    const data = await res.json();
    setApplications(data.applications || []);
  };

  useEffect(() => {
    loadApplications().catch(() => setApplications([]));
  }, []);

  const handleConfirm = async (id: string) => {
    setMessage('');
    const res = await authedFetch(`/api/applications/${id}/confirm`, { method: 'POST' });
    if (!res.ok) {
      setMessage('Unable to confirm application.');
      return;
    }
    await loadApplications();
  };

  return (
    <div className="app-grid">
      <div className="app-card">
        <h2>Applications</h2>
        {message && <p className="app-muted">{message}</p>}
        <table className="app-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>
                  {app.job?.url ? (
                    <a href={app.job.url} target="_blank" rel="noreferrer">
                      {app.job?.title || 'Job'}
                    </a>
                  ) : (
                    app.job?.title || 'Job'
                  )}
                </td>
                <td>{app.status}</td>
                <td>
                  {app.status === 'needs_review' && (
                    <button className="app-button" onClick={() => handleConfirm(app.id)}>
                      Confirm submit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
