import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Database as DB } from "@/integrations/supabase/types";

type ClassRow = DB["public"]["Tables"]["classes"]["Row"];
type ClassUpdate = DB["public"]["Tables"]["classes"]["Update"];
type ProfileUpdate = DB["public"]["Tables"]["profiles"]["Update"];
import { lovable } from "@/integrations/lovable";
import { deleteMyAccount, signInWithUsername } from "@/lib/account.functions";

export type Role = "teacher" | "student";

export interface User {
  id: string;
  role: Role;
  fullName: string;
  username: string;
  email?: string | undefined;
  phone?: string | undefined;
}

export interface ScheduleItem {
  id: string;
  day?: string | undefined;
  days?: string[] | undefined;
  title: string;
  description?: string | undefined;
  startTime: string;
  endTime: string;
}

export function scheduleDays(item: ScheduleItem): string[] {
  if (item.days && item.days.length > 0) return item.days;
  return item.day ? [item.day] : [];
}

export interface MaterialItem {
  id: string;
  title: string;
  description: string;
  /** Viewable link (signed) or a freshly picked data URL waiting to be uploaded. */
  fileUrl?: string | undefined;
  fileName?: string | undefined;
}

export interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  dueDate?: string | undefined;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface ClassRecord {
  id: string;
  className: string;
  profileImage?: string | undefined;
  roomId: string;
  teacherId: string;
  memberIds: string[];
  blockedIds: string[];
  schedules: ScheduleItem[];
  materials: MaterialItem[];
  homework: HomeworkItem[];
  notifications: NotificationItem[];
  payment: {
    enabled: boolean;
    qrCodeUrl: string;
    paymentLink: string;
    instructions: string;
  };
}

interface SignupInput {
  role: Role;
  fullName: string;
  username: string;
  email?: string | undefined;
  phone?: string | undefined;
  password?: string | undefined;
  className?: string | undefined;
  roomId?: string | undefined;
}

