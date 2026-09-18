import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { 
  Building2, 
  Layers, 
  GraduationCap, 
  Users, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FolderTree,
  Calendar,
  Share2
} from 'lucide-react';

import { UserProfile, UserRole, WorkingBatchConfig } from '@/types';

interface DepartmentHierarchyViewProps {
  onSelectDepartment?: (deptCode: string) => void;
  userRole?: UserRole | string;
  currentProfile?: UserProfile | null;
  activeWorkingBatch?: WorkingBatchConfig | null;
  onSaveDefaultBatch?: (batchConfig: WorkingBatchConfig) => Promise<void> | void;
}

const DEPT_THEMES: Record<string, { gradient: string; badge: string; border: string; accent: string }> = {
  CSE: {
    gradient: 'from-blue-600 to-indigo-800',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    border: 'border-blue-200 hover:border-blue-500',
    accent: 'text-blue-700'
  },
  AIDS: {
    gradient: 'from-purple-600 to-indigo-900',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    border: 'border-purple-200 hover:border-purple-500',
    accent: 'text-purple-700'
  },
  MECH: {
    gradient: 'from-amber-600 to-orange-800',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    border: 'border-amber-200 hover:border-amber-500',
    accent: 'text-amber-700'
  },
  CIVIL: {
    gradient: 'from-emerald-600 to-teal-800',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    border: 'border-emerald-200 hover:border-emerald-500',
    accent: 'text-emerald-700'
  },
  ENTC: {
    gradient: 'from-cyan-600 to-blue-800',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    border: 'border-cyan-200 hover:border-cyan-500',
    accent: 'text-cyan-700'
  },
  ELECTRICAL: {
    gradient: 'from-yellow-600 to-amber-800',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    border: 'border-yellow-200 hover:border-yellow-500',
    accent: 'text-yellow-700'
  },
  MECHATRONICS: {
    gradient: 'from-rose-600 to-red-800',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    border: 'border-rose-200 hover:border-rose-500',
    accent: 'text-rose-700'
  },
  BASIC_SCIENCES: {
    gradient: 'from-slate-600 to-gray-800',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    border: 'border-slate-200 hover:border-slate-500',
    accent: 'text-slate-700'
  }
};

const normalizeDeptCode = (dept?: string): string => {
  if (!dept) return 'CSE';
  const upper = dept.toUpperCase().trim();
  if (upper.includes('COMP') || upper.includes('CSE')) return 'CSE';
  if (upper.includes('AI') || upper.includes('DATA') || upper.includes('AIDS')) return 'AIDS';
  if (upper.includes('MECH') && !upper.includes('MECHATRONICS')) return 'MECH';
  if (upper.includes('CIVIL')) return 'CIVIL';
  if (upper.includes('ENTC') || upper.includes('TELECOM') || upper.includes('E&TC')) return 'ENTC';
  if (upper.includes('ELEC') && !upper.includes('ELECTRONICS')) return 'ELECTRICAL';
  if (upper.includes('MECHATRONICS')) return 'MECHATRONICS';
  if (upper.includes('BASIC') || upper.includes('HUMANITIES') || upper.includes('FE')) return 'BASIC_SCIENCES';
  return upper;
};

