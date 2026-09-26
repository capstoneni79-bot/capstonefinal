import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Phone,
  MapPin,
  Tag,
  DollarSign,
  Calendar,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Building,
  ArrowUpDown,
  X,
  Sparkles,
  Layers,
  MessageCircle,
  Info,
  Scale,
  Clock,
  Eye,
} from 'lucide-react';
import { Barangay, SwineRecord } from '../../types';

interface AgentCatalogProps {
  swineList: SwineRecord[];
  barangays: Barangay[];
  onOpenGis?: () => void;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'weight_desc' | 'weight_asc' | 'barangay' | 'eartag';

export const AgentCatalog: React.FC<AgentCatalogProps> = ({ swineList, barangays }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [weightFilter, setWeightFilter] = useState<'all' | '50-75' | '75-90' | '90-110' | '110+'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under15k' | '15k-20k' | '20k-25k' | '25k+'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Selected Swine for Listing Details Modal
  const [activeSwineDetail, setActiveSwineDetail] = useState<SwineRecord | null>(null);

  // Extract unique breeds available in the dataset
  const availableBreeds = useMemo(() => {
    const breeds = new Set<string>();
    swineList.forEach(s => {
      if (s.breed && !s.isArchived) breeds.add(s.breed);
    });
    return Array.from(breeds).sort();
  }, [swineList]);

  // Filter only ready to sell swine
  const filteredListings = useMemo(() => {
    return swineList.filter(s => {
      // Must be active and marked as ready to sell
      if (s.isArchived) return false;
      if (!s.readyToSell && s.status !== 'ready_to_sell') return false;

      // Filter by Barangay
      const itemBg = (s.barangay || '').toLowerCase();
      if (selectedBarangay !== 'all' && itemBg !== selectedBarangay.toLowerCase()) {
        return false;
      }

      // Filter by Breed
      if (selectedBreed !== 'all' && (s.breed || '').toLowerCase() !== selectedBreed.toLowerCase()) {
        return false;
      }

      // Filter by Weight
      if (weightFilter === '50-75' && (s.weightKg < 50 || s.weightKg > 75)) return false;
      if (weightFilter === '75-90' && (s.weightKg < 75 || s.weightKg > 90)) return false;
      if (weightFilter === '90-110' && (s.weightKg < 90 || s.weightKg > 110)) return false;
      if (weightFilter === '110+' && s.weightKg < 110) return false;

      // Filter by Price
      const price = s.estimatedPricePhp || 0;
      if (priceFilter === 'under15k' && price >= 15000) return false;
      if (priceFilter === '15k-20k' && (price < 15000 || price > 20000)) return false;
      if (priceFilter === '20k-25k' && (price < 20000 || price > 25000)) return false;
      if (priceFilter === '25k+' && price < 25000) return false;

      // Live search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTag = (s.earTagNo || '').toLowerCase().includes(q);
        const matchesFarmer = (s.farmerName || '').toLowerCase().includes(q);
        const matchesBg = itemBg.includes(q);
        const matchesBreed = (s.breed || '').toLowerCase().includes(q);
        const matchesSitio = (s.sitio || '').toLowerCase().includes(q);
        if (!matchesTag && !matchesFarmer && !matchesBg && !matchesBreed && !matchesSitio) {
          return false;
        }
      }

      return true;
    });
  }, [swineList, selectedBarangay, selectedBreed, weightFilter, priceFilter, searchTerm]);

