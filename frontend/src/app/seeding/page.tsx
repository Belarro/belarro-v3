'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
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
      fetchBatches();
    } catch (error) {
      console.error('Failed to create batch:', error);
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
          <Button onClick={() => setShowModal(true)}>+ New Batch</Button>
        </div>

        <Card>
          <Table columns={columns} data={batches} loading={loading} emptyMessage="No batches found" />
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Create Seeding Batch</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.crop_id}
                  onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                  required
                >
                  <option value="">Select Crop</option>
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantity (trays)"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.quantity_trays}
                  onChange={(e) => setFormData({ ...formData, quantity_trays: e.target.value })}
                  required
                />
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.batch_type}
                  onChange={(e) => setFormData({ ...formData, batch_type: e.target.value })}
                >
                  <option value="order">Order</option>
                  <option value="sample">Sample</option>
                </select>
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
