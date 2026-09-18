import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { StudentRecord } from '@/types';

interface StudentSelfServicePanelProps {
  student: StudentRecord | null;
  onRefresh?: () => void;
}

export const StudentSelfServicePanel: React.FC<StudentSelfServicePanelProps> = ({ student, onRefresh }) => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [academicData, setAcademicData] = useState<any>(null);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [fieldName, setFieldName] = useState('parentPhone');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');

  // Address Edit State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    addressLine1: student?.addressLine1 || '',
    addressLine2: student?.addressLine2 || '',
    villageCity: student?.villageCity || '',
    taluka: student?.taluka || '',
    district: student?.district || '',
    state: student?.state || 'Maharashtra',
    pinCode: student?.pinCode || '',
    country: student?.country || 'India'
  });

  useEffect(() => {
    if (student) {
      setAddressForm({
        addressLine1: student.addressLine1 || '',
        addressLine2: student.addressLine2 || '',
        villageCity: student.villageCity || '',
        taluka: student.taluka || '',
        district: student.district || '',
        state: student.state || 'Maharashtra',
        pinCode: student.pinCode || '',
        country: student.country || 'India'
      });
    }
  }, [student]);

  const handleOpenAddressModal = () => {
    setAddressError(null);
    setAddressForm({
      addressLine1: student?.addressLine1 || '',
      addressLine2: student?.addressLine2 || '',
      villageCity: student?.villageCity || '',
      taluka: student?.taluka || '',
      district: student?.district || '',
      state: student?.state || 'Maharashtra',
      pinCode: student?.pinCode || '',
      country: student?.country || 'India'
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    if (!addressForm.addressLine1.trim()) {
      setAddressError('Address Line 1 is required.');
      return;
    }
    if (!addressForm.villageCity.trim()) {
      setAddressError('Village / City is required.');
      return;
    }
    if (!addressForm.taluka.trim()) {
      setAddressError('Taluka is required.');
      return;
    }
    if (!addressForm.district.trim()) {
      setAddressError('District is required.');
      return;
    }
    if (!addressForm.state.trim()) {
      setAddressError('State is required.');
      return;
    }
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!addressForm.pinCode.trim() || !pinRegex.test(addressForm.pinCode.trim())) {
      setAddressError('Invalid PIN Code. Must be a valid 6-digit Indian postal code (e.g. 416115).');
      return;
    }
    if (!addressForm.country.trim()) {
      setAddressError('Country is required.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const targetId = student?.id || prn;
      await apiService.updateStudentAddress(targetId, addressForm);
      setStatusMsg({ type: 'success', text: 'Permanent home address updated successfully!' });
      setShowAddressModal(false);
      if (onRefresh) onRefresh();
      await loadStudentDetails();
    } catch (err: any) {
      setAddressError(err.message || 'Failed to update address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const prn = student?.prn || student?.rollNo || '';

  const loadStudentDetails = async () => {
    if (!prn) return;
    setIsLoading(true);
    try {
      const [enrollRes, acadRes, reqRes] = await Promise.all([
        apiService.getStudentEnrollments(prn).catch(() => []),
        apiService.getStudentAcademicData(prn).catch(() => null),
        apiService.getStudentChangeRequests(prn).catch(() => [])
      ]);
      setEnrollments(enrollRes);
      setAcademicData(acadRes);
      setChangeRequests(reqRes);
    } catch (err) {
      console.warn('Failed to load student self-service details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentDetails();
  }, [prn]);

  const handleSubmitChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    setSubmitting(true);
    setStatusMsg(null);

    let oldVal = '';
    if (fieldName === 'parentPhone') oldVal = student?.parentPhone || '';
    if (fieldName === 'parentName') oldVal = student?.parentName || '';
    if (fieldName === 'parentEmail') oldVal = student?.parentEmail || '';

    try {
      await apiService.submitStudentChangeRequest(prn, {
        studentId: student?.id || 1,
        fieldName,
        oldValue: oldVal,
        newValue: newValue.trim(),
        reason: reason.trim() || 'Student profile update'
      });
      setStatusMsg({ type: 'success', text: 'Change request submitted for department verification.' });
      setShowModal(false);
      setNewValue('');
      setReason('');
      await loadStudentDetails();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit change request.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Permanent Identity & Academic Snapshot Banner */}
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00337c] to-[#024099] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              <span className="material-symbols-outlined text-[28px]">account_circle</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{student?.name || 'Student Name'}</h2>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                  Verified Identity
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Permanent PRN: <span className="font-bold text-gray-800">{prn || 'N/A'}</span> • Roll No: {student?.rollNo || 'N/A'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-[#00337c] text-white hover:bg-blue-900 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            Request Profile Edit
          </button>
        </div>

        {statusMsg && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <span className="material-symbols-outlined text-[18px]">{statusMsg.type === 'success' ? 'check_circle' : 'error'}</span>
            {statusMsg.text}
          </div>
        )}

        {/* Academic Placement Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100">
            <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Cumulative CGPA</span>
            <p className="text-lg font-bold text-blue-900 mt-1">
              {academicData?.cgpa 
                ? `${academicData.cgpa} / 10.0` 
                : (student?.gpa || student?.cgpa ? `${student?.gpa || student?.cgpa} / 10.0` : 'N/A')}
            </p>
            <span className="text-[10px] text-blue-600 font-medium">Placement Benchmark</span>
          </div>

          <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100">
            <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">10th Std (SSC) %</span>
            <p className="text-lg font-bold text-indigo-900 mt-1">
              {academicData?.tenthPercentage !== undefined && academicData?.tenthPercentage !== null
                ? `${academicData.tenthPercentage}%`
                : (student?.tenthPercentage !== undefined && student?.tenthPercentage !== null ? `${student.tenthPercentage}%` : 'N/A')}
            </p>
            <span className="text-[10px] text-indigo-600 font-medium">Secondary School</span>
          </div>

          <div className="bg-violet-50/60 rounded-xl p-3.5 border border-violet-100">
            <span className="text-[10px] uppercase font-bold text-violet-700 tracking-wider">
              {academicData?.qualificationPath === 'DIPLOMA' || student?.qualificationPath === 'DIPLOMA' 
                ? 'Diploma Aggregate %' 
                : '12th Std (HSC) %'}
            </span>
            <p className="text-lg font-bold text-violet-900 mt-1">
              {academicData?.qualificationPath === 'DIPLOMA' || student?.qualificationPath === 'DIPLOMA'
                ? (academicData?.diplomaPercentage !== undefined && academicData?.diplomaPercentage !== null
                    ? `${academicData.diplomaPercentage}%`
                    : (student?.diplomaPercentage !== undefined && student?.diplomaPercentage !== null ? `${student.diplomaPercentage}%` : 'N/A'))
                : (academicData?.twelfthPercentage !== undefined && academicData?.twelfthPercentage !== null
                    ? `${academicData.twelfthPercentage}%`
                    : (student?.twelfthPercentage !== undefined && student?.twelfthPercentage !== null ? `${student.twelfthPercentage}%` : 'N/A'))}
            </p>
            <span className="text-[10px] text-violet-600 font-medium">
              Path: {academicData?.qualificationPath || student?.qualificationPath || '12TH Std'}
            </span>
          </div>

          <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Active Term</span>
            <p className="text-lg font-bold text-emerald-900 mt-1">
              {student?.academicYear ? `${student.academicYear} Year` : 'CSE'}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">
              {student?.division || 'Div A'} • Batch {student?.batchGroup || 'A1'}
            </span>
          </div>
        </div>
      </div>

      {/* Permanent Home Address Card */}
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00337c] text-[22px]">home_pin</span>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Permanent Home Address</h3>
              <p className="text-[11px] text-gray-500">Your verified permanent residence record on institutional file.</p>
            </div>
          </div>
          <button
            onClick={handleOpenAddressModal}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00337c] font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">edit_location_alt</span>
            <span>Update Address</span>
          </button>
        </div>

        {student?.addressLine1 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Street & Locality</span>
              <p className="text-xs font-bold text-slate-900">{student.addressLine1}</p>
              {student.addressLine2 && (
                <p className="text-xs text-slate-600">{student.addressLine2}</p>
              )}
              <p className="text-xs text-slate-700 font-medium pt-1">
                {student.villageCity}, Taluka: {student.taluka || 'N/A'}, Dist: {student.district || 'N/A'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Region & Postal</span>
                <p className="text-xs font-bold text-slate-900 mt-1">{student.state || 'Maharashtra'}, {student.country || 'India'}</p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PIN Code:</span>
                <span className="px-2 py-0.5 bg-blue-100 text-[#00337c] rounded-md font-mono text-xs font-bold">
                  {student.pinCode || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-700 text-[20px]">warning</span>
              <div>
                <p className="text-xs font-bold text-amber-900">Home Address Record Incomplete</p>
                <p className="text-[11px] text-amber-700">Please provide your permanent home address to complete institutional records.</p>
              </div>
            </div>
            <button
              onClick={handleOpenAddressModal}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Add Address
            </button>
          </div>
        )}
      </div>

      {/* Enrollment Progression History Timeline */}
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#00337c]">history_edu</span>
          <h3 className="font-bold text-gray-900 text-sm">Academic Enrollment Progression History</h3>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-xs text-gray-500 py-3 bg-gray-50 rounded-xl px-4 border border-gray-100">
            Current active enrollment: <strong>{student?.academicYear || 'BE'}</strong> ({student?.division || 'Div A'} - Batch {student?.batchGroup || '1'}). Historical semester progression records will populate on institutional semester transitions.
          </div>
        ) : (
          <div className="relative border-l-2 border-blue-200 ml-4 space-y-4 py-2">
            {enrollments.map((en, idx) => (
              <div key={en.id || idx} className="ml-6 relative">
                <span className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  en.isCurrent ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-gray-400'
                }`} />
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900">
                      {en.yearLevel} Level (Semester {en.semesterId || 'N/A'})
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      en.isCurrent ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {en.isCurrent ? 'Active Current Term' : 'Historical Term'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Division {en.divisionId || 'A'} • Batch {en.batchId || '1'} • Status: {en.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Requests Audit Trail */}
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#00337c]">task_alt</span>
          <h3 className="font-bold text-gray-900 text-sm">Self-Service Profile Edit Requests</h3>
        </div>

        {changeRequests.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-xl border border-gray-100">
            No profile change requests submitted yet. Use "Request Profile Edit" above to request verified changes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
                  <th className="p-3">Field</th>
                  <th className="p-3">Previous Value</th>
                  <th className="p-3">Requested Value</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {changeRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/80">
                    <td className="p-3 font-semibold text-gray-900 capitalize">{req.fieldName}</td>
                    <td className="p-3 text-gray-500">{req.oldValue || '—'}</td>
                    <td className="p-3 font-mono font-bold text-[#00337c]">{req.newValue}</td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">{req.reason || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 text-[11px]">{req.createdAt?.substring(0, 10) || 'Recent'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profile Edit Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00337c]">edit_note</span>
                <h3 className="font-bold text-gray-900 text-base">Submit Profile Change Request</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitChangeRequest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Profile Field</label>
                <select
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="parentPhone">Parent / Guardian Contact Phone</option>
                  <option value="parentEmail">Parent / Guardian Email</option>
                  <option value="parentName">Parent / Guardian Full Name</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Value</label>
                <input
                  type="text"
                  required
                  placeholder="Enter corrected value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Change</label>
                <textarea
                  rows={2}
                  placeholder="Brief reason for verification desk review"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#00337c] hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent Home Address Edit Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00337c]">edit_location_alt</span>
                <h3 className="font-bold text-gray-900 text-base">Update Permanent Home Address</h3>
              </div>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {addressError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  required
                  placeholder="House / Flat No., Building, Street Name"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  placeholder="Area, Locality, Landmark"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Village / City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ichalkaranji"
                    value={addressForm.villageCity}
                    onChange={(e) => setAddressForm({ ...addressForm, villageCity: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Taluka *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hatkanangale"
                    value={addressForm.taluka}
                    onChange={(e) => setAddressForm({ ...addressForm, taluka: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolhapur"
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 416115"
                    value={addressForm.pinCode}
                    onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2 bg-[#00337c] hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingAddress ? 'Saving Address...' : 'Save Permanent Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
