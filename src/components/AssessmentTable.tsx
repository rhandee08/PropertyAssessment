import React, { useState } from 'react';
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Car,
  ShieldCheck,
  DollarSign,
  TrendingDown,
  Briefcase,
  Users,
  Activity,
  Edit2,
  Check,
  Sparkles,
  Search,
} from 'lucide-react';
import { MarketAssessmentResult, MarketKPIItem } from '../types';

interface AssessmentTableProps {
  assessment: MarketAssessmentResult;
  onUpdateAssessment: (updated: MarketAssessmentResult) => void;
  onRunResearch: (address: string) => void;
  isLoading: boolean;
}

export const AssessmentTable: React.FC<AssessmentTableProps> = ({
  assessment,
  onUpdateAssessment,
  onRunResearch,
  isLoading,
}) => {
  const [editingAddress, setEditingAddress] = useState(assessment.propertyAddress);
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempNotes, setTempNotes] = useState('');

  // Keep internal address in sync when assessment changes
  React.useEffect(() => {
    setEditingAddress(assessment.propertyAddress);
  }, [assessment.propertyAddress]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress.trim() && !isLoading) {
      onRunResearch(editingAddress.trim());
    }
  };

  const startEditingKpi = (item: MarketKPIItem) => {
    setEditingKpiId(item.id);
    setTempValue(item.measuredValue);
    setTempNotes(item.notes || '');
  };

  const saveKpiEdit = (kpiId: string) => {
    const updatedKpis = assessment.kpis.map((kpi) => {
      if (kpi.id === kpiId) {
        return {
          ...kpi,
          measuredValue: tempValue,
          notes: tempNotes,
        };
      }
      return kpi;
    });

    onUpdateAssessment({
      ...assessment,
      kpis: updatedKpis,
    });
    setEditingKpiId(null);
  };

  const getKpiIcon = (id: string) => {
    switch (id) {
      case 'traffic_count':
        return <Car className="w-4 h-4 text-sky-600" />;
      case 'crime_rate':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'annual_income':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'poverty_level':
        return <TrendingDown className="w-4 h-4 text-amber-600" />;
      case 'job_growth':
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
      case 'population_growth':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'unemployment_rate':
        return <Activity className="w-4 h-4 text-teal-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 3-Column Header Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* Main 3 Columns Definition */}
            <tr className="bg-slate-900 text-white border-b border-slate-800">
              <th className="py-4 px-5 text-xs font-semibold uppercase tracking-wider w-[24%] border-r border-slate-800">
                1. KPI
              </th>
              <th className="py-4 px-5 text-xs font-semibold uppercase tracking-wider w-[28%] border-r border-slate-800">
                2. Acceptable Region
              </th>
              <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider w-[48%] bg-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">3. Editable Address Field & Market Research</span>
                  </div>
                  <span className="text-[11px] font-normal text-slate-300">
                    Type address & press Enter or Research
                  </span>
                </div>
              </th>
            </tr>

            {/* Editable Address Header Bar embedded directly in Column 3 */}
            <tr className="bg-slate-50 border-b border-slate-200">
              <td className="py-2.5 px-5 text-xs font-medium text-slate-500 border-r border-slate-200">
                Location Benchmarks
              </td>
              <td className="py-2.5 px-5 text-xs font-medium text-slate-500 border-r border-slate-200">
                Target Thresholds
              </td>
              <td className="py-2.5 px-4 bg-emerald-50/50">
                <form onSubmit={handleAddressSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="property-address-input"
                      value={editingAddress}
                      onChange={(e) => setEditingAddress(e.target.value)}
                      placeholder="Enter property address (e.g., 1200 S Congress Ave, Austin, TX)..."
                      className="w-full pl-3 pr-8 py-1.5 text-xs sm:text-sm font-medium bg-white text-slate-900 border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
                      disabled={isLoading}
                    />
                    {editingAddress && (
                      <button
                        type="button"
                        onClick={() => setEditingAddress('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !editingAddress.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-medium shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Run Research</span>
                      </>
                    )}
                  </button>
                </form>
              </td>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {assessment.kpis.map((item, index) => {
              const isEditing = editingKpiId === item.id;
              const isPass = item.status === 'PASS';
              const isFail = item.status === 'FAIL';

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                  }`}
                >
                  {/* Column 1: KPI */}
                  <td className="py-4 px-5 align-top border-r border-slate-200">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-slate-100 mt-0.5 border border-slate-200">
                        {getKpiIcon(item.id)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {item.kpi}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.id === 'traffic_count' && 'Average Annual Daily Traffic'}
                          {item.id === 'crime_rate' && 'Safety Index & Incident Rate'}
                          {item.id === 'annual_income' && 'Per Capita / Individual Earnings'}
                          {item.id === 'poverty_level' && 'Census Tract Poverty Ratio'}
                          {item.id === 'job_growth' && 'Annualized Employment Growth'}
                          {item.id === 'population_growth' && 'Demographic Influx Rate'}
                          {item.id === 'unemployment_rate' && 'Local vs Benchmark Ratio'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Acceptable Region */}
                  <td className="py-4 px-5 align-top border-r border-slate-200">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                      {item.acceptableRegion}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {item.id === 'traffic_count' && 'Requires >= 15k cars/day for retail/commercial viability.'}
                      {item.id === 'crime_rate' && 'Scores under 35% signify low incident risk.'}
                      {item.id === 'annual_income' && 'Demographic purchasing power threshold.'}
                      {item.id === 'poverty_level' && 'Must remain strictly below 20% distress ceiling.'}
                      {item.id === 'job_growth' && 'At least 1.4% to ensure expansion momentum.'}
                      {item.id === 'population_growth' && 'At least +1.2% year-over-year population gain.'}
                      {item.id === 'unemployment_rate' && 'Unemployment must be below regional baseline.'}
                    </p>
                  </td>

                  {/* Column 3: Market Assessment & Source Link */}
                  <td className="py-4 px-5 align-top">
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
                            className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
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
                            className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => saveKpiEdit(item.id)}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingKpiId(null)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">
                              {item.measuredValue}
                            </span>
                            {/* Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isFail
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {isPass && <CheckCircle className="w-3 h-3" />}
                              {isFail && <XCircle className="w-3 h-3" />}
                              {!isPass && !isFail && <AlertCircle className="w-3 h-3" />}
                              {item.status}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => startEditingKpi(item)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                            title="Edit this cell manually"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Analysis / Property Note */}
                        {item.notes && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.notes}
                          </p>
                        )}

                        {/* Verified Link to the Source */}
                        <div className="pt-1.5 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100">
                          <span className="font-medium text-slate-700">Source:</span>
                          {item.sourceUrl ? (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 hover:underline font-medium truncate max-w-md"
                              title={`Open verified source: ${item.sourceTitle}`}
                            >
                              <span>{item.sourceTitle}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-600">{item.sourceTitle || 'Official Regional Data'}</span>
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
