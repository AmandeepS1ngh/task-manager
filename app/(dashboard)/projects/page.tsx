'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/context/ToastContext';
import ProjectCard from '@/components/ProjectCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import Modal from '@/components/Modal';
import type { ProjectWithMeta } from '@/lib/types';

export default function ProjectsPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchProjects = useCallback(async () => {
    const { data, error } = await api.get<ProjectWithMeta[]>('/api/projects');
    if (error) {
      showToast(error, 'error');
    } else {
      setProjects(data ?? []);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }

    setCreating(true);
    const { error } = await api.post('/api/projects', {
      name: newName.trim(),
      description: newDesc.trim() || null,
    });
    setCreating(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Project created!', 'success');
      setModalOpen(false);
      setNewName('');
      setNewDesc('');
      fetchProjects();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Projects
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span className="text-lg">+</span>
          New Project
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton variant="card" count={6} />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-5xl mb-4">📁</p>
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
            No projects yet
          </h3>
          <p className="text-[var(--color-muted)] text-sm mb-6">
            Create your first project to get started
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              memberCount={project.member_count}
              taskCount={project.task_count}
              userRole={project.role}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Project"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted)] mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-border)] focus:border-[var(--color-primary)] transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted)] mb-1.5">
              Description
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What's this project about?"
              rows={3}
              className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-border)] focus:border-[var(--color-primary)] transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {creating && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
