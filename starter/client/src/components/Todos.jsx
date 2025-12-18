import update from 'immutability-helper';
import React, { useEffect, useState } from 'react';
import {
  Button, Checkbox, Divider, Grid, Header, Icon, Image, Loader, Message,
} from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import { useApiToken } from '../auth/token';

const API = process.env.REACT_APP_API_ENDPOINT; // e.g. https://xxxxx.execute-api.<region>.amazonaws.com/dev

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [error, setError] = useState('');
  const getToken = useApiToken();
  const navigate = useNavigate();

  const fetchJson = async (input, init = {}) => {
    // Helpful default headers
    const headers = {
      Accept: 'application/json',
      ...(init.headers || {}),
    };
    const res = await fetch(input, { ...init, headers });

    // If API Gateway returned non-JSON (e.g., CORS error often shows empty body)
    if (!res.ok) {
      let bodyText = '';
      try { bodyText = await res.text(); } catch (_) {}
      throw new Error(`API ${res.status} ${res.statusText} — ${bodyText || 'No body'}`);
    }

    // 204/empty is valid on DELETE/PATCH etc.
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return {};
    return res.json();
  };

  const loadTodos = async () => {
    setLoadingTodos(true);
    setError('');
    try {
      if (!API || !API.startsWith('https://')) {
        throw new Error('REACT_APP_API_ENDPOINT is missing or not HTTPS');
      }
      const token = await getToken(); // audience is handled inside the hook
      const data = await fetchJson(`${API}/todos`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos(data.items ?? []);
    } catch (e) {
      console.error('Load TODOS error:', e);
      // This string helps you quickly spot the class of issue from CloudFront
      setError(
        (e?.message || 'Failed to fetch') +
          ' | Check: CORS (Allow-Origin + Authorization), HTTPS URL, Correct audience, API stage path'
      );
    } finally {
      setLoadingTodos(false);
    }
  };

  useEffect(() => {
    loadTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTodo = async (pos) => {
    const todo = todos[pos];
    try {
      const token = await getToken();
      await fetchJson(`${API}/todos/${todo.todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ done: !todo.done }),
      });
      setTodos(update(todos, { [pos]: { done: { $set: !todo.done } } }));
    } catch (e) {
      console.error('Toggle error:', e);
      setError(e.message || 'Failed to update todo');
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      const token = await getToken();
      await fetchJson(`${API}/todos/${todoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos(todos.filter((t) => t.todoId !== todoId));
    } catch (e) {
      console.error('Delete error:', e);
      setError(e.message || 'Failed to delete todo');
    }
  };

  const getUploadUrl = async (todoId) => {
    const token = await getToken();
    const { uploadUrl } = await fetchJson(`${API}/todos/${todoId}/attachment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return uploadUrl;
  };

  const handleFileChange = async (e, todoId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadUrl = await getUploadUrl(todoId);
      // Some S3 signed URLs require content-type to match what was signed.
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      await loadTodos();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    }
  };

  if (loadingTodos) {
    return <Loader indeterminate active>Loading TODOs</Loader>;
  }

  return (
    <Grid padded>
      <Grid.Row>
        <Grid.Column width={16}>
          <Header as="h1">TODOs</Header>
          <Button primary onClick={() => navigate('/create')}>
            <Icon name="add" /> New task
          </Button>
        </Grid.Column>
      </Grid.Row>

      {error && (
        <Grid.Row>
          <Grid.Column width={16}>
            <Message negative>
              <Message.Header>Couldn’t load/process TODOs</Message.Header>
              <p>{error}</p>
              <p style={{ fontSize: 12, opacity: 0.8 }}>
                If this is from CloudFront: ensure API Gateway CORS allows your CloudFront origin,
                <code>Authorization</code> header is allowed, and your API URL is HTTPS & correct.
              </p>
            </Message>
          </Grid.Column>
        </Grid.Row>
      )}

      <Divider />

      {todos.map((todo, pos) => (
        <Grid.Row key={todo.todoId} columns={3} verticalAlign="middle">
          <Grid.Column width={1}>
            <Checkbox onChange={() => toggleTodo(pos)} checked={todo.done} />
          </Grid.Column>
          <Grid.Column width={10}>
            <Header as="h3">{todo.name}</Header>
            <p>Due: {todo.dueDate}</p>
            {todo.attachmentUrl && (
              <Image src={todo.attachmentUrl} size="small" bordered />
            )}
          </Grid.Column>
          <Grid.Column width={5} textAlign="right">
            <label className="ui icon button">
              <Icon name="upload" />
              <input
                type="file"
                hidden
                onChange={(e) => handleFileChange(e, todo.todoId)}
              />
            </label>
            <Button color="red" onClick={() => deleteTodo(todo.todoId)}>
              <Icon name="trash" /> Delete
            </Button>
          </Grid.Column>
        </Grid.Row>
      ))}
    </Grid>
  );
}
