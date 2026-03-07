# Hilt Health - Project Config

## Supabase
- **Project ref:** `sdzeoeturtpkqlagobwj`
- **Project URL:** `https://sdzeoeturtpkqlagobwj.supabase.co`
- **Access token:** `sbp_d1ff5b67e4d842e2b5851b96c35be349f0e02881`

## SQL Deployment

Deploy a SQL file to the database:

```bash
PGPASSFILE=.pgpass psql "postgresql://postgres.sdzeoeturtpkqlagobwj@aws-1-us-east-2.pooler.supabase.com:5432/postgres" -f "<file_path>"
```

## Edge Function Deployment

Deploy edge functions using the Supabase CLI with the access token:

```bash
npx supabase functions deploy <function_name> --project-ref sdzeoeturtpkqlagobwj --token sbp_d1ff5b67e4d842e2b5851b96c35be349f0e02881
```
