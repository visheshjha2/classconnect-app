import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Calendar,
  ClipboardList,
  CreditCard,
  Phone,
} from "lucide-react";

import { DashboardHeader, DeleteAccountSection, MenuTile, useGuard } from "@/components/Dashboard";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — ClassConnect" },
      {
        name: "description",
        content:
          "See your class schedule, homework, study materials, announcements and fee details in one dashboard.",
      },
      { property: "og:title", content: "Student Dashboard — ClassConnect" },
      {
        property: "og:description",
        content: "Schedule, homework, notes and announcements for your class.",
      },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { user, classData, teacher } = useGuard("student");

  if (!user || !classData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-16">
      <DashboardHeader greeting={`Hello, ${user.fullName}`} subtitle="Student Dashboard" />

      <div className="mx-auto max-w-3xl px-4">
        <div className="cc-card -mt-6 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your Class
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">{classData.className}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Room ID</p>
              <p className="font-semibold">{classData.roomId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Teacher</p>
              <p className="font-semibold">{teacher?.fullName ?? "—"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MenuTile
            to="/student/schedule"
            icon={<Calendar className="size-6" />}
            title="Schedule"
            description="View class timetable"
            count={classData.schedules.length}
          />
          <MenuTile
            to="/student/study-materials"
            icon={<BookOpen className="size-6" />}
            title="Study Materials"
            description="Access learning resources"
            count={classData.materials.length}
          />
          <MenuTile
            to="/student/homework"
            icon={<ClipboardList className="size-6" />}
            title="Homework"
            description="View assignments"
            count={classData.homework.length}
          />
          <MenuTile
            to="/student/notifications"
            icon={<Bell className="size-6" />}
            title="Notifications"
            description="Read announcements"
            count={classData.notifications.length}
          />
          <MenuTile
            to="/student/support"
            icon={<Phone className="size-6" />}
            title="Support"
            description="Contact teacher"
          />
          {classData.payment.enabled ? (
            <MenuTile
              to="/student/payment"
              icon={<CreditCard className="size-6" />}
              title="Payment"
              description="View fee details"
            />
          ) : null}
        </div>

        <DeleteAccountSection isTeacher={false} />
      </div>
    </div>
  );
}
