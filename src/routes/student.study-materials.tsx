import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Download } from "lucide-react";

import { useGuard } from "@/components/Dashboard";
import { EmptyState, PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/student/study-materials")({
  head: () => ({
    meta: [
      { title: "Study Materials — ClassConnect" },
      { name: "description", content: "Notes and learning resources shared by your teacher." },
      { property: "og:title", content: "Study Materials — ClassConnect" },
      { property: "og:description", content: "Notes and learning resources shared by your teacher." },
    ],
  }),
  component: StudentMaterials,
});

function StudentMaterials() {
  const { classData } = useGuard("student");
  const materials = classData?.materials ?? [];

  return (
    <PageShell title="Study Materials" backTo="/student/dashboard">
      {materials.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-7" />}
          title="No study materials available"
          description="Your teacher has not uploaded any resources yet"
        />
      ) : (
        <div className="space-y-3">
          {materials.map((item) => (
            <div key={item.id} className="cc-card p-4">
              <p className="text-lg font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              {item.fileUrl ? (
                <a
                  href={item.fileUrl}
                  download={item.fileName ?? "study-material"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
                >
                  <Download className="size-4" /> {item.fileName ?? "Open File"}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
