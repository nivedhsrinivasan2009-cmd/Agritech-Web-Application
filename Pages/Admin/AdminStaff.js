import React, { useState } from "react";
import { api } from "@/api/localDataService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Shield,
  Mail,
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

const roles = [
  { value: "super_admin", label: "Super Admin", color: "bg-red-100 text-red-700" },
  { value: "event_manager", label: "Event Manager", color: "bg-blue-100 text-blue-700" },
  { value: "content_editor", label: "Content Editor", color: "bg-green-100 text-green-700" },
  { value: "support", label: "Support Staff", color: "bg-stone-100 text-stone-700" },
];

export default function AdminStaff() {
  const { staff: currentStaff } = useOutletContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "support",
  });

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["staffList"],
    queryFn: () => api.adminAuth.listStaff(),
  });

  const canManageStaff = currentStaff?.rolePermissions?.canManageStaff;

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "support",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staffMember) => {
    setEditingItem(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      password: "", // Don't show existing password
      role: staffMember.role,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingItem) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't update if empty
        await api.adminAuth.updateStaff(editingItem.id, updateData);
        toast.success("Staff member updated successfully");
      } else {
        if (!formData.password) {
          toast.error("Password is required for new staff");
          setIsSubmitting(false);
          return;
        }
        await api.adminAuth.createStaff(formData);
        toast.success("Staff member created successfully");
      }

      queryClient.invalidateQueries(["staffList"]);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to save staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (staffMember) => {
    if (staffMember.id === currentStaff?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    const confirmed = await confirm({
      title: "Delete Staff Member",
      message: `Are you sure you want to delete "${staffMember.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await api.adminAuth.deleteStaff(staffMember.id);
      toast.success("Staff member deleted");
      queryClient.invalidateQueries(["staffList"]);
    } catch (error) {
      toast.error(error.message || "Failed to delete staff member");
    }
  };

  const getRoleConfig = (role) => {
    return roles.find((r) => r.value === role) || roles[3];
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!canManageStaff) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
          <Shield className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Access Restricted</h2>
          <p className="text-stone-500">You don't have permission to manage staff members.</p>
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
            <Users className="w-7 h-7 text-indigo-500" />
            Staff Management
          </h1>
          <p className="text-stone-500 mt-1">
            Manage staff accounts and permissions
          </p>
        </div>
        <Button onClick={openCreateModal} className="bg-[#2D5016] hover:bg-[#4A7C23]">
          <Plus className="w-5 h-5 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff List */}
      <div className="space-y-4">
        {staffList?.map((staffMember, index) => {
          const roleConfig = getRoleConfig(staffMember.role);
          const isCurrentUser = staffMember.id === currentStaff?.id;

          return (
            <motion.div
              key={staffMember.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-stone-600 text-lg">
                      {staffMember.name?.charAt(0) || "S"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900">{staffMember.name}</h3>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-3 h-3 text-stone-400" />
                      <span className="text-sm text-stone-500">{staffMember.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
                      {staffMember.created_at && (
                        <span className="text-xs text-stone-400">
                          Joined {format(new Date(staffMember.created_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(staffMember)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {!isCurrentUser && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(staffMember)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {(!staffList || staffList.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No staff members found</p>
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
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg m-4"
            >
              <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingItem ? "Edit Staff Member" : "Add Staff Member"}
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
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {editingItem ? "(leave empty to keep current)" : "*"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingItem}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-stone-500 mt-1">
                    {api.rolePermissions[formData.role]?.description}
                  </p>
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
