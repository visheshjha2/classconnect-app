CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('teacher','student')),
  full_name text NOT NULL,
  username text NOT NULL,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_key ON public.profiles (lower(username));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_name text NOT NULL DEFAULT 'My Class',
  room_id text NOT NULL UNIQUE,
  profile_image_url text,
  payment_enabled boolean NOT NULL DEFAULT false,
  payment_qr_url text,
  payment_details text,
  payment_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_members TO authenticated;
GRANT ALL ON public.class_members TO service_role;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  days text[] NOT NULL DEFAULT '{}',
  title text NOT NULL,
  description text,
  start_time text NOT NULL,
  end_time text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  file_url text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes c WHERE c.id = _class_id AND c.teacher_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(_class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members m
    WHERE m.class_id = _class_id AND m.student_id = auth.uid() AND m.blocked = false
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_class(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.class_members m ON m.class_id = c.id
    WHERE (c.teacher_id = _a AND m.student_id = _b)
       OR (c.teacher_id = _b AND m.student_id = _a)
  );
$$;

CREATE OR REPLACE FUNCTION public.username_available(_username text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(trim(_username)));
$$;

CREATE OR REPLACE FUNCTION public.generate_room_id()
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE candidate text;
BEGIN
  LOOP
    candidate := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.classes WHERE room_id = candidate);
  END LOOP;
  RETURN candidate;
END; $$;

CREATE OR REPLACE FUNCTION public.join_class_by_room(_room_id text)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid; is_blocked boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id INTO target FROM public.classes WHERE room_id = trim(_room_id);
  IF target IS NULL THEN RAISE EXCEPTION 'No class found with that Room ID'; END IF;
  SELECT blocked INTO is_blocked FROM public.class_members WHERE class_id = target AND student_id = auth.uid();
  IF is_blocked THEN RAISE EXCEPTION 'Your access to this class has been blocked by the teacher'; END IF;
  INSERT INTO public.class_members (class_id, student_id)
  VALUES (target, auth.uid())
  ON CONFLICT (class_id, student_id) DO NOTHING;
  RETURN target;
END; $$;

CREATE OR REPLACE FUNCTION public.purge_expired_homework()
RETURNS void LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.homework WHERE due_date IS NOT NULL AND due_date < current_date;
$$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_class_teacher(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_class_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.shares_class(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.username_available(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_room_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_class_by_room(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purge_expired_homework() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_class_teacher(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_class(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_room_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_class_by_room(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_homework() TO authenticated;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.shares_class(auth.uid(), id));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "classes_select" ON public.classes FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.is_class_member(id));
CREATE POLICY "classes_insert_own" ON public.classes FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "classes_update_own" ON public.classes FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "classes_delete_own" ON public.classes FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "members_select" ON public.class_members FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_class_teacher(class_id));
CREATE POLICY "members_insert_self" ON public.class_members FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "members_update" ON public.class_members FOR UPDATE TO authenticated
  USING (public.is_class_teacher(class_id)) WITH CHECK (public.is_class_teacher(class_id));
CREATE POLICY "members_delete" ON public.class_members FOR DELETE TO authenticated
  USING (student_id = auth.uid() OR public.is_class_teacher(class_id));

CREATE POLICY "schedules_select" ON public.schedules FOR SELECT TO authenticated
  USING (public.is_class_teacher(class_id) OR public.is_class_member(class_id));
CREATE POLICY "schedules_write" ON public.schedules FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id)) WITH CHECK (public.is_class_teacher(class_id));

CREATE POLICY "materials_select" ON public.materials FOR SELECT TO authenticated
  USING (public.is_class_teacher(class_id) OR public.is_class_member(class_id));
CREATE POLICY "materials_write" ON public.materials FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id)) WITH CHECK (public.is_class_teacher(class_id));

CREATE POLICY "homework_select" ON public.homework FOR SELECT TO authenticated
  USING (public.is_class_teacher(class_id) OR public.is_class_member(class_id));
CREATE POLICY "homework_write" ON public.homework FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id)) WITH CHECK (public.is_class_teacher(class_id));

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (public.is_class_teacher(class_id) OR public.is_class_member(class_id));
CREATE POLICY "notifications_write" ON public.notifications FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id)) WITH CHECK (public.is_class_teacher(class_id));

CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_classes_updated BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_members_updated BEFORE UPDATE ON public.class_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_schedules_updated BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_materials_updated BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_homework_updated BEFORE UPDATE ON public.homework FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_notifications_updated BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();