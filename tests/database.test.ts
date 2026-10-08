import { PGlite } from "npm:@electric-sql/pglite@0.3.14";
import assert from "node:assert/strict";

Deno.test(
  "migrations enforce avatar ownership, role isolation and atomic SMS/call budgets",
  async () => {
    const db = new PGlite();
    try {
      await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, unique(bucket_id,name));
      alter table storage.objects enable row level security;
      create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
      grant usage on schema public,auth,storage to anon,authenticated,service_role;
    `);
      await db.exec(
        await Deno.readTextFile(
          new URL("../supabase/migrations/001_initial.sql", import.meta.url),
        ),
      );
      await db.exec(
        await Deno.readTextFile(
          new URL(
            "../supabase/migrations/002_profiles_calls_limits.sql",
            import.meta.url,
          ),
        ),
      );
      const a = "11111111-1111-4111-8111-111111111111";
      const b = "22222222-2222-4222-8222-222222222222";
      const group = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      await db.exec(`
      insert into auth.users(id) values ('${a}'), ('${b}');
      insert into public.groups(id,name) values ('${group}','test');
      update public.profiles set group_id='${group}' where id='${a}';
      grant select,insert,update,delete on public.profiles,storage.objects to authenticated;
      grant select on public.groups to authenticated;
      select set_config('request.jwt.claim.sub','${a}',false);
      set role authenticated;
    `);
      await db.exec(
        `insert into storage.objects(bucket_id,name) values ('avatars','${a}/profile.jpg')`,
      );
      await assert.rejects(() =>
        db.exec(
          `insert into storage.objects(bucket_id,name) values ('avatars','${b}/profile.jpg')`,
        ),
      );
      await assert.rejects(() =>
        db.exec(
          `insert into storage.objects(bucket_id,name) values ('avatars','${a}/extra.jpg')`,
        ),
      );
      await db.exec(
        `update public.profiles set role='therapist' where id='${a}'`,
      );
      const role = await db.query<{ role: string }>(
        `select role from public.profiles where id='${a}'`,
      );
      assert.equal(role.rows[0].role, "participant");
      await assert.rejects(() =>
        db.query("select public.reserve_sms('989123456789', 100)"),
      );
      await assert.rejects(() =>
        db.query(`select public.reserve_call_token('${a}')`),
      );
      await db.exec("reset role; set role anon;");
      await assert.rejects(() =>
        db.query("select public.reserve_sms('989123456789', 100)"),
      );
      await db.exec("reset role;");
      const reserve = async (phone: string, limit = 2) =>
        (
          await db.query<{ ok: boolean }>(
            "select public.reserve_sms($1,$2) ok",
            [phone, limit],
          )
        ).rows[0].ok;
      assert.equal(await reserve("989123456789"), true);
      assert.equal(await reserve("989123456789"), false);
      assert.equal(await reserve("989123456780"), true);
      assert.equal(await reserve("989123456781"), false);
      await db.exec("delete from public.service_usage");
      for (let i = 0; i < 5; i++) {
        assert.equal(await reserve("989123456789", 100), true);
        await db.exec(
          "update public.service_usage set last_used=now()-interval '61 seconds'",
        );
      }
      assert.equal(await reserve("989123456789", 100), false);
      for (let i = 0; i < 6; i++)
        assert.equal(
          (
            await db.query<{ ok: boolean }>(
              `select public.reserve_call_token('${a}') ok`,
            )
          ).rows[0].ok,
          true,
        );
      assert.equal(
        (
          await db.query<{ ok: boolean }>(
            `select public.reserve_call_token('${a}') ok`,
          )
        ).rows[0].ok,
        false,
      );
      const buckets = await db.query<{
        public: boolean;
        file_size_limit: number;
      }>(
        "select public,file_size_limit from storage.buckets where id='avatars'",
      );
      assert.equal(buckets.rows[0].public, false);
      assert.equal(Number(buckets.rows[0].file_size_limit), 2097152);
    } finally {
      await db.close();
    }
  },
);
