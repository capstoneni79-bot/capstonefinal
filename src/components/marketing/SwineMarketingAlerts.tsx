import React, { useState } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Share2,
  CheckCircle2,
  DollarSign,
  Users,
  Calendar,
  Sparkles,
  Phone,
  Trash2,
  Tag,
  ArrowUpRight,
  Copy,
  Check,
  Building,
  Truck,
  Layers,
} from 'lucide-react';
import { Barangay, MarketingAlert, MarketingAlertType, SwineRecord, UserAccount } from '../../types';
import { storageService } from '../../services/storageService';

interface SwineMarketingAlertsProps {
  swineList: SwineRecord[];
  barangays: Barangay[];
  currentUser: UserAccount | null;
  onRefresh: () => void;
  onScheduleTakeoff?: (swine: SwineRecord) => void;
}

export const SwineMarketingAlerts: React.FC<SwineMarketingAlertsProps> = ({
  swineList,
  barangays,
  currentUser,
  onRefresh,
  onScheduleTakeoff,
}) => {
  const [alerts, setAlerts] = useState<MarketingAlert[]>(() => storageService.getMarketingAlerts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | MarketingAlertType>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [isNewAlertModalOpen, setIsNewAlertModalOpen] = useState(false);
  const [matchingAlert, setMatchingAlert] = useState<MarketingAlert | null>(null);

  // New Alert Form
  const [alertForm, setAlertForm] = useState<Partial<MarketingAlert>>({
    title: '',
    type: 'buyer_demand',
    targetAudience: 'all',
    targetBarangay: 'all',
    pricePerKg: 220,
    headsNeeded: 30,
    preferredWeightMin: 85,
    preferredWeightMax: 110,
    buyerName: '',
    buyerContact: '',
    urgency: 'high',
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    isActive: true,
  });

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.title?.trim()) return;

    const newAlert: MarketingAlert = {
      id: `mkt-${Date.now()}`,
      title: alertForm.title,
      type: alertForm.type || 'buyer_demand',
      targetAudience: alertForm.targetAudience || 'all',
      targetBarangay: alertForm.targetBarangay || 'all',
      pricePerKg: alertForm.pricePerKg ? Number(alertForm.pricePerKg) : undefined,
      headsNeeded: alertForm.headsNeeded ? Number(alertForm.headsNeeded) : undefined,
      preferredWeightMin: alertForm.preferredWeightMin ? Number(alertForm.preferredWeightMin) : undefined,
      preferredWeightMax: alertForm.preferredWeightMax ? Number(alertForm.preferredWeightMax) : undefined,
      buyerName: alertForm.buyerName,
      buyerContact: alertForm.buyerContact,
      urgency: alertForm.urgency || 'normal',
      validUntil: alertForm.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: alertForm.description || 'Swine marketing alert issued by Hinunangan Municipal Agriculture Desk.',
      postedBy: currentUser?.name || 'Municipal Agriculture Officer',
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    storageService.addMarketingAlert(newAlert);
    setAlerts(storageService.getMarketingAlerts());
    setIsNewAlertModalOpen(false);
    onRefresh();
  };

  const handleToggleActive = (id: string) => {
    storageService.toggleMarketingAlertStatus(id);
    setAlerts(storageService.getMarketingAlerts());
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this marketing alert?')) {
      storageService.deleteMarketingAlert(id);
      setAlerts(storageService.getMarketingAlerts());
      onRefresh();
    }
  };

  const handleCopyAlert = (alert: MarketingAlert) => {
    const text = `📢 [DA HINUNANGAN MARKETING ALERT]\n${alert.title}\n` +
      (alert.pricePerKg ? `💰 Buying Benchmark: ₱${alert.pricePerKg}/kg liveweight\n` : '') +
      (alert.headsNeeded ? `🐖 Target Heads: ${alert.headsNeeded} heads\n` : '') +
      (alert.buyerName ? `🏢 Buyer: ${alert.buyerName} (${alert.buyerContact || 'Contact MAO'})\n` : '') +
      `📅 Valid until: ${alert.validUntil}\n` +
      `Details: ${alert.description}\n` +
      `Issued by: Municipal Agriculture Office, Hinunangan, Southern Leyte`;

    navigator.clipboard.writeText(text);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Find matching hogs in local registry
  const getMatchingHogs = (alert: MarketingAlert) => {
    return swineList.filter(s => {
      if (s.isArchived) return false;
      if (s.status === 'sold' || s.status === 'deceased' || s.status === 'quarantined') return false;
      
      const meetsWeightMin = !alert.preferredWeightMin || s.weightKg >= alert.preferredWeightMin;
      const meetsWeightMax = !alert.preferredWeightMax || s.weightKg <= alert.preferredWeightMax;
      const matchesBarangay = alert.targetBarangay === 'all' || s.barangay.toLowerCase() === alert.targetBarangay.toLowerCase();
      
      return meetsWeightMin && meetsWeightMax && matchesBarangay;
    });
  };

  // Filtered alerts
  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.buyerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || a.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Ready to sell count
  const readyHogs = swineList.filter(s => s.readyToSell && !s.isArchived);

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-800/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-800/80 border border-amber-700/60 text-amber-200 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Hinunangan Livestock Market Intelligence & Demand Alerts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Swine Marketing & Liveweight Alerts
            </h1>
            <p className="text-sm text-amber-100/80 leading-relaxed">
              Real-time farmgate pricing bulletins, bulk buyer procurement quotas, and slaughterhouse intake schedules connecting Hinunangan hog raisers directly with verified meat traders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsNewAlertModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-amber-950 font-black text-xs sm:text-sm flex items-center gap-2 transition shadow-lg hover:shadow-xl cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-900" />
              <span>Post New Marketing Alert</span>
            </button>
          </div>
        </div>

        {/* Live Market Indicators Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-amber-800/60 text-xs">
          <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-amber-800/40">
            <span className="text-amber-300 font-medium block">Liveweight Farmgate Benchmark</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-white">₱215 - ₱235</span>
              <span className="text-[10px] text-amber-400">/ kg</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">▲ +₱5.00 this week</span>
          </div>

          <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-amber-800/40">
            <span className="text-amber-300 font-medium block">Market-Ready Finishers</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-amber-400">{readyHogs.length}</span>
              <span className="text-[10px] text-stone-400">certified heads</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-0.5 block">Ready in 40 barangays</span>
          </div>

          <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-amber-800/40">
            <span className="text-amber-300 font-medium block">Active Buyer Inquiries</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-white">{alerts.filter(a => a.isActive).length}</span>
              <span className="text-[10px] text-amber-400">open alerts</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-0.5 block">Leyte & Southern Leyte</span>
          </div>

          <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-amber-800/40">
            <span className="text-amber-300 font-medium block">Municipal Abattoir Fee</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-white">₱150</span>
              <span className="text-[10px] text-stone-400">/ head inspection</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">Ante & post-mortem seal</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search alerts, buyers, or requirements..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedType === 'all' ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Alerts
          </button>
          <button
            onClick={() => setSelectedType('buyer_demand')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedType === 'buyer_demand' ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Buyer Demands
          </button>
          <button
            onClick={() => setSelectedType('price_update')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedType === 'price_update' ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Price Updates
          </button>
          <button
            onClick={() => setSelectedType('market_day')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedType === 'market_day' ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Abattoir / Market Day
          </button>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-2 py-16 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
            No marketing alerts match your criteria. Click "Post New Marketing Alert" to create one.
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const matchingHogs = getMatchingHogs(alert);
            const isCritical = alert.urgency === 'critical';
            const isHigh = alert.urgency === 'high';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 ${
                  alert.isActive ? 'border-stone-200' : 'border-stone-200/60 opacity-70 bg-stone-50/50'
                }`}
              >
                <div>
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-red-100 text-red-800'
                              : isHigh
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {alert.urgency} Urgency
                        </span>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 capitalize">
                          {alert.type.replace('_', ' ')}
                        </span>

                        {alert.targetBarangay !== 'all' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Brgy. {alert.targetBarangay}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-stone-900 text-base leading-snug pt-1">
                        {alert.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${
                        alert.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {alert.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>

                  {/* Pricing and Target Metric Bar */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {alert.pricePerKg && (
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">Buying Price</span>
                        <span className="text-sm font-extrabold text-amber-900">₱{alert.pricePerKg}/kg</span>
                      </div>
                    )}
                    {alert.headsNeeded && (
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">Heads Needed</span>
                        <span className="text-sm font-extrabold text-amber-900">{alert.headsNeeded} heads</span>
                      </div>
                    )}
                    {(alert.preferredWeightMin || alert.preferredWeightMax) && (
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">Ideal Weight</span>
                        <span className="text-sm font-extrabold text-amber-900">
                          {alert.preferredWeightMin || 80}-{alert.preferredWeightMax || 115} kg
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs text-stone-700 leading-relaxed">
                    {alert.description}
                  </p>

                  {/* Buyer details if present */}
                  {alert.buyerName && (
                    <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs flex items-center justify-between text-stone-700">
                      <div className="flex items-center gap-2 truncate">
                        <Building className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="font-semibold truncate">{alert.buyerName}</span>
                      </div>
                      {alert.buyerContact && (
                        <a
                          href={`tel:${alert.buyerContact}`}
                          className="flex items-center gap-1 text-emerald-800 font-bold hover:underline shrink-0 text-[11px]"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{alert.buyerContact}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Matching Swine Helper Callout */}
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-emerald-950 font-medium text-[11px]">
                        <strong>{matchingHogs.length} hogs</strong> in registry match this demand
                      </span>
                    </div>

                    <button
                      onClick={() => setMatchingAlert(alert)}
                      className="text-emerald-800 hover:text-emerald-950 font-bold text-[11px] underline cursor-pointer"
                    >
                      View Matches
                    </button>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="text-[10px]">
                    Valid until: <strong>{alert.validUntil}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyAlert(alert)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                      title="Copy alert text for SMS distribution"
                    >
                      {copiedId === alert.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleToggleActive(alert.id)}
                      className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 text-[11px] font-semibold cursor-pointer"
                    >
                      {alert.isActive ? 'Mark Closed' : 'Reactivate'}
                    </button>

                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Create New Marketing Alert */}
      {isNewAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-amber-900 to-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Post Swine Marketing Alert</h3>
                <p className="text-xs text-amber-200">
                  Publish price bulletins or buyer procurement calls to Hinunangan farmers
                </p>
              </div>
              <button
                onClick={() => setIsNewAlertModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Alert Headline / Title *</label>
                <input
                  type="text"
                  value={alertForm.title}
                  onChange={e => setAlertForm({ ...alertForm, title: e.target.value })}
                  placeholder="e.g. High Demand: 50 Heads Market-Ready Finishers Wanted"
                  className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Alert Type *</label>
                  <select
                    value={alertForm.type}
                    onChange={e => setAlertForm({ ...alertForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none bg-white font-medium"
                  >
                    <option value="buyer_demand">Direct Buyer Demand</option>
                    <option value="price_update">Liveweight Price Adjustment</option>
                    <option value="market_day">Public Market / Abattoir Quota</option>
                    <option value="slaughterhouse_quota">Commercial Abattoir Batch</option>
                    <option value="dispatch_call">Inter-Municipal Transit Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Urgency Level *</label>
                  <select
                    value={alertForm.urgency}
                    onChange={e => setAlertForm({ ...alertForm, urgency: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none bg-white font-medium"
                  >
                    <option value="normal">Normal (Routine Market Advisory)</option>
                    <option value="high">High (Procurement In Progress)</option>
                    <option value="critical">Critical (Immediate Pickup Needed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Buying Price (₱/kg)</label>
                  <input
                    type="number"
                    step="1"
                    value={alertForm.pricePerKg || ''}
                    onChange={e => setAlertForm({ ...alertForm, pricePerKg: Number(e.target.value) })}
                    placeholder="225"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Heads Needed</label>
                  <input
                    type="number"
                    value={alertForm.headsNeeded || ''}
                    onChange={e => setAlertForm({ ...alertForm, headsNeeded: Number(e.target.value) })}
                    placeholder="30"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Valid Until *</label>
                  <input
                    type="date"
                    value={alertForm.validUntil}
                    onChange={e => setAlertForm({ ...alertForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Buyer / Consolidator Name</label>
                  <input
                    type="text"
                    value={alertForm.buyerName || ''}
                    onChange={e => setAlertForm({ ...alertForm, buyerName: e.target.value })}
                    placeholder="e.g. Southern Leyte Meat Traders"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Buyer Contact Number</label>
                  <input
                    type="text"
                    value={alertForm.buyerContact || ''}
                    onChange={e => setAlertForm({ ...alertForm, buyerContact: e.target.value })}
                    placeholder="0917-xxx-xxxx"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Alert Description & Instructions *</label>
                <textarea
                  value={alertForm.description}
                  onChange={e => setAlertForm({ ...alertForm, description: e.target.value })}
                  placeholder="Specify weigh-in staging point, payment terms, or required VHC health clearances..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-600 outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAlertModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Publish Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Matching Hogs for Alert */}
      {matchingAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Matching Registered Swine</h3>
                <p className="text-xs text-emerald-200 truncate max-w-md">
                  Matches for: {matchingAlert.title}
                </p>
              </div>
              <button
                onClick={() => setMatchingAlert(null)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {getMatchingHogs(matchingAlert).length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs">
                  No currently registered hogs in this weight range or target barangay.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {getMatchingHogs(matchingAlert).map(swine => (
                    <div key={swine.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 font-mono">{swine.earTagNo}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                            {swine.weightKg} kg
                          </span>
                          <span className="text-[10px] text-stone-500">Brgy. {swine.barangay}</span>
                        </div>
                        <p className="text-stone-600 text-[11px] mt-0.5">
                          Farmer: <strong>{swine.farmerName}</strong> ({swine.farmerContact || 'No contact'})
                        </p>
                      </div>

                      {onScheduleTakeoff && (
                        <button
                          onClick={() => {
                            onScheduleTakeoff(swine);
                            setMatchingAlert(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Schedule Take-Off</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                onClick={() => setMatchingAlert(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 cursor-pointer"
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
