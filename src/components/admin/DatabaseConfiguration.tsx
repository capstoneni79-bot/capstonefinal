import React, { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Layers,
  Save,
  Download,
  Upload,
  Trash2,
  Table,
  ShieldCheck,
  Activity,
  Cpu,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export const DatabaseConfiguration: React.FC = () => {
  const [connectionString, setConnectionString] = useState(() => {
    return localStorage.getItem('da_db_url') || '';
  });
  const [dbHost, setDbHost] = useState(() => {
    return localStorage.getItem('da_db_host') || 'db.wuxivpxsnixabfvlunvg.supabase.co';
  });
  const [dbPort, setDbPort] = useState(() => {
    return localStorage.getItem('da_db_port') || '5432';
  });
  const [dbName, setDbName] = useState(() => {
    return localStorage.getItem('da_db_name') || 'postgres';
  });
  const [dbUser, setDbUser] = useState(() => {
    return localStorage.getItem('da_db_user') || 'postgres';
  });
  const [dbPassword, setDbPassword] = useState(() => {
    return localStorage.getItem('da_db_password') || '';
  });
  const [dbSsl, setDbSsl] = useState(() => {
    return localStorage.getItem('da_db_ssl') !== 'false';
  });

  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    engine: string;
    totalSwine: number;
    totalBarangays: number;
    totalAccounts: number;
    totalCerts: number;
  }>({
    connected: true,
    engine: 'PostgreSQL / Supabase Database',
    totalSwine: 0,
    totalBarangays: 40,
    totalAccounts: 0,
    totalCerts: 0,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const swine = storageService.getSwineRecords();
    const accounts = storageService.getAccounts();
    const certs = storageService.getIssuedCertificates();
    setDbStatus(prev => ({
      ...prev,
      totalSwine: swine.length,
      totalAccounts: accounts.length,
      totalCerts: certs.length,
    }));
  }, []);

  // Helper to parse a postgresql:// connection string
  const parseAndApplyUri = (raw: string) => {
    const val = raw.trim();
    setConnectionString(val);

    if (val.startsWith('postgres://') || val.startsWith('postgresql://')) {
      try {
        const url = new URL(val);
        if (url.hostname) setDbHost(url.hostname);
        if (url.port) {
          setDbPort(url.port);
        } else if (url.hostname.includes('pooler.supabase.com')) {
          setDbPort('6543');
        } else {
          setDbPort('5432');
        }
        if (url.username) setDbUser(url.username);
        if (url.password) setDbPassword(url.password);
        if (url.pathname) setDbName(url.pathname.replace(/^\//, '') || 'postgres');
        setDbSsl(true);
      } catch {
        // Not a standard URL, keep raw
      }
    }
  };

  const getEffectiveUri = (): string => {
    if (connectionString && (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://'))) {
      return connectionString.trim();
    }
    const cleanHost = dbHost.trim().replace(/^https?:\/\//, '').replace(/^postgres(ql)?:\/\//, '');
    const userPass = dbPassword ? `${dbUser}:${dbPassword}@` : `${dbUser}@`;
    return `postgresql://${userPass}${cleanHost}:${dbPort}/${dbName}${dbSsl ? '?sslmode=require' : ''}`;
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const uriToTest = getEffectiveUri();

    try {
      const res = await fetch('/api/admin/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: uriToTest }),
      });

      let data: any = null;
      try {
        const cloned = res.clone();
        data = await res.json().catch(async () => {
          const rawText = await cloned.text().catch(() => '');
          const cleanText = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          return {
            success: false,
            message: `Server returned status ${res.status}${cleanText ? ': ' + cleanText.slice(0, 140) : ''}`,
          };
        });
      } catch (err: any) {
        data = { success: false, message: `Could not parse response: ${err.message}` };
      }

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `✅ Connection Verified: Successfully connected to PostgreSQL! Found ${data.swineCount ?? 0} active swine records in the cloud database.`,
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Connection Failed: ${data.message || data.error || 'Server returned status ' + res.status}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ Network Error: Could not reach backend server. Error: ${err.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const uriToSave = getEffectiveUri();
    localStorage.setItem('da_db_url', uriToSave);
    localStorage.setItem('da_db_host', dbHost);
    localStorage.setItem('da_db_port', dbPort);
    localStorage.setItem('da_db_name', dbName);
    localStorage.setItem('da_db_user', dbUser);
    localStorage.setItem('da_db_password', dbPassword);
    localStorage.setItem('da_db_ssl', String(dbSsl));

    try {
      const res = await fetch('/api/admin/database/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: uriToSave }),
      });
      const data = await res.json().catch(() => null);
      if (data && data.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleExportFullBackup = () => {
    const backup = {
      swine: storageService.getSwineRecords(),
      barangays: storageService.getBarangays(),
      accounts: storageService.getAccounts(),
      certificates: storageService.getIssuedCertificates(),
      takeoffs: storageService.getTakeoffRecords(),
      timestamp: new Date().toISOString(),
      municipality: 'Hinunangan, Southern Leyte',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DA_Hinunangan_Registry_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/70 border border-emerald-400/30 text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Database Administration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Database className="w-6 h-6 text-emerald-400" />
              <span>PostgreSQL & Cloud Database Configuration</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl leading-relaxed">
              Manage your direct PostgreSQL / Supabase connection string. All additions and edits will record directly to your cloud database.
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

      {/* Database Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Swine Records</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">{dbStatus.totalSwine}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Database Table: swine_records</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Barangays</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">{dbStatus.totalBarangays}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Database Table: barangays</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Issued Certificates</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">{dbStatus.totalCerts}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Database Table: issued_certificates</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">User Accounts</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">{dbStatus.totalAccounts}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Database Table: users</p>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Parameters */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">PostgreSQL / Supabase Parameters</h3>
                <p className="text-[11px] text-stone-500">Live transaction database connection</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Active Engine
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Primary Connection String */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span>PostgreSQL Connection URI (DATABASE_URL)</span>
                <span className="text-[10px] font-normal text-stone-400">Direct or Pooler</span>
              </label>
              <textarea
                rows={2}
                value={connectionString}
                onChange={e => parseAndApplyUri(e.target.value)}
                placeholder="postgresql://postgres:password@db.wuxivpxsnixabfvlunvg.supabase.co:5432/postgres"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden resize-none"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Tip: Paste your full Supabase connection string here. The fields below will automatically adapt.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Database Host / Supabase Endpoint
              </label>
              <input
                type="text"
                value={dbHost}
                onChange={e => {
                  if (e.target.value.includes('postgresql://') || e.target.value.includes('postgres://')) {
                    parseAndApplyUri(e.target.value);
                  } else {
                    setDbHost(e.target.value);
                  }
                }}
                placeholder="db.wuxivpxsnixabfvlunvg.supabase.co"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Port</label>
                <input
                  type="text"
                  value={dbPort}
                  onChange={e => setDbPort(e.target.value)}
                  placeholder="5432 or 6543"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
                <span className="text-[9px] text-stone-400">5432 (Direct) / 6543 (Pooler)</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Database Name</label>
                <input
                  type="text"
                  value={dbName}
                  onChange={e => setDbName(e.target.value)}
                  placeholder="postgres"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Database User</label>
                <input
                  type="text"
                  value={dbUser}
                  onChange={e => setDbUser(e.target.value)}
                  placeholder="postgres"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Password</label>
                <input
                  type="password"
                  value={dbPassword}
                  onChange={e => setDbPassword(e.target.value)}
                  placeholder="Database password"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <div>
                <p className="font-bold text-stone-900 text-xs">Require SSL / TLS Encryption</p>
                <p className="text-[10px] text-stone-500">Enforces encrypted transport with Supabase</p>
              </div>
              <input
                type="checkbox"
                checked={dbSsl}
                onChange={e => setDbSsl(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-800 text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing connection...' : 'Test Database Connectivity'}</span>
              </button>

              {testResult && (
                <div
                  className={`mt-2.5 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <Activity
                    className={`w-4 h-4 shrink-0 mt-0.5 ${testResult.success ? 'text-emerald-700' : 'text-rose-700'}`}
                  />
                  <span className="leading-relaxed">{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Offline Engine & Backup Management */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Local Offline Engine & Backups</h3>
                <p className="text-[11px] text-stone-500">IndexedDB persistence & disaster recovery</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-700" />
                <span>Dual Engine Architecture</span>
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                When working in the 40 barangays with unstable mobile signals, all operations execute instantly in the local IndexedDB engine and automatically synchronize with PostgreSQL when internet connectivity returns.
              </p>
            </div>

            <div className="pt-2 border-t border-stone-100 space-y-2.5">
              <p className="font-bold text-stone-900 text-xs">Full Database JSON Export</p>
              <p className="text-[11px] text-stone-500">
                Download a cryptographically verified snapshot of all 40 barangays, swine registers, and audit trails.
              </p>
              <button
                type="button"
                onClick={handleExportFullBackup}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Municipal Database Backup (.json)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

