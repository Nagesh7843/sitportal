import React, { useState } from 'react';
import { UploadAsset, ViewMode } from '@/types';

interface DocumentLibraryViewProps {
  uploads: UploadAsset[];
  onOpenUploadModal?: () => void;
  onNavigate: (view: ViewMode) => void;
  onDeleteDocument?: (id: string | number) => void;
}

export const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({
  uploads,
  onOpenUploadModal,
  onDeleteDocument
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredDocs = uploads.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Minimal Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000666] text-[22px]">folder_open</span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Centralized Document Library
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-md border border-blue-200">
              Repository
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Course Syllabus • Lab Manuals • Project Briefs • Academic Guidelines • Question Banks
          </p>
        </div>

        {onOpenUploadModal && (
          <button
            onClick={onOpenUploadModal}
            className="px-3.5 py-2 bg-[#000666] hover:bg-[#002171] text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-[#c6c5d4] shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'Material', 'Assignment', 'Syllabus', 'Notice'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1 rounded-full text-[12px] font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#000666] text-white shadow-xs'
                  : 'bg-[#e6f6ff] text-[#454652] hover:bg-[#cfe6f2]'
              }`}
            >
              {cat === 'ALL' ? 'All Documents' : cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents by file name..."
          className="w-full sm:w-72 bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-3.5 py-2 text-[13px] focus:ring-2 focus:ring-[#000666] outline-none"
        />
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs hover:border-[#000666] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="bg-[#d9e2ff] text-[#00429c] font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                  {doc.category}
                </span>
                <span className="text-[11px] text-[#767683]">{doc.uploadedAt}</span>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e6f6ff] text-[#000666] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[15px] text-[#071e27] truncate leading-snug">{doc.title}</h3>
                  <p className="text-[12px] text-[#454652] mt-0.5">Size: {doc.fileSize || '3.5 MB'}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#c6c5d4]/40 flex justify-between items-center text-[12px]">
              <span className="text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified Asset
              </span>
              <div className="flex gap-2">
                {onDeleteDocument && (
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-100 flex items-center justify-center"
                    title="Delete Document"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
                <button
                  onClick={() => alert(`Downloading ${doc.title}...`)}
                  className="px-4 py-1.5 bg-[#000666] text-white rounded-lg font-bold text-[12px] hover:bg-[#1a237e] transition-colors flex items-center gap-1"
                >
                  <span>Download</span>
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
