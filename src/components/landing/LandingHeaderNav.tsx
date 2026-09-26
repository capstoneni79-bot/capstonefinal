import React, { useState } from 'react';
import {
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  LogIn,
  Layers,
  Sparkles,
  ChevronRight,
  Globe,
} from 'lucide-react';
import {
  SealDA,
  SealMunicipality,
  SealBagongPilipinas,
  useOfficialLogos,
} from '../common/OfficialSeals';
import { LandingCmsConfig } from '../../types/landingCms';

interface LandingHeaderNavProps {
  cmsConfig?: LandingCmsConfig;
  barangayCount?: number;
  currentLanguage: 'EN' | 'CEB';
  onLanguageChange: (lang: 'EN' | 'CEB') => void;
  onOpenLogin: () => void;
  isEmbeddedPreview?: boolean;
}

export const LandingHeaderNav: React.FC<LandingHeaderNavProps> = ({
  cmsConfig,
  barangayCount = 40,
  currentLanguage,
  onLanguageChange,
  onOpenLogin,
  isEmbeddedPreview = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logos = useOfficialLogos();

  // Custom or default texts
  const officeTitle =
    cmsConfig?.headerTitle || 'Municipal Agriculture Office - Hinunangan';
  const officeSubtitle =
    cmsConfig?.headerSubtitle ||
    'Swine Farm Registry and Georeferencing';

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Cebuano & English translations
  const navLabels = {
    EN: {
      programs: 'Programs & Services',
      about: 'About Office',
      barangays: `${barangayCount || 40} Barangays`,
      ordinances: 'Ordinances',
      contact: 'Contact & Support',
      signIn: 'Sign In (Staff Portal)',
    },
    CEB: {
      programs: 'Mga Programa ug Serbisyo',
      about: 'Mahitungod sa Opisina',
      barangays: `${barangayCount || 40} ka Barangay`,
      ordinances: 'Mga Ordinansa',
      contact: 'Kontak ug Tabang',
      signIn: 'Sulod (Staff Portal)',
    },
  }[currentLanguage];

  return (
    <header
      className={`w-full bg-white/98 backdrop-blur-md border-b border-stone-200 shadow-xs text-stone-900 ${
        isEmbeddedPreview ? 'relative' : 'sticky top-0'
      } z-50 transition-all`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          {/* Left: 3 Logos + Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Logos Group */}
            <div className="flex items-center -space-x-1 sm:space-x-1.5 shrink-0">
              {/* Logo 1: DA Seal */}
              <div className="p-0.5 bg-white rounded-full shadow-2xs border border-stone-100 flex items-center justify-center">
                <SealDA className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              {/* Logo 2: Municipal Seal */}
              <div className="p-0.5 bg-white rounded-full shadow-2xs border border-stone-100 flex items-center justify-center">
                <SealMunicipality className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              {/* Logo 3: Bagong Pilipinas / MAO Heart Seal */}
              <div className="p-0.5 bg-white rounded-full shadow-2xs border border-stone-100 flex items-center justify-center">
                <SealBagongPilipinas className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>

            {/* Brand Title & Subtitle */}
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-slate-900 leading-snug truncate">
                {officeTitle}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                {officeSubtitle}
              </p>
            </div>
          </div>

          {/* Center / Right Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <button
              type="button"
              onClick={() => scrollToSection('programs')}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-700 transition cursor-pointer"
            >
              {navLabels.programs}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-700 transition cursor-pointer"
            >
              {navLabels.about}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('barangays')}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-700 transition cursor-pointer"
            >
              {navLabels.barangays}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ordinances')}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-700 transition cursor-pointer"
            >
              {navLabels.ordinances}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-700 transition cursor-pointer"
            >
              {navLabels.contact}
            </button>
          </div>

          {/* Right: Language Switcher + Sign In Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher [ EN | CEB ] */}
            <div className="bg-stone-100 p-0.5 rounded-lg border border-stone-300 flex items-center shadow-2xs">
              <button
                type="button"
                onClick={() => onLanguageChange('EN')}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-md transition ${
                  currentLanguage === 'EN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('CEB')}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-md transition ${
                  currentLanguage === 'CEB'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Cebuano / Bisaya"
              >
                CEB
              </button>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span className="whitespace-nowrap">{navLabels.signIn}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => scrollToSection('programs')}
              className="text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 rounded-lg transition"
            >
              {navLabels.programs}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 rounded-lg transition"
            >
              {navLabels.about}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('barangays')}
              className="text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 rounded-lg transition"
            >
              {navLabels.barangays}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ordinances')}
              className="text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 rounded-lg transition"
            >
              {navLabels.ordinances}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 rounded-lg transition"
            >
              {navLabels.contact}
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">Select Language:</span>
            <div className="bg-stone-100 p-0.5 rounded-lg border border-stone-300 flex items-center">
              <button
                type="button"
                onClick={() => onLanguageChange('EN')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  currentLanguage === 'EN' ? 'bg-blue-600 text-white' : 'text-stone-600'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('CEB')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  currentLanguage === 'CEB' ? 'bg-blue-600 text-white' : 'text-stone-600'
                }`}
              >
                CEB
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