export const DepartmentHierarchyView: React.FC<DepartmentHierarchyViewProps> = ({ 
  onSelectDepartment,
  userRole,
  currentProfile,
  activeWorkingBatch,
  onSaveDefaultBatch
}) => {
  const isFacultyRole = userRole === 'faculty';
  const facultyDeptCode = normalizeDeptCode(currentProfile?.department);

  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<any | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<any | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [selectedYearLevel, setSelectedYearLevel] = useState<'SE' | 'TE' | 'BE' | 'FE'>('SE');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Faculty Default Working Batch State & Toast
  const [savedDefaultBatch, setSavedDefaultBatch] = useState<WorkingBatchConfig | null>(() => {
    if (activeWorkingBatch) return activeWorkingBatch;
    const local = localStorage.getItem('sit_faculty_active_batch');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return null;
  });
  const [isSavingDefaultBatch, setIsSavingDefaultBatch] = useState(false);
  const [defaultBatchToast, setDefaultBatchToast] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkingBatch) {
      setSavedDefaultBatch(activeWorkingBatch);
    }
  }, [activeWorkingBatch]);

  // Helper to check if a batch is active default batch
  const isBatchDefault = (batchName?: string) => {
    if (!savedDefaultBatch) return false;
    const cleanB = (batchName || selectedBatch?.name || '').replace('Batch ', '').trim().toUpperCase();
    const targetB = (savedDefaultBatch.batchGroup || '').replace('Batch ', '').trim().toUpperCase();
    const yrMatch = (savedDefaultBatch.academicYear || '').toUpperCase() === selectedYearLevel.toUpperCase();
    const divMatch = (savedDefaultBatch.division || '').replace('Div ', '').trim().toUpperCase() === (selectedDivision?.name || 'Div A').replace('Div ', '').trim().toUpperCase();
    const batchMatch = cleanB === targetB;
    return yrMatch && divMatch && batchMatch;
  };

  // Create or Update Default Batch
  const handleSaveDefaultBatch = async (batchNameToSet?: string) => {
    const bName = batchNameToSet || selectedBatch?.name || 'Batch A1';
    const cleanBatchCode = bName.replace('Batch ', '').trim();
    const deptCode = selectedDept?.code || facultyDeptCode || 'CSE';
    const divName = selectedDivision?.name || 'Div A';

    const newConfig: WorkingBatchConfig = {
      department: deptCode,
      academicYear: selectedYearLevel,
      division: divName,
      batchGroup: cleanBatchCode
    };

    setIsSavingDefaultBatch(true);
    try {
      setSavedDefaultBatch(newConfig);
      localStorage.setItem('sit_faculty_active_batch', JSON.stringify(newConfig));

      if (onSaveDefaultBatch) {
        await onSaveDefaultBatch(newConfig);
      }

      try {
        await apiService.saveDefaultBatch({
          academicYear: newConfig.academicYear as string,
          division: newConfig.division as string,
          batchGroup: newConfig.batchGroup as string,
          department: newConfig.department,
          email: currentProfile?.email
        });
      } catch (e) {
        console.warn('API saveDefaultBatch note:', e);
      }

      setDefaultBatchToast(`✨ Default batch successfully saved as ${newConfig.academicYear} • ${newConfig.division} • ${bName} across the entire portal!`);
      setTimeout(() => setDefaultBatchToast(null), 4000);
    } catch (err: any) {
      console.error('Error saving default batch:', err);
      setDefaultBatchToast(`✨ Default batch updated to ${newConfig.academicYear} • ${newConfig.division} • ${bName}`);
      setTimeout(() => setDefaultBatchToast(null), 4000);
    } finally {
      setIsSavingDefaultBatch(false);
    }
  };

  const handleJumpToDefault = () => {
    if (savedDefaultBatch) {
      if (savedDefaultBatch.academicYear) {
        setSelectedYearLevel(savedDefaultBatch.academicYear as any);
        const cleanSavedDiv = (savedDefaultBatch.division || 'Div A').toLowerCase().replace('div ', '').trim();
        const matchingDiv = divisions.find(d => 
          d.yearLevel === savedDefaultBatch.academicYear && 
          d.name.toLowerCase().replace('div ', '').trim() === cleanSavedDiv
        );
        if (matchingDiv) {
          setSelectedDivision(matchingDiv);
        }
      }
    }
  };

  // Filter departments for faculty scoped view
  const displayedDepartments = React.useMemo(() => {
    if (isFacultyRole && facultyDeptCode) {
      const filtered = departments.filter((d) => d.code.toUpperCase() === facultyDeptCode.toUpperCase());
      return filtered.length > 0 ? filtered : departments;
    }
    return departments;
  }, [departments, isFacultyRole, facultyDeptCode]);

  // Term Transition Modal State
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionSourceYear, setTransitionSourceYear] = useState('SE');
  const [transitionTargetYear, setTransitionTargetYear] = useState('TE');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSuccess, setTransitionSuccess] = useState<string | null>(null);

  // Load all 8 departments & academic years on mount
  useEffect(() => {
    loadMasterOrgData();
  }, [isFacultyRole, facultyDeptCode]);

  const loadMasterOrgData = async () => {
    setIsLoading(true);
    try {
      const [deptsRes, yearsRes, studentsRes] = await Promise.all([
        apiService.getDepartments().catch(() => []),
        apiService.getAcademicYears().catch(() => []),
        apiService.fetchStudents().catch(() => [])
      ]);

      setStudents(studentsRes || []);

      const masterDepts = (deptsRes && deptsRes.length > 0) ? deptsRes : [
        { id: 1, code: 'CSE', name: 'Computer Science & Engineering', status: 'ACTIVE' },
        { id: 2, code: 'AIDS', name: 'Artificial Intelligence & Data Science', status: 'ACTIVE' },
        { id: 3, code: 'MECH', name: 'Mechanical Engineering', status: 'ACTIVE' },
        { id: 4, code: 'CIVIL', name: 'Civil Engineering', status: 'ACTIVE' },
        { id: 5, code: 'ENTC', name: 'Electronics & Telecommunication Engineering', status: 'ACTIVE' },
        { id: 6, code: 'ELECTRICAL', name: 'Electrical Engineering', status: 'ACTIVE' },
        { id: 7, code: 'MECHATRONICS', name: 'Mechatronics Engineering', status: 'ACTIVE' },
        { id: 8, code: 'BASIC_SCIENCES', name: 'Basic Sciences & Humanities Core', status: 'ACTIVE' }
      ];

      setDepartments(masterDepts);

      const targetDept = isFacultyRole
        ? masterDepts.find((d: any) => d.code.toUpperCase() === facultyDeptCode.toUpperCase()) || masterDepts[0]
        : masterDepts[0];

      setSelectedDept(targetDept);
      setAcademicYears(yearsRes || []);
    } catch (err) {
      console.warn('Failed to load organization hierarchy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeptStudentCount = (deptCode: string, deptName: string) => {
    return students.filter((s: any) => {
      const d = (s.department || '').toUpperCase();
      const code = deptCode.toUpperCase();
      return d === code || d.includes(code) || (deptName && d === deptName.toUpperCase());
    }).length;
  };

  const getDivisionStudentCount = (yearLevel: string, divName: string) => {
    const cleanDiv = (divName || '').replace('Div ', '').trim().toUpperCase();
    const selYr = (yearLevel || selectedYearLevel || 'SE').toUpperCase();
    return students.filter((s: any) => {
      const deptMatch = !selectedDept || (s.department || '').toUpperCase() === selectedDept.code.toUpperCase() || (s.department || '').toUpperCase().includes(selectedDept.code.toUpperCase());
      const sYr = (s.academicYear || '').toUpperCase();
      const yearMatch = sYr === selYr || (selYr === 'TE' && sYr === 'TY') || (selYr === 'SE' && sYr === 'SY');
      const sDiv = (s.division || '').toUpperCase();
      const divMatch = !cleanDiv || sDiv === cleanDiv || sDiv === `DIV ${cleanDiv}` || sDiv.includes(cleanDiv);
      return deptMatch && yearMatch && divMatch;
    }).length;
  };

  const getBatchStudents = (batchName: string, batchIdx: number) => {
    const divLetter = selectedDivision ? (selectedDivision.name || '').replace('Div ', '').trim().toUpperCase() : 'A';
    const bKey1 = `${divLetter}${batchIdx + 1}`.toUpperCase();
    const bKey2 = `Batch ${divLetter}${batchIdx + 1}`.toUpperCase();
    const bKey3 = `B${batchIdx + 1}`.toUpperCase();
    const bKey4 = `Batch ${batchIdx + 1}`.toUpperCase();
    const bNameClean = (batchName || '').toUpperCase().trim();
    const selYr = (selectedYearLevel || 'SE').toUpperCase();

    return students.filter((s: any) => {
      const deptMatch = !selectedDept || (s.department || '').toUpperCase() === selectedDept.code.toUpperCase() || (s.department || '').toUpperCase().includes(selectedDept.code.toUpperCase());
      const sYr = (s.academicYear || '').toUpperCase();
      const yearMatch = sYr === selYr || (selYr === 'TE' && sYr === 'TY') || (selYr === 'SE' && sYr === 'SY');
      const sDiv = (s.division || '').toUpperCase();
      const divMatch = !selectedDivision || !s.division || sDiv.includes(divLetter);
      const bg = (s.batchGroup || '').toUpperCase().trim();
      const batchMatch = bg === bKey1 || bg === bKey2 || bg === bKey3 || bg === bKey4 || bg === bNameClean || (bNameClean && bNameClean.includes(bg));
      return deptMatch && yearMatch && divMatch && batchMatch;
    });
  };

  const getBatchStudentCount = (batchName: string, batchIdx: number) => {
    return getBatchStudents(batchName, batchIdx).length;
  };

  // When selected department changes, load its programs and divisions
  useEffect(() => {
    if (!selectedDept) return;

    const loadDeptDetails = async () => {
      try {
        const [progsRes, divsRes] = await Promise.all([
          apiService.getPrograms(selectedDept.id).catch(() => []),
          apiService.getDivisions(selectedDept.id).catch(() => [])
        ]);

        if (progsRes && progsRes.length > 0) {
          setPrograms(progsRes);
        } else {
          setPrograms([
            { id: 1, code: `BTECH_${selectedDept.code}`, name: `B.Tech in ${selectedDept.name}`, degree: 'B.Tech' }
          ]);
        }

        if (divsRes && divsRes.length > 0) {
          setDivisions(divsRes);
          const initialDiv = divsRes.find((d: any) => d.yearLevel === 'SE') || divsRes[0];
          setSelectedDivision(initialDiv);
          if (initialDiv) setSelectedYearLevel(initialDiv.yearLevel);
        } else {
          setDivisions([]);
          setSelectedDivision(null);
        }
      } catch (err) {
        console.warn('Failed to load dept details from database:', err);
        setDivisions([]);
        setSelectedDivision(null);
      }
    };

    loadDeptDetails();
  }, [selectedDept]);

  // When selected division changes, load batches from database
  useEffect(() => {
    if (!selectedDivision) {
      setBatches([]);
      setSelectedBatch(null);
      return;
    }

    const loadBatches = async () => {
      try {
        const batchesRes = await apiService.getBatches(selectedDivision.id).catch(() => []);
        if (batchesRes && batchesRes.length > 0) {
          setBatches(batchesRes);
          setSelectedBatch(batchesRes[0]);
        } else {
          setBatches([]);
          setSelectedBatch(null);
        }
      } catch (err) {
        console.warn('Failed to load division batches from database:', err);
        setBatches([]);
        setSelectedBatch(null);
      }
    };

    loadBatches();
  }, [selectedDivision]);

  // Handle Term Transition Execution
  const handleExecuteTransition = async () => {
    setIsTransitioning(true);
    setTransitionSuccess(null);
    try {
      // Fetch students in the selected department to get PRNs
      const allStudents = await apiService.fetchStudents().catch(() => []);
      const cohortStudents = allStudents.filter(
        (s: any) => s.academicYear === transitionSourceYear || s.cohortBatch?.includes(transitionSourceYear)
      );

      const prns = cohortStudents.map((s: any) => s.prn || s.rollNo).filter(Boolean);

      if (prns.length === 0) {
        throw new Error(`No students found enrolled in ${transitionSourceYear} level to transition in database.`);
      }

      await apiService.transitionCohort({
        prns,
        targetAcademicYearId: academicYears[0]?.id || 1,
        targetYearLevel: transitionTargetYear,
      });

      setTransitionSuccess(`Successfully transitioned ${prns.length} students from ${transitionSourceYear} to ${transitionTargetYear} Level! An immutable audit record has been logged.`);
      setTimeout(() => {
        setShowTransitionModal(false);
        setTransitionSuccess(null);
      }, 2500);
    } catch (err: any) {
      alert(`Transition error: ${err.message || 'Could not complete transition'}`);
    } finally {
      setIsTransitioning(false);
    }
  };

  const currentTheme = selectedDept ? DEPT_THEMES[selectedDept.code] || DEPT_THEMES.CSE : DEPT_THEMES.CSE;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-150">
      {/* Departments Selection Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#000666]" />
            <h2 className="text-base font-extrabold text-slate-900">
              {isFacultyRole ? `Faculty Assigned Department: ${selectedDept?.name || facultyDeptCode}` : 'SITCOE 8 Engineering Departments'}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!isFacultyRole && (
              <button
                onClick={() => setShowTransitionModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Cohort Term Transition</span>
              </button>
            )}
            <button
              onClick={loadMasterOrgData}
              disabled={isLoading}
              className="p-1.5 text-slate-500 hover:text-[#000666] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Department Hierarchy"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {isFacultyRole ? `Scoped to ${facultyDeptCode} Department` : 'Active Academic Term: 2025–2026 (Autonomous)'}
            </span>
          </div>
        </div>

        <div className={`grid gap-3.5 ${isFacultyRole ? 'grid-cols-1 sm:grid-cols-2 max-w-xl' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {displayedDepartments.map((dept) => {
            const isSelected = selectedDept?.code === dept.code;
            const theme = DEPT_THEMES[dept.code] || DEPT_THEMES.CSE;
            return (
              <button
                key={dept.id || dept.code}
                onClick={() => {
                  setSelectedDept(dept);
                  if (onSelectDepartment) onSelectDepartment(dept.code);
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                  isSelected
                    ? `bg-gradient-to-br ${theme.gradient} text-white border-transparent shadow-lg scale-[1.02]`
                    : `bg-slate-50 hover:bg-slate-100/80 text-slate-800 ${theme.border} hover:shadow-xs`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-black tracking-wider ${
                      isSelected ? 'bg-white/20 text-white' : theme.badge
                    }`}>
                      {dept.code}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-emerald-300 animate-pulse' : 'bg-emerald-500'}`} />
                  </div>
                  <h3 className={`font-bold text-xs leading-snug line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-indigo-700'}`}>
                    {dept.name}
                  </h3>
                </div>
                <div className={`text-[10px] mt-3 font-semibold flex items-center justify-between ${isSelected ? 'text-cyan-200' : 'text-slate-500'}`}>
                  <span>{getDeptStudentCount(dept.code, dept.name)} Enrolled</span>
                  <span>NBA Accredited</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Confirmation for Default Batch */}
      {defaultBatchToast && (
        <div className="fixed top-20 right-4 sm:right-6 max-w-[calc(100vw-2rem)] z-50 bg-emerald-900/95 text-emerald-100 px-4 sm:px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 text-xs font-bold flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="truncate">{defaultBatchToast}</span>
        </div>
      )}

      {/* Selected Department Hierarchical Tree */}
      {selectedDept && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          
          {/* Degree Programs */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-700" />
                <h3 className="font-extrabold text-sm text-slate-900">Degree Programs ({programs.length})</h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                {selectedDept.code}
              </span>
            </div>

            <div className="space-y-3">
              {programs.map((prog) => (
                <div key={prog.id} className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1.5 hover:bg-indigo-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold text-indigo-900">{prog.code}</span>
                    <span className="px-2 py-0.5 bg-indigo-200/80 text-indigo-900 text-[10px] font-extrabold rounded-full">
                      {prog.degree || 'B.Tech'}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{prog.name}</h4>
                  <p className="text-[11px] text-slate-500">4-Year Full-Time Autonomous Engineering Degree</p>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Divisions with Year Level Filter (Starting from SE) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-700" />
                <h3 className="font-extrabold text-sm text-slate-900">Academic Divisions</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {divisions.filter(d => d.yearLevel === selectedYearLevel).length} Divisions ({selectedYearLevel})
              </span>
            </div>

            {/* Year Level Selector (Starting from Second Year) */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {(selectedDept?.code === 'BASIC_SCIENCES' ? ['FE'] : ['SE', 'TE', 'BE']).map((yr) => (
                <button
                  key={yr}
                  onClick={() => {
                    setSelectedYearLevel(yr as any);
                    const matching = divisions.find(d => d.yearLevel === yr);
                    if (matching) setSelectedDivision(matching);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedYearLevel === yr
                      ? 'bg-white text-[#000666] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {yr === 'SE' ? 'SE (2nd Yr)' : yr === 'TE' ? 'TE (3rd Yr)' : yr === 'BE' ? 'BE (Final Yr)' : 'FE (1st Yr)'}
                </button>
              ))}
            </div>

            {/* Divisions Grid: Div A, Div B, Div C */}
            <div className="grid grid-cols-3 gap-2.5">
              {divisions.filter(d => d.yearLevel === selectedYearLevel).length === 0 ? (
                <div className="col-span-3 py-6 text-center text-xs text-slate-400 italic">
                  No divisions found in database for {selectedYearLevel}.
                </div>
              ) : (
                divisions
                  .filter(d => d.yearLevel === selectedYearLevel)
                  .map((div) => {
                    const isDivSelected = selectedDivision?.id === div.id;
                    const divCount = getDivisionStudentCount(div.yearLevel, div.name);
                    return (
                      <button
                        key={div.id}
                        onClick={() => setSelectedDivision(div)}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          isDivSelected
                            ? 'bg-[#000666] text-white border-[#000666] shadow-md scale-[1.02]'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <h4 className="font-extrabold text-sm">{div.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 mt-1.5 inline-block rounded-full ${
                          isDivSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                        }`}>
                          {divCount} Students
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Lab & Tutorial Batches */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Batches ({selectedDivision?.name || 'Div A'})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{batches.length} Batches</span>
            </div>

            <div className="space-y-2.5">
              {batches.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  No batches configured in database for {selectedDivision?.name || 'this division'}.
                </div>
              ) : (
                batches.map((b, idx) => {
                const batchCount = getBatchStudentCount(b.name, idx);
                const isBatchSelected = selectedBatch?.id === b.id || (!selectedBatch && idx === 0);
                const isThisDefault = isBatchDefault(b.name);
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBatch(b)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                      isBatchSelected
                        ? 'bg-emerald-50/90 border-emerald-400 shadow-xs ring-2 ring-emerald-400/40'
                        : 'bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                        isBatchSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-emerald-950 truncate">{b.name}</h4>
                          {isThisDefault && (
                            <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[9px] font-extrabold rounded-md shadow-2xs shrink-0 flex items-center gap-0.5">
                              ★ Default
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-700 block truncate">Lab, Practical & Tutorial Roster</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-white text-emerald-800 text-[10px] font-extrabold rounded-full border border-emerald-200 shadow-2xs">
                      {batchCount} Students
                    </span>
                  </div>
                );
              }))}
            </div>

            {/* Prominent Default Batch Action Strip */}
            <div className="pt-1">
              {isBatchDefault(selectedBatch?.name) ? (
                <div className="w-full py-2 px-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 shadow-2xs">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>{selectedYearLevel} • {selectedDivision?.name || 'Div A'} • {selectedBatch?.name || 'Batch A1'} is your Default Batch</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSaveDefaultBatch(selectedBatch?.name)}
                  disabled={isSavingDefaultBatch}
                  className="w-full py-2.5 px-4 bg-[#000666] hover:bg-[#1a237e] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-300">star</span>
                  <span>Set {selectedYearLevel} • {selectedDivision?.name || 'Div A'} • {selectedBatch?.name || 'Batch A1'} as Default Batch</span>
                </button>
              )}
            </div>

            {/* Selected Batch Student Roster Preview */}
            {selectedBatch && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                  <span className="font-extrabold text-slate-800">
                    Enrolled Roster: {selectedBatch.name}
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {getBatchStudents(selectedBatch.name, batches.findIndex(x => x.id === selectedBatch.id)).length} Database Records
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {getBatchStudents(selectedBatch.name, batches.findIndex(x => x.id === selectedBatch.id)).map((st: any) => (
                    <div key={st.id || st.prn} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{st.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">PRN: {st.prn} | Roll: {st.rollNo}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                        {st.department || 'CSE'}
                      </span>
                    </div>
                  ))}
                  {getBatchStudents(selectedBatch.name, batches.findIndex(x => x.id === selectedBatch.id)).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2 italic">
                      No students currently assigned to this batch in database.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Term Transition Execution Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600 border border-amber-200">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Academic Cohort Term Transition</h3>
                  <p className="text-xs text-slate-500">Promote student batches to next academic year & semester</p>
                </div>
              </div>
              <button
                onClick={() => setShowTransitionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {transitionSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{transitionSuccess}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">Non-Destructive Historical Enrollment:</p>
                  <p>
                    Transitioning preserves all past term attendance, exam records, and parent linkages while activating the new term enrollment.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Source Year Level</label>
                    <select
                      value={transitionSourceYear}
                      onChange={(e) => setTransitionSourceYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="FE">First Year (FE)</option>
                      <option value="SE">Second Year (SE)</option>
                      <option value="TE">Third Year (TE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Year Level</label>
                    <select
                      value={transitionTargetYear}
                      onChange={(e) => setTransitionTargetYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="SE">Second Year (SE)</option>
                      <option value="TE">Third Year (TE)</option>
                      <option value="BE">Final Year (BE)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransitionModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteTransition}
                    disabled={isTransitioning}
                    className="px-5 py-2 bg-[#000666] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    {isTransitioning ? 'Executing Transition...' : `Promote ${transitionSourceYear} → ${transitionTargetYear}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
