import React from 'react';
import { useApp } from '../../context/AppContext';
import { platformNotice } from '../../lib/platformControls';

export const PlatformMaintenanceBanner: React.FC = () => {
  const { siteSettings, currentLanguage } = useApp();
  if (!siteSettings.maintenanceMode) return null;

  return (
    <div
      role="status"
      className="relative z-30 px-4 py-2 text-center text-xs sm:text-sm font-bold bg-[#7F1D3F] text-white"
    >
      {platformNotice(currentLanguage, 'maintenance')}
    </div>
  );
};
