import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '@/services/api';
import { NoticeItem } from '@/types';

interface SendNoticeToDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice?: NoticeItem | null;
  availableNotices?: NoticeItem[];
  onDispatchSuccess?: (summary: any) => void;
}

export const SendNoticeToDeviceModal: React.FC<SendNoticeToDeviceModalProps> = ({
  isOpen,
  onClose,
  notice: initialNotice,
  availableNotices = [],
  onDispatchSuccess
}) => {
  // Notice Selection State
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | string | ''>(
    initialNotice?.id || (availableNotices.length > 0 ? availableNotices[0].id || '' : '')
  );
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Target Criteria State
  const [targetDepartment, setTargetDepartment] = useState<string>('ALL');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['STUDENT', 'FACULTY']);
  const [targetMode, setTargetMode] = useState<'CRITERIA' | 'SPECIFIC_DEVICES'>('CRITERIA');

  // Explicit device list state
  const [registeredDevices, setRegisteredDevices] = useState<any[]>([]);
  const [selectedDeviceEndpoints, setSelectedDeviceEndpoints] = useState<string[]>([]);

  // Preview & Delivery State
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Notice resolution
  const activeNotice = useMemo(() => {
    if (selectedNoticeId && availableNotices.length > 0) {
      return availableNotices.find((n) => String(n.id) === String(selectedNoticeId)) || initialNotice;
    }
    return initialNotice || null;
  }, [selectedNoticeId, availableNotices, initialNotice]);

  // Sync initial notice when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialNotice?.id) {
        setSelectedNoticeId(initialNotice.id);
      } else if (availableNotices.length > 0) {
        setSelectedNoticeId(availableNotices[0].id || '');
      }
      setDeliveryResult(null);
      setErrorMessage(null);

      // Load registered devices
      apiService.fetchRegisteredDevices()
        .then((devices) => {
          setRegisteredDevices(devices || []);
          if (devices && devices.length > 0) {
            setSelectedDeviceEndpoints(devices.map((d: any) => d.endpoint));
          }
        })
        .catch((err) => console.warn('Could not fetch push devices:', err));
    }
  }, [isOpen, initialNotice, availableNotices]);

  // Live Criteria Preview Refresh
  useEffect(() => {
    if (!isOpen) return;

    const criteria: any = {
      noticeId: selectedNoticeId ? Number(selectedNoticeId) : undefined,
    };

    if (targetMode === 'SPECIFIC_DEVICES') {
      criteria.deviceEndpoints = selectedDeviceEndpoints;
    } else {
      criteria.department = targetDepartment;
      criteria.academicYears = selectedYears.length > 0 ? selectedYears : undefined;
      criteria.divisions = selectedDivisions.length > 0 ? selectedDivisions : undefined;
      criteria.batches = selectedBatches.length > 0 ? selectedBatches : undefined;
      criteria.roles = selectedRoles.length > 0 ? selectedRoles : undefined;
    }

    setIsPreviewLoading(true);
    const timeoutId = setTimeout(() => {
      apiService.previewTargetDevices(criteria)
        .then((res) => {
          setPreviewData(res);
          setIsPreviewLoading(false);
        })
        .catch(() => {
          setIsPreviewLoading(false);
        });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [
    isOpen,
    selectedNoticeId,
    targetDepartment,
    selectedYears,
    selectedDivisions,
    selectedBatches,
    selectedRoles,
    targetMode,
    selectedDeviceEndpoints
  ]);

  if (!isOpen) return null;

  const toggleYear = (yr: string) => {
    setSelectedYears((prev) => prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr]);
  };

  const toggleDivision = (div: string) => {
    setSelectedDivisions((prev) => prev.includes(div) ? prev.filter((d) => d !== div) : [...prev, div]);
  };

  const toggleBatch = (b: string) => {
    setSelectedBatches((prev) => prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]);
  };

  const toggleRole = (r: string) => {
    setSelectedRoles((prev) => prev.includes(r) ? prev.filter((role) => role !== r) : [...prev, r]);
  };

  const toggleDeviceEndpoint = (endpoint: string) => {
    setSelectedDeviceEndpoints((prev) =>
      prev.includes(endpoint) ? prev.filter((e) => e !== endpoint) : [...prev, endpoint]
    );
  };

  const handleSelectAllDevices = () => {
    if (selectedDeviceEndpoints.length === registeredDevices.length) {
      setSelectedDeviceEndpoints([]);
    } else {
      setSelectedDeviceEndpoints(registeredDevices.map((d) => d.endpoint));
    }
  };

  const totalTargetCount = previewData?.totalMatchingDevices ?? 0;
  const isSelectionValid = totalTargetCount > 0;

  const handleDispatch = async () => {
    if (!isSelectionValid) {
      setErrorMessage('Please select at least one target device.');
      return;
    }

    setIsDispatching(true);
    setErrorMessage(null);

    const criteria: any = {
      noticeId: selectedNoticeId ? Number(selectedNoticeId) : undefined,
    };

    if (targetMode === 'SPECIFIC_DEVICES') {
      criteria.deviceEndpoints = selectedDeviceEndpoints;
    } else {
      criteria.department = targetDepartment;
      criteria.academicYears = selectedYears.length > 0 ? selectedYears : undefined;
      criteria.divisions = selectedDivisions.length > 0 ? selectedDivisions : undefined;
      criteria.batches = selectedBatches.length > 0 ? selectedBatches : undefined;
      criteria.roles = selectedRoles.length > 0 ? selectedRoles : undefined;
    }

    const payload = {
      noticeId: selectedNoticeId ? Number(selectedNoticeId) : undefined,
      title: activeNotice ? activeNotice.title : customTitle.trim(),
      message: activeNotice ? activeNotice.content : customMessage.trim(),
      criteria,
      idempotencyKey: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };

    try {
      const summary = await apiService.sendNoticeToTargetDevices(payload);
      setDeliveryResult(summary);
      if (onDispatchSuccess) {
        onDispatchSuccess(summary);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send notification.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-slate-800 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Send Notice to Devices
            </h3>
            <p className="text-xs text-slate-500">
              Target by audience criteria or specific devices. Duplicate sends are avoided.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Success Result */}
        {deliveryResult ? (
          <div className="space-y-4 py-2">
            <div className={`p-4 rounded-xl border ${
              deliveryResult.status === 'DUPLICATES_SKIPPED'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            } space-y-3`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">
                  {deliveryResult.status === 'DUPLICATES_SKIPPED' ? 'info' : 'check_circle'}
                </span>
                <div>
                  <h4 className="font-bold text-sm">
                    {deliveryResult.status === 'DUPLICATES_SKIPPED'
                      ? 'Already Delivered'
                      : 'Notice Sent'}
                  </h4>
                  <p className="text-xs opacity-90">{deliveryResult.message}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-black/10">
                <div className="bg-white/80 p-2 rounded-lg">
                  <p className="text-[10px] text-slate-500 font-medium">Targeted</p>
                  <p className="text-sm font-bold text-slate-900">{deliveryResult.totalTargetDevices}</p>
                </div>
                <div className="bg-white/80 p-2 rounded-lg">
                  <p className="text-[10px] text-emerald-600 font-medium">Delivered</p>
                  <p className="text-sm font-bold text-emerald-700">{deliveryResult.newlyDeliveredCount}</p>
                </div>
                <div className="bg-white/80 p-2 rounded-lg">
                  <p className="text-[10px] text-amber-600 font-medium">Skipped</p>
                  <p className="text-sm font-bold text-amber-700">{deliveryResult.duplicatesSkippedCount}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeliveryResult(null);
                  onClose();
                }}
                className="px-5 py-2 bg-[#000666] text-white rounded-lg text-xs font-semibold hover:bg-[#1a237e] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Notice Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                1. Notice
              </label>

              {availableNotices.length > 0 ? (
                <select
                  value={selectedNoticeId}
                  onChange={(e) => setSelectedNoticeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-[#000666]"
                >
                  {availableNotices.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.category || 'General'}] {n.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Notice title..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium outline-none"
                  />
                  <textarea
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Notice content..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs outline-none resize-none"
                  />
                </div>
              )}
            </div>

            {/* 2. Target Scope */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-700">
                  2. Audience
                </label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setTargetMode('CRITERIA')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      targetMode === 'CRITERIA' ? 'bg-white text-[#000666] shadow-xs font-semibold' : 'text-slate-500'
                    }`}
                  >
                    By Criteria
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('SPECIFIC_DEVICES')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      targetMode === 'SPECIFIC_DEVICES' ? 'bg-white text-[#000666] shadow-xs font-semibold' : 'text-slate-500'
                    }`}
                  >
                    Devices ({registeredDevices.length})
                  </button>
                </div>
              </div>

              {targetMode === 'CRITERIA' ? (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  
                  {/* Department */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Department</label>
                    <select
                      value={targetDepartment}
                      onChange={(e) => setTargetDepartment(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 outline-none"
                    >
                      <option value="ALL">All Departments</option>
                      <option value="CSE">Computer Science & Engineering (CSE)</option>
                      <option value="AIDS">AI & Data Science (AIDS)</option>
                      <option value="MECH">Mechanical Engineering</option>
                      <option value="CIVIL">Civil Engineering</option>
                      <option value="ENTC">Electronics & Telecommunication</option>
                      <option value="ELECTRICAL">Electrical Engineering</option>
                      <option value="MECHATRONICS">Mechatronics</option>
                      <option value="BASIC_SCIENCES">First Year (Basic Sciences)</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Year Level ({selectedYears.length === 0 ? 'All' : selectedYears.join(', ')})
                    </label>
                    <div className="flex gap-1.5">
                      {['FE', 'SE', 'TE', 'BE'].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => toggleYear(yr)}
                          className={`flex-1 py-1 rounded-md text-xs font-medium border transition-colors ${
                            selectedYears.includes(yr)
                              ? 'bg-[#000666] text-white border-[#000666]'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divisions & Batches */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Divisions ({selectedDivisions.length === 0 ? 'All' : selectedDivisions.join(', ')})
                      </label>
                      <div className="flex gap-1">
                        {['Div A', 'Div B', 'Div C'].map((div) => (
                          <button
                            key={div}
                            type="button"
                            onClick={() => toggleDivision(div)}
                            className={`flex-1 py-1 rounded-md text-xs font-medium border transition-colors ${
                              selectedDivisions.includes(div)
                                ? 'bg-[#000666] text-white border-[#000666]'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            {div.replace('Div ', '')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Batches ({selectedBatches.length === 0 ? 'All' : selectedBatches.join(', ')})
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {['A1', 'A2', 'A3', 'B1', 'B2', 'B3'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => toggleBatch(b)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                              selectedBatches.includes(b)
                                ? 'bg-[#000666] text-white border-[#000666]'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Roles */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Roles</label>
                    <div className="flex gap-1.5">
                      {[
                        { id: 'STUDENT', label: 'Students' },
                        { id: 'FACULTY', label: 'Faculty' },
                        { id: 'PARENT', label: 'Parents' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggleRole(r.id)}
                          className={`flex-1 py-1 rounded-md text-xs font-medium border transition-colors ${
                            selectedRoles.includes(r.id)
                              ? 'bg-[#000666] text-white border-[#000666]'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Specific Devices List */
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">
                      {selectedDeviceEndpoints.length} of {registeredDevices.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllDevices}
                      className="text-[#000666] font-semibold hover:underline"
                    >
                      {selectedDeviceEndpoints.length === registeredDevices.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {registeredDevices.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2 text-center">
                        No devices registered.
                      </p>
                    ) : (
                      registeredDevices.map((d) => {
                        const isSelected = selectedDeviceEndpoints.includes(d.endpoint);
                        const isDelivered = previewData?.devices?.find((dev: any) => dev.endpoint === d.endpoint)?.isAlreadyDelivered;

                        return (
                          <div
                            key={d.id}
                            onClick={() => toggleDeviceEndpoint(d.endpoint)}
                            className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-200'
                                : 'bg-white border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-[#000666]"
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 truncate">
                                  {d.deviceType || 'Device'} • {d.userEmail || 'Active User'}
                                </p>
                              </div>
                            </div>

                            {isDelivered && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                                Already Sent
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Summary & Counts */}
            <div className="bg-slate-100 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Preview</span>
                {isPreviewLoading && (
                  <span className="text-slate-400 text-[11px]">Updating...</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-medium">Matching</p>
                  <p className="text-sm font-bold text-slate-800">{totalTargetCount}</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="text-[10px] text-emerald-600 font-medium">Will Send</p>
                  <p className="text-sm font-bold text-emerald-700">
                    {previewData?.newToDeliverCount ?? totalTargetCount}
                  </p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <p className="text-[10px] text-amber-600 font-medium">Skipping (Sent)</p>
                  <p className="text-sm font-bold text-amber-700">
                    {previewData?.alreadyDeliveredCount ?? 0}
                  </p>
                </div>
              </div>

              {!isSelectionValid && !isPreviewLoading && (
                <p className="text-[11px] text-red-600 font-medium text-center">
                  No devices match this criteria. Please select at least one device.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={!isSelectionValid || isDispatching}
                className="px-5 py-2 bg-[#000666] hover:bg-[#1a237e] text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDispatching ? (
                  <span>Sending...</span>
                ) : (
                  <span>
                    {previewData?.newToDeliverCount === 0
                      ? 'Already Sent to All'
                      : `Send to ${previewData?.newToDeliverCount || totalTargetCount} Device(s)`}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
