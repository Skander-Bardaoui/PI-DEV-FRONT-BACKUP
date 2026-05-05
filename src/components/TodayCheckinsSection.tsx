import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { checkinsApi, BusinessCheckinsResponse } from '../api/checkins.api';
import { usePresenceContext } from '../context/PresenceContext';
import { PresenceIndicator } from './PresenceIndicator';

interface TodayCheckinsSectionProps {
  businessId: string;
}

const priorityColors = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
};

const priorityLabels = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export default function TodayCheckinsSection({ businessId }: TodayCheckinsSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [data, setData] = useState<BusinessCheckinsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time presence from global context
  const { userStatuses, isConnected } = usePresenceContext();

  useEffect(() => {
    loadCheckinsData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadCheckinsData(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [businessId]);

  const loadCheckinsData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await checkinsApi.getBusinessCheckinsToday(businessId);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load check-ins');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'skipped':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'Checked in';
      case 'skipped':
        return 'Skipped';
      case 'pending':
        return 'Not checked in yet';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'bg-green-50 border-green-200';
      case 'skipped':
        return 'bg-gray-50 border-gray-200';
      case 'pending':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading today's check-ins...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div
        className="w-full px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Today's Check-ins</h3>
          {/* WebSocket connection indicator */}
          {isConnected && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadCheckinsData();
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            <span className="text-green-600 font-semibold">{data.summary.checkedIn}</span> checked in •{' '}
            <span className="text-gray-500 font-semibold">{data.summary.skipped}</span> skipped •{' '}
            <span className="text-orange-500 font-semibold">{data.summary.pending}</span> pending
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {collapsed ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-6 pb-6 space-y-3">
          {data.members.map((member) => (
            <div
              key={member.userId}
              className={`p-4 rounded-lg border-2 ${getStatusColor(member.status)}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 relative">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-semibold">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                  )}
                  {/* Real-time presence indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <PresenceIndicator 
                      isOnline={userStatuses.get(member.userId) === 'online'} 
                      size="sm" 
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {member.firstName} {member.lastName}
                    </h4>
                    {/* Online/Offline status text */}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      userStatuses.get(member.userId) === 'online' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {userStatuses.get(member.userId) === 'online' ? 'Online' : 'Offline'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(member.status)}
                      <span className="text-sm text-gray-600">{getStatusText(member.status)}</span>
                    </div>
                  </div>

                  {/* Tasks */}
                  {member.status === 'checked_in' && member.tasks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1.5">Selected tasks:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {member.tasks.map((task) => (
                          <span
                            key={task.id}
                            className={`text-xs px-2 py-1 rounded border ${
                              priorityColors[task.priority as keyof typeof priorityColors]
                            }`}
                          >
                            {task.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  {member.note && (
                    <div className="mt-2 p-2 bg-white/50 rounded border border-gray-200">
                      <p className="text-xs text-gray-500 mb-0.5">Note:</p>
                      <p className="text-sm text-gray-700">{member.note}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {data.members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No team members found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
