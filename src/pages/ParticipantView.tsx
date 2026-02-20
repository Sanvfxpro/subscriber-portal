import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { ProjectCard } from '../components/ProjectCard'; // Import the new component
import { Modal } from '../components/Modal';
import { Plus, Trash2, Pencil, Check, ArrowLeft, Save, AlertTriangle, RotateCcw, Info } from 'lucide-react';
import { ResultCategory, ParticipantResult } from '../types';
import loginBg from '../assets/login-bg.jpg';

// Extended interface for local state to track rename/revert logic
interface ParticipantCategory extends ResultCategory {
  id: string;        // Unique ID for React keys and tracking
  originalName?: string; // Original name for admin defaults
  isDefault: boolean;    // Whether it is an admin-defined category
  description?: string;
}

export const ParticipantView: React.FC<{ projectId: string; onComplete: () => void; onNavigate: (page: string) => void }> = ({
  projectId,
  onComplete,
  onNavigate,
}) => {
  const { getProject, fetchProjectById, submitResult, saveDraft, checkDraft } = useApp();
  const [project, setProject] = useState(getProject(projectId));
  const [isLoading, setIsLoading] = useState(!project);

  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [introAcknowledged, setIntroAcknowledged] = useState(false);

  const [unsortedCards, setUnsortedCards] = useState<string[]>([]);
  // Use extended interface for local state
  const [userCategories, setUserCategories] = useState<ParticipantCategory[]>([]);

  // Inline editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  // const editInputRef = useRef<HTMLInputElement>(null); // We can just autoFocus the input

  const [newCategoryName, setNewCategoryName] = useState('');
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Limit only applies to Hybrid mode as per requirements
  const isLimitReached = project?.type === 'hybrid' && userCategories.length >= 5;

  const getCardDescription = (content: string) => {
    return project?.cards.find(c => c.content === content)?.description;
  };



  useEffect(() => {
    const loadProject = async () => {
      if (!project) {
        setIsLoading(true);
        const fetchedProject = await fetchProjectById(projectId);
        if (fetchedProject) {
          setProject(fetchedProject);
        }
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, project, fetchProjectById]);

  useEffect(() => {
    if (project) {
      setUnsortedCards(project.cards.map(c => c.content));

      if (project.type === 'closed' || project.type === 'hybrid') {
        const initialCategories: ParticipantCategory[] = project.categories.map(c => ({
          category_name: c.name,
          cards: [],
          id: c.id || c.name, // Use ID if available, else name
          originalName: c.name,
          isDefault: true,
          description: c.description
        }));
        setUserCategories(initialCategories);
      }
    }
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>Project not found</div>
      </div>
    );
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');

    // Check for existing draft
    setIsLoading(true);
    try {
      const draft = await checkDraft(projectId, email);
      if (draft) {
        // Restore draft state
        const draftCategories = draft.categories;

        if (project.type === 'closed' || project.type === 'hybrid') {
          const mergedCategories: ParticipantCategory[] = [];

          // 1. Add categories that match project defaults
          project.categories.forEach(projCat => {
            const draftCat = draftCategories.find(d => d.category_name === projCat.name);
            if (draftCat) {
              mergedCategories.push({
                ...draftCat,
                id: projCat.id || projCat.name,
                originalName: projCat.name,
                isDefault: true,
                description: projCat.description
              });
            } else {
              // New default category added by admin
              mergedCategories.push({
                category_name: projCat.name,
                cards: [],
                id: projCat.id || projCat.name,
                originalName: projCat.name,
                isDefault: true,
                description: projCat.description
              });
            }
          });

          // 2. Add custom categories from draft
          draftCategories.forEach(draftCat => {
            const isDefault = project.categories.some(p => p.name === draftCat.category_name);
            if (!isDefault) {
              mergedCategories.push({
                ...draftCat,
                id: draftCat.category_name, // Use name as ID for legacy/custom
                isDefault: false
              });
            }
          });

          setUserCategories(mergedCategories);
        } else {
          // For open sort, restore draft and map to extended interface
          setUserCategories(draftCategories.map(c => ({
            ...c,
            id: c.category_name,
            isDefault: false
          })));
        }

        // Calculate unsorted cards based on what's properly categorized in the merged list
        const allCardContents = project.cards.map(c => c.content);
        const sortedCardContents = new Set<string>();

        // We need to use the merged list (or the list we just set)
        // Since state update is async, we'll use the logic we just implemented
        const currentCategories = (project.type === 'closed' || project.type === 'hybrid')
          ? [
            ...project.categories.map(projCat => {
              const draftCat = draftCategories.find(d => d.category_name === projCat.name);
              return draftCat || { category_name: projCat.name, cards: [] };
            }),
            ...draftCategories.filter(d => !project.categories.some(p => p.name === d.category_name))
          ]
          : draftCategories;

        currentCategories.forEach(cat => {
          cat.cards.forEach(cardContent => sortedCardContents.add(cardContent));
        });

        const remainingCards = allCardContents.filter(c => !sortedCardContents.has(c));
        setUnsortedCards(remainingCards);

        showToast('Resuming your previous session');
      }
    } catch (err) {
      console.error('Error checking draft:', err);
    } finally {
      setIsLoading(false);
      setEmailSubmitted(true);
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    if (isLimitReached) return;

    const newCatName = newCategoryName.trim();
    setUserCategories([
      ...userCategories,
      {
        category_name: newCatName,
        cards: [],
        id: newCatName + Date.now(), // Generate unique ID
        isDefault: false
      },
    ]);
    setNewCategoryName('');
  };

  // Inline Editing Logic
  const startEditing = (category: ParticipantCategory) => {
    // Determine if renaming is allowed.
    // 1. Closed sorts strictly forbid renaming.
    // 2. Hybrid sorts forbid renaming default (admin-created) categories.
    if (project.type === 'closed') return;
    if (project.type === 'hybrid' && category.isDefault) return;

    setEditingCategoryId(category.id);
    setEditName(category.category_name);
  };

  const saveEdit = () => {
    if (editingCategoryId && editName.trim()) {
      setUserCategories(userCategories.map(cat =>
        cat.id === editingCategoryId
          ? { ...cat, category_name: editName.trim() }
          : cat
      ));
    }
    setEditingCategoryId(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditName('');
  };

  const handleRevertName = (category: ParticipantCategory, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit
    if (category.isDefault && category.originalName) {
      setUserCategories(userCategories.map(cat =>
        cat.id === category.id
          ? { ...cat, category_name: category.originalName! }
          : cat
      ));
    }
  };

  const confirmDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      handleDeleteCategory(categoryToDelete);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = userCategories.find(c => c.id === categoryId);
    if (!category) return;

    setUnsortedCards([...unsortedCards, ...category.cards]);
    setUserCategories(userCategories.filter(c => c.id !== categoryId));
  };

  /* Deprecated helpers removed: canDeleteCategory, canRenameCategory */

  const handleDragStart = (card: string) => {
    setDraggedCard(card);
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    if (!draggedCard) return;

    if (targetCategoryId) {
      setUserCategories(userCategories.map(cat => {
        if (cat.id === targetCategoryId) {
          if (!cat.cards.includes(draggedCard)) {
            return { ...cat, cards: [...cat.cards, draggedCard] };
          }
        } else {
          return { ...cat, cards: cat.cards.filter(c => c !== draggedCard) };
        }
        return cat;
      }));
      setUnsortedCards(unsortedCards.filter(c => c !== draggedCard));
    } else {
      if (!unsortedCards.includes(draggedCard)) {
        setUnsortedCards([...unsortedCards, draggedCard]);
      }
      setUserCategories(userCategories.map(cat => ({
        ...cat,
        cards: cat.cards.filter(c => c !== draggedCard),
      })));
    }

    setDraggedCard(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  // Data Clean-up helper for submission
  const getCleanResults = (): ParticipantResult => ({
    email,
    categories: userCategories
      .filter(cat => cat.cards.length > 0)
      .map(cat => ({
        category_name: cat.category_name,
        ...(cat.suggested_name?.trim() ? { suggested_name: cat.suggested_name.trim() } : {}),
        cards: cat.cards
      }))
  });

  const saveProgress = async () => {
    setIsSaving(true);
    try {
      // We try to save the full state (including IDs/metadata) for drafts so we can restore revert logic
      // Casting to any to bypass strict type check for draft storage
      const result = {
        email,
        categories: userCategories.filter(cat => cat.cards.length > 0),
      } as any as ParticipantResult;

      await saveDraft(projectId, result);
      showToast('Progress saved. You can return later to finish.');
    } catch (err) {
      console.error('Error saving progress:', err);
      showToast('Failed to save progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const submitSorting = async () => {
    setIsPublishing(true);
    try {
      // For final submission, we strip metadata to match the strict schema expectation
      submitResult(projectId, getCleanResults());
      setIsPublished(true);
      showToast('Sorting published. Thank you!');

      setTimeout(() => {
        onComplete();
      }, 2000);
    } finally {
      setIsPublishing(false);
    }
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-success-500);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const handlePublish = () => {
    if (canPublish) {
      submitSorting();
    }
  };

  const totalCards = project.cards.length;
  const placedCount = totalCards - unsortedCards.length;
  const remaining = totalCards - placedCount;
  const canSave = placedCount >= 1;
  const canPublish = remaining === 0;

  if (!emailSubmitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundColor: 'var(--color-bg-secondary)'
        }}
      >

        <Card className="p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {project.name}
          </h1>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Welcome to this card sorting study. Please enter your email to begin.
          </p>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              placeholder="your.email@example.com"
              error={emailError}
            />
            <Button onClick={handleEmailSubmit} className="w-full">
              Start Sorting
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!introAcknowledged) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundColor: 'var(--color-bg-secondary)'
        }}
      >
        <div className="absolute top-8 left-8">
          <Button onClick={() => setEmailSubmitted(false)} variant="secondary" size="sm">
            <ArrowLeft size={20} />
          </Button>
        </div>
        <Card className="p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Welcome to the Card Sorting Activity for Gravity's Subscriber App.
            </h1>
            <p className="text-base" style={{ color: '#6B7280' }}>
              This activity is being conducted to understand how you as an end-user,
              understand the app's information and naturally organise it in a way that
              makes sense to you.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Instructions for this activity -
            </h3>
            <ol className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</span>
                <span className="leading-relaxed">Go through the list of cards on the left section</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">2</span>
                <span className="leading-relaxed">Drag and drop cards into categories that make most sense to you</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">3</span>
                <span className="leading-relaxed">Create a new category if needed, and name that category. You can edit or delete this category.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">4</span>
                <span className="leading-relaxed font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Remember - there are no right or wrong answers, only answers that are logical to you!
                </span>
              </li>
            </ol>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => setIntroAcknowledged(true)}
              size="lg"
              className="px-12 py-3 text-lg font-medium min-w-[160px]"
              style={{ backgroundColor: '#2563EB', color: 'white' }}
            >
              Start Sorting
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 relative">
          <Button
            onClick={() => onNavigate('landing')}
            variant="secondary"
            size="sm"
            className="absolute left-0 top-0"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="absolute right-0 top-0 flex gap-2">
            <Button
              onClick={saveProgress}
              disabled={!canSave || isSaving || isPublished}
              size="sm"
              style={{
                backgroundColor: canSave && !isPublished ? 'var(--color-primary-500)' : 'var(--color-neutral-200)',
                color: canSave && !isPublished ? 'white' : 'var(--color-neutral-400)',
                cursor: !canSave || isPublished ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={16} className="mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <div
              className="relative"
              onMouseEnter={() => !canPublish && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Button
                onClick={handlePublish}
                disabled={!canPublish || isPublishing || isPublished}
                size="sm"
                style={{
                  backgroundColor: canPublish && !isPublished ? 'var(--color-success-500)' : 'var(--color-neutral-200)',
                  color: canPublish && !isPublished ? 'white' : 'var(--color-neutral-400)',
                  cursor: !canPublish || isPublished ? 'not-allowed' : 'pointer',
                }}
              >
                {isPublishing ? 'Publishing...' : isPublished ? 'Published' : 'Publish'}
              </Button>
              {showTooltip && !canPublish && (
                <div
                  className="absolute top-full right-0 mt-2 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap z-50"
                  style={{
                    backgroundColor: 'var(--color-neutral-800)',
                    color: 'white',
                  }}
                >
                  Finish sorting all cards to publish — {remaining} remaining
                </div>
              )}
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {project.name}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Drag cards from the left into categories on the right
            </p>
          </div>
        </div>



        <div className="flex justify-center mb-0">
          {/* Dynamic Banners for Hybrid Mode - Below Instructions */}
          {project.type === 'hybrid' && (
            <div className="w-full max-w-3xl flex justify-center">
              {/* Info Banner - Less than 5 categories */}
              {!isLimitReached && (
                <div
                  className="w-fit flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                >
                  <Info size={16} className="flex-shrink-0" />
                  <span className="truncate">
                    <strong>Category Limit Guide:</strong> Min 4, Max 5 acting categories.
                  </span>
                </div>
              )}

              {/* Warning Banner - Limit Reached (5 categories) */}
              {isLimitReached && (
                <div
                  className="w-fit flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm"
                >
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span className="truncate">
                    <strong>Limit reached (5/5)</strong> - You can edit the latest category name, or suggest alternative names to other categories
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-6 mt-[15px]">
          <div className="w-80 flex-shrink-0">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Unsorted Cards
              </h2>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium leading-none"
                style={{
                  backgroundColor: unsortedCards.length === 0 ? 'var(--color-success-50)' : 'var(--color-warning-50)',
                  color: unsortedCards.length === 0 ? 'var(--color-success-700)' : 'var(--color-warning-700)',
                }}
              >
                {unsortedCards.length} remaining
              </span>
            </div>
            <div
              className="min-h-[400px] max-h-[600px] p-4 rounded-lg border-2 border-dashed transition-all overflow-y-auto"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border-secondary)',
              }}
              onDrop={(e) => handleDrop(e)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {unsortedCards.length === 0 ? (
                <div className="flex items-center justify-center h-full py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  <div>
                    <Check size={48} className="mx-auto mb-2" />
                    <p>All cards sorted!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {unsortedCards.map((card, index) => (
                    <ProjectCard
                      key={index}
                      content={card}
                      description={getCardDescription(card)}
                      onDragStart={() => handleDragStart(card)}
                      className="border" // Add specific styling if needed, or rely on default
                    />
                  ))}
                </div>
              )}
            </div>
          </div>


          <div className="flex-1">
            <div className="mb-6 flex items-center gap-4">
              <h2 className="text-xl font-semibold flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                Categories
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              {userCategories.map((category) => (
                <div
                  key={category.id}
                  className="w-64 p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border-primary)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3 min-h-[32px]">
                    {editingCategoryId === category.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') saveEdit();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          onBlur={saveEdit}
                          className="flex-1 py-1 h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          className="h-8 w-8 p-0"
                        >
                          <Check size={14} />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3
                            className="font-semibold truncate cursor-pointer hover:underline decoration-dashed underline-offset-4"
                            style={{ color: 'var(--color-text-primary)' }}
                            onClick={() => startEditing(category)}
                            title="Click to rename"
                          >
                            {category.category_name}
                          </h3>
                          {category.description && (
                            <div className="group relative flex items-center">
                              <Info size={14} className="text-blue-400 cursor-help" />
                              <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs rounded shadow-lg z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ backgroundColor: 'var(--color-neutral-800)', color: 'white' }}>
                                {category.description}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--color-neutral-800)' }}></div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-[2px] flex-shrink-0">
                          {/* Revert Icon for Default Categories - Orange/Yellow */}
                          {category.isDefault && category.originalName && category.category_name !== category.originalName && (
                            <button
                              onClick={(e) => handleRevertName(category, e)}
                              className="p-1 hover:opacity-75 transition-opacity"
                              title={`Restore original name: ${category.originalName}`}
                              style={{ color: 'var(--color-warning-500)' }}
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          {/* Pencil Icon for Renaming - Neutral Gray */}
                          {/* Show if NOT closed AND (NOT hybrid OR (hybrid AND not default)) */}
                          {project.type !== 'closed' && !(project.type === 'hybrid' && category.isDefault) && (
                            <button
                              onClick={() => startEditing(category)}
                              className="p-1 hover:opacity-75 transition-opacity"
                              style={{ color: 'var(--color-text-disabled)' }}
                              title="Rename category"
                            >
                              <Pencil size={14} />
                            </button>
                          )}

                          {/* Allow delete if Hybrid mode (custom category only) OR if Open/Hybrid custom category */}
                          {/* Logic:
                              - Closed: No delete (handled by !isDefault && type!=closed check, but effectively no delete for closed usually)
                              - Open: Delete any (usually they are all 'custom' in a way, or if default exists, might be valid to delete? Req says "User created".
                                but legacy logic was: (!category.isDefault && project.type !== 'closed')
                              - Hybrid: Only delete if NOT default.
                           */}
                          {(!category.isDefault && project.type !== 'closed') && (
                            <button
                              onClick={() => confirmDeleteCategory(category.id)}
                              className="p-1 hover:opacity-75 transition-opacity"
                              title="Delete category"
                            >
                              <Trash2 size={18} style={{ color: 'var(--color-error-500)' }} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Suggestion Input - Only for Default Categories (Admin created) */}
                  {category.isDefault && (
                    <input
                      type="text"
                      placeholder="Suggest category name..."
                      className="w-full text-xs px-2 py-1 border rounded bg-white/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 transition-colors mb-2"
                      style={{
                        borderColor: 'var(--color-border-secondary)',
                        color: 'var(--color-text-primary)'
                      }}
                      value={category.suggested_name || ''}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setUserCategories(prev => prev.map(c =>
                          c.id === category.id ? { ...c, suggested_name: newVal } : c
                        ));
                      }}
                    />
                  )}

                  <div
                    className="text-xs text-center mb-2 px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {category.cards.length} {category.cards.length === 1 ? 'CARD' : 'CARDS'}
                  </div>

                  <div
                    className={`min-h-[120px] flex-1 p-2 rounded-lg border-2 border-dashed transition-all ${category.cards.length > 3 ? 'scrollable' : ''}`}
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border-secondary)',
                      maxHeight: category.cards.length > 3 ? '240px' : 'auto',
                      overflowY: category.cards.length > 3 ? 'auto' : 'visible'
                    }}
                    onDrop={(e) => handleDrop(e, category.id)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {category.cards.length === 0 ? (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        Drop cards here
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {category.cards.map((card, index) => (
                          <ProjectCard
                            key={index}
                            content={card}
                            description={getCardDescription(card)}
                            onDragStart={() => handleDragStart(card)}
                            className="bg-white"
                          />
                        ))}
                      </div>
                    )}
                  </div>


                </div>
              ))}

              {/* Add Category Slot */}
              {!isLimitReached && (project.type === 'open' || project.type === 'hybrid') && (
                <div
                  className="w-64 p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all group relative bg-blue-50 border-blue-200"
                >


                  <div className="text-center mt-2">
                    <h3 className="text-blue-800 font-bold text-lg">Create New Column</h3>
                    <p className="text-blue-400 text-sm">Add a custom sorting category</p>
                  </div>

                  <div className="w-full space-y-3">
                    <Input
                      placeholder="Enter category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                      className="w-full bg-white border-blue-200 text-center placeholder:text-gray-400"
                    />
                    <Button
                      onClick={handleCreateCategory}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-500 border-none font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add Category
                    </Button>
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Category"
      >
        <div className="p-4">
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Are you sure you want to delete this category? All cards will return to Unsorted.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              style={{ backgroundColor: 'var(--color-error-500)', color: 'white' }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div >
  );
};
