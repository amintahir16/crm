'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';
import ActivityTimeline from '@/components/leads/ActivityTimeline';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

export default function TeamMemberActivityPage() {
  const { user, isAuthenticated, isLoading, isSalesManager } = useAuth();
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id as string;
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!isLoading && !isSalesManager()) {
      router.push('/dashboard');
      return;
    }

    if (memberId) {
      fetchTeamMember();
    }
  }, [isAuthenticated, isLoading, memberId, router, isSalesManager]);

  const fetchTeamMember = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/users/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMember(data);
      }
    } catch (error) {
      console.error('Error fetching team member:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isSalesManager()) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {teamMember ? `${teamMember.fullName}'s Activity Timeline` : 'Team Member Activity'}
          </h1>
          <p className="text-gray-600">Complete activity history for this sales person</p>
        </div>
      </div>

      {memberId && (
        <ActivityTimeline 
          userId={memberId} 
          title={teamMember ? `${teamMember.fullName}'s Activity Timeline` : 'Activity Timeline'} 
        />
      )}
    </div>
  );
}

