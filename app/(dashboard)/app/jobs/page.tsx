'use client';

import { useEffect, useMemo, useState } from 'react';
import { authedFetch } from '@/lib/apiClient';

type Job = {
  id: string;
  title: string;
  location?: string;
  url: string;
  status: string;
  company?: { name: string };
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterText, setFilterText] = useState('');
  const [status, setStatus] = useState('all');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authedFetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setJobs([]));
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesText =
        job.title.toLowerCase().includes(filterText.toLowerCase()) ||
        job.company?.name?.toLowerCase().includes(filterText.toLowerCase());
      const matchesStatus = status === 'all' ? true : job.status === status;
      return matchesText && matchesStatus;
    });
  }, [jobs, filterText, status]);

  const handleApply = async (jobId: string) => {
    setMessage('');
    const res = await authedFetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    });
    if (!res.ok) {
      setMessage('Unable to queue application.');
      return;
    }
    setMessage('Application queued for assisted apply.');
  };

  return (
    <div className="app-grid">
      <div className="app-card">
        <div className="app-grid cols-3">
          <label>
            <div className="app-muted">Search</div>
            <input className="app-input" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          </label>
          <label>
            <div className="app-muted">Status</div>
            <select className="app-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="seen">Seen</option>
              <option value="applied">Applied</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <div className="app-muted" style={{ alignSelf: 'end' }}>
            {filtered.length} jobs
          </div>
        </div>
        {message && <p className="app-muted">{message}</p>}
      </div>
      <div className="app-card">
        <table className="app-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Company</th>
              <th>Location</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.id}>
                <td>
                  <a href={job.url} target="_blank" rel="noreferrer">
                    {job.title}
                  </a>
                </td>
                <td>{job.company?.name || 'Unknown'}</td>
                <td>{job.location || '—'}</td>
                <td>{job.status}</td>
                <td>
                  <button className="app-button secondary" onClick={() => handleApply(job.id)}>
                    Apply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
