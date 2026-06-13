'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
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
  step_type: string;
  duration_hours?: number;
  notes?: string;
  step_order: number;
}

const STEP_ICONS: Record<string, string> = {
  seed: '🌱',
  soak: '💧',
  stack: '📚',
  light: '💡',
  humidity_dome: '💨',
  blackout: '🌑',
  cover_soil: '🌍',
  soaking: '💧',
  seeding: '🌱',
  stacking: '📚',
  under_light: '💡',
  dome: '💨',
};

export default function GrowProcedurePage() {
  const { addToast } = useToast();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [cropSteps, setCropSteps] = useState<GrowthStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);

  useEffect(() => {
    loadCrops();
  }, []);

  useEffect(() => {
    if (selectedCropId) {
      loadCropDetails();
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

  const loadCropDetails = async () => {
    try {
      const response = await apiClient.getCrop(selectedCropId);
      const crop = response.data;
      if (crop && crop.growth_steps) {
        setCropSteps(crop.growth_steps);
      }
    } catch (error) {
      console.error('Failed to load crop details:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading crops...</div>
      </Layout>
    );
  }

  const selectedCrop = crops.find((c) => c.id === selectedCropId);

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
                <div className="flex gap-3 items-start">
                  <div
                    className="w-15 h-20 flex-shrink-0 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xl bg-cover bg-center"
                    style={crop.photo_url ? { backgroundImage: `url(${crop.photo_url})` } : {}}
                  >
                    {!crop.photo_url && '🌱'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 break-words">{crop.name_en}</p>
                    <p className="text-xs text-gray-600 mt-0.5 break-words">{crop.name_de}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Right panel: Growth phases tracker */}
        {selectedCrop && (
          <Card className="overflow-hidden flex flex-col p-0">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">{selectedCrop.name_en}</h2>
              <p className="text-sm text-gray-600 mt-1">Growth Phases ({cropSteps.length})</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cropSteps.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No growth phases defined for this crop</div>
              ) : (
                <div className="space-y-3">
                  {cropSteps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => setCurrentPhaseIndex(index)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        currentPhaseIndex === index
                          ? 'border-green-600 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl flex-shrink-0">
                          {STEP_ICONS[step.step_type] || '•'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 capitalize">{step.step_type}</p>
                          {step.duration_hours !== null && step.duration_hours !== undefined && (
                            <p className="text-sm text-gray-600 mt-1">
                              Duration: {step.duration_hours} hour{step.duration_hours !== 1 ? 's' : ''}
                              {' '}
                              ({Math.round(step.duration_hours / 24)} days)
                            </p>
                          )}
                          {step.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">{step.notes}</p>
                          )}
                        </div>
                        {currentPhaseIndex === index && (
                          <StatusBadge status="ok" label="Current" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {cropSteps.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Current Phase:</span>{' '}
                  <span className="text-green-600 font-semibold">
                    {cropSteps[currentPhaseIndex]?.step_type} (Phase {currentPhaseIndex + 1} of {cropSteps.length})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentPhaseIndex + 1) / cropSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}
