import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { leadsApi } from '../api/leads';
import { PipelineStage } from '../types';

const stats = [
  { name: 'Total Leads', stat: '0', icon: UserGroupIcon, color: 'text-blue-600' },
  { name: 'Qualified Leads', stat: '0', icon: CheckCircleIcon, color: 'text-green-600' },
  { name: 'In Progress', stat: '0', icon: ClockIcon, color: 'text-yellow-600' },
  { name: 'Closed Won', stat: '0', icon: ChartBarIcon, color: 'text-purple-600' },
];

export default function Dashboard() {
  const { data: pipelineStats = {} } = useQuery(
    'pipeline-stats',
    leadsApi.getPipelineStats,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const { data: recentLeads = [] } = useQuery(
    'recent-leads',
    () => leadsApi.getLeads({ limit: 5 }),
    {
      refetchInterval: 30000,
    }
  );

  // Update stats with real data
  const updatedStats = [
    {
      ...stats[0],
      stat: Object.values(pipelineStats).reduce((sum: number, count: number) => sum + count, 0).toString(),
    },
    {
      ...stats[1],
      stat: (pipelineStats[PipelineStage.QUALIFIED] || 0).toString(),
    },
    {
      ...stats[2],
      stat: (
        (pipelineStats[PipelineStage.CONTACTED] || 0) +
        (pipelineStats[PipelineStage.MEETING_SCHEDULED] || 0) +
        (pipelineStats[PipelineStage.PROPOSAL_SENT] || 0) +
        (pipelineStats[PipelineStage.NEGOTIATION] || 0)
      ).toString(),
    },
    {
      ...stats[3],
      stat: (pipelineStats[PipelineStage.CLOSED_WON] || 0).toString(),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Overview of your sales pipeline and recent activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {updatedStats.map((item) => (
          <div key={item.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <item.icon className={`h-8 w-8 ${item.color}`} aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                  <dd className="text-lg font-medium text-gray-900">{item.stat}</dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Pipeline Overview */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline Overview</h3>
          <div className="space-y-3">
            {Object.entries(pipelineStats).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {stage.replace('_', ' ')}
                </span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Leads</h3>
            <Link
              to="/leads"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentLeads.length === 0 ? (
              <div className="text-center py-6">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leads yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first lead.
                </p>
                <div className="mt-6">
                  <Link
                    to="/leads"
                    className="btn-primary"
                  >
                    Add Lead
                  </Link>
                </div>
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between">
                  <div>
                    <Link
                      to={`/leads/${lead.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary-600"
                    >
                      {lead.first_name} {lead.last_name}
                    </Link>
                    <p className="text-sm text-gray-500">{lead.company_name}</p>
                  </div>
                  <span className={`badge ${getStageColor(lead.pipeline_stage)}`}>
                    {lead.pipeline_stage.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/leads"
            className="btn-primary flex items-center justify-center"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Add New Lead
          </Link>
          <Link
            to="/evaluations"
            className="btn-secondary flex items-center justify-center"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Run Evaluation
          </Link>
          <button className="btn-outline flex items-center justify-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Schedule Follow-up
          </button>
          <Link
            to="/settings"
            className="btn-outline flex items-center justify-center"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

function getStageColor(stage: PipelineStage): string {
  switch (stage) {
    case PipelineStage.NEW:
      return 'badge-gray';
    case PipelineStage.QUALIFIED:
      return 'badge-blue';
    case PipelineStage.CONTACTED:
      return 'badge-yellow';
    case PipelineStage.MEETING_SCHEDULED:
      return 'badge-blue';
    case PipelineStage.PROPOSAL_SENT:
      return 'badge-yellow';
    case PipelineStage.NEGOTIATION:
      return 'badge-yellow';
    case PipelineStage.CLOSED_WON:
      return 'badge-green';
    case PipelineStage.CLOSED_LOST:
      return 'badge-red';
    default:
      return 'badge-gray';
  }
}
