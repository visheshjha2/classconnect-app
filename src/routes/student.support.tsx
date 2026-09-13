import { createFileRoute } from "@tanstack/react-router";
import { AtSign, Mail, MessageCircle, Phone } from "lucide-react";

import { useGuard } from "@/components/Dashboard";
import { ClassAvatar, EmptyState, PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/student/support")({
  head: () => ({
    meta: [
      { title: "Support — ClassConnect" },
      { name: "description", content: "Contact your teacher by call, WhatsApp or email." },
      { property: "og:title", content: "Support — ClassConnect" },
      { property: "og:description", content: "Contact your teacher by call, WhatsApp or email." },
    ],
  }),
  component: StudentSupport,
});

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

function StudentSupport() {
  const { teacher, classData } = useGuard("student");

  if (!teacher) {
    return (
      <PageShell title="Support" backTo="/student/dashboard">
        <EmptyState icon={<Phone className="size-7" />} title="Teacher information not available" />
      </PageShell>
    );
  }

  return (
    <PageShell title="Support" backTo="/student/dashboard">
      <ClassAvatar src={classData?.profileImage} name={classData?.className} />

      <div className="cc-card flex items-center gap-4 p-5">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {teacher.fullName.charAt(0)}
        </span>
        <div>
          <p className="text-lg font-semibold">{teacher.fullName}</p>
          <p className="text-sm text-muted-foreground">@{teacher.username}</p>
        </div>
      </div>

      <div className="cc-card mt-4 divide-y divide-border">
        <p className="p-5 pb-3 font-semibold">Contact Information</p>
        <Row icon={<Phone className="size-4" />} label="Phone" value={teacher.phone ?? "—"} />
        <Row icon={<Mail className="size-4" />} label="Email" value={teacher.email ?? "—"} />
        <Row icon={<AtSign className="size-4" />} label="Username" value={`@${teacher.username}`} />
      </div>

      <div className="mt-4 space-y-3">
        <p className="font-semibold">Quick Actions</p>
        {teacher.phone ? (
          <>
            <Action href={`tel:${teacher.phone}`} icon={<Phone className="size-4" />} label="Call Teacher" />
            <Action
              href={whatsappLink(teacher.phone)}
              external
              icon={<MessageCircle className="size-4" />}
              label="WhatsApp"
            />
          </>
        ) : null}
        {teacher.email ? (
          <Action href={`mailto:${teacher.email}`} icon={<Mail className="size-4" />} label="Send Email" />
        ) : null}
      </div>
    </PageShell>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Action({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
    >
      {icon} {label}
    </a>
  );
}
