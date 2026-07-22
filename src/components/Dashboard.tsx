import React, { useState } from 'react';
import Header from './Header';
import BoardColumns from './BoardColumns';
import TaskModal from './TaskModal';
import ArchiveModal from './ArchiveModal';
import SettingsModal from './SettingsModal';
import CategoriesModal from './CategoriesModal';

export default function Dashboard() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [taskIdToEdit, setTaskIdToEdit] = useState<string | null>(null);

  const handleOpenTaskModal = (id?: string) => {
    setTaskIdToEdit(id || null);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setTaskIdToEdit(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onOpenTaskModal={() => handleOpenTaskModal()} 
        onOpenArchive={() => setIsArchiveModalOpen(true)} 
        onOpenSettings={() => setIsSettingsModalOpen(true)} 
        onOpenCategories={() => setIsCategoriesModalOpen(true)}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <BoardColumns onEditTask={handleOpenTaskModal} />
      </main>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={handleCloseTaskModal} 
        taskIdToEdit={taskIdToEdit} 
      />
      
      <ArchiveModal 
        isOpen={isArchiveModalOpen} 
        onClose={() => setIsArchiveModalOpen(false)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
    </div>
  );
}
