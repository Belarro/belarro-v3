'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import { apiClient } from '@/services/api';

interface DashboardData {
  overview: any;
  revenue: any;
  operations: any;
  alerts: any;
  customer_funnel: any;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.getDashboard();
        setData(response.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <Layout><div>Loading...</div></Layout>;

  if (!data) return <Layout><div>Failed to load dashboard</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Total Crops" subtitle={`${data.overview.active_crops} active`}>
            <div className="text-3xl font-bold text-green-600">{data.overview.total_crops}</div>
          </Card>
          <Card title="Customers" subtitle={`${data.overview.active_customers} active`}>
            <div className="text-3xl font-bold text-blue-600">{data.overview.total_customers}</div>
          </Card>
          <Card title="Orders" subtitle={`${data.overview.pending_orders} pending`}>
            <div className="text-3xl font-bold text-purple-600">{data.overview.total_orders}</div>
          </Card>
          <Card title="Revenue" subtitle="This month">
            <div className="text-2xl font-bold text-amber-600">€{data.revenue.total_order_value_eur}</div>
          </Card>
        </div>

        {/* Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Active Operations">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Seeding Batches</span>
                <span className="font-semibold">{data.operations.active_seeding_batches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Follow-ups</span>
                <span className="font-semibold">{data.operations.pending_follow_ups}</span>
              </div>
            </div>
          </Card>

          {/* Alerts */}
          <Card title="Reorder Alerts" className={data.alerts.seed_reorder_alerts > 0 ? 'border-red-200 bg-red-50' : ''}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Seed Inventory</span>
                <span className="font-semibold text-red-600">{data.alerts.seed_reorder_alerts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Package Inventory</span>
                <span className="font-semibold text-orange-600">{data.alerts.package_reorder_alerts}</span>
              </div>
            </div>
          </Card>

          {/* Conversion Funnel */}
          <Card title="Customer Funnel">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Prospects</span>
                <span className="font-semibold">{data.customer_funnel.prospects}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active</span>
                <span className="font-semibold">{data.customer_funnel.active}</span>
              </div>
              <div className="text-xs text-gray-500 mt-3">
                Conversion: {data.customer_funnel.conversion_rate_percent}%
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
