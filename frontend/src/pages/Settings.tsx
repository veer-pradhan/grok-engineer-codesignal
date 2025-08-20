import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import classNames from 'classnames';

import { apiClient } from '../api/client';
import type { ScoringCriteria } from '../types';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('scoring');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<ScoringCriteria | null>(null);

  const queryClient = useQueryClient();

  const { data: scoringCriteria = [], isLoading } = useQuery<ScoringCriteria[]>(
    'scoring-criteria',
    async () => {
      const { data } = await apiClient.get('/scoring/criteria');
      return data;
    }
  );

  const createDefaultsMutation = useMutation(
    async () => {
      const { data } = await apiClient.post('/scoring/criteria/defaults');
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scoring-criteria');
        toast.success('Default scoring criteria created');
      },
      onError: () => {
        toast.error('Failed to create default criteria');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: number) => {
      await apiClient.delete(`/scoring/criteria/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scoring-criteria');
        toast.success('Scoring criteria deleted');
      },
      onError: () => {
        toast.error('Failed to delete criteria');
      },
    }
  );

  const handleEdit = (criteria: ScoringCriteria) => {
    setEditingCriteria(criteria);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this scoring criteria?')) {
      deleteMutation.mutate(id);
    }
  };

  const tabs = [
    { id: 'scoring', name: 'Scoring Criteria' },
    { id: 'grok', name: 'Grok Configuration' },
    { id: 'general', name: 'General Settings' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure your SDR system settings and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'scoring' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Scoring Criteria</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure how leads are scored and qualified.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={() => createDefaultsMutation.mutate()}
                  disabled={createDefaultsMutation.isLoading}
                  className="btn-secondary"
                >
                  {createDefaultsMutation.isLoading ? 'Creating...' : 'Create Defaults'}
                </button>
                <button
                  onClick={() => {
                    setEditingCriteria(null);
                    setIsModalOpen(true);
                  }}
                  className="btn-primary flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Criteria
                </button>
              </div>
            </div>

            {/* Scoring Criteria List */}
            <div className="card">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : scoringCriteria.length === 0 ? (
                <div className="text-center py-8">
                  <h4 className="text-sm font-medium text-gray-900">No scoring criteria</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Create scoring criteria to help qualify and score leads.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => createDefaultsMutation.mutate()}
                      disabled={createDefaultsMutation.isLoading}
                      className="btn-primary"
                    >
                      Create Default Criteria
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {scoringCriteria.map((criteria) => (
                    <div
                      key={criteria.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {criteria.name}
                            </h4>
                            <span className="text-sm text-gray-500">
                              Weight: {criteria.weight}
                            </span>
                            <span
                              className={`badge ${
                                criteria.is_active ? 'badge-green' : 'badge-gray'
                              }`}
                            >
                              {criteria.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {criteria.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {criteria.description}
                            </p>
                          )}
                          <div className="text-xs text-gray-500">
                            Created: {new Date(criteria.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(criteria)}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(criteria.id)}
                            className="p-1 rounded hover:bg-gray-100"
                            disabled={deleteMutation.isLoading}
                          >
                            <TrashIcon className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'grok' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Grok API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">API Key</label>
                  <input
                    type="password"
                    value="INSERT-API-KEY-HERE"
                    disabled
                    className="form-input bg-gray-50"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Update your Grok API key in the environment configuration.
                  </p>
                </div>
                <div>
                  <label className="form-label">Base URL</label>
                  <input
                    type="url"
                    value="https://api.x.ai/v1"
                    disabled
                    className="form-input bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Default Temperature</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Max Tokens</label>
                    <input
                      type="number"
                      min="100"
                      max="4000"
                      defaultValue="1000"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    placeholder="Your Company Name"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Default Message Signature</label>
                  <textarea
                    rows={3}
                    placeholder="Best regards,&#10;Your Name&#10;Your Title"
                    className="form-input"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="auto-qualify"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auto-qualify" className="ml-2 text-sm text-gray-700">
                    Automatically qualify new leads
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="email-notifications"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-notifications" className="ml-2 text-sm text-gray-700">
                    Send email notifications for new leads
                  </label>
                </div>
              </div>
              <div className="mt-6">
                <button className="btn-primary">Save Settings</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scoring Criteria Modal */}
      <ScoringCriteriaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCriteria(null);
        }}
        criteria={editingCriteria}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingCriteria(null);
          queryClient.invalidateQueries('scoring-criteria');
        }}
      />
    </div>
  );
}

interface ScoringCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: ScoringCriteria | null;
  onSuccess: () => void;
}

function ScoringCriteriaModal({ isOpen, onClose, criteria, onSuccess }: ScoringCriteriaModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: criteria || {
      name: '',
      description: '',
      weight: 1.0,
      criteria_rules: '{}',
    },
  });

  const createMutation = useMutation(
    async (data: any) => {
      if (criteria) {
        await apiClient.put(`/scoring/criteria/${criteria.id}`, data);
      } else {
        await apiClient.post('/scoring/criteria', data);
      }
    },
    {
      onSuccess: () => {
        toast.success(criteria ? 'Criteria updated' : 'Criteria created');
        reset();
        onSuccess();
      },
      onError: () => {
        toast.error(criteria ? 'Failed to update criteria' : 'Failed to create criteria');
      },
    }
  );

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                    {criteria ? 'Edit Scoring Criteria' : 'Add Scoring Criteria'}
                  </Dialog.Title>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="form-label">Name</label>
                      <input
                        {...register('name', { required: 'Name is required' })}
                        className={classNames('form-input', {
                          'border-red-300': errors.name,
                        })}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Description</label>
                      <textarea
                        {...register('description')}
                        rows={2}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="form-label">Weight</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        {...register('weight', { required: 'Weight is required' })}
                        className={classNames('form-input', {
                          'border-red-300': errors.weight,
                        })}
                      />
                      {errors.weight && (
                        <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Criteria Rules (JSON)</label>
                      <textarea
                        {...register('criteria_rules', { required: 'Rules are required' })}
                        rows={4}
                        className={classNames('form-input', {
                          'border-red-300': errors.criteria_rules,
                        })}
                        placeholder='{"high": 10, "medium": 6, "low": 3}'
                      />
                      {errors.criteria_rules && (
                        <p className="mt-1 text-sm text-red-600">{errors.criteria_rules.message}</p>
                      )}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button type="button" onClick={onClose} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createMutation.isLoading}
                        className="btn-primary flex-1"
                      >
                        {createMutation.isLoading
                          ? criteria
                            ? 'Updating...'
                            : 'Creating...'
                          : criteria
                          ? 'Update Criteria'
                          : 'Create Criteria'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
