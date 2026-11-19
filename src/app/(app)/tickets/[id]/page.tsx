import { notFound, redirect } from "next/navigation";
import { CommentForm } from "@/components/features/comment-form";
import { StatusActions } from "@/components/features/status-actions";
import { AssignAction } from "@/components/features/assign-action";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { ApiError } from "@/lib/api/errors";
import { getSessionUser } from "@/lib/auth/session";
import { getTicket } from "@/lib/services/tickets";
import { listComments } from "@/lib/services/comments";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) notFound();

  let ticket, comments;
  try {
    // ⚡ Promise.all: ticket detail + comments are independent reads
    const [t, c] = await Promise.all([
      getTicket(user, ticketId),
      listComments(user, ticketId, {}),
    ]);
    ticket = t;
    comments = c.items;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-50">{ticket.subject}</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <span className="text-sm text-slate-400">by {ticket.customer_name}</span>
        {ticket.assignee_name && (
          <span className="text-sm text-slate-400">· {ticket.assignee_name}</span>
        )}
        {ticket.category_name && (
          <span className="text-sm text-slate-400">· {ticket.category_name}</span>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
              {ticket.description}
            </p>
          </section>
          <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Comments</h2>
            <div className="mt-4 space-y-3">
              {comments.length === 0 && (
                <p className="text-sm text-slate-400">No comments yet.</p>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{c.author_name}</span>
                    <span>{c.created_at.slice(0, 16).replace("T", " ")}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
            {ticket.status !== "closed" && <CommentForm ticketId={ticket.id} />}
          </section>
        </div>
        <div className="space-y-4">
          {user.role !== "customer" && (
            <StatusActions
              ticketId={ticket.id}
              status={ticket.status}
              role={user.role}
            />
          )}
          {user.role === "admin" && (
            <AssignAction
              ticketId={ticket.id}
              currentAssignee={ticket.assignee_id}
            />
          )}
        </div>
      </div>
    </div>
  );
}