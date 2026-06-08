const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Crops
  async getCrops(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/crops?${query}`);
  }

  async getCrop(id: string) {
    return this.request<ApiResponse>(`/crops/${id}`);
  }

  async createCrop(data: any) {
    return this.request<ApiResponse>('/crops', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCrop(id: string, data: any) {
    return this.request<ApiResponse>(`/crops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCrop(id: string) {
    return this.request<ApiResponse>(`/crops/${id}`, {
      method: 'DELETE',
    });
  }

  // Variants
  async getVariants(cropId?: string) {
    const query = cropId ? `?crop_id=${cropId}` : '';
    return this.request<ApiResponse>(`/variants${query}`);
  }

  async getVariant(id: string) {
    return this.request<ApiResponse>(`/variants/${id}`);
  }

  async createVariant(cropId: string, data: any) {
    return this.request<ApiResponse>('/variants', {
      method: 'POST',
      body: JSON.stringify({ ...data, crop_id: cropId }),
    });
  }

  async updateVariant(id: string, data: any) {
    return this.request<ApiResponse>(`/variants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVariant(cropId: string, variantId: string) {
    return this.request<ApiResponse>(`/variants/${variantId}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/orders?${query}`);
  }

  async getOrder(id: string) {
    return this.request<ApiResponse>(`/orders/${id}`);
  }

  async createOrder(data: any) {
    return this.request<ApiResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: string, data: any) {
    return this.request<ApiResponse>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrder(id: string) {
    return this.request<ApiResponse>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Customers
  async getCustomers(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/customers?${query}`);
  }

  async getCustomer(id: string) {
    return this.request<ApiResponse>(`/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.request<ApiResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: any) {
    return this.request<ApiResponse>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request<ApiResponse>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Follow-ups
  async getFollowUps(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/follow-ups?${query}`);
  }

  async getFollowUp(id: string) {
    return this.request<ApiResponse>(`/follow-ups/${id}`);
  }

  async updateFollowUp(id: string, data: any) {
    return this.request<ApiResponse>(`/follow-ups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Inventory
  async getSeedInventory(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/inventory/seeds?${query}`);
  }

  async updateSeedInventory(cropId: string, data: any) {
    return this.request<ApiResponse>(`/inventory/seeds/${cropId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPackageInventory(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/inventory/packages?${query}`);
  }

  async updatePackageInventory(variantId: string, data: any) {
    return this.request<ApiResponse>(`/inventory/packages/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Seeding & Harvest
  async getSeedingBatches(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/seeding/batches?${query}`);
  }

  async createSeedingBatch(data: any) {
    return this.request<ApiResponse>('/seeding/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordHarvest(data: any) {
    return this.request<ApiResponse>('/seeding/harvest', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Invoices
  async getInvoices(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/invoices?${query}`);
  }

  async getInvoice(id: string) {
    return this.request<ApiResponse>(`/invoices/${id}`);
  }

  async generateInvoice(data: any) {
    return this.request<ApiResponse>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoice(id: string, data: any) {
    return this.request<ApiResponse>(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteInvoice(id: string) {
    return this.request<ApiResponse>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  // Standing Orders
  async getStandingOrders(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/standing-orders?${query}`);
  }

  async getStandingOrder(id: string) {
    return this.request<ApiResponse>(`/standing-orders/${id}`);
  }

  async createStandingOrder(data: any) {
    return this.request<ApiResponse>('/standing-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStandingOrder(id: string, data: any) {
    return this.request<ApiResponse>(`/standing-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteStandingOrder(id: string) {
    return this.request<ApiResponse>(`/standing-orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Growth Steps
  async getGrowthSteps(cropId: string) {
    return this.request<ApiResponse>(`/growth-steps?cropId=${cropId}`);
  }

  async createGrowthStep(cropId: string, data: any) {
    return this.request<ApiResponse>('/growth-steps', {
      method: 'POST',
      body: JSON.stringify({ ...data, crop_id: cropId }),
    });
  }

  async updateGrowthStep(cropId: string, stepId: string, data: any) {
    return this.request<ApiResponse>(`/growth-steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGrowthStep(cropId: string, stepId: string) {
    return this.request<ApiResponse>(`/growth-steps/${stepId}`, {
      method: 'DELETE',
    });
  }

  async uploadCropPhoto(cropId: string, file: File) {
    // Convert file to base64 and send via PUT
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const response = await this.request('/crops/' + cropId, {
            method: 'PUT',
            body: JSON.stringify({ photo_url: base64 }),
          });
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  }

  // Size Templates
  async getSizeTemplates() {
    return this.request<ApiResponse>('/size-templates');
  }

  async createSizeTemplate(data: any) {
    return this.request<ApiResponse>('/size-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSizeTemplate(id: string, data: any) {
    return this.request<ApiResponse>(`/size-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSizeTemplate(id: string) {
    return this.request<ApiResponse>(`/size-templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getDashboard() {
    return this.request<ApiResponse>('/dashboard');
  }

  async getCropsPerformance() {
    return this.request<ApiResponse>('/dashboard/crops-performance');
  }

  async getCustomerMetrics() {
    return this.request<ApiResponse>('/dashboard/customer-metrics');
  }

  async getOrderTrends() {
    return this.request<ApiResponse>('/dashboard/order-trends');
  }

  // Direct Supabase fetch for crops (bypass backend if needed)
  async getCropsFromSupabase(statusFilter?: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error('Missing Supabase credentials');
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?select=*&order=sort_order`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const products = (await response.json()) as any[];

    // Filter out hidden products
    const filtered = products.filter((p) => p.availability_status !== 'hidden');

    // Transform to match crop interface
    const crops = filtered.map((p: any) => ({
      id: p.id,
      name_en: p.name_en || p.name,
      name_de: p.name_de,
      flavor: p.flavor_profile,
      photo_url: p.photo,
      seeds_per_tray: p.growing_procedure?.seeds_per_tray || 0,
      yield_per_tray: p.yield_per_tray ? parseFloat(p.yield_per_tray) : 0,
      total_growth_days: 14,
      seeding_schedule: 'TUESDAY',
      status: p.availability_status || 'active',
      created_at: p.created_at,
      updated_at: p.updated_at,
      variants: p.available_sizes?.map((size: string) => ({
        id: p.id + '-' + size,
        size_name: size,
        size_grams: parseFloat(size) || 0,
        price_eur: p.prices?.[size] || 0,
      })) || [],
      growth_steps: p.growing_stages || [],
      seed_inventory: [],
    }));

    return { success: true, data: crops };
  }
}

export const apiClient = new ApiClient();

export default apiClient;
