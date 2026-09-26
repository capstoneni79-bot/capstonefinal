import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  AlertCircle,
  FileCheck,
  User,
  MapPin,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Barangay, SwineRecord, SwineTakeoffRecord, UserAccount } from '../../types';
import { storageService } from '../../services/storageService';

interface SwineTakeoffManagerProps {
  swineList: SwineRecord[];
  barangays?: Barangay[];
  currentUser: UserAccount | null;
  onRefresh: () => void | Promise<void>;
  initialSelectedSwine?: SwineRecord | null;
  preselectedSwine?: SwineRecord | null;
  onClearPreselected?: () => void;
  onNavigateBack?: () => void;
}

export const SwineTakeoffManager: React.FC<SwineTakeoffManagerProps> = ({
  swineList,
  barangays = [],
  currentUser,
  onRefresh,
  initialSelectedSwine,
  preselectedSwine = initialSelectedSwine,
  onClearPreselected,
  onNavigateBack,
}) => {
  const [takeoffs, setTakeoffs] = useState<SwineTakeoffRecord[]>(() => storageService.getTakeoffRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'cleared' | 'in_transit' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'takeoffs' | 'ready_hogs'>('takeoffs');

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(!!preselectedSwine);
  const [printingRecord, setPrintingRecord] = useState<SwineTakeoffRecord | null>(null);

  // Form for New Take-Off
  const [scheduleForm, setScheduleForm] = useState<Partial<SwineTakeoffRecord>>(() => {
    if (preselectedSwine) {
      return {
        swineId: preselectedSwine.id,
        earTagNo: preselectedSwine.earTagNo,
        farmerName: preselectedSwine.farmerName,
        farmerAddress: preselectedSwine.farmerAddress,
        barangay: preselectedSwine.barangay,
        swineType: preselectedSwine.swineType,
        weightKg: preselectedSwine.weightKg,
        estimatedPricePhp: Math.round(preselectedSwine.weightKg * 220),
        destination: 'Hinunangan Municipal Abattoir, Poblacion',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '05:30 AM',
        status: 'scheduled',
        vehicleDisinfected: true,
        asfZoneCleared: true,
        earTagVerified: true,
        gatePassNo: `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        inspectedBy: currentUser?.name || 'Municipal Livestock Inspector',
      };
    }
    return {
      destination: 'Hinunangan Municipal Abattoir, Poblacion',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '05:30 AM',
      status: 'scheduled',
      vehicleDisinfected: true,
      asfZoneCleared: true,
      earTagVerified: true,
      gatePassNo: `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      inspectedBy: currentUser?.name || 'Municipal Livestock Inspector',
    };
  });

  // Eligible ready hogs (weight >= 75kg or readyToSell)
  const readyHogs = swineList.filter(
    s => !s.isArchived && s.status !== 'sold' && s.status !== 'deceased' && (s.readyToSell || s.weightKg >= 75)
  );

  const handleSelectSwine = (s: SwineRecord) => {
    setScheduleForm({
      ...scheduleForm,
      swineId: s.id,
      earTagNo: s.earTagNo,
      farmerName: s.farmerName,
      farmerAddress: s.farmerAddress,
      barangay: s.barangay,
      swineType: s.swineType,
      weightKg: s.weightKg,
      estimatedPricePhp: Math.round(s.weightKg * 220),
    });
  };

  const handleSaveTakeoff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.swineId || !scheduleForm.earTagNo) {
      alert('Please select a registered market-ready swine.');
      return;
    }

    const newRecord: SwineTakeoffRecord = {
      id: scheduleForm.id || `tk-${Date.now()}`,
      swineId: scheduleForm.swineId,
      earTagNo: scheduleForm.earTagNo,
      farmerName: scheduleForm.farmerName || 'Hinunangan Farmer',
      farmerAddress: scheduleForm.farmerAddress || 'Hinunangan',
      barangay: scheduleForm.barangay || 'Poblacion',
      swineType: scheduleForm.swineType || 'finisher',
      weightKg: Number(scheduleForm.weightKg || 90),
      estimatedPricePhp: scheduleForm.estimatedPricePhp ? Number(scheduleForm.estimatedPricePhp) : undefined,
      buyerName: scheduleForm.buyerName || 'Local Meat Buyer',
      buyerContact: scheduleForm.buyerContact,
      vehiclePlateNo: scheduleForm.vehiclePlateNo || 'Plate Pending',
      driverName: scheduleForm.driverName,
      destination: scheduleForm.destination || 'Hinunangan Municipal Abattoir',
      scheduledDate: scheduleForm.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduleForm.scheduledTime || '06:00 AM',
      status: scheduleForm.status || 'scheduled',
      vhcNumber: scheduleForm.vhcNumber || `VHC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      shippingPermitNo: scheduleForm.shippingPermitNo,
      vehicleDisinfected: !!scheduleForm.vehicleDisinfected,
      asfZoneCleared: !!scheduleForm.asfZoneCleared,
      earTagVerified: !!scheduleForm.earTagVerified,
      gatePassNo: scheduleForm.gatePassNo || `GP-${Date.now()}`,
      inspectedBy: scheduleForm.inspectedBy || currentUser?.name || 'Municipal Officer',
      notes: scheduleForm.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.addTakeoffRecord(newRecord);
    setTakeoffs(storageService.getTakeoffRecords());
    setIsScheduleModalOpen(false);
    if (onClearPreselected) onClearPreselected();
    onRefresh();
  };

  const handleUpdateStatus = (record: SwineTakeoffRecord, newStatus: SwineTakeoffRecord['status']) => {
    const updated = { ...record, status: newStatus };
    storageService.updateTakeoffRecord(updated);
    
    // If completed (sold), also update swine status in registry
    if (newStatus === 'completed') {
      const foundSwine = swineList.find(s => s.id === record.swineId || s.earTagNo === record.earTagNo);
      if (foundSwine) {
        storageService.updateSwineRecord({ ...foundSwine, status: 'sold', readyToSell: false });
      }
    }
    
    setTakeoffs(storageService.getTakeoffRecords());
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this take-off dispatch record?')) {
      storageService.deleteTakeoffRecord(id);
      setTakeoffs(storageService.getTakeoffRecords());
      onRefresh();
    }
  };

  // Filtered takeoffs
  const filteredTakeoffs = takeoffs.filter(t => {
    const matchesSearch =
      t.earTagNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.buyerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.gatePassNo || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary counts
  const clearedCount = takeoffs.filter(t => t.status === 'cleared').length;
  const inTransitCount = takeoffs.filter(t => t.status === 'in_transit').length;
  const completedCount = takeoffs.filter(t => t.status === 'completed').length;
  const totalValue = takeoffs
    .filter(t => t.status !== 'cancelled')
    .reduce((acc, t) => acc + (t.estimatedPricePhp || (t.weightKg * 220)), 0);

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Swine Ready for Take-Off & Dispatch
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Official gate pass issuance, livestock transport vehicle disinfection clearances, and liveweight transit tracking for Hinunangan market-ready hogs dispatched to abattoirs and regional buyers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setScheduleForm({
                  destination: 'Hinunangan Municipal Abattoir, Poblacion',
                  scheduledDate: new Date().toISOString().split('T')[0],
                  scheduledTime: '05:30 AM',
                  status: 'scheduled',
                  vehicleDisinfected: true,
                  asfZoneCleared: true,
                  earTagVerified: true,
                  gatePassNo: `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                  inspectedBy: currentUser?.name || 'Municipal Livestock Inspector',
                });
                setIsScheduleModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-emerald-950 font-black text-xs sm:text-sm flex items-center gap-2 transition shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-900" />
              <span>Schedule Swine Take-Off</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-800/60 text-xs">
          <div className="bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-800/40">
            <span className="text-emerald-300 font-medium block">Ready in Hinunangan Pens</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-white">{readyHogs.length}</span>
              <span className="text-[10px] text-emerald-400">hogs (≥75kg)</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Market-weight certified</span>
          </div>

          <div className="bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-800/40">
            <span className="text-emerald-300 font-medium block">Cleared for Dispatch</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-emerald-400">{clearedCount}</span>
              <span className="text-[10px] text-stone-400">heads passed</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Disinfected & gate pass issued</span>
          </div>

          <div className="bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-800/40">
            <span className="text-emerald-300 font-medium block">In-Transit Right Now</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-amber-300">{inTransitCount}</span>
              <span className="text-[10px] text-stone-400">trucks/heads</span>
            </div>
            <span className="text-[10px] text-amber-300/80 mt-0.5 block">On route to abattoir</span>
          </div>

          <div className="bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-800/40">
            <span className="text-emerald-300 font-medium block">Total Takeoff Value</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-white">₱{totalValue.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Estimated liveweight return</span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('takeoffs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'takeoffs'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Take-Off & Dispatch Slips ({takeoffs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ready_hogs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'ready_hogs'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Ready Finisher Registry ({readyHogs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
            >
              <option value="all">All Dispatch Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="cleared">Cleared (Gate Pass Issued)</option>
              <option value="in_transit">In-Transit</option>
              <option value="completed">Completed / Processed</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Ear Tag, Farmer Name, Gate Pass No, or Buyer..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'takeoffs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTakeoffs.length === 0 ? (
            <div className="col-span-2 py-16 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
              No take-off dispatch records found. Click "Schedule Swine Take-Off" to create one.
            </div>
          ) : (
            filteredTakeoffs.map(record => {
              const statusColor =
                record.status === 'cleared'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : record.status === 'in_transit'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : record.status === 'completed'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-stone-100 text-stone-700 border-stone-300';

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-stone-900 text-base">
                            {record.earTagNo}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {record.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Farmer: <strong>{record.farmerName}</strong> • Brgy. {record.barangay}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-1 rounded-md font-semibold shrink-0">
                        {record.gatePassNo}
                      </span>
                    </div>

                    {/* Weight & Financial Metrics */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">Liveweight</span>
                        <span className="text-sm font-extrabold text-emerald-950">{record.weightKg} kg</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">Est. Market Value</span>
                        <span className="text-sm font-extrabold text-emerald-950">
                          ₱{(record.estimatedPricePhp || (record.weightKg * 220)).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">Scheduled</span>
                        <span className="text-xs font-bold text-stone-800">
                          {record.scheduledDate} ({record.scheduledTime})
                        </span>
                      </div>
                    </div>

                    {/* Dispatch & Logistics Details */}
                    <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">Destination: <strong>{record.destination}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">Vehicle: <strong>{record.vehiclePlateNo || 'Pending'}</strong> {record.driverName ? `(Driver: ${record.driverName})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">Buyer: <strong>{record.buyerName || 'Local Meat Consolidator'}</strong></span>
                      </div>
                    </div>

                    {/* Inspection Checklist Badges */}
                    <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap gap-2 text-[11px]">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                        record.vehicleDisinfected ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Tire Disinfected</span>
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                        record.asfZoneCleared ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'
                      }`}>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>ASF Green Zone</span>
                      </span>

                      {record.vhcNumber && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-mono">
                          <FileCheck className="w-3 h-3 text-blue-600" />
                          <span>{record.vhcNumber}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer & Workflow Controls */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => setPrintingRecord(record)}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-600" />
                      <span>Print Gate Pass</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {record.status === 'scheduled' && (
                        <button
                          onClick={() => handleUpdateStatus(record, 'cleared')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Issue Clearance
                        </button>
                      )}

                      {record.status === 'cleared' && (
                        <button
                          onClick={() => handleUpdateStatus(record, 'in_transit')}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Mark In-Transit
                        </button>
                      )}

                      {record.status === 'in_transit' && (
                        <button
                          onClick={() => handleUpdateStatus(record, 'completed')}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Confirm Slaughter / Sold
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete Take-Off Record"
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
      ) : (
        /* Ready Finisher Registry Table */
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Market-Ready Finishers in Hinunangan</h3>
              <p className="text-xs text-stone-500">Liveweight 75kg+ ready for dispatch to abattoir or buyers</p>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {readyHogs.map(s => (
              <div key={s.id} className="p-4 hover:bg-stone-50 transition flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 text-sm">{s.earTagNo}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {s.weightKg} kg
                    </span>
                    <span className="text-stone-500">Brgy. {s.barangay}</span>
                  </div>
                  <p className="text-stone-600 text-[11px] mt-0.5">
                    Farmer: <strong>{s.farmerName}</strong> • {s.breed} • Est. Value: <strong>₱{(s.weightKg * 220).toLocaleString()}</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleSelectSwine(s);
                    setIsScheduleModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch This Swine</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Schedule Take-Off */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Schedule Swine Take-Off & Gate Pass</h3>
                <p className="text-xs text-emerald-200">
                  Veterinary biosurveillance transit inspection and dispatch clearance
                </p>
              </div>
              <button
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  if (onClearPreselected) onClearPreselected();
                }}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTakeoff} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Select Registered Swine */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Select Market-Ready Swine *</label>
                <select
                  value={scheduleForm.swineId || ''}
                  onChange={e => {
                    const s = swineList.find(item => item.id === e.target.value);
                    if (s) handleSelectSwine(s);
                  }}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                  required
                >
                  <option value="">-- Choose a market-ready hog --</option>
                  {readyHogs.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.earTagNo} • {s.weightKg} kg • Brgy. {s.barangay} ({s.farmerName})
                    </option>
                  ))}
                </select>
              </div>

              {scheduleForm.earTagNo && (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                  <div className="font-bold text-stone-900">Selected: {scheduleForm.earTagNo}</div>
                  <div className="text-stone-600">
                    Farmer: {scheduleForm.farmerName} • Brgy. {scheduleForm.barangay} • Liveweight: {scheduleForm.weightKg} kg
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Destination *</label>
                  <input
                    type="text"
                    value={scheduleForm.destination || ''}
                    onChange={e => setScheduleForm({ ...scheduleForm, destination: e.target.value })}
                    placeholder="e.g. Hinunangan Municipal Abattoir, Poblacion"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Buyer / Consolidator Name *</label>
                  <input
                    type="text"
                    value={scheduleForm.buyerName || ''}
                    onChange={e => setScheduleForm({ ...scheduleForm, buyerName: e.target.value })}
                    placeholder="e.g. Rolando Uy Livestock Trading"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Scheduled Departure Date *</label>
                  <input
                    type="date"
                    value={scheduleForm.scheduledDate}
                    onChange={e => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Scheduled Departure Time *</label>
                  <input
                    type="text"
                    value={scheduleForm.scheduledTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                    placeholder="05:30 AM"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    value={scheduleForm.vehiclePlateNo || ''}
                    onChange={e => setScheduleForm({ ...scheduleForm, vehiclePlateNo: e.target.value })}
                    placeholder="e.g. HAB-4921 (Isuzu Elf Dropside)"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Driver Name & Contact</label>
                  <input
                    type="text"
                    value={scheduleForm.driverName || ''}
                    onChange={e => setScheduleForm({ ...scheduleForm, driverName: e.target.value })}
                    placeholder="e.g. Danilo Alcantara (0917-xxx-xxxx)"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Clearance Inspection Checklist */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                <h4 className="font-bold text-xs text-emerald-950 uppercase">
                  Biosecurity Pre-Takeoff Verification
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.asfZoneCleared ?? true}
                      onChange={e => setScheduleForm({ ...scheduleForm, asfZoneCleared: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium">ASF Green Zone</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.vehicleDisinfected ?? true}
                      onChange={e => setScheduleForm({ ...scheduleForm, vehicleDisinfected: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium">Tire Disinfected</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.earTagVerified ?? true}
                      onChange={e => setScheduleForm({ ...scheduleForm, earTagVerified: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium">Ear Tag Matched</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Save & Issue Gate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT GATE PASS MODAL */}
      {printingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 p-8 space-y-6">
            {/* Republic Header */}
            <div className="text-center space-y-1 border-b-2 border-emerald-900 pb-4">
              <div className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">
                Republic of the Philippines • Province of Southern Leyte
              </div>
              <h2 className="text-lg font-black text-stone-900 uppercase">
                Municipality of Hinunangan
              </h2>
              <div className="text-xs font-bold text-emerald-800">
                Municipal Agriculture Office • Livestock & Veterinary Section
              </div>
              <div className="text-sm font-black text-stone-900 uppercase tracking-widest pt-2 bg-stone-100 py-1 rounded-lg">
                OFFICIAL LIVESTOCK TAKE-OFF & GATE PASS
              </div>
              <div className="text-xs font-mono font-bold text-stone-600">
                Gate Pass No: {printingRecord.gatePassNo}
              </div>
            </div>

            {/* Slip Information */}
            <div className="space-y-3 text-xs text-stone-800">
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-500 block">Ear Tag Number:</span>
                  <span className="font-mono font-black text-stone-900 text-sm">{printingRecord.earTagNo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Certified Liveweight:</span>
                  <span className="font-black text-emerald-900 text-sm">{printingRecord.weightKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Farmer / Origin:</span>
                  <span className="font-bold">{printingRecord.farmerName}</span>
                  <span className="text-[10px] text-stone-500 block">Brgy. {printingRecord.barangay}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Authorized Destination:</span>
                  <span className="font-bold">{printingRecord.destination}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Hauler / Vehicle Plate:</span>
                  <span className="font-mono font-bold">{printingRecord.vehiclePlateNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Buyer Consolidator:</span>
                  <span className="font-bold">{printingRecord.buyerName}</span>
                </div>
              </div>

              {/* Security Clearances */}
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-[11px] space-y-1">
                <div className="font-bold text-emerald-900">Biosecurity & Veterinary Attestation:</div>
                <div>✓ Animal originates from certified Green ASF Biosurveillance Zone.</div>
                <div>✓ Transport vehicle undergone mandatory tire disinfection at municipal staging station.</div>
                <div>✓ Live animal physical inspection confirmed free of communicable symptoms.</div>
                <div className="font-mono text-emerald-800 pt-1">
                  VHC Reference No: <strong>{printingRecord.vhcNumber || 'VHC-CLEARANCE-OK'}</strong>
                </div>
              </div>
            </div>

            {/* Signature row */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-stone-200 text-center text-xs">
              <div>
                <div className="font-bold text-stone-900 underline uppercase">{printingRecord.inspectedBy}</div>
                <div className="text-[10px] text-stone-500">Livestock Quarantine Inspector</div>
              </div>
              <div>
                <div className="font-bold text-stone-900 underline uppercase">ENGR. ARNEL M. VASQUEZ</div>
                <div className="text-[10px] text-stone-500">Municipal Agriculturist (MAO)</div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
              <button
                onClick={() => setPrintingRecord(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Gate Pass Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
