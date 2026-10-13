/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Navbar } from './components/Navbar';
import { AssessmentTable } from './components/AssessmentTable';
import { QuickMarketViewTable } from './components/QuickMarketViewTable';
import { AssessmentSummaryCard } from './components/AssessmentSummaryCard';
import { DEFAULT_ASSESSMENT, SAMPLE_PROPERTIES } from './data/defaultAssessment';
import { MarketAssessmentResult, GoogleUser } from './types';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/auth';
import { createAssessmentGoogleSheet } from './lib/sheetsService';
import { exportAssessmentToPdf } from './lib/pdfService';
import { BigGuyStorageLogo } from './components/BigGuyStorageLogo';
import {
  CheckCircle,
  AlertCircle,
  ExternalLink,
  MapPin,
  Info,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [assessment, setAssessment] = useState<MarketAssessmentResult>(DEFAULT_ASSESSMENT);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [lastCreatedSheetUrl, setLastCreatedSheetUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Custom logo state persisted to localStorage
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('property_assessment_custom_logo');
    } catch {
      return null;
    }
  });

  const handleUploadLogo = (dataUrl: string) => {
    setCustomLogo(dataUrl);
    try {
      localStorage.setItem('property_assessment_custom_logo', dataUrl);
    } catch (e) {
      console.warn('Could not save logo to localStorage:', e);
    }
    showToast('Logo updated successfully (2" × 1").');
  };

  const handleResetLogo = () => {
    setCustomLogo(null);
    try {
      localStorage.removeItem('property_assessment_custom_logo');
    } catch (e) {
      console.warn('Could not remove logo from localStorage:', e);
    }
    showToast('Reset to default logo.');
  };

  // Initialize Firebase Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showToast('Successfully signed in with Google!');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setErrorMsg(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      showToast('Signed out of Google account.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Run live market research against property address
  const handleRunResearch = async (address: string) => {
    if (!address.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/assess-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      const result: MarketAssessmentResult = await res.json();
      setAssessment(result);
      showToast(`Market assessment complete for: ${address.slice(0, 30)}...`);
    } catch (err: any) {
      console.error('Assessment error:', err);
      setErrorMsg(
        err.message || 'Could not retrieve market assessment data. Please check your address or connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Create Google Sheet in Google Drive via Google Sheets API
  const handleCreateGoogleSheet = async () => {
    setErrorMsg(null);

    // If not signed in yet, prompt sign-in first
    let currentToken = token || (await getAccessToken());
    if (!currentToken) {
      try {
        setIsLoggingIn(true);
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setToken(result.accessToken);
          currentToken = result.accessToken;
        } else {
          return;
        }
      } catch (err: any) {
        setErrorMsg('Sign-in required to create Google Sheets in your Google Drive.');
        setIsLoggingIn(false);
        return;
      } finally {
        setIsLoggingIn(false);
      }
    }

    if (!currentToken) {
      setErrorMsg('No Google access token available.');
      return;
    }

    setIsCreatingSheet(true);
    try {
      const result = await createAssessmentGoogleSheet(assessment, currentToken);
      setLastCreatedSheetUrl(result.spreadsheetUrl);
      showToast('Google Sheet created successfully in your Google Drive!');
      window.open(result.spreadsheetUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Google Sheet error:', err);
      if (err.message && (err.message.includes('expired') || err.message.includes('401') || err.message.includes('authorization'))) {
        try {
          showToast('Refreshing Google sign-in session...');
          const newAuth = await googleSignIn();
          if (newAuth?.accessToken) {
            setUser(newAuth.user);
            setToken(newAuth.accessToken);
            const retryResult = await createAssessmentGoogleSheet(assessment, newAuth.accessToken);
            setLastCreatedSheetUrl(retryResult.spreadsheetUrl);
            showToast('Google Sheet created successfully in your Google Drive!');
            window.open(retryResult.spreadsheetUrl, '_blank', 'noopener,noreferrer');
            return;
          }
        } catch (reAuthErr: any) {
          console.warn('Re-auth error:', reAuthErr);
        }
      }
      setErrorMsg(
        err.message || 'Failed to create Google Sheet. Please check Google permissions or try again in a moment.'
      );
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Download High-Resolution PNG format
  const handleDownloadPng = async () => {
    if (!reportContainerRef.current) {
      showToast('Report container not ready.');
      return;
    }

    setIsGeneratingPng(true);
    showToast('Generating high-resolution PNG image...');

    try {
      const element = reportContainerRef.current;
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
        skipFonts: true,
      });

      const link = document.createElement('a');
      const sanitizedAddress = assessment.propertyAddress
        .slice(0, 25)
        .replace(/[^a-z0-9]/gi, '_');
      link.download = `bigguy-storage-market-assessment-${sanitizedAddress}.png`;
      link.href = dataUrl;
      link.click();
      showToast('PNG image downloaded successfully!');
    } catch (err: any) {
      console.error('PNG capture error:', err);
      setErrorMsg(`Failed to generate PNG image: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Download CSV format
  const handleDownloadCsv = () => {
    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
    let csv = `KPI,Acceptable Region,"Market Assessment for: ${assessment.propertyAddress.replace(/"/g, '""')}",Source Link\n`;
    assessment.kpis.forEach((item) => {
      csv += `${escapeCsv(item.kpi)},${escapeCsv(item.acceptableRegion)},${escapeCsv(
        `${item.measuredValue} [${item.status}] - ${item.notes || ''}`
      )},${escapeCsv(item.sourceUrl)}\n`;
    });

    if (assessment.quickMarketView?.length) {
      csv += `\n"QUICK MARKET VIEW (5-MILE RADIUS)","Industry Benchmark","Measured 5-Mile Value & Notes","Source Link"\n`;
      assessment.quickMarketView.forEach((item) => {
        csv += `${escapeCsv(item.kpi)},${escapeCsv(item.benchmark)},${escapeCsv(
          `${item.measuredValue} [${item.status}] - ${item.notes || ''}`
        )},${escapeCsv(item.sourceUrl)}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market-assessment-${assessment.propertyAddress.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded successfully.');
  };

  // Download PDF format
  const handleDownloadPdf = () => {
    try {
      exportAssessmentToPdf(assessment, customLogo);
      showToast('PDF report generated and downloaded.');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setErrorMsg('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Navigation Header with 2in x 1in Logo & Controls */}
      <Navbar
        user={user}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        lastCreatedSheetUrl={lastCreatedSheetUrl}
        customLogo={customLogo}
        onUploadLogo={handleUploadLogo}
        onResetLogo={handleResetLogo}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error Alert if any */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Notice: </span>
              {errorMsg}
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Sample Property Chips */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-600" />
            Sample Locations:
          </span>
          {SAMPLE_PROPERTIES.map((addr) => (
            <button
              key={addr}
              type="button"
              onClick={() => handleRunResearch(addr)}
              disabled={isLoading}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                assessment.propertyAddress === addr
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {addr.split(',')[0]} ({addr.split(',')[1]?.trim()})
            </button>
          ))}
        </div>

        {/* Assessment Viability Card & Sheet Launcher */}
        <AssessmentSummaryCard
          assessment={assessment}
          user={user}
          isCreatingSheet={isCreatingSheet}
          onCreateGoogleSheet={handleCreateGoogleSheet}
          lastCreatedSheetUrl={lastCreatedSheetUrl}
          onDownloadPng={handleDownloadPng}
          onDownloadCsv={handleDownloadCsv}
          onDownloadPdf={handleDownloadPdf}
          isGeneratingPng={isGeneratingPng}
        />

        {/* Report Content Container (captured for high-res PNG export) */}
        <div ref={reportContainerRef} className="space-y-6 bg-slate-50 p-2 sm:p-4 rounded-xl">
          {/* Report Branded Header Card (captured into PNG) */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div
                className="flex items-center justify-center p-1 bg-white rounded-lg shrink-0 border border-slate-100"
                style={{ width: '2in', height: '1in' }}
              >
                {customLogo ? (
                  <img
                    src={customLogo}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                    style={{ width: '2in', height: '1in' }}
                  />
                ) : (
                  <BigGuyStorageLogo width="100%" height="100%" />
                )}
              </div>
              <div className="pl-4 border-l border-slate-200">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Market Feasibility Assessment Report
                </h2>
                <p className="text-xs font-medium text-emerald-700 mt-0.5">
                  {assessment.propertyAddress}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  5-Mile Trade Ring Analysis • Supply & Rate Benchmarks
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right text-[11px] text-slate-400 shrink-0">
              <p className="font-semibold text-slate-600">Property Assessment Dossier</p>
              <p>Generated: {new Date(assessment.assessedAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* 1. The 3-Column Assessment Table with Editable Address Column */}
          <AssessmentTable
            assessment={assessment}
            onUpdateAssessment={setAssessment}
            onRunResearch={handleRunResearch}
            isLoading={isLoading}
          />

          {/* 2. Below the table: Quick Market View Table (12 KPIs within 5-mile radius) */}
          <QuickMarketViewTable
            assessment={assessment}
            onUpdateAssessment={setAssessment}
          />
        </div>

        {/* Informational Guidance Footer */}
        <div className="mt-8 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              All Location Benchmarks and 5-Mile Quick Market View KPIs are validated against official DOT, Census, Radius+, and Yardi Matrix data sources. Links to primary records are included in the results.
            </span>
          </div>
          {lastCreatedSheetUrl && (
            <a
              href={lastCreatedSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold shrink-0"
            >
              <span>View Google Sheet in Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
