import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { Fragment } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import classNames from 'classnames';

import { leadsApi } from '../api/leads';
import type { Lead, LeadFormData, PipelineStage } from '../types';

export default function Leads() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<PipelineStage | ''>('');
  
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery(
    ['leads', { search: searchTerm, stage: selectedStage }],
    () => leadsApi.getLeads({
      search: searchTerm || undefined,
      stage: selectedStage || undefined,
    }),
    {
      keepPreviousData: true,
    }
  );

  const deleteMutation = useMutation(leadsApi.deleteLead, {
    onSuccess: () => {
      queryClient.invalidateQueries('leads');
      toast.success('Lead deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete lead');
    },
  });

  const qualifyMutation = useMutation(leadsApi.qualifyLead, {
    onSuccess: () => {
      queryClient.invalidateQueries('leads');
      toast.success('Lead qualified successfully');
    },
    onError: () => {
      toast.error('Failed to qualify lead');
    },
  });

  const scoreMutation = useMutation(
    (leadId: number) => leadsApi.scoreLead(leadId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('leads');
        toast.success('Lead scored successfully');
      },
      onError: () => {
        toast.error('Failed to score lead');
      },
    }
  );

  const handleDelete = (leadId: number) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate(leadId);
    }
  };

  const handleQualify = (leadId: number) => {
    qualifyMutation.mutate(leadId);
  };

  const handleScore = (leadId: number) => {
    scoreMutation.mutate(leadId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your sales leads and track their progress through the pipeline.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </div>
        <div>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as PipelineStage | '')}
            className="form-input"
          >
            <option value="">All Stages</option>
            <option value="new">New</option>
            <option value="qualified">Qualified</option>
            <option value="contacted">Contacted</option>
            <option value="meeting_scheduled">Meeting Scheduled</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first lead.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary"
              >
                Add Lead
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <Link
                          to={`/leads/${lead.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600"
                        >
                          {lead.first_name} {lead.last_name}
                        </Link>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.company_name}</div>
                      <div className="text-sm text-gray-500">{lead.job_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStageColor(lead.pipeline_stage)}`}>
                        {lead.pipeline_stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {lead.lead_score.toFixed(1)}
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${Math.min((lead.lead_score / 10) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="p-2 rounded-full hover:bg-gray-100">
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                <Link
                                  to={`/leads/${lead.id}`}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <PencilIcon className="h-4 w-4 mr-3" />
                                  View Details
                                </Link>
                              </Menu.Item>
                              <Menu.Item>
                                <button
                                  onClick={() => handleQualify(lead.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  disabled={qualifyMutation.isLoading}
                                >
                                  <SparklesIcon className="h-4 w-4 mr-3" />
                                  Qualify Lead
                                </button>
                              </Menu.Item>
                              <Menu.Item>
                                <button
                                  onClick={() => handleScore(lead.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  disabled={scoreMutation.isLoading}
                                >
                                  <ChartBarIcon className="h-4 w-4 mr-3" />
                                  Score Lead
                                </button>
                              </Menu.Item>
                              <Menu.Item>
                                <button
                                  onClick={() => handleDelete(lead.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  disabled={deleteMutation.isLoading}
                                >
                                  <TrashIcon className="h-4 w-4 mr-3" />
                                  Delete
                                </button>
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          queryClient.invalidateQueries('leads');
        }}
      />
    </div>
  );
}

function getStageColor(stage: string): string {
  switch (stage) {
    case 'new':
      return 'badge-gray';
    case 'qualified':
      return 'badge-blue';
    case 'contacted':
      return 'badge-yellow';
    case 'meeting_scheduled':
      return 'badge-blue';
    case 'proposal_sent':
      return 'badge-yellow';
    case 'negotiation':
      return 'badge-yellow';
    case 'closed_won':
      return 'badge-green';
    case 'closed_lost':
      return 'badge-red';
    default:
      return 'badge-gray';
  }
}

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AddLeadModal({ isOpen, onClose, onSuccess }: AddLeadModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadFormData>();

  const createMutation = useMutation(leadsApi.createLead, {
    onSuccess: () => {
      toast.success('Lead created successfully');
      reset();
      onSuccess();
    },
    onError: () => {
      toast.error('Failed to create lead');
    },
  });

  const onSubmit = (data: LeadFormData) => {
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
                  <div className="text-center">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Add New Lead
                    </Dialog.Title>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">First Name</label>
                        <input
                          {...register('first_name', { required: 'First name is required' })}
                          className={classNames('form-input', {
                            'border-red-300': errors.first_name,
                          })}
                        />
                        {errors.first_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="form-label">Last Name</label>
                        <input
                          {...register('last_name', { required: 'Last name is required' })}
                          className={classNames('form-input', {
                            'border-red-300': errors.last_name,
                          })}
                        />
                        {errors.last_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        {...register('email', { required: 'Email is required' })}
                        className={classNames('form-input', {
                          'border-red-300': errors.email,
                        })}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Company Name</label>
                      <input
                        {...register('company_name', { required: 'Company name is required' })}
                        className={classNames('form-input', {
                          'border-red-300': errors.company_name,
                        })}
                      />
                      {errors.company_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Job Title</label>
                      <input {...register('job_title')} className="form-input" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Industry</label>
                        <input {...register('industry')} className="form-input" />
                      </div>
                      <div>
                        <label className="form-label">Company Size</label>
                        <select {...register('company_size')} className="form-input">
                          <option value="">Select size</option>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201-500">201-500</option>
                          <option value="501-1000">501-1000</option>
                          <option value="1000+">1000+</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createMutation.isLoading}
                        className="btn-primary flex-1"
                      >
                        {createMutation.isLoading ? 'Creating...' : 'Create Lead'}
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
