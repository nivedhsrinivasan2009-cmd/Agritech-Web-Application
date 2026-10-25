import React, { useState } from "react";
import { api } from "@/api/localDataService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle,
  Info,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { useOutletContext } from "react-router-dom";

const announcementTypes = [
  { value: "info", label: "Info", icon: Info, color: "bg-blue-100 text-blue-700" },
  { value: "promotion", label: "Promotion", icon: Gift, color: "bg-green-100 text-green-700" },
  { value: "alert", label: "Alert", icon: AlertCircle, color: "bg-red-100 text-red-700" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

export default function AdminAnnouncements() {
  const { staff } = useOutletContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "normal",
    is_active: true,
    start_date: "",
    end_date: "",
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["adminAnnouncements"],
    queryFn: () => api.entities.Announcement.list("-created_at"),
  });

  const canCreate = staff?.rolePermissions?.canCreate;
  const canEdit = staff?.rolePermissions?.canEdit;
  const canDelete = staff?.rolePermissions?.canDelete;

  const openCreateModal = () => {
    setEditingItem(null);
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    setFormData({
      title: "",
      message: "",
      type: "info",
      priority: "normal",
      is_active: true,
      start_date: format(now, "yyyy-MM-dd"),
      end_date: format(nextWeek, "yyyy-MM-dd"),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (announcement) => {
    setEditingItem(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message || "",
      type: announcement.type || "info",
      priority: announcement.priority || "normal",
      is_active: announcement.is_active ?? true,
      start_date: announcement.start_date ? format(new Date(announcement.start_date), "yyyy-MM-dd") : "",
      end_date: announcement.end_date ? format(new Date(announcement.end_date), "yyyy-MM-dd") : "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        // Date inputs are local calendar days: start at local midnight, end at the end of the
        // last day (new Date("yyyy-MM-dd") alone would mean UTC midnight)
        start_date: formData.start_date ? new Date(`${formData.start_date}T00:00:00`).toISOString() : null,
        end_date: formData.end_date ? new Date(`${formData.end_date}T23:59:59`).toISOString() : null,
      };

      if (editingItem) {
        await api.entities.Announcement.update(editingItem.id, data);
        toast.success("Announcement updated successfully");
      } else {
        await api.entities.Announcement.create(data);
        toast.success("Announcement created successfully");
      }

      queryClient.invalidateQueries(["adminAnnouncements"]);
      queryClient.invalidateQueries(["announcements"]);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to save announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (announcement) => {
    const confirmed = await confirm({
      title: "Delete Announcement",
      message: `Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await api.entities.Announcement.delete(announcement.id);
      toast.success("Announcement deleted");
      queryClient.invalidateQueries(["adminAnnouncements"]);
      queryClient.invalidateQueries(["announcements"]);
    } catch (error) {
      toast.error("Failed to delete announcement");
    }
  };

  const toggleActive = async (announcement) => {
    try {
      await api.entities.Announcement.update(announcement.id, {
        is_active: !announcement.is_active,
      });
      toast.success(announcement.is_active ? "Announcement deactivated" : "Announcement activated");
      queryClient.invalidateQueries(["adminAnnouncements"]);
      queryClient.invalidateQueries(["announcements"]);
    } catch (error) {
      toast.error("Failed to update announcement");
    }
  };

  const getTypeConfig = (type) => {
    return announcementTypes.find((t) => t.value === type) || announcementTypes[0];
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
            <Bell className="w-7 h-7 text-amber-500" />
            Announcements
          </h1>
          <p className="text-stone-500 mt-1">
            Manage visitor announcements and alerts
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateModal} className="bg-[#2D5016] hover:bg-[#4A7C23]">
            <Plus className="w-5 h-5 mr-2" />
            Add Announcement
          </Button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements?.map((announcement, index) => {
          const typeConfig = getTypeConfig(announcement.type);
          const TypeIcon = typeConfig.icon;

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md transition-shadow ${
                !announcement.is_active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900">{announcement.title}</h3>
                      {!announcement.is_active && (
                        <Badge variant="outline" className="text-stone-500">Inactive</Badge>
                      )}
                      {announcement.priority === "high" && (
                        <Badge className="bg-red-100 text-red-700">High Priority</Badge>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 mt-1">{announcement.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-stone-400">
                      <span>Type: {typeConfig.label}</span>
                      {announcement.start_date && (
                        <span>
                          {format(new Date(announcement.start_date), "MMM d")} - {" "}
                          {announcement.end_date ? format(new Date(announcement.end_date), "MMM d, yyyy") : "No end date"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(announcement)}
                    className={announcement.is_active ? "text-amber-600" : "text-green-600"}
                  >
                    {announcement.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(announcement)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(announcement)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {(!announcements || announcements.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <Bell className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No announcements found</p>
            {canCreate && (
              <Button
                onClick={openCreateModal}
                className="mt-4 bg-[#2D5016] hover:bg-[#4A7C23]"
              >
                Create First Announcement
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
                  {editingItem ? "Edit Announcement" : "Create Announcement"}
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
                  <Label htmlFor="message">Message *</Label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] min-h-[100px]"
                    required
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
                      {announcementTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active (visible to visitors)
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
