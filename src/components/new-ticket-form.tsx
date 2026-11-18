"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function NewTicketForm({ isStaff }: { isStaff: boolean }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: Record<string, unknown> = {
      subject,
      description,
      priority,
    };
    if (isStaff && customerId.trim() !== "") {
      payload.customer_id = Number(customerId);
    }
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? "Could not create ticket.");
      setSubmitting(false);
      return;
    }
    const body = await response.json();
    router.push(`/tickets/${body.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <label className="block text-sm text-slate-300">
        Subject
        <input
          type="text"
          required
          minLength={3}
          maxLength={200}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
        />
      </label>
      <label className="block text-sm text-slate-300">
        Description
        <textarea
          required
          minLength={10}
          rows={6}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
        />
      </label>
      <label className="block text-sm text-slate-300">
        Priority
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </label>
      {isStaff ? (
        <label className="block text-sm text-slate-300">
          Customer ID (optional, staff only)
          <input
            type="number"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
          />
        </label>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create ticket"}
      </button>
    </form>
  );
}