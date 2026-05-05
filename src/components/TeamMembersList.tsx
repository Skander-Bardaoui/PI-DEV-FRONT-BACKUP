import React from 'react';
import { usePresence } from '../hooks/usePresence';
import { PresenceIndicator } from './PresenceIndicator';

interface TeamMember {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
}

interface TeamMembersListProps {
  businessId: string;
  members: TeamMember[];
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  businessId,
  members,
}) => {
  const { userStatuses, isConnected } = usePresence(businessId);

  return (
    <div className="space-y-2">
      {!isConnected && (
        <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          Connecting to real-time status...
        </div>
      )}
      
      {members.map((member) => {
        const isOnline = userStatuses.get(member.userId) === 'online';
        
        return (
          <div
            key={member.userId}
            className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {member.firstName[0]}{member.lastName[0]}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5">
                <PresenceIndicator isOnline={isOnline} size="sm" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {member.firstName} {member.lastName}
              </div>
              <div className="text-sm text-gray-500">{member.role}</div>
            </div>
            
            <div className="text-xs text-gray-400">
              {isOnline ? (
                <span className="text-green-600 font-medium">Active</span>
              ) : (
                <span>Offline</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
