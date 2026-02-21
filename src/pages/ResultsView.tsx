import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ArrowLeft, Download, Trash2, Copy, Trophy, Calendar, ChevronDown, ChevronUp, RotateCcw, BarChart3, Folder, MessageSquare } from 'lucide-react';
import { ProjectResults, ParticipantResult } from '../types';

interface ResultWithId extends ParticipantResult {
  id: string;
  deletedAt?: string | null;
  createdAt?: string;
}

export const ResultsView: React.FC<{ projectId: string; onNavigate: (page: string) => void }> = ({
  projectId,
  onNavigate,
}) => {
  const { getProject, getResults, getDeletedResults, deleteResult, restoreResult, permanentlyDeleteResult } = useApp();
  const project = getProject(projectId);
  const [results, setResults] = useState<ResultWithId[]>([]);
  const [deletedResults, setDeletedResults] = useState<ResultWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories'>('overview');
  const [othersExpanded, setOthersExpanded] = useState(false);
  const [expandedAdminCategory, setExpandedAdminCategory] = useState<string | null>(null);

  // Delete/Restore state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [permanentDeleteConfirmOpen, setPermanentDeleteConfirmOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<string | null>(null);
  const [resultToPermanentlyDelete, setResultToPermanentlyDelete] = useState<string | null>(null);
  const [expandedDeletedDate, setExpandedDeletedDate] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      const [activeData, deletedData] = await Promise.all([
        getResults(projectId),
        getDeletedResults(projectId),
      ]);
      setResults(activeData);
      setDeletedResults(deletedData);
      setLoading(false);
    };
    loadResults();
  }, [projectId, getResults, getDeletedResults]);

  if (!project || loading) {
    return <div className="p-8 text-center text-gray-500">Loading results...</div>;
  }

  // --- ACTIONS ---
  const handleDeleteClick = (id: string) => {
    setResultToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handlePermanentDeleteClick = (id: string) => {
    setResultToPermanentlyDelete(id);
    setPermanentDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (resultToDelete) {
      await deleteResult(resultToDelete);
      const [activeData, deletedData] = await Promise.all([
        getResults(projectId),
        getDeletedResults(projectId),
      ]);
      setResults(activeData);
      setDeletedResults(deletedData);
      setDeleteConfirmOpen(false);
      setResultToDelete(null);
    }
  };

  const handlePermanentDeleteConfirm = async () => {
    if (resultToPermanentlyDelete) {
      await permanentlyDeleteResult(resultToPermanentlyDelete);
      const [activeData, deletedData] = await Promise.all([
        getResults(projectId),
        getDeletedResults(projectId),
      ]);
      setResults(activeData);
      setDeletedResults(deletedData);
      setPermanentDeleteConfirmOpen(false);
      setResultToPermanentlyDelete(null);
    }
  };

  const handleRestore = async (id: string) => {
    await restoreResult(id);
    const [activeData, deletedData] = await Promise.all([
      getResults(projectId),
      getDeletedResults(projectId),
    ]);
    setResults(activeData);
    setDeletedResults(deletedData);
  };

  // --- CALCULATION LOGIC ---
  interface CategoryAgreementOptions<TSubmission, TCategory, TCard> {
    submissions: TSubmission[];
    categoryName: string;
    getCategories: (submission: TSubmission) => TCategory[];
    getCards: (category: TCategory) => TCard[];
    getCategoryName: (category: TCategory) => string;
    getCardId: (card: TCard) => string;
  }

  function calculateCategoryAgreement<TSubmission, TCategory, TCard>({
    submissions,
    categoryName,
    getCategories,
    getCards,
    getCategoryName,
    getCardId,
  }: CategoryAgreementOptions<TSubmission, TCategory, TCard>): number {
    if (submissions.length < 2) return 0;

    const allCards = new Set<string>();
    submissions.forEach((submission) => {
      const categories = getCategories(submission);
      categories.forEach((category) => {
        const cards = getCards(category);
        cards.forEach((card) => allCards.add(getCardId(card)));
      });
    });

    if (allCards.size === 0) return 0;

    let agreementCount = 0;

    allCards.forEach((cardId) => {
      const placements = submissions.map((submission) => {
        const categories = getCategories(submission);
        for (const category of categories) {
          const cards = getCards(category);
          if (cards.some((card) => getCardId(card) === cardId)) {
            return getCategoryName(category);
          }
        }
        return null;
      });

      if (placements.every((placement) => placement === categoryName)) {
        agreementCount++;
      }
    });

    return (agreementCount / allCards.size) * 100;
  }

  // 1. Total Submissions
  const totalSubmissions = results.length;
  const projectStatus = project.deletedAt ? "Archived" : "Active";

  // 2. Average Cards Sorted
  const totalCardsSorted = results.reduce((sum, r) => {
    const cardsInResult = r.categories.reduce((cSum, cat) => cSum + cat.cards.length, 0);
    return sum + cardsInResult;
  }, 0);
  const avgCardsSorted = totalSubmissions > 0 ? Math.round(totalCardsSorted / totalSubmissions) : 0;

  // 3. Category Agreement — split admin vs custom, aggregate customs into "Others"
  const adminCategoryNames = new Set(project.categories.map(c => c.name));

  type CatAgreementItem = { name: string; percentage: number; count: number; isAdmin: boolean };
  const allCategoryNames = new Set<string>();
  results.forEach(result => result.categories.forEach(c => allCategoryNames.add(c.category_name)));

  const uniqueCategoriesCount = allCategoryNames.size;

  const allCategoryAgreement: CatAgreementItem[] = Array.from(allCategoryNames).map(categoryName => ({
    name: categoryName,
    percentage: Math.round(calculateCategoryAgreement({
      submissions: results,
      categoryName,
      getCategories: (s) => s.categories,
      getCards: (c) => c.cards,
      getCategoryName: (c) => c.category_name,
      getCardId: (card) => card,
    })),
    count: results.filter(r => r.categories.some(c => c.category_name === categoryName)).length,
    isAdmin: adminCategoryNames.has(categoryName),
  }));

  const adminAgreement = allCategoryAgreement
    .filter(c => c.isAdmin)
    .sort((a, b) => b.percentage - a.percentage);

  const customAgreement = allCategoryAgreement.filter(c => !c.isAdmin);

  // Aggregate "Others": count unique participants who used ANY custom category
  const othersParticipantCount = results.filter(r =>
    r.categories.some(c => !adminCategoryNames.has(c.category_name))
  ).length;
  const othersPercentage = totalSubmissions > 0 ? Math.round((othersParticipantCount / totalSubmissions) * 100) : 0;
  const othersCustomNames = customAgreement.map(c => c.name);
  const hasOthers = customAgreement.length > 0;




  // 5. Group Submissions for Timeline
  const groupedResults = results.reduce((acc, result) => {
    const dateKey = result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'Unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(result);
    return acc;
  }, {} as Record<string, ResultWithId[]>);

  const groupedDeletedResults = deletedResults.reduce((acc, result) => {
    const dateKey = result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'Unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(result);
    return acc;
  }, {} as Record<string, ResultWithId[]>);

  // 6. Categories Tab — cards grouped by category with participant counts
  const categoryCardMap: Record<string, { cardCounts: Record<string, number>; participantCount: number }> = {};
  results.forEach(result => {
    result.categories.forEach(cat => {
      if (!categoryCardMap[cat.category_name]) {
        categoryCardMap[cat.category_name] = { cardCounts: {}, participantCount: 0 };
      }
      categoryCardMap[cat.category_name].participantCount++;
      cat.cards.forEach(card => {
        categoryCardMap[cat.category_name].cardCounts[card] =
          (categoryCardMap[cat.category_name].cardCounts[card] || 0) + 1;
      });
    });
  });

  // 7. Top 10 Agreed Cards (across all categories, sorted by count desc)
  const top10Cards = Object.entries(categoryCardMap)
    .flatMap(([categoryName, data]) =>
      Object.entries(data.cardCounts).map(([cardName, count]) => ({
        cardName,
        categoryName,
        count,
        pct: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0,
      }))
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // --- HELPERS ---
  const copyToClipboard = () => {
    const data = JSON.stringify({ project, results }, null, 2);
    navigator.clipboard.writeText(data);
    alert("Copied to clipboard!");
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify({ project, results }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}_results.json`;
    link.click();
  };

  const downloadSingleJSON = (result: ResultWithId) => {
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submission_${result.id}.json`;
    link.click();
  };



  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>

      {/* ── TOP HEADER ── */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-8 py-5 border-b"
        style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border-primary)' }}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => onNavigate('admin')} className="-ml-2 text-gray-500 hover:text-gray-900">
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Results: {project.name}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              View and export participant sorting results
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pr-14">
          <Button
            variant={showRecycleBin ? "primary" : "secondary"}
            onClick={() => { setShowRecycleBin(!showRecycleBin); setActiveTab('overview'); }}
            className={showRecycleBin ? "bg-gray-800 text-white hover:bg-gray-700" : ""}
          >
            <Trash2 size={16} className="mr-2" />
            Recycle Bin ({deletedResults.length})
          </Button>
          <Button variant="secondary" onClick={copyToClipboard}>
            <Copy size={16} className="mr-2" />
            Copy to Clipboard
          </Button>
          <Button variant="primary" onClick={downloadJSON}>
            <Download size={16} className="mr-2" />
            Download JSON
          </Button>
        </div>
      </div>

      {/* ── SIDEBAR + CONTENT ── */}
      <div className="flex flex-1">

        {/* Left Sidebar */}
        <aside
          className="w-56 flex-shrink-0 border-r py-6"
          style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border-primary)' }}
        >
          <nav className="flex flex-col gap-1 px-3">
            <button
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors ${activeTab === 'overview' && !showRecycleBin
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
              onClick={() => { setActiveTab('overview'); setShowRecycleBin(false); }}
            >
              <BarChart3 size={18} />
              Overview
            </button>
            <button
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors ${activeTab === 'categories' && !showRecycleBin
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
              onClick={() => { setActiveTab('categories'); setShowRecycleBin(false); }}
            >
              <Folder size={18} />
              Categories
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* ── RECYCLE BIN (overlay over tab content) ── */}
          {showRecycleBin ? (
            <div className="space-y-4 max-w-4xl">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Trash2 className="text-red-500" size={20} />
                  Recycle Bin
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowRecycleBin(false)}>Close Bin</Button>
              </div>

              {deletedResults.length === 0 && (
                <div className="text-center py-10 bg-gray-100 rounded-lg text-gray-400">
                  Recycle bin is empty.
                </div>
              )}

              {Object.entries(groupedDeletedResults).map(([date, items]) => (
                <div key={date} className="border border-red-100 rounded-lg bg-red-50/30 overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={() => setExpandedDeletedDate(expandedDeletedDate === date ? null : date)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{date}</span>
                      <span className="text-sm text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{items.length} deleted</span>
                    </div>
                    {expandedDeletedDate === date ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>

                  {expandedDeletedDate === date && (
                    <div className="divide-y divide-red-100 border-t border-red-100">
                      {items.map((result) => (
                        <div key={result.id} className="p-4 flex justify-between items-center bg-white/50">
                          <div>
                            <div className="font-medium text-gray-900">{result.email}</div>
                            <div className="text-xs text-gray-500">Deleted: {result.deletedAt ? new Date(result.deletedAt).toLocaleDateString() : 'Unknown'}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleRestore(result.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                              <RotateCcw size={16} className="mr-1" /> Restore
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handlePermanentDeleteClick(result.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 size={16} className="mr-1" /> Delete Forever
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

          ) : activeTab === 'overview' ? (
            /* ── OVERVIEW TAB ── */
            <div className="space-y-8 max-w-5xl">

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Total Submissions</p>
                      <div className="text-4xl font-bold text-gray-900">{totalSubmissions}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${projectStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {projectStatus}
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Unique Categories</p>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{uniqueCategoriesCount}</div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Across all participants</p>
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Avg. Cards Sorted</p>
                      <div className="text-4xl font-bold text-gray-900">{avgCardsSorted}</div>
                      <p className="text-xs text-gray-400 mt-1">cards per participant</p>
                    </div>
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                      <Calendar size={20} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Agreement + Velocity */}
              <div className="grid grid-cols-1 gap-8" style={{ gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)' }}>
                <Card className="shadow-sm overflow-hidden" style={{ padding: 0 }}>
                  {/* Header */}
                  <div className="flex items-center gap-2 px-6 pt-6 pb-4">
                    <Trophy className="text-yellow-500" size={20} />
                    <h2 className="text-lg font-bold text-gray-900">Top agreement of cards in categories</h2>
                  </div>

                  {/* Rows */}
                  <div className="px-6 pb-2">
                    {adminAgreement.map((cat) => {
                      const catCards = categoryCardMap[cat.name];
                      const top5 = catCards
                        ? Object.entries(catCards.cardCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                        : [];
                      const isExpanded = expandedAdminCategory === cat.name;

                      return (
                        <div key={cat.name} className="py-3.5 border-b border-gray-100 last:border-b-0">
                          {/* Row 1: name + chevron + stats */}
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-semibold text-gray-900">{cat.name}</span>
                              {top5.length > 0 && (
                                <button
                                  onClick={() => setExpandedAdminCategory(isExpanded ? null : cat.name)}
                                  className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                  aria-label="Show top cards"
                                >
                                  <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>
                            <span className="text-base font-semibold text-gray-900">
                              {cat.percentage}%&nbsp;<span className="text-sm font-normal text-gray-400">({cat.count})</span>
                            </span>
                          </div>
                          {/* Row 2: badge */}
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1px solid #93C5FD' }}>Admin</span>

                          {/* Top 5 cards expansion */}
                          {isExpanded && top5.length > 0 && (
                            <div className="mt-3 rounded-lg overflow-hidden" style={{ backgroundColor: '#F9FAFB', borderLeft: '3px solid #3B82F6' }}>
                              <div className="px-3 pt-2.5 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>
                                Top {top5.length} cards
                              </div>
                              {top5.map(([cardName, count]) => {
                                const pct = totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;
                                return (
                                  <div key={cardName} className="flex justify-between items-center px-3 py-1.5 border-t border-gray-200">
                                    <span className="text-sm text-gray-700 font-medium truncate mr-3">{cardName}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-xs text-gray-500 font-semibold">{count}/{totalSubmissions}</span>
                                      <span className="text-xs font-bold text-gray-800">{pct}%</span>
                                      {pct === 100 && <span title="100% agreement">🏆</span>}
                                      {pct >= 75 && pct < 100 && <span title="High agreement">⭐</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Others row */}
                    {hasOthers && (
                      <div className="py-3.5">
                        {/* Row 1: name + stats + chevron */}
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-base font-semibold text-gray-900">Others</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-semibold text-gray-900">
                              {othersPercentage}%&nbsp;<span className="text-sm font-normal text-gray-400">({othersParticipantCount})</span>
                            </span>
                            <button
                              onClick={() => setOthersExpanded(o => !o)}
                              className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label="Expand custom categories"
                            >
                              <ChevronDown size={14} className={`transition-transform ${othersExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>
                        {/* Row 2: badge */}
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}>
                          {othersCustomNames.length} custom categories
                        </span>
                        {/* Expanded list */}
                        {othersExpanded && (
                          <div className="mt-3 pl-3 border-l-2 border-yellow-300">
                            {othersCustomNames.map(name => (
                              <div key={name} className="text-sm text-gray-500 py-0.5">• {name}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {adminAgreement.length === 0 && !hasOthers && (
                      <p className="text-gray-400 text-sm italic py-4">No data yet.</p>
                    )}
                  </div>


                  {/* CTA footer */}
                  <div className="px-6 py-3 mt-2 border-t border-gray-100" style={{ backgroundColor: '#F9FAFB' }}>
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                      onClick={() => { setActiveTab('categories'); setShowRecycleBin(false); }}
                    >
                      Show all categories
                      <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </button>
                  </div>
                </Card>

                <Card className="shadow-sm overflow-hidden" style={{ padding: 0 }}>
                  <div className="flex items-center gap-2 px-6 pt-5 pb-3">
                    <span className="text-lg">🎯</span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Top Agreed Cards</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Cards with highest participant agreement</p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 space-y-1 overflow-y-auto" style={{ maxHeight: '420px' }}>
                    {top10Cards.length === 0 && (
                      <p className="text-gray-400 text-sm italic py-4 px-2">No data yet.</p>
                    )}
                    {top10Cards.map((card, idx) => {
                      const barColor = card.pct === 100 ? '#10B981'
                        : card.pct >= 75 ? '#34D399'
                          : card.pct >= 50 ? '#F59E0B'
                            : '#EF4444';
                      return (
                        <div key={`${card.categoryName}-${card.cardName}`} className="rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors">
                          {/* Row 1: rank, name, category badge */}
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">{idx + 1}.</span>
                              <span className="text-sm font-semibold text-gray-800 truncate">{card.cardName}</span>
                            </div>
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0 px-2 py-0.5 rounded-full border border-gray-200 bg-white">
                              → {card.categoryName}
                            </span>
                          </div>
                          {/* Row 2: progress bar + stats */}
                          <div className="flex items-center gap-2 pl-7">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${card.pct}%`, backgroundColor: barColor }} />
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 font-semibold">{card.count}/{totalSubmissions}</span>
                            <span className="text-xs font-bold text-gray-700 flex-shrink-0 w-8 text-right">{card.pct}%</span>
                            <span className="w-4 text-center text-xs flex-shrink-0">
                              {card.pct === 100 ? '🏆' : card.pct >= 75 ? '⭐' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Participant Submissions Timeline */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Participant Submissions</h2>

                {Object.entries(groupedResults).reverse().map(([date, items]) => (
                  <div key={date} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded text-blue-600">
                          <Calendar size={16} />
                        </div>
                        <span className="font-medium text-gray-900">{date}</span>
                        <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{items.length}</span>
                      </div>
                      {expandedDate === date ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </div>

                    {expandedDate === date && (
                      <div className="divide-y divide-gray-100">
                        {items.map((result) => (
                          <div key={result.id} className="bg-white">
                            <div
                              className="p-4 hover:bg-gray-50 flex justify-between items-center cursor-pointer group"
                              onClick={() => setExpandedSubmission(expandedSubmission === result.id ? null : result.id)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                  {result.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{result.email}</div>
                                  <div className="text-xs text-gray-500">
                                    {result.categories.length} categories • {result.categories.reduce((acc, c) => acc + c.cards.length, 0)} cards sorted
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Comment indicator */}
                                  {(result as any).additional_comments?.trim() ? (
                                    <div
                                      className="flex items-center justify-center w-7 h-7 rounded-md"
                                      style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}
                                      title={`Comment: ${(result as any).additional_comments}`}
                                    >
                                      <MessageSquare size={15} />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center w-7 h-7" style={{ color: '#D1D5DB' }}>
                                      <MessageSquare size={15} />
                                    </div>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); downloadSingleJSON(result); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700"
                                    title="Download JSON"
                                  >
                                    <Download size={18} />
                                  </button>
                                  {expandedSubmission === result.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </div>
                              </div>
                            </div>

                            {expandedSubmission === result.id && (
                              <div className="px-4 pb-4 bg-gray-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                  {result.categories.map((category, idx) => (
                                    <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">{category.category_name}</h4>
                                      {category.suggested_name && (
                                        <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-md bg-blue-50 border border-blue-200">
                                          <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Suggested:</span>
                                          <span className="text-xs font-medium text-blue-700">{category.suggested_name}</span>
                                        </div>
                                      )}
                                      <ul className="space-y-1.5 mb-3">
                                        {category.cards.map((card, cardIdx) => (
                                          <li key={cardIdx} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className="text-gray-400 mt-0.5">•</span>
                                            <span>{card}</span>
                                          </li>
                                        ))}
                                      </ul>
                                      <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                        {category.cards.length} {category.cards.length === 1 ? 'card' : 'cards'}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); downloadSingleJSON(result); }} className="text-gray-600 hover:text-gray-900">
                                    <Download size={16} className="mr-1" /> Download
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteClick(result.id); }} className="text-gray-600 hover:text-red-600">
                                    <Trash2 size={16} className="mr-1" /> Delete
                                  </Button>
                                </div>
                                {(result as any).additional_comments?.trim() && (
                                  <div className="mt-4 p-3 rounded-lg border border-blue-100 bg-blue-50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <MessageSquare size={14} className="text-blue-500" />
                                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Participant Comment</span>
                                    </div>
                                    <p className="text-sm text-blue-900">{(result as any).additional_comments}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {results.length === 0 && <div className="text-center py-10 text-gray-400">No submissions found.</div>}
              </div>
            </div>

          ) : (
            /* ── CATEGORIES TAB ── */
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
                <p className="text-sm text-gray-500 mt-1">Cards sorted into each category across all participant submissions</p>
              </div>

              {Object.keys(categoryCardMap).length === 0 ? (
                <div className="text-center py-16 text-gray-400">No submissions yet.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(categoryCardMap)
                    .sort((a, b) => b[1].participantCount - a[1].participantCount)
                    .map(([categoryName, data]) => {
                      const sortedCards = Object.entries(data.cardCounts)
                        .sort((a, b) => b[1] - a[1]);

                      return (
                        <Card key={categoryName} className="p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-bold text-gray-900 text-lg">{categoryName}</h3>
                            {adminCategoryNames.has(categoryName) ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1px solid #93C5FD' }}>Admin</span>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}>Custom</span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {sortedCards.map(([card, count]) => {
                              const pct = Math.round((count / totalSubmissions) * 100);
                              return (
                                <div key={card}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 truncate mr-4">{card}</span>
                                    <span className="text-gray-400 flex-shrink-0">{count}/{totalSubmissions}</span>
                                  </div>
                                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-700"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setResultToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        title="Move to Recycle Bin"
        message="Are you sure you want to move this submission to the Recycle Bin? You can restore it later."
        confirmText="Move to Bin"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={permanentDeleteConfirmOpen}
        onClose={() => { setPermanentDeleteConfirmOpen(false); setResultToPermanentlyDelete(null); }}
        onConfirm={handlePermanentDeleteConfirm}
        title="Permanently Delete"
        message="This action cannot be undone. This submission will be permanently removed."
        confirmText="Delete Forever"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
