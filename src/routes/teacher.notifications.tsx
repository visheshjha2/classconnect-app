import { createFileRoute } from "@tanstack/react-router";
import { Bell, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { AddButton, Modal } from "@/components/Modal";
import { EmptyState, PageShell } from "@/components/PageShell";
import { newId } from "@/lib/classconnect";

export const Route = createFileRoute("/teacher/notifications")({
  head: () => ({
    meta: [
      { title: "Send Notifications — ClassConnect" },
      { name: "description", content: "Send announcements to every student in your class." },
      { property: "og:title", content: "Send Notifications — ClassConnect" },
      { property: "og:description", content: "Send announcements to every student in your class." },
    ],
  }),
  component: TeacherNotifications,
});

function TeacherNotifications() {
  const { classData, updateClass } = useGuard("teacher");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const notifications = classData?.notifications ?? [];

  const send = () => {
    if (!title || !message) {
      toast.error("Please fill in title and message");
      return;
    }
    updateClass({
      notifications: [
        { id: newId("n"), title, message, createdAt: new Date().toISOString() },
        ...notifications,
      ],
    });
    toast.success("Notification sent to all students");
    setOpen(false);
    setTitle("");
    setMessage("");
  };

  return (
    <PageShell
      title="Notifications"
      backTo="/teacher/dashboard"
      actions={<AddButton label="Send notification" onClick={() => setOpen(true)} />}
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-7" />}
          title="No notifications sent yet"
          description="Tap the + button to send an announcement"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div key={item.id} className="cc-card flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Delete ${item.title}`}
                onClick={() => {
                  updateClass({ notifications: notifications.filter((n) => n.id !== item.id) });
                  toast.success("Notification deleted");
                }}
                className="flex size-9 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title="Send Notification"
        submitLabel="Send"
        onClose={() => setOpen(false)}
        onSubmit={send}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Title *</span>
          <input
            className="cc-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Test on Friday"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Message *</span>
          <textarea
            className="cc-input min-h-28"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your announcement"
          />
        </label>
      </Modal>
    </PageShell>
  );
}
