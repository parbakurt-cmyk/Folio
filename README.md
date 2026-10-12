# Folio – Online Portfolio Template Generator

**Description:** Enter your details, save them to an online database, choose one of 3 resume templates (Classic, Modern, Professional), preview the result, then edit or delete it.

**Technologies:** HTML, CSS, JavaScript (no framework), Supabase JS client
**Database platform:** Supabase (PostgreSQL) – project name: _your project name_
**Hosting:** GitHub Pages
**Live URL:** _paste your GitHub Pages link here_

## Database structure
Table `portfolios` (see `schema.sql`): id, user_id (unique), full_name, email, phone, address, about, education, skills, projects, experience, links, photo, template (1–3), created_at, updated_at.
Row Level Security is on: each visitor can only read, edit or delete their own row.

## Setup
1. Create a Supabase project. In **Authentication → Sign In / Providers**, turn on **Allow anonymous sign-ins**.
2. Run `schema.sql` in the SQL Editor.
3. Copy the project URL and the **anon** key into `config.js` (never the service_role key or database password).
4. Push to GitHub and enable **Settings → Pages** (branch `main`, folder `/root`).


## Notes
Built with AI assistance (Claude), then tested and customized by the student.