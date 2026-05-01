import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, Edit, Trash2, MoreVertical, X, Check, Loader2 } from 'lucide-react';
import { teamService, TeamMember } from '../../services/team';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton, TableSkeleton } from '../../components/common/Skeleton';

const TeamManagement: React.FC = () => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviteLoading, setInviteLoading] = useState(false);
    const { showToast } = useToast();

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const data = await teamService.getAll();
            setMembers(data);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
            showToast('error', 'Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        try {
            await teamService.invite(inviteEmail, inviteRole);
            showToast('success', 'Invitation sent successfully');
            setIsInviteModalOpen(false);
            setInviteEmail('');
            setInviteRole('member');
            fetchMembers();
        } catch (error) {
            console.error('Failed to invite member:', error);
            showToast('error', 'Failed to send invitation');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemove = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this team member?')) return;
        try {
            await teamService.remove(id);
            showToast('success', 'Team member removed');
            fetchMembers();
        } catch (error) {
            console.error('Failed to remove member:', error);
            showToast('error', 'Failed to remove team member');
        }
    };

    const handleUpdateRole = async (id: string, newRole: string) => {
        try {
            await teamService.updateRole(id, newRole);
            showToast('success', 'Role updated successfully');
            fetchMembers();
        } catch (error) {
            console.error('Failed to update role:', error);
            showToast('error', 'Failed to update role');
        }
    };

    const getRoleBadge = (role: string) => {
        const styles = {
            owner: 'bg-purple-100 text-purple-700',
            admin: 'bg-indigo-100 text-indigo-700',
            member: 'bg-blue-100 text-blue-700',
            viewer: 'bg-gray-100 text-gray-700'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role as keyof typeof styles]}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-700',
            invited: 'bg-yellow-100 text-yellow-700',
            inactive: 'bg-gray-100 text-gray-700'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading && !members.length) {
        return (
            <div className="h-full bg-[#F5F1E8] p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between">
                        <Skeleton variant="text" width={200} height={32} />
                        <Skeleton variant="rectangular" width={120} height={40} />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={100} />
                    </div>
                    <TableSkeleton rows={5} cols={4} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto relative">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Management</h1>
                        <p className="text-gray-600">Manage team members and permissions</p>
                    </div>
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Member
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Total Members</span>
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{members.length}</div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Active</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {members.filter(m => m.status === 'active').length}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Invited</span>
                            <Mail className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {members.filter(m => m.status === 'invited').length}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Admins</span>
                            <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {members.filter(m => m.role === 'admin' || m.role === 'owner').length}
                        </div>
                    </div>
                </div>

                {/* Team Members List */}
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="p-4 border-b-2 border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {members.map((member) => (
                            <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-2xl">
                                            {member.avatar || '👤'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900">{member.name}</h4>
                                                {getRoleBadge(member.role)}
                                                {getStatusBadge(member.status)}
                                            </div>
                                            <p className="text-sm text-gray-600">{member.email}</p>
                                            <p className="text-xs text-gray-500 mt-1">Last active: {member.last_active}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {member.role !== 'owner' && (
                                            <>
                                                <div className="relative group">
                                                    <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Edit Role">
                                                        <Edit className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    {/* Simple Role Dropdown on Hover/Click could go here, for now just a placeholder or simple cycle */}
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(member.id)}
                                                    className="p-2 hover:bg-red-50 rounded transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </>
                                        )}
                                        <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                                            <MoreVertical className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {members.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                No team members found. Invite someone to get started!
                            </div>
                        )}
                    </div>
                </div>

                {/* Roles & Permissions */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles & Permissions</h2>
                    <div className="grid grid-cols-2 gap-6">
                        {[
                            {
                                role: 'Owner',
                                description: 'Full access to all features and settings',
                                permissions: ['Manage billing', 'Delete organization', 'Manage all members', 'All admin permissions']
                            },
                            {
                                role: 'Admin',
                                description: 'Manage team and most settings',
                                permissions: ['Invite members', 'Manage roles', 'Access all data', 'Configure integrations']
                            },
                            {
                                role: 'Member',
                                description: 'Standard access to features',
                                permissions: ['View data', 'Create content', 'Edit own content', 'Basic reporting']
                            },
                            {
                                role: 'Viewer',
                                description: 'Read-only access',
                                permissions: ['View data', 'View reports', 'Export data']
                            }
                        ].map((roleInfo, index) => (
                            <div key={index} className="bg-white rounded-xl border-2 border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-lg font-bold text-gray-900">{roleInfo.role}</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">{roleInfo.description}</p>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Permissions:</p>
                                    <ul className="space-y-1">
                                        {roleInfo.permissions.map((perm, i) => (
                                            <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                                                {perm}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="colleague@company.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {inviteLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4" />
                                            Send Invitation
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
