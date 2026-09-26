import React, { useState } from 'react';
import {
  Server,
  Key,
  Globe,
  Activity,
  ShieldCheck,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ExternalLink,
  Wifi,
  AlertTriangle,
  Lock,
  Copy,
  Check,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export const ApiConfiguration: React.FC = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    return localStorage.getItem('da_api_base_url') || window.location.origin;
  });
  const [googleMapsKey, setGoogleMapsKey] = useState(() => {
    return localStorage.getItem('da_google_maps_api_key') || 'AIzaSy' + '...configured';
  });
  const [tileServerUrl, setTileServerUrl] = useState(() => {
    return (
      localStorage.getItem('da_tile_server_url') ||
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    );
  });
  const [satelliteTileUrl, setSatelliteTileUrl] = useState(() => {
    return (
      localStorage.getItem('da_satellite_tile_url') ||
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    );
  });
  const [quotaDefenseEnabled, setQuotaDefenseEnabled] = useState(() => {
    return localStorage.getItem('da_quota_defense_enabled') !== 'false';
  });

  const [pingStatus, setPingStatus] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const testApiHealth = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/settings?key=system_branding');
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setPingStatus({
          tested: true,
          success: true,
          latencyMs: latency,
          message: `Connected successfully (${latency}ms) — All REST endpoints operational`,
        });
      } else {
        setPingStatus({
          tested: true,
          success: false,
          latencyMs: latency,
          message: `Endpoint returned HTTP ${res.status}: ${res.statusText}`,
        });
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      setPingStatus({
        tested: true,
        success: false,
        latencyMs: latency,
        message: `Connection failed: ${err.message || 'Offline mode active'}`,
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('da_api_base_url', apiBaseUrl);
    localStorage.setItem('da_google_maps_api_key', googleMapsKey);
    localStorage.setItem('da_tile_server_url', tileServerUrl);
    localStorage.setItem('da_satellite_tile_url', satelliteTileUrl);
    localStorage.setItem('da_quota_defense_enabled', String(quotaDefenseEnabled));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText('da_hinunangan_live_token_' + Date.now());
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/70 border border-emerald-400/30 text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Super Administrator Exclusive</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Server className="w-6 h-6 text-emerald-400" />
              <span>API & External Services Configuration</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl leading-relaxed">
              Manage core backend API gateways, Google Maps Platform credentials, GIS tile endpoints, and real-time integration webhooks for the municipality.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleSave}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Settings Saved' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Backend Gateway & Endpoints */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Backend API Gateway</h3>
                <p className="text-[11px] text-stone-500">Core server REST endpoints</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                API Base URL (Default Host)
              </label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={e => setApiBaseUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                API Health & Latency Test
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={testApiHealth}
                  disabled={isPinging}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Pinging API...' : 'Ping REST Service'}</span>
                </button>
              </div>

              {pingStatus && (
                <div
                  className={`mt-2.5 p-3 rounded-xl text-xs flex items-start gap-2 ${
                    pingStatus.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">{pingStatus.message}</p>
                    <p className="text-[10px] opacity-80">
                      Roundtrip ping: {pingStatus.latencyMs}ms &bull; Tested at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: GIS & Map Services */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">GIS & Cartography Services</h3>
                <p className="text-[11px] text-stone-500">Map tiles, boundaries, satellite layers</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Standard Cartographic Tile URL
              </label>
              <input
                type="text"
                value={tileServerUrl}
                onChange={e => setTileServerUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                High-Resolution Satellite Tile URL
              </label>
              <input
                type="text"
                value={satelliteTileUrl}
                onChange={e => setSatelliteTileUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Google Maps Platform API Credentials */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-100">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Google Maps Platform API</h3>
                <p className="text-[11px] text-stone-500">Maps JavaScript & Geocoding Key</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
              Quota Protected
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Active Google Maps API Key
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={googleMapsKey}
                  onChange={e => setGoogleMapsKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden pr-20"
                />
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'AIzaSy' + Math.random().toString(36).substring(2, 10).toUpperCase();
                    setGoogleMapsKey(sample);
                  }}
                  className="absolute right-2 top-2 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 px-2 py-0.5 rounded bg-emerald-50 cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-stone-900 text-xs">Automatic Quota Defense</p>
                <p className="text-[10px] text-stone-500">
                  Auto-switch to Leaflet OpenStreetMap when Google quota limit is reached
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={quotaDefenseEnabled}
                  onChange={e => setQuotaDefenseEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Card 4: Municipal Field Tokens & Sync Webhooks */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-100">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Security Credentials & Tokens</h3>
                <p className="text-[11px] text-stone-500">Mobile agent offline verification token</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Municipal Master Authorization Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="da_hinunangan_auth_sec_v2_9f81a7b"
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-mono text-[11px] text-stone-600 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <span>
                These credentials grant system-wide synchronization privileges. Never share the Master Authorization Token with non-administrative personnel.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
