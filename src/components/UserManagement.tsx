
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';
import { Search, Edit2, Trash2, UserPlus, Shield, User, X } from 'lucide-react';
import { format } from 'date-fns';

export const UserManagement: React.FC = () => {
    const { fetchUsers, updateUserRole, deleteUser } = useApp();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user'); // For add modal
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const data = await fetchUsers();
        setUsers(data);
        setLoading(false);
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (user: UserProfile) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowEditModal(true);
    };

    const handleDeleteClick = (user: UserProfile) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await updateUserRole(selectedUser.id, newRole);
            await loadUsers();
            setShowEditModal(false);
        } catch (error) {
            console.error('Failed to update role', error);
            alert('Failed to update role');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await deleteUser(selectedUser.id);
            await loadUsers();
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Failed to delete user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddUser = () => {
        // This is a simulation/placeholder as per plan since we can't fully create auth users from client without service key or existing session workaround
        // But we will simulate the UI flow.
        alert("To add a new user, currently you need to use the Supabase Dashboard Authentication page or share the signup link. We are building a dedicated invite system.");
        setShowAddModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>User Management</h2>
                <Button onClick={() => setShowAddModal(true)} icon={<UserPlus size={18} />}>
                    Add New User
                </Button>
            </div>

            <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ color: 'var(--color-text-primary)' }}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    Total Users: <span className="font-semibold text-gray-900 dark:text-gray-100">{users.length}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No users found matching your search.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                                    <User size={16} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{user.email || 'No Email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                }`}>
                                                {user.role === 'admin' ? <Shield size={12} className="mr-1 self-center" /> : null}
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                                title="Edit User"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(user)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User Role">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300">
                            {selectedUser?.email || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Role</label>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                        <Button onClick={handleUpdateRole} disabled={actionLoading}>
                            {actionLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Delete">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete user <strong>{selectedUser?.email}</strong>?
                        This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDeleteUser} disabled={actionLoading}>
                            {actionLoading ? 'Deleting...' : 'Delete User'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add User Modal (Simulation) */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Enter details to invite a new user.
                    </p>
                    <Input
                        label="Email Address"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="user@example.com"
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Role</label>
                        <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button onClick={handleAddUser}>Send Invitation</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
