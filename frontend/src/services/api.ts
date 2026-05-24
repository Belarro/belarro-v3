const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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
  async getVariants(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<ApiResponse>(`/variants?${query}`);
  }

  async getVariant(id: string) {
    return this.request<ApiResponse>(`/variants/${id}`);
  }

  async createVariant(data: any) {
    return this.request<ApiResponse>('/variants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVariant(id: string, data: any) {
    return this.request<ApiResponse>(`/variants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVariant(id: string) {
    return this.request<ApiResponse>(`/variants/${id}`, {
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
}

export const apiClient = new ApiClient();
