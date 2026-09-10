import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/teacher/payment")({
  head: () => ({
    meta: [
      { title: "Payment Settings — ClassConnect" },
      { name: "description", content: "Set fee instructions, a payment link and a QR code for students." },
      { property: "og:title", content: "Payment Settings — ClassConnect" },
      {
        property: "og:description",
        content: "Set fee instructions, a payment link and a QR code for students.",
      },
    ],
  }),
  component: TeacherPayment,
});

function TeacherPayment() {
  const { classData, updateClass } = useGuard("teacher");
  const [enabled, setEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (!classData) return;
    setEnabled(classData.payment.enabled);
    setQrCodeUrl(classData.payment.qrCodeUrl);
    setPaymentLink(classData.payment.paymentLink);
    setInstructions(classData.payment.instructions);
  }, [classData?.id]);

  const save = () => {
    updateClass({ payment: { enabled, qrCodeUrl, paymentLink, instructions } });
    toast.success("Payment settings saved");
  };

  return (
    <PageShell title="Payment" backTo="/teacher/dashboard">
      <div className="cc-card flex items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold">Show payment section to students</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When off, students will not see the payment option
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Show payment section to students"
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full bg-card transition-all ${
              enabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      <div className="cc-card mt-4 space-y-4 p-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">QR Code Image URL</span>
          <input
            className="cc-input"
            value={qrCodeUrl}
            onChange={(e) => setQrCodeUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Payment Link</span>
          <input
            className="cc-input"
            value={paymentLink}
            onChange={(e) => setPaymentLink(e.target.value)}
            placeholder="upi://pay?pa=yourid@upi"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Payment Instructions</span>
          <textarea
            className="cc-input min-h-28"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., Monthly fee: ₹500. Pay before 5th of every month."
          />
        </label>
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="Preview of the payment QR code students will see"
            className="mx-auto size-48 rounded-xl border border-border object-contain"
          />
        ) : null}
        <button
          type="button"
          onClick={save}
          className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
        >
          Save Payment Settings
        </button>
      </div>
    </PageShell>
  );
}
