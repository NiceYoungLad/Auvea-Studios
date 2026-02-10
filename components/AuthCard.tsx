'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCard() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setMessage(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
      <p className="app-muted">
        Sign in to manage resumes, companies, and application workflows.
      </p>
      <form className="app-form" onSubmit={handleSubmit}>
        <label>
          <div className="app-muted">Email</div>
          <input
            className="app-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          <div className="app-muted">Password</div>
          <input
            className="app-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button className="app-button" type="submit" disabled={loading}>
          {loading ? 'Loading...' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>
      {message && <p className="app-muted">{message}</p>}
      <button
        className="app-button secondary"
        type="button"
        onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
      >
        {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}
      </button>
    </div>
  );
}
