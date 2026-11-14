# Supabase database tests

Run the database tests only against a disposable local Supabase stack:

```sh
supabase start
supabase db reset
supabase test db
```

The RLS smoke test creates synthetic identities and case records inside a transaction, then rolls them back. It checks client case isolation, private message visibility, pending document download denial, case ownership on intake, and the restricted finance role. It contains no real client records or credentials.

Do not run the test fixture against the production project. Production acceptance must use dedicated synthetic accounts and a documented restore point.
