import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '@/services/api';
import { PlacementDrive, PlacementEligibilityRule, PlacementCandidateEvaluation } from '@/types';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Sparkles, 
  Search, 
  Download, 
  RefreshCw, 
  Send, 
  Filter, 
  GraduationCap, 
  ShieldCheck, 
  Layers, 
  AlertCircle,
  X
} from 'lucide-react';

interface PlacementEligibilityDeskProps {
  drive: PlacementDrive;
  isOpen: boolean;
  onClose: () => void;
  onBroadcastNotice?: (drive: PlacementDrive, eligibleCount: number) => void;
}

export const PlacementEligibilityDesk: React.FC<PlacementEligibilityDeskProps> = ({
  drive,
  isOpen,
  onClose,
  onBroadcastNotice
}) => {
  const [rule, setRule] = useState<PlacementEligibilityRule>({
    placementDriveId: drive.id,
    minimumCgpa: 6.5,
    minimumTenthPercentage: 60.0,
    minimumTwelfthPercentage: 60.0,
    minimumDiplomaPercentage: 65.0,
    allowedDepartments: 'CSE,AIDS,MECH,CIVIL,ENTC,ELECTRICAL,MECHATRONICS'
  });

  const [candidates, setCandidates] = useState<PlacementCandidateEvaluation[]>([]);
  const [isLoadingRule, setIsLoadingRule] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isSavingRule, setIsSavingRule] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE'>('ALL');
  const [pathFilter, setPathFilter] = useState<'ALL' | '12TH' | 'DIPLOMA'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  const departmentsList = ['CSE', 'AIDS', 'MECH', 'CIVIL', 'ENTC', 'ELECTRICAL', 'MECHATRONICS'];

  useEffect(() => {
    if (isOpen && drive.id) {
      loadRuleAndCandidates();
    }
  }, [isOpen, drive.id]);

  const loadRuleAndCandidates = async () => {
    setIsLoadingRule(true);
    try {
      // 1. Fetch saved rule if exists
      const existingRule = await apiService.getPlacementEligibilityRule(drive.id).catch(() => null);
      if (existingRule) {
        setRule({
          ...existingRule,
          placementDriveId: drive.id,
          allowedDepartments: existingRule.allowedDepartments || 'CSE,AIDS,MECH,CIVIL,ENTC,ELECTRICAL,MECHATRONICS'
        });
      }

      // 2. Fetch existing evaluation results
      const results = await apiService.getPlacementEvaluationDetails(drive.id).catch(() => []);
      if (results && results.length > 0) {
        setCandidates(results);
      } else {
        // Run initial evaluation automatically if not yet evaluated
        handleRunEvaluation(existingRule || undefined);
      }
    } catch (err) {
      console.warn('Error loading eligibility data:', err);
    } finally {
      setIsLoadingRule(false);
    }
  };

  const handleSaveRule = async () => {
    setIsSavingRule(true);
    setStatusMessage(null);
    try {
      const saved = await apiService.savePlacementEligibilityRule(drive.id, {
        ...rule,
        placementDriveId: drive.id
      });
      setRule(saved);
      setStatusMessage({ type: 'success', text: 'Placement criteria saved to database successfully.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save eligibility criteria.' });
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleRunEvaluation = async (customRule?: PlacementEligibilityRule) => {
    setIsEvaluating(true);
    setStatusMessage(null);
    try {
      const ruleToUse = customRule || rule;
      await apiService.savePlacementEligibilityRule(drive.id, {
        ...ruleToUse,
        placementDriveId: drive.id
      });

      // Execute engine evaluation
      await apiService.evaluatePlacementEligibility(drive.id);

      // Fetch enriched candidate details
      const freshResults = await apiService.getPlacementEvaluationDetails(drive.id);
      setCandidates(freshResults);

      setStatusMessage({ 
        type: 'success', 
        text: `Evaluation complete! Evaluated ${freshResults.length} candidates with zero-loss 12th vs. Diploma path resolution.` 
      });
      setTimeout(() => setStatusMessage(null), 4500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to execute eligibility evaluation.' });
    } finally {
      setIsEvaluating(false);
    }
  };

  const toggleDepartment = (dept: string) => {
    const currentList = (rule.allowedDepartments || '').split(',').map(d => d.trim()).filter(Boolean);
    let updated: string[];
    if (currentList.includes(dept)) {
      updated = currentList.filter(d => d !== dept);
    } else {
      updated = [...currentList, dept];
    }
    setRule(prev => ({ ...prev, allowedDepartments: updated.join(',') }));
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = candidates.length;
    const eligible = candidates.filter(c => c.isEligible).length;
    const ineligible = total - eligible;
    const diplomaTotal = candidates.filter(c => c.qualificationPath === 'DIPLOMA').length;
    const diplomaEligible = candidates.filter(c => c.qualificationPath === 'DIPLOMA' && c.isEligible).length;
    const regularTotal = candidates.filter(c => c.qualificationPath === '12TH').length;
    const regularEligible = candidates.filter(c => c.qualificationPath === '12TH' && c.isEligible).length;

    return {
      total,
      eligible,
      ineligible,
      eligibleRate: total > 0 ? Math.round((eligible / total) * 100) : 0,
      diplomaTotal,
      diplomaEligible,
      regularTotal,
      regularEligible
    };
  }, [candidates]);

  // Filtered Candidates list
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Search
      const searchMatch = !searchQuery.trim() || 
        (c.studentName && c.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.rollNo && c.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.prn && c.prn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.studentEmail && c.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status
      const statusMatch = 
        statusFilter === 'ALL' || 
        (statusFilter === 'ELIGIBLE' && c.isEligible) || 
        (statusFilter === 'INELIGIBLE' && !c.isEligible);

      // Path
      const pathMatch = 
        pathFilter === 'ALL' || 
        c.qualificationPath === pathFilter;

      // Department
      const deptMatch = 
        deptFilter === 'ALL' || 
        (c.department && c.department.toUpperCase() === deptFilter.toUpperCase());

      return searchMatch && statusMatch && pathMatch && deptMatch;
    });
  }, [candidates, searchQuery, statusFilter, pathFilter, deptFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (candidates.length === 0) return;
    const headers = [
      'Student Name',
      'Roll No',
      'PRN',
      'Department',
      'Year',
      'Division',
      'Batch',
      'Qualification Path',
      '10th %',
      '12th %',
      'Diploma %',
      'CGPA',
      'Eligibility Status',
      'Evaluation Reason'
    ];

    const rows = filteredCandidates.map(c => [
      `"${c.studentName || ''}"`,
      `"${c.rollNo || ''}"`,
      `"${c.prn || ''}"`,
      `"${c.department || ''}"`,
      `"${c.academicYear || ''}"`,
      `"${c.division || ''}"`,
      `"${c.batchGroup || ''}"`,
      `"${c.qualificationPath}"`,
      c.tenthPercentage || '0.00',
      c.qualificationPath === '12TH' ? (c.twelfthPercentage || '0.00') : 'N/A',
      c.qualificationPath === 'DIPLOMA' ? (c.diplomaPercentage || '0.00') : 'N/A',
      c.cgpa || '0.00',
      c.isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
      `"${(c.evaluationReason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Placement_Eligibility_${drive.companyName.replace(/\s+/g, '_')}_Candidates.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900 font-sans">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#000666] via-[#1a237e] to-[#024099] text-white p-5 sm:p-6 shrink-0 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-200 font-semibold text-xs border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              SITCOE Automated Placement Qualification Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-300" />
              {drive.companyName} — Candidate Eligibility Desk
            </h2>
            <p className="text-xs sm:text-sm text-cyan-100 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Role: <strong className="text-white">{drive.role}</strong></span>
              <span>• Package: <strong className="text-amber-300">{drive.packageLpa || 'Competitive'}</strong></span>
              <span>• Drive Date: <strong className="text-white">{drive.driveDate || 'TBD'}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            {onBroadcastNotice && (
              <button
                onClick={() => onBroadcastNotice(drive, metrics.eligible)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                title="Send official targeted placement notification to eligible students"
              >
                <Send className="w-3.5 h-3.5" />
                Broadcast to Eligible ({metrics.eligible})
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Alert */}
        {statusMessage && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b transition-all ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {statusMessage.text}
          </div>
        )}

        {/* Main Body (Scrollable Split-View) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Rule Configuration Section */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Drive Criteria & Qualification Thresholds
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveRule}
                  disabled={isSavingRule || isEvaluating}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingRule ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Criteria
                </button>
                <button
                  onClick={() => handleRunEvaluation()}
                  disabled={isEvaluating}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                  {isEvaluating ? 'Evaluating Pool...' : 'Run Instant Evaluation'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Min CGPA */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Minimum B.Tech CGPA
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={rule.minimumCgpa}
                    onChange={(e) => setRule({ ...rule, minimumCgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full text-base font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-400">/ 10</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Across all completed semesters</p>
              </div>

              {/* Min 10th % */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Minimum 10th / SSC %
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={rule.minimumTenthPercentage}
                    onChange={(e) => setRule({ ...rule, minimumTenthPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full text-base font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Universal across all candidates</p>
              </div>

              {/* Min 12th % (Regular) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 ring-1 ring-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-blue-800 uppercase">
                    Min 12th HSC %
                  </label>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-sm">12TH PATH</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={rule.minimumTwelfthPercentage}
                    onChange={(e) => setRule({ ...rule, minimumTwelfthPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full text-base font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-blue-600/80 mt-1">Evaluated for standard 12th students</p>
              </div>

              {/* Min Diploma % (Lateral Entry) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 ring-1 ring-purple-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-purple-800 uppercase">
                    Min Diploma %
                  </label>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-sm">DIPLOMA PATH</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={rule.minimumDiplomaPercentage}
                    onChange={(e) => setRule({ ...rule, minimumDiplomaPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full text-base font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-purple-600/80 mt-1">Evaluated for Lateral Entry (DSE)</p>
              </div>
            </div>

            {/* Allowed Departments Multi-Select */}
            <div className="mt-4 pt-3 border-t border-slate-200/80">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">
                Eligible Engineering Departments:
              </label>
              <div className="flex flex-wrap gap-2">
                {departmentsList.map(dept => {
                  const isAllowed = (rule.allowedDepartments || '').split(',').map(d => d.trim().toUpperCase()).includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isAllowed 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white text-slate-500 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isAllowed ? <CheckCircle2 className="w-3 h-3 text-emerald-300" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      {dept}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase mb-1">
                <span>Total Pool</span>
                <GraduationCap className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{metrics.total}</div>
              <span className="text-[10px] text-slate-400">Registered student database</span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase mb-1">
                <span>Eligible Candidates</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 flex items-baseline gap-2">
                {metrics.eligible}
                <span className="text-xs font-bold text-emerald-600">({metrics.eligibleRate}%)</span>
              </div>
              <span className="text-[10px] text-emerald-600">Passed dual-path criteria</span>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-rose-800 text-[11px] font-bold uppercase mb-1">
                <span>Ineligible Candidates</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700">{metrics.ineligible}</div>
              <span className="text-[10px] text-rose-600">Criteria shortfall</span>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-purple-800 text-[11px] font-bold uppercase mb-1">
                <span>Diploma (DSE) Pool</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-700">
                {metrics.diplomaEligible} <span className="text-xs font-normal text-purple-500">/ {metrics.diplomaTotal}</span>
              </div>
              <span className="text-[10px] text-purple-600">Lateral Entry Candidates</span>
            </div>
          </div>

          {/* Candidate Pool Table Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            
            {/* Table Control Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name, PRN, roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({candidates.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ELIGIBLE')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      statusFilter === 'ELIGIBLE' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Eligible ({metrics.eligible})
                  </button>
                  <button
                    onClick={() => setStatusFilter('INELIGIBLE')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      statusFilter === 'INELIGIBLE' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    Ineligible ({metrics.ineligible})
                  </button>
                </div>

                {/* Path Filter */}
                <select
                  value={pathFilter}
                  onChange={(e) => setPathFilter(e.target.value as any)}
                  className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Qualification Paths</option>
                  <option value="12TH">12th Regular Path</option>
                  <option value="DIPLOMA">Diploma Lateral Entry (DSE)</option>
                </select>

                {/* Department Filter */}
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Departments</option>
                  {departmentsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* CSV Export */}
                <button
                  onClick={handleExportCSV}
                  disabled={filteredCandidates.length === 0}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Export filtered candidate list to CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV ({filteredCandidates.length})
                </button>
              </div>
            </div>

            {/* Candidate Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student & PRN</th>
                    <th className="py-3 px-3">Dept & Div</th>
                    <th className="py-3 px-3">Qualification Path</th>
                    <th className="py-3 px-3 text-center">10th %</th>
                    <th className="py-3 px-3 text-center">12th / Diploma %</th>
                    <th className="py-3 px-3 text-center">CGPA</th>
                    <th className="py-3 px-3 text-center">Verdicts</th>
                    <th className="py-3 px-4">Reason / Shortfall Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((c) => {
                      const is12th = c.qualificationPath === '12TH';
                      const tenthPass = Number(c.tenthPercentage || 0) >= Number(rule.minimumTenthPercentage);
                      const twelfthPass = is12th 
                        ? Number(c.twelfthPercentage || 0) >= Number(rule.minimumTwelfthPercentage)
                        : true;
                      const diplomaPass = !is12th 
                        ? Number(c.diplomaPercentage || 0) >= Number(rule.minimumDiplomaPercentage)
                        : true;
                      const cgpaPass = Number(c.cgpa || 0) >= Number(rule.minimumCgpa);

                      return (
                        <tr key={c.id || c.prn} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* Student Info */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{c.studentName || 'Student'}</div>
                            <div className="text-[11px] font-mono text-slate-500">PRN: {c.prn} • Roll: {c.rollNo || 'N/A'}</div>
                          </td>

                          {/* Dept & Div */}
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                              {c.department || 'CSE'}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{c.academicYear || 'SE'} - {c.division || 'A'}</div>
                          </td>

                          {/* Qualification Path */}
                          <td className="py-3 px-3">
                            {is12th ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                                12TH HSC Regular
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                                <Layers className="w-3 h-3" />
                                Diploma (Lateral Entry)
                              </span>
                            )}
                          </td>

                          {/* 10th % */}
                          <td className="py-3 px-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-md ${
                              tenthPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {c.tenthPercentage || '0.00'}%
                            </span>
                          </td>

                          {/* 12th or Diploma % */}
                          <td className="py-3 px-3 text-center font-bold">
                            {is12th ? (
                              <span className={`px-2 py-0.5 rounded-md ${
                                twelfthPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                12th: {c.twelfthPercentage || '0.00'}%
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-md ${
                                diplomaPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                Dip: {c.diplomaPercentage || '0.00'}%
                              </span>
                            )}
                          </td>

                          {/* CGPA */}
                          <td className="py-3 px-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-md ${
                              cgpaPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {c.cgpa || '0.00'}
                            </span>
                          </td>

                          {/* Verdict */}
                          <td className="py-3 px-3 text-center">
                            {c.isEligible ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ELIGIBLE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[11px]">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                INELIGIBLE
                              </span>
                            )}
                          </td>

                          {/* Breakdown Reason */}
                          <td className="py-3 px-4">
                            <span className={`text-[11px] font-medium leading-tight ${
                              c.isEligible ? 'text-emerald-700' : 'text-rose-600'
                            }`}>
                              {c.evaluationReason || (c.isEligible ? 'Meets all criteria' : 'Criteria not fulfilled')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-sm">No students match your filter criteria.</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search terms or filters above.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs font-semibold text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span>Showing {filteredCandidates.length} of {candidates.length} total student candidate evaluations</span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  {metrics.regularEligible} / {metrics.regularTotal} 12th Path Eligible
                </span>
                <span className="flex items-center gap-1 text-purple-700 font-bold">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  {metrics.diplomaEligible} / {metrics.diplomaTotal} Diploma Path Eligible
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
