export interface TeamMember {
  id: string;
  number: string;
  name: string;
  role: string;
  description: string;
  image: string;
}

export interface AboutContent {
  heroEyebrow: string;
  heroLine1: string;
  heroLine2: string;
  heroLine3: string;
  introText: string;
  founderEyebrow: string;
  founderHeadingNormal: string;
  founderHeadingItalic: string;
  founderName: string;
  founderRole: string;
  founderDescription: string;
  founderQuote: string;
  founderImage: string | null;
  teamEyebrow: string;
  teamHeadingNormal: string;
  teamHeadingItalic: string;
  teamMembers: TeamMember[];
  ctaEyebrow?: string;
  ctaLine1?: string;
  ctaLine2?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  ctaButtonHref?: string;
}

export interface CareerField {
  label: string;
  placeholder?: string;
}

export interface CareerContent {
  pageTitle: string;
  introText: string;
  fields: {
    name: CareerField;
    phone: CareerField;
    place: CareerField;
    aadhar: CareerField;
    designation: CareerField;
    portfolioLink: CareerField;
    resume: CareerField;
  };
  designationOptions: string[];
  applyButtonText: string;
}

export interface CareerFormData {
  name: string;
  phone: string;
  place: string;
  aadhar: string;
  designation: string;
  portfolioLink: string;
  resume: File | null;
}

export interface GalleryCouple {
  id?: string | number;
  slug: string;
  name: string;
  location?: string;
  description?: string;
  image?: string;
  img?: string;
}

export interface GalleryPhoto {
  id?: string | number;
  imageUrl?: string;
  image_url?: string;
  url?: string;
  visible?: boolean;
}

export interface BlogPost {
  id: string | number;
  type: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image?: string;
  imageUrl?: string;
  videoUrl?: string;
  content?: string;
  visible?: boolean;
}

export interface BlogContent {
  featuredLabel: string;
  featuredReadText: string;
  driveButtonText: string;
  driveButtonHref: string;
  latestEyebrow: string;
  latestHeading: string;
  latestDescription: string;
  readStoryText: string;
  posts: BlogPost[];
}

export type FilmCategory = 'Recent Cinema' | 'Wedding Films' | 'Cinematic Stories';

export interface FilmItem {
  id: string;
  videoUrl: string;
  title: string;
  category: FilmCategory;
  location: string;
  date: string;
  isActive?: boolean;
  order?: number;
  description?: string;
  isDraft?: boolean;
}

export interface FilmsContent {
  heroVideoText: string;
  heroVideoUrl: string;
  items: FilmItem[];
  statementEyebrow: string;
  statementHeading: string;
  statementText: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  otherService: string;
  startDate: string;
  endDate: string;
  location: string;
  message: string;
}
