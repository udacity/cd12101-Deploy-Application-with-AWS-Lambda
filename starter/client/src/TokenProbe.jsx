// src/TokenProbe.jsx
import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export default function TokenProbe() {
  const { getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();
  const audience = process.env.REACT_APP_AUTH0_AUDIENCE;

  useEffect(() => {
    // window.getToken(): fetches token (uses cache or refresh token as needed)
    window.getToken = async (opts = {}) => {
      try {
        const res = await getAccessTokenSilently({
          authorizationParams: { audience },
          detailedResponse: true,   // returns { access_token, expires_in, ... }
          ...opts,                  // allow overrides like { cacheMode: 'off' }
        });
        const { access_token, expires_in } = res;
        console.log('🔑 Access token:', access_token?.slice(0, 30) + '…');
        console.log('⏳ expires_in (s):', expires_in);
        return res;
      } catch (e) {
        console.error('❌ getToken error:', e?.error || e?.message || e);
        throw e;
      }
    };

    // Force a refresh-path call (bypasses cache). Uses RT if present.
    window.getFreshToken = async () => {
      return window.getToken({ cacheMode: 'off' });
    };

    // Convenience helpers
    window.reloginWithConsent = () =>
      loginWithRedirect({ authorizationParams: { audience, prompt: 'consent' } });

    window.hardLogout = () =>
      logout({ logoutParams: { returnTo: window.location.origin } });

    console.log('✅ TokenProbe ready. Try in console:');
    console.log('   const t1 = await window.getToken();         // normal');
    console.log('   const t2 = await window.getFreshToken();    // forces refresh path');
    console.log('   await window.reloginWithConsent();          // if consent_required/missing RT');
    console.log('   await window.hardLogout();                  // clear session');

  }, [getAccessTokenSilently, loginWithRedirect, logout, audience]);

  return null;
}
