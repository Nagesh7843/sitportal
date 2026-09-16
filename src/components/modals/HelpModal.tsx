import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#c6c5d4]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000666]">help</span>
            <h3 className="font-bold text-[18px] text-[#071e27]">Portal Help & Guidelines</h3>
          </div>
          <button onClick={onClose} className="text-[#767683]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-3 text-[13px] text-[#454652] mb-6">
          <p><strong>Broadcasting Emails:</strong> Access the Bulk Email Panel to send encrypted notices to student groups.</p>
          <p><strong>Faculty Profiles:</strong> Browse the directory to view designations, qualifications, research domains, and office hours.</p>
          <p><strong>Emergency Alerts:</strong> Use the red FAB button at the bottom right to send urgent notices.</p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#000666] text-white font-bold text-[13px] rounded-xl"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
};
