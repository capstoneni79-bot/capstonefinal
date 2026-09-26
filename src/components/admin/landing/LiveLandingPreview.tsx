import React from 'react';
import { LandingCmsConfig } from '../../../types/landingCms';
import { LandingPage } from '../../landing/LandingPage';
import { storageService } from '../../../services/storageService';
import { UserRole, UserAccount } from '../../../types';

interface LiveLandingPreviewProps {
  config: LandingCmsConfig;
  deviceMode?: 'desktop' | 'tablet' | 'mobile';
  onSelectRole?: (role: string, user?: UserAccount) => void;
  onOpenLogin?: () => void;
}

export const LiveLandingPreview: React.FC<LiveLandingPreviewProps> = ({
  config,
  deviceMode = 'desktop',
  onSelectRole,
  onOpenLogin,
}) => {
  const swineList = storageService.getSwineRecords();
  const barangays = storageService.getBarangays();
  const accounts = storageService.getAccounts();
  const landingConfig = storageService.getLandingConfig();

  const isDesktop = deviceMode === 'desktop';
  const isTablet = deviceMode === 'tablet';
  const isMobile = deviceMode === 'mobile';

  return (
    <div className="w-full flex justify-center bg-stone-100/60 p-1 sm:p-2">
      <div
        className={`w-full transition-all duration-300 relative bg-white overflow-hidden ${
          isMobile
            ? 'max-w-[400px] rounded-[40px] border-8 border-stone-800 shadow-2xl my-2'
            : isTablet
            ? 'max-w-[768px] rounded-3xl border-4 border-stone-700 shadow-xl my-2'
            : 'rounded-2xl border border-stone-200 shadow-xs'
        }`}
      >
        {/* Device frame status bar for mobile */}
        {isMobile && (
          <div className="bg-stone-900 text-white text-[10px] px-6 py-2 flex items-center justify-between font-semibold select-none relative z-30">
            <span>9:41</span>
            <div className="w-20 h-4 bg-stone-950 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Device frame header for tablet */}
        {isTablet && (
          <div className="bg-stone-800 text-stone-300 text-[10px] px-4 py-1.5 flex items-center justify-between font-medium select-none relative z-30">
            <span>Hinunangan Swine Registry • Tablet View</span>
            <span>100%</span>
          </div>
        )}

        {/* Desktop View Banner Indicator */}
        {isDesktop && (
          <div className="bg-emerald-950 text-emerald-300 text-[11px] px-4 py-1.5 flex items-center justify-between font-medium border-b border-emerald-900 select-none relative z-30">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Dynamic Desktop Preview — Real-time synchronization with active CMS settings
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Desktop Mode
            </span>
          </div>
        )}

        {/* Embedded Landing Page with live config override */}
        <LandingPage
          swineList={swineList}
          barangays={barangays}
          config={landingConfig}
          accounts={accounts}
          overrideCmsConfig={config}
          isEmbeddedPreview={true}
          onSelectRole={(role: UserRole, user?: UserAccount) => {
            if (onSelectRole) {
              onSelectRole(role, user);
            }
          }}
          onOpenLogin={onOpenLogin || (() => {})}
        />
      </div>
    </div>
  );
};
