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
  const [discovering, setDiscovering] = useState(false);

  const loadJobs = async () => {
    try {
      const response = await authedFetch('/api/jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      setJobs([]);
    }
  };

  useEffect(() => {
    loadJobs();
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

  const handleDiscoverJobs = async () => {
    setDiscovering(true);
    setMessage('');
    try {
      const response = await authedFetch('/api/jobs/discover', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Unable to discover jobs right now.');
        return;
      }
      setMessage(`Web search complete. Found ${data.total_found || 0} jobs.`);
      await loadJobs();
    } catch (error) {
      setMessage('Unable to discover jobs right now.');
    } finally {
      setDiscovering(false);
    }
  };

  const handleApply = async (jobId: string) => {
    setMessage('');
    const response = await authedFetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    });
    if (!response.ok) {
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
            <input
              className="app-input"
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
            />
          </label>
          <label>
            <div className="app-muted">Status</div>
            <select
              className="app-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
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
        <div style={{ marginTop: 12 }}>
          <button className="app-button" onClick={handleDiscoverJobs} disabled={discovering}>
            {discovering ? 'Searching jobs...' : 'Find Jobs From Resume'}
          </button>
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
                <td>{job.location || '-'}</td>
                <td>{job.status}</td>
                <td>
                  <button className="app-button secondary" onClick={() => handleApply(job.id)}>
                    Apply
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="app-muted">
                  No jobs yet. Click "Find Jobs From Resume" to search and list jobs.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
