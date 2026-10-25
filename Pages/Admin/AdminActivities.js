import React, { useState } from "react";
import { api } from "@/api/localDataService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Clock,
  MapPin,
  Calendar,
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

const activityTypes = [
  { value: "farm_walk", label: "Farm Walk" },
  { value: "feeding", label: "Feeding Session" },
  { value: "kids_zone", label: "Kids Zone" },
  { value: "workshop", label: "Workshop" },
  { value: "exploration", label: "Exploration" },
];

export default function AdminActivities() {
  const { staff } = useOutletContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    typical_time: "",
    // Schedule fields
    schedule_date: "",
    start_time_hour: "10",
    start_time_minute: "00",
    start_time_period: "AM",
    end_time_hour: "11",
    end_time_minute: "00",
    end_time_period: "AM",
    is_recurring: false,
    recurring_days: [],
    type: "exploration",
    location_id: "",
    image_url: "",
  });

  const { data: activities, isLoading } = useQuery({
    queryKey: ["adminActivities"],
    queryFn: () => api.entities.Activity.list(),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  // Subscribe to real-time updates
  useRealtimeSubscription("activities", "adminActivities");

  const canCreate = staff?.rolePermissions?.canCreate;
  const canEdit = staff?.rolePermissions?.canEdit;
  const canDelete = staff?.rolePermissions?.canDelete;

  // Helper to parse time string like "10:00 AM - 11:30 AM" into components
  const parseTimeString = (timeStr) => {
    if (!timeStr) return null;

    // Try to parse format like "10:00 AM - 11:30 AM" or "10:00 AM"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)(?:\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
    if (match) {
      return {
        start_time_hour: match[1],
        start_time_minute: match[2],
        start_time_period: match[3].toUpperCase(),
        end_time_hour: match[4] || match[1],
        end_time_minute: match[5] || match[2],
        end_time_period: match[6]?.toUpperCase() || match[3].toUpperCase(),
      };
    }
    return null;
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      typical_time: "",
      schedule_date: "",
      start_time_hour: "10",
      start_time_minute: "00",
      start_time_period: "AM",
      end_time_hour: "11",
      end_time_minute: "00",
      end_time_period: "AM",
      is_recurring: false,
      recurring_days: [],
      type: "exploration",
      location_id: "",
      image_url: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (activity) => {
    setEditingItem(activity);

    // Parse existing time string if available
    const parsedTime = parseTimeString(activity.typical_time);

    setFormData({
      name: activity.name,
      description: activity.description || "",
      typical_time: activity.typical_time || "",
      schedule_date: activity.schedule_date || "",
      start_time_hour: parsedTime?.start_time_hour || activity.start_time_hour || "10",
      start_time_minute: parsedTime?.start_time_minute || activity.start_time_minute || "00",
      start_time_period: parsedTime?.start_time_period || activity.start_time_period || "AM",
      end_time_hour: parsedTime?.end_time_hour || activity.end_time_hour || "11",
      end_time_minute: parsedTime?.end_time_minute || activity.end_time_minute || "00",
      end_time_period: parsedTime?.end_time_period || activity.end_time_period || "AM",
      is_recurring: activity.is_recurring || false,
      recurring_days: activity.recurring_days || [],
      type: activity.type || "exploration",
      location_id: activity.location_id || "",
      image_url: activity.image_url || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Format the typical_time string from the time picker values
      const formatTime = (hour, minute, period) => {
        return `${hour}:${minute} ${period}`;
      };

      const startTimeStr = formatTime(
        formData.start_time_hour,
        formData.start_time_minute,
        formData.start_time_period
      );
      const endTimeStr = formatTime(
        formData.end_time_hour,
        formData.end_time_minute,
        formData.end_time_period
      );

      // Build the typical_time string
      let typicalTime = `${startTimeStr} - ${endTimeStr}`;
      if (formData.is_recurring && formData.recurring_days.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = formData.recurring_days.map(d => dayNames[d]).join(', ');
        typicalTime = `${selectedDays} at ${startTimeStr} - ${endTimeStr}`;
      } else if (formData.schedule_date) {
        const date = new Date(formData.schedule_date);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        typicalTime = `${dateStr} at ${startTimeStr} - ${endTimeStr}`;
      }

      const dataToSave = {
        name: formData.name,
        description: formData.description,
        typical_time: typicalTime,
        schedule_date: formData.schedule_date,
        start_time_hour: formData.start_time_hour,
        start_time_minute: formData.start_time_minute,
        start_time_period: formData.start_time_period,
        end_time_hour: formData.end_time_hour,
        end_time_minute: formData.end_time_minute,
        end_time_period: formData.end_time_period,
        is_recurring: formData.is_recurring,
        recurring_days: formData.recurring_days,
        type: formData.type,
        location_id: formData.location_id,
        image_url: formData.image_url,
      };

      if (editingItem) {
        await api.entities.Activity.update(editingItem.id, dataToSave);
        toast.success("Activity updated successfully");
      } else {
        await api.entities.Activity.create(dataToSave);
        toast.success("Activity created successfully");
      }

      queryClient.invalidateQueries(["adminActivities"]);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to save activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (activity) => {
    const confirmed = await confirm({
      title: "Delete Activity",
      message: `Are you sure you want to delete "${activity.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await api.entities.Activity.delete(activity.id);
      toast.success("Activity deleted");
      queryClient.invalidateQueries(["adminActivities"]);
    } catch (error) {
      toast.error("Failed to delete activity");
    }
  };

  const getLocationName = (locationId) => {
    return locations?.find((l) => l.id === locationId)?.zone_name || "Unknown";
  };

  const getTypeName = (type) => {
    return activityTypes.find((t) => t.value === type)?.label || type;
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
            <Compass className="w-7 h-7 text-green-500" />
            Activities
          </h1>
          <p className="text-stone-500 mt-1">
            Manage farm activities and experiences
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateModal} className="bg-[#2D5016] hover:bg-[#4A7C23]">
            <Plus className="w-5 h-5 mr-2" />
            Add Activity
          </Button>
        )}
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {activities?.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {activity.image_url && (
                <img
                  src={activity.image_url}
                  alt={activity.name}
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-stone-900">{activity.name}</h3>
                    {activity.description && (
                      <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-stone-500">
                      {activity.typical_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {activity.typical_time}
                        </span>
                      )}
                      {activity.location_id && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {getLocationName(activity.location_id)}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded">
                        {getTypeName(activity.type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(activity)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(activity)}
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

        {(!activities || activities.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <Compass className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No activities found</p>
            {canCreate && (
              <Button
                onClick={openCreateModal}
                className="mt-4 bg-[#2D5016] hover:bg-[#4A7C23]"
              >
                Create First Activity
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
                  {editingItem ? "Edit Activity" : "Create Activity"}
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
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                    >
                      {activityTypes.map((type) => (
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

                {/* Schedule Section */}
                <div className="border-t border-stone-200 pt-4 mt-4">
                  <h3 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2D5016]" />
                    Schedule
                  </h3>

                  {/* Recurring Toggle */}
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      className="w-4 h-4 rounded border-stone-300 text-[#2D5016] focus:ring-[#2D5016]"
                    />
                    <Label htmlFor="is_recurring" className="cursor-pointer font-normal">
                      Recurring activity (repeats on selected days)
                    </Label>
                  </div>

                  {/* Date Picker (for non-recurring) */}
                  {!formData.is_recurring && (
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="schedule_date">Date</Label>
                      <Input
                        id="schedule_date"
                        type="date"
                        value={formData.schedule_date}
                        onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Recurring Days (for recurring) */}
                  {formData.is_recurring && (
                    <div className="space-y-2 mb-4">
                      <Label>Repeat on</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const days = formData.recurring_days.includes(index)
                                ? formData.recurring_days.filter(d => d !== index)
                                : [...formData.recurring_days, index];
                              setFormData({ ...formData, recurring_days: days });
                            }}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              formData.recurring_days.includes(index)
                                ? 'bg-[#2D5016] text-white border-[#2D5016]'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Start Time */}
                  <div className="space-y-2 mb-4">
                    <Label>Start Time</Label>
                    <div className="flex items-center gap-2">
                      <select
                        value={formData.start_time_hour}
                        onChange={(e) => setFormData({ ...formData, start_time_hour: e.target.value })}
                        className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                          <option key={hour} value={hour.toString()}>{hour}</option>
                        ))}
                      </select>
                      <span className="text-stone-400">:</span>
                      <select
                        value={formData.start_time_minute}
                        onChange={(e) => setFormData({ ...formData, start_time_minute: e.target.value })}
                        className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                      >
                        {['00', '15', '30', '45'].map(min => (
                          <option key={min} value={min}>{min}</option>
                        ))}
                      </select>
                      <select
                        value={formData.start_time_period}
                        onChange={(e) => setFormData({ ...formData, start_time_period: e.target.value })}
                        className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <div className="flex items-center gap-2">
                      <select
                        value={formData.end_time_hour}
                        onChange={(e) => setFormData({ ...formData, end_time_hour: e.target.value })}
                        className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                          <option key={hour} value={hour.toString()}>{hour}</option>
                        ))}
                      </select>
                      <span className="text-stone-400">:</span>
                      <select
                        value={formData.end_time_minute}
                        onChange={(e) => setFormData({ ...formData, end_time_minute: e.target.value })}
                        className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                      >
                        {['00', '15', '30', '45'].map(min => (
                          <option key={min} value={min}>{min}</option>
                        ))}
                      </select>
                      <select
                        value={formData.end_time_period}
                        onChange={(e) => setFormData({ ...formData, end_time_period: e.target.value })}
                        className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  bucket="activity-images"
                  label="Activity Image"
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
