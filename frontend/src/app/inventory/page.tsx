'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/services/api';
import { validateAddGrams, validateThreshold } from '@/utils/validation';

interface SeedInventory {
  id: string;
  crop_id: string;
  quantity_grams: number;
  reorder_threshold_trays: number;
  crop?: { id: string; name_en: string; seeds_per_tray: number };
}

interface PackageInventory {
  id: string;
  variant_id: string;
  quantity_available: number;
  reorder_threshold: number;
  variant?: {
    id: string;
    size_name: string;
    size_grams: number;
    crop: { name_en: string };
  };
}

interface ModalState {
  isOpen: boolean;
  type: 'addSeed' | 'setSeedThreshold' | 'addPackage' | 'setPackageThreshold' | null;
  cropId?: string;
  variantId?: string;
  cropName?: string;
  currentValue?: number;
}

export default function InventoryPage() {
  const [seedInventory, setSeedInventory] = useState<SeedInventory[]>([]);
  const [packageInventory, setPackageInventory] = useState<PackageInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null });
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [seedRes, pkgRes] = await Promise.all([
        apiClient.getSeedInventory(),
        apiClient.getPackageInventory(),
      ]);
      setSeedInventory(seedRes.data || []);
      setPackageInventory(pkgRes.data || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      addToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: null });
    setInputValue('');
    setInputError('');
  };

  const openAddSeedModal = (cropId: string, cropName: string) => {
    setModal({ isOpen: true, type: 'addSeed', cropId, cropName });
    setInputValue('');
    setInputError('');
  };

  const openSetSeedThresholdModal = (cropId: string, cropName: string) => {
    setModal({ isOpen: true, type: 'setSeedThreshold', cropId, cropName });
    setInputValue('');
    setInputError('');
  };

  const openAddPackageModal = (variantId: string, cropName: string) => {
    setModal({ isOpen: true, type: 'addPackage', variantId, cropName });
    setInputValue('');
    setInputError('');
  };

  const openSetPackageThresholdModal = (variantId: string, cropName: string) => {
    setModal({ isOpen: true, type: 'setPackageThreshold', variantId, cropName });
    setInputValue('');
    setInputError('');
  };

  const handleAddSeedStock = async () => {
    const error = validateAddGrams(inputValue);
    if (error) {
      setInputError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const currentItem = seedInventory.find((s) => s.crop_id === modal.cropId);
      if (!currentItem) throw new Error('Seed not found');

      const newQty = currentItem.quantity_grams + parseFloat(inputValue);
      await apiClient.updateSeedInventory(modal.cropId!, { quantity_grams: newQty });
      addToast(`Added ${inputValue}g to ${modal.cropName}`, 'success');
      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Failed to update seed inventory:', error);
      addToast('Failed to add seed stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetSeedThreshold = async () => {
    const error = validateThreshold(inputValue, 'Threshold');
    if (error) {
      setInputError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.updateSeedInventory(modal.cropId!, {
        reorder_threshold_trays: parseInt(inputValue, 10),
      });
      addToast(`Set threshold to ${inputValue} trays for ${modal.cropName}`, 'success');
      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Failed to update threshold:', error);
      addToast('Failed to set threshold', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPackageStock = async () => {
    const error = validateAddGrams(inputValue);
    if (error) {
      setInputError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const currentItem = packageInventory.find((p) => p.variant_id === modal.variantId);
      if (!currentItem) throw new Error('Package variant not found');

      const newQty = currentItem.quantity_available + parseInt(inputValue, 10);
      await apiClient.updatePackageInventory(modal.variantId!, {
        quantity_available: newQty,
      });
      addToast(`Added ${inputValue} units to ${modal.cropName}`, 'success');
      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Failed to update package inventory:', error);
      addToast('Failed to add package stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPackageThreshold = async () => {
    const error = validateThreshold(inputValue, 'Threshold');
    if (error) {
      setInputError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.updatePackageInventory(modal.variantId!, {
        reorder_threshold: parseInt(inputValue, 10),
      });
      addToast(`Set threshold to ${inputValue} units for ${modal.cropName}`, 'success');
      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Failed to update package threshold:', error);
      addToast('Failed to set threshold', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatus = (available: number, threshold: number): 'ok' | 'low' | 'out' => {
    if (available >= threshold) return 'ok';
    if (available > 0) return 'low';
    return 'out';
  };

  const totalSeeds = seedInventory.reduce((sum, s) => sum + s.quantity_grams, 0);
  const totalPackages = packageInventory.reduce((sum, p) => sum + p.quantity_available, 0);
  const lowStockSeeds = seedInventory.filter(
    (s) => (s.quantity_grams / (s.crop?.seeds_per_tray || 50)) < s.reorder_threshold_trays
  ).length;
  const lowStockPackages = packageInventory.filter(
    (p) => p.quantity_available < p.reorder_threshold
  ).length;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Total Seed" subtitle="Grams">
            <div className="text-3xl font-bold text-green-600">{totalSeeds.toFixed(0)}g</div>
          </Card>
          <Card
            title="Low Stock Seeds"
            subtitle="Items below threshold"
            variant={lowStockSeeds > 0 ? 'alert' : 'default'}
          >
            <div className={`text-3xl font-bold ${lowStockSeeds > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {lowStockSeeds}
            </div>
          </Card>
          <Card title="Total Packages" subtitle="Units">
            <div className="text-3xl font-bold text-green-600">{totalPackages}</div>
          </Card>
          <Card
            title="Low Stock Packages"
            subtitle="Items below threshold"
            variant={lowStockPackages > 0 ? 'alert' : 'default'}
          >
            <div className={`text-3xl font-bold ${lowStockPackages > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {lowStockPackages}
            </div>
          </Card>
        </div>

        {/* Seed Inventory Table */}
        {loading ? (
          <Card>
            <div className="text-center py-8 text-gray-500">Loading inventory...</div>
          </Card>
        ) : (
          <>
            <Card title="Seed Inventory">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Crop</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Quantity (g)</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Trays</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Threshold</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seedInventory.map((item) => {
                      const trays = item.crop ? item.quantity_grams / item.crop.seeds_per_tray : 0;
                      const status = getStatus(trays, item.reorder_threshold_trays);
                      return (
                        <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{item.crop?.name_en || 'Unknown'}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.quantity_grams.toFixed(0)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{trays.toFixed(1)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.reorder_threshold_trays}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-4 py-3 text-center space-x-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                openAddSeedModal(item.crop_id, item.crop?.name_en || 'Unknown')
                              }
                            >
                              + Add
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                openSetSeedThresholdModal(item.crop_id, item.crop?.name_en || 'Unknown')
                              }
                            >
                              Set
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Package Inventory Table */}
            <Card title="Package Inventory">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Variant</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Available</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Threshold</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packageInventory.map((item) => {
                      const status = getStatus(item.quantity_available, item.reorder_threshold);
                      return (
                        <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">
                            {item.variant?.crop.name_en} • {item.variant?.size_name}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.quantity_available}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.reorder_threshold}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-4 py-3 text-center space-x-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                openAddPackageModal(
                                  item.variant_id,
                                  `${item.variant?.crop.name_en} • ${item.variant?.size_name}`
                                )
                              }
                            >
                              + Add
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                openSetPackageThresholdModal(
                                  item.variant_id,
                                  `${item.variant?.crop.name_en} • ${item.variant?.size_name}`
                                )
                              }
                            >
                              Set
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={modal.isOpen && modal.type === 'addSeed'}
        title={`Add Seed Stock — ${modal.cropName}`}
        onClose={closeModal}
        onSubmit={handleAddSeedStock}
        submitText="Add Stock"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <Input
            label="Grams to add"
            type="number"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError('');
            }}
            error={inputError}
            placeholder="0"
            min="0"
            step="0.1"
            autoFocus
          />
          <p className="text-xs text-gray-500">Enter the amount of grams to add to inventory</p>
        </div>
      </Modal>

      <Modal
        isOpen={modal.isOpen && modal.type === 'setSeedThreshold'}
        title={`Set Reorder Threshold — ${modal.cropName}`}
        onClose={closeModal}
        onSubmit={handleSetSeedThreshold}
        submitText="Set Threshold"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <Input
            label="Threshold (trays)"
            type="number"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError('');
            }}
            error={inputError}
            placeholder="20"
            min="1"
            step="1"
            autoFocus
          />
          <p className="text-xs text-gray-500">Set the minimum number of trays to keep in stock</p>
        </div>
      </Modal>

      <Modal
        isOpen={modal.isOpen && modal.type === 'addPackage'}
        title={`Add Package Stock — ${modal.cropName}`}
        onClose={closeModal}
        onSubmit={handleAddPackageStock}
        submitText="Add Stock"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <Input
            label="Units to add"
            type="number"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError('');
            }}
            error={inputError}
            placeholder="0"
            min="0"
            step="1"
            autoFocus
          />
          <p className="text-xs text-gray-500">Enter the number of units to add to inventory</p>
        </div>
      </Modal>

      <Modal
        isOpen={modal.isOpen && modal.type === 'setPackageThreshold'}
        title={`Set Reorder Threshold — ${modal.cropName}`}
        onClose={closeModal}
        onSubmit={handleSetPackageThreshold}
        submitText="Set Threshold"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <Input
            label="Threshold (units)"
            type="number"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError('');
            }}
            error={inputError}
            placeholder="20"
            min="1"
            step="1"
            autoFocus
          />
          <p className="text-xs text-gray-500">Set the minimum number of units to keep in stock</p>
        </div>
      </Modal>
    </Layout>
  );
}
