// src/index.js
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import App from './App';

// ---- Env vars (make sure these are defined in your .env.*) ----
const domain   = process.env.REACT_APP_AUTH0_DOMAIN;          // e.g. your-tenant.us.auth0.com
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;       // SPA app's Client ID
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;        // e.g. https://todo-api

// Helpful sanity log (remove if you want)
if (!domain || !clientId) {
  // eslint-disable-next-line no-console
  console.warn('Auth0 env vars missing. Check REACT_APP_AUTH0_DOMAIN and REACT_APP_AUTH0_CLIENT_ID.');
}
if (!audience) {
  // eslint-disable-next-line no-console
  console.warn('REACT_APP_AUTH0_AUDIENCE is empty. API tokens will not include your API by default.');
}

const rootEl = document.getElementById('root');
const root = createRoot(rootEl);

root.render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      cacheLocation="localstorage"           // Required for RTs in SPAs
      useRefreshTokens={true}                // Opt into refresh tokens
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,                            // Must match your API Identifier
        scope: [
          'openid',
          'profile',
          'email',
          'read:todo',
          'write:todo',
          'delete:todo',
          'offline_access',                  // Ensures a refresh token is issued
        ].join(' '),
        // If you need to force consent ONCE to mint the RT, uncomment:
        // prompt: 'consent',
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);
