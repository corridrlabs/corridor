import React, { useState } from 'react';
import { Plus, FolderOpen, Edit, Trash2, Users, Calendar, Building2, Loader2 } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { Skeleton } from '../../components/common/Skeleton';

const ProjectManagement: React.FC = () => {
    const { projects, currentProject, setCurrentProject, createProject, deleteProject, loading } = useProject();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        industry: '',
        employeeCount: 0
    });

    const handleCreateProject = async () => {
        if (newProject.name && newProject.industry) {
            setActionLoading(true);
            try {
                await createProject(newProject);
                setShowCreateModal(false);
                setNewProject({ name: '', description: '', industry: '', employeeCount: 0 });
            } catch (error) {
                // Error handled in context
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Delete this project?')) {
            try {
                await deleteProject(id);
            } catch (error) {
                // Error handled in context
            }
        }
    };

    if (loading && !projects.length) {
        return (
            <div className="h-full bg-[#F5F1E8] p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between">
                        <Skeleton variant="text" width={200} height={32} />
                        <Skeleton variant="rectangular" width={120} height={40} />
                    </div>
                    <Skeleton variant="rectangular" height={200} />
                    <div className="grid grid-cols-3 gap-6">
                        <Skeleton variant="rectangular" height={150} />
                        <Skeleton variant="rectangular" height={150} />
                        <Skeleton variant="rectangular" height={150} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Projects</h1>
                        <p className="text-gray-600">Manage your business projects</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>

                {/* Current Project */}
                {currentProject && (
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <FolderOpen className="w-6 h-6" />
                            <span className="text-sm font-medium opacity-90">Active Project</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{currentProject.name}</h2>
                        <p className="opacity-90 mb-4">{currentProject.description}</p>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {currentProject.industry}
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {currentProject.employeeCount} employees
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Since {new Date(currentProject.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Projects Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all ${currentProject?.id === project.id
                                ? 'border-indigo-600 shadow-md'
                                : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                                }`}
                            onClick={() => setCurrentProject(project)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center">
                                    <FolderOpen className="w-6 h-6 text-indigo-600" />
                                </div>
                                {currentProject?.id === project.id && (
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                        Active
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
                            <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                            <div className="space-y-2 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    {project.industry}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {project.employeeCount} employees
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Edit logic could go here
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                                >
                                    <Edit className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                    className="p-2 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && !loading && (
                        <div className="col-span-3 text-center py-12 text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-300">
                            <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-lg font-medium">No projects found</p>
                            <p className="text-sm">Create a new project to get started</p>
                        </div>
                    )}
                </div>

                {/* Create Project Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="My Business"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        rows={3}
                                        placeholder="Brief description"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Industry
                                    </label>
                                    <select
                                        value={newProject.industry}
                                        onChange={(e) => setNewProject({ ...newProject, industry: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">Select industry</option>
                                        <option value="Fintech">Fintech</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Employee Count
                                    </label>
                                    <input
                                        type="number"
                                        value={newProject.employeeCount}
                                        onChange={(e) => setNewProject({ ...newProject, employeeCount: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="50"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={handleCreateProject}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectManagement;
