// src/auth/token.js
import { useAuth0 } from '@auth0/auth0-react';

export function useApiToken() {
  const { getAccessTokenSilently } = useAuth0();
  const AUDIENCE = process.env.REACT_APP_AUTH0_AUDIENCE;

  return async (opts = {}) => {
    return getAccessTokenSilently({
      authorizationParams: { audience: AUDIENCE },
      detailedResponse: false,
      ...opts,
    });
  };
}
