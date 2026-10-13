import React from 'react';
import { FileSpreadsheet, LogOut } from 'lucide-react';
import { GoogleUser } from '../types';
import { BigGuyStorageLogo } from './BigGuyStorageLogo';

interface NavbarProps {
  user: GoogleUser | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  lastCreatedSheetUrl: string | null;
  customLogo: string | null;
  onUploadLogo: (dataUrl: string) => void;
  onResetLogo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isLoggingIn,
  onLogin,
  onLogout,
  lastCreatedSheetUrl,
  customLogo,
  onUploadLogo,
  onResetLogo,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onUploadLogo(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 min-h-[110px] flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand: 2in x 1in Logo with interactive change/upload control */}
        <div className="flex items-center gap-6 sm:gap-8">
          <div className="relative group shrink-0">
            <div
              className="flex items-center justify-center p-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shrink-0 shadow-2xs transition-all overflow-hidden cursor-pointer"
              style={{ width: '2in', height: '1in' }}
              title="Click or hover to change logo"
              onClick={() => fileInputRef.current?.click()}
            >
              {customLogo ? (
                <img
                  src={customLogo}
                  alt="Custom Company Logo"
                  className="max-w-full max-h-full object-contain"
                  style={{ width: '2in', height: '1in' }}
                />
              ) : (
                <BigGuyStorageLogo width="100%" height="100%" />
              )}

              {/* Hover overlay for changing logo */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-lg gap-0.5">
                <span className="text-[10px] font-bold tracking-wide uppercase">Change Logo</span>
                <span className="text-[9px] text-slate-200">2" × 1" (PNG/SVG)</span>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* If custom logo is active, show small reset badge */}
            {customLogo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onResetLogo();
                }}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 text-[10px] hover:bg-rose-600 transition-colors shadow-xs"
                title="Reset to default logo"
              >
                ✕
              </button>
            )}
          </div>

          <div className="hidden sm:block pl-6 sm:pl-8 border-l-2 border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                Market Feasibility Platform
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-lime-100 text-lime-900 border border-lime-300">
                5-Mile Radius & Benchmarks
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Self Storage Supply, Rate Intelligence & Location Viability
            </p>
          </div>
        </div>

        {/* Action Controls & Auth */}
        <div className="flex items-center gap-3 shrink-0">
          {lastCreatedSheetUrl && (
            <a
              href={lastCreatedSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Open Recent Google Sheet</span>
              <span className="sm:hidden">Google Sheet</span>
            </a>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-9 h-9 rounded-full border border-slate-200 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.displayName || 'Google Account'}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14-.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign in for Google Sheets'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
