export type MediaCategory =
  | 'all'
  | 'logos'
  | 'seals'
  | 'hero'
  | 'backgrounds'
  | 'slsu'
  | 'extension'
  | 'agriculture'
  | 'facilities'
  | 'gallery'
  | 'social'
  | 'videos'
  | 'icons'
  | 'other'
  | 'All'
  | 'Logos'
  | 'Municipal Seals'
  | 'Hero Images'
  | 'Backgrounds'
  | 'SLSU'
  | 'Extension Center'
  | 'Agriculture'
  | 'Facilities'
  | 'Gallery'
  | 'Social Media'
  | 'Videos'
  | 'Icons'
  | 'Other';

export interface MediaItem {
  id: string;
  name?: string;
  fileName?: string;
  url: string;
  category: MediaCategory;
  fileSize: string;
  fileType?: string;
  dimensions: string;
  uploadDate: string;
  altText: string;
  caption?: string;
  tags?: string[];
  placement?: string;
  visible?: boolean;
  brightness?: number;
  contrast?: number;
  opacity?: number;
  rotation?: number;
  zoom?: number;
  usedInSections?: string[];
}

export type LogoPlacement = 'header_left' | 'header_right' | 'hero' | 'about' | 'partners' | 'footer';

export interface OfficialLogoItem {
  id: string;
  name: string;
  institution: string; // e.g. 'Department of Agriculture', 'LGU Hinunangan', 'Southern Leyte State University'
  category?: 'municipal' | 'da' | 'slsu' | 'extension' | 'partner' | 'system' | string;
  url?: string;
  vectorComponent?: 'SealDA' | 'SealMunicipality' | 'SealTaskForce' | 'SealSLSU' | 'SealExtension';
  placement: LogoPlacement | string;
  sizePx?: number;
  size?: number | string;
  margin?: number | string;
  spacingPx?: number;
  alignment?: 'left' | 'center' | 'right' | string;
  visible: boolean;
  mobileVisible?: boolean;
  variant?: 'light' | 'dark' | 'color';
  order: number;
}

export interface NavItem {
  id: string;
  label: string;
  href: string; // anchor or section ID
  visible: boolean;
  isButton?: boolean;
  order: number;
}

export interface AboutCardItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  imageUrl?: string;
  titleColor?: string;
  descriptionColor?: string;
  visible: boolean;
  order: number;
}

export interface FeatureCardItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  titleColor?: string;
  descriptionColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  visible: boolean;
  order: number;
}

export interface FeatureSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  titleColor?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  cards?: FeatureCardItem[];
  visible: boolean;
  order: number;
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
  icon: string;
  description: string;
  labelColor?: string;
  valueColor?: string;
  descriptionColor?: string;
  visible: boolean;
  order: number;
}

export interface GalleryPhotoItem {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  category: string;
  showOnLanding: boolean;
  order: number;
}

export type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'x' | 'website' | 'email';

export interface SocialAccountItem {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  handle?: string;
  enabled: boolean;
  order: number;
}

export interface FeaturedSocialPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  platform: SocialPlatform;
  postUrl: string;
  date: string;
  author: string;
  visible: boolean;
  buttonText?: string; // Customizable action label e.g., "View on Facebook"
  buttonColor?: 'blue' | 'red' | 'emerald' | 'stone' | string;
  buttonPlatform?: 'facebook' | 'youtube' | 'portal' | 'website' | 'other';
  noticeLabel?: string; // e.g., "Official Municipal Notice"
}

export type SocialPostItem = FeaturedSocialPost;

export interface VideoMediaItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: string;
  category?: string;
  visible: boolean;
  order: number;
}

export type VideoItem = VideoMediaItem;

export interface AnnouncementBarConfig {
  enabled: boolean;
  text: string;
  linkText?: string;
  linkUrl?: string;
  startDate?: string;
  endDate?: string;
  bgColor: string;
  textColor: string;
  position: 'top' | 'below_header' | 'above_hero';
  isDismissible: boolean;
}

export interface FooterColumnLink {
  id: string;
  label: string;
  url: string;
  external?: boolean;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterColumnLink[];
}

export type FooterColumnItem = FooterColumn;

export interface FooterLogoItem {
  id: string;
  name: string;
  url: string;
  altText?: string;
  visible?: boolean;
  order?: number;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  backgroundColor?: string;
  textColor: string;
  headingColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderColor: string;
  headingFont: string;
  bodyFont: string;
  fontSize: 'small' | 'medium' | 'large';
  headingSize: 'normal' | 'large' | 'extralarge';
  buttonSize: 'small' | 'medium' | 'large';
  appearance: 'light' | 'dark' | 'auto';
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  shadowLevel: 'none' | 'soft' | 'medium' | 'strong';
  shadowDepth?: string;
}

export type SectionType =
  | 'announcement'
  | 'header'
  | 'hero'
  | 'about'
  | 'features'
  | 'statistics'
  | 'gis_promo'
  | 'gallery'
  | 'videos'
  | 'social_posts'
  | 'partners'
  | 'contact'
  | 'footer'
  | 'custom';

