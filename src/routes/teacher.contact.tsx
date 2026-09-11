import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useGuard } from "@/components/Dashboard";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/teacher/contact")({
  head: () => ({
    meta: [
      { title: "Contact Details — ClassConnect" },
      {
        name: "description",
        content: "Set the phone number and email your students see in the support section.",
      },
      { property: "og:title", content: "Contact Details — ClassConnect" },
      {
        property: "og:description",
        content: "Set the phone number and email your students see in the support section.",
      },
    ],
  }),
  component: TeacherContact,
});

function TeacherContact() {
  const { user, updateProfile } = useGuard("teacher");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setPhone(user.phone ?? "");
    setEmail(user.email ?? "");
  }, [user]);

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
      <p className="text-sm text-muted-foreground">
        These details appear in the Support section of your students' dashboard, so they can call,
        message or email you.
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
            Phone number
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
