import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'cookiePreferences';

const defaultPrefs = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
  lastUpdated: null
};

const CookieConsentContext = createContext({
  prefs: defaultPrefs,
  setPrefs: () => {},
  acceptAll: () => {},
  rejectNonEssential: () => {},
  isReady: false
});

export const useCookieConsent = () => useContext(CookieConsentContext);

export const CookieConsentProvider = ({ children }) => {
  const [prefs, setPrefsState] = useState(defaultPrefs);
  const [isReady, setIsReady] = useState(false);

  // Load saved prefs on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrefsState({ ...defaultPrefs, ...parsed, essential: true });
      }
    } catch {}
    setIsReady(true);
  }, []);

  const persist = (next) => {
    const toSave = { ...next, essential: true, lastUpdated: new Date().toISOString() };
    setPrefsState(toSave);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  };

  const setPrefs = (partial) => {
    persist({ ...prefs, ...partial });
  };

  const acceptAll = () => persist({ ...defaultPrefs, essential: true, analytics: true, functional: true, marketing: true });
  const rejectNonEssential = () => persist({ ...defaultPrefs, essential: true, analytics: false, functional: false, marketing: false });

  // Conditionally load scripts (example placeholder: Google Analytics)
  useEffect(() => {
    if (!isReady) return;

    // Analytics example
    const gaId = null; // set GA measurement ID if available
    const existingGa = document.querySelector('script[data-consent="ga"]');
    if (prefs.analytics && gaId && !existingGa) {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      s.setAttribute('data-consent', 'ga');
      document.head.appendChild(s);
      const inline = document.createElement('script');
      inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${gaId}');`;
      inline.setAttribute('data-consent', 'ga');
      document.head.appendChild(inline);
    }
    if (!prefs.analytics && existingGa) {
      existingGa.remove();
      document.querySelectorAll('script[data-consent="ga"]').forEach(node => node.remove());
      // Note: removing GA cookies requires server/consent-mode; skipped here
    }

    // Add similar blocks for marketing/functional if needed
  }, [prefs, isReady]);

  const value = useMemo(() => ({ prefs, setPrefs, acceptAll, rejectNonEssential, isReady }), [prefs, isReady]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export default CookieConsentContext;


