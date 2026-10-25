// Admin AI Knowledge Management Page
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, RefreshCw, Database, FileText, CheckCircle,
  AlertCircle, Clock, Search, Plus, Edit, Trash2, Save, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminAIKnowledge() {
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    lastRefresh: null,
    indexStatus: 'unknown'
  });

  // Form state for new/edit entry
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    keywords: ''
  });

  // Load knowledge base
  useEffect(() => {
    loadKnowledge();
    checkIndexStatus();
  }, []);

  async function loadKnowledge() {
    setLoading(true);
    try {
      // Load from local knowledge base file (in production, this would be an API call)
      const response = await import('@/data/knowledgeBase');
      const kb = response.knowledgeBase || [];
      setKnowledge(kb);
      setStats(prev => ({ ...prev, totalEntries: kb.length }));
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  }

  async function checkIndexStatus() {
    try {
      const aiApiUrl = import.meta.env.VITE_AI_API_URL || 'http://localhost:3002/api/ai';
      const response = await fetch(`${aiApiUrl}/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          indexStatus: 'ready',
          lastRefresh: data.lastIndexed || null
        }));
      } else {
        setStats(prev => ({ ...prev, indexStatus: 'error' }));
      }
    } catch (error) {
      setStats(prev => ({ ...prev, indexStatus: 'offline' }));
    }
  }

  async function refreshKnowledgeIndex() {
    setRefreshing(true);
    try {
      const aiApiUrl = import.meta.env.VITE_AI_API_URL || 'http://localhost:3002/api/ai';

      const response = await fetch(`${aiApiUrl}/refresh-index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });

      if (response.ok) {
        toast.success('Knowledge index refreshed successfully');
        setStats(prev => ({
          ...prev,
          lastRefresh: new Date().toISOString(),
          indexStatus: 'ready'
        }));
      } else {
        throw new Error('Failed to refresh index');
      }
    } catch (error) {
      console.error('Failed to refresh index:', error);
      toast.error('Failed to refresh knowledge index. Is the AI server running?');
    } finally {
      setRefreshing(false);
    }
  }

  function handleSaveEntry() {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    const entry = {
      id: editingId || `kb-${Date.now()}`,
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      category: formData.category,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
    };

    if (editingId) {
      setKnowledge(prev => prev.map(k => k.id === editingId ? entry : k));
      toast.success('Entry updated');
    } else {
      setKnowledge(prev => [...prev, entry]);
      toast.success('Entry added');
    }

    resetForm();

    // Note: In production, this would save to the backend
    toast.info('Note: Changes are temporary. Update knowledgeBase.js to persist.');
  }

  function handleDeleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
      setKnowledge(prev => prev.filter(k => k.id !== id));
      toast.success('Entry deleted');
    }
  }

  function handleEditEntry(entry) {
    setEditingId(entry.id);
    setFormData({
      question: entry.question,
      answer: entry.answer,
      category: entry.category || 'general',
      keywords: entry.keywords?.join(', ') || ''
    });
    setShowAddForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      keywords: ''
    });
  }

  // Filter knowledge by search query
  const filteredKnowledge = knowledge.filter(k => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      k.question?.toLowerCase().includes(query) ||
      k.answer?.toLowerCase().includes(query) ||
      k.keywords?.some(kw => kw.toLowerCase().includes(query))
    );
  });

  const categories = [
    { value: 'general', label: 'General Information' },
    { value: 'family', label: 'Family & Kids' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'animals', label: 'Animals' },
    { value: 'accessibility', label: 'Accessibility' },
    { value: 'events', label: 'Events & Activities' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'policies', label: 'Policies' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-[#2D5016]" />
            AI Knowledge Base
          </h1>
          <p className="text-stone-600 mt-1">
            Manage the AI assistant's knowledge and trigger index refreshes
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </Button>
          <Button
            onClick={refreshKnowledgeIndex}
            disabled={refreshing}
            className="gap-2 bg-[#2D5016] hover:bg-[#4A7C23]"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Index'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-stone-600">Total Entries</p>
              <p className="text-xl font-bold text-stone-900">{stats.totalEntries}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stats.indexStatus === 'ready' ? 'bg-green-100' :
              stats.indexStatus === 'offline' ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              {stats.indexStatus === 'ready' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : stats.indexStatus === 'offline' ? (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-stone-600">Index Status</p>
              <p className="text-xl font-bold text-stone-900 capitalize">{stats.indexStatus}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-stone-600">Last Refresh</p>
              <p className="text-lg font-bold text-stone-900">
                {stats.lastRefresh
                  ? new Date(stats.lastRefresh).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-stone-200 p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit Entry' : 'Add New Entry'}
            </h2>
            <button onClick={resetForm} className="p-2 hover:bg-stone-100 rounded-lg">
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Question
              </label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="e.g., What are the opening hours?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Answer
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="The detailed answer to the question..."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#2D5016] focus:border-transparent min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#2D5016]"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Keywords (comma-separated)
                </label>
                <Input
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="hours, opening, time"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEntry}
                className="gap-2 bg-[#2D5016] hover:bg-[#4A7C23]"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update Entry' : 'Add Entry'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge base..."
          className="pl-10"
        />
      </div>

      {/* Knowledge List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-stone-400 animate-spin mx-auto mb-2" />
            <p className="text-stone-600">Loading knowledge base...</p>
          </div>
        ) : filteredKnowledge.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-600">
              {searchQuery ? 'No matching entries found' : 'No knowledge entries yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredKnowledge.map((entry, index) => (
              <div key={entry.id || index} className="p-4 hover:bg-stone-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                        {categories.find(c => c.value === entry.category)?.label || entry.category}
                      </span>
                    </div>
                    <h3 className="font-medium text-stone-900 mb-1">{entry.question}</h3>
                    <p className="text-sm text-stone-600 line-clamp-2">{entry.answer}</p>
                    {entry.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.keywords.slice(0, 5).map((kw, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-stone-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">How Knowledge Refresh Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• The AI uses this knowledge base to answer visitor questions</li>
          <li>• Click "Refresh Index" after making changes to update the AI's knowledge</li>
          <li>• The AI server must be running for refresh to work</li>
          <li>• Changes here are for preview only - update <code className="bg-blue-100 px-1 rounded">src/data/knowledgeBase.js</code> to persist</li>
        </ul>
      </div>
    </div>
  );
}
