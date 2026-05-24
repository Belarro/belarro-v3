'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import { apiClient } from '@/services/api';

interface Invoice {
  id: string;
  customer_id: string;
  invoice_month: string;
  total_amount_eur: number;
  vat_amount_eur: number;
  status: string;
  sent_at?: string;
  paid_at?: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_month: '',
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await apiClient.getInvoices?.() || { data: [], pagination: { total: 0 } };
      setInvoices((response as any).data || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await (apiClient.generateInvoice?.(formData) || Promise.resolve());
      setFormData({ customer_id: '', invoice_month: '' });
      setShowModal(false);
      fetchInvoices();
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to generate invoice'));
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      await (apiClient.updateInvoice?.(invoiceId, { status: newStatus }) || Promise.resolve());
      fetchInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
    }
  };

  const columns = [
    { key: 'invoice_month', label: 'Month' },
    {
      key: 'customer',
      label: 'Customer',
      render: (val: any) => val?.name || 'N/A'
    },
    {
      key: 'total_amount_eur',
      label: 'Subtotal',
      render: (val: number) => `€${val.toFixed(2)}`
    },
    {
      key: 'vat_amount_eur',
      label: 'VAT (19%)',
      render: (val: number) => `€${val.toFixed(2)}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          val === 'paid' ? 'bg-green-100 text-green-800' :
          val === 'sent' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
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
          <h2 className="text-3xl font-bold text-gray-900">Invoices</h2>
          <Button onClick={() => setShowModal(true)}>+ Generate Invoice</Button>
        </div>

        <Card>
          <Table columns={columns} data={invoices} loading={loading} emptyMessage="No invoices found" />
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Generate Invoice</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Customer ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Invoice Month (YYYY-MM)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                  value={formData.invoice_month}
                  onChange={(e) => setFormData({ ...formData, invoice_month: e.target.value })}
                  required
                />
                <div className="flex gap-2">
                  <Button variant="primary" type="submit">Generate</Button>
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
