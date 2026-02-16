import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Upload } from 'lucide-react';
import { Card as CardType, Category } from '../types';

export const ManageProject: React.FC<{ projectId: string; onNavigate: (page: string) => void }> = ({
  projectId,
  onNavigate,
}) => {
  const { getProject, addCard, updateCard, deleteCard, reorderCards, addCategory, updateCategory, deleteCategory, reorderCategories } = useApp();
  const project = getProject(projectId);

  const [activeTab, setActiveTab] = useState<'cards' | 'categories' | 'import-cards' | 'import-categories'>('cards');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [cardContent, setCardContent] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!project) {
    return <div>Project not found</div>;
  }

  const handleSaveCard = async () => {
    if (!cardContent.trim()) return;

    if (editingCard) {
      await updateCard(projectId, editingCard.id, cardContent.trim());
    } else {
      await addCard(projectId, cardContent.trim());
    }

    setCardContent('');
    setEditingCard(null);
    setIsCardModalOpen(false);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;

    if (editingCategory) {
      await updateCategory(projectId, editingCategory.id, categoryName.trim());
    } else {
      await addCategory(projectId, categoryName.trim());
    }

    setCategoryName('');
    setEditingCategory(null);
    setIsCategoryModalOpen(false);
  };

  const handleEditCard = (card: CardType) => {
    setEditingCard(card);
    setCardContent(card.content);
    setIsCardModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsCategoryModalOpen(true);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    if (activeTab === 'cards') {
      const newCards = [...project.cards];
      const draggedCard = newCards[draggedIndex];
      newCards.splice(draggedIndex, 1);
      newCards.splice(index, 0, draggedCard);
      const reorderedCards = newCards.map((card, idx) => ({ ...card, sortOrder: idx }));
      reorderCards(projectId, reorderedCards);
      setDraggedIndex(index);
    } else {
      const newCategories = [...project.categories];
      const draggedCategory = newCategories[draggedIndex];
      newCategories.splice(draggedIndex, 1);
      newCategories.splice(index, 0, draggedCategory);
      const reorderedCategories = newCategories.map((cat, idx) => ({ ...cat, sortOrder: idx }));
      reorderCategories(projectId, reorderedCategories);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => onNavigate('admin')} className="mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {project.name}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {project.type.charAt(0).toUpperCase() + project.type.slice(1)} Sort
          </p>
        </div>

        <div className="mb-6 flex border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
          <button
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'cards' || activeTab === 'import-cards' ? 'border-b-2' : ''
              }`}
            style={{
              color: activeTab === 'cards' || activeTab === 'import-cards' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              borderColor: activeTab === 'cards' || activeTab === 'import-cards' ? 'var(--color-border-brand)' : 'transparent',
            }}
            onClick={() => setActiveTab('cards')}
          >
            Cards ({project.cards.length})
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'categories' || activeTab === 'import-categories' ? 'border-b-2' : ''
              }`}
            style={{
              color: activeTab === 'categories' || activeTab === 'import-categories' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              borderColor: activeTab === 'categories' || activeTab === 'import-categories' ? 'var(--color-border-brand)' : 'transparent',
            }}
            onClick={() => setActiveTab('categories')}
          >
            Categories ({project.categories.length})
          </button>

        </div>

        <div className="mb-6">
          <Button
            onClick={() => {
              if (activeTab === 'cards' || activeTab === 'import-cards') {
                setEditingCard(null);
                setCardContent('');
                setIsCardModalOpen(true);
              } else {
                setEditingCategory(null);
                setCategoryName('');
                setIsCategoryModalOpen(true);
              }
            }}
          >
            <Plus size={20} className="mr-2" />
            Add {activeTab === 'cards' || activeTab === 'import-cards' ? 'Card' : 'Category'}
          </Button>
          {(activeTab === 'cards' || activeTab === 'import-cards') && (
            <Button
              variant="secondary"
              className="ml-3"
              onClick={() => setActiveTab('import-cards')}
            >
              <Upload size={20} className="mr-2" />
              Import Cards
            </Button>
          )}
          {(activeTab === 'categories' || activeTab === 'import-categories') && (
            <Button
              variant="secondary"
              className="ml-3"
              onClick={() => setActiveTab('import-categories')}
            >
              <Upload size={20} className="mr-2" />
              Import Categories
            </Button>
          )}
        </div>

        <Card className="p-6">
          {activeTab === 'cards' || activeTab === 'import-cards' ? (
            activeTab === 'import-cards' ? (
              <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="flex justify-center mb-4">
                  <Upload size={48} className="opacity-50" />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Import Cards</h3>
                <p>Upload a CSV file or paste text to create cards in bulk.</p>
              </div>
            ) : (
              project.cards.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                  No cards yet. Add your first card to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {project.cards.map((card, index) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border-primary)',
                        cursor: 'move',
                      }}
                    >
                      <GripVertical size={20} style={{ color: 'var(--color-text-tertiary)' }} />
                      <div className="flex-1" style={{ color: 'var(--color-text-primary)' }}>
                        {card.content}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCard(card)}>
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (window.confirm('Delete this card?')) {
                              await deleteCard(projectId, card.id);
                            }
                          }}
                        >
                          <Trash2 size={16} style={{ color: 'var(--color-error-500)' }} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )
          ) : activeTab === 'import-categories' ? (
            <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="flex justify-center mb-4">
                <Upload size={48} className="opacity-50" />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Import Categories</h3>
              <p>Upload a CSV file or paste text to create categories in bulk.</p>
            </div>
          ) : (
            project.categories.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                No categories yet. Add categories for closed or hybrid sorts.
              </div>
            ) : (
              <div className="space-y-2">
                {project.categories.map((category, index) => (
                  <div
                    key={category.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border-primary)',
                      cursor: 'move',
                    }}
                  >
                    <GripVertical size={20} style={{ color: 'var(--color-text-tertiary)' }} />
                    <div className="flex-1" style={{ color: 'var(--color-text-primary)' }}>
                      {category.name}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm('Delete this category?')) {
                            await deleteCategory(projectId, category.id);
                          }
                        }}
                      >
                        <Trash2 size={16} style={{ color: 'var(--color-error-500)' }} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>
      </div >

      <Modal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
          setCardContent('');
        }}
        title={editingCard ? 'Edit Card' : 'Add Card'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCardModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCard}>Save</Button>
          </>
        }
      >
        <Input
          label="Card Content"
          value={cardContent}
          onChange={(e) => setCardContent(e.target.value)}
          placeholder="Enter card content"
          autoFocus
        />
      </Modal>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setCategoryName('');
        }}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>Save</Button>
          </>
        }
      >
        <Input
          label="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Enter category name"
          autoFocus
        />
      </Modal>
    </div >
  );
};
