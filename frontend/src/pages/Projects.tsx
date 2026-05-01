import { useState, useEffect } from 'react';
import { FolderOpen, Plus, X, Globe } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { accountApi } from '../api/account';
import { GenericPageSkeleton } from '../components/ui/Skeletons';

interface Project {
    id: string;
    name: string;
    description: string | null;
    region: string | null;
    status: string;
    created_at: string;
}

export const Projects = () => {
    const { user } = useUser();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [projectRegion, setProjectRegion] = useState('us-east-1');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [user]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await accountApi.getProjects();
            setProjects(response);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await accountApi.createProject({
                name: projectName,
                description: projectDescription,
                region: projectRegion
            });
            alert('Project created!');
            setShowCreateModal(false);
            setProjectName('');
            setProjectDescription('');
            setProjectRegion('us-east-1');
            fetchProjects();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create project');
        }
    };

    const regions = [
        { value: 'us-east-1', label: 'US East (N. Virginia)' },
        { value: 'us-west-1', label: 'US West (N. California)' },
        { value: 'eu-west-1', label: 'EU (Ireland)' },
        { value: 'eu-central-1', label: 'EU (Frankfurt)' },
        { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
        { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
    ];

    if (loading) {
        return <GenericPageSkeleton cardRows={6} />;
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900">No Account Found</h3>
                    <p className="text-gray-500 mt-2">Please log in to view and manage projects.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                    <p className="text-gray-500">Manage your business projects and deployments</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    New Project
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                    <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-6">Create your first project to get started</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Create First Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <FolderOpen className="text-indigo-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                        {project.region && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                <Globe size={12} />
                                                {regions.find(r => r.value === project.region)?.label || project.region}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                            {project.description && (
                                <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                            )}
                            <div className="text-xs text-gray-500">
                                Created {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Create New Project</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                    placeholder="My Awesome Project"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    value={projectDescription}
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                    rows={3}
                                    placeholder="Brief description of your project"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                                <select
                                    value={projectRegion}
                                    onChange={(e) => setProjectRegion(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                >
                                    {regions.map((region) => (
                                        <option key={region.value} value={region.value}>
                                            {region.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
                            )}

                            <button
                                type="submit"
                                className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Create Project
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
