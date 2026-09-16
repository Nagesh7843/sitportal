import React from 'react';
import { ActivityLog, UploadAsset, StudentRecord } from '@/types';
import { UrgentNoticeModal } from './UrgentNoticeModal';
import { AddNoticeModal } from './AddNoticeModal';
import { AddStudentModal } from './AddStudentModal';
import { AddFacultyModal } from './AddFacultyModal';
import { UploadAssetModal } from './UploadAssetModal';
import { NotificationsDrawer } from './NotificationsDrawer';
import { HelpModal } from './HelpModal';

interface ModalsContainerProps {
  showUrgentNotice: boolean;
  onOpenUrgentNotice?: () => void;
  onCloseUrgentNotice: () => void;
  onSendUrgentNotice: (title: string, message: string, file: File | null) => void;

  showAddNotice: boolean;
  onCloseAddNotice: () => void;
  onAddNotice: (notice: ActivityLog) => void;

  showAddStudent: boolean;
  onCloseAddStudent: () => void;
  onAddStudent: (student: StudentRecord) => void;
  onAddStudentsBulk: (students: StudentRecord[]) => void;

  showAddFaculty: boolean;
  onCloseAddFaculty: () => void;
  onAddFaculty: (faculty: any) => void;

  showUploadAssignment: boolean;
  onCloseUploadAssignment: () => void;
  onAddAsset: (asset: UploadAsset) => void;

  showUploadMaterial: boolean;
  onCloseUploadMaterial: () => void;

  showNotifications: boolean;
  onCloseNotifications: () => void;
  onOpenDeviceDispatch?: (notice?: any) => void;

  showHelp: boolean;
  onCloseHelp: () => void;
}

export const ModalsContainer: React.FC<ModalsContainerProps> = ({
  showUrgentNotice,
  onOpenUrgentNotice,
  onCloseUrgentNotice,
  onSendUrgentNotice,
  showAddNotice,
  onCloseAddNotice,
  onAddNotice,
  showAddStudent,
  onCloseAddStudent,
  onAddStudent,
  onAddStudentsBulk,
  showAddFaculty,
  onCloseAddFaculty,
  onAddFaculty,
  showUploadAssignment,
  onCloseUploadAssignment,
  onAddAsset,
  showUploadMaterial,
  onCloseUploadMaterial,
  showNotifications,
  onCloseNotifications,
  onOpenDeviceDispatch,
  showHelp,
  onCloseHelp,
}) => {
  return (
    <>


      <UrgentNoticeModal
        isOpen={showUrgentNotice}
        onClose={onCloseUrgentNotice}
        onSendUrgentNotice={onSendUrgentNotice}
      />

      <AddNoticeModal
        isOpen={showAddNotice}
        onClose={onCloseAddNotice}
        onAddNotice={onAddNotice}
      />

      <AddStudentModal
        isOpen={showAddStudent}
        onClose={onCloseAddStudent}
        onAddStudent={onAddStudent}
        onAddStudentsBulk={onAddStudentsBulk}
      />

      <AddFacultyModal
        isOpen={showAddFaculty}
        onClose={onCloseAddFaculty}
        onAddFaculty={onAddFaculty}
      />

      <UploadAssetModal
        isOpen={showUploadAssignment || showUploadMaterial}
        isAssignmentMode={showUploadAssignment}
        onClose={() => {
          onCloseUploadAssignment();
          onCloseUploadMaterial();
        }}
        onAddAsset={onAddAsset}
      />

      <NotificationsDrawer
        isOpen={showNotifications}
        onClose={onCloseNotifications}
        onOpenDeviceDispatch={onOpenDeviceDispatch}
      />

      <HelpModal
        isOpen={showHelp}
        onClose={onCloseHelp}
      />
    </>
  );
};
