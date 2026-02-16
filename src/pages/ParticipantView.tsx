import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Plus, Trash2, Pencil, Check, ArrowLeft, Save } from 'lucide-react';
import { ResultCategory } from '../types';
import loginBg from '../assets/login-bg.jpg';

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

  const [unsortedCards, setUnsortedCards] = useState<string[]>([]);
  const [userCategories, setUserCategories] = useState<ResultCategory[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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
        setUserCategories(project.categories.map(c => ({
          category_name: c.name,
          cards: [],
        })));
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
        setUserCategories(draftCategories);

        // Calculate unsorted cards based on what's properly categorized in the draft
        const allCardContents = project.cards.map(c => c.content);
        const sortedCardContents = new Set<string>();
        draftCategories.forEach(cat => {
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

    setUserCategories([
      ...userCategories,
      {
        category_name: newCategoryName.trim(),
        cards: [],
      },
    ]);
    setNewCategoryName('');
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    if (!newName.trim()) return;

    setUserCategories(userCategories.map(cat =>
      cat.category_name === oldName
        ? { ...cat, category_name: newName.trim() }
        : cat
    ));
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = (categoryName: string) => {
    const category = userCategories.find(c => c.category_name === categoryName);
    if (!category) return;

    setUnsortedCards([...unsortedCards, ...category.cards]);
    setUserCategories(userCategories.filter(c => c.category_name !== categoryName));
  };

  const canDeleteCategory = (categoryName: string) => {
    if (project.type === 'open') return true;
    if (project.type === 'closed') return false;
    return !project.categories.some(c => c.name === categoryName);
  };

  const canRenameCategory = (categoryName: string) => {
    if (project.type === 'open') return true;
    if (project.type === 'closed') return false;
    return !project.categories.some(c => c.name === categoryName);
  };

  const handleDragStart = (card: string, fromCategory?: string) => {
    setDraggedCard(card);
  };

  const handleDrop = (e: React.DragEvent, categoryName?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    if (!draggedCard) return;

    if (categoryName) {
      setUserCategories(userCategories.map(cat => {
        if (cat.category_name === categoryName) {
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

  const saveProgress = async () => {
    setIsSaving(true);
    try {
      const result = {
        email,
        categories: userCategories.filter(cat => cat.cards.length > 0),
      };
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
      const result = {
        email,
        categories: userCategories.filter(cat => cat.cards.length > 0),
      };

      submitResult(projectId, result);
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
        <div className="absolute top-8 left-8">
          <Button onClick={() => onNavigate('landing')} variant="secondary" size="sm">
            <ArrowLeft size={20} />
          </Button>
        </div>
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

        <div className="flex gap-6">
          <div className="w-80 flex-shrink-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Unsorted Cards
              </h2>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: unsortedCards.length === 0 ? 'var(--color-success-50)' : 'var(--color-warning-50)',
                  color: unsortedCards.length === 0 ? 'var(--color-success-600)' : 'var(--color-warning-600)',
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
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(card)}
                      className="p-3 rounded-lg border cursor-move transition-all hover:shadow-md"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border-primary)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {card}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Categories
              </h2>
              {(project.type === 'open' || project.type === 'hybrid') && (
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                    className="w-48"
                  />
                  <Button size="sm" onClick={handleCreateCategory}>
                    <Plus size={16} />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              {userCategories.map((category) => (
                <div
                  key={category.category_name}
                  className="w-64 p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border-primary)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    {editingCategoryId === category.category_name ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameCategory(category.category_name, newCategoryName);
                            }
                          }}
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleRenameCategory(category.category_name, newCategoryName)}
                        >
                          <Check size={16} />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {category.category_name}
                        </h3>
                        <div className="flex gap-1">
                          {canRenameCategory(category.category_name) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCategoryId(category.category_name);
                                setNewCategoryName(category.category_name);
                              }}
                            >
                              <Pencil size={14} />
                            </Button>
                          )}
                          {canDeleteCategory(category.category_name) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.category_name)}
                            >
                              <Trash2 size={14} style={{ color: 'var(--color-error-500)' }} />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

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
                    className="min-h-[120px] p-2 rounded-lg border-2 border-dashed transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border-secondary)',
                    }}
                    onDrop={(e) => handleDrop(e, category.category_name)}
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
                          <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(card, category.category_name)}
                            className="p-2 rounded border cursor-move transition-all hover:shadow-sm text-sm"
                            style={{
                              backgroundColor: 'var(--color-bg-primary)',
                              borderColor: 'var(--color-border-primary)',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {card}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
