import React, { useState } from "react";
import { api } from "@/api/localDataService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";

const zoneTypes = [
  { value: "greenhouse", label: "Greenhouse" },
  { value: "animal_yard", label: "Animal Yard" },
  { value: "training_centre", label: "Training Centre" },
  { value: "kids_zone", label: "Kids Zone" },
  { value: "shops", label: "Shops & Cafe" },
  { value: "entrance", label: "Entrance" },
  { value: "parking", label: "Parking" },
  { value: "other", label: "Other" },
];

const closureSeverities = [
  { value: "low", label: "Low", description: "Minor inconvenience, partially accessible", color: "bg-yellow-500" },
  { value: "medium", label: "Medium", description: "Temporarily unavailable", color: "bg-orange-500" },
  { value: "high", label: "High", description: "Zone closed, avoid area", color: "bg-red-500" },
  { value: "critical", label: "Critical", description: "Safety hazard, do not enter", color: "bg-red-600" },
];

export default function AdminZones() {
  const { staff } = useOutletContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    zone_name: "",
    zone_type: "other",
    description: "",
    map_x: 50,
    map_y: 50,
    color: "#22c55e",
    // Closure fields
    is_closed: false,
    closure_severity: "medium",
    closure_reason: "",
    closure_end_time: "",
  });

  const { data: locations, isLoading } = useQuery({
    queryKey: ["adminLocations"],
    queryFn: () => api.entities.Location.list(),
  });

  const canCreate = staff?.rolePermissions?.canCreate;
  const canEdit = staff?.rolePermissions?.canEdit;
  const canDelete = staff?.rolePermissions?.canDelete;

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      zone_name: "",
      zone_type: "other",
      description: "",
      map_x: 50,
      map_y: 50,
      color: "#22c55e",
      is_closed: false,
      closure_severity: "medium",
      closure_reason: "",
      closure_end_time: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (location) => {
    setEditingItem(location);
    // Format the closure end time for datetime-local input
    let closureEndTime = "";
    if (location.closure_end_time) {
      const date = new Date(location.closure_end_time);
      closureEndTime = date.toISOString().slice(0, 16);
    }
    setFormData({
      zone_name: location.zone_name,
      zone_type: location.zone_type || "other",
      description: location.description || "",
      map_x: location.map_x || 50,
      map_y: location.map_y || 50,
      color: location.color || "#22c55e",
      is_closed: location.is_closed || false,
      closure_severity: location.closure_severity || "medium",
      closure_reason: location.closure_reason || "",
      closure_end_time: closureEndTime,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data with proper closure fields
      const dataToSave = {
        ...formData,
        // Convert datetime-local to ISO string, or null if not set
        closure_end_time: formData.closure_end_time
          ? new Date(formData.closure_end_time).toISOString()
          : null,
        // Clear closure fields if zone is not closed
        ...(formData.is_closed ? {} : {
          closure_severity: null,
          closure_reason: null,
          closure_end_time: null,
        }),
      };

      if (editingItem) {
        await api.entities.Location.update(editingItem.id, dataToSave);
        toast.success("Location updated successfully");
      } else {
        await api.entities.Location.create(dataToSave);
        toast.success("Location created successfully");
      }

      queryClient.invalidateQueries(["adminLocations"]);
      queryClient.invalidateQueries(["locations"]);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to save location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (location) => {
    const confirmed = await confirm({
      title: "Delete Location",
      message: `Are you sure you want to delete "${location.zone_name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await api.entities.Location.delete(location.id);
      toast.success("Location deleted");
      queryClient.invalidateQueries(["adminLocations"]);
      queryClient.invalidateQueries(["locations"]);
    } catch (error) {
      toast.error("Failed to delete location");
    }
  };

  const getTypeName = (type) => {
    return zoneTypes.find((t) => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
            <MapPin className="w-7 h-7 text-red-500" />
            Locations
          </h1>
          <p className="text-stone-500 mt-1">
            Manage farm locations on the map
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateModal} className="bg-[#2D5016] hover:bg-[#4A7C23]">
            <Plus className="w-5 h-5 mr-2" />
            Add Location
          </Button>
        )}
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations?.map((location, index) => (
          <motion.div
            key={location.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow relative",
              location.is_closed && "border-orange-300"
            )}
          >
            {/* Closure badge */}
            {location.is_closed && (
              <Badge
                className={cn(
                  "absolute top-3 right-3 text-xs",
                  location.closure_severity === "critical" && "bg-red-600 animate-pulse",
                  location.closure_severity === "high" && "bg-red-500",
                  location.closure_severity === "medium" && "bg-orange-500",
                  location.closure_severity === "low" && "bg-yellow-500 text-yellow-900"
                )}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {location.closure_severity === "critical" ? "Critical" : "Closed"}
              </Badge>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: location.color + "20" }}
                >
                  <MapPin className="w-5 h-5" style={{ color: location.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">{location.zone_name}</h3>
                  <p className="text-xs text-stone-500 mt-1">{getTypeName(location.zone_type)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-6">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(location)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(location)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {location.is_closed && location.closure_reason && (
              <p className="text-sm text-orange-600 mt-3 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {location.closure_reason}
              </p>
            )}
            {location.description && !location.is_closed && (
              <p className="text-sm text-stone-500 mt-3 line-clamp-2">
                {location.description}
              </p>
            )}
            <div className="mt-3 text-xs text-stone-400">
              Position: ({location.map_x}%, {location.map_y}%)
            </div>
          </motion.div>
        ))}

        {(!locations || locations.length === 0) && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-stone-200">
            <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No locations found</p>
            {canCreate && (
              <Button
                onClick={openCreateModal}
                className="mt-4 bg-[#2D5016] hover:bg-[#4A7C23]"
              >
                Create First Location
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
                  {editingItem ? "Edit Location" : "Create Location"}
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
                  <Label htmlFor="zone_name">Location Name *</Label>
                  <Input
                    id="zone_name"
                    value={formData.zone_name}
                    onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zone_type">Type</Label>
                    <select
                      id="zone_type"
                      value={formData.zone_type}
                      onChange={(e) => setFormData({ ...formData, zone_type: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                    >
                      {zoneTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
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
                    <Label htmlFor="map_x">Map X Position (%)</Label>
                    <Input
                      id="map_x"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.map_x}
                      onChange={(e) => setFormData({ ...formData, map_x: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="map_y">Map Y Position (%)</Label>
                    <Input
                      id="map_y"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.map_y}
                      onChange={(e) => setFormData({ ...formData, map_y: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Location Status Section */}
                <div className="border-t border-stone-200 pt-4 mt-4">
                  <h3 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Location Status
                  </h3>

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="is_closed"
                      checked={formData.is_closed}
                      onChange={(e) => setFormData({ ...formData, is_closed: e.target.checked })}
                      className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-500"
                    />
                    <Label htmlFor="is_closed" className="cursor-pointer font-normal">
                      Location is closed / restricted
                    </Label>
                  </div>

                  {formData.is_closed && (
                    <div className="space-y-4 pl-6 border-l-2 border-amber-200 bg-amber-50/50 p-4 rounded-r-lg">
                      {/* Severity Select */}
                      <div className="space-y-2">
                        <Label htmlFor="closure_severity">Severity Level</Label>
                        <select
                          id="closure_severity"
                          value={formData.closure_severity}
                          onChange={(e) => setFormData({ ...formData, closure_severity: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {closureSeverities.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label} - {s.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reason Input */}
                      <div className="space-y-2">
                        <Label htmlFor="closure_reason">Closure Reason *</Label>
                        <Input
                          id="closure_reason"
                          value={formData.closure_reason}
                          onChange={(e) => setFormData({ ...formData, closure_reason: e.target.value })}
                          placeholder="e.g., Maintenance in progress"
                          required={formData.is_closed}
                        />
                      </div>

                      {/* End Time */}
                      <div className="space-y-2">
                        <Label htmlFor="closure_end_time">Expected Reopening (optional)</Label>
                        <Input
                          id="closure_end_time"
                          type="datetime-local"
                          value={formData.closure_end_time}
                          onChange={(e) => setFormData({ ...formData, closure_end_time: e.target.value })}
                        />
                        <p className="text-xs text-stone-500">Leave empty for indefinite closure</p>
                      </div>
                    </div>
                  )}
                </div>

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
