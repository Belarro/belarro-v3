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

interface Variant {
  id: string;
  crop_id: string;
  size_name: string;
  size_grams: number;
  price_eur: number;
}

export default function SizesPricesPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [allCropVariants, setAllCropVariants] = useState<Record<string, Variant[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sizeType, setSizeType] = useState('grams');
  const [sizeGrams, setSizeGrams] = useState('');
  const [priceEur, setPriceEur] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.getCrops({ status: 'active' });
        setCrops(res.data || []);
        if (res.data?.[0]) {
          setSelectedCropId(res.data[0].id);
          await loadAllVariants(res.data);
        }
      } catch (err) {
        console.error('Load crops failed:', err);
        addToast('Failed to load crops', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCropId) return;
    const load = async () => {
      try {
        const res = await apiClient.getVariants(selectedCropId);
        setVariants(res.data || []);
      } catch (err) {
        console.error('Load variants failed:', err);
        addToast('Failed to load variants', 'error');
      }
    };
    load();
  }, [selectedCropId]);

  const loadAllVariants = async (cropsData: Crop[]) => {
    try {
      const variantsMap: Record<string, Variant[]> = {};
      for (const crop of cropsData) {
        const res = await apiClient.getVariants(crop.id);
        variantsMap[crop.id] = res.data || [];
      }
      setAllCropVariants(variantsMap);
    } catch (err) {
      console.error('Load all variants failed:', err);
    }
  };

  const handleAddSize = async () => {
    if (!selectedCropId || !sizeGrams.trim() || !priceEur.trim()) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    const grams = parseInt(sizeGrams);
    const price = parseFloat(priceEur);

    if (isNaN(grams) || grams <= 0 || isNaN(price) || price <= 0) {
      addToast('Please enter valid numbers', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.createVariant(selectedCropId, {
        size_name: `${grams}g`,
        size_grams: grams,
        price_eur: price,
      });

      if (res.data) {
        const updated = [...variants, res.data];
        setVariants(updated);
        const updatedAll = { ...allCropVariants };
        updatedAll[selectedCropId] = updated;
        setAllCropVariants(updatedAll);
        setSizeGrams('');
        setPriceEur('');
        setSizeType('grams');
        addToast('Size added', 'success');
      } else {
        addToast('Failed to add size', 'error');
      }
    } catch (err) {
      console.error('Add size error:', err);
      addToast('Error adding size', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      setSaving(true);
      await apiClient.deleteVariant(selectedCropId, variantId);
      const updated = variants.filter(v => v.id !== variantId);
      setVariants(updated);
      const updatedAll = { ...allCropVariants };
      updatedAll[selectedCropId] = updated;
      setAllCropVariants(updatedAll);
      addToast('Size deleted', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      addToast('Failed to delete', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Layout><div className="text-center">Loading crops...</div></Layout>;
  }

  const selectedCrop = crops.find(c => c.id === selectedCropId);

  return (
    <Layout>
      <div className="grid grid-cols-[400px_1fr] gap-6 h-[calc(100vh-280px)]">
        {/* Left sidebar: Crop list */}
        <Card className="overflow-hidden p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => {
                  setSelectedCropId(crop.id);
                  setIsEditing(false);
                }}
                className={`w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-green-500 focus:outline-none ${
                  selectedCropId === crop.id ? 'bg-blue-100 border-l-4 border-l-green-500 pl-2' : ''
                }`}
              >
                <div className="flex gap-3 flex-1 min-w-0 justify-between">
                  <div className="flex gap-2.5 flex-1 min-w-0">
                    <div
                      className="w-15 h-20 flex-shrink-0 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xl bg-cover bg-center"
                      style={crop.photo_url ? { backgroundImage: `url(${crop.photo_url})` } : {}}
                    >
                      {!crop.photo_url && '🌱'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 break-words">{crop.name_en}</p>
                      <p className="text-xs text-gray-600 mt-0.5 break-words">{crop.name_de}</p>
                      <div className="mt-2">
                        <StatusBadge status={crop.status === 'active' ? 'ok' : 'out'} label={crop.status} />
                      </div>
                    </div>
                  </div>

                  {allCropVariants[crop.id]?.length > 0 && (
                    <div className="text-right flex-shrink-0 text-xs text-gray-600 leading-snug">
                      {allCropVariants[crop.id].map((v) => (
                        <div key={v.id}>
                          {v.size_name} • €{v.price_eur.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Right panel: Sizes & Prices editor */}
        {selectedCrop && (
          <Card className="overflow-hidden flex flex-col p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">{selectedCrop.name_en}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col">
              {/* Current sizes table */}
              {variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3 pb-2 border-b border-gray-200">Current Sizes</h3>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="p-2 text-left text-xs font-semibold text-gray-600">Size</th>
                        <th className="p-2 text-left text-xs font-semibold text-gray-600">Price (€)</th>
                        {isEditing && <th className="p-2 text-center text-xs font-semibold text-gray-600">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((variant) => (
                        <tr key={variant.id} className="border-b border-gray-100">
                          <td className="p-2">{variant.size_name}</td>
                          <td className="p-2">€{variant.price_eur.toFixed(2)}</td>
                          {isEditing && (
                            <td className="p-2 text-center">
                              <Button
                                onClick={() => handleDeleteVariant(variant.id)}
                                disabled={saving}
                                variant="danger"
                                size="sm"
                              >
                                Delete
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add new size form - only visible when editing */}
              {isEditing && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3 pb-2 border-b border-gray-200">Add New Size</h3>

                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <div>
                      <label className="block text-xs font-medium mb-1">Type</label>
                      <select
                        value={sizeType}
                        onChange={(e) => setSizeType(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="grams">Grams (g)</option>
                        <option value="box">Box</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {sizeType === 'grams' ? 'Grams' : 'Grams (internal)'}
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={sizeGrams}
                        onChange={(e) => setSizeGrams(e.target.value)}
                        placeholder={sizeType === 'grams' ? 'e.g., 225' : 'e.g., 30'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Price (€)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceEur}
                        onChange={(e) => setPriceEur(e.target.value)}
                        placeholder="e.g., 18.50"
                      />
                    </div>

                    <Button
                      onClick={handleAddSize}
                      disabled={saving}
                      variant="success"
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex-1" />

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                {isEditing ? (
                  <>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setSizeGrams('');
                        setPriceEur('');
                        setSizeType('grams');
                      }}
                      variant="secondary"
                      size="md"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        setIsEditing(false);
                        setSizeGrams('');
                        setPriceEur('');
                        setSizeType('grams');
                        await loadAllVariants(crops);
                      }}
                      variant="primary"
                      size="md"
                    >
                      Save
                    </Button>
                  </>
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