export interface PageSectionItem {
  id: string;
  type?: SectionType;
  sectionType?: string;
  title?: string;
  name?: string;
  customTitle?: string;
  customSubtitle?: string;
  subtitle?: string;
  padding?: string;
  enabled: boolean;
  order: number;
  customType?: 'text' | 'image' | 'gallery' | 'video' | 'cards' | 'statistics' | 'announcement' | 'partners' | 'contact' | 'custom_html';
  customContent?: string;
}

export type LandingSectionItem = PageSectionItem;

export interface BackgroundPhotoConfig {
  imageUrl: string;
  brightness: number; // 0 to 200, 100 = default
  overlayOpacity: number; // 0 to 100
  overlayColor: string;
  blur: number; // 0 to 20 px
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  fit: 'cover' | 'contain' | 'auto';
  scale: number; // 80 to 150 %
  useSameForAllDevices: boolean;
  tabletImageUrl?: string;
  mobileImageUrl?: string;
  enabled?: boolean;
  repeat?: string;
  fixed?: boolean;
}

export interface LegalDocumentsLandingConfig {
  showLegalDocuments: boolean;
  sectionTitle?: string;
  sectionSubtitle?: string;
  showLatestDocuments: boolean;
  showFeaturedDocuments: boolean;
  showSearch: boolean;
  maxFeaturedDocuments: number;
  featuredDocumentIds: string[];
  showDocumentNumber: boolean;
  showTitle: boolean;
  showDate: boolean;
  showCategory: boolean;
  showViewButton: boolean;
}

export interface LandingCmsConfig {
  version: string;
  lastUpdated: string;
  status: 'published' | 'draft';
  
  // Legal Documents Section Settings
  legalDocumentsConfig?: LegalDocumentsLandingConfig;
  
  // General & Browser Branding
  siteName: string;
  siteSubtitle: string;
  browserTitle: string;
  metaDescription: string;
  metaKeywords: string;
  faviconUrl: string;
  systemLogoUrl: string;
  websiteLogoUrl?: string;
  websiteTitle?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;

  // Header & Navigation
  headerTitle?: string;
  headerSubtitle?: string;
  headerLanguageEnabled?: boolean;
  headerLogoUrl: string;
  headerLogoWidth: number;
  headerHeight: number;
  headerBgColor: string;
  headerTextColor: string;
  headerButtonText: string;
  headerButtonColor: string;
  navItems: NavItem[];

  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroTitleColor?: string;
  heroSubtitleColor?: string;
  heroDescriptionColor?: string;
  heroBadgeColor?: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  heroBackgroundUrl: string;
  heroBgPosition: string;
  heroBgSize: 'cover' | 'contain' | 'auto';
  heroOverlayOpacity: number;
  heroOverlayColor: string;
  heroTextAlign: 'left' | 'center' | 'right';
  heroHeight: 'small' | 'medium' | 'large' | 'fullscreen';
  heroBadgeText: string;
  heroImagePresets?: Array<{ id?: string; name: string; url: string }>;

  // Background Photo
  interfaceBackground: BackgroundPhotoConfig;

  // Sections
  aboutTitle: string;
  aboutDescription: string;
  aboutImageUrl: string;
  aboutTitleColor?: string;
  aboutDescriptionColor?: string;
  aboutCards: AboutCardItem[];

  featuresTitle: string;
  featuresSubtitle: string;
  featuresTitleColor?: string;
  featuresSubtitleColor?: string;
  featureCards: FeatureCardItem[];
  featuresSections?: FeatureSectionItem[];
  showFeaturesSection?: boolean;
  featuresVisible?: boolean;
  featuresButtonText?: string;
  featuresButtonLink?: string;
  featuresButtonVisible?: boolean;

  statsTitle: string;
  statsSubtitle: string;
  statsTitleColor?: string;
  statsSubtitleColor?: string;
  stats: StatItem[];

  // Media & Official Logos
  mediaItems: MediaItem[];
  officialLogos: OfficialLogoItem[];

  // Gallery
  galleryTitle: string;
  gallerySubtitle: string;
  galleryTitleColor?: string;
  gallerySubtitleColor?: string;
  galleryLayout: 'grid' | 'masonry' | 'carousel';
  galleryPhotos: GalleryPhotoItem[];

  // Social Media & Posts
  socialTitle: string;
  socialSubtitle: string;
  socialTitleColor?: string;
  socialSubtitleColor?: string;
  socialAccounts: SocialAccountItem[];
  socialPosts: FeaturedSocialPost[];

  // Videos
  videoTitle: string;
  videoSubtitle: string;
  videoTitleColor?: string;
  videoSubtitleColor?: string;
  videosTitle?: string;
  videosSubtitle?: string;
  videos: VideoMediaItem[];

  // Announcement Bar
  announcement: AnnouncementBarConfig;

  // Contact Section
  contactTitle: string;
  contactSubtitle: string;
  contactTitleColor?: string;
  contactSubtitleColor?: string;
  officeName: string;
  officeHours: string;
  hotlineEmergency: string;
  mapImageUrl: string;

  // Footer Management
  footerLogoUrl: string;
  footerLogos?: FooterLogoItem[];
  footerDescription: string;
  footerCopyright: string;
  footerHeadingColor?: string;
  footerTextColor?: string;
  footerColumns: FooterColumn[];

  // Theme & Appearance
  theme: ThemeConfig;

  // Page Sections Order & Visibility
  sections: PageSectionItem[];
}
