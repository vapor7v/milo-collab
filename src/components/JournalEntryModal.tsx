import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QuickJournalEntry from './QuickJournalEntry';
import { useNavigate } from 'react-router-dom';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JournalEntryModal({ isOpen, onClose }: JournalEntryModalProps) {
  const navigate = useNavigate();

  const handleHistoryClick = () => {
    onClose();
    navigate('/journal');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily Journal Entry</DialogTitle>
        </DialogHeader>
        <QuickJournalEntry
          onClose={handleClose}
          onHistoryClick={handleHistoryClick}
        />
      </DialogContent>
    </Dialog>
  );
}