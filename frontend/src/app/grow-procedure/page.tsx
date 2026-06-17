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
  total_growth_days?: number;
}

interface GrowthStep {
  id: string;
  crop_id: string;
  step_type: string;
  duration_hours?: number;
  notes?: string;
  step_order: number;
}

const DURATION_UNIT: Record<string, string> = {
  soak: 'hours',
  stack: 'days',
  light: 'days',
  blackout: 'days',
  cover_soil: 'process',
};

const STEP_ICONS: Record<string, string> = {
  seed: '🌱',
  soak: '💧',
  stack: '📚',
  light: '💡',
  humidity_dome: '💨',
  blackout: '🌑',
  cover_soil: '🌍',
};

export default function GrowProcedurePage() {
  const { toasts, addToast, removeToast } = useToast();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [steps, setSteps] = useState<GrowthStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [seed, setSeed] = useState<{ enabled: boolean; duration: number | null; notes: string }>({ enabled: false, duration: null, notes: '' });
  const [soak, setSoak] = useState<{ enabled: boolean; duration: number | null }>({ enabled: false, duration: null });
  const [stack, setStack] = useState<{ enabled: boolean; duration: number | null }>({ enabled: false, duration: null });
  const [lightPhase, setLightPhase] = useState<{ enabled: boolean; duration: number | null; notes: string }>({ enabled: false, duration: null, notes: '' });
  const [humidityDome, setHumidityDome] = useState<{ enabled: boolean; duration: number | null; notes: string; countTowardsDays: boolean }>({ enabled: false, duration: null, notes: '', countTowardsDays: false });
  const [blackoutPhase, setBlackoutPhase] = useState<{ enabled: boolean; duration: number | null; notes: string }>({ enabled: false, duration: null, notes: '' });
  const [coverSoil, setCoverSoil] = useState<{ enabled: boolean; duration: number | null; notes: string }>({ enabled: false, duration: null, notes: '' });
  const [allCropSteps, setAllCropSteps] = useState<Record<string, GrowthStep[]>>({});
  const [enabledOrder, setEnabledOrder] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [cropNotes, setCropNotes] = useState<string>('');

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
        await loadAllCropStepsForCrops(cropsData);
      }
    } catch (error) {
      console.error('Failed to load crops:', error);
      addToast('Failed to load crops', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllCropStepsForCrops = async (cropsData: Crop[]) => {
    try {
      const responses = await Promise.all(
        cropsData.map(crop => apiClient.getGrowthSteps(crop.id))
      );
      const stepsMap: Record<string, GrowthStep[]> = {};
      cropsData.forEach((crop, idx) => {
        const allSteps = responses[idx].data || [];
        stepsMap[crop.id] = (allSteps as any[])
          .filter((s: any) => s.crop_id === crop.id)
          .sort((a: any, b: any) => (a.step_order ?? 0) - (b.step_order ?? 0));
      });
      setAllCropSteps(stepsMap);
    } catch (error) {
      console.error('Failed to load all crop steps:', error);
    }
  };

  const loadGrowthSteps = async (cropId: string) => {
    try {
      const [stepsResponse, cropResponse] = await Promise.all([
        apiClient.getGrowthSteps(cropId),
        apiClient.getCrop(cropId),
      ]);
      const stepsData = stepsResponse.data || [];
      const cropData = Array.isArray(cropResponse.data) ? cropResponse.data[0] : cropResponse.data;

      setSteps(stepsData);
      setIsEditing(false);
      setCropNotes(cropData?.notes || '');

      setSeed({ enabled: false, duration: null, notes: '' });
      setSoak({ enabled: false, duration: null });
      setStack({ enabled: false, duration: null });
      setLightPhase({ enabled: false, duration: null, notes: '' });
      setHumidityDome({ enabled: false, duration: null, notes: '', countTowardsDays: false });
      setBlackoutPhase({ enabled: false, duration: null, notes: '' });
      setCoverSoil({ enabled: false, duration: null, notes: '' });

      const order: string[] = [];
      const sorted = [...stepsData].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));
      const durationInDays = (hours: number) => Math.round(hours / 24);

      sorted.forEach((step: GrowthStep) => {
        const stepType = step.step_type?.toLowerCase().replace(/_/g, '_');

        if (stepType === 'seed') {
          setSeed({ enabled: true, duration: step.duration_hours || null, notes: step.notes || '' });
          order.push('seed');
        } else if (stepType === 'soak' || stepType === 'soaking') {
          setSoak({ enabled: true, duration: step.duration_hours || null });
          order.push('soak');
        } else if (stepType === 'stack' || stepType === 'stacking') {
          setStack({ enabled: true, duration: durationInDays(step.duration_hours || 0) || null });
          order.push('stack');
        } else if (stepType === 'light' || stepType === 'under_light') {
          setLightPhase({ enabled: true, duration: durationInDays(step.duration_hours || 0) || null, notes: step.notes || '' });
          order.push('light');
        } else if (stepType === 'humidity_dome' || stepType === 'dome') {
          const notes = step.notes || '';
          const countDays = notes.includes('[COUNT_DAYS]');
          const cleanNotes = notes.replace('[COUNT_DAYS]', '').trim();
          setHumidityDome({ enabled: true, duration: durationInDays(step.duration_hours || 0) || null, notes: cleanNotes, countTowardsDays: countDays });
          order.push('humidity_dome');
        } else if (stepType === 'blackout') {
          setBlackoutPhase({ enabled: true, duration: durationInDays(step.duration_hours || 0) || null, notes: step.notes || '' });
          order.push('blackout');
        } else if (stepType === 'cover_soil') {
          setCoverSoil({ enabled: true, duration: step.duration_hours || null, notes: step.notes || '' });
          order.push('cover_soil');
        }
      });
      setEnabledOrder(order);
    } catch (error) {
      console.error('Failed to load growth steps:', error);
      addToast('Failed to load growth steps', 'error');
    }
  };

  const handleSave = async () => {
    if (!selectedCropId) return;

    try {
      setSaving(true);

      for (const step of steps) {
        await apiClient.deleteGrowthStep(selectedCropId, step.id);
      }

      const stateMap: Record<string, any> = {
        seed: { state: seed, hasNotes: true },
        soak: { state: soak, hasNotes: false },
        stack: { state: stack, hasNotes: true },
        light: { state: lightPhase, hasNotes: true },
        humidity_dome: { state: humidityDome, hasNotes: true },
        blackout: { state: blackoutPhase, hasNotes: true },
        cover_soil: { state: coverSoil, hasNotes: false },
      };

      const newSteps = [];
      let stepOrder = 1;

      // Use the actual enabled state, not enabledOrder which can be stale
      const orderedStepKeys = ['seed', 'soak', 'stack', 'light', 'humidity_dome', 'blackout', 'cover_soil'];

      for (const stepKey of orderedStepKeys) {
        const config = stateMap[stepKey];
        if (!config) continue;

        const stepState = config.state;
        if (!stepState.enabled) continue;

        const stepData: any = {
          step_type: stepKey,
          step_order: stepOrder++,
        };

        if (stepKey === 'cover_soil' || stepKey === 'seed') {
          stepData.duration_hours = null;
        } else if (stepState.duration) {
          // Convert duration to hours (assume days except for soak which is hours)
          const durationHours = stepKey === 'soak' ? stepState.duration : (stepState.duration * 24);
          stepData.duration_hours = durationHours;
        } else {
          continue;
        }

        if (config.hasNotes && 'notes' in stepState) {
          if (stepKey === 'humidity_dome' && stepState.countTowardsDays) {
            stepData.notes = `${stepState.notes || ''}[COUNT_DAYS]`.trim();
          } else {
            stepData.notes = stepState.notes || null;
          }
        }

        newSteps.push(stepData);
      }

      for (const step of newSteps) {
        await apiClient.createGrowthStep(selectedCropId, step);
      }

      if (cropNotes.trim()) {
        await apiClient.updateCrop(selectedCropId, { notes: cropNotes });
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

  if (loading) {
    return (
      <Layout>
        <div className="text-center">Loading crops...</div>
      </Layout>
    );
  }

  const selectedCrop = crops.find((c) => c.id === selectedCropId);

  const getTotalGrowthDays = (cropId: string) => {
    if (cropId === selectedCropId) {
      let total = (stack.duration || 0) + (lightPhase.duration || 0) + (blackoutPhase.duration || 0) + (coverSoil.duration || 0);
      if (humidityDome.countTowardsDays) {
        total += (humidityDome.duration || 0);
      }
      return total;
    }
    const cropSteps = allCropSteps[cropId] || [];
    if (cropSteps.length === 0) {
      const crop = crops.find((c) => c.id === cropId);
      return crop?.total_growth_days || 0;
    }
    let total = 0;
    cropSteps.forEach(step => {
      if (step.step_type === 'humidity_dome') {
        const countDays = step.notes?.includes('[COUNT_DAYS]');
        if (countDays && step.duration_hours) {
          total += Math.round(step.duration_hours / 24);
        }
      } else if (step.step_type !== 'soak' && step.duration_hours) {
        total += Math.round(step.duration_hours / 24);
      }
    });
    return total;
  };

  return (
    <Layout>
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
                      <p className="text-sm font-bold text-green-600 mt-0.5">{getTotalGrowthDays(crop.id)}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Right panel: Grow Procedure */}
        {selectedCrop && (
          <Card className="overflow-hidden flex flex-col p-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">{selectedCrop.name_en}</h2>
              <div className="text-right">
                <p className="text-xs text-gray-600 font-medium">Total Growth Days</p>
                <p className="text-xl font-bold text-green-600">
                  {getTotalGrowthDays(selectedCropId)}
                </p>
              </div>
            </div>

            <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
              {/* Timeline visualization - shows steps from database */}
              {steps.length > 0 && (
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-start gap-2 overflow-x-auto">
                    {[...steps].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0)).map((step, idx, sorted) => {
                      const typeMap: Record<string, any> = {
                        seed: { icon: STEP_ICONS.seed, label: 'Seed', unit: '' },
                        soak: { icon: STEP_ICONS.soak, label: 'Soak', unit: 'hours' },
                        soaking: { icon: STEP_ICONS.soak, label: 'Soak', unit: 'hours' },
                        stack: { icon: STEP_ICONS.stack, label: 'Stack', unit: 'days' },
                        stacking: { icon: STEP_ICONS.stack, label: 'Stack', unit: 'days' },
                        light: { icon: STEP_ICONS.light, label: 'Light', unit: 'days' },
                        under_light: { icon: STEP_ICONS.light, label: 'Light', unit: 'days' },
                        humidity_dome: { icon: STEP_ICONS.humidity_dome, label: 'Humidity', unit: 'days' },
                        dome: { icon: STEP_ICONS.humidity_dome, label: 'Humidity', unit: 'days' },
                        blackout: { icon: STEP_ICONS.blackout, label: 'Blackout', unit: 'days' },
                        cover_soil: { icon: STEP_ICONS.cover_soil, label: 'Cover Soil', unit: '' },
                      };
                      const type = step.step_type?.toLowerCase() || '';
                      const config = typeMap[type];
                      if (!config) return null;
                      const durationInDays = (hours: number) => Math.round(hours / 24);
                      const duration = type === 'soak' || type === 'soaking' ? step.duration_hours : (step.duration_hours ? durationInDays(step.duration_hours) : null);
                      return (
                        <div key={step.id} className="flex items-start gap-1 flex-shrink-0">
                          <div className="text-center min-w-17">
                            <div className="text-2xl leading-tight mb-1">{config.icon}</div>
                            <div className="text-xs font-medium text-gray-900 leading-tight mb-0.5">{config.label}</div>
                            {duration && <div className="text-sm font-bold text-green-600">{duration}</div>}
                            {duration && config.unit && <div className="text-xs font-medium text-gray-600">{config.unit}</div>}
                          </div>
                          {idx < sorted.length - 1 && <div className="text-lg text-gray-300 flex-shrink-0 mt-2">→</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Old timeline code - keeping for reference but not used */}
              {false && (soak.enabled || stack.enabled || lightPhase.enabled || humidityDome.enabled || blackoutPhase.enabled || coverSoil.enabled) && (
                <div style={{ padding: '8px 12px', backgroundColor: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', overflowX: 'auto' }}>
                    {soak.enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '24px', marginBottom: '2px' }}>{STEP_ICONS.soak}</div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#111827' }}>Soak</div>
                          {soak.duration && <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981', marginTop: '2px' }}>{soak.duration}</div>}
                          <div style={{ fontSize: '8px', color: '#6B7280' }}>hours</div>
                        </div>
                        {(stack.enabled || lightPhase.enabled || humidityDome.enabled || blackoutPhase.enabled || coverSoil.enabled) && <div style={{ fontSize: '14px', color: '#E5E7EB', flexShrink: 0 }}>→</div>}
                      </div>
                    )}
                    {stack.enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '24px', marginBottom: '2px' }}>{STEP_ICONS.stack}</div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#111827' }}>Stack</div>
                          {stack.duration && <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981', marginTop: '2px' }}>{stack.duration}</div>}
                          <div style={{ fontSize: '8px', color: '#6B7280' }}>days</div>
                        </div>
                        {(lightPhase.enabled || humidityDome.enabled || blackoutPhase.enabled || coverSoil.enabled) && <div style={{ fontSize: '14px', color: '#E5E7EB', flexShrink: 0 }}>→</div>}
                      </div>
                    )}
                    {lightPhase.enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '24px', marginBottom: '2px' }}>{STEP_ICONS.light}</div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#111827' }}>Light</div>
                          {lightPhase.duration && <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981', marginTop: '2px' }}>{lightPhase.duration}</div>}
                          <div style={{ fontSize: '8px', color: '#6B7280' }}>days</div>
                        </div>
                        {(humidityDome.enabled || blackoutPhase.enabled || coverSoil.enabled) && <div style={{ fontSize: '14px', color: '#E5E7EB', flexShrink: 0 }}>→</div>}
                      </div>
                    )}
                    {humidityDome.enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '24px', marginBottom: '2px' }}>{STEP_ICONS.humidity_dome}</div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#111827' }}>Humidity</div>
                          {humidityDome.duration && <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981', marginTop: '2px' }}>{humidityDome.duration}</div>}
                          <div style={{ fontSize: '8px', color: '#6B7280' }}>days</div>
                        </div>
                        {(blackoutPhase.enabled || coverSoil.enabled) && <div style={{ fontSize: '14px', color: '#E5E7EB', flexShrink: 0 }}>→</div>}
                      </div>
                    )}
                    {blackoutPhase.enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '24px', marginBottom: '2px' }}>{STEP_ICONS.blackout}</div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#111827' }}>Blackout</div>
                          {blackoutPhase.duration && <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981', marginTop: '2px' }}>{blackoutPhase.duration}</div>}
                          <div style={{ fontSize: '8px', color: '#6B7280' }}>days</div>
                        </div>
                        {coverSoil.enabled && <div style={{ fontSize: '14px', color: '#E5E7EB', flexShrink: 0 }}>→</div>}
                      </div>
                    )}
                    {coverSoil.enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '24px', marginBottom: '2px' }}>{STEP_ICONS.cover_soil}</div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#111827' }}>Cover Soil</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step controls - shows steps in the order they were enabled, all in one row */}
              <div className="flex flex-wrap gap-2 flex-1 overflow-auto content-start">
                {(() => {
                  const stepMap: Record<string, any> = {
                    seed: { icon: STEP_ICONS.seed, label: 'Seed', state: seed, setState: setSeed as any, unit: 'days', hasNotes: true },
                    soak: { icon: STEP_ICONS.soak, label: 'Soak', state: soak, setState: setSoak as any, unit: 'hours', hasNotes: false },
                    stack: { icon: STEP_ICONS.stack, label: 'Stack', state: stack, setState: setStack as any, unit: 'days', hasNotes: true },
                    light: { icon: STEP_ICONS.light, label: 'Light', state: lightPhase, setState: setLightPhase as any, unit: 'days', hasNotes: true },
                    humidity_dome: { icon: STEP_ICONS.humidity_dome, label: 'Humidity Dome', state: humidityDome, setState: setHumidityDome as any, unit: 'days', hasNotes: false, special: true },
                    blackout: { icon: STEP_ICONS.blackout, label: 'Blackout', state: blackoutPhase, setState: setBlackoutPhase as any, unit: 'days', hasNotes: true },
                    cover_soil: { icon: STEP_ICONS.cover_soil, label: 'Cover Soil', state: coverSoil, setState: setCoverSoil as any, unit: 'process', hasNotes: false },
                  };
                  const allSteps = Object.entries(stepMap).map(([key, data]) => ({ key, ...data }));
                  return allSteps.map(({ key, icon, label, state, setState, unit, hasNotes, special }) => (
                  <Card key={key} className={`flex flex-col gap-2 flex-1 min-w-50 ${state.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                    <label className="flex items-center gap-2 cursor-pointer m-0">
                      <input
                        type="checkbox"
                        disabled={!isEditing}
                        checked={state.enabled}
                        onChange={(e) => {
                          setState({ ...state, enabled: e.target.checked });
                          if (e.target.checked) {
                            setEnabledOrder([...enabledOrder, key]);
                          } else {
                            setEnabledOrder(enabledOrder.filter(k => k !== key));
                          }
                        }}
                        className="w-4 h-4 flex-shrink-0 opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-sm font-semibold text-gray-900">
                        {icon} {label}
                      </span>
                    </label>

                    {state.enabled && (
                      <div className="flex flex-col gap-2">
                        {key !== 'cover_soil' && key !== 'seed' && (
                          <div className="flex items-center gap-2">
                            <Input
                              autoFocus
                              type="number"
                              disabled={!isEditing}
                              min="1"
                              value={state.duration || ''}
                              onChange={(e) => setState({ ...state, duration: e.target.value ? parseInt(e.target.value) : null })}
                              placeholder="0"
                              className="w-16 font-semibold text-base"
                            />
                            <span className="text-xs text-gray-600 font-medium">{unit}</span>
                          </div>
                        )}

                        {special && key === 'humidity_dome' && (
                          <label className="flex items-center gap-2 cursor-pointer m-0">
                            <input
                              type="checkbox"
                              disabled={!isEditing}
                              checked={state.countTowardsDays || false}
                              onChange={(e) => setState({ ...state, countTowardsDays: e.target.checked })}
                              className="w-3.5 h-3.5 flex-shrink-0 opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-xs text-gray-900 font-medium">Count in total days</span>
                          </label>
                        )}

                        {hasNotes && 'notes' in state && (
                          <textarea
                            disabled={!isEditing}
                            value={(state as any).notes || ''}
                            onChange={(e) => setState({ ...state, notes: e.target.value })}
                            placeholder="Add notes..."
                            className={`w-full p-2 border rounded text-xs min-h-12 font-inherit box-border resize-none focus:ring-2 focus:ring-green-500 ${
                              isEditing ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                            } disabled:cursor-not-allowed`}
                          />
                        )}
                      </div>
                    )}
                  </Card>
                ));
                })()}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Crop Notes
                </label>
                <textarea
                  disabled={!isEditing}
                  value={cropNotes}
                  onChange={(e) => setCropNotes(e.target.value)}
                  placeholder="Add any notes about this crop..."
                  className={`w-full p-3 border rounded text-sm min-h-20 font-inherit box-border resize-none focus:ring-2 focus:ring-green-500 ${
                    isEditing ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                  } disabled:cursor-not-allowed`}
                />
              </div>

              <div className="flex gap-2 justify-end">
                {isEditing ? (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="primary"
                    size="md"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="primary"
                    size="md"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  );
}
