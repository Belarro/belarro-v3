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
}

interface GrowthStep {
  id: string;
  crop_id: string;
  step_type: string;
  duration_hours?: number;
  notes?: string;
  step_order: number;
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

export default function GrowProcedurePage() {
  const { toasts, addToast, removeToast } = useToast();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [steps, setSteps] = useState<GrowthStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Step states: track which steps are checked and their values
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({
    seed: { enabled: false, duration: null, notes: '' },
    soak: { enabled: false, duration: null, notes: '' },
    stack: { enabled: false, duration: null, notes: '' },
    light: { enabled: false, duration: null, notes: '' },
    humidity_dome: { enabled: false, duration: null, notes: '' },
    blackout: { enabled: false, duration: null, notes: '' },
    cover_soil: { enabled: false, duration: null, notes: '' },
  });

  // Track the order steps were checked
  const [stepOrder, setStepOrder] = useState<string[]>([]);

  // Store all crop steps for calculating totals
  const [allCropSteps, setAllCropSteps] = useState<Record<string, GrowthStep[]>>({});

  useEffect(() => {
    loadCrops();
  }, []);

  useEffect(() => {
    if (selectedCropId) {
      loadGrowthSteps(selectedCropId);
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

  const loadGrowthSteps = async (cropId: string) => {
    try {
      const response = await apiClient.getGrowthSteps(cropId);
      const stepsData = (response.data || []) as GrowthStep[];

      setSteps(stepsData);
      setIsEditing(false);

      // Also load steps for all crops to calculate correct sidebar totals
      try {
        const allCrops = crops;
        const cropStepsMap: Record<string, GrowthStep[]> = {};

        for (const crop of allCrops) {
          const res = await apiClient.getGrowthSteps(crop.id);
          cropStepsMap[crop.id] = (res.data || []) as GrowthStep[];
        }
        setAllCropSteps(cropStepsMap);
      } catch (e) {
        console.error('Failed to load all crop steps:', e);
      }

      // Reset all step states
      const newStates: Record<string, StepState> = {};
      const newOrder: string[] = [];

      STEP_TYPES.forEach(type => {
        newStates[type] = { enabled: false, duration: null, notes: '' };
      });

      // Load saved steps in their order
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
    } catch (error) {
      console.error('Failed to load growth steps:', error);
      addToast('Failed to load growth steps', 'error');
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

  const calculateTotalDays = (cropId?: string) => {
    // If no cropId provided, calculate for selected crop using current state
    if (!cropId || cropId === selectedCropId) {
      let totalHours = 0;
      stepOrder.forEach(type => {
        if (stepStates[type].enabled) {
          totalHours += stepStates[type].duration || 0;
        }
      });
      return Math.round(totalHours / 24);
    }

    // For other crops, calculate from allCropSteps
    const cropSteps = allCropSteps[cropId] || [];
    let totalHours = 0;
    cropSteps.forEach((step: GrowthStep) => {
      totalHours += step.duration_hours || 0;
    });
    return Math.round(totalHours / 24);
  };

  const handleSave = async () => {
    if (!selectedCropId) return;

    try {
      setSaving(true);

      // Delete all existing steps for this crop
      steps.forEach(async (step) => {
        await apiClient.deleteGrowthStep(selectedCropId, step.id);
      });

      // Create new steps in the order user specified
      let stepOrderNum = 1;
      for (const type of stepOrder) {
        const state = stepStates[type];
        if (!state.enabled) continue;

        const stepData: any = {
          step_type: type,
          step_order: stepOrderNum++,
        };

        if (type !== 'seed' && type !== 'cover_soil') {
          stepData.duration_hours = state.duration || 0;
        } else {
          stepData.duration_hours = null;
        }

        if (state.notes) {
          stepData.notes = state.notes;
        }

        await apiClient.createGrowthStep(selectedCropId, stepData);
      }

      addToast('Saved', 'success', 3000);
      await loadGrowthSteps(selectedCropId);
    } catch (error) {
      console.error('Failed to save grow procedure:', error);
      addToast('Failed to save grow procedure', 'error', 5000);
    } finally {
      setSaving(false);
    }
  };

  const selectedCrop = crops.find(c => c.id === selectedCropId);

  if (loading) {
    return (
      <Layout>
        <div className="text-center">Loading crops...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="grid grid-cols-[400px_1fr] gap-6 h-[calc(100vh-280px)]">
        {/* Left sidebar: Crop list */}
        <Card className="overflow-hidden p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCropId(crop.id)}
                className={`w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-green-500 focus:outline-none ${
                  selectedCropId === crop.id ? 'bg-blue-100 border-l-4 border-l-green-500 pl-2' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className="w-15 h-20 flex-shrink-0 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xl bg-cover bg-center"
                    style={crop.photo_url ? { backgroundImage: `url(${crop.photo_url})` } : {}}
                  >
                    {!crop.photo_url && '🌱'}
                  </div>
                  <div className="flex-1 min-w-0 flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 break-words">{crop.name_en}</p>
                      <p className="text-xs text-gray-600 mt-0.5 break-words">{crop.name_de}</p>
                      <div className="mt-2">
                        <StatusBadge status={crop.status === 'active' ? 'ok' : 'out'} label={crop.status} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-600 font-medium">Days</p>
                      <p className="text-sm font-bold text-green-600 mt-0.5">{calculateTotalDays(crop.id)}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Right panel: Growth procedure editor */}
        {selectedCrop && (
          <Card className="flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">{selectedCrop.name_en}</h2>
              <div className="text-right">
                <p className="text-xs text-gray-600 font-medium">Total Growth Days</p>
                <p className="text-xl font-bold text-green-600">{calculateTotalDays()}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Step timeline display */}
              {stepOrder.length > 0 && !isEditing && (
                <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-3">Growth Timeline</p>
                  <div className="flex items-center gap-2">
                    {stepOrder.map((type, idx) => (
                      <div key={type}>
                        <div className="text-center">
                          <div className="text-2xl mb-1">{STEP_ICONS[type]}</div>
                          <div className="text-xs font-semibold text-gray-900">{STEP_LABELS[type]}</div>
                          {stepStates[type].duration && (
                            <div className="text-sm font-bold text-green-600 mt-1">
                              {type === 'soak' ? stepStates[type].duration : Math.round((stepStates[type].duration || 0) / 24)}
                            </div>
                          )}
                          {stepStates[type].duration && (
                            <div className="text-xs text-gray-600">
                              {type === 'soak' ? 'hours' : 'days'}
                            </div>
                          )}
                        </div>
                        {idx < stepOrder.length - 1 && (
                          <div className="text-lg text-gray-300 mx-2">→</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit mode: checkboxes and inputs */}
              {isEditing && (
                <div className="space-y-4">
                  {STEP_TYPES.map((type) => (
                    <div key={type} className="border border-gray-200 rounded p-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stepStates[type].enabled}
                          onChange={(e) => handleStepToggle(type, e.target.checked)}
                          className="w-4 h-4 focus:ring-2 focus:ring-green-500"
                        />
                        <span className="text-lg">{STEP_ICONS[type]}</span>
                        <span className="font-semibold text-gray-900">{STEP_LABELS[type]}</span>
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
                          <p className="text-xs text-gray-600">
                            {type === 'soak' ? 'hours' : 'days'}
                          </p>
                        </div>
                      )}

                      {stepStates[type].enabled && ['light', 'blackout', 'humidity_dome', 'stack'].includes(type) && (
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
              )}

              {!isEditing && stepOrder.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No growth procedure defined yet.</p>
                  <p className="text-sm mt-2">Click "Edit" to add steps.</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="primary" className="flex-1">
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={() => loadGrowthSteps(selectedCropId)} variant="secondary" className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} variant="primary" disabled={saving} className="flex-1">
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
