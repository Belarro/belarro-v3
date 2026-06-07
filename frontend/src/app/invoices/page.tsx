'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import StatusBadge from '@/components/StatusBadge';
import { ToastContainer, useToast } from '@/components/Toast';
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
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_month: '',
  });
  const { toasts, addToast, removeToast } = useToast();

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

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.invoice_month) {
      addToast('Please fill in all required fields', 'warning');
      return;
    }

    setModalLoading(true);
    try {
      await (apiClient.generateInvoice?.(formData) || Promise.resolve());
      setFormData({ customer_id: '', invoice_month: '' });
      setShowModal(false);
      addToast('Invoice generated successfully', 'success');
      fetchInvoices();
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      addToast(
        error instanceof Error ? error.message : 'Failed to generate invoice',
        'error'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      await (apiClient.updateInvoice?.(invoiceId, { status: newStatus }) || Promise.resolve());
      addToast('Invoice status updated', 'success');
      fetchInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
      addToast('Failed to update invoice status', 'error');
    }
  };

  const mapStatusToBadge = (status: string): 'ok' | 'low' | 'out' | 'success' | 'warning' | 'error' => {
    if (status === 'paid') return 'success';
    if (status === 'sent') return 'ok';
    return 'warning';
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
        <StatusBadge status={mapStatusToBadge(val)} label={val.charAt(0).toUpperCase() + val.slice(1)} />
      )
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Invoices</h2>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            className="focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            + Generate Invoice
          </Button>
        </div>

        <Card>
          <Table columns={columns} data={invoices} loading={loading} emptyMessage="No invoices found" />
        </Card>

        <Modal
          isOpen={showModal}
          title="Generate Invoice"
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          submitText="Generate"
          submitVariant="primary"
          isLoading={modalLoading}
        >
          <div className="space-y-4">
            <Input
              id="customer-id"
              label="Customer ID"
              placeholder="Enter customer ID"
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              required
            />
            <Input
              id="invoice-month"
              label="Invoice Month"
              placeholder="YYYY-MM"
              value={formData.invoice_month}
              onChange={(e) => setFormData({ ...formData, invoice_month: e.target.value })}
              helperText="Format: YYYY-MM (e.g., 2024-05)"
              required
            />
          </div>
        </Modal>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  );
}
