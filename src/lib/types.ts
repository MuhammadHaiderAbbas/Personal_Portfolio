export interface LinkItem {
  label: string;
  url: string;
}

export interface Discipline {
  label: string;
  category: string;
}

export interface Profile {
  name: string;
  short_name: string;
  headline: string;
  intro: string;
  about: string;
  availability: string;
  location: string;
  email: string;
  phone: string;
  photo_url: string;
  cv_url: string;
  disciplines: Discipline[];
  socials: LinkItem[];
  seo_description: string;
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tech: string[];
  cover_url: string;
  gallery: string[];
  body: string;
  live_url: string;
  repo_url: string;
  video_url: string;
  featured: boolean;
  published: boolean;
  sort_order: number;
  project_date: string | null;
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  cover_url: string;
  tags: string[];
  body: string;
  published: boolean;
  published_on: string;
}

export interface Certification {
  title: string;
  issuer: string;
  issued_label: string;
  credential_url: string;
  image_url: string;
  sort_order: number;
  published: boolean;
}

export interface TimelineItem {
  kind: 'work' | 'education';
  title: string;
  organisation: string;
  period: string;
  description: string;
  sort_order: number;
  published: boolean;
}

export interface Skill {
  group_name: string;
  name: string;
  sort_order: number;
}

export interface Service {
  title: string;
  description: string;
  sort_order: number;
  published: boolean;
}

export interface SiteContent {
  profile: Profile;
  projects: Project[];
  posts: Post[];
  certifications: Certification[];
  timeline: TimelineItem[];
  skills: Skill[];
  services: Service[];
  source: 'supabase' | 'seed';
}
