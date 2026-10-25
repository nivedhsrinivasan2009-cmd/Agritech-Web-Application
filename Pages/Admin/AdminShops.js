import React, { useState } from "react";
import { api } from "@/api/localDataService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import ImageUpload from "@/components/admin/ImageUpload";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";

const shopTypes = [
  { value: "cafe", label: "Cafe" },
  { value: "farm_shop", label: "Farm Shop" },
  { value: "gift_shop", label: "Gift Shop" },
  { value: "partner_outlet", label: "Partner Outlet" },
];

export default function AdminShops() {
  const { staff } = useOutletContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    opening_hours: "",
    shop_type: "farm_shop",
    location_id: "",
    image_url: "",
  });

  const { data: shops, isLoading } = useQuery({
    queryKey: ["adminShops"],
    queryFn: () => api.entities.Shop.list(),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  // Subscribe to real-time updates
  useRealtimeSubscription("shops", "adminShops");

  const canCreate = staff?.rolePermissions?.canCreate;
  const canEdit = staff?.rolePermissions?.canEdit;
  const canDelete = staff?.rolePermissions?.canDelete;

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      opening_hours: "",
      shop_type: "farm_shop",
      location_id: "",
      image_url: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (shop) => {
    setEditingItem(shop);
    setFormData({
      name: shop.name,
      description: shop.description || "",
      opening_hours: shop.opening_hours || "",
      shop_type: shop.shop_type || "farm_shop",
      location_id: shop.location_id || "",
      image_url: shop.image_url || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingItem) {
        await api.entities.Shop.update(editingItem.id, formData);
        toast.success("Shop updated successfully");
      } else {
        await api.entities.Shop.create(formData);
        toast.success("Shop created successfully");
      }

      queryClient.invalidateQueries(["adminShops"]);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to save shop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (shop) => {
    const confirmed = await confirm({
      title: "Delete Shop",
      message: `Are you sure you want to delete "${shop.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await api.entities.Shop.delete(shop.id);
      toast.success("Shop deleted");
      queryClient.invalidateQueries(["adminShops"]);
    } catch (error) {
      toast.error("Failed to delete shop");
    }
  };

  const getLocationName = (locationId) => {
    return locations?.find((l) => l.id === locationId)?.zone_name || "Unknown";
  };

  const getTypeName = (type) => {
    return shopTypes.find((t) => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
            <Store className="w-7 h-7 text-purple-500" />
            Shops
          </h1>
          <p className="text-stone-500 mt-1">
            Manage shops and cafes
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateModal} className="bg-[#2D5016] hover:bg-[#4A7C23]">
            <Plus className="w-5 h-5 mr-2" />
            Add Shop
          </Button>
        )}
      </div>

      {/* Shops List */}
      <div className="space-y-4">
        {shops?.map((shop, index) => (
          <motion.div
            key={shop.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {shop.image_url && (
                <img
                  src={shop.image_url}
                  alt={shop.name}
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-stone-900">{shop.name}</h3>
                    {shop.description && (
                      <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                        {shop.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-stone-500">
                      {shop.opening_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {shop.opening_hours}
                        </span>
                      )}
                      {shop.location_id && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {getLocationName(shop.location_id)}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded">
                        {getTypeName(shop.shop_type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(shop)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(shop)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {(!shops || shops.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <Store className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No shops found</p>
            {canCreate && (
              <Button
                onClick={openCreateModal}
                className="mt-4 bg-[#2D5016] hover:bg-[#4A7C23]"
              >
                Create First Shop
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4"
            >
              <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingItem ? "Edit Shop" : "Create Shop"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shop_type">Type</Label>
                    <select
                      id="shop_type"
                      value={formData.shop_type}
                      onChange={(e) => setFormData({ ...formData, shop_type: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                    >
                      {shopTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_id">Location</Label>
                    <select
                      id="location_id"
                      value={formData.location_id}
                      onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                    >
                      <option value="">Select location</option>
                      {locations?.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.zone_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opening_hours">Opening Hours</Label>
                  <Input
                    id="opening_hours"
                    value={formData.opening_hours}
                    onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                    placeholder="e.g., 8:00 AM - 6:00 PM"
                  />
                </div>

                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  bucket="shop-images"
                  label="Shop Image"
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#2D5016] hover:bg-[#4A7C23]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        {editingItem ? "Update" : "Create"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </div>
  );
}
