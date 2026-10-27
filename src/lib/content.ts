// Loads all site content once per build.
// With PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY set, content comes from Supabase
// (published rows only). Without them, the site builds from src/data/seed.json, which
// lets the site deploy before Supabase is set up.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import seed from '../data/seed.json';
import type { SiteContent } from './types';

const SUPABASE_URL = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

async function rest<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Supabase request failed for ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

const bySort = <T extends { sort_order?: number }>(a: T, b: T) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

function fromSeed(): SiteContent {
  const s = seed as unknown as Omit<SiteContent, 'source'>;
  return {
    profile: s.profile,
    projects: s.projects.filter((p) => p.published).sort(bySort),
    posts: s.posts.filter((p) => p.published).sort((a, b) => b.published_on.localeCompare(a.published_on)),
    certifications: s.certifications.filter((c) => c.published).sort(bySort),
    timeline: s.timeline.filter((t) => t.published).sort(bySort),
    skills: [...s.skills].sort(bySort),
    services: s.services.filter((x) => x.published).sort(bySort),
    source: 'seed',
  };
}

async function fromSupabase(): Promise<SiteContent> {
  const live = 'published=eq.true';
  const [profiles, projects, posts, certifications, timeline, skills, services] = await Promise.all([
    rest<SiteContent['profile'][]>('profile?id=eq.1&select=*'),
    rest<SiteContent['projects']>(`projects?${live}&select=*&order=sort_order.asc,project_date.desc.nullslast`),
    rest<SiteContent['posts']>(`posts?${live}&select=*&order=published_on.desc`),
    rest<SiteContent['certifications']>(`certifications?${live}&select=*&order=sort_order.asc`),
    rest<SiteContent['timeline']>(`timeline?${live}&select=*&order=sort_order.asc`),
    rest<SiteContent['skills']>(`skills?${live}&select=*&order=group_name.asc,sort_order.asc`),
    rest<SiteContent['services']>(`services?${live}&select=*&order=sort_order.asc`),
  ]);
  if (!profiles[0]) throw new Error('Supabase has no profile row. Run supabase/schema.sql and seed.sql.');
  return localiseMedia({
    profile: profiles[0],
    projects,
    posts,
    certifications,
    timeline,
    skills,
    services,
    source: 'supabase',
  });
}

// Point uploaded-file links at the copies that scripts/fetch-media.mjs saved in public/media/.
function localiseMedia(content: SiteContent): SiteContent {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/media/`;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const json = JSON.stringify(content).replace(new RegExp(`${escaped}([^\\s"'()<>\\\\]+)`, 'g'), (whole, file) => {
    const local = path.join(process.cwd(), 'public', 'media', decodeURIComponent(file));
    return existsSync(local) ? `/media/${file}` : whole;
  });
  return JSON.parse(json);
}

let cached: Promise<SiteContent> | undefined;

export function getContent(): Promise<SiteContent> {
  cached ??= SUPABASE_URL && SUPABASE_KEY ? fromSupabase() : Promise.resolve(fromSeed());
  return cached;
}

export const supabaseConfig = { url: SUPABASE_URL, key: SUPABASE_KEY };

export function md(text: string): string {
  return marked.parse(text ?? '', { async: false, gfm: true }) as string;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function youtubeId(url: string): string | null {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export function projectCategories(projects: SiteContent['projects']): string[] {
  return [...new Set(projects.map((p) => p.category).filter(Boolean))];
}
