import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { PlacementDrive } from '@/types';
import { PlacementEligibilityDesk } from './PlacementEligibilityDesk';
import { CompanyLogoBadge } from '@/components/common/CompanyLogoBadge';
import { 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  RefreshCw,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';

interface PlacementEligibilityHubTabProps {
  onNavigateNotice?: () => void;
}

export const PlacementEligibilityHubTab: React.FC<PlacementEligibilityHubTabProps> = ({ onNavigateNotice }) => {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [selectedDriveForDesk, setSelectedDriveForDesk] = useState<PlacementDrive | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    setIsLoading(true);
    try {
      const summary = await apiService.fetchPlacementSummary();
      setDrives(summary.drives || []);
    } catch (err) {
      console.warn('Error loading placement drives:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-150">
      
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-[#000666] via-[#1a237e] to-[#024099] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-cyan-200 border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            Institutional Placement Qualification Engine
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Placement Drives & Candidate Pool Verification Desk
          </h2>
          <p className="text-xs md:text-sm text-cyan-100 max-w-2xl">
            Evaluate registered student batches mathematically against drive thresholds with zero-loss dual qualification resolution (12th HSC vs. Diploma Lateral Entry).
          </p>
        </div>

        <button
          onClick={loadDrives}
          disabled={isLoading}
          className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Drives
        </button>
      </div>

      {/* Drives Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-sm font-semibold">Loading active placement recruitment drives...</p>
        </div>
      ) : drives.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
          <Building2 className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No Placement Drives Configured Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Schedule placement drives from the Public Portal Placement Hub or add recruiters to start running candidate eligibility evaluations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drives.map((drive) => (
            <div
              key={drive.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all p-5 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CompanyLogoBadge
                      name={drive.companyName}
                      logoUrl={drive.logoUrl}
                      size="md"
                      className="border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors">
                        {drive.companyName}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {drive.status || 'UPCOMING'}
                      </span>
                    </div>
                  </div>

                  {drive.packageLpa && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black shrink-0">
                      {drive.packageLpa}
                    </span>
                  )}
                </div>

                {/* Role Details */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-xs font-bold text-slate-800">{drive.role}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {drive.eligibility || 'Standard Engineering Placement Criteria (Min 6.0 CGPA, 60% SSC/HSC/Diploma)'}
                  </p>
                </div>

                {/* Date & Deadline Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Drive: <strong>{drive.driveDate || 'TBD'}</strong>
                  </span>
                  {drive.applyDeadline && (
                    <span className="text-rose-600 font-bold">
                      Due: {drive.applyDeadline}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedDriveForDesk(drive)}
                className="w-full py-2.5 bg-gradient-to-r from-[#000666] to-indigo-700 hover:from-[#1a237e] hover:to-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-lg active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Launch Eligibility Desk
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Modal Desk */}
      {selectedDriveForDesk && (
        <PlacementEligibilityDesk
          drive={selectedDriveForDesk}
          isOpen={Boolean(selectedDriveForDesk)}
          onClose={() => setSelectedDriveForDesk(null)}
          onBroadcastNotice={() => {
            setSelectedDriveForDesk(null);
            if (onNavigateNotice) onNavigateNotice();
          }}
        />
      )}
    </div>
  );
};
