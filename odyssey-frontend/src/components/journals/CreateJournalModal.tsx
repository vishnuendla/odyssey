import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateJournalModal: React.FC<CreateJournalModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleCreateJournal = () => {
    onClose();
    navigate('/create');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Journal</DialogTitle>
          <DialogDescription>
            Start documenting your travel experiences by creating a new journal entry.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-4 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateJournal}>
            Create Journal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJournalModal; 