import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { useGuard } from "@/components/Dashboard";
import { EmptyState, PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/student/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ClassConnect" },
      { name: "description", content: "Announcements sent by your teacher to the whole class." },
      { property: "og:title", content: "Notifications — ClassConnect" },
      {
        property: "og:description",
        content: "Announcements sent by your teacher to the whole class.",
      },
    ],
  }),
  component: StudentNotifications,
});

function StudentNotifications() {
  const { classData } = useGuard("student");
  const notifications = classData?.notifications ?? [];

  return (
    <PageShell title="Notifications" backTo="/student/dashboard">
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-7" />}
          title="No notifications"
          description="You will see announcements from your teacher here"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div key={item.id} className="cc-card p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
