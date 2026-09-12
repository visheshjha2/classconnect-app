import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageShell({
  title,
  backTo,
  actions,
  children,
}: {
  title: string;
  backTo: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link
            to={backTo}
            aria-label="Go back"
            className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="flex-1 text-lg font-semibold tracking-tight">{title}</h1>
          {actions}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

export function ClassAvatar({
  src,
  name,
}: {
  src?: string | undefined;
  name?: string | undefined;
}) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      {src ? (
        <img
          src={src}
          alt={name ? `${name} class picture` : "Class picture"}
          className="size-24 rounded-full border border-border object-cover shadow-sm"
        />
      ) : (
        <span className="flex size-24 items-center justify-center rounded-full bg-accent text-3xl font-bold text-primary">
          {(name ?? "C").charAt(0).toUpperCase()}
        </span>
      )}
      {name ? <p className="mt-3 text-base font-semibold">{name}</p> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
