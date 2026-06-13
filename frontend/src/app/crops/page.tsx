'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { apiClient } from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import { useToast } from '@/context/ToastContext';

interface GrowthStep {
  id?: string;
  crop_id?: string;
  step_order?: number;
  step_type: string;
  duration_hours?: number | null;
  notes?: string;
}

interface Crop {
  id: string;
  name_en: string;
  name_de: string;
  flavor?: string;
  photo_url?: string;
  seeds_per_tray: number;
  yield_per_tray: number;
  total_growth_days: number;
  seeding_schedule: string;
  status: string;
  variants?: Array<{
    id: string;
    size_name: string;
    size_grams: number;
    price_eur: number;
  }>;
  growth_steps?: GrowthStep[];
}

const STEP_TYPES = ['soak', 'seed', 'stack', 'blackout', 'humidity_dome', 'light', 'cover_soil', 'harvest'];

const getCropStatusBadgeType = (status: string): 'ok' | 'low' | 'out' | 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'active':
      return 'ok';
    case 'paused':
      return 'warning';
    case 'inactive':
      return 'error';
    default:
      return 'ok';
  }
};

export default function CropsPage() {
  const { addToast } = useToast();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'paused'>('active');
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCrop, setIsNewCrop] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [newVariant, setNewVariant] = useState({ size_name: '', size_grams: '', price_eur: '' });
  const [variantType, setVariantType] = useState<'container' | 'grams'>('grams');
  const [newStep, setNewStep] = useState({ step_type: 'seed', duration_hours: '', notes: '' });
  const [variants, setVariants] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name_en: '',
    name_de: '',
    flavor: '',
    seeds_per_tray: '',
    yield_per_tray: '',
    total_growth_days: '',
    seeding_schedule: 'TUESDAY',
    status: 'active',
  });

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getCrops({});
      setCrops(res.data || []);
    } catch (error) {
      console.error('Failed to load crops:', error);
      addToast('Failed to load crops from V2 Supabase', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  useEffect(() => {
    setSelectedCropId(null);
    setIsNewCrop(false);
    setIsEditing(false);
  }, [activeTab]);

  useEffect(() => {
    if (selectedCropId && !isNewCrop) {
      const crop = crops.find((c) => c.id === selectedCropId);
      if (crop) {
        setFormData({
          name_en: crop.name_en || '',
          name_de: crop.name_de || '',
          flavor: crop.flavor || '',
          seeds_per_tray: crop.seeds_per_tray ? crop.seeds_per_tray.toString() : '',
          yield_per_tray: crop.yield_per_tray ? crop.yield_per_tray.toString() : '',
          total_growth_days: crop.total_growth_days ? crop.total_growth_days.toString() : '',
          seeding_schedule: crop.seeding_schedule || 'TUESDAY',
          status: crop.status || 'active',
        });
        setVariants(crop.variants || []);
        setSteps(
          crop.growth_steps?.map((s: any) => ({
            step_type: s.step_type,
            duration_hours: s.duration_hours,
            notes: s.notes || '',
          })) || []
        );
        setPhotoPreview(crop.photo_url || '');
        setPhotoFile(null);
      }
    }
  }, [selectedCropId, crops]);

  const selectedCrop = crops.find((c) => c.id === selectedCropId);
  const filteredCrops = crops.filter((c) => {
    const isMatchingTab = activeTab === 'active'
      ? (c.status === 'active' || c.status === 'available')
      : c.status === activeTab;
    const isMatchingSearch = c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name_de.toLowerCase().includes(searchQuery.toLowerCase());
    return isMatchingTab && isMatchingSearch;
  });

  const handleAddVariant = () => {
    if (!newVariant.size_name || !newVariant.price_eur) return;
    const sizeGrams =
      variantType === 'container' ? 0 : (newVariant.size_grams ? parseFloat(newVariant.size_grams) : 0);
    setVariants([
      ...variants,
      {
        size_name: variantType === 'container' ? 'Container' : newVariant.size_name,
        size_grams: sizeGrams,
        price_eur: newVariant.price_eur ? parseFloat(newVariant.price_eur) : 0,
      },
    ]);
    setNewVariant({ size_name: '', size_grams: '', price_eur: '' });
    setVariantType('grams');
  };

  const handleAddStep = () => {
    if (!newStep.step_type) return;
    setSteps([
      ...steps,
      {
        step_type: newStep.step_type,
        duration_hours: newStep.duration_hours ? parseInt(newStep.duration_hours) : null,
        notes: newStep.notes,
      },
    ]);
    setNewStep({ step_type: 'seed', duration_hours: '', notes: '' });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.name_en || !formData.name_de || !formData.seeds_per_tray || !formData.yield_per_tray || !formData.total_growth_days) {
      addToast('Please fill in all required fields: Name (EN), Name (DE), Seeds/Tray, Yield/Tray, Total Growth Days', 'error');
      return;
    }

    try {
      const cropData = {
        name_en: formData.name_en,
        name_de: formData.name_de,
        flavor: formData.flavor || null,
        seeds_per_tray: formData.seeds_per_tray ? parseFloat(formData.seeds_per_tray) : 0,
        yield_per_tray: formData.yield_per_tray ? parseFloat(formData.yield_per_tray) : 0,
        total_growth_days: formData.total_growth_days ? parseInt(formData.total_growth_days) : 0,
        seeding_schedule: formData.seeding_schedule,
        status: formData.status,
      };

      let crop;
      if (isNewCrop) {
        const response = await apiClient.createCrop(cropData);
        crop = response.data;
      } else if (selectedCropId) {
        const response = await apiClient.updateCrop(selectedCropId, cropData);
        crop = response.data;
      } else {
        addToast('No crop selected', 'error');
        return;
      }

      if (photoFile) {
        await apiClient.uploadCropPhoto(crop.id, photoFile);
      }

      // TODO: Fix growth steps API and enable this
      // for (const step of steps) {
      //   const payload: any = {
      //     crop_id: crop.id,
      //     step_type: step.step_type,
      //     notes: step.notes || null,
      //   };
      //   if (step.duration_hours !== null && step.duration_hours !== undefined && step.duration_hours > 0) {
      //     payload.duration_hours = step.duration_hours;
      //   }
      //   await apiClient.createGrowthStep(payload);
      // }

      // Only save variants for new crops or if variants were actually modified
      if (isNewCrop && variants.length > 0) {
        for (const variant of variants) {
          await apiClient.createVariant(crop.id, {
            size_name: variant.size_name,
            size_grams: parseFloat(variant.size_grams.toString()),
            price_eur: parseFloat(variant.price_eur.toString()),
          });
        }
      }

      setIsNewCrop(false);
      setFormData({
        name_en: crop.name_en,
        name_de: crop.name_de,
        flavor: crop.flavor || '',
        seeds_per_tray: crop.seeds_per_tray.toString(),
        yield_per_tray: crop.yield_per_tray.toString(),
        total_growth_days: crop.total_growth_days.toString(),
        seeding_schedule: crop.seeding_schedule || 'TUESDAY',
        status: crop.status || 'active',
      });
      setSelectedCropId(crop.id);
      setPhotoPreview(crop.photo_url || '');
      setPhotoFile(null);
      setVariants([]);
      setSteps([]);
      addToast('Crop saved successfully', 'success');

      const newStatus = crop.status as 'active' | 'paused';
      if (newStatus !== activeTab) {
        setActiveTab(newStatus);
      }

      setIsEditing(false);
      fetchCrops();
    } catch (error) {
      console.error('Failed to save crop:', error);
      addToast(`Error saving crop: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleSelectCrop = (cropId: string) => {
    const crop = crops.find((c) => c.id === cropId);
    if (crop && crop.status !== activeTab) {
      return;
    }
    setSelectedCropId(cropId);
    setIsNewCrop(false);
    setIsEditing(false);
    // Populate form immediately
    if (crop) {
      setFormData({
        name_en: crop.name_en || '',
        name_de: crop.name_de || '',
        flavor: crop.flavor || '',
        seeds_per_tray: crop.seeds_per_tray ? crop.seeds_per_tray.toString() : '',
        yield_per_tray: crop.yield_per_tray ? crop.yield_per_tray.toString() : '',
        total_growth_days: crop.total_growth_days ? crop.total_growth_days.toString() : '',
        seeding_schedule: crop.seeding_schedule || 'TUESDAY',
        status: crop.status || 'active',
      });
      setVariants(crop.variants || []);
      setSteps(crop.growth_steps?.map((s: any) => ({
        step_type: s.step_type || s.stage,
        duration_hours: s.duration_hours || (s.duration ? s.duration * 24 : null),
        notes: s.notes || '',
      })) || []);
      setPhotoPreview(crop.photo_url || '');
    }
  };

  const handleNewCrop = () => {
    setIsNewCrop(true);
    setSelectedCropId(null);
    setIsEditing(true);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_de: '',
      flavor: '',
      seeds_per_tray: '',
      yield_per_tray: '',
      total_growth_days: '',
      seeding_schedule: 'TUESDAY',
      status: 'active',
    });
    setVariants([]);
    setSteps([]);
    setPhotoFile(null);
    setPhotoPreview('');
    setNewVariant({ size_name: '', size_grams: '', price_eur: '' });
    setNewStep({ step_type: 'seed', duration_hours: '', notes: '' });
  };

  const handleDelete = async () => {
    if (!selectedCropId) return;
    try {
      await apiClient.deleteCrop(selectedCropId);
      setShowDeleteConfirm(false);
      resetForm();
      setSelectedCropId(null);
      addToast('Crop deleted successfully', 'success');
      fetchCrops();
    } catch (error) {
      console.error('Failed to delete crop:', error);
      addToast('Failed to delete crop', 'error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedCropId) return;
    try {
      await apiClient.updateCrop(selectedCropId, { status: newStatus });
      await fetchCrops();
      setActiveTab(newStatus as 'active' | 'paused');
      setSelectedCropId(null);
      addToast(`Crop ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'success');
    } catch (error) {
      console.error('Failed to update status:', error);
      addToast('Failed to update crop status', 'error');
    }
  };

  const statusCounts = {
    active: crops.filter((c) => c.status === 'active' || c.status === 'available').length,
    paused: crops.filter((c) => c.status === 'paused').length,
  };

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

        {/* Status Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {(['active', 'paused'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                activeTab === status
                  ? 'text-green-600 border-green-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {status === 'active' ? 'Active' : 'Paused'} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* List-Detail Split View */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-[400px_1fr] gap-6 h-[calc(100vh-280px)]">
            {/* LEFT: Crop List */}
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

              {/* List Items */}
              <div className="flex-1 overflow-y-auto">
                {filteredCrops.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => handleSelectCrop(crop.id)}
                    className={`w-full p-3 border-b border-gray-100 text-left transition-colors flex gap-3 items-start focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      selectedCropId === crop.id
                        ? 'bg-blue-50 border-l-4 border-l-green-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-15 h-20 flex-shrink-0 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-2xl flex-none"
                      style={{
                        backgroundImage: crop.photo_url ? `url(${crop.photo_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {!crop.photo_url && '🌱'}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 break-words">{crop.name_en}</p>
                      <p className="text-xs text-gray-600 mt-1 break-words">{crop.name_de}</p>
                    </div>
                    {/* Status Badge - Right */}
                    <div className="flex-shrink-0 flex items-center">
                      <StatusBadge status={getCropStatusBadgeType(crop.status)} label={crop.status} />
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* RIGHT: Detail Panel */}
            {isNewCrop || (selectedCrop && selectedCrop.id === selectedCropId) ? (
              <Card className="overflow-hidden flex flex-col p-0">
                {/* Detail Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">{isNewCrop ? 'New Crop' : selectedCrop?.name_en}</h2>
                  {!isNewCrop && (
                    <div className="flex gap-2">
                      <Button
                        variant={formData.status === 'active' ? 'warning' : 'success'}
                        size="sm"
                        onClick={() => {
                          const newStatus = formData.status === 'active' ? 'paused' : 'active';
                          setFormData({ ...formData, status: newStatus });
                          handleStatusChange(newStatus);
                        }}
                      >
                        {formData.status === 'active' ? 'Pause' : 'Resume'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* BASIC INFO */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-4 pb-2 border-b border-gray-200">Basic Information</h3>

                    {/* Photo */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Photo</label>
                      <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                        {/* Photo Preview */}
                        <div
                          className="w-30 h-40 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-4xl flex-none"
                          style={{
                            backgroundImage: photoPreview ? `url(${photoPreview})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          {!photoPreview && '📷'}
                        </div>
                        {/* Upload Controls */}
                        <button
                          className={`p-4 rounded-lg border-2 border-dashed text-center transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            isEditing
                              ? 'bg-gray-50 border-gray-300 hover:border-green-600 cursor-pointer'
                              : 'bg-gray-100 border-gray-300 opacity-60 cursor-default pointer-events-none'
                          }`}
                          onDragOver={(e) => {
                            if (!isEditing) {
                              e.preventDefault();
                              return;
                            }
                            e.preventDefault();
                            e.currentTarget.classList.add('bg-gray-100', 'border-green-600');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-gray-100', 'border-green-600');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-gray-100', 'border-green-600');
                            const file = e.dataTransfer.files[0];
                            if (file) {
                              setPhotoFile(file);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setPhotoPreview(event.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          onClick={(e) => {
                            if (isEditing) {
                              const input = document.getElementById('photo-input') as HTMLInputElement;
                              input?.click();
                            }
                          }}
                          disabled={!isEditing}
                        >
                          <p className="text-sm font-medium text-gray-900 mb-1">Drag & drop photo</p>
                          <p className="text-xs text-gray-600">or click to browse</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPhotoFile(file);
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setPhotoPreview(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                            id="photo-input"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Names */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Input
                        label="Name (EN)"
                        type="text"
                        disabled={!isEditing}
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      />
                      <Input
                        label="Name (DE)"
                        type="text"
                        disabled={!isEditing}
                        value={formData.name_de}
                        onChange={(e) => setFormData({ ...formData, name_de: e.target.value })}
                      />
                    </div>

                    {/* Flavor */}
                    <div className="mb-4">
                      <Input
                        label="Flavor Profile"
                        type="text"
                        disabled={!isEditing}
                        value={formData.flavor}
                        onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                        placeholder="e.g., Peppery, mild, fresh"
                      />
                    </div>

                    {/* Growing Parameters */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Input
                        label="Seeds/Tray (g)"
                        type="number"
                        disabled={!isEditing}
                        value={formData.seeds_per_tray}
                        onChange={(e) => setFormData({ ...formData, seeds_per_tray: e.target.value })}
                      />
                      <Input
                        label="Yield/Tray (g)"
                        type="number"
                        disabled={!isEditing}
                        value={formData.yield_per_tray}
                        onChange={(e) => setFormData({ ...formData, yield_per_tray: e.target.value })}
                      />
                    </div>

                    {/* Growth Days & Schedule */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Input
                        label="Total Growth Days"
                        type="number"
                        disabled={!isEditing}
                        value={formData.total_growth_days}
                        onChange={(e) => {
                          const days = parseInt(e.target.value) || 0;
                          const newSchedule = days <= 10 ? 'FRIDAY' : 'TUESDAY';
                          setFormData({ ...formData, total_growth_days: e.target.value, seeding_schedule: newSchedule });
                        }}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Seeding Schedule</label>
                        <select
                          disabled={!isEditing}
                          value={formData.seeding_schedule}
                          onChange={(e) => setFormData({ ...formData, seeding_schedule: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                            isEditing
                              ? 'bg-white border-gray-300 text-gray-900 cursor-pointer'
                              : 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          <option value="TUESDAY">Tuesday</option>
                          <option value="FRIDAY">Friday</option>
                        </select>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
                      <select
                        disabled={!isEditing}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                          isEditing
                            ? 'bg-white border-gray-300 text-gray-900 cursor-pointer'
                            : 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
                  {isEditing || isNewCrop ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          if (isNewCrop) {
                            resetForm();
                            setSelectedCropId(null);
                            setIsNewCrop(false);
                          } else {
                            handleSelectCrop(selectedCropId!);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave}
                      >
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          resetForm();
                          setSelectedCropId(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="flex items-center justify-center h-full text-gray-500">
                <p>Select a crop to view details</p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
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
