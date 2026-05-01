import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderKanban, Plus, Search } from 'lucide-react';
import { useOrgProjectStore } from '../store/orgProjectStore';

export const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const { projects, fetchProjects, loadingProjects } = useOrgProjectStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectProject = (projectId: string) => {
        navigate(`/project/${projectId}/dashboard`);
    };

    if (loadingProjects) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6 rounded-lg shadow-sm">
                    <div className="px-8 py-6">
                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
                    </div>
                </div>
                <div className="px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4 animate-pulse"
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                                <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6 rounded-lg shadow-sm">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Projects
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Manage your projects and environments
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(`/onboarding`)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            New project
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-8">
                {/* Search and Filter */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for a project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => handleSelectProject(project.id)}
                            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-lg transition-all text-left"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                    <FolderKanban className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                </div>
                                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded uppercase">
                                    {project.region || project.status || 'Active'}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {project.name}
                            </h3>

                            {project.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                    {project.description}
                                </p>
                            )}

                            {project.created_at && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Created {new Date(project.created_at).toLocaleDateString()}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed">
                        <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No projects found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => navigate(`/onboarding`)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                New project
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
