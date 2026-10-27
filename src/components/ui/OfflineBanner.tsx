import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { tUi } from '../../lib/i18nEngine';
import { listOfflineNotes } from '../../lib/offlineQueue';

export const OfflineBanner: React.FC = () => {
  const { currentLanguage } = useApp();
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setOffline(!navigator.onLine);
      setWaiting(listOfflineNotes().length);
    };
    refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    window.addEventListener('nia-offline-queue', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      window.removeEventListener('nia-offline-queue', refresh);
    };
  }, []);

  if (!offline && waiting === 0) return null;

  return (
    <div className="w-full bg-[#047857] text-white text-xs sm:text-sm font-bold px-3 py-2 text-center">
      {offline
        ? tUi(currentLanguage, 'offlineBanner')
        : `${waiting} ${tUi(currentLanguage, 'offlineQueued')}`}
    </div>
  );
};
