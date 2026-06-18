'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import StatusBadge from '@/components/StatusBadge';
import { ToastContainer, useToast } from '@/components/Toast';
import apiClient from '@/services/api';

interface Crop {
  id: string;
  name_en: string;
  name_de: string;
  photo_url?: string;
  status: string;
  flavor?: string;
}

interface GrowthStep {
  id: string;
  crop_id: string;
  step_type: string;
  duration_hours?: number;
  notes?: string;
  step_order: number;
}

interface Variant {
  id: string;
  crop_id: string;
  size_name: string;
  size_grams: number;
  price_eur: number;
}

interface StepState {
  enabled: boolean;
  duration: number | null;
  notes: string;
}

const STEP_TYPES = ['seed', 'soak', 'stack', 'light', 'humidity_dome', 'blackout', 'cover_soil'];
const STEP_ICONS: Record<string, string> = {
  seed: '🌱',
  soak: '💧',
  stack: '📚',
  light: '💡',
  humidity_dome: '💨',
  blackout: '🌑',
  cover_soil: '🌍',
};

const STEP_LABELS: Record<string, string> = {
  seed: 'Seed',
  soak: 'Soak',
  stack: 'Stack',
  light: 'Light',
  humidity_dome: 'Humidity Dome',
  blackout: 'Blackout',
  cover_soil: 'Cover Soil',
};

type Tab = 'basics' | 'procedure' | 'variants';

