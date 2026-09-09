import { createFileRoute } from "@tanstack/react-router";
import { Bell, BookOpen, Calendar, ClipboardList, CreditCard, Users } from "lucide-react";
import { toast } from "sonner";

import {
  DashboardHeader,
  DeleteAccountSection,
  MenuTile,
  StatCard,
  useGuard,
} from "@/components/Dashboard";

export const Route = createFileRoute("/teacher/dashboard")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — ClassConnect" },
      {
        name: "description",
        content:
          "Manage your class: timetable, homework, study materials, announcements, students and fee details.",
      },
      { property: "og:title", content: "Teacher Dashboard — ClassConnect" },
      {
        property: "og:description",
        content: "Manage your timetable, homework, materials, announcements and students.",
      },
    ],
  }),
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const { user, classData, students } = useGuard("teacher");

  if (!user || !classData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const invite = `Join my class "${classData.className}" on ClassConnect!\n\nRoom ID: ${classData.roomId}\n\nOr click: https://classconnect.app/join?room=${classData.roomId}`;

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "ClassConnect", text: invite });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    await navigator.clipboard?.writeText(invite);
    toast.success("Class invite copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-surface pb-16">
      <DashboardHeader
        greeting={`Hello, ${user.fullName}`}
        subtitle="Teacher Dashboard"
        onShare={share}
      />

      <div className="mx-auto max-w-3xl px-4">
        <div className="cc-card -mt-6 p-5">
          <p className="text-xl font-bold">{classData.className}</p>
          <p className="mt-1 text-sm text-muted-foreground">Room ID: {classData.roomId}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="Students" value={students.length} />
          <StatCard label="Classes" value={classData.schedules.length} />
          <StatCard label="Assignments" value={classData.homework.length} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MenuTile
            to="/teacher/schedule"
            icon={<Calendar className="size-6" />}
            title="Schedule"
            description="Manage class timetable"
            count={classData.schedules.length}
          />
          <MenuTile
            to="/teacher/study-materials"
            icon={<BookOpen className="size-6" />}
            title="Study Materials"
            description="Upload & manage resources"
            count={classData.materials.length}
          />
          <MenuTile
            to="/teacher/homework"
            icon={<ClipboardList className="size-6" />}
            title="Homework"
            description="Assign & track assignments"
            count={classData.homework.length}
          />
          <MenuTile
            to="/teacher/notifications"
            icon={<Bell className="size-6" />}
            title="Notifications"
            description="Send announcements"
            count={classData.notifications.length}
          />
          <MenuTile
            to="/teacher/students"
            icon={<Users className="size-6" />}
            title="Students"
            description="Manage class members"
            count={students.length}
          />
          <MenuTile
            to="/teacher/payment"
            icon={<CreditCard className="size-6" />}
            title="Payment"
            description="Fees & payment info"
            count={classData.payment.enabled ? 1 : 0}
          />
        </div>

        <DeleteAccountSection isTeacher />
      </div>
    </div>
  );
}
