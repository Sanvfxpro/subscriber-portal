import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Plus, Settings, BarChart3, Trash2, Pencil, Download, Share, CheckCircle2, Circle, LogOut, User, Users, RefreshCw, RotateCcw, ChevronRight, ChevronDown, Copy, DatabaseBackup } from 'lucide-react';
import { SortType } from '../types';
import { Toast, ToastContainer, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { UserManagement } from '../components/UserManagement';
import { RESTORED_PROJECTS } from '../data/restoredProjects';

export const AdminDashboard: React.FC<{ onNavigate: (page: string, projectId?: string) => void }> = ({
  onNavigate,
}) => {
  const { projects, createProject, deleteProject, updateProject, refreshProjects, restoreProject, permanentlyDeleteProject, duplicateProject } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState<SortType>('hybrid');
  const [error, setError] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [projectToRestore, setProjectToRestore] = useState<string | null>(null);
  const [projectToPermanentlyDelete, setProjectToPermanentlyDelete] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'settings'>('projects');
  const [enableSignup, setEnableSignup] = useState(true);

  // Users state removed (moved to UserManagement component)
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; type: ToastType; message: string }>>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    if (projects.some(p => p.name.toLowerCase() === projectName.toLowerCase())) {
      setError('A project with this name already exists');
      return;
    }

    await createProject(projectName.trim(), projectType, projectDescription.trim() || undefined);
    setProjectName('');
    setProjectDescription('');
    setProjectType('hybrid');
    setError('');
    setIsCreateModalOpen(false);
  };

  const handleDuplicateProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await duplicateProject(id);
    if (result?.error) {
      console.error('Failed to duplicate project:', result.error);
      // You could add a toast notification here
    }
  };

  const handleRecoverOldProjects = async () => {
    if (!confirm('This will import 5 recovered projects from the old database. Continue?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to recover projects.');
        return;
      }

      let successCount = 0;
      for (const oldProject of RESTORED_PROJECTS) {
        // Check if already exists to avoid duplicates
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('name', oldProject.name)
          .eq('created_at', oldProject.created_at)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping ${oldProject.name}, already exists.`);
          continue;
        }

        // Insert with new user ID
        const { error } = await supabase.from('projects').insert({
          ...oldProject,
          id: crypto.randomUUID(), // New ID to be safe
          user_id: user.id
        });

        if (error) {
          console.error('Failed to import:', oldProject.name, error);
        } else {
          successCount++;
        }
      }

      alert(`Successfully recovered ${successCount} projects! Refreshing...`);
      window.location.reload();

    } catch (e) {
      console.error('Recovery failed:', e);
      alert('Recovery failed. Check console for details.');
    }
  };

  const handleDeleteClick = (id: string) => {
    setProjectToDelete(id);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      const result = await deleteProject(projectToDelete);
      if (result && result.error) {
        addToast('error', 'Failed to move project to recycle bin. Database schema might be outdated.');
      } else {
        addToast('success', 'Project moved to recycle bin');
      }
      setProjectToDelete(null);
    }
  };

  const handleRestoreClick = (id: string) => {
    setProjectToRestore(id);
  };

  const handleRestoreConfirm = async () => {
    if (projectToRestore) {
      const result = await restoreProject(projectToRestore);
      if (result && result.error) {
        addToast('error', 'Failed to restore project');
      } else {
        addToast('success', 'Project restored successfully');
      }
      setProjectToRestore(null);
    }
  };

  const handlePermanentDeleteClick = (id: string) => {
    setProjectToPermanentlyDelete(id);
  };

  const handlePermanentDeleteConfirm = async () => {
    if (projectToPermanentlyDelete) {
      const result = await permanentlyDeleteProject(projectToPermanentlyDelete);
      if (result && result.error) {
        addToast('error', 'Failed to permanently delete project');
      } else {
        addToast('success', 'Project permanently deleted');
      }
      setProjectToPermanentlyDelete(null);
    }
  };

  const handleEditProject = (project: typeof projects[0]) => {
    // ... existing ...
    setEditingProjectId(project.id);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectType(project.type);
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    if (!editingProjectId) return;

    const existingProject = projects.find(
      p => p.name.toLowerCase() === projectName.toLowerCase() && p.id !== editingProjectId
    );
    if (existingProject) {
      setError('A project with this name already exists');
      return;
    }

    await updateProject(editingProjectId, { name: projectName.trim(), description: projectDescription.trim() || undefined, type: projectType });
    setProjectName('');
    setProjectDescription('');
    setProjectType('hybrid');
    setEditingProjectId(null);
    setError('');
    setIsEditModalOpen(false);
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      setSelectedProjects(new Set());
    }
  };

  const toggleSelectAll = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map(p => p.id)));
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleDownloadJSON = () => {
    if (selectedProjects.size === 0) return;

    const selectedProjectsData = projects.filter(p => selectedProjects.has(p.id));
    const dataStr = JSON.stringify(selectedProjectsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projects_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (selectedProjects.size === 0) return;

    const selectedProjectsData = projects.filter(p => selectedProjects.has(p.id));
    const shareText = `Sharing ${selectedProjects.size} project(s): ${selectedProjectsData.map(p => p.name).join(', ')} `;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Card Sorting Projects',
          text: shareText,
        });
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        addToast('success', 'Project names copied to clipboard!');
      } catch (clipboardErr) {
        console.error('Share failed:', err);
        addToast('error', 'Failed to share projects');
      }
    }
  };

  const handleShareProject = async (projectId: string) => {
    const baseUrl = window.location.origin;
    // Hardcode the sub-directory to guarantee correct links on GitHub Pages
    const shareUrl = `${baseUrl}/subscriber-portal/?project=${projectId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast('success', 'Project link copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback for older browsers or if clipboard permission denied
      // Attempt to use legacy execCommand if needed, or just show the link
      prompt('Copy this link:', shareUrl);
    }
  };

  const handleLogout = async () => {
    try {
      // Manual cleanup first to ensure local state is cleared
      localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL + '-auth-token');
      localStorage.clear(); // Aggressive clear to be safe since user is blocked
      sessionStorage.clear();

      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Force navigation regardless of what happens above
      onNavigate('landing');
      // Force reload to ensure clean state if navigation doesn't trigger full reset
      window.location.reload();
    }
  };

  // Legacy password reset and user fetch methods removed in favor of UserManagement component

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'enable_signup')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEnableSignup(data.setting_value === true);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const updateSignupSetting = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: enabled, updated_at: new Date().toISOString() })
        .eq('setting_key', 'enable_signup');

      if (error) throw error;

      setEnableSignup(enabled);
      alert(`Sign up ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating signup setting:', error);
      alert('Failed to update setting. Please try again.');
    }
  };

  React.useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);


  const activeProjects = projects.filter(p => !p.deletedAt);
  const deletedProjects = projects.filter(p => p.deletedAt);

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Admin Dashboard
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Manage your card sorting projects and users
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'projects' && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleRecoverOldProjects}
                  title="Recover projects from old database"
                >
                  <DatabaseBackup size={20} className="mr-2" />
                  Recover Data
                </Button>
                <Button onClick={refreshProjects} variant="secondary" size="lg" title="Refresh projects">
                  <RefreshCw size={20} />
                </Button>
                <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
                  <Plus size={20} className="mr-2" />
                  Create Project
                </Button>
              </>
            )}
            <div className="relative">
              <Button onClick={() => setShowUserMenu(!showUserMenu)} variant="secondary" size="lg">
                <User size={20} />
              </Button>
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border-primary)',
                  }}
                >
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-opacity-80 transition-colors rounded-lg"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8 border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
          <button
            onClick={() => setActiveTab('projects')}
            className="flex items-center gap-2 px-4 py-3 font-medium transition-colors"
            style={{
              color: activeTab === 'projects' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'projects' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            }}
          >
            <BarChart3 size={20} />
            Projects
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className="flex items-center gap-2 px-4 py-3 font-medium transition-colors"
            style={{
              color: activeTab === 'users' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'users' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            }}
          >
            <Users size={20} />
            Users
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 px-4 py-3 font-medium transition-colors"
            style={{
              color: activeTab === 'settings' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'settings' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            }}
          >
            <Settings size={20} />
            Settings
          </button>
        </div>

        {activeTab === 'projects' && projects.length > 0 && (
          <div className="flex justify-end items-center gap-4 mb-4">
            <button
              onClick={toggleSelectMode}
              className="text-sm font-medium transition-colors"
              style={{
                color: selectMode ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              }}
            >
              Select
            </button>
            {selectMode && (
              <button
                onClick={toggleSelectAll}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                All
              </button>
            )}
          </div>
        )}

        {activeTab === 'projects' && projects.length > 0 && selectMode && (
          <div className="fixed bottom-8 right-8 flex items-center gap-4">
            <button
              onClick={handleShare}
              disabled={selectedProjects.size === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                color: selectedProjects.size > 0 ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                opacity: selectedProjects.size > 0 ? 1 : 0.5,
                cursor: selectedProjects.size > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              <Share size={20} />
              Share
            </button>
            <button
              onClick={handleDownloadJSON}
              disabled={selectedProjects.size === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                color: selectedProjects.size > 0 ? 'var(--color-primary-600)' : 'var(--color-text-tertiary)',
                cursor: selectedProjects.size > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              <Download size={20} />
              Download JSON
            </button>
          </div>
        )}
        {activeTab === 'projects' && activeProjects.length === 0 && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <BarChart3 size={48} className="mx-auto" style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                No active projects
              </h2>
              <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Get started by creating your first card sorting project
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={20} className="mr-2" />
                Create Project
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'projects' && activeProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project) => (
              <Card key={project.id} className="p-6">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectMode && (
                        <button
                          onClick={() => toggleProjectSelection(project.id)}
                          className="flex items-center justify-center"
                        >
                          {selectedProjects.has(project.id) ? (
                            <CheckCircle2 size={20} style={{ color: 'var(--color-primary-600)' }} />
                          ) : (
                            <Circle size={20} style={{ color: 'var(--color-border-primary)' }} />
                          )}
                        </button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProject(project)}
                        className="-mt-2 -mr-2"
                      >
                        <Settings size={20} />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--color-primary-50)',
                        color: 'var(--color-primary-600)',
                      }}
                    >
                      {project.type.charAt(0).toUpperCase() + project.type.slice(1)} Sort
                    </span>
                  </div>
                </div>

                <div className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <div>Cards: {project.cards.length}</div>
                  <div>Categories: {project.categories.length}</div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => onNavigate('manage', project.id)}
                  >
                    <Pencil size={16} className="mr-1" />
                    Manage
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => onNavigate('results', project.id)}
                  >
                    <BarChart3 size={16} className="mr-1" />
                    Results
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => handleDuplicateProject(project.id, e)}
                    title="Duplicate Project"
                  >
                    <Copy size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleShareProject(project.id)}
                    title="Copy shareable link"
                  >
                    <Share size={16} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(project.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recycle Bin Section */}
        {activeTab === 'projects' && (
          <div className="mt-12 border-t pt-8" style={{ borderColor: 'var(--color-border-primary)' }}>
            <button
              onClick={() => setShowRecycleBin(!showRecycleBin)}
              className="flex items-center gap-2 text-lg font-semibold mb-4 hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {showRecycleBin ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <Trash2 size={20} />
              Recycle Bin ({deletedProjects.length})
            </button>

            {showRecycleBin && (
              <>
                {deletedProjects.length === 0 ? (
                  <Card className="p-8 text-center bg-gray-50 border-dashed">
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      Recycle bin is empty
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deletedProjects.map((project) => (
                      <Card key={project.id} className="p-6 relative opacity-75 hover:opacity-100 transition-opacity bg-gray-50">
                        <div className="absolute top-0 right-0 p-2">
                          <span
                            className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 font-medium"
                          >
                            Deleted
                          </span>
                        </div>
                        <div className="mb-4">
                          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            {project.name}
                          </h3>
                          <div>
                            <span
                              className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor: 'var(--color-neutral-100)',
                                color: 'var(--color-neutral-600)',
                              }}
                            >
                              {project.type.charAt(0).toUpperCase() + project.type.slice(1)} Sort
                            </span>
                          </div>
                        </div>

                        <div className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          <div>Cards: {project.cards.length}</div>
                          <div>Categories: {project.categories.length}</div>
                          <div className="mt-2 text-xs">Deleted: {project.deletedAt ? new Date(project.deletedAt).toLocaleDateString() : 'Unknown'}</div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleRestoreClick(project.id)}
                          >
                            <RotateCcw size={16} className="mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handlePermanentDeleteClick(project.id)}
                            title="Permanently Delete"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <UserManagement />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
                Application Settings
              </h2>
              {loadingSettings ? (
                <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                  Loading settings...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                    <div>
                      <h3 className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        Enable Sign Up
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Allow new users to create accounts on the landing page
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableSignup}
                        onChange={(e) => updateSignupSetting(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                        style={{
                          backgroundColor: enableSignup ? 'var(--color-primary-600)' : 'var(--color-neutral-300)',
                        }}
                      ></div>
                    </label>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Toast Container and Modals */}
        <ToastContainer>
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              message={toast.message}
              onClose={removeToast}
            />
          ))}
        </ToastContainer>

        <ConfirmDialog
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Project"
          message="Are you sure you want to move this project to the recycle bin? It can be restored later."
          confirmText="Delete Project"
          cancelText="Cancel"
          variant="danger"
        />

        <ConfirmDialog
          isOpen={!!projectToRestore}
          onClose={() => setProjectToRestore(null)}
          onConfirm={handleRestoreConfirm}
          title="Restore Project"
          message="Are you sure you want to restore this project?"
          confirmText="Restore Project"
          cancelText="Cancel"
          variant="warning"
        />

        <ConfirmDialog
          isOpen={!!projectToPermanentlyDelete}
          onClose={() => setProjectToPermanentlyDelete(null)}
          onConfirm={handlePermanentDeleteConfirm}
          title="Permanently Delete Project"
          message="Are you sure you want to permanently delete this project? This action CANNOT be undone."
          confirmText="Delete Permanently"
          cancelText="Cancel"
          variant="danger"
        />

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setProjectName('');
            setProjectDescription('');
            setError('');
          }}
          title="Create New Project"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Manage access
              </label>
              <textarea
                placeholder="Add a name, group, or email"
                rows={1}
                className="w-full px-4 py-2 rounded-lg border transition-colors resize-none"
                style={{
                  borderColor: 'var(--color-border-primary)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Only these people can access this study.
              </p>
            </div>
            <Input
              label="Project Name"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setError('');
              }}
              placeholder="Enter project name"
              error={error}
            />

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Description (Optional)
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border transition-colors resize-none"
                style={{
                  borderColor: 'var(--color-border-primary)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Sort Type
              </label>
              <div className="space-y-2">
                {(['open', 'closed', 'hybrid'] as SortType[]).map((type) => (
                  <label
                    key={type}
                    className="flex items-start p-3 rounded-lg border cursor-pointer transition-all"
                    style={{
                      borderColor: projectType === type ? 'var(--color-border-brand)' : 'var(--color-border-primary)',
                      backgroundColor: projectType === type ? 'var(--color-primary-50)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="sortType"
                      value={type}
                      checked={projectType === type}
                      onChange={(e) => setProjectType(e.target.value as SortType)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} Sort
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {type === 'open' && 'Participants create all categories'}
                        {type === 'closed' && 'Participants use pre-defined categories only'}
                        {type === 'hybrid' && 'Participants can use pre-defined or create new categories'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setProjectName('');
            setProjectDescription('');
            setProjectType('hybrid');
            setEditingProjectId(null);
            setError('');
          }}
          title="Edit Project"
          footer={
            <>
              <Button variant="secondary" onClick={() => {
                setIsEditModalOpen(false);
                setProjectName('');
                setProjectDescription('');
                setProjectType('hybrid');
                setEditingProjectId(null);
                setError('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject}>Save Changes</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Manage access
              </label>
              <textarea
                placeholder="Add a name, group, or email"
                rows={1}
                className="w-full px-4 py-2 rounded-lg border transition-colors resize-none"
                style={{
                  borderColor: 'var(--color-border-primary)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Only these people can access this study.
              </p>
            </div>
            <Input
              label="Project Name"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setError('');
              }}
              placeholder="Enter project name"
              error={error}
            />

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Description (Optional)
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border transition-colors resize-none"
                style={{
                  borderColor: 'var(--color-border-primary)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Sort Type
              </label>
              <div className="space-y-2">
                {(['open', 'closed', 'hybrid'] as SortType[]).map((type) => (
                  <label
                    key={type}
                    className="flex items-start p-3 rounded-lg border cursor-pointer transition-all"
                    style={{
                      borderColor: projectType === type ? 'var(--color-border-brand)' : 'var(--color-border-primary)',
                      backgroundColor: projectType === type ? 'var(--color-primary-50)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="editSortType"
                      value={type}
                      checked={projectType === type}
                      onChange={(e) => setProjectType(e.target.value as SortType)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} Sort
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {type === 'open' && 'Participants create all categories'}
                        {type === 'closed' && 'Participants use pre-defined categories only'}
                        {type === 'hybrid' && 'Participants can use pre-defined or create new categories'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
};
