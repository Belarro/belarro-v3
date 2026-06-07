'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { useToast, ToastContainer } from '@/components/Toast';
import apiClient from '@/services/api';

interface FollowUp {
  id: string;
  customer_id: string;
  follow_up_number: number;
  due_date: string;
  status: string;
  sent_via: string | null;
  sent_date: string | null;
}

interface Customer {
  id: string;
  name: string;
  followUps: FollowUp[];
}

export default function FollowUpsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFollowUps({ limit: 100 });
      const followUps = response.data || [];

      // Group by customer
      const grouped: Record<string, Customer> = {};
      followUps.forEach((fu: FollowUp) => {
        if (!grouped[fu.customer_id]) {
          grouped[fu.customer_id] = {
            id: fu.customer_id,
            name: '',
            followUps: [],
          };
        }
        grouped[fu.customer_id].followUps.push(fu);
      });

      // Fetch customer names
      const customerIds = Object.keys(grouped);
      for (const customerId of customerIds) {
        try {
          const custResponse = await apiClient.getCustomer(customerId);
          if (grouped[customerId]) {
            grouped[customerId].name = custResponse.data?.name || 'Unknown';
          }
        } catch (error) {
          grouped[customerId].name = 'Unknown';
        }
      }

      setCustomers(Object.values(grouped));
    } catch (error) {
      console.error('Failed to load follow-ups:', error);
      addToast('Failed to load follow-ups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStageStatus = (followUp: FollowUp): 'ok' | 'low' | 'out' => {
    if (followUp.status === 'sent') return 'ok';
    const now = new Date();
    const dueDate = new Date(followUp.due_date);
    if (now > dueDate) return 'out';
    return 'low';
  };

  const getStageLabel = (status: 'ok' | 'low' | 'out'): string => {
    switch (status) {
      case 'ok':
        return 'Sent';
      case 'low':
        return 'Pending';
      case 'out':
        return 'Overdue';
    }
  };

  const handleSendFollowUp = async (followUp: FollowUp) => {
    try {
      setSending(followUp.id);

      const now = new Date();
      await apiClient.updateFollowUp(followUp.id, {
        status: 'sent',
        sent_via: 'email',
        sent_date: now.toISOString(),
      });

      if (followUp.follow_up_number < 5) {
        const nextNumber = followUp.follow_up_number + 1;
        const nextFollowUp = (customers
          .find(c => c.id === followUp.customer_id)
          ?.followUps || [])
          .find(fu => fu.follow_up_number === nextNumber);

        if (nextFollowUp) {
          const nextDueDate = new Date(now);
          nextDueDate.setDate(nextDueDate.getDate() + 2);

          await apiClient.updateFollowUp(nextFollowUp.id, {
            due_date: nextDueDate.toISOString(),
            status: 'pending',
          });
        }
      }

      addToast('Follow-up sent successfully', 'success');
      await loadFollowUps();
    } catch (error) {
      console.error('Failed to send follow-up:', error);
      addToast('Failed to send follow-up', 'error');
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center p-8">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Follow-ups</h1>

        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="space-y-3">
          {customers.length === 0 ? (
            <Card variant="default">
              <div className="text-center text-gray-500 py-8">No follow-ups scheduled</div>
            </Card>
          ) : (
            customers.map((customer) => (
              <Card key={customer.id} className="flex items-center gap-6">
                {/* Left: Restaurant name */}
                <div className="w-40 flex-shrink-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{customer.name}</p>
                </div>

                {/* Center: 5 stage badges */}
                <div className="flex gap-2 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((stageNum) => {
                    const followUp = customer.followUps.find(fu => fu.follow_up_number === stageNum);
                    const stageStatus = followUp ? getStageStatus(followUp) : 'low';
                    const stageLabel = getStageLabel(stageStatus);

                    return (
                      <div key={stageNum} title={`Stage ${stageNum}: ${stageLabel}`}>
                        <StatusBadge status={stageStatus} label={String(stageNum)} />
                      </div>
                    );
                  })}
                </div>

                {/* Right: Send buttons */}
                <div className="flex gap-2">
                  {customer.followUps.map((followUp) => (
                    <Button
                      key={followUp.id}
                      onClick={() => handleSendFollowUp(followUp)}
                      disabled={sending === followUp.id || followUp.status === 'sent'}
                      variant={followUp.status === 'sent' ? 'secondary' : 'primary'}
                      size="sm"
                      className="w-8 h-8 p-0 flex items-center justify-center text-xs"
                      aria-label={followUp.status === 'sent' ? 'Already sent' : `Send stage ${followUp.follow_up_number}`}
                    >
                      {sending === followUp.id ? '⋯' : followUp.follow_up_number}
                    </Button>
                  ))}
                </div>

                {/* Far Right: Next due date */}
                <div className="text-xs text-gray-600 flex-shrink-0 min-w-fit ml-auto">
                  Due:{' '}
                  <span className="font-medium">
                    {(() => {
                      const nextPending = customer.followUps.find(fu => fu.status === 'pending');
                      return nextPending
                        ? new Date(nextPending.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '✓';
                    })()}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
