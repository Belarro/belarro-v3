'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { ToastContainer, useToast } from '@/components/Toast';
import { apiClient } from '@/services/api';

interface SeedingBatch {
  id: string;
  crop: { name_en: string };
  batch_type: string;
  quantity_trays: number;
  seeding_date: string;
  expected_harvest_date: string;
}

export default function SeedingPage() {
  const [batches, setBatches] = useState<SeedingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    crop_id: '',
    quantity_trays: '',
    batch_type: 'order',
  });
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchBatches();
    fetchCrops();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await apiClient.getSeedingBatches({ limit: 100 });
      setBatches(response.data || []);
    } catch (error) {
      console.error('Failed to load batches:', error);
      addToast('Failed to load seeding batches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCrops = async () => {
    try {
      const response = await apiClient.getCrops({ limit: 100 });
      setCrops(response.data || []);
    } catch (error) {
      console.error('Failed to load crops:', error);
      addToast('Failed to load crops', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createSeedingBatch({
        crop_id: formData.crop_id,
        quantity_trays: parseInt(formData.quantity_trays),
        batch_type: formData.batch_type,
      });
      setFormData({
        crop_id: '',
        quantity_trays: '',
        batch_type: 'order',
      });
      setShowModal(false);
      addToast('Seeding batch created successfully', 'success');
      fetchBatches();
    } catch (error) {
      console.error('Failed to create batch:', error);
      addToast('Failed to create seeding batch', 'error');
    }
  };

  const columns = [
    { key: 'crop', label: 'Crop', render: (val: any) => val.name_en },
    { key: 'batch_type', label: 'Type' },
    { key: 'quantity_trays', label: 'Trays' },
    { key: 'seeding_date', label: 'Seeded', render: (val: string) => new Date(val).toLocaleDateString() },
    { key: 'expected_harvest_date', label: 'Harvest', render: (val: string) => new Date(val).toLocaleDateString() },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Seeding Batches</h2>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            className="focus:ring-2 focus:ring-green-500"
          >
            + New Batch
          </Button>
        </div>

        <Card>
          <Table columns={columns} data={batches} loading={loading} emptyMessage="No batches found" />
        </Card>

        {/* Modal */}
        <Modal
          isOpen={showModal}
          title="Create Seeding Batch"
          onClose={() => setShowModal(false)}
          onSubmit={() => {
            const form = document.querySelector('form') as HTMLFormElement;
            form?.dispatchEvent(new Event('submit', { bubbles: true }));
          }}
          submitText="Create"
          submitVariant="primary"
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="crop_id" className="block text-sm font-medium text-gray-900 mb-2">
                Crop
              </label>
              <select
                id="crop_id"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.crop_id}
                onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                required
              >
                <option value="">Select Crop</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
              </select>
            </div>

            <Input
              id="quantity_trays"
              type="number"
              label="Quantity (trays)"
              placeholder="Enter number of trays"
              value={formData.quantity_trays}
              onChange={(e) => setFormData({ ...formData, quantity_trays: e.target.value })}
              required
            />

            <div>
              <label htmlFor="batch_type" className="block text-sm font-medium text-gray-900 mb-2">
                Batch Type
              </label>
              <select
                id="batch_type"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.batch_type}
                onChange={(e) => setFormData({ ...formData, batch_type: e.target.value })}
              >
                <option value="order">Order</option>
                <option value="sample">Sample</option>
              </select>
            </div>
          </form>
        </Modal>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  );
}
