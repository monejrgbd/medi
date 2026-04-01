"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateStaff, reactivateStaff, deleteStaff } from "@/app/(dashboard)/d/_actions/staff";
import ConfirmModal from "./ConfirmModal";
import ResetPasswordModal from "./ResetPasswordModal";
import RoleAssignmentModal from "./RoleAssignmentModal";
import AddStaffModal from "./AddStaffModal";

interface RoleInfo {
  role: string;
  location_id: string;
  location_name: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  username: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  roles: RoleInfo[];
}

interface LocationOption {
  id: string;
  name: string;
}

const ROLE_COLORS: Record<string, string> = {
  staff: "bg-green-50 text-green-700",
  manager: "bg-purple-50 text-purple-700",
  doctor: "bg-blue-50 text-blue-700",
  receptionist: "bg-yellow-50 text-yellow-700",
};

export default function StaffTable({
  staff,
  locations,
  preselectedLocationId,
}: {
  staff: StaffMember[];
  locations: LocationOption[];
  preselectedLocationId?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState(preselectedLocationId || "");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [resetModal, setResetModal] = useState<StaffMember | null>(null);
  const [roleModal, setRoleModal] = useState<StaffMember | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    staff: StaffMember;
    action: "deactivate" | "reactivate" | "delete";
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const filtered = staff.filter((s) => {
    const matchesSearch =
      !search ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase());
    const matchesLocation =
      !locationFilter ||
      s.roles.some((r) => r.location_id === locationFilter);
    return matchesSearch && matchesLocation;
  });

  async function handleConfirmAction() {
    if (!confirmModal) return;
    setConfirmLoading(true);

    const result =
      confirmModal.action === "deactivate"
        ? await deactivateStaff(confirmModal.staff.id)
        : confirmModal.action === "reactivate"
        ? await reactivateStaff(confirmModal.staff.id)
        : await deleteStaff(confirmModal.staff.id);

    setConfirmLoading(false);
    if (result.success) {
      setConfirmModal(null);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
        />
        {!preselectedLocationId && locations.length > 1 && (
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white hover:bg-hilt-blue-dark whitespace-nowrap"
        >
          + Add Staff
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate text-sm">
          {staff.length === 0 ? "No staff members yet" : "No matching staff found"}
        </div>
      ) : (
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="pb-3 font-medium text-slate">Name</th>
                <th className="pb-3 font-medium text-slate">Username</th>
                <th className="pb-3 font-medium text-slate hidden sm:table-cell">Roles</th>
                <th className="pb-3 font-medium text-slate">Status</th>
                <th className="pb-3 font-medium text-slate w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <tr key={s.id} className="group">
                  <td className="py-3 font-medium text-ink">{s.full_name}</td>
                  <td className="py-3 text-slate">{s.username}</td>
                  <td className="py-3 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {s.roles.map((r, i) => (
                        <span
                          key={i}
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            ROLE_COLORS[r.role] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {r.role} @ {r.location_name}
                        </span>
                      ))}
                      {s.roles.length === 0 && (
                        <span className="text-xs text-slate">No roles</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 relative">
                    <button
                      onClick={() =>
                        setActionMenu(actionMenu === s.id ? null : s.id)
                      }
                      className="rounded p-1 text-slate hover:bg-gray-100 hover:text-ink"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {actionMenu === s.id && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                        <button
                          onClick={() => {
                            setActionMenu(null);
                            setRoleModal(s);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-gray-50"
                        >
                          Edit Roles
                        </button>
                        <button
                          onClick={() => {
                            setActionMenu(null);
                            setResetModal(s);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-gray-50"
                        >
                          Reset Password
                        </button>
                        {s.is_active ? (
                          <button
                            onClick={() => {
                              setActionMenu(null);
                              setConfirmModal({ staff: s, action: "deactivate" });
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-gray-50"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActionMenu(null);
                              setConfirmModal({ staff: s, action: "reactivate" });
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-gray-50"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActionMenu(null);
                            setConfirmModal({ staff: s, action: "delete" });
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddStaffModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        locations={locations}
        preselectedLocationId={preselectedLocationId}
      />

      {resetModal && (
        <ResetPasswordModal
          open
          staffUserId={resetModal.id}
          staffName={resetModal.full_name}
          onClose={() => setResetModal(null)}
          onSuccess={() => router.refresh()}
        />
      )}

      {roleModal && (() => {
        const fresh = staff.find(s => s.id === roleModal.id) || roleModal;
        return (
          <RoleAssignmentModal
            open
            staffUserId={fresh.id}
            staffName={fresh.full_name}
            currentRoles={fresh.roles}
            locations={locations}
            onClose={() => setRoleModal(null)}
          />
        );
      })()}

      {confirmModal && (
        <ConfirmModal
          open
          title={confirmModal.action === "deactivate" ? "Deactivate Staff" : confirmModal.action === "reactivate" ? "Reactivate Staff" : "Delete Staff"}
          message={
            confirmModal.action === "deactivate"
              ? `Are you sure you want to deactivate ${confirmModal.staff.full_name}? They will no longer be able to log in. This can be reversed, their records and history will be preserved.`
              : confirmModal.action === "reactivate"
              ? `Are you sure you want to reactivate ${confirmModal.staff.full_name}? They will be able to log in again.`
              : `Are you sure you want to delete ${confirmModal.staff.full_name}? This action cannot be undone. Past records will show "Deleted staff member."`
          }
          confirmLabel={confirmModal.action === "deactivate" ? "Deactivate" : confirmModal.action === "reactivate" ? "Reactivate" : "Delete"}
          destructive={confirmModal.action !== "reactivate"}
          loading={confirmLoading}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
