'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import { ToastContainer, useToast } from '@/components/Toast';
import { apiClient } from '@/services/api';

interface StandingOrder {
  id: string;
  customer_id: string;
  status: string;
  notes?: string;
  customer: { id: string; name: string; restaurant_name?: string };
  items: Array<{
    id: string;
    variant_id: string;
    size_name: string;
    quantity: number;
    price_at_time_eur: number;
    delivery_day_of_week?: number;
    variant?: { crop: { name_en: string } };
  }>;
}

interface Customer {
  id: string;
  name: string;
  restaurant_name?: string;
}

interface Variant {
  id: string;
  crop_id: string;
  size_name: string;
  size_grams: number;
  price_eur: number;
  crop: { id: string; name_en: string };
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StandingOrdersPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [standingOrders, setStandingOrders] = useState<StandingOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'paused' | 'inactive'>('active');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    notes: '',
    status: 'active' as const,
  });
  const [items, setItems] = useState<Array<{
    variant_id: string;
    quantity: number;
    delivery_day_of_week?: number;
  }>>([]);
  const [newItem, setNewItem] = useState({
    variant_id: '',
    quantity: '',
    delivery_day_of_week: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes, variantsRes] = await Promise.all([
        apiClient.getStandingOrders(),
        apiClient.getCustomers(),
        apiClient.getVariants(),
      ]);
      setStandingOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setVariants(variantsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (newItem.variant_id && newItem.quantity) {
      setItems([
        ...items,
        {
          variant_id: newItem.variant_id,
          quantity: parseFloat(newItem.quantity),
          delivery_day_of_week: newItem.delivery_day_of_week
            ? parseInt(newItem.delivery_day_of_week)
            : undefined,
        },
      ]);
      setNewItem({ variant_id: '', quantity: '', delivery_day_of_week: '' });
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || items.length === 0) return;

    try {
      setSaving(true);
      const payload = {
        customer_id: formData.customer_id,
        notes: formData.notes || null,
        status: formData.status,
        items,
      };

      if (editingId) {
        await apiClient.updateStandingOrder(editingId, payload);
        addToast('Standing order updated', 'success', 3000);
      } else {
        await apiClient.createStandingOrder(payload);
        addToast('Standing order created', 'success', 3000);
      }

      setFormData({ customer_id: '', notes: '', status: 'active' });
      setItems([]);
      setEditingId(null);
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save standing order:', error);
      addToast('Failed to save standing order', 'error', 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this standing order?')) {
      try {
        await apiClient.deleteStandingOrder(id);
        addToast('Standing order deleted', 'success', 3000);
        fetchData();
      } catch (error) {
        console.error('Failed to delete standing order:', error);
        addToast('Failed to delete standing order', 'error', 5000);
      }
    }
  };

  const openEditModal = (so: StandingOrder) => {
    setEditingId(so.id);
    setFormData({
      customer_id: so.customer_id,
      notes: so.notes || '',
      status: (so.status as any) || 'active',
    });
    setItems(
      so.items.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
        delivery_day_of_week: i.delivery_day_of_week,
      }))
    );
    setShowModal(true);
  };

  const filteredSOs = standingOrders.filter((so) => so.status === activeTab);
  const statusCounts = {
    active: standingOrders.filter((so) => so.status === 'active').length,
    paused: standingOrders.filter((so) => so.status === 'paused').length,
    inactive: standingOrders.filter((so) => so.status === 'inactive').length,
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Standing Orders</h1>
          <Button
            onClick={() => {
              setFormData({ customer_id: '', notes: '', status: 'active' });
              setItems([]);
              setEditingId(null);
              setShowModal(true);
            }}
            variant="primary"
            size="lg"
          >
            + New Standing Order
          </Button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {(['active', 'paused', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:ring-2 focus:ring-green-500 focus:outline-none ${
                activeTab === status
                  ? 'text-green-600 border-b-green-600'
                  : 'text-gray-600 border-b-transparent hover:text-gray-900'
              }`}
            >
              {status} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* Standing Orders */}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : filteredSOs.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            No standing orders found
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
            {filteredSOs.map((so) => {
              const weeklyValue = so.items.reduce((sum, i) => sum + i.quantity * i.price_at_time_eur, 0);
              return (
                <Card key={so.id} className="overflow-hidden">
                  {/* Restaurant */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {so.customer.restaurant_name || so.customer.name}
                  </h3>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <StatusBadge
                      status={
                        so.status === 'active' ? 'ok' : so.status === 'paused' ? 'warning' : 'error'
                      }
                      label={so.status.charAt(0).toUpperCase() + so.status.slice(1)}
                    />
                  </div>

                  {/* Items */}
                  <div className="mb-4 py-3 border-t border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-900 mb-2 uppercase">Items</p>
                    {so.items.map((item, i) => (
                      <div key={i} className="text-xs text-gray-900 mb-1">
                        • {item.size_name} × {item.quantity} • €{item.price_at_time_eur.toFixed(2)}
                        {item.delivery_day_of_week !== undefined && (
                          <span className="text-gray-600">
                            {' '}
                            ({DAYS[item.delivery_day_of_week]})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Weekly Value */}
                  <p className="text-sm font-semibold text-green-600 mb-2">
                    Weekly: €{weeklyValue.toFixed(2)}
                  </p>

                  {/* Notes */}
                  {so.notes && (
                    <p className="text-xs text-gray-600 mb-3 italic">
                      {so.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <Button
                      onClick={() => openEditModal(so)}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      ✎ Edit
                    </Button>
                    <Button
                      onClick={() =>
                        apiClient.updateStandingOrder(so.id, {
                          status: so.status === 'active' ? 'paused' : 'active',
                        }).then(() => fetchData())
                      }
                      variant={so.status === 'active' ? 'secondary' : 'success'}
                      size="sm"
                      className="flex-1"
                    >
                      {so.status === 'active' ? '⏸ Pause' : '▶ Resume'}
                    </Button>
                    <Button
                      onClick={() => handleDelete(so.id)}
                      variant="danger"
                      size="sm"
                      className="flex-1"
                    >
                      🗑 Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          title={editingId ? 'Edit Standing Order' : 'Create Standing Order'}
          onClose={() => setShowModal(false)}
          onSubmit={() => {
            const form = document.querySelector('form[data-standing-order]') as HTMLFormElement;
            form?.dispatchEvent(new Event('submit', { bubbles: true }));
          }}
          submitText={editingId ? 'Update' : 'Create'}
          isLoading={saving}
        >
          <form className="flex flex-col gap-4" data-standing-order onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">
                Restaurant *
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select restaurant</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.restaurant_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border-2 border-gray-300 rounded text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded text-sm text-gray-900 bg-white min-h-20 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Items Builder */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-900">
                Items *
              </h4>

              {items.map((item, i) => {
                const variant = variants.find((v) => v.id === item.variant_id);
                return (
                  <div
                    key={i}
                    className="mb-2 p-2.5 bg-gray-50 rounded flex justify-between items-center text-xs"
                  >
                    <div>
                      {variant?.crop.name_en} {variant?.size_name} × {item.quantity}
                      {item.delivery_day_of_week !== undefined && (
                        <div className="text-gray-600 text-xs">
                          {DAYS[item.delivery_day_of_week]}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleRemoveItem(i)}
                      type="button"
                      variant="danger"
                      size="sm"
                    >
                      ✕
                    </Button>
                  </div>
                );
              })}

              {/* Add Item */}
              <div className="flex flex-col gap-2">
                <select
                  value={newItem.variant_id}
                  onChange={(e) => setNewItem({ ...newItem, variant_id: e.target.value })}
                  className="w-full px-2.5 py-2 border-2 border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select variant</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.crop.name_en} — {v.size_name} — €{v.price_eur.toFixed(2)}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Quantity"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                />
                <select
                  value={newItem.delivery_day_of_week}
                  onChange={(e) => setNewItem({ ...newItem, delivery_day_of_week: e.target.value })}
                  className="w-full px-2.5 py-2 border-2 border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Delivery day (optional)</option>
                  {DAYS.map((day, i) => (
                    <option key={i} value={i.toString()}>
                      {day}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleAddItem}
                  type="button"
                  variant="success"
                  size="md"
                  className="w-full"
                >
                  + Add Item
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  );
}
