'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import { apiClient } from '@/services/api';

interface StandingOrderItem {
  id: string;
  size_name: string;
  quantity: number;
  price_at_time_eur: number;
  variant?: any;
}

interface StandingOrder {
  id: string;
  customer_id: string;
  status: string;
  notes?: string;
  items?: StandingOrderItem[];
  customer?: {
    id: string;
    name: string;
  };
}

export default function StandingOrdersPage() {
  const [orders, setOrders] = useState<StandingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    notes: '',
    newStatus: 'active',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.getStandingOrders?.() || { data: [], pagination: { total: 0 } };
      setOrders((response as any).data || []);
    } catch (error) {
      console.error('Failed to load standing orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await (apiClient.createStandingOrder?.(formData) || Promise.resolve());
      setFormData({ customer_id: '', notes: '', newStatus: 'active' });
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Failed to create standing order:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to create standing order'));
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await (apiClient.updateStandingOrder?.(orderId, { status: newStatus }) || Promise.resolve());
      fetchOrders();
    } catch (error) {
      console.error('Failed to update standing order:', error);
    }
  };

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (val: any) => val?.name || 'N/A'
    },
    {
      key: 'id',
      label: 'Items',
      render: (val: string, row: any) => {
        const itemsCount = row.items?.length || 0;
        return `${itemsCount} item(s)`;
      }
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (val: string) => val || '—'
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          val === 'active' ? 'bg-green-100 text-green-800' :
          val === 'paused' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </span>
      )
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Standing Orders</h2>
          <Button onClick={() => setShowModal(true)}>+ New Standing Order</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-gray-600 text-sm mb-2">Active Orders</div>
            <div className="text-3xl font-bold text-green-600">
              {orders.filter(o => o.status === 'active').length}
            </div>
          </Card>
          <Card>
            <div className="text-gray-600 text-sm mb-2">Paused Orders</div>
            <div className="text-3xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'paused').length}
            </div>
          </Card>
          <Card>
            <div className="text-gray-600 text-sm mb-2">Total Orders</div>
            <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
          </Card>
        </div>

        <Card>
          <Table columns={columns} data={orders} loading={loading} emptyMessage="No standing orders found" />
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Create Standing Order</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Customer ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Notes (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                  value={formData.newStatus}
                  onChange={(e) => setFormData({ ...formData, newStatus: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="text-sm text-gray-600">Note: Add items via API or database for now</p>
                <div className="flex gap-2">
                  <Button variant="primary" type="submit">Create</Button>
                  <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
