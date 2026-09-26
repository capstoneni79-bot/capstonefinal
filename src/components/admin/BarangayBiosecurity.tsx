import React, { useState } from 'react';
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
  Info,
} from 'lucide-react';
import { Barangay, BarangayBiosecurityAudit, BiosecurityIncident, RiskLevel, UserAccount } from '../../types';
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

  // Combine barangays with their audits
  const barangayAuditMap = new Map<string, BarangayBiosecurityAudit>();
  audits.forEach(a => barangayAuditMap.set(a.barangay.toLowerCase(), a));

  const filteredBarangays = barangays.filter(b => {
    const audit = barangayAuditMap.get(b.name.toLowerCase());
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.focalPersonName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = zoneFilter === 'all' || b.riskLevel === zoneFilter;
    const matchesLevel = levelFilter === 'all' || (audit && audit.biosecurityLevel.toString() === levelFilter);
    return matchesSearch && matchesZone && matchesLevel;
  });

  // Summary Metrics
  const greenCount = barangays.filter(b => b.riskLevel === 'green').length;
  const yellowCount = barangays.filter(b => b.riskLevel === 'yellow').length;
  const redCount = barangays.filter(b => b.riskLevel === 'red').length;
  const level3Count = audits.filter(a => a.biosecurityLevel === 3).length;
  const activeIncidents = incidents.filter(i => !i.resolved).length;

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Hero Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Barangay Biosecurity & ASF Zone Protection
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Standardized biosecurity compliance audit for all 40 Hinunangan barangays, disinfectant barrier checkpoints, swill-feeding prohibitions, and rapid outbreak isolation.
            </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBarangays.map(b => {
            const audit = barangayAuditMap.get(b.name.toLowerCase());
            const score = audit?.complianceScore ?? 75;
            const level = audit?.biosecurityLevel ?? (score >= 90 ? 3 : score >= 70 ? 2 : 1);
            const isCompliant = score >= 75 && b.riskLevel === 'green';

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900 text-base">Brgy. {b.name}</h3>
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

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          score >= 85 ? 'bg-emerald-600' : score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span>Basic (L1)</span>
                      <span>Mitigated (L2)</span>
                      <span>Certified (L3)</span>
                    </div>
                  </div>

                  {/* Audit Checklist Chips */}
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-stone-700">
                      {audit?.footbathsOperational !== false ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      <span className="truncate">Active Footbaths</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-700">
                      {audit?.swillFeedingBanEnforced !== false ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      <span className="truncate">No Swill Feeding</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-700">
                      {audit?.vehicleDisinfectionStation ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span className="truncate">Tire Disinfection</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-700">
                      {audit?.quarantineCheckpointActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span className="truncate">Checkpoint Guard</span>
                    </div>
                  </div>

                  {audit?.notes && (
                    <p className="mt-3 text-[11px] text-stone-500 italic bg-white p-2 rounded-lg border border-stone-100">
                      "{audit.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-stone-400">
                    Last audit: {audit?.auditDate || 'Recently registered'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const targetAudit = audit || {
                          id: `audit-${b.id}`,
                          barangay: b.name,
                          auditDate: new Date().toISOString().split('T')[0],
                          auditorName: currentUser?.name || 'MAO Inspector',
                          biosecurityLevel: level,
                          complianceScore: score,
                          footbathsOperational: true,
                          vehicleDisinfectionStation: true,
                          quarantineCheckpointActive: true,
                          deadSwineDisposalFacility: true,
                          swillFeedingBanEnforced: true,
                          visitorLogCompliance: true,
                          waterChlorination: true,
                          perimeterFencingAudit: true,
                          asfZone: b.riskLevel,
                          status: isCompliant ? 'compliant' : 'warning',
                          notes: '',
                          updatedAt: new Date().toISOString(),
                        };
                        setPrintingAudit(targetAudit);
                      }}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                      title="Print Official Biosecurity Certificate"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setAuditForm({
                          id: audit?.id,
                          barangay: b.name,
                          auditDate: audit?.auditDate || new Date().toISOString().split('T')[0],
                          auditorName: audit?.auditorName || currentUser?.name || 'MAO Biosecurity Officer',
                          biosecurityLevel: level,
                          complianceScore: score,
                          footbathsOperational: audit?.footbathsOperational ?? true,
                          vehicleDisinfectionStation: audit?.vehicleDisinfectionStation ?? true,
                          quarantineCheckpointActive: audit?.quarantineCheckpointActive ?? true,
                          deadSwineDisposalFacility: audit?.deadSwineDisposalFacility ?? true,
                          swillFeedingBanEnforced: audit?.swillFeedingBanEnforced ?? true,
                          visitorLogCompliance: audit?.visitorLogCompliance ?? true,
                          waterChlorination: audit?.waterChlorination ?? true,
                          perimeterFencingAudit: audit?.perimeterFencingAudit ?? true,
                          asfZone: b.riskLevel,
                          status: audit?.status || 'compliant',
                          notes: audit?.notes || '',
                        });
                        setIsAuditModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Update Audit</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
