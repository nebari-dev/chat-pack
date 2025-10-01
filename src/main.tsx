/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  StrictMode, useEffect
} from 'react';

import {
  createRoot
} from 'react-dom/client';

import {
  ContentArea
} from './components/content';

import {
  SideBar, SideBarContent
} from './components/sidebar';

// import {
//   LoginForm
// } from './components/loginform';

import {
  useAppStore
} from './store';

// import {
//   authEnabled
// } from './authConfig';

// import pb from './pocketbase';

import './index.css';


/**
 * A mockup chat app UI with optional authentication.
 */
function App(): ReactNode {
  // Fetch the store initialization function.
  const initialize = useAppStore(store => store.initialize);
  // const [user, setUser] = useState(authEnabled ? pb.authStore.record : { email: 'dev@example.com' });

  // Hit the server oauth callback then initialize the store.
  //
  // TODO handle loading screen in the future.
  useEffect(() => {
    // if (authEnabled) {
    //   // Listen for auth changes when auth is enabled
    //   const unsubscribe = pb.authStore.onChange(() => {
    //     setUser(pb.authStore.record);
    //   });

    //   // Initialize with auth flow
    //   (async () => {
    //     await fetch("/auth/oauth-callback", { credentials: "include" });
    //     await initialize();
    //   })();

    //   return unsubscribe;
    // } else {
    //   // Initialize without auth flow in development
    //   (async () => {
    //     await initialize();
    //   })();
    // }
    (async () => {
      await initialize();
    })();
  }, [initialize]);

  // // Show login form if auth is enabled and user is not authenticated
  // if (authEnabled && !user) {
  //   return (
  //     <>
  //       <SideBar />
  //       <ContentArea />
  //       <LoginForm />
  //     </>
  //   );
  // }


  // Return the rendered app.
  return (
    <>
      <SideBar />
      <SideBarContent />
      <ContentArea />
    </>
  );
}


// Bootstrap the simple example app.
//
// Note that examples are run in "strict mode" which will cause additional,
// but unnecessary re-renders in order to catch bugs. Production versions
// of an application will run *faster* than the example.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
