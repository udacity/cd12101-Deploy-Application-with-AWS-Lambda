// src/components/NewTodoInput.jsx
import React, { useState } from 'react';
import { Button, Form, Message } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import { useApiToken } from '../auth/token';

const API = process.env.REACT_APP_API_ENDPOINT;

export default function NewTodoInput() {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const getToken = useApiToken();

  const create = async () => {
    setError('');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setError('Due date must be YYYY-MM-DD');
      return;
    }
    try {
      setSubmitting(true);
      const token = await getToken(); // must include audience inside the hook
      const res = await fetch(`${API}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, dueDate }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text || res.statusText}`);
      }

      navigate('/');
    } catch (e) {
      setError(e.message || 'Failed to create TODO');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form onSubmit={create} error={!!error}>
      {error && <Message error header="Error" content={error} />}
      <Form.Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Form.Input
        label="Due Date (YYYY-MM-DD)"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        required
        placeholder="2025-12-31"
      />
      <Button primary type="submit" loading={submitting} disabled={submitting}>
        Create
      </Button>
      <Button type="button" onClick={() => navigate('/')} disabled={submitting}>
        Cancel
      </Button>
    </Form>
  );
}
