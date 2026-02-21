'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { authedFetch } from '@/lib/apiClient';

type Job = {
  id: string;
  title: string;
  location?: string;
  url: string;
  apply_url?: string;
  status: string;
  posted_at?: string;
  company?: { name: string };
};

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lastScrapedAt, setLastScrapedAt] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const response = await authedFetch('/api/jobs?source=discovered');
      const data = await response.json();
      setJobs(data.jobs || []);
      setLastScrapedAt(data.last_scraped_at ?? null);
    } catch {
      setJobs([]);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesText =
        job.title.toLowerCase().includes(filterText.toLowerCase()) ||
        (job.location ?? '').toLowerCase().includes(filterText.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : job.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [jobs, filterText, statusFilter]);

  const handleRefresh = async () => {
    setDiscovering(true);
    setMessage('');
    try {
      const response = await authedFetch('/api/jobs/discover', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Unable to discover jobs right now.');
        return;
      }
      if (data.cached) {
        setMessage(`Results are up to date (refreshed ${formatRelativeTime(data.last_scraped_at)}). Next refresh available in 24 hours.`);
      } else {
        setMessage(`Found ${data.total_found ?? 0} jobs for ${data.country ?? 'your area'} · ${data.titles?.join(', ')}`);
      }
      setLastScrapedAt(data.last_scraped_at ?? lastScrapedAt);
      await loadJobs();
    } catch {
      setMessage('Unable to discover jobs right now. Please try again.');
    } finally {
      setDiscovering(false);
    }
  };

  const handleSave = async (jobId: string) => {
    setSavingId(jobId);
    try {
      const response = await authedFetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'saved' }),
      });
      if (response.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: 'saved' } : j))
        );
      }
    } finally {
      setSavingId(null);
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
      {/* Controls */}
      <div className="app-card">
        <div className="app-grid cols-3">
          <label>
            <div className="app-muted">Search</div>
            <input
              className="app-input"
              placeholder="Filter by title or location…"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </label>
          <label>
            <div className="app-muted">Status</div>
            <select
              className="app-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="saved">Saved</option>
              <option value="seen">Seen</option>
              <option value="applied">Applied</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <div style={{ alignSelf: 'end' }}>
            <div className="app-muted">{filtered.length} listings</div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button className="app-button" onClick={handleRefresh} disabled={discovering}>
            {discovering ? '⏳ Searching jobs…' : '🔄 Refresh Jobs'}
          </button>
          <span className="app-muted" style={{ fontSize: '0.82em' }}>
            {lastScrapedAt
              ? `Last updated: ${formatRelativeTime(lastScrapedAt)}`
              : 'No data yet — click Refresh Jobs'}
          </span>
        </div>

        {message && (
          <p className="app-muted" style={{ marginTop: 10, fontSize: '0.88em' }}>
            {message}
          </p>
        )}
      </div>

      {/* Job Listings */}
      <div className="app-card">
        <table className="app-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Location</th>
              <th>Posted</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
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
                <td>{job.location || '—'}</td>
                <td className="app-muted" style={{ fontSize: '0.85em' }}>
                  {job.posted_at ? job.posted_at.slice(0, 10) : '—'}
                </td>
                <td>
                  {job.status === 'saved' ? (
                    <span style={{ color: '#4ade80', fontWeight: 600 }}>⭐ Saved</span>
                  ) : (
                    <span>{job.status}</span>
                  )}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {job.status !== 'saved' && (
                    <button
                      className="app-button secondary"
                      style={{ marginRight: 8 }}
                      disabled={savingId === job.id}
                      onClick={() => handleSave(job.id)}
                    >
                      {savingId === job.id ? '…' : '⭐ Save'}
                    </button>
                  )}
                  <button className="app-button secondary" onClick={() => handleApply(job.id)}>
                    Apply
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="app-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>
                  {jobs.length === 0
                    ? 'No jobs yet. Make sure your resume has a location, then click "Refresh Jobs".'
                    : 'No jobs match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
