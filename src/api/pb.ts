/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import PocketBase from 'pocketbase';


/**
 * A singleton `PocketBase` instance to be used by the entire application.
 */
export
const pb = new PocketBase(import.meta.env.VITE_PB_URL);

// 1. Check for auth token in URL query parameters (SSO from Landing Page)
const urlParams = new URLSearchParams(window.location.search);
const authToken = urlParams.get('auth_token');

if (authToken) {
  console.log("SSO: Token found in URL, attempting login...");
  // Load token directly
  pb.authStore.save(authToken, null);
  
  // Refresh to get user model
  pb.collection('users').authRefresh().then((u) => {
      console.log("SSO: Login successful", u);
  }).catch(err => {
    console.error("SSO: Auth Refresh Failed:", err);
    pb.authStore.clear();
  });
  
  // Clean up URL
  const newUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, '', newUrl);
} else {
  // 2. Fallback to cookie
  pb.authStore.loadFromCookie(document.cookie);
  console.log("SSO: Loaded from cookie", pb.authStore.isValid);
  
  // Ensure we have a model if cookie has token but no model (rare but possible)
  if (pb.authStore.isValid && !pb.authStore.model) {
      pb.collection('users').authRefresh().catch(() => pb.authStore.clear());
  }
}

// Keep the cookie synced with the auth store.
pb.authStore.onChange(() => {
  document.cookie = pb.authStore.exportToCookie({ httpOnly: false, path: '/' });
});