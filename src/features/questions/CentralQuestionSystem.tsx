import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, QuestionItem } from '@/types';
import { apiService } from '@/services/api';

interface CentralQuestionSystemProps {
  currentProfile: UserProfile | null;
  userRole: UserRole;
}

export const CentralQuestionSystem: React.FC<CentralQuestionSystemProps> = ({
  currentProfile,
  userRole,
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAskModal, setShowAskModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [activeQuestionForAnswer, setActiveQuestionForAnswer] = useState<QuestionItem | null>(null);

  // Ask form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Academics');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Answer form state
  const [answerContent, setAnswerContent] = useState('');

  const categories = [
    'All',
    'Academics',
    'Examinations',
    'Fees & Scholarships',
    'Placement & Internships',
    'Campus & Facilities',
    'Attendance & Leave',
    'General',
  ];

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.fetchQuestions(
        selectedCategory === 'All' ? undefined : selectedCategory,
        selectedStatus === 'All' ? undefined : selectedStatus,
        searchQuery ? searchQuery : undefined
      );
      setQuestions(data);
    } catch (err) {
      console.warn('Error loading questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuestions();
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setFormError('Please fill in both title and question details.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      await apiService.createQuestion({
        title: newTitle.trim(),
        category: newCategory,
        content: newContent.trim(),
        authorName: currentProfile?.name || (userRole === 'parent' ? 'Parent User' : 'Student User'),
        authorRole: userRole,
      });
      setShowAskModal(false);
      setNewTitle('');
      setNewContent('');
      loadQuestions();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestionForAnswer || !answerContent.trim()) return;
    setIsSubmitting(true);
    try {
      await apiService.addQuestionAnswer(activeQuestionForAnswer.id, {
        content: answerContent.trim(),
        responderName: currentProfile?.name || 'Department Faculty',
        responderRole: userRole,
        responderTitle: currentProfile?.roleTitle || (userRole === 'hod' ? 'Head of Department' : 'Faculty Member'),
      });
      setShowAnswerModal(false);
      setAnswerContent('');
      setActiveQuestionForAnswer(null);
      loadQuestions();
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (id: number) => {
    try {
      const updated = await apiService.upvoteQuestion(id);
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, upvotes: updated.upvotes } : q)));
    } catch (err) {
      console.warn('Upvote error:', err);
    }
  };

  const handleToggleResolve = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
    try {
      await apiService.updateQuestionStatus(id, nextStatus);
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, status: nextStatus as any } : q)));
    } catch (err) {
      console.warn('Status update error:', err);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }
    try {
      await apiService.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete question.');
    }
  };

  const canAnswer = ['faculty', 'hod', 'admin'].includes(userRole);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#00337c] to-[#1e40af] rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">forum</span>
              Institutional Central Q&A System
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Central Question & Answer System
            </h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1 font-medium leading-snug">
              Transparent discussion forum for SITCOE students, parents, and faculty members.
            </p>
          </div>

          <div>
            <button
              onClick={() => setShowAskModal(true)}
              className="px-5 py-2.5 bg-white text-[#00337c] hover:bg-blue-50 font-bold text-sm rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Ask a Question
            </button>
          </div>
        </div>
      </div>

      {/* Filters, Categories & Search */}
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-4 shadow-xs space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#00337c] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <input
              type="text"
              placeholder="Search questions by topic, keyword, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00337c] focus:outline-none"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">
              search
            </span>
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            {['All', 'OPEN', 'ANSWERED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  selectedStatus === st
                    ? 'bg-blue-100 text-[#00337c] border border-blue-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
            <span className="material-symbols-outlined animate-spin text-3xl text-[#00337c] mb-2">
              autorenew
            </span>
            <p>Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 space-y-3">
            <span className="material-symbols-outlined text-4xl text-gray-300">chat_bubble_outline</span>
            <p className="font-semibold text-gray-700">No questions found in this category.</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Be the first to raise a question or query regarding academics, schedules, or events.
            </p>
            <button
              onClick={() => setShowAskModal(true)}
              className="px-4 py-2 bg-[#00337c] text-white text-xs font-bold rounded-xl hover:bg-blue-900"
            >
              Ask a Question Now
            </button>
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-[#d6d9e0] p-5 hover:shadow-xs transition-shadow space-y-4"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-[#00337c] border border-blue-200 rounded text-[10px] font-bold uppercase tracking-wider">
                      {q.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        q.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.status === 'ANSWERED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.status}
                    </span>
                    <span className="text-[11px] text-gray-400">•</span>
                    <span className="text-[11px] text-gray-500">
                      Asked by <strong className="text-gray-800">{q.authorName}</strong> ({q.authorRole})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 pt-1">{q.title}</h3>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{q.content}</p>
                </div>

                {/* Upvote Pill */}
                <button
                  onClick={() => handleUpvote(q.id)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-[#00337c] text-gray-600 border border-gray-200 transition-colors shrink-0"
                  title="Upvote / Helpful"
                >
                  <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                  <span className="text-xs font-bold mt-0.5">{q.upvotes || 0}</span>
                </button>
              </div>

              {/* Answers Section */}
              {q.answers && q.answers.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                    Official Faculty Answers ({q.answers.length})
                  </div>
                  {q.answers.map((ans) => (
                    <div
                      key={ans.id}
                      className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-gray-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="font-bold text-emerald-900 flex items-center gap-1">
                          <span>{ans.responderName}</span>
                          <span className="text-emerald-700 font-normal">
                            ({ans.responderTitle || ans.responderRole})
                          </span>
                        </div>
                        <span className="text-emerald-700 text-[10px] font-semibold uppercase">Verified Response</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-line">{ans.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Question Footer / Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <div className="text-[11px] text-gray-400">
                  {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Recent'}
                </div>

                <div className="flex items-center gap-2">
                  {canAnswer && (
                    <button
                      onClick={() => {
                        setActiveQuestionForAnswer(q);
                        setShowAnswerModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#00337c] text-white hover:bg-blue-900 font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">reply</span>
                      Post Official Answer
                    </button>
                  )}

                  {(canAnswer || q.authorRole === userRole) && (
                    <button
                      onClick={() => handleToggleResolve(q.id, q.status)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors inline-flex items-center gap-1 text-[11px] ${
                        q.status === 'RESOLVED'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      {q.status === 'RESOLVED' ? 'Reopen Query' : 'Mark as Resolved'}
                    </button>
                  )}

                  {(['admin', 'hod'].includes(userRole) || 
                    (currentProfile?.email && q.authorEmail && currentProfile.email.toLowerCase() === q.authorEmail.toLowerCase()) ||
                    (currentProfile?.name && q.authorName && currentProfile.name.toLowerCase() === q.authorName.toLowerCase())) && (
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="px-2.5 py-1.5 rounded-lg font-semibold transition-colors inline-flex items-center gap-1 text-[11px] text-red-600 hover:bg-red-50 border border-red-200"
                      title="Delete Question"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Ask a Question */}
      {showAskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00337c]">help</span>
                Ask a Question to Faculty & Department
              </h3>
              <button onClick={() => setShowAskModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleAskQuestion} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Question Subject / Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for CIE 1 Special Lab Examination"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00337c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00337c] focus:outline-none"
                >
                  <option value="Academics">Academics</option>
                  <option value="Examinations">Examinations</option>
                  <option value="Fees & Scholarships">Fees & Scholarships</option>
                  <option value="Placement & Internships">Placement & Internships</option>
                  <option value="Campus & Facilities">Campus & Facilities</option>
                  <option value="Attendance & Leave">Attendance & Leave</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Question Description & Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed description of your query..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00337c] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00337c] text-white text-xs font-semibold rounded-xl hover:bg-blue-900 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Faculty Answer Submission */}
      {showAnswerModal && activeQuestionForAnswer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">rate_review</span>
                Submit Official Department Response
              </h3>
              <button onClick={() => setShowAnswerModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 mb-4 text-xs">
              <span className="font-bold text-gray-800">Question: {activeQuestionForAnswer.title}</span>
              <p className="text-gray-600 mt-1 line-clamp-2">{activeQuestionForAnswer.content}</p>
            </div>

            <form onSubmit={handleAnswerQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Official Response <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type official verified response from faculty/department..."
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnswerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Official Answer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
