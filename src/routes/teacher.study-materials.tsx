import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { AddButton, Modal } from "@/components/Modal";
import { EmptyState, PageShell } from "@/components/PageShell";
import { newId } from "@/lib/classconnect";

export const Route = createFileRoute("/teacher/study-materials")({
  head: () => ({
    meta: [
      { title: "Study Materials — ClassConnect" },
      { name: "description", content: "Share notes, links and resources with your students." },
      { property: "og:title", content: "Study Materials — ClassConnect" },
      { property: "og:description", content: "Share notes, links and resources with your students." },
    ],
  }),
  component: TeacherMaterials,
});

function TeacherMaterials() {
  const { classData, updateClass } = useGuard("teacher");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const materials = classData?.materials ?? [];

  const add = () => {
    if (!title || !description) {
      toast.error("Please fill in title and description");
      return;
    }
    updateClass({
      materials: [
        ...materials,
        { id: newId("m"), title, description, fileUrl: fileUrl || undefined },
      ],
    });
    toast.success("Study material added");
    setOpen(false);
    setTitle("");
    setDescription("");
    setFileUrl("");
  };

  return (
    <PageShell
      title="Study Materials"
      backTo="/teacher/dashboard"
      actions={<AddButton label="Add material" onClick={() => setOpen(true)} />}
    >
      {materials.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-7" />}
          title="No study materials yet"
          description="Tap the + button to share your first resource"
        />
      ) : (
        <div className="space-y-3">
          {materials.map((item) => (
            <div key={item.id} className="cc-card flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                {item.fileUrl ? (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <ExternalLink className="size-4" /> Open File
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={`Delete ${item.title}`}
                onClick={() => {
                  updateClass({ materials: materials.filter((m) => m.id !== item.id) });
                  toast.success("Study material deleted");
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
        title="Add Study Material"
        submitLabel="Add Material"
        onClose={() => setOpen(false)}
        onSubmit={add}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Title *</span>
          <input
            className="cc-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 5 Notes"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Description *</span>
          <textarea
            className="cc-input min-h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this resource covers"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">File or Link (Optional)</span>
          <input
            className="cc-input"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
      </Modal>
    </PageShell>
  );
}
