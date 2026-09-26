import React from 'react';
import { Barangay, SwineRecord, UserAccount } from '../../types';
import { ImportSwineModal } from '../records/ImportSwineModal';
import { storageService } from '../../services/storageService';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  barangays: Barangay[];
  currentUser: UserAccount | null;
  onImportComplete: (count: number) => void;
  existingRecords?: SwineRecord[];
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  barangays,
  currentUser,
  onImportComplete,
  existingRecords,
}) => {
  const records = existingRecords || storageService.getSwineRecords();

  return (
    <ImportSwineModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onImportComplete}
      barangays={barangays}
      currentUser={currentUser}
      existingRecords={records}
    />
  );
};
