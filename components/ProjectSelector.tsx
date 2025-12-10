import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Folder, Plus, LayoutGrid, Check, Trash2, Save, RotateCcw } from 'lucide-react';
import { Project } from '../types';

interface ProjectSelectorProps {
  currentProject: Project;
  projects: Project[];
  onSwitchProject: (projectId: string) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onSaveTemplate: () => void;
  onResetTemplate: () => void;
  hasCustomTemplate: boolean;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ 
  currentProject, 
  projects, 
  onSwitchProject, 
  onCreateProject,
  onDeleteProject,
  onSaveTemplate,
  onResetTemplate,
  hasCustomTemplate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
      setIsOpen(false);
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  const handleProjectClick = (e: React.MouseEvent<HTMLButtonElement>, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.blur();
    onSwitchProject(projectId);
    setIsOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use a simpler confirmation flow
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet définitivement ?")) {
        onDeleteProject(projectId);
        setIsOpen(false); // Close menu immediately to show feedback
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[2500] pointer-events-none" ref={dropdownRef}>
      
      {/* Main Trigger Pill */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-slate-200/20 px-4 py-2 rounded-full hover:bg-white transition-all group pointer-events-auto"
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          <LayoutGrid size={16} />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Projet</span>
          <span className="text-sm font-bold text-slate-800 leading-none">{currentProject.name}</span>
        </div>
        <div className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-72 bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-500">Mes Tableaux</span>
          </div>

          {/* Project List */}
          <div className="max-h-[300px] overflow-y-auto py-1">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50/50 ${
                  project.id === currentProject.id ? 'bg-indigo-50/50' : ''
                }`}
              >
                {/* Select Project Button */}
                <button 
                    onClick={(e) => handleProjectClick(e, project.id)}
                    className="flex-1 flex items-center gap-3 overflow-hidden text-left"
                >
                    <Folder size={18} className={project.id === currentProject.id ? 'text-indigo-600' : 'text-slate-400'} />
                    <div className="flex flex-col items-start truncate">
                        <span className={`text-sm font-medium truncate ${project.id === currentProject.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {project.name}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(project.updatedAt)}</span>
                    </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-2">
                    {project.id === currentProject.id && <Check size={14} className="text-indigo-600 mr-2" />}
                    
                    {/* Delete Button - Always visible now for better UX */}
                    <button 
                        onClick={(e) => handleDeleteClick(e, project.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer le projet"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create New Actions */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            {isCreating ? (
              <form onSubmit={handleCreateSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nom du projet..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={16} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
              >
                <Plus size={16} />
                Nouveau Projet
              </button>
            )}
          </div>

          {/* Template Actions Section */}
          <div className="p-3 border-t border-slate-100 bg-white">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                Template de démarrage
             </span>
             <div className="flex flex-col gap-1">
                <button
                    onClick={() => { onSaveTemplate(); setIsOpen(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                >
                    <Save size={14} />
                    Sauvegarder l'état actuel comme défaut
                </button>
                
                {hasCustomTemplate && (
                    <button
                        onClick={() => { onResetTemplate(); setIsOpen(false); }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                        <RotateCcw size={14} />
                        Réinitialiser le template d'origine
                    </button>
                )}
             </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProjectSelector;