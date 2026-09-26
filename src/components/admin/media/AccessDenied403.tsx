import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface AccessDenied403Props {
  onBackToDashboard: () => void;
  moduleName?: string;
  message?: string;
}

export const AccessDenied403: React.FC<AccessDenied403Props> = ({
  onBackToDashboard,
  moduleName = 'this resource',
  message = 'You do not have permission to access this resource.',
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-3xl mx-auto flex items-center justify-center shadow-inner text-red-600">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black tracking-wide uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>403 FORBIDDEN</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">403 Forbidden</h1>
          <p className="text-sm font-semibold text-stone-700 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-1.5 text-xs text-stone-600">
          <div className="font-bold text-stone-800">Security Authorization Notice:</div>
          <p>
            {moduleName} is strictly reserved for <span className="font-bold text-stone-900">Super Administrator</span> accounts. Regular Admin, Focal Person, and Agent accounts do not have permission to access or modify this resource.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="w-full py-3 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
