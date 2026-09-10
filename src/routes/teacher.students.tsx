import { createFileRoute } from "@tanstack/react-router";
import { Ban, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { EmptyState, PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/teacher/students")({
  head: () => ({
    meta: [
      { title: "Manage Students — ClassConnect" },
      { name: "description", content: "See who joined your class and block or remove members." },
      { property: "og:title", content: "Manage Students — ClassConnect" },
      { property: "og:description", content: "See who joined your class and block or remove members." },
    ],
  }),
  component: TeacherStudents,
});

function TeacherStudents() {
  const { classData, students, removeStudent, toggleBlockStudent } = useGuard("teacher");
  const blocked = classData?.blockedIds ?? [];

  return (
    <PageShell title="Students" backTo="/teacher/dashboard">
      <div className="cc-card mb-4 p-4">
        <p className="text-sm text-muted-foreground">
          Share Room ID <span className="font-semibold text-foreground">{classData?.roomId}</span>{" "}
          so students can join your class.
        </p>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={<Users className="size-7" />}
          title="No students yet"
          description="Share your Room ID with students so they can join"
        />
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const isBlocked = blocked.includes(student.id);
            return (
              <div key={student.id} className="cc-card flex items-center gap-4 p-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {student.fullName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{student.fullName}</p>
                  <p className="truncate text-sm text-muted-foreground">@{student.username}</p>
                  {isBlocked ? (
                    <span className="mt-2 inline-flex rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                      Blocked
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label={isBlocked ? `Unblock ${student.fullName}` : `Block ${student.fullName}`}
                  onClick={() => {
                    toggleBlockStudent(student.id);
                    toast.success(isBlocked ? "Student unblocked" : "Student blocked");
                  }}
                  className="flex size-9 items-center justify-center rounded-lg text-warning-foreground transition-colors hover:bg-warning/20"
                >
                  <Ban className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${student.fullName}`}
                  onClick={() => {
                    removeStudent(student.id);
                    toast.success("Student removed from class");
                  }}
                  className="flex size-9 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
