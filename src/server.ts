import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gcgscmtjesyiziebutzw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ============ CROPS API ============

// Get all crops
app.get('/api/crops', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/belarro_v3_crop?select=*,belarro_v3_product_variant(*),belarro_v3_growth_step(*)&deleted_at=is.null&order=created_at.desc`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single crop
app.get('/api/crops/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/belarro_v3_crop?id=eq.${id}&select=*,belarro_v3_product_variant(*),belarro_v3_growth_step(*)&deleted_at=is.null`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    const data = await response.json();
    if (data.length === 0) {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }

    res.json({ success: true, data: data[0] });
  } catch (error: any) {
    console.error('Error fetching crop:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create crop
app.post('/api/crops', async (req, res) => {
  try {
    const { name_en, name_de, flavor, seeds_per_tray, yield_per_tray, total_growth_days, seeding_schedule, status } = req.body;

    if (!name_en || !name_de || seeds_per_tray === undefined || yield_per_tray === undefined || total_growth_days === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/belarro_v3_crop`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        name_en,
        name_de,
        flavor: flavor || null,
        seeds_per_tray: parseFloat(seeds_per_tray),
        yield_per_tray: parseFloat(yield_per_tray),
        total_growth_days: parseInt(total_growth_days),
        seeding_schedule: seeding_schedule || 'TUESDAY',
        status: status || 'active',
      }),
    });

    const data = await response.json();
    res.status(201).json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error: any) {
    console.error('Error creating crop:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update crop
app.patch('/api/crops/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name_en, name_de, flavor, seeds_per_tray, yield_per_tray, total_growth_days, seeding_schedule, status } = req.body;

    const updateData: Record<string, any> = {};
    if (name_en !== undefined) updateData.name_en = name_en;
    if (name_de !== undefined) updateData.name_de = name_de;
    if (flavor !== undefined) updateData.flavor = flavor;
    if (seeds_per_tray !== undefined) updateData.seeds_per_tray = parseFloat(seeds_per_tray);
    if (yield_per_tray !== undefined) updateData.yield_per_tray = parseFloat(yield_per_tray);
    if (total_growth_days !== undefined) updateData.total_growth_days = parseInt(total_growth_days);
    if (seeding_schedule !== undefined) updateData.seeding_schedule = seeding_schedule;
    if (status !== undefined) updateData.status = status;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/belarro_v3_crop?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }

    const data = await response.json();
    res.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error: any) {
    console.error('Error updating crop:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete crop (soft delete)
app.delete('/api/crops/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/belarro_v3_crop?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deleted_at: new Date().toISOString() }),
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }

    res.json({ success: true, data: { id, deleted: true } });
  } catch (error: any) {
    console.error('Error deleting crop:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ GROWTH STEPS API ============

app.get('/api/growth-steps', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/belarro_v3_growth_step?select=*&order=crop_id.asc,step_order.asc`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching growth steps:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ VARIANTS API ============

app.get('/api/variants', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/belarro_v3_product_variant?select=*&order=crop_id.asc,size_grams.asc`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/variants', async (req, res) => {
  try {
    const { crop_id, size_name, size_grams, price_eur } = req.body;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/belarro_v3_product_variant`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        crop_id,
        size_name,
        size_grams: parseFloat(size_grams),
        price_eur: parseFloat(price_eur),
      }),
    });

    const data = await response.json();
    res.status(201).json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error: any) {
    console.error('Error creating variant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/variants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/belarro_v3_product_variant?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, error: 'Variant not found' });
    }

    res.json({ success: true, data: { id, deleted: true } });
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✓ Belarro backend running on port ${PORT}`);
});
