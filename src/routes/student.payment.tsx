import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, CreditCard, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { ClassAvatar, EmptyState, PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/student/payment")({
  head: () => ({
    meta: [
      { title: "Fee Payment — ClassConnect" },
      { name: "description", content: "Fee details, UPI or bank details and QR code shared by your teacher." },
      { property: "og:title", content: "Fee Payment — ClassConnect" },
      {
        property: "og:description",
        content: "Fee details, UPI or bank details and QR code shared by your teacher.",
      },
    ],
  }),
  component: StudentPayment,
});

function StudentPayment() {
  const { classData } = useGuard("student");
  const payment = classData?.payment;
  const [copied, setCopied] = useState(false);

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

  const downloadQr = () => {
    const a = document.createElement("a");
    a.href = payment.qrCodeUrl;
    const ext = payment.qrCodeUrl.startsWith("data:image/jpeg") ? "jpg" : "png";
    a.download = `payment-qr.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(payment.paymentLink);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please copy it manually.");
    }
  };

  return (
    <PageShell title="Payment" backTo="/student/dashboard">
      <ClassAvatar src={classData?.profileImage} name={classData?.className} />

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
              <button
                type="button"
                onClick={downloadQr}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
              >
                <Download className="size-4" /> Download QR
              </button>
            </div>
          ) : null}

          {payment.paymentLink ? (
            <div className="cc-card p-5">
              <p className="font-semibold">UPI ID / Bank Details</p>
              <p className="mt-2 whitespace-pre-line break-words text-sm text-muted-foreground">
                {payment.paymentLink}
              </p>
              <button
                type="button"
                onClick={copyDetails}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy details"}
              </button>
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