export default function CropConfigPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('basics');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Basics tab state
  const [basicData, setBasicData] = useState({
    name_en: '',
    name_de: '',
    flavor: '',
    status: 'active',
  });

  // Procedure tab state
  const [steps, setSteps] = useState<GrowthStep[]>([]);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({
    seed: { enabled: false, duration: null, notes: '' },
    soak: { enabled: false, duration: null, notes: '' },
    stack: { enabled: false, duration: null, notes: '' },
    light: { enabled: false, duration: null, notes: '' },
    humidity_dome: { enabled: false, duration: null, notes: '' },
    blackout: { enabled: false, duration: null, notes: '' },
    cover_soil: { enabled: false, duration: null, notes: '' },
  });
  const [stepOrder, setStepOrder] = useState<string[]>([]);

  // Variants tab state
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariant, setNewVariant] = useState({ size_name: '', size_grams: '', price_eur: '' });

  useEffect(() => {
    loadCrops();
  }, []);

  useEffect(() => {
    if (selectedCropId) {
      loadCropData(selectedCropId);
    }
  }, [selectedCropId]);

  const loadCrops = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCrops({ status: 'active' });
      const cropsData = response.data || [];
      setCrops(cropsData);
      if (cropsData.length > 0) {
        setSelectedCropId(cropsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load crops:', error);
      addToast('Failed to load crops', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCropData = async (cropId: string) => {
    try {
      // Load basics
      const cropResponse = await apiClient.getCrop(cropId);
      const crop = Array.isArray(cropResponse.data) ? cropResponse.data[0] : cropResponse.data;
      if (crop) {
        setBasicData({
          name_en: crop.name_en || '',
          name_de: crop.name_de || '',
          flavor: crop.flavor || '',
          status: crop.status || 'active',
        });
      }

      // Load growth procedure
      const stepsResponse = await apiClient.getGrowthSteps(cropId);
      const stepsData = (stepsResponse.data || []) as GrowthStep[];
      setSteps(stepsData);

      const newStates: Record<string, StepState> = {};
      const newOrder: string[] = [];
      STEP_TYPES.forEach(type => {
        newStates[type] = { enabled: false, duration: null, notes: '' };
      });
      stepsData.forEach((step: GrowthStep) => {
        const type = step.step_type?.toLowerCase() || '';
        if (STEP_TYPES.includes(type)) {
          newStates[type] = {
            enabled: true,
            duration: step.duration_hours || null,
            notes: step.notes || '',
          };
          newOrder.push(type);
        }
      });
      setStepStates(newStates);
      setStepOrder(newOrder);

      // Load variants
      const variantsResponse = await apiClient.getVariants(cropId);
      setVariants(variantsResponse.data || []);
    } catch (error) {
      console.error('Failed to load crop data:', error);
      addToast('Failed to load crop data', 'error');
    }
  };

  const handleStepToggle = (stepType: string, enabled: boolean) => {
    setStepStates(prev => ({
      ...prev,
      [stepType]: { ...prev[stepType], enabled },
    }));

    if (enabled) {
      setStepOrder(prev => [...prev, stepType]);
    } else {
      setStepOrder(prev => prev.filter(t => t !== stepType));
    }
  };

  const handleStepChange = (stepType: string, field: string, value: any) => {
    setStepStates(prev => ({
      ...prev,
      [stepType]: { ...prev[stepType], [field]: value },
    }));
  };

  const calculateTotalDays = () => {
    let totalHours = 0;
    stepOrder.forEach(type => {
      if (stepStates[type].enabled) {
        totalHours += stepStates[type].duration || 0;
      }
    });
    return Math.round(totalHours / 24);
  };

  const handleSaveBasics = async () => {
    if (!selectedCropId) return;
    try {
      setSaving(true);
      await apiClient.updateCrop(selectedCropId, basicData);
      addToast('Crop basics saved', 'success', 3000);
      await loadCrops();
    } catch (error) {
      console.error('Failed to save basics:', error);
      addToast('Failed to save crop basics', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProcedure = async () => {
    if (!selectedCropId) return;
    try {
      setSaving(true);

      // Delete all existing steps
      for (const step of steps) {
        await apiClient.deleteGrowthStep(selectedCropId, step.id);
      }

      // Create new steps
      let stepOrderNum = 1;
      for (const type of stepOrder) {
        const state = stepStates[type];
        if (!state.enabled) continue;

        await apiClient.createGrowthStep(selectedCropId, {
          step_type: type,
          step_order: stepOrderNum++,
          duration_hours: type !== 'seed' && type !== 'cover_soil' ? state.duration || 0 : null,
          notes: state.notes || null,
        });
      }

      addToast('Growth procedure saved', 'success', 3000);
      await loadCropData(selectedCropId);
    } catch (error) {
      console.error('Failed to save procedure:', error);
      addToast('Failed to save growth procedure', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = async () => {
    if (!selectedCropId || !newVariant.size_name || !newVariant.size_grams || !newVariant.price_eur) {
      addToast('Please fill in all variant fields', 'error');
      return;
    }

    try {
      setSaving(true);
      await apiClient.createVariant(selectedCropId, {
        size_name: newVariant.size_name,
        size_grams: parseFloat(newVariant.size_grams),
        price_eur: parseFloat(newVariant.price_eur),
      });
      addToast('Variant added', 'success', 3000);
      setNewVariant({ size_name: '', size_grams: '', price_eur: '' });
      await loadCropData(selectedCropId);
    } catch (error) {
      console.error('Failed to add variant:', error);
      addToast('Failed to add variant', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!selectedCropId) return;
    try {
      setSaving(true);
      await apiClient.deleteVariant(selectedCropId, variantId);
      addToast('Variant deleted', 'success', 3000);
      await loadCropData(selectedCropId);
    } catch (error) {
      console.error('Failed to delete variant:', error);
      addToast('Failed to delete variant', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedCrop = crops.find(c => c.id === selectedCropId);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading crops...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="grid grid-cols-[350px_1fr] gap-6 h-[calc(100vh-280px)]">
        {/* Left sidebar: Crop list */}
        <Card className="overflow-hidden p-0 flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Crops</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCropId(crop.id)}
                className={`w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-green-500 focus:outline-none ${
                  selectedCropId === crop.id ? 'bg-blue-100 border-l-4 border-l-green-500 pl-2' : ''
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{crop.name_en}</p>
                <p className="text-xs text-gray-600">{crop.name_de}</p>
                <div className="mt-2">
                  <StatusBadge status={crop.status === 'active' ? 'ok' : 'out'} label={crop.status} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Right panel: Config tabs */}
        {selectedCrop && (
          <Card className="flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">{selectedCrop.name_en}</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white">
              {[
                { id: 'basics', label: 'Basics' },
                { id: 'procedure', label: 'Growth Procedure' },
                { id: 'variants', label: 'Sizes & Prices' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* BASICS TAB */}
              {activeTab === 'basics' && (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                    <Input
                      value={basicData.name_en}
                      onChange={(e) => setBasicData({ ...basicData, name_en: e.target.value })}
                      placeholder="e.g., Pea Shoots"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (German)</label>
                    <Input
                      value={basicData.name_de}
                      onChange={(e) => setBasicData({ ...basicData, name_de: e.target.value })}
                      placeholder="e.g., Erbsensprossen"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flavor Profile</label>
                    <Input
                      value={basicData.flavor}
                      onChange={(e) => setBasicData({ ...basicData, flavor: e.target.value })}
                      placeholder="e.g., Sweet, nutty"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={basicData.status}
                      onChange={(e) => setBasicData({ ...basicData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <Button onClick={handleSaveBasics} variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Basics'}
                  </Button>
                </div>
              )}

              {/* PROCEDURE TAB */}
              {activeTab === 'procedure' && (
                <div className="space-y-4">
                  {stepOrder.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-3">Total Growth Days: <span className="text-lg font-bold text-green-600">{calculateTotalDays()}</span></p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {stepOrder.map((type, idx) => (
                          <div key={type} className="flex items-center gap-1">
                            <div className="text-center">
                              <div className="text-xl">{STEP_ICONS[type]}</div>
                              {stepStates[type].duration && <div className="text-xs font-bold text-green-600">{type === 'soak' ? stepStates[type].duration : Math.round((stepStates[type].duration || 0) / 24)}</div>}
                            </div>
                            {idx < stepOrder.length - 1 && <div className="text-gray-300">→</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {STEP_TYPES.map((type) => (
                      <div key={type} className="border border-gray-200 rounded p-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stepStates[type].enabled}
                            onChange={(e) => handleStepToggle(type, e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-lg">{STEP_ICONS[type]}</span>
                          <span className="font-semibold text-gray-900 flex-1">{STEP_LABELS[type]}</span>
                        </label>

                        {stepStates[type].enabled && type !== 'seed' && type !== 'cover_soil' && (
                          <div className="mt-3 ml-7 space-y-2">
                            <Input
                              type="number"
                              placeholder={type === 'soak' ? 'Hours' : 'Days'}
                              value={stepStates[type].duration || ''}
                              onChange={(e) =>
                                handleStepChange(type, 'duration', e.target.value ? parseInt(e.target.value) : null)
                              }
                              min="1"
                            />
                            <p className="text-xs text-gray-600">{type === 'soak' ? 'hours' : 'days'}</p>
                          </div>
                        )}

                        {stepStates[type].enabled && (
                          <div className="mt-3 ml-7">
                            <textarea
                              placeholder="Notes (optional)"
                              value={stepStates[type].notes}
                              onChange={(e) => handleStepChange(type, 'notes', e.target.value)}
                              className="w-full p-2 border border-gray-200 rounded text-sm"
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button onClick={handleSaveProcedure} variant="primary" disabled={saving} className="w-full">
                    {saving ? 'Saving...' : 'Save Procedure'}
                  </Button>
                </div>
              )}

              {/* VARIANTS TAB */}
              {activeTab === 'variants' && (
                <div className="space-y-4">
                  {/* Add new variant */}
                  <div className="border border-gray-200 rounded p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-3">Add New Size & Price</h4>
                    <div className="space-y-2">
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
                        placeholder="Price (€)"
                        value={newVariant.price_eur}
                        onChange={(e) => setNewVariant({ ...newVariant, price_eur: e.target.value })}
                        step="0.01"
                      />
                      <Button onClick={handleAddVariant} variant="primary" disabled={saving} className="w-full">
                        Add Variant
                      </Button>
                    </div>
                  </div>

                  {/* Existing variants */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Current Variants</h4>
                    {variants.length === 0 ? (
                      <p className="text-sm text-gray-600">No variants defined yet</p>
                    ) : (
                      variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                          <div>
                            <p className="font-medium text-gray-900">{variant.size_name}</p>
                            <p className="text-sm text-gray-600">{variant.size_grams}g • €{variant.price_eur.toFixed(2)}</p>
                          </div>
                          <Button
                            onClick={() => handleDeleteVariant(variant.id)}
                            variant="secondary"
                            disabled={saving}
                            className="text-red-600"
                          >
                            Delete
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
