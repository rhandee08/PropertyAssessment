import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Download,
  Image as ImageIcon,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { MarketAssessmentResult, GoogleUser } from '../types';

interface AssessmentSummaryCardProps {
  assessment: MarketAssessmentResult;
  user: GoogleUser | null;
  isCreatingSheet: boolean;
  onCreateGoogleSheet: () => void;
  lastCreatedSheetUrl: string | null;
  onDownloadPng: () => void;
  onDownloadCsv: () => void;
  onDownloadPdf: () => void;
  isGeneratingPng: boolean;
}

export const AssessmentSummaryCard: React.FC<AssessmentSummaryCardProps> = ({
  assessment,
  user,
  isCreatingSheet,
  onCreateGoogleSheet,
  lastCreatedSheetUrl,
  onDownloadPng,
  onDownloadCsv,
  onDownloadPdf,
  isGeneratingPng,
}) => {
  const { passedCount, totalCount, verdict, summaryText } = assessment.overallScore;
  const passRate = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Overall Market Viability Score */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                verdict === 'Viable'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : verdict === 'Caution'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {verdict === 'Viable' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {verdict} Market Viability
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {passedCount} of {totalCount} KPIs Met ({passRate}%)
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">{assessment.propertyAddress}</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-3xl">
            {summaryText}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Assessed: {new Date(assessment.assessedAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span>All 7 target benchmark KPIs validated with source links</span>
          </div>
        </div>

        {/* Right: Actions (Google Sheet creation & exports) */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center min-w-[280px]">
          <button
            type="button"
            onClick={onCreateGoogleSheet}
            disabled={isCreatingSheet}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {isCreatingSheet
                ? 'Creating Google Sheet...'
                : user
                ? 'Make Google Sheet File'
                : 'Sign In & Make Google Sheet'}
            </span>
          </button>

          {lastCreatedSheetUrl && (
            <a
              href={lastCreatedSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <span>Open in Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={onDownloadPdf}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 border border-rose-200 rounded-md text-xs font-medium text-rose-700 bg-rose-50/70 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Download executive PDF report"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={onDownloadPng}
              disabled={isGeneratingPng}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 border border-emerald-300 rounded-md text-xs font-medium text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
              title="Export high-resolution PNG image of the assessment report"
            >
              {isGeneratingPng ? (
                <>
                  <span className="w-3 h-3 border-2 border-emerald-600/40 border-t-emerald-700 rounded-full animate-spin" />
                  <span>PNG...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>PNG</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDownloadCsv}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              title="Download 3-column CSV file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
