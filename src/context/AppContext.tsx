import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ParticipantResult, SortType, Card, Category, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface ResultWithId extends ParticipantResult {
  id: string;
  deletedAt?: string | null;
  createdAt?: string;
}

interface AppContextType {
  projects: Project[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  createProject: (name: string, type: SortType, description?: string) => Promise<Project>;
  duplicateProject: (id: string) => Promise<{ error: any } | void>;
  deleteProject: (id: string) => Promise<{ error: any } | void>;
  restoreProject: (id: string) => Promise<{ error: any } | void>;
  permanentlyDeleteProject: (id: string) => Promise<{ error: any } | void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  fetchProjectById: (id: string) => Promise<Project | null>;
  addCard: (projectId: string, content: string) => Promise<void>;
  updateCard: (projectId: string, cardId: string, content: string) => Promise<void>;
  deleteCard: (projectId: string, cardId: string) => Promise<void>;
  reorderCards: (projectId: string, cards: Card[]) => Promise<void>;
  addCategory: (projectId: string, name: string) => Promise<void>;
  updateCategory: (projectId: string, categoryId: string, name: string) => Promise<void>;
  deleteCategory: (projectId: string, categoryId: string) => Promise<void>;
  reorderCategories: (projectId: string, categories: Category[]) => Promise<void>;
  submitResult: (projectId: string, result: ParticipantResult) => Promise<void>;
  saveDraft: (projectId: string, result: ParticipantResult) => Promise<void>;
  checkDraft: (projectId: string, email: string) => Promise<ParticipantResult | null>;
  getResults: (projectId: string) => Promise<ResultWithId[]>;
  getDeletedResults: (projectId: string) => Promise<ResultWithId[]>;
  deleteResult: (resultId: string) => Promise<void>;
  restoreResult: (resultId: string) => Promise<void>;
  permanentlyDeleteResult: (resultId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  fetchUsers: () => Promise<UserProfile[]>;
  updateUserRole: (userId: string, role: 'admin' | 'user') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const THEME_KEY = 'card-sorting-theme';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [results, setResults] = useState<Record<string, ParticipantResult[]>>({});
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if user is admin
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const isAdmin = profileData?.role === 'admin';

        // Admin users get all projects, regular users get only their own
        let query = supabase
          .from('projects')
          .select('*');

        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading projects:', error);
        } else if (data) {
          setProjects(data.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            type: row.type as SortType,
            cards: row.cards as Card[],
            categories: row.categories as Category[],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
          })));
        }
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadProjects();
      } else if (event === 'SIGNED_OUT') {
        setProjects([]);
      }
    });

    const storedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  const createProject = async (name: string, type: SortType, description?: string): Promise<Project> => {
    const defaultCards = [
      'Network Map',
      'Wi-Fi',
      'WAN',
      'LAN',
      'Ethernet',
      'GRE Tunnels',
      'Firewall',
      'Parental Controls',
      'Port Triggering',
      'Port Filtering',
      'Port Forwarding',
      'MAC Filtering',
      'DMZ',
      'VPN',
      'Local UI Password',
      'Speed Test',
      'Wi-Fi Analyzer',
      'Wi-Fi Score',
      'Wi-Fi Diagnostics',
      'Device Diagnostics',
      'Device logs',
      'Crash logs',
      'Events & Alert history',
      'Device Processes',
      'DOCSIS Statistics',
      'Firmware',
      'Back up & Restore',
      'Advanced Services',
      'NTP Server',
    ];

    const defaultCategories = [
      'Network',
      'Security',
      'Diagnostics',
      'Troubleshooting',
      'Settings',
      'Voice',
    ];

    const newProject: Project = {
      id: Date.now().toString(),
      name,
      description,
      type,
      cards: defaultCards.map((content, index) => ({
        id: (index + 1).toString(),
        content,
        sortOrder: index,
      })),
      categories: type === 'closed' || type === 'hybrid'
        ? defaultCategories.map((name, index) => ({
          id: `cat-${index + 1}`,
          name,
          sortOrder: index,
        }))
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('projects')
          .insert({
            id: newProject.id,
            name: newProject.name,
            description: newProject.description,
            type: newProject.type,
            cards: newProject.cards,
            categories: newProject.categories,
            user_id: user.id,
            created_at: newProject.createdAt,
            updated_at: newProject.updatedAt,
          });

        if (error) {
          console.error('Error creating project:', error);
        } else {
          setProjects([newProject, ...projects]);
        }
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }

    return newProject;
  };

  const duplicateProject = async (id: string) => {
    const projectToDuplicate = projects.find(p => p.id === id);

    if (!projectToDuplicate) {
      console.error('Project not found');
      return { error: 'Project not found' };
    }

    const newProject: Project = {
      ...projectToDuplicate,
      id: crypto.randomUUID(),
      name: `Copy of ${projectToDuplicate.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null, // Ensure the copy is active even if original is deleted
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('projects')
          .insert({
            id: newProject.id,
            name: newProject.name,
            description: newProject.description,
            type: newProject.type,
            cards: newProject.cards,
            categories: newProject.categories,
            user_id: user.id,
            created_at: newProject.createdAt,
            updated_at: newProject.updatedAt,
          });

        if (error) {
          console.error('Error duplicating project:', error);
          return { error };
        } else {
          setProjects([newProject, ...projects]);
        }
      }
    } catch (err) {
      console.error('Error duplicating project:', err);
      return { error: err };
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting project:', error);
        return { error };
      } else {
        // Update local state to reflect deletion (or filter it out if we want to hide it immediately)
        // For now, we update it so it can be filtered in the UI
        setProjects(projects.map(p =>
          p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p
        ));
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      return { error: err };
    }
  };

  const restoreProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) {
        console.error('Error restoring project:', error);
        return { error };
      } else {
        setProjects(projects.map(p =>
          p.id === id ? { ...p, deletedAt: null } : p
        ));
      }
    } catch (err) {
      console.error('Error restoring project:', err);
      return { error: err };
    }
  };

  const permanentlyDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error permanently deleting project:', error);
        return { error };
      } else {
        setProjects(projects.filter(p => p.id !== id));
        const newResults = { ...results };
        delete newResults[id];
        setResults(newResults);
      }
    } catch (err) {
      console.error('Error permanently deleting project:', err);
      return { error: err };
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updatedAt = new Date().toISOString();
    const updatedProject = { ...updates, updatedAt };

    try {
      const dbUpdates: Record<string, any> = {
        updated_at: updatedAt,
      };

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.cards !== undefined) dbUpdates.cards = updates.cards;
      if (updates.categories !== undefined) dbUpdates.categories = updates.categories;

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating project:', error);
      } else {
        setProjects(projects.map(p =>
          p.id === id ? { ...p, ...updatedProject } : p
        ));
      }
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };

  const getProject = (id: string) => {
    return projects.find(p => p.id === id);
  };

  const fetchProjectById = async (id: string): Promise<Project | null> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching project:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type as SortType,
        cards: data.cards as Card[],
        categories: data.categories as Category[],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      console.error('Error fetching project by ID:', err);
      return null;
    }
  };

  const addCard = async (projectId: string, content: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newCard: Card = {
      id: Date.now().toString(),
      content,
      sortOrder: project.cards.length,
    };
    const updatedCards = [...project.cards, newCard];

    await updateProject(projectId, { cards: updatedCards });
  };

  const updateCard = async (projectId: string, cardId: string, content: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedCards = project.cards.map(c => c.id === cardId ? { ...c, content } : c);
    await updateProject(projectId, { cards: updatedCards });
  };

  const deleteCard = async (projectId: string, cardId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedCards = project.cards.filter(c => c.id !== cardId);
    await updateProject(projectId, { cards: updatedCards });
  };

  const reorderCards = async (projectId: string, cards: Card[]) => {
    await updateProject(projectId, { cards });
  };

  const addCategory = async (projectId: string, name: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      sortOrder: project.categories.length,
    };
    const updatedCategories = [...project.categories, newCategory];

    await updateProject(projectId, { categories: updatedCategories });
  };

  const updateCategory = async (projectId: string, categoryId: string, name: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedCategories = project.categories.map(c => c.id === categoryId ? { ...c, name } : c);
    await updateProject(projectId, { categories: updatedCategories });
  };

  const deleteCategory = async (projectId: string, categoryId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedCategories = project.categories.filter(c => c.id !== categoryId);
    await updateProject(projectId, { categories: updatedCategories });
  };

  const reorderCategories = async (projectId: string, categories: Category[]) => {
    await updateProject(projectId, { categories });
  };

  const saveDraft = async (projectId: string, result: ParticipantResult) => {
    try {
      // Check for existing draft
      const { data: existingDraft } = await supabase
        .from('sorting_results')
        .select('id')
        .eq('project_id', projectId)
        .eq('participant_email', result.email)
        .eq('status', 'draft')
        .maybeSingle();

      if (existingDraft) {
        const { error } = await supabase
          .from('sorting_results')
          .update({
            result_data: result,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingDraft.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sorting_results')
          .insert({
            project_id: projectId,
            participant_email: result.email,
            result_data: result,
            status: 'draft',
          });

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      throw err;
    }
  };

  const checkDraft = async (projectId: string, email: string): Promise<ParticipantResult | null> => {
    try {
      const { data, error } = await supabase
        .from('sorting_results')
        .select('*')
        .eq('project_id', projectId)
        .eq('participant_email', email)
        .eq('status', 'draft')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return data.result_data as ParticipantResult;
    } catch (err) {
      console.error('Error checking draft:', err);
      return null;
    }
  };

  const submitResult = async (projectId: string, result: ParticipantResult) => {
    try {
      // Check for existing draft to promote
      const { data: existingDraft } = await supabase
        .from('sorting_results')
        .select('id')
        .eq('project_id', projectId)
        .eq('participant_email', result.email)
        .eq('status', 'draft')
        .maybeSingle();

      let error;
      if (existingDraft) {
        const response = await supabase
          .from('sorting_results')
          .update({
            result_data: result,
            updated_at: new Date().toISOString(),
            status: 'completed'
          })
          .eq('id', existingDraft.id);
        error = response.error;
      } else {
        const response = await supabase
          .from('sorting_results')
          .insert({
            project_id: projectId,
            participant_email: result.email,
            result_data: result,
            status: 'completed'
          });
        error = response.error;
      }

      if (error) {
        console.error('Error saving result to database:', error);
      }

      // Update local state
      setResults(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), result],
      }));

    } catch (err) {
      console.error('Error submitting result:', err);
      // Still update local state optimistically or to reflect "submitted" state in UI if needed
      setResults(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), result],
      }));
    }
  };

  const getResults = async (projectId: string): Promise<ResultWithId[]> => {
    try {
      const { data, error } = await supabase
        .from('sorting_results')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching results:', error);
        return [];
      }

      return data?.map(row => ({
        ...(row.result_data as ParticipantResult),
        id: row.id,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
      })) || [];
    } catch (err) {
      console.error('Error getting results:', err);
      return [];
    }
  };

  const getDeletedResults = async (projectId: string): Promise<ResultWithId[]> => {
    try {
      const { data, error } = await supabase
        .from('sorting_results')
        .select('*')
        .eq('project_id', projectId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error('Error fetching deleted results:', error);
        return [];
      }

      return data?.map(row => ({
        ...(row.result_data as ParticipantResult),
        id: row.id,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
      })) || [];
    } catch (err) {
      console.error('Error getting deleted results:', err);
      return [];
    }
  };

  const deleteResult = async (resultId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('sorting_results')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id || null,
        })
        .eq('id', resultId);

      if (error) {
        console.error('Error deleting result:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting result:', err);
      throw err;
    }
  };

  const restoreResult = async (resultId: string) => {
    try {
      const { error } = await supabase
        .from('sorting_results')
        .update({
          deleted_at: null,
          deleted_by: null,
        })
        .eq('id', resultId);

      if (error) {
        console.error('Error restoring result:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error restoring result:', err);
      throw err;
    }
  };

  const permanentlyDeleteResult = async (resultId: string) => {
    try {
      const { error } = await supabase
        .from('sorting_results')
        .delete()
        .eq('id', resultId);

      if (error) {
        console.error('Error permanently deleting result:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error permanently deleting result:', err);
      throw err;
    }
  };

  const refreshProjects = async () => {
    await loadProjects();
  };

  const fetchUsers = async (): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return data as UserProfile[];
    } catch (err) {
      console.error('Error fetching users:', err);
      return [];
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Note: This only deletes the profile. Auth user deletion requires service role key or Edge Function.
      // For now, we delete the profile which should effectively disable their access if our app checks profile existence.
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        theme,
        toggleTheme,
        createProject,
        deleteProject,
        updateProject,
        getProject,
        fetchProjectById,
        addCard,
        updateCard,
        deleteCard,
        reorderCards,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        submitResult,
        saveDraft,
        checkDraft,
        getResults,
        getDeletedResults,
        deleteResult,
        restoreResult,
        permanentlyDeleteResult,
        duplicateProject,
        restoreProject,
        permanentlyDeleteProject,
        refreshProjects,
        fetchUsers,
        updateUserRole,
        deleteUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
