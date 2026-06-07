'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import { useToast, ToastContainer } from '@/components/Toast';
import { apiClient } from '@/services/api';

interface Customer {
  id: string;
  name: string;
  restaurant_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  status: string;
  net_days: number;
  first_contact_date: string;
}

const STATUS_MAP = {
  prospect: 'low',
  active: 'ok',
  paused: 'warning',
  inactive: 'out',
} as const;

export default function CustomersPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'prospect' | 'active' | 'paused' | 'inactive'>(
    'prospect'
  );
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    restaurant_name: '',
    contact_person: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    net_days: '30',
    status: 'prospect' as const,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.getCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name || formData.restaurant_name,
        restaurant_name: formData.restaurant_name || null,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        address: formData.address || null,
        city: formData.city || null,
        net_days: parseInt(formData.net_days),
        status: formData.status,
      };

      if (editingCustomer) {
        await apiClient.updateCustomer(editingCustomer.id, payload);
        addToast('Customer updated successfully', 'success');
      } else {
        await apiClient.createCustomer(payload);
        addToast('Customer created successfully', 'success');
      }

      resetForm();
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      addToast('Failed to save customer', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      restaurant_name: '',
      contact_person: '',
      email: '',
      phone: '',
      whatsapp: '',
      address: '',
      city: '',
      net_days: '30',
      status: 'prospect',
    });
    setEditingCustomer(null);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      restaurant_name: customer.restaurant_name || '',
      contact_person: customer.contact_person || '',
      email: customer.email || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      address: customer.address || '',
      city: customer.city || '',
      net_days: customer.net_days.toString(),
      status: (customer.status as any) || 'prospect',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this customer?')) {
      try {
        await apiClient.deleteCustomer(id);
        addToast('Customer deleted successfully', 'success');
        fetchCustomers();
      } catch (error) {
        console.error('Failed to delete customer:', error);
        addToast('Failed to delete customer', 'error');
      }
    }
  };

  const handleStatusChange = async (customerId: string, newStatus: string) => {
    try {
      await apiClient.updateCustomer(customerId, { status: newStatus });
      addToast('Customer status updated', 'success');
      fetchCustomers();
    } catch (error) {
      console.error('Failed to update customer status:', error);
      addToast('Failed to update customer status', 'error');
    }
  };

  const filteredCustomers = customers.filter((c) => c.status === activeTab);
  const statusCounts = {
    prospect: customers.filter((c) => c.status === 'prospect').length,
    active: customers.filter((c) => c.status === 'active').length,
    paused: customers.filter((c) => c.status === 'paused').length,
    inactive: customers.filter((c) => c.status === 'inactive').length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="focus:ring-2 focus:ring-green-500"
          >
            + New Customer
          </Button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {(['prospect', 'active', 'paused', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-0 capitalize ${
                activeTab === status
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {status} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* Customers Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No customers found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="flex flex-col">
                {/* Restaurant Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {customer.restaurant_name || customer.name}
                </h3>

                {/* Contact Person */}
                {customer.contact_person && (
                  <p className="text-sm text-gray-600 mb-3">👤 {customer.contact_person}</p>
                )}

                {/* Status Badge */}
                <div className="mb-4">
                  <StatusBadge
                    status={STATUS_MAP[customer.status as keyof typeof STATUS_MAP] || 'ok'}
                    label={customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  />
                </div>

                {/* Contact Info */}
                <div className="space-y-2 py-3 border-y border-gray-200 mb-4 text-sm">
                  {customer.email && (
                    <p>
                      📧{' '}
                      <a href={`mailto:${customer.email}`} className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                        {customer.email}
                      </a>
                    </p>
                  )}
                  {customer.phone && (
                    <p>
                      ☎️{' '}
                      <a href={`tel:${customer.phone}`} className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                        {customer.phone}
                      </a>
                    </p>
                  )}
                  {customer.whatsapp && (
                    <p>
                      💬{' '}
                      <a href={`https://wa.me/${customer.whatsapp}`} className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                        WhatsApp
                      </a>
                    </p>
                  )}
                  {customer.city && <p className="text-gray-600">📍 {customer.city}</p>}
                </div>

                {/* Net Days */}
                <p className="text-sm text-gray-600 mb-2">
                  Payment terms: <strong>{customer.net_days} days</strong>
                </p>

                {/* Last Contact */}
                {customer.first_contact_date && (
                  <p className="text-xs text-gray-500 mb-4">
                    First contact: {new Date(customer.first_contact_date).toLocaleDateString()}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(customer)}
                    className="flex-1 focus:ring-2 focus:ring-gray-500"
                  >
                    ✎ Edit
                  </Button>
                  <Button
                    variant={customer.status === 'active' ? 'danger' : 'success'}
                    size="sm"
                    onClick={() =>
                      handleStatusChange(
                        customer.id,
                        customer.status === 'active' ? 'paused' : 'active'
                      )
                    }
                    className="flex-1 focus:ring-2 focus:ring-amber-500"
                  >
                    {customer.status === 'active' ? '⏸ Pause' : '▶ Resume'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                    className="flex-1 focus:ring-2 focus:ring-red-500"
                  >
                    🗑 Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          title={editingCustomer ? 'Edit Customer' : 'Create New Customer'}
          onClose={() => setShowModal(false)}
          onSubmit={() => {
            const form = document.querySelector('form') as HTMLFormElement;
            if (form) {
              const event = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
              handleSubmit(event);
            }
          }}
          submitText={editingCustomer ? 'Update' : 'Create'}
          submitVariant="primary"
        >
          <form className="space-y-4">
            <Input
              label="Customer Name *"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Restaurant Name"
              type="text"
              value={formData.restaurant_name}
              onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
            />

            <Input
              label="Contact Person (Chef/Manager)"
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="WhatsApp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            />

            <Input
              label="Address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <Input
              label="City"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />

            <Input
              label="Payment Terms (Net Days)"
              type="number"
              value={formData.net_days}
              onChange={(e) => setFormData({ ...formData, net_days: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
