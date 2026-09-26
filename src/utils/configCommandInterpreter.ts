import { MasterSystemConfig, ProposedConfigChange, SupportedFontFamily } from '../types/masterConfig';

const COLOR_MAP: Record<string, string> = {
  blue: '#2563eb',
  'dark blue': '#1e3a8a',
  'navy blue': '#0f172a',
  green: '#16a34a',
  'dark green': '#003C2F',
  emerald: '#059669',
  teal: '#0d9488',
  red: '#dc2626',
  'dark red': '#991b1b',
  amber: '#d97706',
  orange: '#ea580c',
  yellow: '#eab308',
  purple: '#9333ea',
  violet: '#7c3aed',
  slate: '#475569',
  gray: '#6b7280',
  'light gray': '#f1f5f9',
  white: '#ffffff',
  black: '#000000',
  dark: '#0f172a',
};

const FONT_CHOICES: SupportedFontFamily[] = [
  'Inter',
  'Roboto',
  'Poppins',
  'Montserrat',
  'Open Sans',
  'Nunito',
  'System Default',
];

export interface InterpretResult {
  isConfigCommand: boolean;
  isSecurityViolation?: boolean;
  securityMessage?: string;
  proposedChange?: ProposedConfigChange;
  previewMessage?: string;
}

/**
 * Interprets natural language Super Admin configuration requests.
 */
