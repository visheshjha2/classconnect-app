import { createFileRoute } from "@tanstack/react-router";
import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/teacher/payment")({
  head: () => ({
    meta: [
      { title: "Payment Settings — ClassConnect" },
      { name: "description", content: "Set fee instructions, UPI or bank details and a QR code for students." },
      { property: "og:title", content: "Payment Settings — ClassConnect" },
      {
        property: "og:description",
        content: "Set fee instructions, UPI or bank details and a QR code for students.",
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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!classData) return;
    setEnabled(classData.payment.enabled);
    setQrCodeUrl(classData.payment.qrCodeUrl);
    setPaymentLink(classData.payment.paymentLink);
    setInstructions(classData.payment.instructions);
  }, [classData?.id]);

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image is too large. Please choose one under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setQrCodeUrl(String(reader.result));
      toast.success("QR code image selected");
    };
    reader.onerror = () => toast.error("Could not read that image");
    reader.readAsDataURL(file);
  };

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
        <div>
          <span className="mb-2 block text-sm font-semibold">QR Code Image</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <Upload className="size-4" />
            {qrCodeUrl ? "Choose a different image" : "Choose image from device"}
          </button>
          {qrCodeUrl ? (
            <div className="mt-4 text-center">
              <img
                src={qrCodeUrl}
                alt="Preview of the payment QR code students will see"
                className="mx-auto size-48 rounded-xl border border-border object-contain"
              />
              <button
                type="button"
                onClick={() => setQrCodeUrl("")}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-destructive"
              >
                <X className="size-4" /> Remove image
              </button>
            </div>
          ) : null}
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">UPI ID or Bank Details</span>
          <textarea
            className="cc-input min-h-24"
            value={paymentLink}
            onChange={(e) => setPaymentLink(e.target.value)}
            placeholder={"e.g., yourname@upi\nor A/c 1234567890, IFSC ABCD0123456, Bank Name"}
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
