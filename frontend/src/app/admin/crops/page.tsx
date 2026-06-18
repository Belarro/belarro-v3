'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useToast } from '@/context/ToastContext';

interface GrowthProcedure {
  id?: string;
  soak_enabled: boolean;
  soak_hours?: number;
  cover_soil_enabled: boolean;
  stack_enabled: boolean;
  stack_days?: number;
  growth_env_type: 'blackout' | 'light' | 'humidity_dome';
  growth_env_days: number;
  humidity_dome_enabled: boolean;
}

interface ProductVariant {
  id?: string;
  size_name: string;
  size_grams: number;
  price_eur: number;
}

interface Crop {
  id: string;
  name_en: string;
  name_de: string;
  flavor?: string;
  status: 'active' | 'paused';
  growth_procedure?: GrowthProcedure;
  variants?: ProductVariant[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

type Tab = 'basics' | 'procedure' | 'sizes';

const GROWTH_ENV_OPTIONS = ['light', 'blackout', 'humidity_dome'] as const;

export default function AdminCropsPage() {
  const { addToast } = useToast();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('basics');
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewCrop, setIsNewCrop] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name_en: '',
    name_de: '',
    flavor: '',
    status: 'active' as 'active' | 'paused',
  });

  const [procedure, setProcedure] = useState<GrowthProcedure>({
    soak_enabled: false,
    soak_hours: undefined,
    cover_soil_enabled: false,
    stack_enabled: false,
    stack_days: undefined,
    growth_env_type: 'light',
    growth_env_days: 0,
    humidity_dome_enabled: false,
  });

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariant, setNewVariant] = useState({ size_name: '', size_grams: '', price_eur: '' });

  // Fetch crops
  const fetchCrops = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crops');
      const json = await res.json();
      if (json.success) {
        setCrops(json.data || []);
      }
    } catch (error) {
      console.error('Failed to load crops:', error);
      addToast('Failed to load crops', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  // Load selected crop
  useEffect(() => {
    if (selectedCropId && !isNewCrop) {
      loadCropData(selectedCropId);
    }
  }, [selectedCropId]);

  const loadCropData = async (cropId: string) => {
    try {
      const res = await fetch(`/api/crops?id=${cropId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const crop = json.data;
        setFormData({
          name_en: crop.name_en,
          name_de: crop.name_de,
          flavor: crop.flavor || '',
          status: crop.status,
        });
        setProcedure(crop.growth_procedure || {
          soak_enabled: false,
          soak_hours: undefined,
          cover_soil_enabled: false,
          stack_enabled: false,
          stack_days: undefined,
          growth_env_type: 'light',
          growth_env_days: 0,
          humidity_dome_enabled: false,
        });
        setVariants(crop.variants || []);
      }
    } catch (error) {
      console.error('Failed to load crop:', error);
      addToast('Failed to load crop data', 'error');
    }
  };

  const selectedCrop = crops.find(c => c.id === selectedCropId);
  const filteredCrops = crops.filter(c =>
    (c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name_de.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !c.deleted_at
  );

  const handleSave = async () => {
    if (!formData.name_en || !formData.name_de) {
      addToast('Name (EN) and Name (DE) are required', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: isNewCrop ? undefined : selectedCropId,
        name_en: formData.name_en,
        name_de: formData.name_de,
        flavor: formData.flavor || null,
        status: formData.status,
        growth_procedure: procedure,
        variants: variants.filter(v => v.size_name && v.size_grams && v.price_eur),
      };

      const method = isNewCrop ? 'POST' : 'PUT';
      const url = isNewCrop ? '/api/crops' : `/api/crops/${selectedCropId}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        addToast(isNewCrop ? 'Crop created' : 'Crop updated', 'success');
        setIsNewCrop(false);
        setIsEditing(false);
        setSelectedCropId(json.data.id);
        await fetchCrops();
      } else {
        addToast(json.error || 'Failed to save', 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      addToast('Error saving crop', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCropId) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/crops/${selectedCropId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCropId }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Crop deleted', 'success');
        setShowDeleteConfirm(false);
        setSelectedCropId(null);
        await fetchCrops();
      }
    } catch (error) {
      console.error('Delete error:', error);
      addToast('Failed to delete', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNewCrop = () => {
    setIsNewCrop(true);
    setSelectedCropId(null);
    setIsEditing(true);
    setActiveTab('basics');
    setFormData({ name_en: '', name_de: '', flavor: '', status: 'active' });
    setProcedure({
      soak_enabled: false,
      soak_hours: undefined,
      cover_soil_enabled: false,
      stack_enabled: false,
      stack_days: undefined,
      growth_env_type: 'light',
      growth_env_days: 0,
      humidity_dome_enabled: false,
    });
    setVariants([]);
  };

  const handleAddVariant = () => {
    if (!newVariant.size_name || !newVariant.size_grams || !newVariant.price_eur) {
      addToast('All variant fields required', 'error');
      return;
    }
    setVariants([
      ...variants,
      {
        size_name: newVariant.size_name,
        size_grams: parseFloat(newVariant.size_grams),
        price_eur: parseFloat(newVariant.price_eur),
      },
    ]);
    setNewVariant({ size_name: '', size_grams: '', price_eur: '' });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const calculateTotalDays = () => {
    let days = 0;
    if (procedure.stack_enabled) days += procedure.stack_days || 0;
    if (procedure.growth_env_type) days += procedure.growth_env_days || 0;
    return days;
  };

  if (loading) {
    return <Layout><div className="text-center py-8">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Crops</h1>
          <Button variant="primary" size="md" onClick={handleNewCrop}>
            + New Crop
          </Button>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-[400px_1fr] gap-6 h-[calc(100vh-280px)]">
          {/* LEFT: Crop list */}
          <Card className="overflow-hidden flex flex-col p-0">
            {/* Search */}
            <div className="p-3 border-b border-gray-200">
              <Input
                type="text"
                placeholder="Search crops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filteredCrops.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => {
                    setSelectedCropId(crop.id);
                    setIsNewCrop(false);
                    setIsEditing(false);
                  }}
                  className={`w-full p-3 border-b border-gray-100 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    selectedCropId === crop.id
                      ? 'bg-blue-50 border-l-4 border-l-green-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{crop.name_en}</p>
                      <p className="text-xs text-gray-600">{crop.name_de}</p>
                    </div>
                    <StatusBadge
                      status={crop.status === 'active' ? 'ok' : 'warning'}
                      label={crop.status}
                    />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* RIGHT: Detail panel */}
          {isNewCrop || selectedCrop ? (
            <Card className="overflow-hidden flex flex-col p-0">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isNewCrop ? 'New Crop' : selectedCrop?.name_en}
                </h2>
                {!isNewCrop && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isEditing}
                  >
                    Delete
                  </Button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                {(['basics', 'procedure', 'sizes'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    disabled={isEditing && tab !== activeTab}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      activeTab === tab
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    } ${isEditing && tab !== activeTab ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {tab === 'basics' && 'Basics'}
                    {tab === 'procedure' && 'Procedure'}
                    {tab === 'sizes' && 'Sizes & Prices'}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* BASICS TAB */}
                {activeTab === 'basics' && (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Name (English) *
                      </label>
                      <Input
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g., Pea Shoots"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Name (German) *
                      </label>
                      <Input
                        value={formData.name_de}
                        onChange={(e) => setFormData({ ...formData, name_de: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g., Erbsensprossen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Flavor Profile
                      </label>
                      <Input
                        value={formData.flavor}
                        onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g., Sweet, nutty, peppery"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          isEditing ? 'bg-white cursor-pointer' : 'bg-gray-100 cursor-not-allowed'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* PROCEDURE TAB */}
                {activeTab === 'procedure' && (
                  <div className="space-y-6 max-w-2xl">
                    {/* Total growth days */}
                    {!isEditing && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900">
                          Total Growth Days: <span className="text-2xl font-bold">{calculateTotalDays()}</span>
                        </p>
                      </div>
                    )}

                    {/* Soak */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={procedure.soak_enabled}
                          onChange={(e) => setProcedure({ ...procedure, soak_enabled: e.target.checked })}
                          disabled={!isEditing}
                          className="w-4 h-4"
                        />
                        <span className="text-lg">💧</span>
                        <span className="font-semibold text-gray-900 flex-1">Soak</span>
                      </label>
                      {procedure.soak_enabled && isEditing && (
                        <div className="mt-3 ml-7">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Hours"
                            value={procedure.soak_hours || ''}
                            onChange={(e) => setProcedure({ ...procedure, soak_hours: e.target.value ? parseInt(e.target.value) : undefined })}
                          />
                          <p className="text-xs text-gray-600 mt-1">Hours</p>
                        </div>
                      )}
                      {procedure.soak_enabled && !isEditing && (
                        <p className="mt-2 ml-7 text-sm text-gray-700">{procedure.soak_hours} hours</p>
                      )}
                    </div>

                    {/* Seed */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <label className="flex items-center gap-3">
                        <span className="text-lg">🌱</span>
                        <span className="font-semibold text-gray-900">Seed</span>
                        <span className="text-xs text-gray-600">(Always required)</span>
                      </label>
                    </div>

                    {/* Cover Soil */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={procedure.cover_soil_enabled}
                          onChange={(e) => setProcedure({ ...procedure, cover_soil_enabled: e.target.checked })}
                          disabled={!isEditing}
                          className="w-4 h-4"
                        />
                        <span className="text-lg">🌍</span>
                        <span className="font-semibold text-gray-900">Cover Soil</span>
                      </label>
                    </div>

                    {/* Stack */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={procedure.stack_enabled}
                          onChange={(e) => setProcedure({ ...procedure, stack_enabled: e.target.checked })}
                          disabled={!isEditing}
                          className="w-4 h-4"
                        />
                        <span className="text-lg">📚</span>
                        <span className="font-semibold text-gray-900">Stack</span>
                      </label>
                      {procedure.stack_enabled && isEditing && (
                        <div className="mt-3 ml-7">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Days"
                            value={procedure.stack_days || ''}
                            onChange={(e) => setProcedure({ ...procedure, stack_days: e.target.value ? parseInt(e.target.value) : undefined })}
                          />
                          <p className="text-xs text-gray-600 mt-1">Days</p>
                        </div>
                      )}
                      {procedure.stack_enabled && !isEditing && (
                        <p className="mt-2 ml-7 text-sm text-gray-700">{procedure.stack_days} days</p>
                      )}
                    </div>

                    {/* Growth Environment */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        Growth Environment
                      </label>
                      <div className="mb-3">
                        <select
                          value={procedure.growth_env_type}
                          onChange={(e) => setProcedure({ ...procedure, growth_env_type: e.target.value as 'light' | 'blackout' | 'humidity_dome' })}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            isEditing ? 'bg-white cursor-pointer' : 'bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <option value="light">Light</option>
                          <option value="blackout">Blackout</option>
                          <option value="humidity_dome">Humidity Dome</option>
                        </select>
                      </div>

                      {isEditing && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Duration (Days)
                            </label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Days"
                              value={procedure.growth_env_days || ''}
                              onChange={(e) => setProcedure({ ...procedure, growth_env_days: e.target.value ? parseInt(e.target.value) : 0 })}
                            />
                          </div>

                          {procedure.growth_env_type === 'light' && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={procedure.humidity_dome_enabled}
                                onChange={(e) => setProcedure({ ...procedure, humidity_dome_enabled: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700">Also use humidity dome (same duration)</span>
                            </label>
                          )}
                        </div>
                      )}

                      {!isEditing && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700">
                            <strong>{procedure.growth_env_type}</strong> for {procedure.growth_env_days} days
                          </p>
                          {procedure.growth_env_type === 'light' && procedure.humidity_dome_enabled && (
                            <p className="text-xs text-gray-600">+ Humidity dome (concurrent)</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Harvest */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <label className="flex items-center gap-3">
                        <span className="text-lg">🌾</span>
                        <span className="font-semibold text-gray-900">Harvest</span>
                        <span className="text-xs text-gray-600">(End of cycle)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* SIZES & PRICES TAB */}
                {activeTab === 'sizes' && (
                  <div className="space-y-6 max-w-2xl">
                    {/* Current sizes */}
                    {variants.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Sizes</h3>
                        <div className="space-y-2">
                          {variants.map((v, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{v.size_name}</p>
                                <p className="text-xs text-gray-600">{v.size_grams}g • €{v.price_eur.toFixed(2)}</p>
                              </div>
                              {isEditing && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleRemoveVariant(idx)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add variant form */}
                    {isEditing && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Size</h3>
                        <div className="space-y-3">
                          <Input
                            placeholder="Size name (e.g., 100g, Container)"
                            value={newVariant.size_name}
                            onChange={(e) => setNewVariant({ ...newVariant, size_name: e.target.value })}
                          />
                          <Input
                            type="number"
                            placeholder="Grams"
                            value={newVariant.size_grams}
                            onChange={(e) => setNewVariant({ ...newVariant, size_grams: e.target.value })}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price (€)"
                            value={newVariant.price_eur}
                            onChange={(e) => setNewVariant({ ...newVariant, price_eur: e.target.value })}
                          />
                          <Button
                            variant="primary"
                            onClick={handleAddVariant}
                            className="w-full"
                          >
                            Add Size
                          </Button>
                        </div>
                      </div>
                    )}

                    {variants.length === 0 && !isEditing && (
                      <p className="text-sm text-gray-600">No sizes defined yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                {isEditing || isNewCrop ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        if (isNewCrop) {
                          setIsNewCrop(false);
                          setSelectedCropId(null);
                        } else {
                          loadCropData(selectedCropId!);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="flex items-center justify-center text-gray-500">
              Select a crop to view details
            </Card>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        title="Delete Crop"
        submitText="Delete"
        submitVariant="danger"
        onClose={() => setShowDeleteConfirm(false)}
        onSubmit={handleDelete}
      >
        <p className="text-gray-700">
          Are you sure you want to delete <strong>{selectedCrop?.name_en}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </Layout>
  );
}
