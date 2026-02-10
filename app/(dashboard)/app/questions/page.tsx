'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/apiClient';

type Question = {
  id: string;
  normalized_text: string;
  answer_value_json: string | null;
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    authedFetch('/api/questions')
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []))
      .catch(() => setQuestions([]));
  }, []);

  return (
    <div className="app-card">
      <h2>Saved questions</h2>
      <table className="app-table">
        <thead>
          <tr>
            <th>Normalized question</th>
            <th>Answer</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td>{q.normalized_text}</td>
              <td>{q.answer_value_json ? q.answer_value_json : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
