'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import { apiClient } from '@/services/api';

interface FollowUp {
  id: string;
  customer: { name: string };
  follow_up_number: number;
  due_date: string;
  status: string;
  sent_via: string | null;
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      const response = await apiClient.getFollowUps({ limit: 100 });
      setFollowUps(response.data || []);
    } catch (error) {
      console.error('Failed to load follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMark = async (id: string, status: string) => {
    try {
      await apiClient.updateFollowUp(id, {
        status,
        sent_via: status === 'pending' ? null : 'email',
      });
      fetchFollowUps();
    } catch (error) {
      console.error('Failed to update follow-up:', error);
    }
  };

  const columns = [
    { key: 'customer', label: 'Customer', render: (val: any) => val.name },
    { key: 'follow_up_number', label: 'Stage' },
    { key: 'due_date', label: 'Due Date', render: (val: string) => new Date(val).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${val === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
        {val}
      </span>
    )},
    { key: 'id', label: 'Action', render: (id: string, row: any) => (
      row.status === 'pending' && (
        <Button size="sm" variant="primary" onClick={() => handleMark(id, 'sent')}>Mark Sent</Button>
      )
    )},
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Follow-ups</h2>

        <Card>
          <Table columns={columns} data={followUps} loading={loading} emptyMessage="No follow-ups found" />
        </Card>
      </div>
    </Layout>
  );
}
