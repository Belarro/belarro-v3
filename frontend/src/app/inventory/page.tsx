'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Table from '@/components/Table';
import { apiClient } from '@/services/api';

interface SeedInventory {
  id: string;
  crop: { name_en: string };
  quantity_grams: number;
  remaining_trays: number;
  needs_reorder: boolean;
}

export default function InventoryPage() {
  const [seeds, setSeeds] = useState<SeedInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await apiClient.getSeedInventory({ limit: 100 });
      setSeeds(response.data || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'crop', label: 'Crop', render: (val: any) => val.name_en },
    { key: 'quantity_grams', label: 'Quantity (grams)' },
    { key: 'remaining_trays', label: 'Remaining Trays' },
    { key: 'needs_reorder', label: 'Reorder', render: (val: boolean) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${val ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
        {val ? '⚠️ Yes' : 'No'}
      </span>
    )},
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Inventory</h2>

        <Card title="Seed Inventory">
          <Table columns={columns} data={seeds} loading={loading} emptyMessage="No seed inventory found" />
        </Card>
      </div>
    </Layout>
  );
}
