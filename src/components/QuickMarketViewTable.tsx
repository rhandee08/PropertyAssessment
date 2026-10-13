import React, { useState } from 'react';
import {
  Store,
  DollarSign,
  Users,
  Layers,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
  Edit2,
  Check,
  Compass,
  Building,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { QuickMarketKPIItem, MarketAssessmentResult } from '../types';

interface QuickMarketViewTableProps {
  assessment: MarketAssessmentResult;
  onUpdateAssessment: (updated: MarketAssessmentResult) => void;
}

export const QuickMarketViewTable: React.FC<QuickMarketViewTableProps> = ({
  assessment,
  onUpdateAssessment,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempNotes, setTempNotes] = useState('');

  const quickMarketItems = assessment.quickMarketView || [];

  const startEditing = (item: QuickMarketKPIItem) => {
    setEditingId(item.id);
    setTempValue(item.measuredValue);
    setTempNotes(item.notes || '');
  };

  const saveEdit = (id: string) => {
    const updated = quickMarketItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          measuredValue: tempValue,
          notes: tempNotes,
        };
      }
      return item;
    });

    onUpdateAssessment({
      ...assessment,
      quickMarketView: updated,
    });
    setEditingId(null);
  };

  const getKpiIcon = (id: string) => {
    switch (id) {
      case 'sqft_per_capita':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'total_stores':
        return <Store className="w-4 h-4 text-sky-600" />;
      case 'walkin_avg_rate':
      case 'total_walkin_rate':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'online_avg_rate':
      case 'total_online_rate':
        return <DollarSign className="w-4 h-4 text-indigo-600" />;
      case 'walkin_non_cc':
      case 'online_non_cc':
        return <Building className="w-4 h-4 text-amber-600" />;
      case 'walkin_cc':
      case 'online_cc':
        return <ShieldCheck className="w-4 h-4 text-teal-600" />;
      case 'total_sqft':
      case 'rentable_sqft':
        return <BarChart2 className="w-4 h-4 text-purple-600" />;
      case 'population_5mi':
      case 'radius_population':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'median_income_5mi':
      case 'radius_median_income':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      default:
        return <Compass className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'HEALTHY' || s === 'PASS' || s === 'FAVORABLE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3" />
          {status}
        </span>
      );
    }
    if (s === 'COMPETITIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
          <CheckCircle2 className="w-3 h-3" />
          {status}
        </span>
      );
    }
    if (s === 'WARNING' || s === 'CAUTION') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertCircle className="w-3 h-3" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        <HelpCircle className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header Banner */}
      <div className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-wide">
              Quick Market View
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-lime-400 text-slate-950">
              5-Mile Radius
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Self-Storage Facility Competition, Rental Rates & 5-Mile Demographic Ring
          </p>
        </div>

        <div className="text-xs text-slate-300 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
          <span>12 Radius KPIs Evaluated for {assessment.propertyAddress.split(',')[0]}</span>
        </div>
      </div>

      {/* 3-Column Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white border-b border-slate-700">
              <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider w-[26%] border-r border-slate-700">
                1. 5-Mile Storage KPI
              </th>
              <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider w-[28%] border-r border-slate-700">
                2. Industry Benchmark
              </th>
              <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider w-[46%] bg-slate-800/90">
                3. Measured 5-Mile Market Research & Verified Source
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {quickMarketItems.map((item, index) => {
              const isEditing = editingId === item.id;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                  }`}
                >
                  {/* Column 1: KPI Name */}
                  <td className="py-3.5 px-5 align-top border-r border-slate-200">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-slate-100 mt-0.5 border border-slate-200 shrink-0">
                        {getKpiIcon(item.id)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {item.kpi}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {item.radius || '5-Mile Radius'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Industry Benchmark */}
                  <td className="py-3.5 px-5 align-top border-r border-slate-200">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                      {item.benchmark}
                    </div>
                  </td>

                  {/* Column 3: Measured 5-Mile Result & Source */}
                  <td className="py-3.5 px-5 align-top">
                    {isEditing ? (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">
                            Measured Metric Value:
                          </label>
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-semibold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">
                            Market Analysis Notes:
                          </label>
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            rows={2}
                            className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-700"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(item.id)}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">
                              {item.measuredValue}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>

                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit this metric"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.notes}
                          </p>
                        )}

                        {/* Verified Source Citation */}
                        <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 mt-1">
                          <span className="font-semibold text-slate-700">Source:</span>
                          {item.sourceUrl ? (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 hover:underline font-semibold truncate max-w-md"
                              title={`Open verified source: ${item.sourceTitle}`}
                            >
                              <span>{item.sourceTitle}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-600 font-medium">
                              {item.sourceTitle || 'Industry Radius Analytics'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default QuickMarketViewTable;
