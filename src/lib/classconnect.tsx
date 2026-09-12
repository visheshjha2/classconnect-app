import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "teacher" | "student";

export interface User {
  id: string;
  role: Role;
  fullName: string;
  username: string;
  email?: string | undefined;
  phone?: string | undefined;
  password: string;
}

export interface ScheduleItem {
  id: string;
  /** Legacy single-day field kept for older saved data. */
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

interface Database {
  users: User[];
  classes: ClassRecord[];
  sessionUserId: string | null;
}

const STORAGE_KEY = "classconnect_db_v1";

const emptyDb: Database = { users: [], classes: [], sessionUserId: null };

function seedDb(): Database {
  const teacher: User = {
    id: "u_teacher_demo",
    role: "teacher",
    fullName: "Ananya Sharma",
    username: "ananya",
    email: "ananya@classconnect.app",
    phone: "+919876543210",
    password: "demo123",
  };
  const student: User = {
    id: "u_student_demo",
    role: "student",
    fullName: "Rahul Verma",
    username: "rahul",
    email: "rahul@classconnect.app",
    phone: "+919812345678",
    password: "demo123",
  };
  const klass: ClassRecord = {
    id: "c_demo",
    className: "Mathematics Grade 10",
    roomId: "482913",
    teacherId: teacher.id,
    memberIds: [student.id],
    blockedIds: [],
    schedules: [
      {
        id: "s1",
        day: "Monday",
        title: "Algebra",
        description: "Quadratic equations practice",
        startTime: "09:00 AM",
        endTime: "10:30 AM",
      },
      {
        id: "s2",
        day: "Wednesday",
        title: "Geometry",
        description: "Circles and tangents",
        startTime: "11:00 AM",
        endTime: "12:30 PM",
      },
    ],
    materials: [
      {
        id: "m1",
        title: "Chapter 5 Notes",
        description: "Complete notes on quadratic equations with solved examples.",
        fileUrl: "https://example.com/chapter-5.pdf",
      },
    ],
    homework: [
      {
        id: "h1",
        title: "Math Exercise 5.2",
        description: "Solve questions 1 to 15 and show all working steps.",
        dueDate: "2026-09-12",
      },
    ],
    notifications: [
      {
        id: "n1",
        title: "Class Cancelled Tomorrow",
        message: "Tomorrow's 9 AM class is cancelled. We will cover the topic on Friday.",
        createdAt: new Date().toISOString(),
      },
    ],
    payment: {
      enabled: true,
      qrCodeUrl: "",
      paymentLink: "upi://pay?pa=example@upi",
      instructions: "Monthly fee: ₹500. Pay before 5th of every month.",
    },
  };
  return { users: [teacher, student], classes: [klass], sessionUserId: null };
}

function readDb(): Database {
  if (typeof window === "undefined") return emptyDb;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedDb();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Database;
  } catch {
    return emptyDb;
  }
}

function writeDb(db: Database) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/** Homework disappears by itself once its due date has passed. */
function pruneExpiredHomework(db: Database): Database {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  return {
    ...db,
    classes: db.classes.map((c) => ({
      ...c,
      homework: (c.homework ?? []).filter((h) => !h.dueDate || h.dueDate >= todayKey),
    })),
  };
}

const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const roomCode = () => String(Math.floor(100000 + Math.random() * 900000));

interface Ctx {
  ready: boolean;
  db: Database;
  user: User | null;
  classData: ClassRecord | null;
  teacher: User | null;
  students: User[];
  signup: (input: {
    role: Role;
    fullName: string;
    username: string;
    email?: string | undefined;
    phone?: string | undefined;
    password: string;
    className?: string | undefined;
    roomId?: string | undefined;
  }) => void;
  login: (input: {
    role: Role;
    identifier: string;
    password: string;
    roomId?: string | undefined;
  }) => void;
  resetPassword: (identifier: string, newPassword: string) => void;
  logout: () => void;
  deleteAccount: (password: string) => void;
  updateProfile: (patch: Partial<Pick<User, "fullName" | "email" | "phone">>) => void;
  updateClass: (patch: Partial<ClassRecord>) => void;
  removeStudent: (studentId: string) => void;
  toggleBlockStudent: (studentId: string) => void;
}

const ClassConnectContext = createContext<Ctx | null>(null);

