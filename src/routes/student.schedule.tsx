import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Clock } from "lucide-react";

import { useGuard } from "@/components/Dashboard";
import { EmptyState, PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/student/schedule")({
  head: () => ({
    meta: [
      { title: "Class Schedule — ClassConnect" },
      { name: "description", content: "Your weekly class timetable with days and timings." },
      { property: "og:title", content: "Class Schedule — ClassConnect" },
      { property: "og:description", content: "Your weekly class timetable with days and timings." },
    ],
  }),
  component: StudentSchedule,
});

function StudentSchedule() {
  const { classData } = useGuard("student");
  const schedules = classData?.schedules ?? [];

  return (
    <PageShell title="Schedule" backTo="/student/dashboard">
      {schedules.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-7" />}
          title="No schedule available"
          description="Your teacher has not added any classes yet"
        />
      ) : (
        <div className="space-y-3">
          {schedules.map((item) => (
            <div key={item.id} className="cc-card p-4">
              <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                {item.day}
              </span>
              <p className="mt-3 text-lg font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
                <Clock className="size-4" /> {item.startTime} - {item.endTime}
              </p>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