interface Ctx {
  ready: boolean;
  /** Signed in, but no ClassConnect profile yet (e.g. first Google sign-in). */
  needsProfile: boolean;
  authEmail: string | null;
  user: User | null;
  classData: ClassRecord | null;
  teacher: User | null;
  students: User[];
  signup: (input: SignupInput) => Promise<void>;
  completeProfile: (input: SignupInput) => Promise<void>;
  login: (input: { role: Role; identifier: string; password: string; roomId?: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  joinClass: (roomId: string) => Promise<void>;
  updateProfile: (patch: Partial<Omit<User, "id" | "role">>) => Promise<void>;
  updateClass: (patch: Partial<ClassRecord>) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  toggleBlockStudent: (studentId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ClassConnectContext = createContext<Ctx | null>(null);
const BUCKET = "class-media";

export function newId(_prefix?: string) {
  return crypto.randomUUID();
}

function todayKey() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function syntheticEmail(username: string) {
  return `${username.toLowerCase().replace(/[^a-z0-9_.-]/g, "")}@users.classconnect.app`;
}

function toUser(p: {
  id: string;
  role: string;
  full_name: string;
  username: string;
  email: string | null;
  phone: string | null;
}): User {
  return {
    id: p.id,
    role: p.role as Role,
    fullName: p.full_name,
    username: p.username,
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
  };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(head ?? "")?.[1] ?? "application/octet-stream";
  const bin = atob(body ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function ClassConnectProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authId, setAuthId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [classData, setClassData] = useState<ClassRecord | null>(null);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  /** Storage paths behind the signed URLs currently shown. */
  const paths = useRef<{ profile?: string | null; qr?: string | null; materials: Record<string, string | null> }>({
    materials: {},
  });

  const load = useCallback(async (uid: string | null) => {
    if (!uid) {
      setUser(null);
      setClassData(null);
      setTeacher(null);
      setStudents([]);
      setReady(true);
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (!profile) {
      setUser(null);
      setClassData(null);
      setReady(true);
      return;
    }
    const me = toUser(profile);
    setUser(me);

    let klass: ClassRow | null = null;
    if (me.role === "teacher") {
      await supabase.rpc("purge_expired_homework");
      const { data } = await supabase.from("classes").select("*").eq("teacher_id", uid).maybeSingle();
      klass = data;
    } else {
      const { data: m } = await supabase
        .from("class_members")
        .select("class_id, blocked")
        .eq("student_id", uid)
        .eq("blocked", false)
        .limit(1)
        .maybeSingle();
      if (m) {
        const { data } = await supabase.from("classes").select("*").eq("id", m.class_id).maybeSingle();
        klass = data;
      }
    }

    if (!klass) {
      setClassData(null);
      setTeacher(null);
      setStudents([]);
      setReady(true);
      return;
    }

    const cid = klass.id as string;
    const [sch, mat, hw, nt, mem] = await Promise.all([
      supabase.from("schedules").select("*").eq("class_id", cid).order("created_at"),
      supabase.from("materials").select("*").eq("class_id", cid).order("created_at"),
      supabase.from("homework").select("*").eq("class_id", cid).order("created_at"),
      supabase.from("notifications").select("*").eq("class_id", cid).order("created_at", { ascending: false }),
      me.role === "teacher"
        ? supabase.from("class_members").select("student_id, blocked").eq("class_id", cid)
        : Promise.resolve({ data: [] as { student_id: string; blocked: boolean }[] }),
    ]);

    const members = mem.data ?? [];
    const peopleIds = me.role === "teacher" ? members.map((m) => m.student_id) : [klass.teacher_id as string];
    const { data: people } = peopleIds.length
      ? await supabase.from("profiles").select("*").in("id", peopleIds)
      : { data: [] };
    const peopleUsers = (people ?? []).map(toUser);

    const materials = mat.data ?? [];
    const toSign = [
      klass.profile_image_url as string | null,
      klass.payment_qr_url as string | null,
      ...materials.map((m) => m.file_url),
    ].filter((p): p is string => Boolean(p));
    const signed: Record<string, string> = {};
    if (toSign.length) {
      const { data: urls } = await supabase.storage.from(BUCKET).createSignedUrls(toSign, 60 * 60 * 24);
      for (const u of urls ?? []) if (u.path && u.signedUrl) signed[u.path] = u.signedUrl;
    }
    const sign = (p: string | null) => (p ? signed[p] : undefined);

    paths.current = {
      profile: klass.profile_image_url,
      qr: klass.payment_qr_url,
      materials: Object.fromEntries(materials.map((m) => [m.id, m.file_url])),
    };

    const today = todayKey();
    setClassData({
      id: cid,
      className: klass.class_name,
      roomId: klass.room_id,
      teacherId: klass.teacher_id,
      profileImage: sign(klass.profile_image_url),
      memberIds: members.map((m) => m.student_id),
      blockedIds: members.filter((m) => m.blocked).map((m) => m.student_id),
      schedules: (sch.data ?? []).map((s) => ({
        id: s.id,
        days: s.days,
        title: s.title,
        description: s.description ?? undefined,
        startTime: s.start_time,
        endTime: s.end_time,
      })),
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        fileUrl: sign(m.file_url),
        fileName: m.file_name ?? undefined,
      })),
      homework: (hw.data ?? [])
        .filter((h) => !h.due_date || h.due_date >= today)
        .map((h) => ({ id: h.id, title: h.title, description: h.description, dueDate: h.due_date ?? undefined })),
      notifications: (nt.data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.created_at,
      })),
      payment: {
        enabled: klass.payment_enabled,
        qrCodeUrl: sign(klass.payment_qr_url) ?? "",
        paymentLink: klass.payment_details ?? "",
        instructions: klass.payment_instructions ?? "",
      },
    });
    setTeacher(me.role === "teacher" ? me : (peopleUsers[0] ?? null));
    setStudents(me.role === "teacher" ? peopleUsers : []);
    setReady(true);
  }, []);

  const authIdRef = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const uid = data.session?.user.id ?? null;
      authIdRef.current = uid;
      setAuthId(uid);
      setAuthEmail(data.session?.user.email ?? null);
      void load(uid);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const uid = session?.user.id ?? null;
      setAuthEmail(session?.user.email ?? null);
      if (uid === authIdRef.current && event === "SIGNED_IN") return;
      authIdRef.current = uid;
      setAuthId(uid);
      // Defer out of the auth callback to avoid deadlocking the client.
      setTimeout(() => void load(uid), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const refresh = useCallback(() => load(authIdRef.current), [load]);

  const upload = async (dataUrl: string, name: string) => {
    const uid = authIdRef.current;
    if (!uid) throw new Error("You are not signed in");
    const blob = dataUrlToBlob(dataUrl);
    const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
    const path = `${uid}/${crypto.randomUUID()}-${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
    fail(error);
    return path;
  };

  const removeFile = async (path: string | null | undefined) => {
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  };

  const createProfileAndClass = async (uid: string, input: SignupInput, email: string | null) => {
    const { data: free } = await supabase.rpc("username_available", { _username: input.username });
    if (free === false) throw new Error("This username is already taken");
    const { error } = await supabase.from("profiles").insert({
      id: uid,
      role: input.role,
      full_name: input.fullName.trim(),
      username: input.username.trim(),
      email: input.email?.trim() || email,
      phone: input.phone?.trim() || null,
    });
    fail(error);
    if (input.role === "teacher") {
      const { data: room, error: roomErr } = await supabase.rpc("generate_room_id");
      fail(roomErr);
      const { error: cErr } = await supabase.from("classes").insert({
        teacher_id: uid,
        class_name: input.className?.trim() || "My Class",
        room_id: room as string,
      });
      fail(cErr);
    } else if (input.roomId) {
      const { error: jErr } = await supabase.rpc("join_class_by_room", { _room_id: input.roomId });
      fail(jErr);
    }
  };

  const signup: Ctx["signup"] = async (input) => {
    const username = input.username.trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username))
      throw new Error("Username must be 3–30 letters, numbers or underscores");
    if (!input.password || input.password.length < 6) throw new Error("Password must be at least 6 characters");
    const email = input.email?.trim() || syntheticEmail(username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { emailRedirectTo: window.location.origin },
    });
    fail(error);
    const uid = data.user?.id;
    if (!uid || !data.session) throw new Error("Could not create the account. Please try again.");
    await createProfileAndClass(uid, { ...input, username }, input.email?.trim() || null);
    await load(uid);
  };

  const completeProfile: Ctx["completeProfile"] = async (input) => {
    const uid = authIdRef.current;
    if (!uid) throw new Error("You are not signed in");
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(input.username.trim()))
      throw new Error("Username must be 3–30 letters, numbers or underscores");
    await createProfileAndClass(uid, input, authEmail);
    await load(uid);
  };

  const login: Ctx["login"] = async ({ role, identifier, password, roomId }) => {
    const id = identifier.trim();
    if (id.includes("@") && !id.startsWith("@")) {
      const { error } = await supabase.auth.signInWithPassword({ email: id, password });
      if (error) throw new Error("Invalid credentials. Please check and try again.");
    } else {
      const res = await signInWithUsername({ data: { username: id, password } });
      if (!res.ok) throw new Error(res.error);
      const { error } = await supabase.auth.setSession({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });
      fail(error);
    }
    const { data: s } = await supabase.auth.getUser();
    const uid = s.user?.id;
    if (!uid) throw new Error("Sign in failed");
    authIdRef.current = uid;
    setAuthId(uid);
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
    if (profile && profile.role !== role) {
      await supabase.auth.signOut();
      throw new Error(`This account is registered as a ${profile.role}`);
    }
    if (role === "student" && roomId?.trim()) {
      const { error } = await supabase.rpc("join_class_by_room", { _room_id: roomId.trim() });
      if (error) toast.error(error.message);
    }
    await load(uid);
  };

  const loginWithGoogle: Ctx["loginWithGoogle"] = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
  };

  const requestPasswordReset: Ctx["requestPasswordReset"] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    fail(error);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    authIdRef.current = null;
    setAuthId(null);
    await load(null);
  };

  const deleteAccount: Ctx["deleteAccount"] = async (password) => {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    const isGoogle = data.user?.app_metadata?.provider === "google";
    if (!email) throw new Error("You are not signed in");
    if (!isGoogle) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Incorrect password");
    }
    await deleteMyAccount();
    await logout();
  };

  const joinClass: Ctx["joinClass"] = async (roomId) => {
    const { error } = await supabase.rpc("join_class_by_room", { _room_id: roomId.trim() });
    fail(error);
    await refresh();
  };

  const updateProfile: Ctx["updateProfile"] = async (patch) => {
    const uid = authIdRef.current;
    if (!uid) throw new Error("You are not signed in");
    const row: ProfileUpdate = {};
    if (patch.fullName !== undefined) row.full_name = patch.fullName;
    if ("phone" in patch) row.phone = patch.phone ?? null;
    if ("email" in patch) row.email = patch.email ?? null;
    if (patch.username !== undefined) row.username = patch.username;
    const { error } = await supabase.from("profiles").update(row).eq("id", uid);
    fail(error);
    await refresh();
  };

  /** Applies a class change by saving only what differs from what is loaded. */
  const updateClassInner = async (patch: Partial<ClassRecord>) => {
    const current = classData;
    if (!current) return;
    const cid = current.id;
    const row: ClassUpdate = {};

    if (patch.className !== undefined) row.class_name = patch.className;

    if ("profileImage" in patch && patch.profileImage !== current.profileImage) {
      const old = paths.current.profile;
      row.profile_image_url = patch.profileImage?.startsWith("data:")
        ? await upload(patch.profileImage, "class-picture")
        : null;
      await removeFile(old);
    }

    if (patch.payment) {
      const p = patch.payment;
      row.payment_enabled = p.enabled;
      row.payment_details = p.paymentLink;
      row.payment_instructions = p.instructions;
      if (p.qrCodeUrl !== current.payment.qrCodeUrl) {
        const old = paths.current.qr;
        row.payment_qr_url = p.qrCodeUrl.startsWith("data:") ? await upload(p.qrCodeUrl, "payment-qr") : null;
        await removeFile(old);
      }
    }

    if (Object.keys(row).length) {
      const { error } = await supabase.from("classes").update(row).eq("id", cid);
      fail(error);
    }

    const diff = <T extends { id: string }>(next: T[] | undefined, prev: T[]) => {
      if (!next) return { added: [] as T[], removed: [] as string[] };
      const prevIds = new Set(prev.map((x) => x.id));
      const nextIds = new Set(next.map((x) => x.id));
      return {
        added: next.filter((x) => !prevIds.has(x.id)),
        removed: prev.filter((x) => !nextIds.has(x.id)).map((x) => x.id),
      };
    };

    const s = diff(patch.schedules, current.schedules);
    if (s.removed.length) fail((await supabase.from("schedules").delete().in("id", s.removed)).error);
    if (s.added.length)
      fail(
        (
          await supabase.from("schedules").insert(
            s.added.map((x) => ({
              id: x.id,
              class_id: cid,
              days: scheduleDays(x),
              title: x.title,
              description: x.description ?? null,
              start_time: x.startTime,
              end_time: x.endTime,
            })),
          )
        ).error,
      );

    const h = diff(patch.homework, current.homework);
    if (h.removed.length) fail((await supabase.from("homework").delete().in("id", h.removed)).error);
    if (h.added.length)
      fail(
        (
          await supabase.from("homework").insert(
            h.added.map((x) => ({
              id: x.id,
              class_id: cid,
              title: x.title,
              description: x.description,
              due_date: x.dueDate || null,
            })),
          )
        ).error,
      );

    const n = diff(patch.notifications, current.notifications);
    if (n.removed.length) fail((await supabase.from("notifications").delete().in("id", n.removed)).error);
    if (n.added.length)
      fail(
        (
          await supabase
            .from("notifications")
            .insert(n.added.map((x) => ({ id: x.id, class_id: cid, title: x.title, message: x.message })))
        ).error,
      );

    const m = diff(patch.materials, current.materials);
    if (m.removed.length) {
      fail((await supabase.from("materials").delete().in("id", m.removed)).error);
      for (const id of m.removed) await removeFile(paths.current.materials[id]);
    }
    for (const x of m.added) {
      const path = x.fileUrl?.startsWith("data:") ? await upload(x.fileUrl, x.fileName ?? "file") : null;
      fail(
        (
          await supabase.from("materials").insert({
            id: x.id,
            class_id: cid,
            title: x.title,
            description: x.description,
            file_url: path,
            file_name: x.fileName ?? null,
          })
        ).error,
      );
    }

    await refresh();
  };

  const updateClass: Ctx["updateClass"] = async (patch) => {
    try {
      await updateClassInner(patch);
    } catch (error) {
      toast.error(`Could not save: ${(error as Error).message}`);
      await refresh();
      throw error;
    }
  };

  const removeStudent: Ctx["removeStudent"] = async (studentId) => {
    if (!classData) return;
    const { error } = await supabase
      .from("class_members")
      .delete()
      .eq("class_id", classData.id)
      .eq("student_id", studentId);
    if (error) toast.error(error.message);
    await refresh();
  };

  const toggleBlockStudent: Ctx["toggleBlockStudent"] = async (studentId) => {
    if (!classData) return;
    const blocked = classData.blockedIds.includes(studentId);
    const { error } = await supabase
      .from("class_members")
      .update({ blocked: !blocked })
      .eq("class_id", classData.id)
      .eq("student_id", studentId);
    if (error) toast.error(error.message);
    await refresh();
  };

  return (
    <ClassConnectContext.Provider
      value={{
        ready,
        needsProfile: Boolean(authId) && !user && ready,
        authEmail,
        user,
        classData,
        teacher,
        students,
        signup,
        completeProfile,
        login,
        loginWithGoogle,
        requestPasswordReset,
        logout,
        deleteAccount,
        joinClass,
        updateProfile,
        updateClass,
        removeStudent,
        toggleBlockStudent,
        refresh,
      }}
    >
      {children}
    </ClassConnectContext.Provider>
  );
}

export function useClassConnect() {
  const ctx = useContext(ClassConnectContext);
  if (!ctx) throw new Error("useClassConnect must be used inside ClassConnectProvider");
  return ctx;
}
