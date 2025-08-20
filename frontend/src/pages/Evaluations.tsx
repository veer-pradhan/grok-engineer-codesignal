import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { BeakerIcon, PlayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { apiClient } from '../api/client';
import type { Evaluation, EvaluationSummary } from '../types';

export default function Evaluations() {
  const [activeTab, setActiveTab] = useState('summary');
  const queryClient = useQueryClient();

  const { data: summary } = useQuery<EvaluationSummary>(
    'evaluation-summary',
    async () => {
      const { data } = await apiClient.get('/evaluations/summary');
      return data;
    }
  );

  const { data: evaluations = [], isLoading } = useQuery<Evaluation[]>(
    'evaluations',
    async () => {
      const { data } = await apiClient.get('/evaluations');
      return data;
    }
  );

  const runDefaultsMutation = useMutation(
    async () => {
      const { data } = await apiClient.post('/evaluations/run-defaults');
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('evaluations');
        queryClient.invalidateQueries('evaluation-summary');
        toast.success('Default evaluations completed successfully');
      },
      onError: () => {
        toast.error('Failed to run evaluations');
      },
    }
  );

  const tabs = [
    { id: 'summary', name: 'Summary' },
    { id: 'results', name: 'Results', count: evaluations.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grok Evaluations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Test and evaluate Grok's performance across different sales scenarios.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => runDefaultsMutation.mutate()}
            disabled={runDefaultsMutation.isLoading}
            className="btn-primary flex items-center"
          >
            <PlayIcon className="h-5 w-5 mr-2" />
            {runDefaultsMutation.isLoading ? 'Running...' : 'Run Default Tests'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BeakerIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Total Tests</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.total_tests}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Passed</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.passed_tests}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Failed</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.failed_tests}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-sm">%</span>
                </div>
              </div>
              <div className="ml-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Success Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.total_tests > 0
                      ? Math.round((summary.passed_tests / summary.total_tests) * 100)
                      : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

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
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
              {summary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Test Results</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pass Rate</span>
                        <span className="text-sm font-medium text-green-600">
                          {summary.total_tests > 0
                            ? Math.round((summary.passed_tests / summary.total_tests) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Score</span>
                        <span className="text-sm font-medium text-gray-900">
                          {summary.average_score
                            ? (summary.average_score * 100).toFixed(1) + '%'
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg. Response Time</span>
                        <span className="text-sm font-medium text-gray-900">
                          {summary.average_execution_time_ms
                            ? Math.round(summary.average_execution_time_ms) + 'ms'
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Recommendations</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {summary.passed_tests / summary.total_tests >= 0.8 ? (
                        <p className="text-green-600">✓ Grok is performing well across test scenarios</p>
                      ) : (
                        <p className="text-yellow-600">⚠ Consider reviewing failed test cases</p>
                      )}
                      {summary.average_execution_time_ms && summary.average_execution_time_ms > 5000 ? (
                        <p className="text-yellow-600">⚠ Response times could be improved</p>
                      ) : (
                        <p className="text-green-600">✓ Response times are within acceptable range</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No evaluation data available. Run some tests to see performance metrics.</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => runDefaultsMutation.mutate()}
                  disabled={runDefaultsMutation.isLoading}
                  className="btn-primary flex items-center justify-center"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Run Default Tests
                </button>
                <button className="btn-secondary flex items-center justify-center" disabled>
                  <BeakerIcon className="h-5 w-5 mr-2" />
                  Custom Test Suite
                </button>
                <button className="btn-outline flex items-center justify-center" disabled>
                  Export Results
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : evaluations.length === 0 ? (
              <div className="text-center py-12">
                <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluations yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Run some tests to see evaluation results.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => runDefaultsMutation.mutate()}
                    disabled={runDefaultsMutation.isLoading}
                    className="btn-primary"
                  >
                    Run Default Tests
                  </button>
                </div>
              </div>
            ) : (
              evaluations.map((evaluation) => (
                <div key={evaluation.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {evaluation.test_name}
                        </h4>
                        <span
                          className={`badge ${
                            evaluation.passed ? 'badge-green' : 'badge-red'
                          }`}
                        >
                          {evaluation.passed ? 'Passed' : 'Failed'}
                        </span>
                        {evaluation.score !== null && (
                          <span className="text-sm text-gray-500">
                            Score: {(evaluation.score * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        {format(new Date(evaluation.created_at), 'MMM d, yyyy - h:mm a')}
                        {evaluation.execution_time_ms && (
                          <span className="ml-2">
                            • {evaluation.execution_time_ms}ms
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Test Input</h5>
                      <div className="bg-gray-50 rounded p-2 text-xs text-gray-600">
                        {evaluation.test_input.length > 200
                          ? evaluation.test_input.substring(0, 200) + '...'
                          : evaluation.test_input}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Grok Response</h5>
                      <div className="bg-blue-50 rounded p-2 text-xs text-gray-700">
                        {evaluation.actual_output.length > 300
                          ? evaluation.actual_output.substring(0, 300) + '...'
                          : evaluation.actual_output}
                      </div>
                    </div>

                    {evaluation.expected_output && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Expected Output</h5>
                        <div className="bg-green-50 rounded p-2 text-xs text-gray-600">
                          {evaluation.expected_output}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
