import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Sparkles,
  Bot,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  RotateCcw,
  Sliders,
  Palette,
  Check,
  GripHorizontal,
} from 'lucide-react';
import { Barangay, SwineRecord, UserAccount, UserRole } from '../../types';
import {
  assistantService,
  ChatMessage,
  PUBLIC_ASSISTANT_SUGGESTIONS,
} from '../../services/assistantService';
import { ProposedConfigChange } from '../../types/masterConfig';
import { masterConfigService } from '../../services/masterConfigService';
import { useOfficialLogos } from '../common/OfficialSeals';

interface BiosecurityAssistantProps {
  currentUser: UserAccount | null;
  currentRole: UserRole | 'landing';
  onNavigateTab: (tab: string) => void;
  swineList: SwineRecord[];
  barangays: Barangay[];
  onRefresh?: () => void;
  onOpenLogin?: () => void;
}

export const BiosecurityAssistant: React.FC<BiosecurityAssistantProps> = ({
  currentUser,
  currentRole,
  onNavigateTab,
  swineList,
  barangays,
  onRefresh,
  onOpenLogin,
}) => {
  const isPublicMode = currentRole === 'landing' || !currentUser;
  const isSuperAdmin = currentRole === 'super_admin' || currentUser?.role === 'super_admin';
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    prompt: string;
    actionId: string;
    tab?: string;
    payload?: any;
  } | null>(null);
  const [pendingProposedChange, setPendingProposedChange] = useState<ProposedConfigChange | null>(null);

  const logos = useOfficialLogos();
  const assistantLogo =
    logos['logo-system'] ||
    logos['logo-header'] ||
    logos['logo-da'] ||
    '/icon.svg';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Movable / draggable state with sessionStorage persistence
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = sessionStorage.getItem('da_assistant_pos_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; panelLeft: number; panelTop: number; pointerId: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Keep assistant panel clamped within viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return null;
        const panel = panelRef.current;
        const panelWidth = panel?.offsetWidth || 440;
        const panelHeight = panel?.offsetHeight || (isMinimized ? 60 : 580);
        const maxX = Math.max(8, window.innerWidth - panelWidth - 8);
        const maxY = Math.max(8, window.innerHeight - panelHeight - 8);
        const clampedX = Math.max(8, Math.min(maxX, prev.x));
        const clampedY = Math.max(8, Math.min(maxY, prev.y));
        if (clampedX !== prev.x || clampedY !== prev.y) {
          const next = { x: clampedX, y: clampedY };
          try {
            sessionStorage.setItem('da_assistant_pos_v1', JSON.stringify(next));
          } catch (e) {}
          return next;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panelLeft: rect.left,
      panelTop: rect.top,
      pointerId: e.pointerId,
    };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
    }

    if (hasMovedRef.current) {
      const panel = panelRef.current;
      const panelWidth = panel?.offsetWidth || 440;
      const panelHeight = panel?.offsetHeight || (isMinimized ? 60 : 580);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const rawX = dragStartRef.current.panelLeft + dx;
      const rawY = dragStartRef.current.panelTop + dy;

      const clampedX = Math.max(8, Math.min(viewportWidth - panelWidth - 8, rawX));
      const clampedY = Math.max(8, Math.min(viewportHeight - panelHeight - 8, rawY));

      const newPos = { x: Math.round(clampedX), y: Math.round(clampedY) };
      setPosition(newPos);
      try {
        sessionStorage.setItem('da_assistant_pos_v1', JSON.stringify(newPos));
      } catch (err) {}
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}

    const didMove = hasMovedRef.current;
    isDraggingRef.current = false;
    dragStartRef.current = null;

    if (!didMove) {
      const target = e.target as HTMLElement;
      if (!target.closest('button')) {
        setIsMinimized(prev => !prev);
      }
    }
  };

  const getInitialWelcomeMessage = (): ChatMessage => {
    if (isPublicMode) {
      return {
        id: 'msg-welcome-public',
        sender: 'assistant',
        text: `👋 Welcome to the **DA Hinunangan Public Information Portal**! I am the **DA Hinunangan Public Information Assistant**.

I can answer publicly available questions regarding:
• **Swine Registry & Guidelines**: How to register your swine and official requirements.
• **Municipal Programs & Services**: Free ear tagging, veterinary outreach, and biosecurity kits.
• **African Swine Fever (ASF)**: Prevention measures, swill feeding prohibition, and zoning.
• **Barangays & Office Contacts**: Office telephone, emergency hotline, and focal person coordination.

*Note: Personal registry records, individual swine data, and internal GIS coordinates are restricted to authorized personnel. Authorized officers may sign in via the portal.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: {
          type: 'open_login',
          label: 'Official Login',
        },
        suggestions: PUBLIC_ASSISTANT_SUGGESTIONS.slice(0, 4),
      };
    }

    if (isSuperAdmin) {
      return {
        id: 'msg-welcome-superadmin',
        sender: 'assistant',
        text: `👋 Greetings **${currentUser?.name || 'Super Admin'}**! I am the **DA Hinunangan Super Admin Configuration Assistant**.

As Super Administrator, you have full master configuration authority over the entire municipal platform, including Admin, Focal Person, and Agent interfaces.

You can configure features using natural language:
• *"Change the Admin sidebar color to dark green."*
• *"Set Focal Person font to Poppins."*
• *"Make Agent buttons 48 pixels high."*
• *"Increase Admin popup width to 800px."*
• *"Make the GIS map 700px tall."*
• *"Make the dashboard cards smaller."*
• *"Change the text of Swine Records to Livestock Registry."*
• *"Hide the Reports menu from Agent."*

Every command provides an interactive preview and requires your explicit confirmation before applying.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Change Admin sidebar to blue',
          'Set Focal Person font to Poppins',
          'Make Agent buttons 48 pixels high',
          'Increase Admin popup width to 800px',
        ],
      };
    }

    const assigned = currentUser?.assignedBarangay;
    const roleSuggestions =
      currentRole === 'focal' && assigned
        ? [
            `Show records for ${assigned}`,
            `How many ready to sell in ${assigned}?`,
            'Register a new swine',
            'Open GIS Swine Map',
          ]
        : currentRole === 'agent'
        ? [
            'How many swine are ready to sell?',
            'View Ready for Take-Off catalog',
            'What are the transport requirements?',
          ]
        : [
            "Show today's registry status",
            'How many swine are ready to sell?',
            'How do I register a swine?',
            'Open GIS Swine Map',
          ];

    return {
      id: 'msg-welcome-auth',
      sender: 'assistant',
      text: `👋 Hello${currentUser?.name ? ` **${currentUser.name}**` : ''}! I am the **DA Hinunangan Biosecurity & Registry Assistant**.

I am connected to your live municipal swine database, GIS coordinates, ASF risk zoning, and official livestock reports. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: roleSuggestions,
    };
  };

  // Initial welcome message based on mode
  const [messages, setMessages] = useState<ChatMessage[]>(() => [getInitialWelcomeMessage()]);

  // Update welcome message if authentication state changes and user hasn't started a custom chat
  useEffect(() => {
    if (!hasInteracted) {
      setMessages([getInitialWelcomeMessage()]);
    }
  }, [currentRole, currentUser, isPublicMode]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, isMinimized]);

  // Keyboard shortcut: Escape to close/minimize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (!isMinimized) {
          setIsMinimized(true);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setHasInteracted(true);
    setInputMessage('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await assistantService.askAssistant(
        text,
        currentUser,
        currentRole,
        messages.slice(-6).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }))
      );

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: response.action,
        suggestions: response.suggestions || (isPublicMode ? PUBLIC_ASSISTANT_SUGGESTIONS.slice(0, 3) : []),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If action is confirmation
      if (response.action?.type === 'confirm_action') {
        setPendingConfirmation({
          prompt: response.reply,
          actionId: response.action.actionId || 'action',
          tab: response.action.tab,
          payload: response.action.payload,
        });
      } else if (response.action?.type === 'confirm_config_change' && response.action.payload) {
        setPendingProposedChange(response.action.payload as ProposedConfigChange);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'assistant',
          text: "I couldn't retrieve the live registry data right now. Please check **Swine Records** directly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: { type: 'navigate', tab: 'records', label: 'Open Swine Records' },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmConfigChange = async (confirmed: boolean) => {
    if (!pendingProposedChange) return;

    if (confirmed) {
      setIsLoading(true);
      const success = await masterConfigService.applyProposedChange(
        pendingProposedChange,
        currentUser?.name || 'Super Admin'
      );
      setIsLoading(false);

      if (success) {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}-config-success`,
            sender: 'assistant',
            text: `✅ **Configuration Applied & Published Successfully!**\n• ${pendingProposedChange.description}\n• Changes are now live across the system canvas without requiring page reloads.\n• Recorded in Master Configuration Audit Logs.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: [
              'Change Admin sidebar to blue',
              'Set Focal Person font to Poppins',
              'Reset Admin appearance',
              "Show today's registry status",
            ],
          },
        ]);
        if (onRefresh) onRefresh();
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}-config-err`,
            sender: 'assistant',
            text: '⚠️ An error occurred while applying the configuration change. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-config-cancelled`,
          sender: 'assistant',
          text: `Configuration change discarded: "${pendingProposedChange.description}". No modifications were applied.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    setPendingProposedChange(null);
  };

  const handleActionClick = (action: ChatMessage['action']) => {
    if (!action) return;
    if (action.type === 'open_login') {
      if (onOpenLogin) {
        onOpenLogin();
      }
      if (window.innerWidth < 768) {
        setIsMinimized(true);
      }
      return;
    }
    if (action.type === 'navigate' && action.tab) {
      onNavigateTab(action.tab);
      // On mobile screens, minimize chat so viewport is visible
      if (window.innerWidth < 768) {
        setIsMinimized(true);
      }
    }
  };

  const handleConfirmAction = (confirmed: boolean) => {
    if (!pendingConfirmation) return;

    if (confirmed) {
      if (pendingConfirmation.tab) {
        onNavigateTab(pendingConfirmation.tab);
      }
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-confirmed`,
          sender: 'assistant',
          text: '✓ Action acknowledged. Navigating to module for authorization.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-cancelled`,
          sender: 'assistant',
          text: 'Action cancelled. No changes were made to the municipal registry.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    setPendingConfirmation(null);
  };

  // Helper formatting for markdown bolding and bullet lists
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bullet list
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      // Numbered list
      const isNumbered = /^\d+\.\s/.test(line.trim());

      // Parse bold **text**
      const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

      return (
        <div
          key={idx}
          className={`${idx > 0 && !isBullet && !isNumbered ? 'mt-1.5' : ''} ${
            isBullet || isNumbered ? 'pl-2 text-stone-700 leading-relaxed' : 'text-stone-800'
          }`}
        >
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-emerald-950">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code
                  key={pIdx}
                  className="px-1 py-0.5 rounded-md bg-stone-100 border border-stone-200 font-mono text-[11px] text-emerald-800"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING BOTTOM-RIGHT TRIGGER BUTTON
      ───────────────────────────────────────────────────────────── */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            aria-label={
              isPublicMode
                ? 'Open DA Hinunangan Public Information Assistant'
                : isSuperAdmin
                ? 'Open DA Hinunangan Super Admin Configuration Assistant'
                : 'Open DA Hinunangan Biosecurity Assistant'
            }
            title={
              isPublicMode
                ? 'DA Hinunangan Public Information Assistant'
                : isSuperAdmin
                ? 'DA Hinunangan Super Admin Configuration Assistant'
                : 'DA Hinunangan Biosecurity Assistant'
            }
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl border-2 border-emerald-500/30 transition transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-hidden focus:ring-4 focus:ring-emerald-500/30"
          >
            {/* Animated Beacon Ping */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
            </span>

            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center p-0.5 shrink-0">
              <img
                src={assistantLogo}
                alt="Assistant Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <div className="flex flex-col text-left leading-none">
              <span className="text-[12px] font-black tracking-tight text-white flex items-center gap-1">
                <span>{isPublicMode ? 'Public Assistant' : isSuperAdmin ? 'Configuration Assistant' : 'Biosecurity Assistant'}</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </span>
              <span className="text-[9.5px] font-medium text-emerald-200/90 mt-0.5">
                {isPublicMode ? '● Municipal Portal AI' : isSuperAdmin ? '● Master Control AI' : '● Live Registry AI'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. EXPANDED / MINIMIZED CHAT PANEL
      ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <aside
          ref={panelRef}
          aria-label={
            isPublicMode
              ? 'DA Hinunangan Public Information Assistant Panel'
              : isSuperAdmin
              ? 'DA Hinunangan Super Admin Configuration Assistant Panel'
              : 'DA Hinunangan Biosecurity Assistant Panel'
          }
          className={`fixed z-40 w-[94vw] sm:w-[440px] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden transition-[height] duration-200 ease-in-out ${
            position ? '' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'
          } ${
            isMinimized ? 'h-14 sm:h-16' : 'h-[580px] max-h-[85vh]'
          }`}
          style={{
            ...(position
              ? {
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  bottom: 'auto',
                  right: 'auto',
                }
              : {}),
            boxShadow: '0 20px 50px -10px rgba(6, 78, 59, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
            touchAction: 'none',
          }}
        >
          {/* Header Bar (Draggable handle with pointer events) */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-3.5 sm:p-4 flex items-center justify-between gap-2.5 shrink-0 select-none shadow-xs cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reposition or click to toggle panel"
          >
            <div
              className="flex items-center gap-2.5 min-w-0 flex-1 group pointer-events-none"
            >
              <GripHorizontal className="w-3.5 h-3.5 text-emerald-400/70 shrink-0" />
              <div className="relative shrink-0">
                <img
                  src={assistantLogo}
                  alt="DA Seal"
                  className="w-9 h-9 rounded-xl object-contain bg-white/10 p-1 border border-emerald-400/40 shadow-inner group-hover:scale-105 transition"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-emerald-950 rounded-full"></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[13.5px] font-black tracking-tight text-white truncate">
                    DA Hinunangan
                  </h2>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isPublicMode ? 'Public Info' : isSuperAdmin ? 'Super Admin' : 'Live'}
                  </span>
                </div>
                <p className="text-[10.5px] text-emerald-200/90 font-medium truncate flex items-center gap-1">
                  <span>{isPublicMode ? 'Public Information Assistant' : isSuperAdmin ? 'Super Admin Configuration Assistant' : 'Biosecurity & Registry Assistant'}</span>
                  <span>•</span>
                  <span className="text-emerald-300">● Online</span>
                </p>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsMinimized(prev => !prev)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label={isMinimized ? 'Expand assistant' : 'Minimize assistant'}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Close assistant"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body & Conversation Area (Visible when not minimized) */}
          {!isMinimized && (
            <>
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/80 custom-sidebar-scroll text-xs">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    } animate-in fade-in duration-200`}
                  >
                    <div className="flex items-end gap-2 max-w-[88%]">
                      {msg.sender === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 mb-1 shadow-2xs">
                          <Bot className="w-3.5 h-3.5 text-emerald-200" />
                        </div>
                      )}

                      <div
                        className={`p-3 rounded-2xl shadow-xs leading-relaxed text-[12px] ${
                          msg.sender === 'user'
                            ? 'bg-emerald-800 text-white rounded-br-xs'
                            : 'bg-white text-stone-900 border border-stone-200/90 rounded-bl-xs'
                        }`}
                      >
                        {msg.sender === 'assistant' ? (
                          renderFormattedText(msg.text)
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}

                        {/* Embedded Action Button (Navigation or Official Login) */}
                        {msg.action && (msg.action.type === 'open_login' || (msg.action.type === 'navigate' && msg.action.tab)) && (
                          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center">
                            <button
                              type="button"
                              onClick={() => handleActionClick(msg.action)}
                              className="w-full py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                            >
                              <span>{msg.action.label || (msg.action.type === 'open_login' ? 'Official Login' : 'Open Module')}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[9.5px] text-stone-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>

                    {/* Follow-up Quick Suggestions (if attached to assistant message) */}
                    {msg.suggestions && msg.suggestions.length > 0 && msg.id === messages[messages.length - 1].id && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pl-8 max-w-full">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSendMessage(sug)}
                            className="text-[10.5px] px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold transition cursor-pointer text-left shadow-2xs hover:border-emerald-300"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Animated Typing Indicator */}
                {isLoading && (
                  <div className="flex items-end gap-2 animate-in fade-in">
                    <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 mb-1">
                      <Bot className="w-3.5 h-3.5 text-emerald-200" />
                    </div>
                    <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-xs p-3 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sensitive Action Confirmation Dialog */}
                {pendingConfirmation && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 animate-in zoom-in-95">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold leading-snug">
                        Confirmation Required: Would you like to proceed with this operation?
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConfirmAction(false)}
                        className="px-3 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-[11px] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmAction(true)}
                        className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] cursor-pointer shadow-xs"
                      >
                        Confirm & Proceed
                      </button>
                    </div>
                  </div>
                )}

                {/* Super Admin Proposed Configuration Change Card */}
                {pendingProposedChange && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white border-2 border-emerald-400/50 shadow-2xl space-y-3 animate-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                          Configuration Proposed Change
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                        {pendingProposedChange.targetRole.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white/90 leading-snug">
                      {pendingProposedChange.description}
                    </p>

                    {/* Current vs Proposed Visual Metrics Box */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-white/60">Current Value</span>
                        <div className="flex items-center gap-2 truncate font-mono text-[11px]">
                          {String(pendingProposedChange.currentValue).startsWith('#') && (
                            <span
                              className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                              style={{ backgroundColor: String(pendingProposedChange.currentValue) }}
                            />
                          )}
                          <span className="truncate">{String(pendingProposedChange.currentValue)}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-300">Proposed Value</span>
                        <div className="flex items-center gap-2 truncate font-mono text-[11px] text-emerald-200 font-bold">
                          {String(pendingProposedChange.proposedValue).startsWith('#') && (
                            <span
                              className="w-4 h-4 rounded-full border border-white/60 shrink-0"
                              style={{ backgroundColor: String(pendingProposedChange.proposedValue) }}
                            />
                          )}
                          <span className="truncate">{String(pendingProposedChange.proposedValue)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2-Step Action Buttons: Cancel or Apply Change */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => handleConfirmConfigChange(false)}
                        className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] cursor-pointer transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmConfigChange(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-[11px] cursor-pointer transition shadow-md flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Change</span>
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Form & Action Bar */}
              <div className="p-3 bg-white border-t border-stone-200 shrink-0 space-y-2">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      placeholder={
                        isPublicMode
                          ? 'Ask about swine registration, requirements, ASF, contact...'
                          : 'Ask about swine registration, ASF, GIS, records...'
                      }
                      disabled={isLoading}
                      className="w-full pl-3.5 pr-3 py-2.5 rounded-2xl bg-stone-100/90 border border-stone-300 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-stone-900 placeholder:text-stone-400 outline-hidden transition font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm cursor-pointer shrink-0"
                    aria-label="Send query"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Footer Attribution & Role Context */}
                <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{isPublicMode ? 'Public Information Portal' : 'RBAC-Enforced'}</span>
                  </span>
                  <span>
                    {isPublicMode
                      ? 'Municipal Agriculture Office'
                      : `Role: ${currentRole === 'super_admin' ? 'Super Admin' : currentRole.toUpperCase()}${currentUser?.assignedBarangay ? ` (${currentUser.assignedBarangay})` : ''}`}
                  </span>
                </div>
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
};
