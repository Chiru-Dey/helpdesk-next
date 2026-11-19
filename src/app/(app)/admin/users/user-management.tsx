"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/db/schema";

interface Props {
  initialUsers: User[];
  currentUserId: number;
}

type RoleValue = "admin" | "agent" | "customer";

export function UserManagement({ initialUsers, currentUserId }: Props) {
  const router = useRouter();
  const [users] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    role: RoleValue;
  }>({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      setFormData({ name: "", email: "", password: "", role: "customer" });
      // Force server component to re-render with fresh data
      router.refresh();
    } else {
      const error = await res.json().catch(() => ({ error: { message: "Failed to create user" } }));
      alert(error.error?.message || "Failed to create user");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      // Force server component to re-render with fresh data
      router.refresh();
    } else {
      alert("Failed to delete user");
    }
  }

  async function handleToggleActive(id: number, isActive: boolean) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    if (res.ok) {
      // Force server component to re-render with fresh data from DB
      router.refresh();
    } else {
      const error = await res.json().catch(() => ({ error: { message: "Failed to update user" } }));
      alert(error.error?.message || "Failed to update user status");
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 chars)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded"
              required
              minLength={8}
            />
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as RoleValue })
              }
              className="bg-gray-700 text-white px-3 py-2 rounded"
            >
              <option value="customer">Customer</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg"
          >
            Create User
          </button>
        </form>
      )}

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-white">Name</th>
              <th className="px-4 py-3 text-left text-white">Email</th>
              <th className="px-4 py-3 text-left text-white">Role</th>
              <th className="px-4 py-3 text-left text-white">Status</th>
              <th className="px-4 py-3 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-700">
                <td className="px-4 py-3 text-white">{u.name}</td>
                <td className="px-4 py-3 text-gray-300">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      u.role === "admin"
                        ? "bg-purple-500/20 text-purple-300"
                        : u.role === "agent"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-gray-500/20 text-gray-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.id === currentUserId ? (
                    <span className="px-3 py-1 rounded text-xs bg-gray-700 text-gray-400">
                      You
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      className={`px-3 py-1 rounded text-xs ${
                        u.isActive
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}