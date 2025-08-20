import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  SparklesIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { leadsApi } from '../api/leads';
import type { MessageGeneration, InteractionType } from '../types';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const leadId = parseInt(id!, 10);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery(
    ['lead', leadId],
    () => leadsApi.getLead(leadId),
    {
      enabled: !!leadId,
    }
  );

  const qualifyMutation = useMutation(leadsApi.qualifyLead, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['lead', leadId]);
      toast.success('Lead qualified successfully');
      console.log('Qualification result:', data);
    },
    onError: () => {
      toast.error('Failed to qualify lead');
    },
  });

  const scoreMutation = useMutation(
    () => leadsApi.scoreLead(leadId),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['lead', leadId]);
        toast.success('Lead scored successfully');
        console.log('Scoring result:', data);
      },
      onError: () => {
        toast.error('Failed to score lead');
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Lead not found</h3>
        <Link to="/leads" className="mt-4 btn-primary">
          Back to Leads
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'interactions', name: 'Interactions', count: lead.interactions.length },
    { id: 'messages', name: 'Messages', count: lead.messages.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/leads"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-sm text-gray-500">
              {lead.job_title} at {lead.company_name}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => qualifyMutation.mutate(leadId)}
            disabled={qualifyMutation.isLoading}
            className="btn-secondary flex items-center"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            {qualifyMutation.isLoading ? 'Qualifying...' : 'Qualify Lead'}
          </button>
          <button
            onClick={() => scoreMutation.mutate()}
            disabled={scoreMutation.isLoading}
            className="btn-secondary flex items-center"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            {scoreMutation.isLoading ? 'Scoring...' : 'Score Lead'}
          </button>
        </div>
      </div>

      {/* Lead Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-900">{lead.email}</span>
            </div>
            {lead.phone && (
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-900">{lead.phone}</span>
              </div>
            )}
            {lead.company_website && (
              <div className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                <a
                  href={lead.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  {lead.company_website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Company Info */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Industry</span>
              <p className="text-sm text-gray-900">{lead.industry || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Company Size</span>
              <p className="text-sm text-gray-900">{lead.company_size || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Lead Status */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Status</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Pipeline Stage</span>
              <p className="text-sm">
                <span className={`badge ${getStageColor(lead.pipeline_stage)}`}>
                  {lead.pipeline_stage.replace('_', ' ')}
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Lead Score</span>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-900 mr-2">
                  {lead.lead_score.toFixed(1)}/10
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${Math.min((lead.lead_score / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Created</span>
              <p className="text-sm text-gray-900">
                {format(new Date(lead.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
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
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              {tab.name}
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Generate Message</h3>
                <button
                  onClick={() => setIsMessageModalOpen(true)}
                  className="btn-primary flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Generate
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Use AI to generate personalized outreach messages for this lead.
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Interaction</h3>
                <button
                  onClick={() => setIsInteractionModalOpen(true)}
                  className="btn-secondary flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Log interactions, calls, meetings, and notes for this lead.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-4">
            {lead.interactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No interactions yet</p>
                <button
                  onClick={() => setIsInteractionModalOpen(true)}
                  className="mt-4 btn-primary"
                >
                  Add First Interaction
                </button>
              </div>
            ) : (
              lead.interactions.map((interaction) => (
                <div key={interaction.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`badge ${getInteractionTypeColor(interaction.interaction_type)}`}>
                          {interaction.interaction_type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(interaction.created_at), 'MMM d, yyyy - h:mm a')}
                        </span>
                      </div>
                      {interaction.subject && (
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          {interaction.subject}
                        </h4>
                      )}
                      <p className="text-sm text-gray-600">{interaction.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            {lead.messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No messages generated yet</p>
                <button
                  onClick={() => setIsMessageModalOpen(true)}
                  className="mt-4 btn-primary"
                >
                  Generate First Message
                </button>
              </div>
            ) : (
              lead.messages.map((message) => (
                <div key={message.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="badge badge-blue">{message.message_type}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(message.created_at), 'MMM d, yyyy - h:mm a')}
                      </span>
                    </div>
                  </div>
                  {message.subject && (
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Subject: {message.subject}
                    </h4>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {message.content}
                    </pre>
                  </div>
                  {!message.sent_at && (
                    <div className="flex justify-end">
                      <button className="btn-primary text-sm py-1 px-3">
                        Mark as Sent
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        leadId={leadId}
        onSuccess={() => {
          setIsMessageModalOpen(false);
          queryClient.invalidateQueries(['lead', leadId]);
        }}
      />

      <InteractionModal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        leadId={leadId}
        onSuccess={() => {
          setIsInteractionModalOpen(false);
          queryClient.invalidateQueries(['lead', leadId]);
        }}
      />
    </div>
  );
}

// Helper functions and modals...
function getStageColor(stage: string): string {
  switch (stage) {
    case 'new': return 'badge-gray';
    case 'qualified': return 'badge-blue';
    case 'contacted': return 'badge-yellow';
    case 'meeting_scheduled': return 'badge-blue';
    case 'proposal_sent': return 'badge-yellow';
    case 'negotiation': return 'badge-yellow';
    case 'closed_won': return 'badge-green';
    case 'closed_lost': return 'badge-red';
    default: return 'badge-gray';
  }
}

function getInteractionTypeColor(type: InteractionType): string {
  switch (type) {
    case 'email': return 'badge-blue';
    case 'call': return 'badge-green';
    case 'meeting': return 'badge-yellow';
    case 'linkedin': return 'badge-blue';
    case 'note': return 'badge-gray';
    default: return 'badge-gray';
  }
}

// Message Modal Component
interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  onSuccess: () => void;
}

function MessageModal({ isOpen, onClose, leadId, onSuccess }: MessageModalProps) {
  const { register, handleSubmit, reset } = useForm<MessageGeneration>();

  const generateMutation = useMutation(
    (data: MessageGeneration) => leadsApi.generateMessage(leadId, data),
    {
      onSuccess: () => {
        toast.success('Message generated successfully');
        reset();
        onSuccess();
      },
      onError: () => {
        toast.error('Failed to generate message');
      },
    }
  );

  const onSubmit = (data: MessageGeneration) => {
    generateMutation.mutate(data);
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
                    Generate Personalized Message
                  </Dialog.Title>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="form-label">Message Type</label>
                      <select {...register('message_type')} className="form-input" required>
                        <option value="">Select type</option>
                        <option value="email">Email</option>
                        <option value="linkedin">LinkedIn Message</option>
                        <option value="cold_call_script">Cold Call Script</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Custom Instructions (Optional)</label>
                      <textarea
                        {...register('custom_instructions')}
                        rows={3}
                        className="form-input"
                        placeholder="Any specific instructions for the message..."
                      />
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button type="button" onClick={onClose} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={generateMutation.isLoading}
                        className="btn-primary flex-1"
                      >
                        {generateMutation.isLoading ? 'Generating...' : 'Generate Message'}
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

// Interaction Modal Component
interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  onSuccess: () => void;
}

function InteractionModal({ isOpen, onClose, leadId, onSuccess }: InteractionModalProps) {
  const { register, handleSubmit, reset } = useForm();

  const addMutation = useMutation(
    (data: any) => leadsApi.addInteraction(leadId, data),
    {
      onSuccess: () => {
        toast.success('Interaction added successfully');
        reset();
        onSuccess();
      },
      onError: () => {
        toast.error('Failed to add interaction');
      },
    }
  );

  const onSubmit = (data: any) => {
    addMutation.mutate(data);
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
                    Add Interaction
                  </Dialog.Title>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="form-label">Interaction Type</label>
                      <select {...register('interaction_type')} className="form-input" required>
                        <option value="">Select type</option>
                        <option value="email">Email</option>
                        <option value="call">Call</option>
                        <option value="meeting">Meeting</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="note">Note</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Subject (Optional)</label>
                      <input {...register('subject')} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Content</label>
                      <textarea
                        {...register('content')}
                        rows={4}
                        className="form-input"
                        placeholder="Describe the interaction..."
                        required
                      />
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button type="button" onClick={onClose} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addMutation.isLoading}
                        className="btn-primary flex-1"
                      >
                        {addMutation.isLoading ? 'Adding...' : 'Add Interaction'}
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
