'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import { apiClient } from '@/services/api';

interface Order {
  id: string;
  customer: { name: string };
  product_variant: { size_name: string };
  quantity: number;
  status: string;
  order_date: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    product_variant_id: '',
    quantity: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchVariants();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.getOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.getCustomers({ limit: 100 });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await apiClient.getVariants({ limit: 100 });
      setVariants(response.data || []);
    } catch (error) {
      console.error('Failed to load variants:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createOrder({
        customer_id: formData.customer_id,
        product_variant_id: formData.product_variant_id,
        quantity: parseFloat(formData.quantity),
      });
      setFormData({
        customer_id: '',
        product_variant_id: '',
        quantity: '',
      });
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const columns = [
    { key: 'customer', label: 'Customer', render: (val: any) => val.name },
    { key: 'product_variant', label: 'Product', render: (val: any) => val.size_name },
    { key: 'quantity', label: 'Quantity' },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${val === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
        {val}
      </span>
    )},
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
          <Button onClick={() => setShowModal(true)}>+ New Order</Button>
        </div>

        <Card>
          <Table columns={columns} data={orders} loading={loading} emptyMessage="No orders found" />
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Create New Order</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.product_variant_id}
                  onChange={(e) => setFormData({ ...formData, product_variant_id: e.target.value })}
                  required
                >
                  <option value="">Select Product</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>{v.size_name} - €{v.price_eur}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantity"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
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
