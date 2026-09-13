import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, FileText, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { AddButton, Modal } from "@/components/Modal";
import { EmptyState, PageShell } from "@/components/PageShell";
import { newId } from "@/lib/classconnect";

export const Route = createFileRoute("/teacher/study-materials")({
  head: () => ({
    meta: [
      { title: "Study Materials — ClassConnect" },
      { name: "description", content: "Share notes, files and resources with your students." },
      { property: "og:title", content: "Study Materials — ClassConnect" },
      { property: "og:description", content: "Share notes, files and resources with your students." },
    ],
  }),
  component: TeacherMaterials,
});

const BLOCKED = [".zip", ".rar", ".7z", ".tar", ".gz"];

function TeacherMaterials() {
  const { classData, updateClass } = useGuard("teacher");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const materials = classData?.materials ?? [];

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (BLOCKED.some((ext) => lower.endsWith(ext)) || lower.endsWith(".zip")) {
      toast.error("ZIP and other archive files are not allowed");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("File is too large. Please choose one under 3 MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(String(reader.result));
      setFileName(file.name);
      toast.success("File selected");
    };
    reader.onerror = () => toast.error("Could not read that file");
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setFileUrl("");
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const add = () => {
    if (!title || !description) {
      toast.error("Please fill in title and description");
      return;
    }
    updateClass({
      materials: [
        ...materials,
        {
          id: newId("m"),
          title,
          description,
          fileUrl: fileUrl || undefined,
          fileName: fileName || undefined,
        },
      ],
    });
    toast.success("Study material added");
    setOpen(false);
    setTitle("");
    setDescription("");
    clearFile();
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
                    download={item.fileName ?? "study-material"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <FileText className="size-4" /> {item.fileName ?? "Open file"}
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
        <div>
          <span className="mb-2 block text-sm font-semibold">File from your device (Optional)</span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,image/*,audio/*,video/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <Upload className="size-4" />
            {fileName ? "Choose a different file" : "Choose file from device"}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            ZIP and other archive files are not allowed. Maximum size 3 MB.
          </p>
          {fileName ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
              <span className="truncate text-sm font-medium">{fileName}</span>
              <button
                type="button"
                aria-label="Remove selected file"
                onClick={clearFile}
                className="text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </Modal>
    </PageShell>
  );
}
