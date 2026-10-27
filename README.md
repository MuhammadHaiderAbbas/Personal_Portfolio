# Haider Abbas: portfolio

The source for [personalportfolio.website](https://personalportfolio.website).

- **Fast:** every page is pre-built HTML with its CSS inlined and no framework JavaScript. Images are WebP, sized for the web and lazy-loaded.
- **Editable:** an admin panel at `/admin/` lets you add, edit, hide and delete projects, blog posts, certifications, experience, education, skills, services and your profile. You can also upload images and your CV and read contact-form messages.
- **Publishing:** saving in the admin panel stores the change. **Publish site** rebuilds the pages, and the change is live in about a minute.

```
Admin panel ──save──▶ Supabase (database, login, uploads)
     │                        │
     └──Publish──▶ GitHub Actions ──reads content──┘
                          │
                          ▼
              GitHub Pages: personalportfolio.website
```

The site works before Supabase is set up: it then builds from `src/data/seed.json`.

---

## Setup

Allow about 20 minutes. Do the steps in order.

### 1. Switch GitHub Pages to GitHub Actions (before merging)

Repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The current site stays online until the first new deployment. Your custom domain setting stays as it is.

### 2. Merge the pull request

The **Deploy site** workflow runs (see the **Actions** tab) and the new site goes live with the built-in content. Everything below adds the admin panel.

### 3. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a free project. Choose the **London (eu-west-2)** region.
2. Open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**.
3. New query again: paste [`supabase/seed.sql`](supabase/seed.sql) and press **Run**. This copies the current site content into the database.

### 4. Create your admin login

1. **Authentication → Users → Add user → Create new user.** Enter your email and a strong password, and tick **Auto confirm user**.
2. **Authentication → Sign In / Providers:** turn off **Allow new users to sign up**. Only you should have an account.
3. **Authentication → URL Configuration:** set **Site URL** to `https://personalportfolio.website` and add `https://personalportfolio.website/admin/` under **Redirect URLs**. Password-reset emails need this.
4. In the SQL Editor, run this with your email to make yourself an admin:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

### 5. Let the Publish button rebuild the site

1. On GitHub: **profile picture → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.**
   - Name: `portfolio publish`. Expiration: up to 1 year (set a reminder to renew it).
   - Repository access: **Only select repositories → Personal_Portfolio**.
   - Permissions → Repository permissions → **Contents: Read and write**. Nothing else.
   - Copy the token.
2. In the Supabase SQL Editor, run (with your token pasted in):

   ```sql
   select vault.create_secret('github_pat_PASTE_YOUR_TOKEN', 'github_token');
   select vault.create_secret('MuhammadHaiderAbbas/Personal_Portfolio', 'github_repo');
   ```

   The token is stored encrypted in Supabase Vault and never reaches the browser.

   To replace an expired token later:

   ```sql
   select vault.update_secret(id, 'github_pat_NEW_TOKEN') from vault.secrets where name = 'github_token';
   ```

### 6. Connect the site to Supabase

1. In Supabase: **Project Settings → API Keys.** Copy the **Project URL** and the **anon** (or **publishable**) key. This key is designed to be public; the security rules in `schema.sql` decide what it can do. **Never use the `service_role` or secret key here.**
2. On GitHub: **Settings → Secrets and variables → Actions → Variables tab → New repository variable**, twice:
   - `PUBLIC_SUPABASE_URL` = the Project URL, e.g. `https://abcd1234.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY` = the anon/publishable key
3. **Actions → Deploy site → Run workflow.**

### 7. Sign in

Go to [personalportfolio.website/admin/](https://personalportfolio.website/admin/) and sign in. Edit something, press **Save**, then **Publish site**.

---

## Everyday use

| To… | Do this |
| --- | --- |
| Add a project or blog post | Admin → Projects or Blog posts → **Add**. Switch on **Show on the website** when it's ready, save, then **Publish site**. |
| Keep a draft | Leave **Show on the website** off. Drafts are never visible to visitors. |
| Change the order | Set **Position** (lower numbers first). |
| Feature a project on the homepage | Tick **Feature on the homepage** (up to 3 are shown). |
| Update your CV | Admin → Profile → CV → **Upload PDF**, save, publish. |
| Read messages | Admin → Messages. Use **Reply by email** to answer. |
| Check a publish | Click **Watch progress** after publishing, or open the **Actions** tab. |

The blog link appears in the menu automatically once at least one post is published.

## Developing locally

```bash
npm install
npm run dev        # http://localhost:4321, uses seed.json unless the variables below are set
npm run build      # production build into dist/
```

To use your Supabase data locally, create a `.env` file (it is git-ignored):

```
PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

After editing `src/data/seed.json`, run `npm run seed-sql` to regenerate `supabase/seed.sql`.

To add an image to the repository by hand (instead of uploading through the admin panel):

```bash
node scripts/optimize-images.mjs path/to/picture.png projects/my-project 1600
```

## How it fits together

| Path | What it is |
| --- | --- |
| `src/pages/` | The public pages and the admin page |
| `src/admin/schema.ts` | Every editable field. Add a field here and in `schema.sql` to make it editable |
| `src/admin/app.ts` | The admin panel |
| `src/lib/content.ts` | Loads content from Supabase (or `seed.json`) at build time |
| `supabase/schema.sql` | Tables, security rules, uploads and the publish function |
| `scripts/fetch-media.mjs` | Copies uploaded files onto the site at build time, so images are served from your own domain |
| `.github/workflows/deploy.yml` | Builds and deploys on merge, on Publish, on demand and nightly |

### Security

- Visitors can read published content and send contact messages, nothing else. Drafts, messages and uploads can only be read or changed by accounts in the `admins` table.
- The contact form refuses new messages after 30 in an hour, to limit spam floods.
- The GitHub token lives encrypted in Supabase Vault and is only used by the database's `publish_site()` function, which checks that the caller is an admin.

### Free-plan notes

- Supabase pauses free projects after a week without activity. The nightly rebuild queries the database every day, which should keep it active. Even if it is paused, the public pages and images keep working; only the contact form and admin panel need Supabase awake.
- GitHub turns off scheduled workflows after 60 days without commits. If that happens, Actions shows a banner to turn it back on; Publish still works either way.
