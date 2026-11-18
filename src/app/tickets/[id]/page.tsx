import { notFound, redirect } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { CommentForm } from "@/components/comment-form";
import { TicketActions } from "@/components/ticket-actions";
import { TopNav } from "@/components/top-nav";
import { getCurrentUser } from "@/lib/auth/session";
import { ServiceError } from "@/lib/http";
import { getTicketDetail, listComments } from "@/lib/tickets/service";

export const instant = false;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    notFound();
  }

  let ticket;
  let comments;
  try {
    ticket = await getTicketDetail(user, ticketId);
    const result = await listComments(user, ticketId, {
      page: 1,
      page_size: 100,
    });
    comments = result.items;
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const isStaff = user.role === "admin" || user.role === "agent";

  return (
    <main className="min-h-screen bg-slate-950">
      <TopNav user={user} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="font-mono text-xs text-slate-500">{ticket.number}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-50">
          {ticket.subject}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="text-sm text-slate-400">
            opened {ticket.created_at.slice(0, 10)} by {ticket.customer_name}
          </span>
          {ticket.assignee_name ? (
            <span className="text-sm text-slate-400">
              · assigned to {ticket.assignee_name}
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-200">
                Description
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {ticket.description}
              </p>
            </section>

            <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-200">
                Conversation
              </h2>
              <div className="mt-4 space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-400">No comments yet.</p>
                ) : null}
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-lg border p-4 ${
                      comment.is_internal
                        ? "border-amber-900 bg-amber-950/30"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">
                        {comment.author_name}
                      </span>
                      <span className="uppercase tracking-wide">
                        {comment.author_role}
                      </span>
                      <span>{comment.created_at.slice(0, 16).replace("T", " ")}</span>
                      {comment.is_internal ? (
                        <span className="rounded-full border border-amber-800 px-2 py-0.5 text-amber-300">
                          Internal note
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {comment.body}
                    </p>
                  </div>
                ))}
              </div>
              {ticket.status === "closed" ? (
                <p className="mt-4 text-sm text-slate-400">
                  This ticket is closed; commenting is disabled.
                </p>
              ) : (
                <CommentForm ticketId={ticket.id} isStaff={isStaff} />
              )}
            </section>
          </div>

          <div>
            <TicketActions
              ticketId={ticket.id}
              status={ticket.status}
              role={user.role}
              assigneeId={ticket.assignee_id}
            />
          </div>
        </div>
      </div>
    </main>
  );
}