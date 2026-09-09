import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, ExternalLink } from "lucide-react";

import { useGuard } from "@/components/Dashboard";
import { EmptyState, PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/student/payment")({
  head: () => ({
    meta: [
      { title: "Fee Payment — ClassConnect" },
      { name: "description", content: "Fee details, payment link and QR code shared by your teacher." },
      { property: "og:title", content: "Fee Payment — ClassConnect" },
      {
        property: "og:description",
        content: "Fee details, payment link and QR code shared by your teacher.",
      },
    ],
  }),
  component: StudentPayment,
});

function StudentPayment() {
  const { classData } = useGuard("student");
  const payment = classData?.payment;

  if (!payment?.enabled) {
    return (
      <PageShell title="Payment" backTo="/student/dashboard">
        <EmptyState
          icon={<CreditCard className="size-7" />}
          title="Payment section not enabled"
          description="Your teacher has not set up payment information yet"
        />
      </PageShell>
    );
  }

  const hasDetails = payment.qrCodeUrl || payment.paymentLink || payment.instructions;

  return (
    <PageShell title="Payment" backTo="/student/dashboard">
      {!hasDetails ? (
        <EmptyState
          icon={<CreditCard className="size-7" />}
          title="Payment details not available"
          description="Contact your teacher for payment information"
        />
      ) : (
        <div className="space-y-4">
          {payment.qrCodeUrl ? (
            <div className="cc-card p-5 text-center">
              <p className="font-semibold">Scan QR Code</p>
              <img
                src={payment.qrCodeUrl}
                alt="Payment QR code shared by your teacher"
                className="mx-auto mt-4 size-56 rounded-xl border border-border object-contain"
              />
            </div>
          ) : null}

          {payment.paymentLink ? (
            <div className="cc-card p-5">
              <p className="font-semibold">Payment Link</p>
              <a
                href={payment.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
              >
                <ExternalLink className="size-4" /> Open Payment Link
              </a>
            </div>
          ) : null}

          {payment.instructions ? (
            <div className="cc-card p-5">
              <p className="font-semibold">Payment Instructions</p>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {payment.instructions}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
