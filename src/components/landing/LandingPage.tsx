import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  MapPin,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  WifiOff,
  Sparkles,
  Megaphone,
  Phone,
  Mail,
  Clock,
  Play,
  Share2,
  Calendar,
  Video,
  X,
  Scale,
  BookOpen,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Activity,
  Layers,
  Info,
  ChevronRight,
  Eye,
  Download,
} from 'lucide-react';
import { Barangay, LandingPageConfig, SwineRecord, UserAccount, UserRole, ASFRegulatoryDocument } from '../../types';
import { LandingCmsConfig, VideoMediaItem } from '../../types/landingCms';
import { landingCmsService, DEFAULT_LEGAL_DOCUMENTS_CONFIG } from '../../services/landingCmsService';
import { storageService } from '../../services/storageService';
import { OfficialSealBadge } from '../common/OfficialSeals';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { HINUNANGAN_BARANGAYS } from '../../data/barangays';

interface LandingPageProps {
  swineList?: SwineRecord[];
  barangays?: Barangay[];
  config?: LandingPageConfig;
  accounts?: UserAccount[];
  overrideCmsConfig?: LandingCmsConfig;
  isEmbeddedPreview?: boolean;
  onSelectRole?: (role: UserRole, user?: UserAccount) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  swineList,
  barangays,
  accounts,
  overrideCmsConfig,
  isEmbeddedPreview = false,
  onSelectRole = (_role?: UserRole, _user?: UserAccount) => {},
  onOpenLogin = () => {},
}) => {
  const [publishedConfig, setPublishedConfig] = useState<LandingCmsConfig>(() =>
    landingCmsService.getPublishedConfig()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setPublishedConfig(landingCmsService.getPublishedConfig());
    };
    window.addEventListener('da_landing_cms_updated', handleUpdate);
    return () => window.removeEventListener('da_landing_cms_updated', handleUpdate);
  }, []);

  const cmsConfig = overrideCmsConfig || publishedConfig;
  const [selectedVideo, setSelectedVideo] = useState<VideoMediaItem | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'EN' | 'CEB'>('EN');

  // Interactive 15 Barangays & Biosecurity Directory State
  const [barangaySearch, setBarangaySearch] = useState('');
  const [barangayRiskFilter, setBarangayRiskFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
  const [barangayViewMode, setBarangayViewMode] = useState<'top15' | 'all'>('top15');
  const [selectedBarangayDetail, setSelectedBarangayDetail] = useState<{
    name: string;
    code: string;
    riskLevel: 'green' | 'yellow' | 'red';
    focalPersonName: string;
    contactNumber: string;
    swineCount: number;
    readyToSellCount: number;
    isUrban?: boolean;
    latitude: number;
    longitude: number;
  } | null>(null);

  // Legal Ordinances Modal & Search State
  const [selectedOrdinance, setSelectedOrdinance] = useState<ASFRegulatoryDocument | null>(null);
  const [legalDocSearch, setLegalDocSearch] = useState('');
  const allLegalDocuments = storageService.getAsfRegulations();

  const legalLandingConfig = cmsConfig.legalDocumentsConfig || DEFAULT_LEGAL_DOCUMENTS_CONFIG;

  const displayedLegalDocuments = useMemo(() => {
    let docs = allLegalDocuments.filter(d => !d.isArchived && d.status !== 'archived');
    if (legalDocSearch.trim()) {
      const q = legalDocSearch.toLowerCase().trim();
      return docs.filter(
        d =>
          (d.officialNumber || '').toLowerCase().includes(q) ||
          (d.title || '').toLowerCase().includes(q) ||
          (d.knownAs || '').toLowerCase().includes(q) ||
          (d.shortSummary || '').toLowerCase().includes(q) ||
          (d.category || '').toLowerCase().includes(q)
      );
    }
    const featuredIds = legalLandingConfig.featuredDocumentIds || [];
    if (legalLandingConfig.showFeaturedDocuments && featuredIds.length > 0) {
      const featured = docs.filter(d => featuredIds.includes(d.id));
      const nonFeatured = legalLandingConfig.showLatestDocuments
        ? docs.filter(d => !featuredIds.includes(d.id))
        : [];
      docs = [...featured, ...nonFeatured];
    }
    return docs.slice(0, legalLandingConfig.maxFeaturedDocuments || 6);
  }, [allLegalDocuments, legalLandingConfig, legalDocSearch]);

  const top15BarangayNames = [
    'Poblacion',
    'Labrador',
    'Canipaan',
    'Bangcas A',
    'Bangcas B',
    'Ambacon',
    'Badiangon',
    'Calag-itan',
    'Catbaloyan',
    'Ilag',
    'Ingan',
    'Manalog',
    'Nava',
    'Otikon',
    'Pondol',
  ];

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
    return url;
  };

  const effectiveSwineList = swineList && swineList.length > 0 ? swineList : storageService.getSwineRecords();
  const effectiveBarangays = barangays && barangays.length > 0 ? barangays : storageService.getBarangays();

  const readyToSellCount = effectiveSwineList.filter(s => !s.isArchived && s.readyToSell).length;
  const totalSwine = effectiveSwineList.filter(s => !s.isArchived).length;
  const uniqueFarmers = new Set(effectiveSwineList.filter(s => !s.isArchived).map(s => s.farmerName)).size;

  const enrichedBarangays = useMemo(() => {
    return HINUNANGAN_BARANGAYS.map(geo => {
      const liveBg = effectiveBarangays.find(b => b.name.toLowerCase() === geo.name.toLowerCase());
      const swineInBg = effectiveSwineList.filter(
        s => !s.isArchived && (s.barangay || '').toLowerCase() === geo.name.toLowerCase()
      );
      const readyInBg = swineInBg.filter(s => s.readyToSell).length;
      return {
        id: geo.id,
        name: geo.name,
        code: geo.code,
        riskLevel: (liveBg?.riskLevel || geo.defaultRiskLevel || 'green') as 'green' | 'yellow' | 'red',
        focalPersonName: liveBg?.focalPersonName || geo.focalPersonName,
        contactNumber: liveBg?.contactNumber || geo.contactNumber,
        swineCount: swineInBg.length > 0 ? swineInBg.length : geo.defaultSwineCount,
        readyToSellCount: readyInBg > 0 ? readyInBg : geo.defaultReadyToSellCount,
        isUrban: geo.isUrban,
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
    });
  }, [effectiveBarangays, effectiveSwineList]);

  const displayedBarangays = useMemo(() => {
    let list = enrichedBarangays;
    if (barangayViewMode === 'top15' && !barangaySearch.trim()) {
      list = list.filter(b =>
        top15BarangayNames.some(name => name.toLowerCase() === b.name.toLowerCase())
      );
    }
    if (barangaySearch.trim()) {
      const q = barangaySearch.toLowerCase().trim();
      list = list.filter(
        b =>
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.focalPersonName.toLowerCase().includes(q)
      );
    }
    if (barangayRiskFilter !== 'all') {
      list = list.filter(b => b.riskLevel === barangayRiskFilter);
    }
    return list;
  }, [enrichedBarangays, barangayViewMode, barangaySearch, barangayRiskFilter]);

  const bg = cmsConfig.interfaceBackground || {
    enabled: true,
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=2000&q=80',
    overlayOpacity: 35,
    overlayColor: '#064e3b',
    blur: 0,
    brightness: 100,
    position: 'center',
    fit: 'cover',
    fixed: true,
  };

  const hasBackground = Boolean(bg.imageUrl && bg.enabled !== false);
  const blurPx = bg.blur ?? (bg as any).blurLevel ?? 0;
  const brightnessVal = (bg.brightness ?? 100) / 100;

  const theme = cmsConfig.theme || {
    primaryColor: '#047857',
    secondaryColor: '#064e3b',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#1c1917',
    headingColor: '#064e3b',
    buttonColor: '#047857',
    buttonTextColor: '#ffffff',
    headingFont: 'system-ui',
    bodyFont: 'system-ui',
  };

  return (
    <div
      className={`relative ${isEmbeddedPreview ? 'w-full' : 'min-h-screen'} text-stone-900 selection:bg-emerald-500 selection:text-white`}
      style={{
        fontFamily: theme.bodyFont || 'system-ui',
        backgroundColor: theme.backgroundColor || '#ffffff',
        color: theme.textColor || '#1c1917',
      }}
    >
      {/* Background Layer */}
      {hasBackground && (
        <div
          className={`${isEmbeddedPreview ? 'absolute' : 'fixed'} inset-0 pointer-events-none z-0 ${bg.fixed !== false && !isEmbeddedPreview ? 'attachment-fixed' : ''}`}
          style={{
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: bg.fit || 'cover',
            backgroundPosition: bg.position || 'center',
            backgroundRepeat: bg.repeat || 'no-repeat',
            filter: `brightness(${brightnessVal}) blur(${blurPx}px)`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: bg.overlayColor || '#064e3b',
              opacity: (bg.overlayOpacity ?? 35) / 100,
            }}
          />
        </div>
      )}

      {/* Content wrapper */}
      <div className="relative z-10 space-y-16 pb-24">
        {/* Top Announcement Bar */}
        {cmsConfig.announcement?.enabled && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-3 shadow-md ${isEmbeddedPreview ? 'relative' : 'sticky top-0'} z-40`}
            style={{
              backgroundColor: cmsConfig.announcement.bgColor || '#f59e0b',
              color: cmsConfig.announcement.textColor || '#451a03',
            }}
          >
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 shrink-0" />
                <span className="leading-snug">{cmsConfig.announcement.text}</span>
              </div>
              {cmsConfig.announcement.linkText && (
                <a
                  href={cmsConfig.announcement.linkUrl || '#'}
                  className="underline uppercase tracking-wider font-black text-[11px] shrink-0 hover:opacity-80"
                >
                  {cmsConfig.announcement.linkText}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div
            className="relative rounded-3xl overflow-hidden text-white p-8 sm:p-14 shadow-2xl border border-white/20"
            style={{
              backgroundImage: cmsConfig.heroBackgroundUrl ? `url(${cmsConfig.heroBackgroundUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: theme.secondaryColor || '#064e3b',
            }}
          >
            {/* Dark Color Overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: cmsConfig.heroOverlayColor || '#064e3b',
                opacity: (cmsConfig.heroOverlayOpacity ?? 75) / 100,
              }}
            />

            <div className="relative z-10 max-w-3xl space-y-6">
              {/* Badges & Official Seals */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-emerald-800/90 border border-emerald-400/40 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {cmsConfig.heroBadgeText || 'Official Government Platform • Republic of the Philippines'}
                </span>
                <span className="bg-teal-900/90 border border-teal-400/40 text-teal-200 px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                  <WifiOff className="w-3.5 h-3.5" /> 100% Offline Access Ready
                </span>
              </div>

              {/* Institutional Seals Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                {(cmsConfig.officialLogos || [])
                  .filter(l => l.visible !== false && (l.showInHero || l.placement === 'hero' || l.placement === 'header_left' || !l.placement))
                  .map(logo => (
                    <div
                      key={logo.id}
                      className="bg-white/95 rounded-xl p-1.5 shadow-md flex items-center gap-2 border border-white/40 backdrop-blur-xs"
                    >
                      {logo.url && logo.url.trim() !== '' && logo.url !== '/icon.svg' ? (
                        <img
                          src={logo.url}
                          alt={logo.name || logo.label}
                          className="w-7 h-7 object-contain rounded-full drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <OfficialSealBadge
                          type={logo.vectorComponent || 'SealDA'}
                          size={30}
                          showLabel={false}
                          customUrl={logo.url}
                        />
                      )}
                      <span className="text-[10px] font-extrabold text-stone-900 uppercase tracking-wider pr-1">
                        {logo.name || logo.label || logo.institution}
                      </span>
                    </div>
                  ))}
              </div>

              <h1
                className="text-3xl sm:text-5xl font-black tracking-tight leading-tight drop-shadow-md"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: cmsConfig.heroTitleColor || '#ffffff',
                }}
              >
                {cmsConfig.heroTitle}
              </h1>

              <p
                className="text-sm sm:text-base leading-relaxed max-w-2xl font-normal drop-shadow-xs"
                style={{ color: cmsConfig.heroSubtitleColor || '#ecfdf5' }}
              >
                {cmsConfig.heroSubtitle}
              </p>

              {cmsConfig.heroDescription && (
                <p
                  className="text-xs sm:text-sm leading-relaxed max-w-xl font-normal"
                  style={{ color: cmsConfig.heroDescriptionColor || '#d1fae5' }}
                >
                  {cmsConfig.heroDescription}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        {((cmsConfig.stats && cmsConfig.stats.some(s => s.visible)) || cmsConfig.statsEnabled !== false) && (
          <section id="barangays" className="max-w-7xl mx-auto px-4 sm:px-6">
            {(cmsConfig.statsTitle || cmsConfig.statsSubtitle) && (
              <div className="text-center max-w-xl mx-auto mb-6">
                {cmsConfig.statsTitle && (
                  <h2
                    className="text-xl sm:text-2xl font-black tracking-tight"
                    style={{
                      fontFamily: theme.headingFont || 'system-ui',
                      color: theme.headingColor || '#064e3b',
                    }}
                  >
                    {cmsConfig.statsTitle}
                  </h2>
                )}
                {cmsConfig.statsSubtitle && (
                  <p className="text-xs text-stone-500 mt-1">{cmsConfig.statsSubtitle}</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cmsConfig.stats && cmsConfig.stats.filter(s => s.visible).length > 0 ? (
                cmsConfig.stats
                  .filter(s => s.visible)
                  .map(stat => (
                    <div
                      key={stat.id}
                      className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm text-center"
                    >
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                        {stat.label}
                      </span>
                      <span
                        className="text-3xl sm:text-4xl font-black mt-1 block"
                        style={{ color: theme.headingColor || '#064e3b' }}
                      >
                        {stat.value}
                      </span>
                      {stat.description && (
                        <span className="text-[11px] text-stone-400 mt-1 block">{stat.description}</span>
                      )}
                    </div>
                  ))
              ) : (
                <>
                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm text-center">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                      Registered Swine
                    </span>
                    <span
                      className="text-3xl sm:text-4xl font-black mt-1 block"
                      style={{ color: theme.headingColor || '#064e3b' }}
                    >
                      {totalSwine || cmsConfig.statSwineCount || '3,850+'} Heads
                    </span>
                    <span className="text-[11px] text-stone-400 mt-1 block">Actively monitored</span>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-amber-200 shadow-sm text-center bg-amber-50/30">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                      Incoming Ready to Sell
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-amber-900 mt-1 block">
                      {readyToSellCount || cmsConfig.statMarketReadyCount || '142'} Heads
                    </span>
                    <span className="text-[11px] text-amber-700 mt-1 block">Market harvest ready</span>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm text-center">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                      Jurisdiction Barangays
                    </span>
                    <span
                      className="text-3xl sm:text-4xl font-black mt-1 block"
                      style={{ color: theme.headingColor || '#064e3b' }}
                    >
                      {effectiveBarangays.length || cmsConfig.statBarangayCount || '40'} Barangays
                    </span>
                    <span className="text-[11px] text-stone-400 mt-1 block">100% Hinunangan covered</span>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm text-center">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                      Registered Raisers
                    </span>
                    <span
                      className="text-3xl sm:text-4xl font-black mt-1 block"
                      style={{ color: theme.headingColor || '#064e3b' }}
                    >
                      {uniqueFarmers || cmsConfig.statFarmerCount || '1,240+'} Farmers
                    </span>
                    <span className="text-[11px] text-stone-400 mt-1 block">RSBSA verified</span>
                  </div>
                </>
              )}
            </div>

            {/* 15 Barangays & Biosecurity Directory Showcase */}
            <div className="mt-10 pt-10 border-t border-stone-200/70 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-bold mb-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Municipal Geographic Jurisdiction</span>
                  </div>
                  <h3
                    className="text-2xl sm:text-3xl font-black tracking-tight"
                    style={{
                      fontFamily: theme.headingFont || 'system-ui',
                      color: theme.headingColor || '#064e3b',
                    }}
                  >
                    15 Barangays of Hinunangan • Biosecurity & Swine Status
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                    Live biosecurity zoning, active swine population, and designated agricultural focal officers across Hinunangan, Southern Leyte.
                  </p>
                </div>

                {/* View Mode Toggle: Top 15 vs All 40 */}
                <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-xl shrink-0 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => setBarangayViewMode('top15')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      barangayViewMode === 'top15'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-700 hover:text-emerald-800'
                    }`}
                  >
                    Top 15 Barangays ({top15BarangayNames.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarangayViewMode('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      barangayViewMode === 'all'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-700 hover:text-emerald-800'
                    }`}
                  >
                    All 40 Barangays ({enrichedBarangays.length})
                  </button>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200 shadow-xs">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={barangaySearch}
                    onChange={e => setBarangaySearch(e.target.value)}
                    placeholder="Search barangay by name, code, or focal person..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                  {barangaySearch && (
                    <button
                      onClick={() => setBarangaySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Risk Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[11px] font-bold text-stone-500 whitespace-nowrap pl-1">Zone:</span>
                  {[
                    { id: 'all', label: 'All Zones' },
                    { id: 'green', label: '🟢 Green (Free)' },
                    { id: 'yellow', label: '🟡 Yellow (Buffer)' },
                    { id: 'red', label: '🔴 Red (Surveillance)' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setBarangayRiskFilter(tab.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        barangayRiskFilter === tab.id
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barangay Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {displayedBarangays.map(bg => {
                  const isGreen = bg.riskLevel === 'green';
                  const isYellow = bg.riskLevel === 'yellow';

                  return (
                    <div
                      key={bg.id}
                      onClick={() => setSelectedBarangayDetail(bg)}
                      className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-stone-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2.5">
                        {/* Top: Name & Risk Badge */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <h4 className="font-black text-sm text-stone-900 group-hover:text-emerald-800 transition leading-snug">
                              {bg.name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold text-stone-400">
                              [{bg.code}] {bg.isUrban ? '• Urban' : '• Rural'}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase whitespace-nowrap shrink-0 border ${
                              isGreen
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : isYellow
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            {isGreen ? 'Green Zone' : isYellow ? 'Yellow Zone' : 'Red Zone'}
                          </span>
                        </div>

                        {/* Swine & Ready Metrics */}
                        <div className="grid grid-cols-2 gap-1.5 py-1.5 px-2 bg-stone-50 rounded-xl text-center border border-stone-100">
                          <div>
                            <span className="text-[10px] text-stone-500 font-semibold block">Swine Heads</span>
                            <span className="text-xs font-black text-emerald-950 block">{bg.swineCount}</span>
                          </div>
                          <div className="border-l border-stone-200 pl-1">
                            <span className="text-[10px] text-amber-800 font-semibold block">Ready to Sell</span>
                            <span className="text-xs font-black text-amber-900 block">{bg.readyToSellCount}</span>
                          </div>
                        </div>

                        {/* Focal Person Contact */}
                        <div className="text-[11px] text-stone-600 space-y-0.5 pt-0.5">
                          <div className="font-semibold text-stone-800 truncate" title={bg.focalPersonName}>
                            👤 {bg.focalPersonName}
                          </div>
                          <div className="text-stone-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-700" />
                            <span>{bg.contactNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Details Link */}
                      <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                        <span>Biosecurity details</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {displayedBarangays.length === 0 && (
                <div className="p-8 text-center bg-white/80 rounded-2xl border border-stone-200 space-y-2">
                  <MapPin className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs font-bold text-stone-600">No barangays matching your search filter.</p>
                  <button
                    onClick={() => {
                      setBarangaySearch('');
                      setBarangayRiskFilter('all');
                    }}
                    className="text-xs text-emerald-800 font-bold hover:underline"
                  >
                    Reset search filters
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* About & Academic Synergy Section */}
        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> {cmsConfig.aboutSubtitle}
              </span>
              <h2
                className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight"
                style={{ fontFamily: theme.headingFont || 'system-ui' }}
              >
                {cmsConfig.aboutTitle}
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {cmsConfig.aboutDescription}
              </p>

              {/* Pillars & Highlight Posts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                {((cmsConfig.aboutCards && cmsConfig.aboutCards.length > 0)
                  ? cmsConfig.aboutCards.filter(c => c.visible !== false)
                  : ((cmsConfig as any).aboutPillars || [])
                ).map((pillar: any, idx: number) => (
                  <div key={pillar.id || idx} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-400 font-mono">0{idx + 1}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </div>
                    <h4 className="font-bold text-xs text-stone-900">{pillar.title}</h4>
                    <p className="text-[11px] text-stone-600 leading-snug">{pillar.description || pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-stone-200 aspect-4/3 relative bg-stone-900">
                <img
                  src={cmsConfig.aboutImageUrl}
                  alt={cmsConfig.aboutTitle}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Programs & Agricultural Services Section */}
        {((cmsConfig.showFeaturesSection ?? cmsConfig.featuresVisible ?? true) !== false) && (
          <section id="programs" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-24">
            <span id="features" className="sr-only" />
            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Agricultural Extension & Animal Health</span>
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: theme.headingColor || '#064e3b',
                }}
              >
                {cmsConfig.featuresTitle || 'Municipal Programs & Agricultural Services'}
              </h2>
              <p className="text-xs text-stone-500 mt-1.5">
                {cmsConfig.featuresSubtitle || 'Comprehensive veterinary assistance, biosecurity subsidies, farm georeferencing, and direct market facilitation.'}
              </p>
              {cmsConfig.featuresButtonVisible && cmsConfig.featuresButtonText && (
                <div className="mt-4 flex justify-center">
                  <a
                    href={cmsConfig.featuresButtonLink || '#programs'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition hover:shadow-md"
                  >
                    <span>{cmsConfig.featuresButtonText}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {((cmsConfig.featureCards && cmsConfig.featureCards.length > 0)
                ? cmsConfig.featureCards.filter(f => f.visible !== false)
                : [
                    {
                      id: 'prog-asf-biosecurity',
                      title: 'African Swine Fever (ASF) Biosecurity & Disinfection Protocols',
                      description:
                        'Mandatory bio-exclusion gatekeeping, livestock vehicle wheel-baths, footbath solutions, and on-site chemical spraying assistance for all registered backyard and commercial pens.',
                      icon: 'ShieldCheck',
                      tag: 'Biosecurity First',
                      buttonText: 'View Biosecurity Standards',
                      buttonLink: '#ordinances',
                    },
                    {
                      id: 'prog-rsbsa-gis',
                      title: 'RSBSA Swine Farm Registration & GIS Georeferencing',
                      description:
                        'Spatial indexing of all swine pens under the Registry System for Basic Sectors in Agriculture (RSBSA) with georeferenced coordinates to monitor herd density and zone status.',
                      icon: 'MapPin',
                      tag: 'Spatial Mapping',
                      buttonText: 'Explore GIS Map',
                      buttonLink: '#biosecurity-map',
                    },
                    {
                      id: 'prog-breeding-ai',
                      title: 'High-Yield Breeding & AI Extension Support',
                      description:
                        'Provision of superior genetics semen straws, artificial insemination training, and reproductive health monitoring to increase litter sizes and disease resistance.',
                      icon: 'Sparkles',
                      tag: 'Veterinary Support',
                      buttonText: 'Contact Livestock Officer',
                      buttonLink: '#contact',
                    },
                    {
                      id: 'prog-market-takeoff',
                      title: 'Market-Ready Takeoff Catalog & Direct Agent Linking',
                      description:
                        'Transparent live-weight municipal takeoff catalog linking local backyard raisers directly with verified municipal meat traders and agents at prevailing market price benchmarks.',
                      icon: 'ShoppingBag',
                      tag: 'Fair Market Access',
                      buttonText: 'Check Market Catalog',
                      buttonLink: '#barangays',
                    },
                    {
                      id: 'prog-vet-clearance',
                      title: 'Veterinary Inspection & Transport Clearance',
                      description:
                        'Rapid issuance of Shipping Permits, Veterinary Health Certificates (VHC), and African Swine Fever negative laboratory test certifications for inter-municipality movement.',
                      icon: 'CheckCircle',
                      tag: 'Regulatory Compliance',
                      buttonText: 'Permit Guidelines',
                      buttonLink: '#ordinances',
                    },
                    {
                      id: 'prog-odorless-pens',
                      title: 'Odorless Pigpen ("Baboyang Walang Amoy") & Waste Lagoons',
                      description:
                        'Technical guidelines and bio-enzyme starter cultures for deep-litter bedding, biogas digesters, and septic containment to eliminate community odor and waterway runoff.',
                      icon: 'Activity',
                      tag: 'Clean Agriculture',
                      buttonText: 'Setback Regulations',
                      buttonLink: '#ordinances',
                    },
                  ]
              ).map((feature: any) => (
                <div
                  key={feature.id}
                  className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between group hover:border-emerald-300 hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    </div>
                    {feature.tag && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-600 uppercase">
                        {feature.tag}
                      </span>
                    )}
                    <h3 className="font-black text-sm text-stone-900 group-hover:text-emerald-800 transition">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{feature.description}</p>
                  </div>

                  {feature.buttonText && (
                    <div className="pt-2">
                      <a
                        href={feature.buttonLink || '#'}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition"
                      >
                        <span>{feature.buttonText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Additional Custom Created Features Sections */}
            {(cmsConfig.featuresSections || [])
              .filter(sec => sec.visible !== false)
              .map(sec => (
                <div key={sec.id} className="mt-12 pt-10 border-t border-stone-200/70">
                  <div className="text-center max-w-xl mx-auto mb-8">
                    <h3
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{
                        fontFamily: theme.headingFont || 'system-ui',
                        color: theme.headingColor || '#064e3b',
                      }}
                    >
                      {sec.title}
                    </h3>
                    {sec.subtitle && <p className="text-xs text-stone-500 mt-1">{sec.subtitle}</p>}
                    {sec.description && <p className="text-xs text-stone-600 mt-2">{sec.description}</p>}
                  </div>
                  {sec.cards && sec.cards.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sec.cards.filter(c => c.visible !== false).map(card => (
                        <div
                          key={card.id}
                          className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between group hover:border-emerald-300 hover:shadow-md transition"
                        >
                          <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                              <ShieldCheck className="w-5 h-5 text-emerald-700" />
                            </div>
                            <h4 className="font-black text-sm text-stone-900 group-hover:text-emerald-800 transition">
                              {card.title}
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed">{card.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </section>
        )}

        {/* Biosecurity & ASF GIS Surveillance Section */}
        <section id="biosecurity-map" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-24">
          <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-stone-900 text-white rounded-3xl p-8 sm:p-12 border border-emerald-800 shadow-2xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-300 text-xs font-bold border border-emerald-700/60">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time Disease Surveillance & Quarantine GIS</span>
                </div>
                <h2
                  className="text-2xl sm:text-4xl font-black tracking-tight"
                  style={{ fontFamily: theme.headingFont || 'system-ui' }}
                >
                  Hinunangan Biosecurity & Disease Surveillance GIS
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
                  Continuous multi-tier spatial monitoring safeguarding Hinunangan's swine raisers against African Swine Fever through digital geofencing, mobile checkpoints, and rapid veterinary dispatch.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-emerald-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-950" />
                  <span>Access Interactive GIS Portal</span>
                </button>
              </div>
            </div>

            {/* 4 Real-time Biosecurity Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                  <span>Municipal Zone Status</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">Green Zone</div>
                <div className="text-[11px] text-emerald-100/70">100% Free / Protected Zone</div>
              </div>

              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                  <span>Active Outbreaks</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-300">0 Reported</div>
                <div className="text-[11px] text-emerald-100/70">Zero mortality cluster incidents</div>
              </div>

              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                  <span>RSBSA Georeferencing</span>
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">40 / 40</div>
                <div className="text-[11px] text-emerald-100/70">Barangays indexed on GIS</div>
              </div>

              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                  <span>Quarantine Checkpoints</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">3 Stations</div>
                <div className="text-[11px] text-emerald-100/70">24/7 boundary wheel disinfection</div>
              </div>
            </div>

            {/* 3-Tier Zoning Guide Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-900/40 border border-emerald-700/50 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="font-bold text-xs text-white">Green Zone (Free / Protected)</span>
                </div>
                <p className="text-[11px] text-emerald-100/70 leading-relaxed">
                  Regular swine movement permitted with standard Barangay Clearance and Veterinary Health Certificate (VHC).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-700/50 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="font-bold text-xs text-white">Yellow Zone (Buffer / Surveillance)</span>
                </div>
                <p className="text-[11px] text-emerald-100/70 leading-relaxed">
                  Heightened border disinfection and blood sampling. Swine transport strictly regulated by Municipal Livestock Task Force.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-700/50 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="font-bold text-xs text-white">Red Zone (Infected / Quarantine)</span>
                </div>
                <p className="text-[11px] text-emerald-100/70 leading-relaxed">
                  Total freeze on all live swine and pork movement within 1km–7km containment radius. (None currently in Hinunangan).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Decrees & Ordinances Section */}
        {legalLandingConfig.showLegalDocuments !== false && (
          <section id="ordinances" className="max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-24 space-y-8">
            <div className="text-center max-w-2xl mx-auto mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <Scale className="w-3.5 h-3.5 text-emerald-700" />
                <span>Official Statutory Framework</span>
              </div>
              <h2
                className="text-2xl sm:text-4xl font-black tracking-tight"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: theme.headingColor || '#064e3b',
                }}
              >
                {legalLandingConfig.sectionTitle || 'Legal Decrees & Ordinances'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                {legalLandingConfig.sectionSubtitle ||
                  'Enacted municipal legislation governing livestock zoning, environmental buffers, bio-exclusion protocols, and raiser rights across Hinunangan, Southern Leyte.'}
              </p>
            </div>

            {/* Statutory Locational Setback Standards Banner */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-emerald-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    Mandatory Locational Guidelines • Municipal Ordinance No. 2025-59
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    Official Buffer Zones & Environmental Setbacks
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/20">
                  Enforced by Municipal Livestock Task Force (MLTF)
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                  <span className="text-2xl sm:text-3xl font-black text-amber-300 block">50m</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Backyard Piggery</span>
                  <span className="text-[10px] text-emerald-200 block">Setback from residential houses</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                  <span className="text-2xl sm:text-3xl font-black text-amber-300 block">100m</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Commercial Piggery</span>
                  <span className="text-[10px] text-emerald-200 block">Setback from built-up zones & resorts</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                  <span className="text-2xl sm:text-3xl font-black text-amber-300 block">25m</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Water Bodies</span>
                  <span className="text-[10px] text-emerald-200 block">Setback from rivers, creeks & wells</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                  <span className="text-2xl sm:text-3xl font-black text-amber-300 block">₱2,500</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Penal Fines</span>
                  <span className="text-[10px] text-emerald-200 block">+ Immediate pen closure on 3rd offense</span>
                </div>
              </div>
            </div>

            {/* Optional Citizen Legal Document Search Bar */}
            {legalLandingConfig.showSearch !== false && (
              <div className="max-w-md mx-auto relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={legalDocSearch}
                  onChange={e => setLegalDocSearch(e.target.value)}
                  placeholder="Search ordinances, resolutions, or decrees..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
                {legalDocSearch && (
                  <button
                    type="button"
                    onClick={() => setLegalDocSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Ordinances Cards Grid */}
            {displayedLegalDocuments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 shadow-2xs text-stone-500 text-xs">
                <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="font-bold">No matching legal decrees or ordinances found.</p>
                {legalDocSearch && <p className="text-[11px] text-stone-400 mt-1">Try searching with a different number or keyword.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displayedLegalDocuments.map((doc, docIdx) => (
                  <div
                    key={`landing-ord-${doc.id || docIdx}-${docIdx}`}
                    className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-stone-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {legalLandingConfig.showCategory !== false && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {doc.category === 'ordinance' || doc.type === 'municipal_ordinance'
                              ? 'Municipal Ordinance'
                              : doc.category === 'resolution'
                              ? 'SB Resolution'
                              : (doc.category || doc.type).replace('_', ' ')}
                          </span>
                        )}
                        {legalLandingConfig.showDate !== false && doc.dateEnacted && (
                          <span className="text-[11px] font-bold text-stone-400">{doc.dateEnacted}</span>
                        )}
                      </div>

                      <div>
                        {legalLandingConfig.showDocumentNumber !== false && (
                          <h3 className="font-black text-sm text-stone-900 group-hover:text-emerald-800 transition line-clamp-2">
                            {doc.officialNumber}
                          </h3>
                        )}
                        {legalLandingConfig.showTitle !== false && (
                          <p className="text-xs font-semibold text-emerald-900/80 mt-0.5">{doc.knownAs || doc.title}</p>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-4">
                        {doc.shortSummary || doc.description}
                      </p>

                      {doc.author && (
                        <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 flex items-center justify-between">
                          <span>Author: {doc.author}</span>
                          <span className="font-bold text-emerald-700">{doc.status.toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    {legalLandingConfig.showViewButton !== false && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrdinance(doc)}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Read Statutory Provisions & Articles</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Gallery Section */}
        {(cmsConfig.galleryPhotos || []).some(p => p.showOnLanding) && (
          <section id="gallery" className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: theme.headingColor || '#064e3b',
                }}
              >
                {cmsConfig.galleryTitle}
              </h2>
              <p className="text-xs text-stone-500 mt-1.5">{cmsConfig.gallerySubtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(cmsConfig.galleryPhotos || [])
                .filter(p => p.showOnLanding)
                .map(photo => (
                  <div
                    key={photo.id}
                    className="bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden border border-stone-200 shadow-sm group"
                  >
                    <div className="aspect-4/3 overflow-hidden bg-stone-900 relative">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/75 text-white text-[10px] font-bold">
                        {photo.category}
                      </span>
                    </div>
                    <div className="p-4 space-y-1">
                      <h4 className="font-bold text-xs text-stone-900">{photo.title}</h4>
                      <p className="text-[11px] text-stone-500 leading-snug">{photo.caption}</p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Education & Extension Videos */}
        {(cmsConfig.videos || []).some(v => v.visible !== false) && (
          <section id="videos" className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold mb-2">
                <Video className="w-3.5 h-3.5" />
                <span>Education & Extension Video Series</span>
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: theme.headingColor || '#064e3b',
                }}
              >
                {cmsConfig.videoTitle || cmsConfig.videosTitle || 'Education & Extension Video Guides'}
              </h2>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                {cmsConfig.videoSubtitle || cmsConfig.videosSubtitle || 'Step-by-step video demonstrations on African Swine Fever prevention, biosecurity protocols, and high-yield backyard raising.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(cmsConfig.videos || [])
                .filter(v => v.visible !== false)
                .map(video => (
                  <div
                    key={video.id}
                    className="bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition duration-300"
                  >
                    <div>
                      {/* Video Thumbnail with YouTube Play Button */}
                      <div
                        onClick={() => setSelectedVideo(video)}
                        className="aspect-16/9 bg-stone-900 relative overflow-hidden cursor-pointer"
                      >
                        <img
                          src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80'}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/10 transition">
                          <div className="w-12 h-12 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg transform group-hover:scale-115 transition duration-300">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono font-bold backdrop-blur-xs">
                            {video.duration}
                          </span>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-bold backdrop-blur-xs">
                          {video.category || 'Livestock Extension'}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-sm text-stone-900 leading-snug group-hover:text-emerald-800 transition">
                          {video.title}
                        </h4>
                        {video.description && (
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-stone-100 mt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedVideo(video)}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-emerald-800" /> Watch Video
                      </button>
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition"
                      >
                        <span>YouTube</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Official Updates & Social Media Feed */}
        {(cmsConfig.socialPosts || []).some(p => p.visible) && (
          <section id="social" className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: theme.headingColor || '#064e3b',
                }}
              >
                {cmsConfig.socialTitle || 'Official Updates & Social Media Feed'}
              </h2>
              <p className="text-xs text-stone-500 mt-1.5">
                {cmsConfig.socialSubtitle || 'Stay informed with the latest agricultural advisories, price bulletins, and veterinary schedules.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(cmsConfig.socialPosts || [])
                .filter(p => p.visible)
                .map(post => {
                  const isYouTube =
                    post.buttonColor === 'red' ||
                    post.buttonPlatform === 'youtube' ||
                    (post.buttonText || '').toLowerCase().includes('youtube') ||
                    post.postUrl.toLowerCase().includes('youtube') ||
                    post.postUrl.toLowerCase().includes('youtu.be');

                  const isFacebook =
                    !isYouTube &&
                    (post.buttonColor === 'blue' ||
                      post.buttonPlatform === 'facebook' ||
                      (post.buttonText || '').toLowerCase().includes('facebook') ||
                      post.postUrl.toLowerCase().includes('facebook'));

                  const btnBg = isYouTube
                    ? 'bg-[#FF0000] hover:bg-[#cc0000] text-white shadow-red-900/10'
                    : isFacebook
                    ? 'bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-blue-900/10'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10';

                  return (
                    <div
                      key={post.id}
                      className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-stone-400">
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            <Share2 className="w-3.5 h-3.5" /> {post.author}
                          </span>
                          <span>{post.date}</span>
                        </div>
                        <h4 className="font-bold text-sm text-stone-900 leading-snug">{post.title}</h4>
                        <p className="text-xs text-stone-600 leading-relaxed">{post.content}</p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 mt-4 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-medium text-stone-400 truncate">
                          {post.noticeLabel || 'Official Municipal Notice'}
                        </span>
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition transform hover:-translate-y-0.5 shrink-0 ${btnBg}`}
                        >
                          <span>
                            {post.buttonText ||
                              (isYouTube
                                ? 'Watch on YouTube'
                                : isFacebook
                                ? 'View on Facebook'
                                : 'Official Link')}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Contact & Hotlines Section */}
        <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-12 border border-emerald-800 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> Official Municipal Agriculture Contact
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">{cmsConfig.officeName}</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">{cmsConfig.address}</p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-200">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{cmsConfig.officeHours}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>{cmsConfig.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Office: {cmsConfig.contactPhone}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4 text-center">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                24/7 Rapid Response ASF Emergency Hotline
              </span>
              <a
                href={`tel:${cmsConfig.hotlineEmergency}`}
                className="text-2xl sm:text-3xl font-black text-amber-300 block hover:underline"
              >
                {cmsConfig.hotlineEmergency}
              </a>
              <p className="text-[11px] text-emerald-100/70 leading-relaxed">
                Call immediately to report symptoms, unusual pig illness, or request urgent veterinary inspection across any Hinunangan barangay.
              </p>
              <div className="pt-2 flex justify-center">
                <PWAInstallButton />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 border-t border-stone-300/60 text-xs text-stone-600">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              {/* Footer Logos (Footer Only - Managed from Footer Logo Management) */}
              <div className="flex flex-wrap items-center gap-3">
                {((cmsConfig.footerLogos && cmsConfig.footerLogos.length > 0)
                  ? cmsConfig.footerLogos.filter(l => l.visible !== false)
                  : [
                      {
                        id: 'flogo-default',
                        url: cmsConfig.footerLogoUrl || cmsConfig.systemLogoUrl || cmsConfig.websiteLogoUrl || '/icon.svg',
                        name: cmsConfig.websiteTitle || 'Municipal Swine Registry',
                      },
                    ]
                ).map(logo => (
                  <div key={logo.id} className="flex items-center gap-2">
                    <img
                      src={logo.url || '/icon.svg'}
                      alt={logo.name || 'Footer Logo'}
                      className="w-8 h-8 object-contain rounded-md bg-white p-0.5 border border-stone-200 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                    {logo.name && (
                      <span className="font-bold text-stone-900 text-sm">{logo.name}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed max-w-md text-stone-500">
                {cmsConfig.footerDescription}
              </p>
            </div>

            {/* Dynamic Footer Columns */}
            {(cmsConfig.footerColumns || []).map(col => (
              <div key={col.id} className="space-y-2">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-1.5 text-[11px]">
                  {col.links.map(link => (
                    <li key={link.id}>
                      <a href={link.url} className="text-stone-500 hover:text-emerald-700 transition">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400">
            <span>{cmsConfig.footerCopyright}</span>
            <span className="font-semibold text-emerald-800">
              Department of Agriculture • Municipality of Hinunangan • SLSU Extension
            </span>
          </div>
        </footer>
      </div>

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 text-white rounded-2xl overflow-hidden max-w-3xl w-full border border-stone-700 shadow-2xl space-y-3">
            <div className="p-4 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <h3 className="font-bold text-sm truncate max-w-lg">{selectedVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-16/9 bg-black w-full">
              {selectedVideo.videoUrl && (selectedVideo.videoUrl.includes('youtube.com') || selectedVideo.videoUrl.includes('youtu.be')) ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedVideo.videoUrl)}
                  title={selectedVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>

            <div className="p-4 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-400">
              <p className="line-clamp-2 max-w-xl text-[11px] leading-relaxed text-stone-300">
                {selectedVideo.description}
              </p>
              <a
                href={selectedVideo.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Barangay Detail Modal */}
      {selectedBarangayDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/20 uppercase">
                    Code: {selectedBarangayDetail.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      selectedBarangayDetail.riskLevel === 'green'
                        ? 'bg-emerald-400 text-emerald-950'
                        : selectedBarangayDetail.riskLevel === 'yellow'
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-red-400 text-red-950'
                    }`}
                  >
                    {selectedBarangayDetail.riskLevel === 'green'
                      ? 'Green Zone (Free)'
                      : selectedBarangayDetail.riskLevel === 'yellow'
                      ? 'Yellow Zone (Buffer)'
                      : 'Red Zone (Surveillance)'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mt-1.5 text-white">
                  Barangay {selectedBarangayDetail.name}
                </h3>
                <p className="text-xs text-emerald-100/80">
                  Hinunangan, Southern Leyte • {selectedBarangayDetail.isUrban ? 'Urban Zone' : 'Rural Agricultural Zone'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBarangayDetail(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-stone-700">
              {/* Swine Population Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-[11px] font-bold text-stone-500 uppercase block">Active Swine Population</span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-950 block mt-0.5">
                    {selectedBarangayDetail.swineCount}
                  </span>
                  <span className="text-[10px] text-stone-400">Heads tagged in RSBSA</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                  <span className="text-[11px] font-bold text-amber-800 uppercase block">Ready for Market</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-900 block mt-0.5">
                    {selectedBarangayDetail.readyToSellCount}
                  </span>
                  <span className="text-[10px] text-amber-700/80">Market-ready liveweight</span>
                </div>
              </div>

              {/* Designated Focal Person */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Designated Barangay Agricultural Focal Person
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-sm text-stone-900">{selectedBarangayDetail.focalPersonName}</h4>
                    <span className="text-[11px] text-stone-500">Barangay Livestock Extension Officer</span>
                  </div>
                  <a
                    href={`tel:${selectedBarangayDetail.contactNumber}`}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedBarangayDetail.contactNumber}</span>
                  </a>
                </div>
              </div>

              {/* Biosecurity Checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider block">
                  Barangay Biosecurity & Compliance Status
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-semibold text-stone-700">Geographic Spatial Mapping</span>
                    <span className="font-mono text-[11px] text-emerald-800 font-bold">
                      {selectedBarangayDetail.latitude.toFixed(4)}°N, {selectedBarangayDetail.longitude.toFixed(4)}°E
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-semibold text-stone-700">ASF Quarantine Inspection</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cleared & Monitored
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-semibold text-stone-700">Livestock Movement Permitting</span>
                    <span className="text-stone-700 font-semibold">VHC & Barangay Permit Required</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBarangayDetail(null)}
                className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ordinance Statutory Detail Modal */}
      {selectedOrdinance && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-white flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-400 text-emerald-950">
                    {selectedOrdinance.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-emerald-300 font-semibold">
                    Enacted: {selectedOrdinance.dateEnacted}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  {selectedOrdinance.officialNumber}
                </h3>
                <p className="text-xs text-emerald-200 font-medium">{selectedOrdinance.knownAs}</p>
                {selectedOrdinance.author && (
                  <p className="text-[11px] text-stone-300">Author / Sponsor: {selectedOrdinance.author}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrdinance(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-stone-700">
              {/* Summary */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Official Legislative Summary
                </span>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {selectedOrdinance.description || selectedOrdinance.shortSummary}
                </p>
              </div>

              {/* Setbacks & Spatial Buffer Rules if present */}
              {selectedOrdinance.mandatorySetbacks && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider block">
                    Statutory Setback Distances & Spatial Buffers
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-base font-black text-emerald-900 block">
                        {selectedOrdinance.mandatorySetbacks.backyardDistanceMeters}m
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">Backyard Pen</span>
                      <span className="text-[9px] text-stone-500">From houses</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-base font-black text-emerald-900 block">
                        {selectedOrdinance.mandatorySetbacks.commercialDistanceMeters}m
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">Commercial Pen</span>
                      <span className="text-[9px] text-stone-500">From built-up area</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-base font-black text-emerald-900 block">
                        {selectedOrdinance.mandatorySetbacks.waterResourceDistanceMeters}m
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">Water Bodies</span>
                      <span className="text-[9px] text-stone-500">From rivers/wells</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-base font-black text-emerald-900 block">
                        {selectedOrdinance.mandatorySetbacks.highwayDistanceMeters}m
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">Road Setback</span>
                      <span className="text-[9px] text-stone-500">From public road</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Articles */}
              {selectedOrdinance.keyArticles && selectedOrdinance.keyArticles.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider block">
                    Key Articles & Operative Provisions
                  </span>
                  <div className="space-y-2">
                    {selectedOrdinance.keyArticles.map((art, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-stone-900 text-xs">
                            {art.articleNumber ? `Article ${art.articleNumber}: ` : ''}
                            {art.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              art.mandateCategory === 'mandatory'
                                ? 'bg-red-100 text-red-800'
                                : art.mandateCategory === 'prohibitive'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {art.mandateCategory}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">{art.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statutory Penalties */}
              {selectedOrdinance.statutoryPenalties && selectedOrdinance.statutoryPenalties.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider block">
                    Statutory Penalties & Enforcement Escalation
                  </span>
                  <div className="space-y-1.5">
                    {selectedOrdinance.statutoryPenalties.map((pen, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-red-50/50 border border-red-200 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-bold text-red-950 uppercase">{pen.offense}</span>
                        <span className="font-black text-red-800">{pen.fineText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrdinance(null)}
                className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
