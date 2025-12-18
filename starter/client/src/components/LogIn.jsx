import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from 'semantic-ui-react';

export default function LogIn() {
  const { loginWithRedirect } = useAuth0();
  return (
    <div style={{ textAlign: 'center', marginTop: '5em' }}>
      <h1>Please log in</h1>
      <Button onClick={() => loginWithRedirect()} size="huge" color="olive">
        Log In
      </Button>
    </div>
  );
}