export function interpretSuperAdminConfigCommand(
  query: string,
  config: MasterSystemConfig
): InterpretResult {
  const lower = query.toLowerCase().trim();

  // 1. Strict Security Defense - NEVER modify secrets, passwords, tokens, DB credentials via chatbot
  const hasSecurityKeywords =
    lower.includes('password') ||
    lower.includes('api key') ||
    lower.includes('apikey') ||
    lower.includes('token') ||
    lower.includes('secret') ||
    lower.includes('database password') ||
    lower.includes('sql credentials') ||
    lower.includes('privilege escalation') ||
    lower.includes('bypass');

  if (hasSecurityKeywords) {
    return {
      isConfigCommand: true,
      isSecurityViolation: true,
      securityMessage: `🔒 **Security Protection Notice**: The Super Admin Configuration Assistant is strictly restricted from altering database passwords, API secret tokens, authentication protocols, or system security credentials via chat commands. Please use **API Configuration**, **Database Configuration**, or **User Accounts** for sensitive credentials.`,
    };
  }

  // Determine target role: default to 'admin' unless focal or agent is mentioned
  let targetRole: 'admin' | 'focal' | 'agent' | 'all' = 'admin';
  if (lower.includes('focal') || lower.includes('focal person')) {
    targetRole = 'focal';
  } else if (lower.includes('agent') || lower.includes('buyer') || lower.includes('trader')) {
    targetRole = 'agent';
  } else if (lower.includes('all roles') || lower.includes('system-wide') || lower.includes('everyone')) {
    targetRole = 'all';
  }

  const roleConfig = targetRole === 'all' ? config.roles.admin : config.roles[targetRole];

  // 2. SIDEBAR COLOR: "Change Admin sidebar to blue", "Change the Admin sidebar color to dark green", etc.
  if (lower.includes('sidebar') && (lower.includes('color') || Object.keys(COLOR_MAP).some(c => lower.includes(c)))) {
    let matchedColor = '#003C2F';
    let colorName = 'Dark Green';

    for (const [name, hex] of Object.entries(COLOR_MAP).sort((a, b) => b[0].length - a[0].length)) {
      if (lower.includes(name)) {
        matchedColor = hex;
        colorName = name.charAt(0).toUpperCase() + name.slice(1);
        break;
      }
    }

    // Direct hex check
    const hexMatch = lower.match(/#(?:[0-9a-f]{3}){1,2}\b/i);
    if (hexMatch) {
      matchedColor = hexMatch[0];
      colorName = hexMatch[0];
    }

    const currentVal = roleConfig.sidebar?.backgroundColor || roleConfig.colors?.sidebarColor || '#003C2F';
    const roleLabel = targetRole.toUpperCase();

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole,
        category: 'sidebar',
        property: 'backgroundColor',
        currentValue: currentVal,
        proposedValue: matchedColor,
        description: `Change ${roleLabel} sidebar color to ${colorName}`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleLabel} Sidebar Background Color\n• **Current Value**: \`${currentVal}\`\n• **Proposed Value**: \`${matchedColor}\` (${colorName})\n\nWould you like to preview and apply this change?`,
    };
  }

  // 3. TYPOGRAPHY / FONT: "Set Focal Person font to Poppins", "Change the Focal Person font to Inter", etc.
  if (lower.includes('font') || FONT_CHOICES.some(f => lower.includes(f.toLowerCase()))) {
    let matchedFont: SupportedFontFamily = 'Inter';
    for (const f of FONT_CHOICES) {
      if (lower.includes(f.toLowerCase())) {
        matchedFont = f;
        break;
      }
    }

    const currentVal = roleConfig.typography?.fontFamily || 'Inter';
    const roleLabel = targetRole.toUpperCase();

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole,
        category: 'typography',
        property: 'fontFamily',
        currentValue: currentVal,
        proposedValue: matchedFont,
        description: `Set ${roleLabel} font family to ${matchedFont}`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleLabel} Typography\n• **Current Font**: \`${currentVal}\`\n• **Proposed Font**: \`${matchedFont}\`\n\nWould you like to preview and apply this change?`,
    };
  }

  // 4. BUTTON SIZE: "Make Agent buttons 48 pixels high", "Increase the button size", etc.
  if (lower.includes('button')) {
    let targetHeight = 44;
    const pxMatch = lower.match(/(\d+)\s*(?:px|pixels?)/);
    if (pxMatch) {
      targetHeight = parseInt(pxMatch[1], 10);
    } else if (lower.includes('larger') || lower.includes('increase') || lower.includes('big')) {
      targetHeight = Math.min(56, (roleConfig.buttons?.height || 42) + 4);
    } else if (lower.includes('smaller') || lower.includes('decrease') || lower.includes('compact')) {
      targetHeight = Math.max(34, (roleConfig.buttons?.height || 42) - 4);
    }

    const currentVal = `${roleConfig.buttons?.height || 42}px`;
    const roleLabel = targetRole.toUpperCase();

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole,
        category: 'button',
        property: 'height',
        currentValue: currentVal,
        proposedValue: targetHeight,
        description: `Set ${roleLabel} button height to ${targetHeight}px`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleLabel} Primary Buttons\n• **Current Height**: \`${currentVal}\`\n• **Proposed Height**: \`${targetHeight}px\`\n\nWould you like to preview and apply this change?`,
    };
  }

  // 5. POPUP / MODAL WIDTH: "Increase Admin popup width to 800px", "Change the Ready for Take-Off popup width", etc.
  if (lower.includes('popup') || lower.includes('modal')) {
    let targetWidth = 720;
    const pxMatch = lower.match(/(\d+)\s*(?:px|pixels?)/);
    if (pxMatch) {
      targetWidth = parseInt(pxMatch[1], 10);
    } else if (lower.includes('larger') || lower.includes('increase') || lower.includes('wider')) {
      targetWidth = Math.min(1000, (roleConfig.modals?.width || 680) + 100);
    } else if (lower.includes('smaller') || lower.includes('narrower')) {
      targetWidth = Math.max(480, (roleConfig.modals?.width || 680) - 100);
    }

    const currentVal = `${roleConfig.modals?.width || 680}px`;
    const roleLabel = targetRole.toUpperCase();

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole,
        category: 'modal',
        property: 'width',
        currentValue: currentVal,
        proposedValue: targetWidth,
        description: `Set ${roleLabel} popup/modal width to ${targetWidth}px`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleLabel} Dialog & Modal Windows\n• **Current Width**: \`${currentVal}\`\n• **Proposed Width**: \`${targetWidth}px\`\n\nWould you like to preview and apply this change?`,
    };
  }

  // 6. GIS MAP HEIGHT: "Make the GIS map 700px tall", "Make the GIS map larger", etc.
  if (lower.includes('gis') && (lower.includes('tall') || lower.includes('height') || lower.includes('large') || lower.includes('size'))) {
    let targetHeight = 700;
    const pxMatch = lower.match(/(\d+)\s*(?:px|pixels?)/);
    if (pxMatch) {
      targetHeight = parseInt(pxMatch[1], 10);
    }

    const currentVal = `${roleConfig.layout?.gisMapHeight || 650}px`;
    const roleLabel = targetRole.toUpperCase();

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole,
        category: 'layout',
        property: 'gisMapHeight',
        currentValue: currentVal,
        proposedValue: targetHeight,
        description: `Set ${roleLabel} GIS map height to ${targetHeight}px`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleLabel} GIS Map Container Height\n• **Current Height**: \`${currentVal}\`\n• **Proposed Height**: \`${targetHeight}px\`\n\nWould you like to preview and apply this change?`,
    };
  }

  // 7. DASHBOARD CARDS: "Make the Admin dashboard cards smaller", etc.
  if (lower.includes('card') || lower.includes('dashboard card')) {
    const isSmaller = lower.includes('small') || lower.includes('compact') || lower.includes('decrease');
    const targetSpacing = isSmaller ? 12 : 24;
    const currentVal = `${roleConfig.layout?.sectionSpacing || 20}px`;
    const roleLabel = targetRole.toUpperCase();

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole,
        category: 'layout',
        property: 'sectionSpacing',
        currentValue: currentVal,
        proposedValue: targetSpacing,
        description: `Set ${roleLabel} dashboard card spacing to ${targetSpacing}px (${isSmaller ? 'Compact' : 'Spacious'})`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleLabel} Dashboard Card Layout\n• **Current Spacing**: \`${currentVal}\`\n• **Proposed Spacing**: \`${targetSpacing}px\`\n\nWould you like to preview and apply this change?`,
    };
  }

  // 8. BACKGROUND: "Make the Agent dashboard background light gray", "Change Admin dashboard background"
  if (lower.includes('background') && !lower.includes('sidebar')) {
    let matchedColor = '#F4F7F9';
    let colorName = 'Light Slate';

    for (const [name, hex] of Object.entries(COLOR_MAP).sort((a, b) => b[0].length - a[0].length)) {
      if (lower.includes(name)) {
        matchedColor = hex;
        colorName = name.charAt(0).toUpperCase() + name.slice(1);
        break;
      }
    }

    const currentVal = roleConfig.background?.color || '#F4F7F9';
    const roleLabel = targetRole.toUpperCase();

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole,
        category: 'background',
        property: 'color',
        currentValue: currentVal,
        proposedValue: matchedColor,
        description: `Change ${roleLabel} background to ${colorName}`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleLabel} Viewport Background Color\n• **Current Value**: \`${currentVal}\`\n• **Proposed Value**: \`${matchedColor}\` (${colorName})\n\nWould you like to preview and apply this change?`,
    };
  }

  // 9. TEXT CUSTOMIZATION: "Change the text of Swine Records to Livestock Registry", "Change the dashboard title"
  if (lower.includes('text of') || lower.includes('rename') || lower.includes('change title') || lower.includes('change the dashboard title')) {
    let targetMenu = 'records';
    let newLabel = 'Livestock Registry';

    if (lower.includes('swine records')) {
      targetMenu = 'records';
      const toMatch = query.match(/to\s+["']?([^"']+)["']?$/i);
      newLabel = toMatch ? toMatch[1].trim() : 'Livestock Registry';
    } else if (lower.includes('ready for take-off') || lower.includes('takeoff')) {
      targetMenu = 'takeoff';
      const toMatch = query.match(/to\s+["']?([^"']+)["']?$/i);
      newLabel = toMatch ? toMatch[1].trim() : 'Livestock Clearance';
    } else if (lower.includes('dashboard')) {
      targetMenu = 'dashboard';
      const toMatch = query.match(/to\s+["']?([^"']+)["']?$/i);
      newLabel = toMatch ? toMatch[1].trim() : 'Municipal Swine Command Center';
    }

    const currentVal = roleConfig.text?.menuLabels?.[targetMenu] || targetMenu;
    const roleLabel = targetRole.toUpperCase();

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole,
        category: 'text',
        property: 'menuLabels',
        subProperty: targetMenu,
        currentValue: currentVal,
        proposedValue: newLabel,
        description: `Rename ${roleLabel} ${targetMenu} label to "${newLabel}"`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleLabel} Navigation Label (${targetMenu})\n• **Current Label**: "${currentVal}"\n• **Proposed Label**: "${newLabel}"\n\nWould you like to preview and apply this change?`,
    };
  }

  // 10. CHATBOT CONFIGURATION: "Change the chatbot popup width", "Make the chatbot smaller", "Change the chatbot avatar"
  if (lower.includes('chatbot') && (lower.includes('width') || lower.includes('smaller') || lower.includes('larger') || lower.includes('avatar') || lower.includes('size'))) {
    if (lower.includes('avatar')) {
      const currentVal = config.chatbotConfig?.avatarUrl || 'System Logo';
      const newVal = '/icon.svg';

      return {
        isConfigCommand: true,
        proposedChange: {
          id: `prop-${Date.now()}`,
          targetRole: 'all',
          category: 'chatbot',
          property: 'avatarUrl',
          currentValue: currentVal,
          proposedValue: newVal,
          description: 'Update Chatbot Assistant avatar icon',
          status: 'pending',
        },
        previewMessage: `**Proposed Configuration Change**:\n• **Target**: Chatbot Assistant Avatar\n• **Current Value**: \`${currentVal}\`\n• **Proposed Value**: \`${newVal}\`\n\nWould you like to preview and apply this change?`,
      };
    }

    let targetWidth = 420;
    const pxMatch = lower.match(/(\d+)\s*(?:px|pixels?)/);
    if (pxMatch) {
      targetWidth = parseInt(pxMatch[1], 10);
    } else if (lower.includes('smaller')) {
      targetWidth = 380;
    } else if (lower.includes('larger') || lower.includes('increase')) {
      targetWidth = 480;
    }

    const currentVal = `${config.chatbotConfig?.width || 420}px`;

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole: 'all',
        category: 'chatbot',
        property: 'width',
        currentValue: currentVal,
        proposedValue: targetWidth,
        description: `Set Chatbot window width to ${targetWidth}px`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: Chatbot Window Dimensions\n• **Current Width**: \`${currentVal}\`\n• **Proposed Width**: \`${targetWidth}px\`\n\nWould you like to preview and apply this change?`,
    };
  }

  // 11. FEATURE VISIBILITY: "Hide the Reports menu from Agent", "Show GIS Swine Map for Focal Person"
  if (lower.includes('hide') || lower.includes('show')) {
    const isHide = lower.includes('hide');
    let targetFeature = 'certificate';
    let featureName = 'Print Official Reports';

    if (lower.includes('report') || lower.includes('certificate')) {
      targetFeature = 'certificate';
      featureName = 'Print Official Reports';
    } else if (lower.includes('gis') || lower.includes('map')) {
      targetFeature = 'gis';
      featureName = 'GIS Swine Map';
    } else if (lower.includes('biosecurity')) {
      targetFeature = 'biosecurity';
      featureName = 'Barangay Biosecurity';
    } else if (lower.includes('takeoff') || lower.includes('ready for take-off')) {
      targetFeature = 'takeoff';
      featureName = 'Ready for Take-Off';
    }

    const roleKey: 'admin' | 'focal' | 'agent' = targetRole === 'all' ? 'agent' : targetRole;
    const currentVal = config.roles[roleKey]?.features?.[targetFeature as keyof typeof config.roles.admin.features] ? 'Visible' : 'Hidden';
    const newVal = !isHide;

    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole: roleKey,
        category: 'feature',
        property: targetFeature,
        currentValue: currentVal,
        proposedValue: newVal,
        description: `${isHide ? 'Hide' : 'Show'} ${featureName} in ${roleKey.toUpperCase()} menu`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleKey.toUpperCase()} Feature Visibility\n• **Feature**: ${featureName}\n• **Current State**: ${currentVal}\n• **Proposed State**: ${isHide ? 'Hidden (Disabled in Navigation)' : 'Visible (Enabled in Navigation)'}\n\n*Note: Interface visibility adjustments do not override backend authorization.* Would you like to preview and apply this change?`,
    };
  }

  // 12. RESET TO DEFAULT: "Reset Admin appearance", "Reset Focal appearance"
  if (lower.includes('reset') && (lower.includes('appearance') || lower.includes('theme') || lower.includes('default'))) {
    const roleLabel = targetRole.toUpperCase();
    return {
      isConfigCommand: true,
      proposedChange: {
        id: `prop-${Date.now()}`,
        targetRole,
        category: 'color',
        property: 'reset',
        currentValue: 'Custom Values',
        proposedValue: 'Factory Defaults',
        description: `Reset ${roleLabel} visual appearance to factory defaults`,
        status: 'pending',
      },
      previewMessage: `**Proposed Configuration Change**:\n• **Target**: ${roleLabel} Visual Theme & Appearance\n• **Action**: Restore Factory Default Colors, Typography, Buttons, and Layout\n\nWould you like to reset ${roleLabel} to system default settings?`,
    };
  }

  return { isConfigCommand: false };
}

