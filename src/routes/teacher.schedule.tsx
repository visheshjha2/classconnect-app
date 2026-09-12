import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { AddButton, Modal } from "@/components/Modal";
import { EmptyState, PageShell } from "@/components/PageShell";
import { newId, scheduleDays } from "@/lib/classconnect";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const Route = createFileRoute("/teacher/schedule")({
  head: () => ({
    meta: [
      { title: "Manage Schedule — ClassConnect" },
      { name: "description", content: "Add and remove classes from your weekly class timetable." },
      { property: "og:title", content: "Manage Schedule — ClassConnect" },
      {
        property: "og:description",
        content: "Add and remove classes from your weekly class timetable.",
      },
    ],
  }),
  component: TeacherSchedule,
});

function TeacherSchedule() {
  const { classData, updateClass } = useGuard("teacher");
  const [open, setOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday"]);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const schedules = classData?.schedules ?? [];

  const toggleDay = (d: string) =>
    setSelectedDays((current) =>
      current.includes(d) ? current.filter((x) => x !== d) : [...current, d],
    );

  const add = () => {
    if (selectedDays.length === 0) {
      toast.error("Please choose at least one day");
      return;
    }
    if (!title || !startTime || !endTime) {
      toast.error("Please fill in subject, start time and end time");
      return;
    }
    const ordered = days.filter((d) => selectedDays.includes(d));
    updateClass({
      schedules: [...schedules, { id: newId("s"), days: ordered, title, startTime, endTime }],
    });
    toast.success("Class added to schedule");
    setOpen(false);
    setTitle("");
    setStartTime("");
    setEndTime("");
    setSelectedDays(["Monday"]);
  };

  const remove = (id: string) => {
    updateClass({ schedules: schedules.filter((s) => s.id !== id) });
    toast.success("Class removed");
  };

  return (
    <PageShell
      title="Schedule"
      backTo="/teacher/dashboard"
      actions={<AddButton label="Add schedule" onClick={() => setOpen(true)} />}
    >
      {schedules.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-7" />}
          title="No schedule added yet"
          description="Tap the + button to add your first class"
        />
      ) : (
        <div className="space-y-3">
          {schedules.map((item) => (
            <div key={item.id} className="cc-card flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <span className="flex flex-wrap gap-2">
                  {scheduleDays(item).map((d) => (
                    <span
                      key={d}
                      className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"
                    >
                      {d}
                    </span>
                  ))}
                </span>
                <p className="mt-3 text-lg font-semibold">{item.title}</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-primary">
                  <Clock className="size-4" /> {item.startTime} - {item.endTime}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Delete ${item.title}`}
                onClick={() => remove(item.id)}
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
        title="Add Schedule"
        submitLabel="Add Schedule"
        onClose={() => setOpen(false)}
        onSubmit={add}
      >
        <div>
          <span className="mb-2 block text-sm font-semibold">Days (choose one or more)</span>
          <div className="grid grid-cols-4 gap-2">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={selectedDays.includes(d)}
                onClick={() => toggleDay(d)}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                  selectedDays.includes(d)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary-light"
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Subject</span>
          <input
            className="cc-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Mathematics"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Start Time</span>
          <input
            className="cc-input"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">End Time</span>
          <input
            className="cc-input"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>
      </Modal>
    </PageShell>
  );
}
