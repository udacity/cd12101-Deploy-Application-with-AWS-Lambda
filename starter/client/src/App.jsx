// src/App.jsx
import React from 'react';
import TokenProbe from "./TokenProbe";
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Link, Route, Routes, Navigate } from 'react-router-dom';
import { Grid, Menu, Segment, Loader } from 'semantic-ui-react';

import Todos from './components/Todos';
import EditTodo from './components/EditTodo';
import LogIn from './components/LogIn';
import NewTodoInput from './components/NewTodoInput';

export default function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();

  const logInLogOutButton = () =>
    isAuthenticated ? (
      <Menu.Item name="logout" onClick={() => logout({ returnTo: window.location.origin })}>
        Log Out
      </Menu.Item>
    ) : (
      <Menu.Item name="login" onClick={() => loginWithRedirect()}>
        Log In
      </Menu.Item>
    );

  const generateMenu = () => (
    <Menu>
      <Menu.Item as={Link} to="/">Home</Menu.Item>
      {isAuthenticated && <Menu.Item as={Link} to="/create">Create</Menu.Item>}
      <Menu.Menu position="right">{logInLogOutButton()}</Menu.Menu>
    </Menu>
  );

  if (isLoading) {
    return (
      <Segment vertical style={{ padding: '8em 0em' }}>
        <Loader active inline="centered">Loading…</Loader>
      </Segment>
    );
  }

  return (
    <Segment style={{ padding: '8em 0em' }} vertical>
      <Grid container stackable verticalAlign="middle">
        <Grid.Row>
          <Grid.Column width={16}>
            <BrowserRouter>
    <TokenProbe />
              {generateMenu()}
              <Routes>
                {!isAuthenticated ? (
                  <>
                    <Route path="/" element={<LogIn />} />
                    <Route path="*" element={<LogIn />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<Todos />} />
                    <Route path="/create" element={<NewTodoInput />} />
                    <Route path="/todos/:todoId/edit" element={<EditTodo />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </BrowserRouter>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Segment>
  );
}
