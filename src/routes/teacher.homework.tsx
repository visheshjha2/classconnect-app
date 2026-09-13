import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { AddButton, Modal } from "@/components/Modal";
import { EmptyState, PageShell } from "@/components/PageShell";
import { newId } from "@/lib/classconnect";

export const Route = createFileRoute("/teacher/homework")({
  head: () => ({
    meta: [
      { title: "Assign Homework — ClassConnect" },
      { name: "description", content: "Assign homework with due dates and manage past assignments." },
      { property: "og:title", content: "Assign Homework — ClassConnect" },
      {
        property: "og:description",
        content: "Assign homework with due dates and manage past assignments.",
      },
    ],
  }),
  component: TeacherHomework,
});

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function TeacherHomework() {
  const { classData, updateClass } = useGuard("teacher");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const homework = classData?.homework ?? [];

  const add = () => {
    if (!title || !description) {
      toast.error("Please fill in title and description");
      return;
    }
    if (dueDate && dueDate < todayKey()) {
      toast.error("Please pick today or a future date");
      return;
    }
    updateClass({
      homework: [...homework, { id: newId("h"), title, description, dueDate: dueDate || undefined }],
    });
    toast.success("Homework assigned");
    setOpen(false);
    setTitle("");
    setDescription("");
    setDueDate("");
  };

  return (
    <PageShell
      title="Homework"
      backTo="/teacher/dashboard"
      actions={<AddButton label="Assign homework" onClick={() => setOpen(true)} />}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Homework with a validity date disappears automatically once that date has passed.
      </p>
      {homework.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-7" />}
          title="No homework assigned yet"
          description="Tap the + button to assign homework"
        />
      ) : (
        <div className="space-y-3">
          {homework.map((item) => (
            <div key={item.id} className="cc-card flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                {item.dueDate ? (
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
                    <CalendarDays className="size-4" /> Valid until: {item.dueDate}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={`Delete ${item.title}`}
                onClick={() => {
                  updateClass({ homework: homework.filter((h) => h.id !== item.id) });
                  toast.success("Homework deleted");
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
        title="Assign Homework"
        submitLabel="Assign Homework"
        onClose={() => setOpen(false)}
        onSubmit={add}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Title *</span>
          <input
            className="cc-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Math Exercise 5.2"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Description *</span>
          <textarea
            className="cc-input min-h-28"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Homework details and instructions"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Valid until (Optional)</span>
          <input
            className="cc-input"
            type="date"
            min={todayKey()}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
      </Modal>
    </PageShell>
  );
}
