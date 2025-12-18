import React, { useState } from 'react';
import { Button, Form } from 'semantic-ui-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiToken } from '../auth/token';

const API = process.env.REACT_APP_API_ENDPOINT;

export default function EditTodo() {
  const { todoId } = useParams();
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const navigate = useNavigate();
  const getToken = useApiToken();

  const save = async () => {
    const token = await getToken();
    await fetch(`${API}/todos/${todoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, dueDate }),
    });
    navigate('/');
  };

  return (
    <Form onSubmit={save}>
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
      />
      <Button primary type="submit">Save</Button>
      <Button onClick={() => navigate('/')}>Cancel</Button>
    </Form>
  );
}
