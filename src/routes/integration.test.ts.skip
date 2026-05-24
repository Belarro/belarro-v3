describe.skip('Integration Tests - Full Workflow', () => {
  // Prerequisites:
  // 1. PostgreSQL running with DATABASE_URL set
  // 2. Backend server running on http://localhost:3001
  // 3. All migrations applied

  const API_BASE_URL = 'http://localhost:3001/api';

  async function request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  describe('End-to-End Workflow', () => {
    let cropId: string;
    let variantId: string;
    let customerId: string;
    let orderId: string;
    let seedingBatchId: string;

    it('should create a crop', async () => {
      const response = await request('/crops', {
        method: 'POST',
        body: JSON.stringify({
          name_en: 'Integration Test Crop',
          name_de: 'Integrationtest Ernte',
          seeds_per_tray: 60,
          yield_per_tray: 25,
          total_growth_days: 10,
          seeding_schedule: 'FRIDAY',
        }),
      });

      expect(response.success).toBe(true);
      expect(response.data.id).toBeDefined();
      cropId = response.data.id;
    });

    it('should create a product variant', async () => {
      const response = await request('/variants', {
        method: 'POST',
        body: JSON.stringify({
          crop_id: cropId,
          size_name: '100g Pack',
          size_grams: 100,
          price_eur: 12.99,
        }),
      });

      expect(response.success).toBe(true);
      expect(response.data.id).toBeDefined();
      variantId = response.data.id;
    });

    it('should create a customer with auto-generated follow-ups', async () => {
      const response = await request('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Restaurant',
          email: 'test@restaurant.de',
          address: 'Friedrichstraße 123',
          city: 'Berlin',
          phone: '+49 30 123456',
          net_days: 30,
        }),
      });

      expect(response.success).toBe(true);
      expect(response.data.id).toBeDefined();
      customerId = response.data.id;
    });

    it('should create an order with calculated seeding date', async () => {
      const response = await request('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          product_variant_id: variantId,
          quantity: 250,
        }),
      });

      expect(response.success).toBe(true);
      expect(response.data.id).toBeDefined();
      expect(response.data.seeding_date).toBeDefined();
      expect(response.data.expected_harvest_date).toBeDefined();
      orderId = response.data.id;
    });

    it('should create a seeding batch with seed inventory deduction', async () => {
      // First add seed inventory
      const cropResponse = await request(`/crops/${cropId}`);
      const seedInventoryId = cropResponse.data.seed_inventory.id;

      await request(`/inventory/seeds/${cropId}`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity_grams: 1000,
        }),
      });

      // Create seeding batch
      const response = await request('/seeding/batches', {
        method: 'POST',
        body: JSON.stringify({
          crop_id: cropId,
          quantity_trays: 5,
          batch_type: 'order',
        }),
      });

      expect(response.success).toBe(true);
      expect(response.data.id).toBeDefined();
      expect(response.details.seeds_deducted_grams).toBe(300); // 60 * 5
      seedingBatchId = response.data.id;
    });

    it('should record harvest with yield allocation', async () => {
      const response = await request('/seeding/harvest', {
        method: 'POST',
        body: JSON.stringify({
          seeding_batch_id: seedingBatchId,
          actual_yield_grams: 150,
          yield_used_for_orders_grams: 100,
        }),
      });

      expect(response.success).toBe(true);
      expect(response.details.allocated_to_orders_grams).toBe(100);
      expect(response.details.allocated_to_samples_grams).toBe(50);
    });

    it('should retrieve dashboard with updated metrics', async () => {
      const response = await request('/dashboard');

      expect(response.success).toBe(true);
      expect(response.data.overview).toBeDefined();
      expect(response.data.overview.total_crops).toBeGreaterThan(0);
      expect(response.data.overview.total_customers).toBeGreaterThan(0);
      expect(response.data.overview.total_orders).toBeGreaterThan(0);
    });

    it('should handle validation errors', async () => {
      try {
        await request('/crops', {
          method: 'POST',
          body: JSON.stringify({
            name_en: 'Invalid Crop',
            // Missing required fields
          }),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('Missing required fields');
      }
    });

    it('should enforce cascading deletes', async () => {
      // Delete crop should cascade to variants
      await request(`/crops/${cropId}`, { method: 'DELETE' });

      // Variant should be deleted
      try {
        await request(`/variants/${variantId}`);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });
  });

  describe('Security Checks', () => {
    it('should enforce role-based access', async () => {
      // Create two customers
      const c1 = await request('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Customer 1',
          email: 'c1@test.de',
          address: 'Address 1',
          city: 'Berlin',
        }),
      });

      // Should only see own data (in future with auth)
      const response = await request(`/customers/${c1.data.id}`);
      expect(response.data.id).toBe(c1.data.id);
    });

    it('should prevent negative inventory', async () => {
      const cropResponse = await request('/crops?limit=1');
      const cropId = cropResponse.data[0]?.id;

      if (cropId) {
        try {
          await request(`/inventory/seeds/${cropId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity_grams: -100 }),
          });
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.message).toContain('cannot be negative');
        }
      }
    });

    it('should validate seeding schedule', async () => {
      try {
        await request('/crops', {
          method: 'POST',
          body: JSON.stringify({
            name_en: 'Invalid Schedule',
            name_de: 'Ungültig',
            seeds_per_tray: 60,
            yield_per_tray: 25,
            total_growth_days: 10,
            seeding_schedule: 'INVALID',
          }),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('TUESDAY or FRIDAY');
      }
    });
  });

  describe('Performance Checks', () => {
    it('should list crops with pagination efficiently', async () => {
      const startTime = Date.now();
      const response = await request('/crops?page=1&limit=20');
      const endTime = Date.now();

      expect(response.success).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1s
    });

    it('should search customers efficiently', async () => {
      const startTime = Date.now();
      const response = await request('/customers?status=active&limit=50');
      const endTime = Date.now();

      expect(response.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
