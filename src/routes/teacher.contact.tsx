import { createFileRoute } from "@tanstack/react-router";
import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { ClassAvatar, PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/teacher/contact")({
  head: () => ({
    meta: [
      { title: "Contact Details — ClassConnect" },
      {
        name: "description",
        content: "Set the class picture, phone number and email your students see in support.",
      },
      { property: "og:title", content: "Contact Details — ClassConnect" },
      {
        property: "og:description",
        content: "Set the class picture, phone number and email your students see in support.",
      },
    ],
  }),
  component: TeacherContact,
});

function TeacherContact() {
  const { user, classData, updateProfile, updateClass } = useGuard("teacher");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setPhone(user.phone ?? "");
    setEmail(user.email ?? "");
  }, [user]);

  const pickPicture = (file: File | undefined) => {
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
      updateClass({ profileImage: String(reader.result) });
      toast.success("Class picture updated");
    };
    reader.onerror = () => toast.error("Could not read that image");
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim() && !email.trim()) {
      toast.error("Add at least a phone number or an email");
      return;
    }
    try {
      updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      toast.success("Contact details updated for your students");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <PageShell title="Contact Details" backTo="/teacher/dashboard">
      <ClassAvatar src={classData?.profileImage} name={classData?.className} />

      <div className="cc-card space-y-3 p-5">
        <p className="font-semibold">Class Picture</p>
        <p className="text-sm text-muted-foreground">
          Shown to your students at the top of the payment and support sections.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickPicture(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-accent"
        >
          <Upload className="size-4" />
          {classData?.profileImage ? "Choose a different picture" : "Choose picture from device"}
        </button>
        {classData?.profileImage ? (
          <button
            type="button"
            onClick={() => {
              updateClass({ profileImage: undefined });
              toast.success("Class picture removed");
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-destructive"
          >
            <X className="size-4" /> Remove picture
          </button>
        ) : null}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        These details appear in the Support section of your students' dashboard, so they can call,
        message on WhatsApp or email you.
      </p>

      <div className="cc-card mt-4 space-y-4 p-5">
        <div>
          <label className="text-sm font-semibold" htmlFor="cc-name">
            Display name
          </label>
          <input
            id="cc-name"
            className="cc-input mt-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="cc-phone">
            Phone number (WhatsApp)
          </label>
          <input
            id="cc-phone"
            className="cc-input mt-2"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="cc-email">
            Email address
          </label>
          <input
            id="cc-email"
            className="cc-input mt-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <button
          type="button"
          onClick={save}
          className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
        >
          Save Contact Details
        </button>
      </div>
    </PageShell>
  );
}
