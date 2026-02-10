'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/apiClient';

type Company = {
  id: string;
  name: string;
  career_url: string;
  scraper_type: string;
  enabled: boolean;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');
  const [careerUrl, setCareerUrl] = useState('');
  const [scraperType, setScraperType] = useState('manual');
  const [selectorsJson, setSelectorsJson] = useState('{\n  "listItem": "",\n  "title": "",\n  "link": ""\n}');
  const [message, setMessage] = useState('');

  const loadCompanies = async () => {
    const res = await authedFetch('/api/companies');
    const data = await res.json();
    setCompanies(data.companies || []);
  };

  useEffect(() => {
    loadCompanies().catch(() => setCompanies([]));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    let selectors = null;
    if (scraperType === 'manual') {
      try {
        selectors = JSON.parse(selectorsJson);
      } catch (err) {
        setMessage('Selectors JSON is invalid.');
        return;
      }
    }
    const res = await authedFetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        career_url: careerUrl,
        scraper_type: scraperType,
        selectors_json: selectors,
      }),
    });
    if (!res.ok) {
      setMessage('Unable to save company.');
      return;
    }
    setName('');
    setCareerUrl('');
    setSelectorsJson('{\n  "listItem": "",\n  "title": "",\n  "link": ""\n}');
    setMessage('Company saved.');
    await loadCompanies();
  };

  return (
    <div className="app-grid cols-2">
      <div className="app-card">
        <h2>Add company</h2>
        <form className="app-form" onSubmit={handleSubmit}>
          <label>
            <div className="app-muted">Company name</div>
            <input className="app-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            <div className="app-muted">Career page URL</div>
            <input
              className="app-input"
              value={careerUrl}
              onChange={(e) => setCareerUrl(e.target.value)}
              required
            />
          </label>
          <label>
            <div className="app-muted">Scraper type</div>
            <select className="app-select" value={scraperType} onChange={(e) => setScraperType(e.target.value)}>
              <option value="manual">Manual</option>
              <option value="greenhouse">Greenhouse</option>
              <option value="lever">Lever</option>
            </select>
          </label>
          {scraperType === 'manual' && (
            <label>
              <div className="app-muted">Selectors JSON</div>
              <textarea
                className="app-textarea"
                value={selectorsJson}
                onChange={(e) => setSelectorsJson(e.target.value)}
              />
            </label>
          )}
          <button className="app-button" type="submit">
            Save company
          </button>
          {message && <div className="app-muted">{message}</div>}
        </form>
      </div>
      <div className="app-card">
        <h2>Companies</h2>
        <table className="app-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Scraper</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.scraper_type}</td>
                <td>{company.enabled ? 'Enabled' : 'Disabled'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
