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
  addCard: (projectId: string, content: string, description?: string) => Promise<void>;
  updateCard: (projectId: string, cardId: string, content: string, description?: string) => Promise<void>;
  deleteCard: (projectId: string, cardId: string) => Promise<void>;
  reorderCards: (projectId: string, cards: Card[]) => Promise<void>;
  addCategory: (projectId: string, name: string, description?: string) => Promise<void>;
  updateCategory: (projectId: string, categoryId: string, name: string, description?: string) => Promise<void>;
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

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch profile data to check for admin status
        const profileResult = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        let profileData = profileResult.data;
        const profileError = profileResult.error;

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        }

        // Auto-create profile if missing
        if (!profileData && !profileError) {
          console.log(`Profile missing for user ${user.email}, creating one...`);
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({ id: user.id, role: 'user' })
            .select('role')
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
          } else {
            profileData = newProfile;
            console.log('Profile created successfully.');
          }
        }

        const isAdmin = profileData?.role === 'admin';
        console.log(`[DEBUG] User ${user.email} (ID: ${user.id}) loading projects. Role: ${profileData?.role || 'unknown'}, isAdmin: ${isAdmin}`);

        // Admin users get all projects, regular users get only their own
        let query = supabase
          .from('projects')
          .select('*');

        if (!isAdmin) {
          console.log(`[DEBUG] Restricting query to user_id: ${user.id}`);
          query = query.eq('user_id', user.id);
        } else {
          console.log('[DEBUG] Admin detected, fetching all projects.');
        }

        const { data, error: projectsError } = await query.order('created_at', { ascending: false });

        if (projectsError) {
          console.error('Error loading projects from database:', projectsError);
          setProjects([]);
        } else if (data) {
          console.log(`[DEBUG] Successfully fetched ${data.length} projects.`);
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
        console.log('[DEBUG] No authenticated user found.');
        setProjects([]);
      }
    } catch (err) {
      console.error('Unexpected error in loadProjects:', err);
      setProjects([]);
    }
  };

  useEffect(() => {
    loadProjects();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
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
      { content: 'Network Status', description: 'See if your network is online and running normally.' },
      { content: 'Network Speed', description: 'Check how fast your internet connection is.' },
      { content: 'Network Map', description: 'View how your devices are connected to your network.' },
      { content: 'Wi-Fi Networks', description: 'See the Wi-Fi networks your router is broadcasting.' },
      { content: 'Wi-Fi Settings', description: 'Change your Wi-Fi name, password, and security options.' },
      { content: 'Connected Devices', description: 'View all devices currently connected to your network.' },
      { content: 'Down Time', description: 'See when your network was unavailable.' },
      { content: 'Usage and Insights', description: 'Understand how your network is being used.' },
      { content: 'Advanced Setting', description: 'Access advanced network configuration options.' },
      { content: 'Alerts/Notifications', description: 'Get notified about network activity and issues.' },
      { content: 'Add/Setup Gateway or Extender', description: 'Add a new gateway or extender to your network.' },
      { content: 'MAC Filtering', description: 'Choose which devices are allowed to connect, based on their unique MAC addresses.' },
      { content: 'Port Forwarding', description: 'Allow specific apps or devices to be accessed from the internet.' },
      { content: 'Port Filtering', description: 'Control internet traffic by allowing or blocking specific ports.' },
      { content: 'Port Triggering', description: 'Automatically open ports when a device needs them.' },
      { content: 'Firewall', description: 'Protect your network from unwanted or suspicious traffic.' },
      { content: 'Device Groups', description: 'Organize devices into groups for easier management.' },
      { content: 'DNS Setting', description: 'Chooses how your network converts the human-friendly URL (e.g., wikipedia.org) into the numerical IP address necessary for your computer to find the website.' },
      { content: 'Internet Configuration', description: 'Set up how your gateway connects to the internet.' },
      { content: 'DHCP Reservations', description: 'Assign the same IP address to specific devices.' },
      { content: 'DOCSIS Summary', description: 'View cable connection and signal details.' },
      { content: 'Local Network', description: 'Manage settings for devices within your home network.' },
      { content: 'Ethernet Configuration', description: 'Configure wired network connection settings.' },
      { content: 'NTP Servers', description: 'Set time servers to keep your network time accurate.' },
      { content: 'Static IP Automatic Assignment', description: 'Automatically assign fixed IP addresses to devices.' },
      { content: 'Wi-Fi Configuration', description: 'Configure advanced Wi-Fi network options.' },
      { content: 'Mesh', description: 'Manage and monitor your mesh Wi-Fi network.' },
      { content: 'Local web UI Password', description: 'Change the password for accessing the local gateway interface.' },
      { content: 'Backup and Restore', description: 'Save your settings or restore them from a backup.' },
      { content: 'Speed test', description: 'Test your internet connection speed.' },
      { content: 'SSID Scanner', description: 'Scan nearby Wi-Fi networks to check congestion and channels.' },
      { content: 'Gateway Login', description: 'Access your gateway\'s management interface.' },
      { content: 'Network Tool-box', description: 'Use network tools to diagnose connection issues.' },
      { content: 'Factory Reset', description: 'Reset the gateway to its original settings.' },
      { content: 'Content Filtering', description: 'Block or allow access to specific websites or content.' },
      { content: 'Reboot', description: 'Restart the gateway to refresh the connection.' },
      { content: 'Test Connection', description: 'Check if your gateway is properly connected to the internet.' },
      { content: 'DMZ', description: 'Expose one device directly to the internet.' },
      { content: 'Device Alias', description: 'Rename devices to make them easier to identify.' },
      { content: 'Manage Users', description: 'Add, remove, or manage access for users.' },
      { content: 'Support', description: 'Get help, guides, or contact customer support.' },
      { content: 'Multi-Language', description: 'Change the language used in the app.' },
      { content: 'Theme Light/Dark', description: 'Switch between light and dark display themes.' },
      { content: 'Switch Account', description: 'Change to a different user account.' },
      { content: 'Switch Gateway', description: 'View or manage a different gateway.' }
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
      cards: defaultCards.map((card, index) => ({
        id: (index + 1).toString(),
        content: card.content,
        description: card.description,
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

  const addCard = async (projectId: string, content: string, description?: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newCard: Card = {
      id: Date.now().toString(),
      content,
      description,
      sortOrder: project.cards.length,
    };
    const updatedCards = [...project.cards, newCard];

    await updateProject(projectId, { cards: updatedCards });
  };

  const updateCard = async (projectId: string, cardId: string, content: string, description?: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedCards = project.cards.map(c => c.id === cardId ? { ...c, content, description } : c);
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

  const addCategory = async (projectId: string, name: string, description?: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      description,
      sortOrder: project.categories.length,
    };
    const updatedCategories = [...project.categories, newCategory];

    await updateProject(projectId, { categories: updatedCategories });
  };

  const updateCategory = async (projectId: string, categoryId: string, name: string, description?: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedCategories = project.categories.map(c => c.id === categoryId ? { ...c, name, description } : c);
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
        .eq('status', 'completed')
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
