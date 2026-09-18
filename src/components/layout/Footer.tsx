import React from 'react';
import { ViewMode } from '@/types';
import sitLogo from '@/assets/sit-logo.png';

interface FooterProps {
  onNavigate?: (view: ViewMode) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#071e27] text-[#f3faff] py-4 px-4 sm:px-6 pb-20 lg:pb-6 mt-6 border-t border-[#767683] overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <img src={sitLogo} alt="Sharad Institute of Technology" className="h-12 w-auto object-contain shrink-0" />
          <div>
            <span className="font-bold text-[18px] text-[#f3faff]">SITCOE Institutional Portal</span>
            <p className="text-[11px] text-[#cfe6f2]/80">Sharad Institute of Technology College of Engineering</p>
          </div>

        </div>

        <div className="flex flex-wrap justify-center gap-6 text-[13px]">
          <button 
            onClick={() => onNavigate && onNavigate('public-landing')} 
            className="text-[#cfe6f2] hover:text-[#e0e0ff] transition-colors"
          >
            Portal Home
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('academic-calendar')} 
            className="text-[#cfe6f2] hover:text-[#e0e0ff] transition-colors"
          >
            Academic Calendar
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('faculty')} 
            className="text-[#cfe6f2] hover:text-[#e0e0ff] transition-colors"
          >
            Faculty Directory
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('settings')} 
            className="text-[#cfe6f2] hover:text-[#e0e0ff] transition-colors"
          >
            Settings
          </button>
        </div>
      </div>

    </footer>
  );
};