  // Sorted listings
  const sortedListings = useMemo(() => {
    return [...filteredListings].sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'price_asc') {
        return (a.estimatedPricePhp || 0) - (b.estimatedPricePhp || 0);
      }
      if (sortBy === 'price_desc') {
        return (b.estimatedPricePhp || 0) - (a.estimatedPricePhp || 0);
      }
      if (sortBy === 'weight_desc') {
        return b.weightKg - a.weightKg;
      }
      if (sortBy === 'weight_asc') {
        return a.weightKg - b.weightKg;
      }
      if (sortBy === 'barangay') {
        return (a.barangay || '').localeCompare(b.barangay || '');
      }
      if (sortBy === 'eartag') {
        return (a.earTagNo || '').localeCompare(b.earTagNo || '');
      }
      return 0;
    });
  }, [filteredListings, sortBy]);

  const totalMarketValue = filteredListings.reduce((acc, s) => acc + (s.estimatedPricePhp || 0), 0);
  const totalWeight = filteredListings.reduce((acc, s) => acc + s.weightKg, 0);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedBarangay('all');
    setSelectedBreed('all');
    setWeightFilter('all');
    setPriceFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedBarangay !== 'all' ||
    selectedBreed !== 'all' ||
    weightFilter !== 'all' ||
    priceFilter !== 'all';

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header Banner - Clean, informative view for meat traders and agents */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 text-white p-6 sm:p-7 rounded-3xl border border-amber-800/40 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Licensed Meat Trader & Agent Portal</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs font-bold">
            Live Municipal Market Listings
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Ready-to-Sell Swine in Hinunangan
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-3xl leading-relaxed">
            Direct farmer listings verified by DA Agricultural Extension Workers. Swine are certified healthy with official biosecurity inspection clearance for commercial slaughter and trade.
          </p>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 block">Available Heads</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-950">
              {filteredListings.length}
            </span>
            <span className="text-xs font-bold text-stone-500">Heads</span>
          </div>
          <span className="text-[11px] text-stone-400 block mt-0.5">Ready for slaughter / immediate takeoff</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 block">Combined Live Weight</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-stone-900">
              {totalWeight.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-stone-500">kg</span>
          </div>
          <span className="text-[11px] text-stone-400 block mt-0.5">
            Average {Math.round(totalWeight / (filteredListings.length || 1))} kg / head
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 block">Estimated Market Value</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">
              ₱{totalMarketValue.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-stone-400 block mt-0.5">Based on prevailing municipal rate</span>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        {/* Search & Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Live Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search ear tag, farmer/raiser, breed, sitio, or barangay..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-stone-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/50 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="newest">Sort: Newest Listings</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
              <option value="weight_desc">Sort: Weight (Heaviest First)</option>
              <option value="weight_asc">Sort: Weight (Lightest First)</option>
              <option value="barangay">Sort: Barangay (A-Z)</option>
              <option value="eartag">Sort: Ear Tag No.</option>
            </select>
          </div>
        </div>

        {/* Category Filters Row (Barangay, Breed, Weight, Price) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-100 text-xs">
          {/* Barangay Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Barangay</label>
            <select
              value={selectedBarangay}
              onChange={e => setSelectedBarangay(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">All Barangays ({barangays.length})</option>
              {barangays.map(b => (
                <option key={b.id} value={b.name}>
                  Brgy. {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Breed Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Swine Breed</label>
            <select
              value={selectedBreed}
              onChange={e => setSelectedBreed(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">All Breeds</option>
              {availableBreeds.map(breed => (
                <option key={breed} value={breed}>
                  {breed}
                </option>
              ))}
            </select>
          </div>

          {/* Weight Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Live Weight</label>
            <select
              value={weightFilter}
              onChange={e => setWeightFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">Any Weight</option>
              <option value="50-75">Grower Grade (50 – 75 kg)</option>
              <option value="75-90">Slaughter Grade (75 – 90 kg)</option>
              <option value="90-110">Prime Finishers (90 – 110 kg)</option>
              <option value="110+">Heavy Weight (110+ kg)</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Price Range</label>
            <select
              value={priceFilter}
              onChange={e => setPriceFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">Any Price</option>
              <option value="under15k">Under ₱15,000</option>
              <option value="15k-20k">₱15,000 – ₱20,000</option>
              <option value="20k-25k">₱20,000 – ₱25,000</option>
              <option value="25k+">₱25,000 & Above</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
            <span>
              Showing <strong>{sortedListings.length}</strong> matching listings
            </span>
            <button
              onClick={clearAllFilters}
              className="text-amber-800 hover:text-amber-900 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Swine Listings Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedListings.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-stone-200 text-stone-400 space-y-3">
            <Info className="w-10 h-10 mx-auto text-stone-300" />
            <p className="font-bold text-stone-600 text-sm">No ready-to-sell swine match your criteria.</p>
            <p className="text-xs text-stone-400">Try adjusting your filters or resetting the search query.</p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          sortedListings.map(swine => (
            <div
              key={swine.id}
              className="bg-white rounded-3xl border border-stone-200 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Image Container with Badge Overlays */}
                <div
                  className="relative h-48 w-full bg-stone-900 overflow-hidden cursor-pointer"
                  onClick={() => setActiveSwineDetail(swine)}
                >
                  <img
                    src={swine.photoUrl || '/icon.svg'}
                    alt={`Swine ${swine.earTagNo}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-95 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  {/* Ear Tag Number Badge */}
                  <div className="absolute top-3 left-3 bg-amber-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-xl shadow-md border border-white/30 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{swine.earTagNo}</span>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white font-black text-xs px-3 py-1 rounded-xl border border-white/20">
                    ₱{(swine.estimatedPricePhp || 0).toLocaleString()}
                  </div>

                  {/* Quick View Button Hint */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 text-stone-900 font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> View Full Details
                    </span>
                  </div>
                </div>

                {/* Swine Specifications */}
                <div className="p-5 space-y-3.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-stone-900 text-base leading-tight">
                        {swine.breed || 'Commercial Swine'}
                      </h3>
                      <p className="text-stone-500 text-[11px] flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Brgy. {swine.barangay}, Hinunangan</span>
                      </p>
                    </div>
                    <span className="font-black text-sm text-stone-900 bg-stone-100 px-2.5 py-1 rounded-xl shrink-0">
                      {swine.weightKg} kg
                    </span>
                  </div>

                  {/* Farmer / Raiser Information exposed for traders */}
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">Registered Raiser:</span>
                      <strong className="text-stone-900 font-bold">{swine.farmerName}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">Farm Scale:</span>
                      <span className="capitalize font-medium text-stone-700">{swine.farmType || 'Backyard'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">Target Date:</span>
                      <span className="text-amber-900 font-bold">{swine.targetSellDate || 'Ready for Pickup'}</span>
                    </div>
                  </div>

                  {/* Biosecurity Guarantee */}
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ASF Safe Verified • Veterinary Inspected</span>
                  </div>
                </div>
              </div>

              {/* Trader Actions: Call Raiser, SMS, or Open Details (STRICT VIEW-ONLY: NO EDIT/MODIFY) */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/70 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {swine.farmerContact ? (
                    <>
                      <a
                        href={`tel:${swine.farmerContact}`}
                        className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Raiser</span>
                      </a>
                      <a
                        href={`sms:${swine.farmerContact}?body=Good%20day%20${encodeURIComponent(
                          swine.farmerName
                        )},%20I%20am%20interested%20in%20your%20ready-to-sell%20swine%20(Ear%20Tag:%20${encodeURIComponent(
                          swine.earTagNo
                        )})%20listed%20on%20DA%20Hinunangan.`}
                        className="py-2.5 px-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send SMS</span>
                      </a>
                    </>
                  ) : (
                    <div className="col-span-2 text-center text-stone-500 text-[11px] py-1 bg-stone-100 rounded-xl">
                      Contact MAO Desk: +63 (053) 589-2041
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSwineDetail(swine)}
                  className="w-full py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs border border-stone-200 transition cursor-pointer"
                >
                  View Full Listing Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Listing Details Modal (Strict View-Only Modal for Traders) */}
      {activeSwineDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 text-xs animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg text-xs">
                  {activeSwineDetail.earTagNo}
                </span>
                <h3 className="font-black text-stone-900 text-base">Swine Listing Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSwineDetail(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Photo View */}
              <div className="relative h-64 w-full bg-stone-900 rounded-2xl overflow-hidden shadow-inner">
                <img
                  src={activeSwineDetail.photoUrl || '/icon.svg'}
                  alt={`Swine ${activeSwineDetail.earTagNo}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1 rounded-xl">
                  Breed: <strong>{activeSwineDetail.breed || 'Standard Commercial'}</strong>
                </div>
                <div className="absolute bottom-3 right-3 bg-emerald-700 text-white font-black text-sm px-3.5 py-1 rounded-xl shadow-md">
                  ₱{(activeSwineDetail.estimatedPricePhp || 0).toLocaleString()}
                </div>
              </div>

              {/* Two Column Grid Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Physical & Market Details */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 border-b pb-2 border-stone-200">
                    <Scale className="w-4 h-4 text-amber-700" />
                    <span>Physical & Weight Specifications</span>
                  </h4>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Live Weight:</span>
                    <strong className="text-stone-900 font-bold">{activeSwineDetail.weightKg} kg</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Sex / Gender:</span>
                    <span className="font-semibold text-stone-800 capitalize">{activeSwineDetail.gender || 'Barrow / Castrated'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Age:</span>
                    <span className="font-semibold text-stone-800">{activeSwineDetail.ageMonths ? `${activeSwineDetail.ageMonths} Months` : 'Market Age'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Target Availability:</span>
                    <span className="font-bold text-amber-900">{activeSwineDetail.targetSellDate || 'Immediate Takeoff'}</span>
                  </div>
                </div>

                {/* Farmer & Location Details for Trader */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 border-b pb-2 border-stone-200">
                    <Building className="w-4 h-4 text-emerald-700" />
                    <span>Farmer & Location Details</span>
                  </h4>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Farmer / Raiser:</span>
                    <strong className="text-stone-900 font-bold">{activeSwineDetail.farmerName}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Barangay:</span>
                    <span className="font-semibold text-stone-800">Brgy. {activeSwineDetail.barangay}, Hinunangan</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Sitio / Zone:</span>
                    <span className="font-semibold text-stone-800">{activeSwineDetail.sitio || 'Purok Center'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Farm Scale:</span>
                    <span className="capitalize font-semibold text-stone-800">{activeSwineDetail.farmType || 'Backyard Raiser'}</span>
                  </div>
                </div>
              </div>

              {/* Biosecurity & Health Verification Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>DA Biosecurity & Veterinary Clearance</span>
                </div>
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  This swine is registered in the Municipal Swine Registry and monitored by the Local Focal Person for Barangay {activeSwineDetail.barangay}. Certified free from ASF symptoms and eligible for transport permit upon purchase.
                </p>
              </div>

              {/* Direct Raiser Contact Bar */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-xs">Direct Raiser Contact</span>
                  <span className="text-amber-800 font-mono font-bold">{activeSwineDetail.farmerContact || 'MAO Referral'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeSwineDetail.farmerContact && (
                    <>
                      <a
                        href={`tel:${activeSwineDetail.farmerContact}`}
                        className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call Raiser ({activeSwineDetail.farmerContact})</span>
                      </a>
                      <a
                        href={`sms:${activeSwineDetail.farmerContact}?body=Good%20day%20${encodeURIComponent(
                          activeSwineDetail.farmerName
                        )},%20I%20am%20contacting%20you%20regarding%20Ear%20Tag%20${encodeURIComponent(
                          activeSwineDetail.earTagNo
                        )}%20ready-to-sell%20swine.`}
                        className="py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Send Text Message</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSwineDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
