'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/apiClient';

type Job = { id: string; status: string };
type Application = { id: string; status: string };

export default function AppOverview() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    authedFetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setJobs([]));
    authedFetch('/api/applications')
      .then((res) => res.json())
      .then((data) => setApplications(data.applications || []))
      .catch(() => setApplications([]));
  }, []);

  const newJobs = jobs.filter((job) => job.status === 'new').length;
  const queuedApps = applications.filter((app) => app.status === 'queued').length;

  return (
    <div className="app-grid cols-3">
      <div className="app-card">
        <div className="app-muted">New jobs</div>
        <h2>{newJobs}</h2>
        <p className="app-muted">Jobs discovered since last review.</p>
      </div>
      <div className="app-card">
        <div className="app-muted">Applications queued</div>
        <h2>{queuedApps}</h2>
        <p className="app-muted">Waiting for assisted apply workflow.</p>
      </div>
      <div className="app-card">
        <div className="app-muted">Total jobs tracked</div>
        <h2>{jobs.length}</h2>
        <p className="app-muted">Across all companies you added.</p>
      </div>
      <div className="app-card" style={{ gridColumn: 'span 3' }}>
        <h3>Next steps</h3>
        <ol className="app-muted">
          <li>Add company career pages.</li>
          <li>Upload your resume and confirm parsed data.</li>
          <li>Review new jobs and start assisted apply.</li>
        </ol>
      </div>
    </div>
  );
}
