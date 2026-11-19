"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/db/schema";

interface Props {
  initialCategories: Category[];
}

export function CategoryManagement({ initialCategories }: Props) {
  const router = useRouter();
  const [categories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      setFormData({ name: "", description: "" });
      // Force server component to re-render with fresh data
      router.refresh();
    } else {
      const error = await res.json().catch(() => ({ error: { message: "Failed to create category" } }));
      alert(error.error?.message || "Failed to create category");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      // Force server component to re-render with fresh data
      router.refresh();
    } else {
      alert("Failed to delete category");
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Category name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg"
          >
            Create Category
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-gray-800 p-4 rounded-lg flex justify-between items-start"
          >
            <div>
              <h3 className="text-white font-semibold">{cat.name}</h3>
              {cat.description && (
                <p className="text-gray-400 text-sm mt-1">{cat.description}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}