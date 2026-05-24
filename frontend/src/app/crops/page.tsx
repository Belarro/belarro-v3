'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import { apiClient } from '@/services/api';

interface Crop {
  id: string;
  name_en: string;
  name_de: string;
  seeds_per_tray: number;
  yield_per_tray: number;
  total_growth_days: number;
  seeding_schedule: string;
  status: string;
}

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name_en: '',
    name_de: '',
    seeds_per_tray: '',
    yield_per_tray: '',
    total_growth_days: '',
    seeding_schedule: 'TUESDAY',
  });

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const response = await apiClient.getCrops();
      setCrops(response.data || []);
    } catch (error) {
      console.error('Failed to load crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createCrop({
        ...formData,
        seeds_per_tray: parseFloat(formData.seeds_per_tray),
        yield_per_tray: parseFloat(formData.yield_per_tray),
        total_growth_days: parseInt(formData.total_growth_days),
      });
      setFormData({
        name_en: '',
        name_de: '',
        seeds_per_tray: '',
        yield_per_tray: '',
        total_growth_days: '',
        seeding_schedule: 'TUESDAY',
      });
      setShowModal(false);
      fetchCrops();
    } catch (error) {
      console.error('Failed to create crop:', error);
    }
  };

  const columns = [
    { key: 'name_en', label: 'Name (EN)' },
    { key: 'name_de', label: 'Name (DE)' },
    { key: 'seeding_schedule', label: 'Schedule' },
    { key: 'total_growth_days', label: 'Growth Days' },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${val === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
        {val}
      </span>
    )},
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Crops</h2>
          <Button onClick={() => setShowModal(true)}>+ New Crop</Button>
        </div>

        <Card>
          <Table columns={columns} data={crops} loading={loading} emptyMessage="No crops found" />
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Create New Crop</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Name (English)"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Name (German)"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.name_de}
                  onChange={(e) => setFormData({ ...formData, name_de: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Seeds per Tray (grams)"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.seeds_per_tray}
                  onChange={(e) => setFormData({ ...formData, seeds_per_tray: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Yield per Tray (grams)"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.yield_per_tray}
                  onChange={(e) => setFormData({ ...formData, yield_per_tray: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Total Growth Days"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.total_growth_days}
                  onChange={(e) => setFormData({ ...formData, total_growth_days: e.target.value })}
                  required
                />
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formData.seeding_schedule}
                  onChange={(e) => setFormData({ ...formData, seeding_schedule: e.target.value })}
                >
                  <option value="TUESDAY">Tuesday</option>
                  <option value="FRIDAY">Friday</option>
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
