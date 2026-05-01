import React, { useState, useEffect } from 'react';
import { accountApi } from '../api/account';
import api from '../services/api';
import { Users, UserPlus, Shield, Crown, Code, UserMinus } from 'lucide-react';

export const Team: React.FC = () => {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [loading, setLoading] = useState(false);
    const [fetchingMembers, setFetchingMembers] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [networkLoading, setNetworkLoading] = useState(true);
    const [networkMutatingId, setNetworkMutatingId] = useState<string | null>(null);
    const [teamMembers, setTeamMembers] = useState<Array<{
        id: string;
        user_id: string;
        name: string;
        email: string;
        role: string;
        created_at: string;
    }>>([]);

    // Fetch team members
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setFetchingMembers(true);
                const members = await accountApi.getMembers();
                setTeamMembers(members);
            } catch (error) {
                console.error('Failed to fetch team members:', error);
            } finally {
                setFetchingMembers(false);
            }
        };

        fetchMembers();
    }, []);

    useEffect(() => {
        const fetchNetwork = async () => {
            try {
                setNetworkLoading(true);
                const { data } = await api.get('/social/network');
                const ids = new Set<string>(
                    Array.isArray(data?.following) ? data.following.map((item: any) => item.id) : []
                );
                setFollowingIds(ids);
            } catch (error) {
                console.error('Failed to fetch network:', error);
                setFollowingIds(new Set());
            } finally {
                setNetworkLoading(false);
            }
        };

        fetchNetwork();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            setError(null);
            if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
                setError('Please enter a valid email address');
                setLoading(false);
                return;
            }
            await accountApi.inviteMember({
                email: inviteEmail,
                role: inviteRole
            });
            setSuccess(true);
            setInviteEmail('');
            setShowInviteModal(false);

            // Refresh members list
            const members = await accountApi.getMembers();
            setTeamMembers(members);

            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to invite member');
            console.error('Failed to invite member:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner':
                return <Crown className="w-4 h-4 text-yellow-600" />;
            case 'admin':
                return <Shield className="w-4 h-4 text-blue-600" />;
            case 'developer':
                return <Code className="w-4 h-4 text-purple-600" />;
            default:
                return <Users className="w-4 h-4 text-gray-600" />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-yellow-100 text-yellow-800';
            case 'admin':
                return 'bg-blue-100 text-blue-800';
            case 'developer':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleFollow = async (accountId: string) => {
        setNetworkMutatingId(accountId);
        try {
            await api.post('/social/network/follow', { account_id: accountId });
            setFollowingIds((prev) => {
                const next = new Set(prev);
                next.add(accountId);
                return next;
            });
        } catch (error) {
            console.error('Failed to follow team member:', error);
        } finally {
            setNetworkMutatingId(null);
        }
    };

    const handleUnfollow = async (accountId: string) => {
        setNetworkMutatingId(accountId);
        try {
            await api.delete('/social/network/unfollow', { data: { account_id: accountId } });
            setFollowingIds((prev) => {
                const next = new Set(prev);
                next.delete(accountId);
                return next;
            });
        } catch (error) {
            console.error('Failed to unfollow team member:', error);
        } finally {
            setNetworkMutatingId(null);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!window.confirm('Are you sure you want to remove this team member?')) {
            return;
        }

        setLoading(true);
        try {
            setError(null);
            await accountApi.removeMember(memberId);
            setSuccess(true);
            
            // Refresh members list
            const members = await accountApi.getMembers();
            setTeamMembers(members);
            
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to remove member');
            console.error('Failed to remove member:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300 mb-4">
                        <Users className="h-3.5 w-3.5" />
                        Team & Collaboration
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Team Members</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage collaborators and permissions for your workspace.</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200/50 active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Invite Member</span>
                </button>
            </div>

            {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in fade-in slide-in-from-top-2">
                    <Shield className="w-5 h-5" />
                    <p className="text-sm font-bold uppercase tracking-wider">Update Successful</p>
                </div>
            )}
            
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                    <UserMinus className="w-5 h-5" />
                    <p className="text-sm font-bold uppercase tracking-wider">{error}</p>
                </div>
            )}

            {/* Members Grid/List */}
            <div className="grid grid-cols-1 gap-4">
                {fetchingMembers ? (
                    <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Syncing Directory...</p>
                    </div>
                ) : teamMembers.length === 0 ? (
                    <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Users size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Your network is empty</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">Invite your first team member to start collaborating on payments and treasury flows.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {teamMembers.map((member) => (
                            <div key={member.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-indigo-200/30 hover:border-indigo-100 transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-black text-slate-900">{member.name}</h3>
                                                <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getRoleBadgeColor(member.role)}`}>
                                                    {getRoleIcon(member.role)}
                                                    <span>{member.role}</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-500 font-medium text-sm">{member.email}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                Joined {new Date(member.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {member.user_id && (
                                            followingIds.has(member.user_id) ? (
                                                <button
                                                    onClick={() => handleUnfollow(member.user_id)}
                                                    disabled={networkLoading || networkMutatingId === member.user_id}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                    Unfollow
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleFollow(member.user_id)}
                                                    disabled={networkLoading || networkMutatingId === member.user_id}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all disabled:opacity-50"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    Follow
                                                </button>
                                            )
                                        )}
                                        {member.role !== 'owner' && (
                                            <button 
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="p-3 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-2xl transition-all"
                                                title="Remove member"
                                            >
                                                <UserMinus className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowInviteModal(false)} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Invite Collaborator</h2>
                                <p className="text-slate-500 text-sm font-medium mt-1">Add a new member to your workspace.</p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="colleague@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                    Assign Role
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                >
                                    <option value="member">Member</option>
                                    <option value="developer">Developer</option>
                                    <option value="admin">Admin</option>
                                    <option value="billing">Billing</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        <span>Send Invitation</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const X = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
