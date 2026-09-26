import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  Printer,
  FileText,
  Truck,
  Activity,
  MapPin,
  Calendar,
  Send,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
} from 'lucide-react';
import { Barangay, BarangayBiosecurityAudit, BiosecurityIncident, RiskLevel, SwineRecord, UserAccount } from '../../types';
import { storageService } from '../../services/storageService';

interface BarangayBiosecurityProps {
  barangays: Barangay[];
  currentUser: UserAccount | null;
  currentRole?: any;
  onRefresh: () => void | Promise<void>;
  onNavigateToGis?: () => void;
}

export const BarangayBiosecurity: React.FC<BarangayBiosecurityProps> = ({
  barangays,
  currentUser,
  currentRole,
  onRefresh,
  onNavigateToGis,
}) => {
  const [audits, setAudits] = useState<BarangayBiosecurityAudit[]>(() => storageService.getBiosecurityAudits());
  const [incidents, setIncidents] = useState<BiosecurityIncident[]>(() => storageService.getBiosecurityIncidents());

  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<'all' | RiskLevel>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'audits' | 'checkpoints' | 'incidents'>('audits');

  // Modal states
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);
  const [printingAudit, setPrintingAudit] = useState<BarangayBiosecurityAudit | null>(null);

  // Form states for New / Edit Audit
  const [auditForm, setAuditForm] = useState<Partial<BarangayBiosecurityAudit>>({
    barangay: barangays[0]?.name || 'Poblacion',
    auditDate: new Date().toISOString().split('T')[0],
    auditorName: currentUser?.name || 'Municipal Biosecurity Inspector',
    biosecurityLevel: 2,
    complianceScore: 85,
    footbathsOperational: true,
    vehicleDisinfectionStation: true,
    quarantineCheckpointActive: true,
    deadSwineDisposalFacility: true,
    swillFeedingBanEnforced: true,
    visitorLogCompliance: true,
    waterChlorination: true,
    perimeterFencingAudit: true,
    asfZone: 'green',
    status: 'compliant',
    notes: '',
  });

  // Form state for New Incident
  const [incidentForm, setIncidentForm] = useState<Partial<BiosecurityIncident>>({
    barangay: barangays[0]?.name || 'Poblacion',
    reportDate: new Date().toISOString().split('T')[0],
    type: 'suspected_symptoms',
    severity: 'medium',
    description: '',
    reportedBy: currentUser?.name || 'Barangay Focal Person',
    actionTaken: '',
    resolved: false,
  });

  // Form state for Quick Advisory Broadcast
  const [advisoryContent, setAdvisoryContent] = useState('');
  const [advisoryTarget, setAdvisoryTarget] = useState('all');
  const [advisoryPriority, setAdvisoryPriority] = useState<'normal' | 'advisory' | 'urgent'>('urgent');
  const [advisorySent, setAdvisorySent] = useState(false);

  // Recalculate score dynamically in audit form
  const calculateScore = (data: Partial<BarangayBiosecurityAudit>) => {
    const checklistItems = [
      data.footbathsOperational,
      data.vehicleDisinfectionStation,
      data.quarantineCheckpointActive,
      data.deadSwineDisposalFacility,
      data.swillFeedingBanEnforced,
      data.visitorLogCompliance,
      data.waterChlorination,
      data.perimeterFencingAudit,
    ];
    const trueCount = checklistItems.filter(Boolean).length;
    const score = Math.round((trueCount / checklistItems.length) * 100);
    let level: 1 | 2 | 3 = 1;
    if (score >= 90) level = 3;
    else if (score >= 70) level = 2;

    let status: 'compliant' | 'warning' | 'critical' = 'compliant';
    if (data.asfZone === 'red' || score < 60) status = 'critical';
    else if (data.asfZone === 'yellow' || score < 80) status = 'warning';

    return { score, level, status };
  };

  const handleAuditCheckbox = (field: keyof BarangayBiosecurityAudit, value: boolean) => {
    const updated = { ...auditForm, [field]: value };
    const { score, level, status } = calculateScore(updated);
    setAuditForm({ ...updated, complianceScore: score, biosecurityLevel: level, status });
  };

  const handleSaveAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditForm.barangay) return;

    const { score, level, status } = calculateScore(auditForm);
    const newAudit: BarangayBiosecurityAudit = {
      id: auditForm.id || `audit-${Date.now()}`,
      barangay: auditForm.barangay,
      auditDate: auditForm.auditDate || new Date().toISOString().split('T')[0],
      auditorName: auditForm.auditorName || currentUser?.name || 'MAO Biosecurity Officer',
      biosecurityLevel: level,
      complianceScore: score,
      footbathsOperational: !!auditForm.footbathsOperational,
      vehicleDisinfectionStation: !!auditForm.vehicleDisinfectionStation,
      quarantineCheckpointActive: !!auditForm.quarantineCheckpointActive,
      deadSwineDisposalFacility: !!auditForm.deadSwineDisposalFacility,
      swillFeedingBanEnforced: !!auditForm.swillFeedingBanEnforced,
      visitorLogCompliance: !!auditForm.visitorLogCompliance,
      waterChlorination: !!auditForm.waterChlorination,
      perimeterFencingAudit: !!auditForm.perimeterFencingAudit,
      asfZone: (auditForm.asfZone as RiskLevel) || 'green',
      status: status,
      notes: auditForm.notes || 'Routine biosecurity and biosurveillance audit conducted.',
      updatedAt: new Date().toISOString(),
    };

    storageService.saveBiosecurityAudit(newAudit);
    const updatedList = storageService.getBiosecurityAudits();
    setAudits(updatedList);
    setIsAuditModalOpen(false);
    onRefresh();
  };

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.barangay || !incidentForm.description) return;

    const newInc: BiosecurityIncident = {
      id: `inc-${Date.now()}`,
      barangay: incidentForm.barangay,
      reportDate: incidentForm.reportDate || new Date().toISOString().split('T')[0],
      type: incidentForm.type || 'suspected_symptoms',
      severity: incidentForm.severity || 'medium',
      description: incidentForm.description,
      reportedBy: incidentForm.reportedBy || currentUser?.name || 'Barangay Focal',
      actionTaken: incidentForm.actionTaken || 'Investigated by local veterinary team.',
      resolved: !!incidentForm.resolved,
      updatedAt: new Date().toISOString(),
    };

    storageService.addBiosecurityIncident(newInc);
    setIncidents(storageService.getBiosecurityIncidents());
    setIsIncidentModalOpen(false);
    onRefresh();
  };

  const handleSendAdvisory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryContent.trim()) return;

    storageService.addMessage({
      id: `msg-bio-${Date.now()}`,
      senderId: currentUser?.id || 'admin',
      senderName: currentUser?.name || 'Municipal Agriculture Office (MAO)',
      senderRole: 'admin',
      targetBarangay: advisoryTarget,
      title: `[BIOSECURITY ADVISORY] ${advisoryPriority === 'urgent' ? 'URGENT: ' : ''}Compliance Notice`,
      content: advisoryContent,
      priority: advisoryPriority,
      createdAt: new Date().toISOString(),
    });

    setAdvisorySent(true);
    setTimeout(() => {
      setAdvisorySent(false);
      setIsAdvisoryModalOpen(false);
      setAdvisoryContent('');
    }, 1500);
    onRefresh();
  };

  // Real Swine records from Supabase / storageService
  const [allSwineRecords, setAllSwineRecords] = useState<SwineRecord[]>(() =>
    storageService.getSwineRecords()
  );

  useEffect(() => {
    setAllSwineRecords(storageService.getSwineRecords());
  }, [barangays]);

  // Role-based barangay visibility:
  // Admin & Super Admin: All municipal barangays
  // Focal Person: Strictly assigned barangay
  // Agent: Permitted barangays only
  const authorizedBarangays = useMemo(() => {
    const role = (currentRole || currentUser?.role || '').toLowerCase();
    const isSuperAdmin = role === 'superadmin' || role === 'super_admin' || currentUser?.role === 'super_admin';
    const isAdmin = role === 'admin' || currentUser?.role === 'admin';

    if (isSuperAdmin || isAdmin) {
      return barangays;
    }

    if (role === 'focal' && currentUser?.assignedBarangay) {
      const assigned = currentUser.assignedBarangay.trim().toLowerCase();
      const matches = barangays.filter(
        b => b.name.toLowerCase() === assigned || b.id.toLowerCase() === assigned
      );
      return matches.length > 0 ? matches : barangays.filter(b => b.name.toLowerCase().includes(assigned));
    }

    if (role === 'agent' && currentUser?.assignedBarangay) {
      const assigned = currentUser.assignedBarangay.trim().toLowerCase();
      return barangays.filter(
        b => b.name.toLowerCase() === assigned || b.id.toLowerCase() === assigned
      );
    }

    return barangays;
  }, [barangays, currentRole, currentUser]);

  // Selected Barangay (collapsible by default for admin/superadmin, auto-selected for focal person)
  const [selectedBarangayId, setSelectedBarangayId] = useState<string | null>(() => {
    const role = (currentRole || currentUser?.role || '').toLowerCase();
    if (role === 'focal' && currentUser?.assignedBarangay) {
      const assigned = currentUser.assignedBarangay.trim().toLowerCase();
      const match = barangays.find(
        b => b.name.toLowerCase() === assigned || b.id.toLowerCase() === assigned
      );
      return match ? match.id : null;
    }
    return null;
  });

  const [isBarangayDropdownOpen, setIsBarangayDropdownOpen] = useState(false);
  const [barangaySearchText, setBarangaySearchText] = useState('');
  const barangayDropdownRef = useRef<HTMLDivElement>(null);
  const [showAllGrid, setShowAllGrid] = useState(false);

  // Click-outside and Escape key listener for barangay dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        barangayDropdownRef.current &&
        !barangayDropdownRef.current.contains(e.target as Node)
      ) {
        setIsBarangayDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBarangayDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const dropdownFilteredBarangays = useMemo(() => {
    if (!barangaySearchText.trim()) return authorizedBarangays;
    const term = barangaySearchText.toLowerCase();
    return authorizedBarangays.filter(
      b =>
        b.name.toLowerCase().includes(term) ||
        (b.focalPersonName || '').toLowerCase().includes(term) ||
        (b.code || '').toLowerCase().includes(term)
    );
  }, [authorizedBarangays, barangaySearchText]);

  const selectedBarangay = useMemo(() => {
    if (!selectedBarangayId) return null;
    return authorizedBarangays.find(b => b.id === selectedBarangayId) || null;
  }, [authorizedBarangays, selectedBarangayId]);

  // Combine barangays with their audits
  const barangayAuditMap = new Map<string, BarangayBiosecurityAudit>();
  audits.forEach(a => barangayAuditMap.set(a.barangay.toLowerCase(), a));

  const selectedAudit = useMemo(() => {
    if (!selectedBarangay) return null;
    return barangayAuditMap.get(selectedBarangay.name.toLowerCase()) || null;
  }, [selectedBarangay, barangayAuditMap]);

  const selectedSwine = useMemo(() => {
    if (!selectedBarangay) return [];
    return allSwineRecords.filter(
      s => !s.isArchived && s.barangay?.trim().toLowerCase() === selectedBarangay.name.trim().toLowerCase()
    );
  }, [selectedBarangay, allSwineRecords]);

  const selectedAffectedCount = useMemo(() => {
    return selectedSwine.filter(
      s => s.status === 'sick' || s.status === 'quarantined' || s.asfStatus === 'suspected_asf' || s.asfStatus === 'asf_positive'
    ).length;
  }, [selectedSwine]);

  const selectedReadyCount = useMemo(() => {
    return selectedSwine.filter(
      s => s.readyToSell || (s.weightKg && s.weightKg >= 80)
    ).length;
  }, [selectedSwine]);

  const filteredBarangays = authorizedBarangays.filter(b => {
    const audit = barangayAuditMap.get(b.name.toLowerCase());
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.focalPersonName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = zoneFilter === 'all' || b.riskLevel === zoneFilter;
    const matchesLevel = levelFilter === 'all' || (audit && audit.biosecurityLevel.toString() === levelFilter);
    return matchesSearch && matchesZone && matchesLevel;
  });

  // Summary Metrics
  const greenCount = authorizedBarangays.filter(b => b.riskLevel === 'green').length;
  const yellowCount = authorizedBarangays.filter(b => b.riskLevel === 'yellow').length;
  const redCount = authorizedBarangays.filter(b => b.riskLevel === 'red').length;
  const level3Count = audits.filter(a => a.biosecurityLevel === 3).length;
  const activeIncidents = incidents.filter(i => !i.resolved).length;

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Hero Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Barangay Biosecurity & ASF Zone Protection
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Standardized biosecurity compliance audit for all 40 Hinunangan barangays, disinfectant barrier checkpoints, swill-feeding prohibitions, and rapid outbreak isolation.
            </p>

            {/* Collapsible Barangay Selector */}
            <div className="pt-2" ref={barangayDropdownRef}>
              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>BARANGAYS</span>
              </div>

              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setIsBarangayDropdownOpen(prev => !prev)}
                  aria-expanded={isBarangayDropdownOpen}
                  aria-haspopup="true"
                  className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center gap-3 transition cursor-pointer shadow-md backdrop-blur-md min-w-[260px] justify-between"
                  title="Select Barangay"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-emerald-300 font-semibold">Barangay:</span>
                    <span className="font-extrabold text-white truncate">
                      {selectedBarangay ? `[ ${selectedBarangay.name} ▼ ]` : '[ Select Barangay ▼ ]'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-300 transition-transform ${isBarangayDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBarangayDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-stone-200 p-3 z-50 animate-fadeIn text-stone-900">
                    {/* Search Barangay Input */}
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        value={barangaySearchText}
                        onChange={e => setBarangaySearchText(e.target.value)}
                        placeholder="🔍 Search Barangay..."
                        autoFocus
                        className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900 bg-stone-50"
                      />
                    </div>

                    <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-2 py-1 flex items-center justify-between">
                      <span>Authorized Barangays ({dropdownFilteredBarangays.length})</span>
                      {currentRole === 'focal' && <span className="text-emerald-700">Assigned Only</span>}
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-sidebar-scroll space-y-1 mt-1 pr-1">
                      {dropdownFilteredBarangays.map(b => {
                        const isSelected = selectedBarangayId === b.id;
                        const bgSwine = allSwineRecords.filter(s => !s.isArchived && s.barangay?.toLowerCase() === b.name.toLowerCase()).length;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBarangayId(b.id);
                              setIsBarangayDropdownOpen(false);
                              setBarangaySearchText('');
                              setShowAllGrid(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-800 text-white shadow-xs'
                                : 'hover:bg-emerald-50 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  b.riskLevel === 'green'
                                    ? 'bg-emerald-500'
                                    : b.riskLevel === 'yellow'
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                              />
                              <span className="truncate">{b.name}</span>
                              <span className="text-[10px] opacity-70">({b.code})</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded font-mono ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                              }`}>
                                {bgSwine} pigs
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                b.riskLevel === 'green'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.riskLevel === 'yellow'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {b.riskLevel}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {dropdownFilteredBarangays.length === 0 && (
                        <div className="text-center py-4 text-xs text-stone-400">
                          No matching barangay found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setAuditForm({
                  barangay: barangays[0]?.name || 'Poblacion',
                  auditDate: new Date().toISOString().split('T')[0],
                  auditorName: currentUser?.name || 'MAO Inspector',
                  biosecurityLevel: 2,
                  complianceScore: 85,
                  footbathsOperational: true,
                  vehicleDisinfectionStation: true,
                  quarantineCheckpointActive: true,
                  deadSwineDisposalFacility: true,
                  swillFeedingBanEnforced: true,
                  visitorLogCompliance: true,
                  waterChlorination: true,
                  perimeterFencingAudit: true,
                  asfZone: 'green',
                  status: 'compliant',
                  notes: '',
                });
                setIsAuditModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Conduct Biosecurity Audit</span>
            </button>

            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/90 hover:bg-amber-400 text-amber-950 font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Log Biosecurity Incident</span>
            </button>

            <button
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-300" />
              <span>Broadcast Advisory</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-emerald-800/80 text-xs">
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50">
            <span className="text-emerald-300 font-medium block">Total Barangays</span>
            <span className="text-xl font-black text-white mt-1 block">{barangays.length}</span>
            <span className="text-[10px] text-emerald-400/80">Hinunangan, So. Leyte</span>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50">
            <span className="text-emerald-300 font-medium block">Green Zone (Safe)</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">{greenCount}</span>
            <span className="text-[10px] text-emerald-400/80">ASF-free status</span>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50">
            <span className="text-amber-300 font-medium block">Yellow Buffer Zone</span>
            <span className="text-xl font-black text-amber-300 mt-1 block">{yellowCount}</span>
            <span className="text-[10px] text-amber-300/80">Monitoring zone</span>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50">
            <span className="text-emerald-300 font-medium block">Level 3 Certified</span>
            <span className="text-xl font-black text-white mt-1 block">{level3Count}</span>
            <span className="text-[10px] text-emerald-400/80">High bio-exclusion</span>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50 col-span-2 sm:col-span-1">
            <span className="text-red-300 font-medium block">Active Incidents</span>
            <span className="text-xl font-black text-red-400 mt-1 block">{activeIncidents}</span>
            <span className="text-[10px] text-red-300/80">Pending resolution</span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('audits')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'audits'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Barangay Audit Registry ({barangays.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('checkpoints')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'checkpoints'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Disinfection Checkpoints</span>
            </button>
            <button
              onClick={() => setActiveSubTab('incidents')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'incidents'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Incidents & Interceptions ({incidents.length})</span>
            </button>
          </div>

          {onNavigateToGis && (
            <button
              onClick={onNavigateToGis}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>View GIS Spatial Map</span>
            </button>
          )}
        </div>

        {/* Filter Controls (for Audits tab) */}
        {activeSubTab === 'audits' && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search barangay name or focal person..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div>
              <select
                value={zoneFilter}
                onChange={e => setZoneFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
              >
                <option value="all">All ASF Zones</option>
                <option value="green">🟢 Green Zone (Free)</option>
                <option value="yellow">🟡 Yellow Zone (Buffer)</option>
                <option value="red">🔴 Red Zone (Quarantine)</option>
              </select>
            </div>

            <div>
              <select
                value={levelFilter}
                onChange={e => setLevelFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
              >
                <option value="all">All Biosecurity Levels</option>
                <option value="3">Level 3 (Advanced 90%+)</option>
                <option value="2">Level 2 (Standard 70-89%)</option>
                <option value="1">Level 1 (Basic &lt;70%)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'audits' && (
        <>
          {/* STATE 1: COLLAPSED INITIAL STATE (NO BARANGAY SELECTED YET & NOT VIEWING ALL GRID) */}
          {!selectedBarangay && !showAllGrid && (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center space-y-5 shadow-xs animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Shield className="w-8 h-8 text-emerald-700" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h2 className="text-xl font-bold text-stone-900">Select a Barangay to Inspect Biosecurity</h2>
                <p className="text-xs text-stone-500 leading-relaxed">
                  African Swine Fever zone protection, bio-exclusion protocols, and registered livestock counts are tracked per barangay. Use the selector above or button below to view a specific barangay dossier.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBarangayDropdownOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Select Barangay ▼</span>
                </button>
                {currentRole !== 'focal' && (
                  <button
                    type="button"
                    onClick={() => setShowAllGrid(true)}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition border border-stone-200"
                  >
                    <span>View All 40 Barangays Grid</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STATE 2: SINGLE BARANGAY BIOSECURITY DOSSIER */}
          {selectedBarangay && !showAllGrid && (
            <div className="space-y-6 animate-fadeIn">
              {/* Barangay Dossier Header Card */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-black text-stone-900">
                      Barangay {selectedBarangay.name}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 border border-stone-200">
                      {selectedBarangay.code}
                    </span>
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        selectedBarangay.riskLevel === 'green'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedBarangay.riskLevel === 'yellow'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          selectedBarangay.riskLevel === 'green'
                            ? 'bg-emerald-600'
                            : selectedBarangay.riskLevel === 'yellow'
                            ? 'bg-amber-600'
                            : 'bg-red-600'
                        }`}
                      />
                      <span>{selectedBarangay.riskLevel} Zone</span>
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-2">
                    <span>Focal Person: <strong className="text-stone-800">{selectedBarangay.focalPersonName || 'Municipal Office'}</strong></span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const targetAudit = selectedAudit || {
                        id: `audit-${selectedBarangay.id}`,
                        barangay: selectedBarangay.name,
                        auditDate: new Date().toISOString().split('T')[0],
                        auditorName: currentUser?.name || 'MAO Inspector',
                        biosecurityLevel: 2,
                        complianceScore: 85,
                        footbathsOperational: true,
                        vehicleDisinfectionStation: true,
                        quarantineCheckpointActive: true,
                        deadSwineDisposalFacility: true,
                        swillFeedingBanEnforced: true,
                        visitorLogCompliance: true,
                        waterChlorination: true,
                        perimeterFencingAudit: true,
                        asfZone: selectedBarangay.riskLevel,
                        status: 'compliant',
                        notes: '',
                        updatedAt: new Date().toISOString(),
                      };
                      setPrintingAudit(targetAudit);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Print Official Biosecurity Certificate"
                  >
                    <Printer className="w-4 h-4 text-stone-600" />
                    <span>Print Certificate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuditForm({
                        id: selectedAudit?.id,
                        barangay: selectedBarangay.name,
                        auditDate: selectedAudit?.auditDate || new Date().toISOString().split('T')[0],
                        auditorName: selectedAudit?.auditorName || currentUser?.name || 'MAO Biosecurity Officer',
                        biosecurityLevel: selectedAudit?.biosecurityLevel ?? 2,
                        complianceScore: selectedAudit?.complianceScore ?? 85,
                        footbathsOperational: selectedAudit?.footbathsOperational ?? true,
                        vehicleDisinfectionStation: selectedAudit?.vehicleDisinfectionStation ?? true,
                        quarantineCheckpointActive: selectedAudit?.quarantineCheckpointActive ?? true,
                        deadSwineDisposalFacility: selectedAudit?.deadSwineDisposalFacility ?? true,
                        swillFeedingBanEnforced: selectedAudit?.swillFeedingBanEnforced ?? true,
                        visitorLogCompliance: selectedAudit?.visitorLogCompliance ?? true,
                        waterChlorination: selectedAudit?.waterChlorination ?? true,
                        perimeterFencingAudit: selectedAudit?.perimeterFencingAudit ?? true,
                        asfZone: selectedBarangay.riskLevel,
                        status: selectedAudit?.status || 'compliant',
                        notes: selectedAudit?.notes || '',
                      });
                      setIsAuditModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Conduct Audit</span>
                  </button>

                  {currentRole !== 'focal' && (
                    <button
                      type="button"
                      onClick={() => setShowAllGrid(true)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                      title="View all municipal barangays"
                    >
                      View All Barangays
                    </button>
                  )}
                </div>
              </div>

              {/* The 7 Key Biosecurity & ASF Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. ASF STATUS */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">1. ASF STATUS</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${
                      selectedBarangay.riskLevel === 'green' ? 'bg-emerald-500' : selectedBarangay.riskLevel === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <span className="text-lg font-black text-stone-900 uppercase">
                      {selectedBarangay.riskLevel === 'green' ? 'Green Zone (Free)' : selectedBarangay.riskLevel === 'yellow' ? 'Yellow Zone (Buffer)' : 'Red Zone (Quarantine)'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {selectedBarangay.riskLevel === 'green'
                      ? 'Certified African Swine Fever Free municipal sector'
                      : selectedBarangay.riskLevel === 'yellow'
                      ? 'Active biosurveillance & buffer protection zone'
                      : 'High-risk containment zone with movement ban'}
                  </p>
                </div>

                {/* 2. Biosecurity Level */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">2. Biosecurity Level</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-stone-900">
                      Level {selectedAudit?.biosecurityLevel ?? 2}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {selectedAudit?.complianceScore ?? 85}% Score
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedAudit?.complianceScore ?? 85}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-500">
                    {(selectedAudit?.complianceScore ?? 85) >= 90 ? 'Advanced Bio-exclusion Standard' : (selectedAudit?.complianceScore ?? 85) >= 70 ? 'Standard Bio-exclusion Standard' : 'Basic / Upgrade Required'}
                  </p>
                </div>

                {/* 3. Registered Swine */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">3. Registered Swine</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-stone-900">{selectedSwine.length}</span>
                    <span className="text-xs text-stone-500 font-semibold">Total Heads</span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {selectedSwine.filter(s => s.farmType === 'backyard').length} Backyard • {selectedSwine.filter(s => s.farmType === 'commercial').length} Commercial
                  </p>
                </div>

                {/* 4. Affected Swine */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">4. Affected Swine</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-black ${selectedAffectedCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {selectedAffectedCount}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      selectedAffectedCount > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedAffectedCount > 0 ? 'Under Quarantine' : 'Zero Reported'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {selectedAffectedCount > 0 ? 'Sick / quarantined / suspected hog heads' : 'All herds verified healthy with no symptoms'}
                  </p>
                </div>

                {/* 5. Ready for Take-Off */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">5. Ready for Take-Off</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-amber-700">{selectedReadyCount}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      Market-Ready
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Heads eligible for official shipping / sale permit
                  </p>
                </div>

                {/* 6. Last Inspection */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">6. Last Inspection</span>
                  <div className="text-base font-black text-stone-900 truncate">
                    {selectedAudit?.auditDate ? selectedAudit.auditDate : 'Pending Initial Audit'}
                  </div>
                  <p className="text-xs text-stone-500 truncate">
                    By: {selectedAudit?.auditorName || 'MAO Biosecurity Officer'}
                  </p>
                </div>

                {/* 7. Risk / Zone Status */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2 sm:col-span-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">7. Risk/Zone Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                      selectedBarangay.riskLevel === 'green'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedBarangay.riskLevel === 'yellow'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedBarangay.riskLevel} Zone
                    </span>
                    <span className="text-xs font-bold text-stone-800">
                      {selectedBarangay.riskLevel === 'green'
                        ? 'Low Risk — Inter-barangay Swine Transit Authorized'
                        : selectedBarangay.riskLevel === 'yellow'
                        ? 'Moderate Risk — Strict Buffer Disinfection Checkpoint'
                        : 'Critical Risk — Complete Swine Movement Quarantine'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {selectedBarangay.riskLevel === 'green'
                      ? 'Focal person certified compliance. Swill feeding prohibited under Municipal EO. Shipping allowed with Veterinary Health Certificate.'
                      : selectedBarangay.riskLevel === 'yellow'
                      ? 'Heightened biosurveillance active. Disinfection barrier checkpoints operational at all barangay boundary access points.'
                      : 'Emergency isolation protocol enforced. Transport prohibited. Immediate reporting of dead or symptomatic animals required.'}
                  </p>
                </div>
              </div>

              {/* Biosecurity Checklist Panel for this Barangay */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">
                      Bio-Exclusion & Containment Checklist — Brgy. {selectedBarangay.name}
                    </h3>
                    <p className="text-xs text-stone-500">Official DA-BAI biosecurity inspection checklist</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                    Score: {selectedAudit?.complianceScore ?? 85}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2.5">
                    {selectedAudit?.footbathsOperational !== false ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-stone-800">Operational Footbaths</div>
                      <div className="text-[10px] text-stone-500">At farm/pen entry</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2.5">
                    {selectedAudit?.swillFeedingBanEnforced !== false ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-stone-800">Swill Feeding Ban</div>
                      <div className="text-[10px] text-stone-500">Zero food scraps</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2.5">
                    {selectedAudit?.vehicleDisinfectionStation ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-stone-800">Tire Disinfection Station</div>
                      <div className="text-[10px] text-stone-500">Vehicle spray barrier</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2.5">
                    {selectedAudit?.quarantineCheckpointActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-stone-800">Quarantine Checkpoint</div>
                      <div className="text-[10px] text-stone-500">Active monitoring</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2.5">
                    {selectedAudit?.deadSwineDisposalFacility ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-stone-800">Disposal Pit Facility</div>
                      <div className="text-[10px] text-stone-500">Sanitary burial pit</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2.5">
                    {selectedAudit?.visitorLogCompliance ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-stone-800">Visitor Logbook</div>
                      <div className="text-[10px] text-stone-500">Traceability record</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2.5">
                    {selectedAudit?.waterChlorination ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-stone-800">Water Chlorination</div>
                      <div className="text-[10px] text-stone-500">Disinfected supply</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2.5">
                    {selectedAudit?.perimeterFencingAudit ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-stone-800">Perimeter Fence Audit</div>
                      <div className="text-[10px] text-stone-500">Stray animal exclusion</div>
                    </div>
                  </div>
                </div>

                {selectedAudit?.notes && (
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 italic">
                    "{selectedAudit.notes}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATE 3: FULL GRID (ONLY SHOWN IF USER EXPLICITLY SWITCHES TO SHOW ALL) */}
          {showAllGrid && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-stone-100 p-3 rounded-2xl">
                <span className="text-xs font-bold text-stone-700">
                  Showing All 40 Municipal Barangays Grid ({filteredBarangays.length} matching)
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllGrid(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  ← Back to Collapsed / Selected View
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBarangays.map(b => {
                  const audit = barangayAuditMap.get(b.name.toLowerCase());
                  const score = audit?.complianceScore ?? 75;
                  const level = audit?.biosecurityLevel ?? (score >= 90 ? 3 : score >= 70 ? 2 : 1);
                  const isCompliant = score >= 75 && b.riskLevel === 'green';

                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBarangayId(b.id);
                        setShowAllGrid(false);
                      }}
                      className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 cursor-pointer group"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-stone-900 text-base group-hover:text-emerald-700 transition">
                                Brgy. {b.name}
                              </h3>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                                {b.code}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              <span>Focal: {b.focalPersonName || 'Municipal Office'}</span>
                            </p>
                          </div>

                          {/* Zone Badge */}
                          <span
                            className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                              b.riskLevel === 'green'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.riskLevel === 'yellow'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                b.riskLevel === 'green'
                                  ? 'bg-emerald-600'
                                  : b.riskLevel === 'yellow'
                                  ? 'bg-amber-600'
                                  : 'bg-red-600'
                              }`}
                            />
                            <span>{b.riskLevel} Zone</span>
                          </span>
                        </div>

                        {/* Biosecurity Score & Level Indicator */}
                        <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-stone-600 font-semibold">Biosecurity Rating</span>
                            <span className="font-extrabold text-stone-900">
                              Level {level} ({score}%)
                            </span>
                          </div>

                          <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                score >= 85 ? 'bg-emerald-600' : score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, score)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-stone-400">
                          Click to inspect dossier
                        </span>
                        <ChevronRight className="w-4 h-4 text-emerald-700" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Subtab: Disinfection Checkpoints */}
      {activeSubTab === 'checkpoints' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-stone-900">Municipal Disinfection Barrier Network</h3>
            <p className="text-xs text-stone-500">
              Active quarantine and vehicle wheel tire spray stations safeguarding Hinunangan from external livestock infection vectors.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-sm">Station 1: Poblacion Port/Abattoir</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">Active</span>
                </div>
                <p className="text-xs text-stone-600">Location: Provincial Highway Junction, Poblacion</p>
                <div className="text-[11px] text-stone-500 space-y-1">
                  <div>Equipment: High-pressure power sprayer (Chlorine Dioxide 200ppm)</div>
                  <div>Vehicles disinfected today: <strong className="text-emerald-900">38 trucks/pickups</strong></div>
                  <div>Officer in Charge: SPO2 Dan Salvador & MAO Team</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-sm">Station 2: Labrador South Bridge</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">Active</span>
                </div>
                <p className="text-xs text-stone-600">Location: Boundary Bridge between Labrador & Silago Road</p>
                <div className="text-[11px] text-stone-500 space-y-1">
                  <div>Equipment: Tire bath ramp + automatic sensor misting</div>
                  <div>Vehicles disinfected today: <strong className="text-emerald-900">54 vehicles</strong></div>
                  <div>Officer in Charge: Juan Dela Cruz (Focal)</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-sm">Station 3: Calag-itan Buffer Checkpoint</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">Yellow Buffer</span>
                </div>
                <p className="text-xs text-stone-600">Location: North Boundary Checkpoint, Calag-itan</p>
                <div className="text-[11px] text-stone-500 space-y-1">
                  <div>Equipment: Manual backpack sprayer + foot disinfectant bath</div>
                  <div>Vehicles disinfected today: <strong className="text-amber-900">22 livestock haulers</strong></div>
                  <div>Officer in Charge: Rodrigo Balagao (Focal)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab: Incidents & Interceptions */}
      {activeSubTab === 'incidents' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Biosecurity Incidents & Animal Movement Interceptions</h3>
              <p className="text-xs text-stone-500">Official log of suspected hog fever reports, illegal transport entries, and corrective actions</p>
            </div>
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Incident</span>
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {incidents.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                No active biosecurity incidents recorded. Hinunangan municipal territory remains safe.
              </div>
            ) : (
              incidents.map(inc => (
                <div key={inc.id} className="p-4 sm:p-5 hover:bg-stone-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        inc.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : inc.severity === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {inc.severity} Severity
                      </span>
                      <span className="text-xs font-bold text-stone-900">Brgy. {inc.barangay}</span>
                      <span className="text-[11px] text-stone-400">• {inc.reportDate}</span>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {inc.description}
                    </p>

                    <div className="text-[11px] text-stone-500 flex items-center gap-2">
                      <span className="font-semibold text-emerald-800">Action:</span>
                      <span>{inc.actionTaken}</span>
                      <span className="text-stone-300">|</span>
                      <span>By: {inc.reportedBy}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {inc.resolved ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-700" /> Resolved
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          storageService.updateBiosecurityIncident({ ...inc, resolved: true });
                          setIncidents(storageService.getBiosecurityIncidents());
                          onRefresh();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Conduct / Update Biosecurity Audit */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Conduct Barangay Biosecurity Audit</h3>
                <p className="text-xs text-emerald-200">
                  DA-BAI National African Swine Fever Prevention & Bio-exclusion Standard
                </p>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAudit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Target Barangay *</label>
                  <select
                    value={auditForm.barangay}
                    onChange={e => setAuditForm({ ...auditForm, barangay: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                  >
                    {barangays.map(b => (
                      <option key={b.id} value={b.name}>
                        Brgy. {b.name} ({b.riskLevel.toUpperCase()} Zone)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Audit Date *</label>
                  <input
                    type="date"
                    value={auditForm.auditDate}
                    onChange={e => setAuditForm({ ...auditForm, auditDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Auditor / Inspector Name *</label>
                  <input
                    type="text"
                    value={auditForm.auditorName}
                    onChange={e => setAuditForm({ ...auditForm, auditorName: e.target.value })}
                    placeholder="e.g. Engr. Arnel M. Vasquez"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ASF Risk Zone *</label>
                  <select
                    value={auditForm.asfZone}
                    onChange={e => {
                      const updated = { ...auditForm, asfZone: e.target.value as RiskLevel };
                      const { score, level, status } = calculateScore(updated);
                      setAuditForm({ ...updated, complianceScore: score, biosecurityLevel: level, status });
                    }}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                  >
                    <option value="green">🟢 Green Zone (Free Zone)</option>
                    <option value="yellow">🟡 Yellow Zone (Buffer Zone)</option>
                    <option value="red">🔴 Red Zone (Infected/Quarantine)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Compliance Checklist */}
              <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                    Biosecurity Criteria Checklist
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800">
                      Score: {auditForm.complianceScore}%
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                      Level {auditForm.biosecurityLevel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={auditForm.footbathsOperational ?? false}
                      onChange={e => handleAuditCheckbox('footbathsOperational', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active Disinfectant Footbaths</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={auditForm.swillFeedingBanEnforced ?? false}
                      onChange={e => handleAuditCheckbox('swillFeedingBanEnforced', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Strict 100% Swill Feeding Ban</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={auditForm.vehicleDisinfectionStation ?? false}
                      onChange={e => handleAuditCheckbox('vehicleDisinfectionStation', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Vehicle Wheel Spray Active</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={auditForm.quarantineCheckpointActive ?? false}
                      onChange={e => handleAuditCheckbox('quarantineCheckpointActive', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Quarantine Checkpoint Guard</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={auditForm.perimeterFencingAudit ?? false}
                      onChange={e => handleAuditCheckbox('perimeterFencingAudit', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Physical Perimeter Hog Fencing</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={auditForm.deadSwineDisposalFacility ?? false}
                      onChange={e => handleAuditCheckbox('deadSwineDisposalFacility', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Proper Mortality Disposal Pit</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={auditForm.visitorLogCompliance ?? false}
                      onChange={e => handleAuditCheckbox('visitorLogCompliance', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Visitor & Animal Entry Logbook</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={auditForm.waterChlorination ?? false}
                      onChange={e => handleAuditCheckbox('waterChlorination', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Potable / Chlorinated Water Source</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Inspector Field Notes & Recommendation</label>
                <textarea
                  value={auditForm.notes || ''}
                  onChange={e => setAuditForm({ ...auditForm, notes: e.target.value })}
                  placeholder="Record specific observations, corrective instructions, or focal person feedback..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Save & Certify Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Log Biosecurity Incident */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-amber-900 to-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Log Biosecurity Incident</h3>
                <p className="text-xs text-amber-200">Report suspect swine illness or checkpoint border breach</p>
              </div>
              <button
                onClick={() => setIsIncidentModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Barangay Location *</label>
                <select
                  value={incidentForm.barangay}
                  onChange={e => setIncidentForm({ ...incidentForm, barangay: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none bg-white font-medium"
                >
                  {barangays.map(b => (
                    <option key={b.id} value={b.name}>Brgy. {b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Incident Type *</label>
                  <select
                    value={incidentForm.type}
                    onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none bg-white font-medium"
                  >
                    <option value="suspected_symptoms">Suspected Fever / Loss of Appetite</option>
                    <option value="illegal_entry">Illegal Unregistered Swine Entry</option>
                    <option value="swill_violation">Swill Feeding Prohibition Violation</option>
                    <option value="disinfection_failure">Checkpoint Disinfection Failure</option>
                    <option value="mortality">Unexplained Swine Mortality</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Severity *</label>
                  <select
                    value={incidentForm.severity}
                    onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none bg-white font-medium"
                  >
                    <option value="low">Low (Minor Observation)</option>
                    <option value="medium">Medium (Requires Inspection)</option>
                    <option value="high">High (Immediate Quarantine Action)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Incident Description *</label>
                <textarea
                  value={incidentForm.description}
                  onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  placeholder="Describe the vehicle, farmer name, observed clinical symptoms, or border breach details..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Immediate Action Taken</label>
                <input
                  type="text"
                  value={incidentForm.actionTaken}
                  onChange={e => setIncidentForm({ ...incidentForm, actionTaken: e.target.value })}
                  placeholder="e.g. Disinfected vehicle, turned back, isolated pig in pen"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Submit Incident Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Broadcast Biosecurity Advisory */}
      {isAdvisoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Broadcast Biosecurity Advisory</h3>
                <p className="text-xs text-emerald-200">Send direct notifications to focal persons and field raisers</p>
              </div>
              <button
                onClick={() => setIsAdvisoryModalOpen(false)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendAdvisory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Target Audience / Barangay</label>
                <select
                  value={advisoryTarget}
                  onChange={e => setAdvisoryTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                >
                  <option value="all">📢 All 40 Barangays (Municipal-wide)</option>
                  {barangays.map(b => (
                    <option key={b.id} value={b.name}>Brgy. {b.name} only</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Advisory Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdvisoryPriority('normal')}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      advisoryPriority === 'normal'
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvisoryPriority('advisory')}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      advisoryPriority === 'advisory'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Advisory
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvisoryPriority('urgent')}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      advisoryPriority === 'urgent'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Urgent Alert
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Advisory Message Content *</label>
                <textarea
                  value={advisoryContent}
                  onChange={e => setAdvisoryContent(e.target.value)}
                  placeholder="e.g. All focal persons in Southern sector must inspect boundary tire baths following heavy rains..."
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  required
                />
              </div>

              {advisorySent && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Advisory successfully transmitted to all designated recipients!</span>
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdvisoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={advisorySent}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW / CERTIFICATE MODAL */}
      {printingAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 p-8 space-y-6">
            {/* Header with Republic of the Philippines */}
            <div className="text-center space-y-1 border-b-2 border-emerald-900 pb-4">
              <div className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
                Republic of the Philippines • Province of Southern Leyte
              </div>
              <h2 className="text-lg font-black text-stone-900 uppercase">
                Municipality of Hinunangan
              </h2>
              <div className="text-xs font-bold text-emerald-800">
                Office of the Municipal Agriculturist (MAO)
              </div>
              <div className="text-sm font-black text-stone-800 uppercase tracking-wide pt-2">
                Certificate of Barangay Biosecurity Compliance
              </div>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 text-xs text-stone-800 leading-relaxed">
              <p>
                This is to officially certify that <strong>Barangay {printingAudit.barangay}</strong>, Municipality of Hinunangan, has undergone comprehensive biosurveillance and biosecurity field inspection conducted on <strong>{printingAudit.auditDate}</strong>.
              </p>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Assigned ASF Biosurveillance Zone:</span>
                  <span className="uppercase font-bold text-emerald-800">{printingAudit.asfZone} ZONE</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Biosecurity Classification:</span>
                  <span className="font-bold text-emerald-900">LEVEL {printingAudit.biosecurityLevel} CERTIFIED</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Overall Compliance Score:</span>
                  <span className="font-bold">{printingAudit.complianceScore}%</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Auditor / Inspector:</span>
                  <span>{printingAudit.auditorName}</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-600 italic">
                "{printingAudit.notes || 'Routine municipal biosurveillance audit certified compliant with national DA-BAI protocols.'}"
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-stone-200 text-center text-xs">
              <div>
                <div className="font-bold text-stone-900 underline uppercase">{printingAudit.auditorName}</div>
                <div className="text-[10px] text-stone-500">Municipal Biosecurity Inspector</div>
              </div>
              <div>
                <div className="font-bold text-stone-900 underline uppercase">ENGR. ARNEL M. VASQUEZ</div>
                <div className="text-[10px] text-stone-500">Municipal Agriculturist (MAO)</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
              <button
                onClick={() => setPrintingAudit(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
