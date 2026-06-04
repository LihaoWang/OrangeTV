import '@/client/globals.css';

import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import AdminPage from '@/pages/admin';
import DoubanPage from '@/pages/douban';
import HomePage from '@/pages/home';
import LivePage from '@/pages/live';
import LoginPage from '@/pages/login';
import PlayPage from '@/pages/play';
import SearchPage from '@/pages/search';
import ShortDramaPage from '@/pages/shortdrama';
import WarningPage from '@/pages/warning';
import { GlobalErrorIndicator } from '@/components/GlobalErrorIndicator';
import GlobalThemeLoader from '@/components/GlobalThemeLoader';
import { SiteProvider } from '@/components/SiteProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';

function Providers({ children }: { children: React.ReactNode }) {
  const runtimeConfig = window.RUNTIME_CONFIG;

  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='light'
      enableSystem
      disableTransitionOnChange
    >
      <ToastProvider>
        <SiteProvider
          siteName={runtimeConfig?.SITE_NAME || 'OrangeTV'}
          announcement={runtimeConfig?.ANNOUNCEMENT}
        >
          <GlobalThemeLoader />
          {children}
          <GlobalErrorIndicator />
        </SiteProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Providers>
        <Suspense fallback={null}>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/search' element={<SearchPage />} />
            <Route path='/play' element={<PlayPage />} />
            <Route path='/live' element={<LivePage />} />
            <Route path='/douban' element={<DoubanPage />} />
            <Route path='/shortdrama' element={<ShortDramaPage />} />
            <Route path='/admin' element={<AdminPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/warning' element={<WarningPage />} />
            <Route path='*' element={<HomePage />} />
          </Routes>
        </Suspense>
      </Providers>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
