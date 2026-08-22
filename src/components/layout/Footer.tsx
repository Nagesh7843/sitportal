import React from 'react';
import { ViewMode } from '@/types';
import sitLogo from '@/assets/sit-logo.png';

interface FooterProps {
  onNavigate?: (view: ViewMode) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#071e27] text-[#f3faff] py-4 px-6 mt-6 border-t border-[#767683]">
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
            onClick={() => onNavigate && onNavigate('curriculum')} 
            className="text-[#cfe6f2] hover:text-[#e0e0ff] transition-colors"
          >
            Curriculum & Syllabus
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

      {/* Department Contact & Address */}
      <div className="max-w-[1440px] mx-auto mt-4 pt-4 border-t border-[#c6c5d4]/20 flex justify-center text-center">
          {/* Contact */}
          <div className="flex flex-col items-center">
            <h4 className="text-[13px] font-bold text-[#759efd] uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Department Contact
            </h4>
            <ul className="space-y-2 text-[13px] text-[#cfe6f2]">
              <li className="flex flex-col sm:flex-row items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#759efd]">school</span>
                <span>Department Email: <a href="mailto:csedepartment@sitcoe.org.in" className="hover:text-[#e0e0ff] transition-colors font-semibold">csedepartment@sitcoe.org.in</a></span>
              </li>
            </ul>
          </div>
      </div>
    </footer>
  );
};
