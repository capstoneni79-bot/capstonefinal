export type SupportedFontFamily =
  | 'Inter'
  | 'Roboto'
  | 'Poppins'
  | 'Montserrat'
  | 'Open Sans'
  | 'Nunito'
  | 'System Default';

export interface TypographyElementConfig {
  fontFamily: SupportedFontFamily;
  fontSize: number; // in px
  fontWeight: 400 | 500 | 600 | 700 | 800 | 900;
  lineHeight?: string;
  letterSpacing?: string;
}

export interface RoleTypographyConfig {
  fontFamily: SupportedFontFamily;
  sidebar: TypographyElementConfig;
  header: TypographyElementConfig;
  pageTitle: TypographyElementConfig;
  sectionTitle: TypographyElementConfig;
  body: TypographyElementConfig;
  button: TypographyElementConfig;
  table: TypographyElementConfig;
  form: TypographyElementConfig;
  modal: TypographyElementConfig;
  chatbot: TypographyElementConfig;
}

export interface RoleColorsConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  sidebarColor: string;
  sidebarTextColor: string;
  sidebarActiveColor: string;
  sidebarHoverColor: string;
  headerColor: string;
  headerTextColor: string;
  backgroundColor: string;
  cardBackground: string;
  buttonColor: string;
  buttonHoverColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  infoColor: string;
}

export type ButtonSizeMode = 'compact' | 'small' | 'medium' | 'large' | 'extra_large' | 'custom';

export interface ButtonCustomConfig {
  mode: ButtonSizeMode;
  height: number; // in px
  width?: string; // e.g. 'auto' or '100%'
  paddingX: number; // in px
  paddingY: number; // in px
  fontSize: number; // in px
  fontWeight: 500 | 600 | 700 | 800;
  borderRadius: number; // in px
  borderWidth: number; // in px
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverEffect: 'brightness' | 'scale' | 'glow' | 'none';
}

export type ModalPresetMode = 'small' | 'medium' | 'large' | 'full_screen' | 'custom';

export interface ModalCustomConfig {
  mode: ModalPresetMode;
  width: number; // in px
  maxWidth: string; // e.g. '90vw'
  maxHeight: string; // e.g. '90vh'
  padding: number; // in px
  borderRadius: number; // in px
  shadow: 'none' | 'md' | 'lg' | 'xl' | '2xl';
  headerHeight: number; // in px
}

export interface SidebarCustomConfig {
  width: number; // in px, default 288 or 320
  collapsedWidth: number; // in px, default 64
  mode: 'expanded' | 'collapsed' | 'auto';
  backgroundColor: string;
  textColor: string;
  activeColor: string;
  hoverColor: string;
  iconSize: number; // in px
  textSize: number; // in px
  logoSize: number; // in px
  menuSpacing: number; // in px
  sectionSpacing: number; // in px
  borderRadius: number; // in px
  showBorder: boolean;
}

export interface ViewLayoutConfig {
  contentWidth: 'full' | 'boxed' | 'contained';
  maxPageWidth: number; // in px, e.g. 1440, 1600, 1920
  cardWidth?: string;
  cardHeight?: string;
  tableRowHeight: number; // in px, default 48
  gridColumns: 1 | 2 | 3 | 4 | 6;
  chartHeight: number; // in px, default 320
  gisMapHeight: number; // in px, default 650
  headerHeight: number; // in px, default 64
  contentPadding: number; // in px, default 24
  sectionSpacing: number; // in px, default 20
  activeViewport: 'desktop' | 'tablet' | 'mobile';
}

export interface BackgroundCustomConfig {
  type: 'color' | 'gradient' | 'image' | 'pattern';
  color?: string;
  gradient?: string;
  imageUrl?: string;
  opacity: number; // 0 - 100
  blur: number; // 0 - 20 px
  overlayColor: string;
  overlayOpacity: number; // 0 - 100
  position: 'center' | 'top' | 'bottom';
  size: 'cover' | 'contain' | 'auto';
  repeat: 'no-repeat' | 'repeat';
  attachment: 'scroll' | 'fixed';
}

export interface TextCustomizationConfig {
  menuLabels: Record<string, string>;
  pageTitles: Record<string, string>;
  sectionTitles: Record<string, string>;
  buttonLabels: Record<string, string>;
  helperTexts: Record<string, string>;
  emptyStateMessages: Record<string, string>;
  dashboardDescription?: string;
}

export interface RoleFeatureVisibilityConfig {
  dashboard: boolean;
  gis: boolean;
  records: boolean;
  certificate: boolean;
  takeoff: boolean;
  biosecurity: boolean;
  asf_ordinance: boolean;
  messages: boolean;
  barangays: boolean;
  account: boolean;
  marketing_alerts?: boolean;
}

export interface RoleVisualConfig {
  role: 'admin' | 'focal' | 'agent';
  colors: RoleColorsConfig;
  typography: RoleTypographyConfig;
  buttons: ButtonCustomConfig;
  modals: ModalCustomConfig;
  sidebar: SidebarCustomConfig;
  layout: ViewLayoutConfig;
  background: BackgroundCustomConfig;
  text: TextCustomizationConfig;
  features: RoleFeatureVisibilityConfig;
}

export interface GlobalBrandingConfig {
  municipalLogoUrl?: string;
  systemLogoUrl?: string;
  headerLogoUrl?: string;
  sidebarLogoUrl?: string;
  loginLogoUrl?: string;
  chatbotAvatarUrl?: string;
  faviconUrl?: string;
  logoWidth: number;
  logoHeight: number;
  logoPosition: 'left' | 'center';
  logoShape: 'circle' | 'rounded' | 'square';
}

export interface ChatbotCustomConfig {
  name: string;
  subtitle: string;
  avatarUrl?: string;
  themeColor: string;
  width: number; // in px, default 420
  height: number; // in px, default 560
  fontSize: number; // in px, default 12
  welcomeMessage?: string;
  quickQuestions: string[];
}

export interface MasterSystemConfig {
  version: number;
  updatedAt: string;
  updatedBy: string;
  roles: {
    admin: RoleVisualConfig;
    focal: RoleVisualConfig;
    agent: RoleVisualConfig;
  };
  globalBranding: GlobalBrandingConfig;
  chatbotConfig: ChatbotCustomConfig;
}

export interface ConfigAuditLogEntry {
  id: string;
  who: string;
  what: string;
  oldValue: any;
  newValue: any;
  targetRole: string;
  targetPage?: string;
  targetComponent?: string;
  targetProperty?: string;
  timestamp: string;
}

export interface ConfigVersionEntry {
  version: number;
  publishedAt: string;
  publishedBy: string;
  summary: string;
  snapshot: MasterSystemConfig;
}

export interface ProposedConfigChange {
  id: string;
  targetRole: 'admin' | 'focal' | 'agent' | 'all';
  category: 'color' | 'typography' | 'button' | 'modal' | 'sidebar' | 'layout' | 'background' | 'branding' | 'text' | 'feature' | 'chatbot';
  property: string;
  subProperty?: string;
  currentValue: any;
  proposedValue: any;
  description: string;
  status: 'pending' | 'applied' | 'rejected';
}

