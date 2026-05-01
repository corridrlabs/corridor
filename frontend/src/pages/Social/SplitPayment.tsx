import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Mail, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { GenericPageSkeleton } from '../../components/ui/Skeletons';

interface SplitRequest {
  id: string;
  title: string;
  description: string;
  total_amount: number;
  currency: string;
  status: string;
  share_link: string;
  participants: Participant[];
}

interface Participant {
  email: string;
  amount: number;
  status: string;
  paid_at?: string;
}

const SplitPayment: React.FC = () => {
  const navigate = useNavigate();
  const [splits, setSplits] = useState<SplitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSplit, setNewSplit] = useState({
    title: '',
    description: '',
    total_amount: '',
    currency: 'USD',
    item_link: '',
    participants: ['']
  });

  useEffect(() => {
    fetchSplits();
  }, []);

  const fetchSplits = async () => {
    setLoading(true);
    try {
      const response = await api.get('/split');
      setSplits(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching splits:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/split', {
        ...newSplit,
        total_amount: parseFloat(newSplit.total_amount),
        participants: newSplit.participants.filter(p => p.trim())
      });
      setShowCreateForm(false);
      setNewSplit({
        title: '',
        description: '',
        total_amount: '',
        currency: 'USD',
        item_link: '',
        participants: ['']
      });
      fetchSplits();
    } catch (error) {
      console.error('Error creating split:', error);
    }
  };

  const addParticipant = () => {
    setNewSplit(prev => ({
      ...prev,
      participants: [...prev.participants, '']
    }));
  };

  const updateParticipant = (index: number, value: string) => {
    setNewSplit(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => i === index ? value : p)
    }));
  };

  const removeParticipant = (index: number) => {
    setNewSplit(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'INVITED':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FUNDED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {loading ? (
        <GenericPageSkeleton cardRows={4} />
      ) : (
        <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Split Payments</h1>
          <p className="text-gray-600 mt-2">Split group purchases and track payments</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Create Split
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Split Payment</h2>
            
            <form onSubmit={createSplit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newSplit.title}
                  onChange={(e) => setNewSplit({ ...newSplit, title: e.target.value })}
                  placeholder="Group dinner, gift, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newSplit.description}
                  onChange={(e) => setNewSplit({ ...newSplit, description: e.target.value })}
                  placeholder="What are you splitting?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSplit.total_amount}
                    onChange={(e) => setNewSplit({ ...newSplit, total_amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={newSplit.currency}
                    onChange={(e) => setNewSplit({ ...newSplit, currency: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="USD">USD</option>
                    <option value="KES">KES</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Link (Optional)</label>
                <input
                  type="url"
                  value={newSplit.item_link}
                  onChange={(e) => setNewSplit({ ...newSplit, item_link: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
                {newSplit.participants.map((participant, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="email"
                      value={participant}
                      onChange={(e) => updateParticipant(index, e.target.value)}
                      placeholder="email@example.com"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    {newSplit.participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addParticipant}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  + Add participant
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Each person pays: {newSplit.total_amount && newSplit.participants.filter(p => p.trim()).length > 0 
                    ? (parseFloat(newSplit.total_amount) / newSplit.participants.filter(p => p.trim()).length).toFixed(2)
                    : '0.00'} {newSplit.currency}
                </p>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {splits.length === 0 ? (
          <div className="lg:col-span-2 text-center py-12 bg-white rounded-lg shadow-md border">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No split payments yet</p>
            <p className="text-gray-400 mt-2">Create your first group payment to get started</p>
          </div>
        ) : splits.map((split) => (
          <div key={split.id} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{split.title}</h3>
                <p className="text-gray-600 text-sm">{split.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(split.status)}`}>
                {split.status}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-lg font-bold">
                <DollarSign className="h-5 w-5" />
                {split.total_amount} {split.currency}
              </div>
              <p className="text-sm text-gray-600">
                {split.participants?.length || 0} participants
              </p>
            </div>

            <div className="space-y-2 mb-4">
              {split.participants?.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(participant.status)}
                    <span className="text-sm">{participant.email}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{participant.amount} {split.currency}</div>
                    {participant.paid_at && (
                      <div className="text-xs text-gray-500">
                        Paid {new Date(participant.paid_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/split/${split.id}`)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-center"
              >
                View Details
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(split.share_link)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Share
              </button>
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
};

export default SplitPayment;
