// resources/js/pages/admin/price-control/index.tsx

import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import AppLayout from '@/layouts/admin-layout';

interface PriceControl {
  id: number;
  category: string;
  price: number;
  unit: 'per_head' | 'per_kg';
  created_at: string;
  updated_at: string;
}

interface Props {
  priceControls: Record<string, PriceControl>;
}

export default function PriceControlManagement({ priceControls }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editUnit, setEditUnit] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<PriceControl | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState<'per_head' | 'per_kg'>('per_head');
  const [adding, setAdding] = useState(false);

  const handleEdit = (control: PriceControl) => {
    setEditingId(control.id);
    setEditPrice(control.price.toString());
    setEditUnit(control.unit);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditPrice('');
    setEditUnit('');
  };

  const handleSave = (id: number) => {
    router.put(`/admin/price-control/${id}`, {
      price: parseFloat(editPrice),
      unit: editUnit,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingId(null);
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    
    router.delete(`/admin/price-control/${deleteTarget.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  };

  const handleAddNew = () => {
    setAdding(true);
    router.post('/admin/price-control', {
      category: newCategory,
      price: parseFloat(newPrice),
      unit: newUnit,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setShowAddDialog(false);
        setNewCategory('');
        setNewPrice('');
        setNewUnit('per_head');
        setAdding(false);
      },
      onError: () => setAdding(false),
    });
  };

  const controlsList = Object.values(priceControls);

  return (
    <AppLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Price Control
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage pricing templates for marketplace listings
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {controlsList.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Categories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {controlsList.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleDateString()}
              </p>
            </Card>
          </div>

          {/* Price Control Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {controlsList.map((control) => (
                    <tr key={control.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {control.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === control.id ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              ₱
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="pl-7 w-32"
                              size={10}
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-white">
                            ₱{control.price.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === control.id ? (
                          <Select value={editUnit} onValueChange={setEditUnit}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_head">Per Head</SelectItem>
                              <SelectItem value="per_kg">Per Kg</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-white">
                            {control.unit === 'per_head' ? 'Per Head' : 'Per Kg'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(control.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === control.id ? (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleSave(control.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(control)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget(control)}
                              disabled={control.category === 'piglet' || control.category === 'fattening'}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Empty State */}
          {controlsList.length === 0 && (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Price Templates Found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create your first price template to start managing pricing.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Add Template Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Price Template</DialogTitle>
            <DialogDescription>
              Create a new pricing template for a livestock category.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Category Name
              </label>
              <Input
                placeholder="e.g., breeder, weanling"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value.toLowerCase())}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Price Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₱
                </span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Pricing Unit
              </label>
              <Select value={newUnit} onValueChange={(value) => setNewUnit(value as 'per_head' | 'per_kg')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_head">Per Head</SelectItem>
                  <SelectItem value="per_kg">Per Kilogram (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNew} disabled={adding}>
              {adding ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Price Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the price template for "{deleteTarget?.category}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}