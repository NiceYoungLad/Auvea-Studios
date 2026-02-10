'use client';

import { useState } from 'react';
import { authedFetch } from '@/lib/apiClient';

export default function ProfilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setMessage('');
    const form = new FormData();
    form.append('file', file);
    const res = await authedFetch('/api/resumes/upload', {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      setMessage('Upload failed.');
      return;
    }
    const data = await res.json();
    setParsed(data.parsed);
    setMessage('Resume parsed. Review the extracted fields.');
  };

  return (
    <div className="app-grid cols-2">
      <div className="app-card">
        <h2>Resume</h2>
        <div className="app-form">
          <input className="app-input" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="app-button" type="button" onClick={handleUpload}>
            Upload and parse
          </button>
          {message && <div className="app-muted">{message}</div>}
        </div>
      </div>
      <div className="app-card">
        <h2>Parsed data</h2>
        <pre className="app-muted" style={{ whiteSpace: 'pre-wrap' }}>
          {parsed ? JSON.stringify(parsed, null, 2) : 'No resume parsed yet.'}
        </pre>
      </div>
    </div>
  );
}
