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

interface Order {
  id: string;
  customer_id: string;
  product_variant_id: string;
  quantity: number;
  order_date: string;
  seeding_date: string;
  expected_harvest_date: string;
  next_delivery_date: string;
  status: string;
  recurring: boolean;
  customer: { id: string; name: string; email: string };
  variant: {
    id: string;
    size_name: string;
    size_grams: number;
    price_eur: number;
    crop: { id: string; name_en: string; name_de: string };
  };
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
  crop: { id: string; name_en: string; name_de: string };
}

// Map order status to StatusBadge status type
const statusMapping: Record<string, 'ok' | 'low' | 'out' | 'success' | 'warning' | 'error'> = {
  pending_seed: 'warning',
  growing: 'ok',
  ready_harvest: 'ok',
  packed: 'ok',
  delivered: 'success',
  partial_delivery: 'warning',
  cancelled: 'error',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending_seed' | 'growing' | 'ready_harvest' | 'delivered'>(
    'all'
  );
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    product_variant_id: '',
    quantity: '',
    recurring: true,
  });
  const [filteredVariants, setFilteredVariants] = useState<Variant[]>([]);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes, variantsRes] = await Promise.all([
        apiClient.getOrders(),
        apiClient.getCustomers(),
        apiClient.getVariants(),
      ]);
      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setVariants(variantsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setFormData({ ...formData, customer_id: customerId, product_variant_id: '' });
    setFilteredVariants(variants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.product_variant_id || !formData.quantity) {
      addToast('Please fill in all required fields', 'warning', 3000);
      return;
    }

    try {
      await apiClient.createOrder({
        customer_id: formData.customer_id,
        product_variant_id: formData.product_variant_id,
        quantity: parseFloat(formData.quantity),
        recurring: formData.recurring,
      });
      setFormData({ customer_id: '', product_variant_id: '', quantity: '', recurring: true });
      setShowModal(false);
      addToast('Order created successfully', 'success', 3000);
      fetchData();
    } catch (error) {
      console.error('Failed to create order:', error);
      addToast('Failed to create order', 'error', 3000);
    }
  };

  const handleDelete = async (id: string) => {
    addToast('Order deleted successfully', 'success', 3000);
    try {
      await apiClient.deleteOrder(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete order:', error);
      addToast('Failed to delete order', 'error', 3000);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.updateOrder(id, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const statusCounts = {
    all: orders.length,
    pending_seed: orders.filter(o => o.status === 'pending_seed').length,
    growing: orders.filter(o => o.status === 'growing').length,
    ready_harvest: orders.filter(o => o.status === 'ready_harvest').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  // Weekly summary
  const weekAgoDate = new Date();
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const thisWeekOrders = orders.filter(o => new Date(o.order_date) >= weekAgoDate);
  const weeklySummary: Record<string, number> = {};
  thisWeekOrders.forEach(o => {
    const key = `${o.variant.crop.name_en} ${o.variant.size_name}`;
    weeklySummary[key] = (weeklySummary[key] || 0) + o.quantity;
  });

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Orders</h1>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + New Order
          </Button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
          {(['all', 'pending_seed', 'growing', 'ready_harvest', 'delivered'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded ${
                activeTab === status
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.replace(/_/g, ' ').toUpperCase()} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* Weekly Summary */}
        {Object.keys(weeklySummary).length > 0 && (
          <Card variant="success" title="📊 THIS WEEK'S ORDERS">
            <div className="flex flex-wrap gap-3">
              {Object.entries(weeklySummary).map(([key, qty]) => (
                <div
                  key={key}
                  className="bg-white border border-green-200 px-3 py-2 rounded-md text-sm font-medium text-gray-700"
                >
                  {key} × {qty}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No orders found</div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Restaurant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Crop & Size</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Order Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Expected Harvest</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">{order.customer.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{order.variant.crop.name_en}</div>
                        <div className="text-xs text-gray-600">
                          {order.variant.size_name} ({order.variant.size_grams}g)
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{order.quantity}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(order.order_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(order.expected_harvest_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={order.recurring ? 'ok' : 'warning'}
                          label={order.recurring ? '🔄 Weekly' : '⏱ One-time'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={statusMapping[order.status] || 'error'}
                          label={order.status.replace(/_/g, ' ').toUpperCase()}
                        />
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="px-2 py-1 text-xs font-medium border border-green-300 rounded-md bg-green-50 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                        >
                          <option value="pending_seed">Pending Seed</option>
                          <option value="growing">Growing</option>
                          <option value="ready_harvest">Ready Harvest</option>
                          <option value="packed">Packed</option>
                          <option value="delivered">Delivered</option>
                          <option value="partial_delivery">Partial</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                        >
                          🗑 Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Create Order Modal */}
        <Modal
          isOpen={showModal}
          title="Create New Order"
          onClose={() => setShowModal(false)}
          onSubmit={() => {
            const e = { preventDefault: () => {} } as React.FormEvent;
            handleSubmit(e);
          }}
          submitText="Create Order"
          submitVariant="primary"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="restaurant" className="block text-sm font-bold text-gray-900 mb-2">
                Restaurant *
              </label>
              <select
                id="restaurant"
                value={formData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select a restaurant</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.restaurant_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="variant" className="block text-sm font-bold text-gray-900 mb-2">
                Crop & Size *
              </label>
              <select
                id="variant"
                value={formData.product_variant_id}
                onChange={(e) =>
                  setFormData({ ...formData, product_variant_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select variant</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.crop.name_en} — {v.size_name} ({v.size_grams}g) €{v.price_eur.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Quantity *"
              id="quantity"
              type="number"
              step="0.1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              required
            />

            <label className="flex items-start gap-2 text-sm text-gray-900 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={!formData.recurring}
                onChange={(e) =>
                  setFormData({ ...formData, recurring: !e.target.checked })
                }
                className="mt-1 w-4 h-4 focus:ring-2 focus:ring-green-500 rounded"
              />
              <span>
                <span className="font-semibold block">This is a one-time order</span>
                <span className="text-xs text-gray-600">(uncheck for weekly recurring)</span>
              </span>
            </label>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
