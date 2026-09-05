import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Field } from "@/routes/auth.login";
import { PageShell } from "@/components/PageShell";
import { useClassConnect } from "@/lib/classconnect";

const searchSchema = z.object({
  role: z.enum(["teacher", "student"]).catch("student"),
});

export const Route = createFileRoute("/auth/sign-up")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Create your account — ClassConnect" },
      {
        name: "description",
        content:
          "Create a ClassConnect account as a teacher to start a class, or as a student to join with a room code.",
      },
      { property: "og:title", content: "Create your account — ClassConnect" },
      {
        property: "og:description",
        content: "Start a class as a teacher, or join your class with a 6-digit room code.",
      },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();
  const { signup } = useClassConnect();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [className, setClassName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || (!email && !phone) || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (role === "teacher" && !className) {
      toast.error("Please enter a class name");
      return;
    }
    if (role === "student" && !roomId) {
      toast.error("Please enter a room ID to join");
      return;
    }
    setLoading(true);
    try {
      signup({
        role,
        fullName,
        username,
        email: email || undefined,
        phone: phone || undefined,
        password,
        className: role === "teacher" ? className : undefined,
        roomId: role === "student" ? roomId : undefined,
      });
      toast.success("Account created!");
      navigate({ to: role === "teacher" ? "/teacher/dashboard" : "/student/dashboard" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Sign up" backTo="/">
      <div className="cc-card p-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {role === "teacher" ? "Create Teacher Account" : "Create Student Account"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Fill in your details to get started</p>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <Field label="Full Name *">
            <input
              className="cc-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </Field>
          <Field label="Username *">
            <input
              className="cc-input"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
              placeholder="username (letters, numbers, underscores)"
            />
          </Field>
          <Field label="Email">
            <input
              className="cc-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </Field>
          <Field label="Phone Number">
            <input
              className="cc-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
            />
          </Field>
          <Field label="Password *">
            <input
              className="cc-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 characters)"
            />
          </Field>

          {role === "teacher" ? (
            <Field label="Class Name *">
              <input
                className="cc-input"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Mathematics Grade 10"
              />
            </Field>
          ) : (
            <Field label="Room ID *">
              <input
                className="cc-input"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter 6-digit room code"
                maxLength={6}
              />
            </Field>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>

        {role === "student" ? (
          <p className="mt-4 rounded-xl bg-surface p-4 text-xs text-muted-foreground">
            Demo class room code: <span className="font-semibold text-foreground">482913</span>
          </p>
        ) : null}
      </div>
    </PageShell>
  );
}
