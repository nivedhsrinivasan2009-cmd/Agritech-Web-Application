import React, { useState } from "react";
import { api } from "@/api/localDataService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import ImageUpload from "@/components/admin/ImageUpload";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { toast } from "sonner";
import { format } from "date-fns";
import { useOutletContext } from "react-router-dom";

const categories = [
  { value: "families", label: "Families" },
  { value: "schools", label: "Schools" },
  { value: "entrepreneurs", label: "Entrepreneurs" },
  { value: "general", label: "General" },
];

export default function AdminEvents() {
  const { staff } = useOutletContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    category: "general",
    location_id: "",
    image_url: "",
    is_featured: false,
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["adminEvents"],
    queryFn: () => api.entities.Event.list("-start_time"),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  // Subscribe to real-time updates
  useRealtimeSubscription("events", "adminEvents");

  const canCreate = staff?.rolePermissions?.canCreate;
  const canEdit = staff?.rolePermissions?.canEdit;
  const canDelete = staff?.rolePermissions?.canDelete;

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      category: "general",
      location_id: "",
      image_url: "",
      is_featured: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      start_time: event.start_time ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : "",
      end_time: event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : "",
      category: event.category || "general",
      location_id: event.location_id || "",
      image_url: event.image_url || "",
      is_featured: event.is_featured || false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      };

      if (editingEvent) {
        await api.entities.Event.update(editingEvent.id, data);
        toast.success("Event updated successfully");
      } else {
        await api.entities.Event.create(data);
        toast.success("Event created successfully");
      }

      queryClient.invalidateQueries(["adminEvents"]);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (event) => {
    const confirmed = await confirm({
      title: "Delete Event",
      message: `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await api.entities.Event.delete(event.id);
      toast.success("Event deleted");
      queryClient.invalidateQueries(["adminEvents"]);
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const getLocationName = (locationId) => {
    return locations?.find((l) => l.id === locationId)?.zone_name || "Unknown";
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
            <Calendar className="w-7 h-7 text-blue-500" />
            Events
          </h1>
          <p className="text-stone-500 mt-1">
            Manage farm events and activities
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateModal} className="bg-[#2D5016] hover:bg-[#4A7C23]">
            <Plus className="w-5 h-5 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events?.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-stone-900">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(event.start_time), "MMM d, yyyy h:mm a")}
                      </span>
                      {event.location_id && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {getLocationName(event.location_id)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className="capitalize">{event.category}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {event.is_featured && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                        Featured
                      </span>
                    )}
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(event)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(event)}
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

        {(!events || events.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No events found</p>
            {canCreate && (
              <Button
                onClick={openCreateModal}
                className="mt-4 bg-[#2D5016] hover:bg-[#4A7C23]"
              >
                Create First Event
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
                  {editingEvent ? "Edit Event" : "Create Event"}
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
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
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

                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  bucket="event-images"
                  label="Event Image"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_featured" className="cursor-pointer">
                    Featured event
                  </Label>
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
                        {editingEvent ? "Update" : "Create"}
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