export function ClassConnectProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(emptyDb);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDb(readDb());
    setReady(true);
  }, []);

  const commit = useCallback((next: Database) => {
    writeDb(next);
    setDb(next);
  }, []);

  const user = useMemo(
    () => db.users.find((u) => u.id === db.sessionUserId) ?? null,
    [db],
  );

  const classData = useMemo(() => {
    if (!user) return null;
    if (user.role === "teacher") {
      return db.classes.find((c) => c.teacherId === user.id) ?? null;
    }
    return db.classes.find((c) => c.memberIds.includes(user.id)) ?? null;
  }, [db, user]);

  const teacher = useMemo(
    () => (classData ? db.users.find((u) => u.id === classData.teacherId) ?? null : null),
    [db, classData],
  );

  const students = useMemo(
    () =>
      classData
        ? classData.memberIds
            .map((mid) => db.users.find((u) => u.id === mid))
            .filter((u): u is User => Boolean(u))
        : [],
    [db, classData],
  );

  const signup: Ctx["signup"] = (input) => {
    const current = readDb();
    if (input.password.length < 6) throw new Error("Password must be at least 6 characters");
    if (current.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
      throw new Error("This username is already taken");
    }
    const newUser: User = {
      id: id("u"),
      role: input.role,
      fullName: input.fullName,
      username: input.username,
      email: input.email,
      phone: input.phone,
      password: input.password,
    };
    const next: Database = {
      ...current,
      users: [...current.users, newUser],
      sessionUserId: newUser.id,
    };

    if (input.role === "teacher") {
      next.classes = [
        ...current.classes,
        {
          id: id("c"),
          className: input.className ?? "My Class",
          roomId: roomCode(),
          teacherId: newUser.id,
          memberIds: [],
          blockedIds: [],
          schedules: [],
          materials: [],
          homework: [],
          notifications: [],
          payment: { enabled: false, qrCodeUrl: "", paymentLink: "", instructions: "" },
        },
      ];
    } else {
      const target = current.classes.find((c) => c.roomId === input.roomId);
      if (!target) throw new Error("No class found with that Room ID");
      next.classes = current.classes.map((c) =>
        c.id === target.id ? { ...c, memberIds: [...c.memberIds, newUser.id] } : c,
      );
    }
    commit(next);
  };

  const login: Ctx["login"] = ({ role, identifier, password, roomId }) => {
    const current = readDb();
    const needle = identifier.replace(/^@/, "").toLowerCase();
    const found = current.users.find(
      (u) =>
        u.role === role &&
        (u.username.toLowerCase() === needle ||
          u.email?.toLowerCase() === needle ||
          u.phone === identifier),
    );
    if (!found || found.password !== password) {
      throw new Error("Invalid credentials. Please check and try again.");
    }
    if (role === "student") {
      const klass = current.classes.find((c) => c.memberIds.includes(found.id));
      if (!klass) {
        const target = current.classes.find((c) => c.roomId === roomId);
        if (!target) throw new Error("Enter a valid Room ID to join your class");
        current.classes = current.classes.map((c) =>
          c.id === target.id ? { ...c, memberIds: [...c.memberIds, found.id] } : c,
        );
      } else if (klass.blockedIds.includes(found.id)) {
        throw new Error("Your access to this class has been blocked by the teacher");
      }
    }
    commit({ ...current, sessionUserId: found.id });
  };

  const resetPassword: Ctx["resetPassword"] = (identifier, newPassword) => {
    const current = readDb();
    const needle = identifier.replace(/^@/, "").toLowerCase();
    const found = current.users.find(
      (u) =>
        u.username.toLowerCase() === needle ||
        u.email?.toLowerCase() === needle ||
        u.phone === identifier,
    );
    if (!found) throw new Error("User not found");
    commit({
      ...current,
      users: current.users.map((u) =>
        u.id === found.id ? { ...u, password: newPassword } : u,
      ),
    });
  };

  const logout = () => commit({ ...readDb(), sessionUserId: null });

  const deleteAccount: Ctx["deleteAccount"] = (password) => {
    const current = readDb();
    const me = current.users.find((u) => u.id === current.sessionUserId);
    if (!me) throw new Error("You are not signed in");
    if (me.password !== password) throw new Error("Incorrect password");
    commit({
      users: current.users.filter((u) => u.id !== me.id),
      classes:
        me.role === "teacher"
          ? current.classes.filter((c) => c.teacherId !== me.id)
          : current.classes.map((c) => ({
              ...c,
              memberIds: c.memberIds.filter((m) => m !== me.id),
            })),
      sessionUserId: null,
    });
  };

  const updateProfile: Ctx["updateProfile"] = (patch) => {
    const current = readDb();
    if (!current.sessionUserId) throw new Error("You are not signed in");
    commit({
      ...current,
      users: current.users.map((u) =>
        u.id === current.sessionUserId ? { ...u, ...patch } : u,
      ),
    });
  };

  const updateClass: Ctx["updateClass"] = (patch) => {
    const current = readDb();
    if (!classData) return;
    commit({
      ...current,
      classes: current.classes.map((c) => (c.id === classData.id ? { ...c, ...patch } : c)),
    });
  };

  const removeStudent: Ctx["removeStudent"] = (studentId) => {
    if (!classData) return;
    updateClass({
      memberIds: classData.memberIds.filter((m) => m !== studentId),
      blockedIds: classData.blockedIds.filter((m) => m !== studentId),
    });
  };

  const toggleBlockStudent: Ctx["toggleBlockStudent"] = (studentId) => {
    if (!classData) return;
    const blocked = classData.blockedIds.includes(studentId);
    updateClass({
      blockedIds: blocked
        ? classData.blockedIds.filter((m) => m !== studentId)
        : [...classData.blockedIds, studentId],
    });
  };

  return (
    <ClassConnectContext.Provider
      value={{
        ready,
        db,
        user,
        classData,
        teacher,
        students,
        signup,
        login,
        resetPassword,
        logout,
        deleteAccount,
        updateProfile,
        updateClass,
        removeStudent,
        toggleBlockStudent,
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

export const newId = id;
