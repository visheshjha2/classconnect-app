import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ClipboardList } from "lucide-react";

import { useGuard } from "@/components/Dashboard";
import { EmptyState, PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/student/homework")({
  head: () => ({
    meta: [
      { title: "Homework — ClassConnect" },
      { name: "description", content: "All homework assigned by your teacher, with due dates." },
      { property: "og:title", content: "Homework — ClassConnect" },
      {
        property: "og:description",
        content: "All homework assigned by your teacher, with due dates.",
      },
    ],
  }),
  component: StudentHomework,
});

function StudentHomework() {
  const { classData } = useGuard("student");
  const homework = classData?.homework ?? [];

  return (
    <PageShell title="Homework" backTo="/student/dashboard">
      {homework.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-7" />}
          title="No homework assigned"
          description="Your teacher has not assigned any homework yet"
        />
      ) : (
        <div className="space-y-3">
          {homework.map((item) => (
            <div key={item.id} className="cc-card p-4">
              <p className="text-lg font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              {item.dueDate ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-warning-foreground">
                  <CalendarDays className="size-4 text-primary" /> Due: {item.dueDate}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
