import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react';

import { uploadToCloudinary } from '../services/cloudinary';
import { API_URL, buildApiUrl, readApiJson } from '../services/api';

const API_BASE_URL = API_URL;
/* =========================================================
   ASSETS LOOKUP FOR INITIAL VALUES MATCHING HOME.JSX
========================================================= */





const portfolioFiles = import.meta.glob(
  '../assets/portfolio/wedding/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true, import: 'default' }
);

const videoFiles2 = import.meta.glob(
  '../assets/portfolio/wedding/video2/**/*.{mp4,MP4,mov,MOV,webm}',
  { eager: true, import: 'default' }
);

const videoFiles3 = import.meta.glob(
  '../assets/portfolio/wedding/video3/**/*.{mp4,MP4,mov,MOV,webm}',
  { eager: true, import: 'default' }
);

const allVideoUrls2 = Object.values(videoFiles2).filter((value): value is string => typeof value === 'string');
const allVideoUrls3 = Object.values(videoFiles3).filter((value): value is string => typeof value === 'string');

function findPortfolioImage(folder: string, filename: string): string | null {
  const entries = Object.entries(portfolioFiles) as [string, string][];
  const found = entries.find(([path]) => {
    const normalized = path.replace(/\\/g, '/');
    return (
      normalized.includes(`/wedding/${folder}/`) &&
      normalized.toLowerCase().includes(`/${filename.toLowerCase()}.`)
    );
  });
  return found?.[1] || null;
}

function findVideoByName(files: Record<string, unknown>, filename: string): string | null {
  const entries = Object.entries(files);
  const found = entries.find(([path]) => {
    const normalized = path.replace(/\\/g, '/').toLowerCase();
    return normalized.includes(filename.toLowerCase());
  });
  return typeof found?.[1] === 'string' ? found[1] : null;
}

const kapilPayal01 =
  findPortfolioImage('Kapil&Payal1', '02') ||
  findPortfolioImage('Kapil&Payal1', '035A2163');
const pratikMegha01 = findPortfolioImage('PRATIK & MEGHA', 'DSC00039');
const tanmayAchal01 = findPortfolioImage('Tanmay&Achal', '01');

const image01 = kapilPayal01 || '';
const image04 = pratikMegha01 || '';
const image07 = tanmayAchal01 || '';

const defaultSoulCinemaVideo =
  findVideoByName(videoFiles2, 'KAPIL PAYAL WEDDING FILM HIGH CORRECTION') ||
  allVideoUrls3[0] ||
  allVideoUrls2[0] ||
  '';

const defaultCollageImages = Object.values(portfolioFiles)
  .filter((value): value is string => typeof value === 'string')
  .slice(0, 32);

type HomeSlide = { id: string; title: string; image: string };
type HomeCollageImage = { url: string; visible: boolean };
type HomeCoupleItem = {
  id: string;
  name: string;
  img: string;
};
type HomeVideoItem = { id: string; title: string; url: string };
type HomeTestimonialItem = { id: string; quote: string; author: string };

type HomeContent = {
  slides: HomeSlide[];
  about: {
    eyebrow: string;
    heading: string;
    italicHeading: string;
    intro: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    ending: string;
    buttonText: string;
  };
  collage: {
    heading: string;
    eyebrow: string;
    images: HomeCollageImage[];
  };
  couples: {
    heading: string;
    italicHeading: string;
    items: HomeCoupleItem[];
  };
  videos: {
    eyebrow: string;
    heading: string;
    italicHeading: string;
    items: HomeVideoItem[];
  };
  soulCinema: {
    eyebrow: string;
    brandEyebrow: string;
    heading: string;
    description: string;
    videoUrl: string;
  };
  testimonials: {
    eyebrow: string;
    items: HomeTestimonialItem[];
  };
};

type HomeSectionField = keyof HomeContent;

const defaultHeroSlides: HomeSlide[] = [
  { id: 'hero-1', title: 'Slide 01', image: '' },
  { id: 'hero-2', title: 'Slide 02', image: '' },
  { id: 'hero-3', title: 'Slide 03', image: '' },
];

/* =========================================================
   EXACT DEFAULT HOME CONTENT MATCHING CURRENT HOME.JSX
========================================================= */

const buildInitialHomeContent = (): HomeContent => ({
  slides: [...defaultHeroSlides],

  about: {
    eyebrow: 'Ni3 Cinema & SAN',
    heading: 'Capturing Your Precious Moments',
    italicHeading: 'With Love & Creativity',
    intro:
      'Welcome to Ni3 Cinema & SAN — where beautiful moments become timeless memories.',
    paragraph1:
      'We specialise in capturing the most special occasions of your life with creativity, care, and attention to every little detail. Whether it’s the happiness of a wedding, the excitement of a pre-wedding shoot, the celebration of a birthday, the beautiful journey of maternity, or the innocent smiles of children, we make sure every precious moment is captured naturally and beautifully.',
    paragraph2:
      'Our goal is not just to take photographs, but to capture emotions, relationships, happiness, and memories that you can cherish for a lifetime.',
    paragraph3:
      'From the first smile to the biggest celebration, we turn your special moments into beautiful stories.',
    ending: 'Your Moments. Our Passion. Memories Forever.',
    buttonText: 'Explore Our Work',
  },

  collage: {
    heading:
      'What if it could never be recorded? A chronology of a couples journey where they vow together to be One.',
    eyebrow: 'WE ARE CREATING FICTION OUT OF REALITY',
    images: defaultCollageImages.map((url) => ({ url, visible: true })),
  },

  couples: {
    heading: 'Real love',
    italicHeading: 'stories.',
    items: [
      { id: 'couple-0', name: 'Kapil & Payal', img: image01 },
      { id: 'couple-1', name: 'Pratik & Megha', img: image04 },
      { id: 'couple-2', name: 'Tanmay & Achal', img: image07 },
      { id: 'couple-3', name: 'Rohan & Anjali', img: '' },
      { id: 'couple-4', name: 'Story 05', img: '' },
      { id: 'couple-5', name: 'Story 06', img: '' },
    ],
  },

  videos: {
    eyebrow: 'WATCH OUR FILMS',
    heading: 'Moving memories that tell',
    italicHeading: 'your story.',
    items: [
      { id: 'video-1', title: 'Film 1', url: allVideoUrls2[0] || '' },
      { id: 'video-2', title: 'Film 2', url: allVideoUrls2[1] || '' },
    ].filter((v) => v.url),
  },

  soulCinema: {
    eyebrow: 'AWARD WINNING FILMS',
    brandEyebrow: 'NI3 CINEMA & SAN',
    heading: 'SOUL + CINEMA',
    description:
      'Every frame tells a story — captured with heart, framed with soul, and made to be relived for a lifetime.',
    videoUrl: defaultSoulCinemaVideo,
  },

  testimonials: {
    eyebrow: 'KIND WORDS',
    items: [
      {
        id: 'test-1',
        quote:
          'Every photograph brought our memories back to life. The moments feel natural, emotional and truly ours.',
        author: 'A HAPPY SAN FAMILY',
      },
      {
        id: 'test-2',
        quote:
          'They captured the laughter, the tears and all the little details we never wanted to forget.',
        author: 'A HAPPY COUPLE',
      },
      {
        id: 'test-3',
        quote:
          'Beautiful work, wonderful team and memories we will cherish for a lifetime.',
        author: 'A HAPPY CLIENT',
      },
    ],
  },
});

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const MAX_COUPLES = 6;
const normalizeCollageImages = (images: Array<string | { url?: string; image?: string; visible?: boolean }>): HomeCollageImage[] =>
  images.map((image) =>
    typeof image === 'string'
      ? { url: image, visible: true }
      : {
          ...image,
          url: image?.url || image?.image || '',
          visible: image?.visible !== false,
        }
  );

function normalizeCoupleStories(savedItems: unknown, fallback: HomeCoupleItem[]): HomeCoupleItem[] {
  if (!Array.isArray(savedItems)) return fallback;

  return savedItems.map((savedItem) => {
    const homeItem = savedItem as Record<string, unknown>;
    return {
      id: String(homeItem.id ?? ''),
      name: String(homeItem.name ?? ''),
      img: String(homeItem.img ?? ''),
    };
  });
}

/* =========================================================
  MERGE SAVED CONTENT FROM MYSQL
========================================================= */

function mergeWithSaved(initial: HomeContent, saved: Record<string, unknown>): HomeContent {
  if (!saved || typeof saved !== 'object') return initial;
  const source = saved as Partial<HomeContent>;

  return {
    slides:
      Array.isArray(source.slides)
        ? source.slides
        : initial.slides,

    about: {
      ...initial.about,
      ...(source.about || {}),
    },

    collage: {
      ...initial.collage,
      ...(source.collage || {}),
      images:
        Array.isArray(source.collage?.images)
          ? normalizeCollageImages(source.collage.images)
          : initial.collage.images,
    },

    couples: {
      ...initial.couples,
      ...(source.couples || {}),
      items: normalizeCoupleStories(source.couples?.items, initial.couples.items),
    },

    videos: {
      ...initial.videos,
      ...(source.videos || {}),
      items:
        Array.isArray(source.videos?.items)
          ? source.videos.items
          : initial.videos.items,
    },

    soulCinema: {
      ...initial.soulCinema,
      ...(source.soulCinema || {}),
    },

    testimonials: {
      ...initial.testimonials,
      ...(source.testimonials || {}),
      items:
        Array.isArray(source.testimonials?.items)
          ? source.testimonials.items
          : initial.testimonials.items,
    },
  };
}

/* =========================================================
   REUSABLE MEDIA UPLOADERS
========================================================= */

function ImageUploader({
  label,
  value,
  onChange,
  alt = 'Image preview',
  aspect = 'landscape',
  placeholder = 'Image URL or path',
}: {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  alt?: string;
  aspect?: 'portrait' | 'square' | 'landscape';
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const upload = async (file?: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    try {
      setUploading(true);
      setError('');
      setProgress(5);

      const result = await uploadToCloudinary(
        file,
        'san-photography/home',
        (pct) => setProgress(pct)
      );

      if (!result?.url) throw new Error('No URL returned from server.');
      setPreviewError(false);
      onChange(result.url);
      setProgress(100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const previewClass =
    aspect === 'portrait'
      ? 'aspect-[4/5]'
      : aspect === 'square'
        ? 'aspect-square'
        : 'aspect-[16/9]';

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#927344]">
          {label}
        </label>
      )}

      <div
        className={`relative overflow-hidden rounded-xl border border-neutral-200 bg-[#ECE6DA] ${previewClass}`}
      >
        {value && !previewError ? (
          <img
            src={value}
            alt={alt}
            className="h-full w-full object-cover object-center"
            onError={() => setPreviewError(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-3 text-center text-neutral-400">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-1 text-neutral-400"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span className="text-[10px]">
              {previewError ? 'Unable to load image' : 'No image selected'}
            </span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/65 px-4 backdrop-blur-xs">
            <div className="w-full text-center text-white">
              <p className="text-[9px] font-semibold uppercase tracking-widest">
                Uploading...
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-white/70">{progress}%</p>
            </div>
          </div>
        )}

        {value && !uploading && (
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-black px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow transition hover:bg-neutral-800"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewError(false);
                onChange('');
              }}
              className="rounded-lg bg-red-600 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow transition hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        )}

        {!value && !uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-black px-3.5 py-2 text-[9px] font-semibold uppercase tracking-wider text-white shadow transition hover:bg-neutral-800"
          >
            Upload Image
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = '';
          }}
        />
      </div>

      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          setPreviewError(false);
          onChange(e.target.value);
        }}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black"
      />

      {error && (
        <p className="text-[11px] font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

function VideoUploader({
  label,
  value,
  onChange,
  placeholder = 'https://.../video.mp4',
}: {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const upload = async (file?: File) => {
    if (!file || !file.type.startsWith('video/')) {
      setError('Please select a valid MP4/MOV video file.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccessMessage('');
      setProgress(0);

      // IMPORTANT:
      // No frontend video-size limit is applied here.
      // The centralized server service handles large videos
      // using chunked uploads and retries failed chunks.
      const result = await uploadToCloudinary(
        file,
        'san-photography/home',
        (pct) => setProgress(pct)
      );

      if (!result?.url) {
        throw new Error('No video URL returned by Cloudinary.');
      }

      onChange(result.url);
      setProgress(100);
      setSuccessMessage('Video uploaded successfully.');
    } catch (err: unknown) {
      console.error('Home video upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload video.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#927344]">
          {label}
        </label>
      )}

      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        {value ? (
          <>
            <video
              src={value}
              controls
              className="h-full w-full object-cover"
            />
            <div className="absolute left-2.5 top-2.5 max-w-[70%] truncate rounded bg-black/75 px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-white">
              Current Video: {value.split('/').pop() || 'Active video'}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-3 text-center text-neutral-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-1 text-neutral-500"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span className="text-[10px]">No video source selected</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 px-4 backdrop-blur-xs">
            <div className="w-full text-center text-white">
              <p className="text-[9px] font-semibold uppercase tracking-widest">
                Uploading Video...
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-white/70">{progress}%</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-black shadow transition hover:bg-neutral-200"
          >
            {value ? 'Replace Video' : 'Upload Video'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-lg bg-red-600 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow transition hover:bg-red-700"
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = '';
          }}
        />
      </div>

      {successMessage && (
        <p className="text-[11px] font-medium text-green-600">{successMessage}</p>
      )}

      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black"
      />

      {error && (
        <p className="text-[11px] font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

/* =========================================================
   UI FORM HELPERS
========================================================= */

function Field({
  label,
  value,
  onChange,
  textarea = false,
  type = 'text',
  placeholder = '',
  rows = 3,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  type?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#927344]">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-y rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3 text-xs leading-5 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black sm:text-sm"
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3 text-xs leading-5 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black sm:text-sm"
        />
      )}
    </div>
  );
}

function SectionCard({
  number,
  title,
  description,
  children,
  collapsible = false,
  collapsed = false,
  onToggle,
}: {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-black/[0.07] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.025)] sm:mb-6 sm:rounded-2xl lg:mb-8">
      <button
        type={collapsible ? 'button' : undefined}
        onClick={collapsible ? onToggle : undefined}
        className={`w-full border-b border-black/[0.07] bg-[#fbfaf7] px-4 py-4 text-left sm:px-6 sm:py-5 lg:px-8 lg:py-6 ${collapsible ? 'cursor-pointer transition hover:bg-[#f7f4ee]' : ''}`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-[9px] font-medium text-white sm:h-9 sm:w-9 sm:text-[10px]">
            {String(number).padStart(2, '0')}
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.35em] text-[#a18764]">
                  SECTION {String(number).padStart(2, '0')}
                </p>
                <h2 className="mt-1 text-xl font-light tracking-[-0.03em] text-neutral-900 sm:text-2xl lg:text-3xl">
                  {title}
                </h2>
              </div>
              {collapsible && (
                <span className="shrink-0 text-neutral-500" aria-hidden="true">
                  {collapsed ? <ChevronRight size={22} strokeWidth={1.5} /> : <ChevronDown size={22} strokeWidth={1.5} />}
                </span>
              )}
            </div>
            {description && !collapsed && (
              <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                {description}
              </p>
            )}
          </div>
        </div>
      </button>
      {!collapsed && <div className="p-4 sm:p-6 lg:p-8">{children}</div>}
    </section>
  );
}

const ArrayControls = ({
  onMoveUp,
  onMoveDown,
  onRemove,
  disableUp,
  disableDown,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove?: () => void;
  disableUp: boolean;
  disableDown: boolean;
}) => (
  <div className="mt-3 flex flex-wrap items-center gap-1.5">
    <button
      type="button"
      onClick={onMoveUp}
      disabled={disableUp}
      className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
    >
      ↑ Up
    </button>
    <button
      type="button"
      onClick={onMoveDown}
      disabled={disableDown}
      className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
    >
      ↓ Down
    </button>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-red-600 transition hover:bg-red-100"
      >
        ✕ Delete
      </button>
    )}
  </div>
);


/* =========================================================
   GLOBAL ADMIN TOAST
========================================================= */

function AdminToast({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-auto sm:max-w-md sm:justify-end sm:px-0">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:w-auto sm:min-w-[320px] ${
          isError
            ? 'border-red-200 bg-red-50/95 text-red-700'
            : 'border-emerald-200 bg-emerald-50/95 text-emerald-700'
        }`}
      >
        <div className="mt-0.5 shrink-0 text-sm">{isError ? '!' : '✓'}</div>
        <p className="min-w-0 flex-1 text-[11px] font-medium leading-5 sm:text-xs">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="shrink-0 rounded-lg px-1.5 py-0.5 text-sm opacity-60 transition hover:bg-black/5 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   HOME PAGE MANAGEMENT MAIN COMPONENT
========================================================= */

const HomePageManagement = () => {
  const initialData = useMemo(() => buildInitialHomeContent(), []);
  const [content, setContent] = useState<HomeContent>(initialData);
  const [originalContent, setOriginalContent] = useState<HomeContent>(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [collageCollapsed, setCollageCollapsed] = useState(true);
  // Drag and Drop tracking states for each repeatable section
  const [draggedSlideIdx, setDraggedSlideIdx] = useState<number | null>(null);
  const [dragOverSlideIdx, setDragOverSlideIdx] = useState<number | null>(null);

  const [draggedCoupleIdx, setDraggedCoupleIdx] = useState<number | null>(null);
  const [dragOverCoupleIdx, setDragOverCoupleIdx] = useState<number | null>(null);

  const [draggedVideoIdx, setDraggedVideoIdx] = useState<number | null>(null);
  const [dragOverVideoIdx, setDragOverVideoIdx] = useState<number | null>(null);

  const [draggedTestimonialIdx, setDraggedTestimonialIdx] = useState<number | null>(null);
  const [dragOverTestimonialIdx, setDragOverTestimonialIdx] = useState<number | null>(null);

  const hasChanges = useMemo(
    () => JSON.stringify(content) !== JSON.stringify(originalContent),
    [content, originalContent]
  );

  const fetchHomeContent = useCallback(async () => {
    try {
      setLoading(true);
      setErrMsg('');
      setSaveMsg('');
      const response = await fetch(buildApiUrl(API_BASE_URL, 'api/content.php'));
      if (!response.ok) throw new Error('Failed to load content from database');
      const data = await readApiJson(response, 'Home content');
      if (data?.success && data?.content) {
        const merged = mergeWithSaved(initialData, data.content.home || data.content);
        setContent(merged);
        setOriginalContent(deepClone(merged));
      } else {
        setContent(initialData);
        setOriginalContent(deepClone(initialData));
      }
    } catch (error: unknown) {
      console.error('Error loading home content:', error);
      setErrMsg(getErrorMessage(error, 'Failed to fetch content from database.'));
      setContent(initialData);
      setOriginalContent(deepClone(initialData));
    } finally {
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    fetchHomeContent();
  }, [fetchHomeContent]);

  /* Generic Section Field Updater */
  const updateField = (section: HomeSectionField, field: string, value: unknown) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setSaveMsg('');
  };

  /* =========================================================
     01 — SLIDERS MANAGEMENT (DRAG & DROP + ACTIONS)
  ========================================================= */

  const addSlider = () => {
    setContent((prev) => ({
      ...prev,
      slides: [
        ...(prev.slides || []),
        {
          id: `slide-${Date.now()}`,
          title: `Slide ${String((prev.slides?.length || 0) + 1).padStart(2, '0')}`,
          image: '',
        },
      ],
    }));
    setSaveMsg('');
  };

  const updateSlider = (index: number, field: 'title' | 'image', value: string) => {
    setContent((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, i) =>
        i === index ? { ...slide, [field]: value } : slide
      ),
    }));
    setSaveMsg('');
  };

  const removeSlider = (index: number) => {
    setContent((prev) => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index),
    }));
    setSaveMsg('');
  };

  const moveSlider = (index: number, direction: number) => {
    setContent((prev) => {
      const slides = [...(prev.slides || [])];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= slides.length) return prev;
      [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
      return { ...prev, slides };
    });
    setSaveMsg('');
  };

  const handleSliderDrop = (targetIndex: number) => {
    if (
      draggedSlideIdx === null ||
      draggedSlideIdx === targetIndex ||
      targetIndex === null
    ) {
      setDraggedSlideIdx(null);
      setDragOverSlideIdx(null);
      return;
    }
    setContent((prev) => {
      const slides = [...(prev.slides || [])];
      const [moved] = slides.splice(draggedSlideIdx, 1);
      slides.splice(targetIndex, 0, moved);
      return { ...prev, slides };
    });
    setDraggedSlideIdx(null);
    setDragOverSlideIdx(null);
    setSaveMsg('');
  };

  /* =========================================================
     03 — COLLAGE MANAGEMENT (ACTIONS: ADD, REPLACE, DELETE)
  ========================================================= */

  const updateCollageImage = (index: number, value: string) => {
    setContent((prev) => {
      const newImages = [...(prev.collage?.images || [])];
      const currentImage = newImages[index];
      newImages[index] = {
        ...(typeof currentImage === 'object' ? currentImage : {}),
        url: value,
        visible: currentImage?.visible !== false,
      };
      return {
        ...prev,
        collage: {
          ...prev.collage,
          images: newImages,
        },
      };
    });
    setSaveMsg('');
  };

  const addCollageImage = () => {
    setContent((prev) => ({
      ...prev,
      collage: {
        ...prev.collage,
        images: [...(prev.collage?.images || []), { url: '', visible: true }],
      },
    }));
    setSaveMsg('');
  };

  const toggleCollageImageVisibility = (index: number) => {
    setContent((prev) => ({
      ...prev,
      collage: {
        ...prev.collage,
        images: prev.collage.images.map((image, imageIndex) =>
          imageIndex === index
            ? {
                ...(typeof image === 'object' ? image : { url: image }),
                visible: image?.visible === false,
              }
            : image
        ),
      },
    }));
    setSaveMsg('');
  };

  const removeCollageImage = (index: number) => {
    setContent((prev) => ({
      ...prev,
      collage: {
        ...prev.collage,
        images: prev.collage.images.filter((_, i) => i !== index),
      },
    }));
    setSaveMsg('');
  };

  /* =========================================================
     04 — COUPLES MANAGEMENT (DRAG & DROP + ACTIONS)
  ========================================================= */

  const updateCoupleItem = (index: number, field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      couples: {
        ...prev.couples,
        items: prev.couples.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
    setSaveMsg('');
  };

  const addCouple = () => {
    if ((content.couples?.items?.length || 0) >= MAX_COUPLES) return;

    setContent((prev) => {
      const items = prev.couples?.items || [];
      if (items.length >= MAX_COUPLES) return prev;

      return {
        ...prev,
        couples: {
          ...prev.couples,
          items: [
            ...items,
            {
              id: `couple-${Date.now()}`,
              name: '',
              img: '',
            },
          ],
        },
      };
    });
    setSaveMsg('');
  };

  const removeCouple = (index: number) => {
    const item = content.couples?.items?.[index];
    if (!item) return;

    const confirmed = window.confirm(
      `Remove the couple "${item.name || 'this couple'}"? This removes only the couple card from Home content.`
    );
    if (!confirmed) return;

    setContent((prev) => ({
      ...prev,
      couples: {
        ...prev.couples,
        items: prev.couples.items.filter((_, i) => i !== index),
      },
    }));
    setSaveMsg('');
  };

  const moveCouple = (index: number, direction: number) => {
    setContent((prev) => {
      const items = [...(prev.couples?.items || [])];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= Math.min(items.length, MAX_COUPLES)) return prev;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return {
        ...prev,
        couples: {
          ...prev.couples,
          items,
        },
      };
    });
    setSaveMsg('');
  };

  const handleCoupleDrop = (targetIndex: number) => {
    if (
      draggedCoupleIdx === null ||
      draggedCoupleIdx === targetIndex ||
      targetIndex === null
    ) {
      setDraggedCoupleIdx(null);
      setDragOverCoupleIdx(null);
      return;
    }
    setContent((prev) => {
      const items = [...(prev.couples?.items || [])];
      const [moved] = items.splice(draggedCoupleIdx, 1);
      items.splice(targetIndex, 0, moved);
      return {
        ...prev,
        couples: {
          ...prev.couples,
          items,
        },
      };
    });
    setDraggedCoupleIdx(null);
    setDragOverCoupleIdx(null);
    setSaveMsg('');
  };

  /* =========================================================
     05 — VIDEOS MANAGEMENT (DRAG & DROP + ACTIONS)
  ========================================================= */

  const updateVideoItem = (index: number, field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        items: prev.videos.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
    setSaveMsg('');
  };

  const addVideo = () => {
    setContent((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        items: [
          ...(prev.videos?.items || []),
          {
            id: `video-${Date.now()}`,
            title: `Film ${(prev.videos?.items?.length || 0) + 1}`,
            url: '',
          },
        ],
      },
    }));
    setSaveMsg('');
  };

  const removeVideo = (index: number) => {
    setContent((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        items: prev.videos.items.filter((_, i) => i !== index),
      },
    }));
    setSaveMsg('');
  };

  const moveVideo = (index: number, direction: number) => {
    setContent((prev) => {
      const items = [...(prev.videos?.items || [])];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return prev;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return {
        ...prev,
        videos: {
          ...prev.videos,
          items,
        },
      };
    });
    setSaveMsg('');
  };

  const handleVideoDrop = (targetIndex: number) => {
    if (
      draggedVideoIdx === null ||
      draggedVideoIdx === targetIndex ||
      targetIndex === null
    ) {
      setDraggedVideoIdx(null);
      setDragOverVideoIdx(null);
      return;
    }
    setContent((prev) => {
      const items = [...(prev.videos?.items || [])];
      const [moved] = items.splice(draggedVideoIdx, 1);
      items.splice(targetIndex, 0, moved);
      return {
        ...prev,
        videos: {
          ...prev.videos,
          items,
        },
      };
    });
    setDraggedVideoIdx(null);
    setDragOverVideoIdx(null);
    setSaveMsg('');
  };

  /* =========================================================
     07 — TESTIMONIALS MANAGEMENT (DRAG & DROP + ACTIONS)
  ========================================================= */

  const updateTestimonialItem = (index: number, field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: prev.testimonials.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
    setSaveMsg('');
  };

  const addTestimonial = () => {
    setContent((prev) => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: [
          ...(prev.testimonials?.items || []),
          {
            id: `test-${Date.now()}`,
            quote: 'Write new testimonial quote here...',
            author: 'CLIENT NAME',
          },
        ],
      },
    }));
    setSaveMsg('');
  };

  const removeTestimonial = (index: number) => {
    setContent((prev) => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: prev.testimonials.items.filter((_, i) => i !== index),
      },
    }));
    setSaveMsg('');
  };

  const moveTestimonial = (index: number, direction: number) => {
    setContent((prev) => {
      const items = [...(prev.testimonials?.items || [])];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return prev;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return {
        ...prev,
        testimonials: {
          ...prev.testimonials,
          items,
        },
      };
    });
    setSaveMsg('');
  };

  const handleTestimonialDrop = (targetIndex: number) => {
    if (
      draggedTestimonialIdx === null ||
      draggedTestimonialIdx === targetIndex ||
      targetIndex === null
    ) {
      setDraggedTestimonialIdx(null);
      setDragOverTestimonialIdx(null);
      return;
    }
    setContent((prev) => {
      const items = [...(prev.testimonials?.items || [])];
      const [moved] = items.splice(draggedTestimonialIdx, 1);
      items.splice(targetIndex, 0, moved);
      return {
        ...prev,
        testimonials: {
          ...prev.testimonials,
          items,
        },
      };
    });
    setDraggedTestimonialIdx(null);
    setDragOverTestimonialIdx(null);
    setSaveMsg('');
  };

    /* =========================================================
      SAVE TO MYSQL THROUGH PHP
    ========================================================= */

  const saveContent = async () => {
    try {
      setSaving(true);
      setSaveMsg('');
      setErrMsg('');

      const homeToSave = {
        ...content,
        couples: {
          ...content.couples,
          items: normalizeCoupleStories(content.couples.items, []),
        },
      };

      const response = await fetch(buildApiUrl(API_BASE_URL, 'api/content.php'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify({
          home: homeToSave,
        }),
      });

      const data = await readApiJson(response, 'Home content');
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save Home page content.');
      }

      const savedHome =
        data?.content?.home ??
        data?.content?.homePage ??
        homeToSave;

      const saved = mergeWithSaved(initialData, savedHome);
      setContent(saved);
      setOriginalContent(deepClone(saved));
      setSaveMsg('Home page content saved successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: unknown) {
      console.error('Save error:', error);
      setErrMsg(getErrorMessage(error, 'Failed to save home page content.'));
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     RESET TO DEFAULT
  ========================================================= */

  const resetContent = () => {
    const confirmed = window.confirm(
      'Reset all Home page content to default values from current Home.jsx?'
    );
    if (!confirmed) return;
    setContent(deepClone(initialData));
    setSaveMsg('Default Home values loaded. Click Save Changes to persist.');
    setErrMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#f6f2ea] p-5 sm:p-8">
        <div className="mx-auto max-w-[1200px] animate-pulse space-y-4">
          <div className="h-3 w-24 rounded bg-neutral-200" />
          <div className="h-10 w-72 rounded bg-neutral-200" />
          <div className="mt-10 h-80 rounded-2xl bg-neutral-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f2ea] pb-24 sm:pb-28">
      <AdminToast
        message={errMsg || saveMsg}
        type={errMsg ? 'error' : 'success'}
        onClose={() => {
          setErrMsg('');
          setSaveMsg('');
        }}
      />
      {/* PAGE HEADER */}
      <div className="border-b border-neutral-200 bg-[#fbfaf7]">
        <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#a18764]">
                SAN PHOTOGRAPHY · HOME
              </p>
              <h1 className="mt-2 text-3xl font-light tracking-[-0.05em] text-neutral-900 sm:text-4xl lg:text-5xl xl:text-6xl">
                Home Page Management
              </h1>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                Manage, edit, replace, and reorder every section of your live Home page in the exact serial order it appears.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:gap-3">
              {hasChanges && (
                <button
                  type="button"
                  onClick={resetContent}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-neutral-300 bg-white px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 sm:flex-none"
                >
                  Reset to Default
                </button>
              )}
              <button
                type="button"
                onClick={saveContent}
                disabled={saving || !hasChanges}
                className={`flex-1 rounded-xl px-6 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition sm:flex-none ${saving || !hasChanges
                    ? 'cursor-not-allowed bg-neutral-400'
                    : 'bg-black hover:bg-neutral-800'
                  }`}
              >
                {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
        {saveMsg && (
          <div className="mb-5 hidden rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700 sm:mb-6 sm:px-5">
            ✓ {saveMsg}
          </div>
        )}
        {errMsg && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-xs text-red-700 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>{errMsg}</span>
            <button
              type="button"
              onClick={fetchHomeContent}
              className="self-start rounded-lg bg-white px-3 py-2 text-[9px] font-semibold uppercase text-red-600 sm:self-auto"
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================================================
            SECTION 01: HERO / SLIDER
        ========================================================= */}
        <SectionCard
          number={1}
          title="Hero / Slider"
          description="Hero crossfade slideshow section (#home). Supports image preview, upload, replace, move up/down, and smooth drag-and-drop reordering."
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Hero Slides ({content.slides?.length || 0})
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                Use the drag handle on desktop to reorder. On mobile/tablet, use Up/Down controls. Replace uploads a new slide image.
              </p>
            </div>
            <button
              type="button"
              onClick={addSlider}
              className="rounded-xl bg-black px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
            >
              + Add New Slider
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {content.slides?.map((slide, index) => {
              const isDragging = draggedSlideIdx === index;
              const isOver = dragOverSlideIdx === index;

              return (
                <div
                  key={slide.id || index}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(index));
                    setDraggedSlideIdx(index);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverSlideIdx !== index) {
                      setDragOverSlideIdx(index);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverSlideIdx === index) {
                      setDragOverSlideIdx(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleSliderDrop(index);
                  }}
                  onDragEnd={() => {
                    setDraggedSlideIdx(null);
                    setDragOverSlideIdx(null);
                  }}
                  className={`flex cursor-grab flex-col justify-between rounded-2xl border bg-[#fbfaf7] p-4 shadow-xs transition-all duration-200 active:cursor-grabbing ${isDragging
                      ? 'opacity-40 ring-2 ring-black'
                      : isOver
                        ? 'border-black bg-[#f0ede6] ring-2 ring-black'
                        : 'border-neutral-200'
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                      <span className="rounded bg-black px-2 py-0.5 text-[9px] font-mono text-white">
                        SLIDE #{String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        ⋮⋮ Drag to reorder
                      </span>
                    </div>

                    <ImageUploader
                      label="Slide Image"
                      value={slide.image || ''}
                      onChange={(url) => updateSlider(index, 'image', url)}
                      alt={slide.title || `Slide ${index + 1}`}
                      aspect="landscape"
                      placeholder="Slide Image URL / Server link"
                    />

                    <Field
                      label="Slide Label / Title"
                      value={slide.title}
                      onChange={(v) => updateSlider(index, 'title', v)}
                      placeholder="Slide 01"
                    />
                  </div>

                  <ArrayControls
                    onMoveUp={() => moveSlider(index, -1)}
                    onMoveDown={() => moveSlider(index, 1)}
                    onRemove={() => removeSlider(index)}
                    disableUp={index === 0}
                    disableDown={index === (content.slides?.length || 1) - 1}
                  />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addSlider}
            className="mt-6 w-full rounded-2xl border border-dashed border-neutral-300 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 transition hover:border-black hover:bg-neutral-50"
          >
            + Add New Slider
          </button>
        </SectionCard>

        {/* =========================================================
            SECTION 02: ABOUT / OUR STORY
        ========================================================= */}
        <SectionCard
          number={2}
          title="About / Our Story"
          description="The story and studio introduction section directly below the Hero (#about)."
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
            <Field
              label="Eyebrow"
              value={content.about.eyebrow}
              onChange={(v) => updateField('about', 'eyebrow', v)}
              placeholder="Ni3 Cinema & SAN"
            />
            <Field
              label="Heading"
              value={content.about.heading}
              onChange={(v) => updateField('about', 'heading', v)}
              placeholder="Capturing Your Precious Moments"
            />
            <Field
              label="Italic Heading"
              value={content.about.italicHeading}
              onChange={(v) => updateField('about', 'italicHeading', v)}
              placeholder="With Love & Creativity"
            />
          </div>

          <div className="mt-5 space-y-5">
            <Field
              label="Intro Statement"
              value={content.about.intro}
              onChange={(v) => updateField('about', 'intro', v)}
              textarea
              rows={2}
              placeholder="Welcome to Ni3 Cinema & SAN..."
            />
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
              <Field
                label="Paragraph 1"
                value={content.about.paragraph1}
                onChange={(v) => updateField('about', 'paragraph1', v)}
                textarea
                rows={4}
              />
              <Field
                label="Paragraph 2"
                value={content.about.paragraph2}
                onChange={(v) => updateField('about', 'paragraph2', v)}
                textarea
                rows={4}
              />
              <Field
                label="Paragraph 3"
                value={content.about.paragraph3}
                onChange={(v) => updateField('about', 'paragraph3', v)}
                textarea
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              <Field
                label="Ending Bold Text"
                value={content.about.ending}
                onChange={(v) => updateField('about', 'ending', v)}
                placeholder="Your Moments. Our Passion. Memories Forever."
              />
              <Field
                label="Button Text"
                value={content.about.buttonText}
                onChange={(v) => updateField('about', 'buttonText', v)}
                placeholder="Explore Our Work"
              />
            </div>
          </div>
        </SectionCard>

        {/* =========================================================
            SECTION 03: COLLAGE
        ========================================================= */}
        <SectionCard
          number={3}
          title="Collage"
          description="Seamless photographic collage grid section (#collage). Manage your collage images with add, replace, and delete controls."
          collapsible
          collapsed={collageCollapsed}
          onToggle={() => setCollageCollapsed((value) => !value)}
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            <Field
              label="Collage Heading"
              value={content.collage.heading}
              onChange={(v) => updateField('collage', 'heading', v)}
              textarea
              rows={3}
              placeholder="What if it could never be recorded?..."
            />
            <Field
              label="Collage Eyebrow"
              value={content.collage.eyebrow}
              onChange={(v) => updateField('collage', 'eyebrow', v)}
              placeholder="WE ARE CREATING FICTION OUT OF REALITY"
            />
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Collage Images ({content.collage?.images?.length || 0})
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Manage high-resolution collage images for the photography collage strip.
                </p>
              </div>
              <button
                type="button"
                onClick={addCollageImage}
                className="rounded-xl bg-black px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
              >
                + Add New Image
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {content.collage?.images?.map((image, index) => (
                <div
                  key={index}
                  className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-[#fbfaf7] p-3 shadow-xs transition-all duration-200"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded bg-black px-2 py-0.5 text-[9px] font-mono text-white">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleCollageImageVisibility(index)}
                          aria-label={image?.visible === false ? 'Show collage image' : 'Hide collage image'}
                          title={image?.visible === false ? 'Show image' : 'Hide image'}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100"
                        >
                          {image?.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCollageImage(index)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-red-600 transition hover:bg-red-100"
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>

                    <ImageUploader
                      value={image?.url || (typeof image === 'string' ? image : '')}
                      onChange={(url) => updateCollageImage(index, url)}
                      alt={`Collage image ${index + 1}`}
                      aspect="square"
                      placeholder="Image URL or Path"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addCollageImage}
              className="mt-6 w-full rounded-2xl border border-dashed border-neutral-300 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 transition hover:border-black hover:bg-neutral-50"
            >
              + Add New Collage Image
            </button>
          </div>
        </SectionCard>

        {/* =========================================================
            SECTION 04: COUPLES GRID
        ========================================================= */}
        <SectionCard
          number={4}
          title="Couples Grid"
          description="The real love stories portraits section (#couples). Manage couple cards, names, portraits with replace image and drag-and-drop reordering."
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            <Field
              label="Section Heading"
              value={content.couples.heading}
              onChange={(v) => updateField('couples', 'heading', v)}
              placeholder="Real love"
            />
            <Field
              label="Italic Heading Word"
              value={content.couples.italicHeading}
              onChange={(v) => updateField('couples', 'italicHeading', v)}
              placeholder="stories."
            />
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Couple Items ({Math.min(content.couples?.items?.length || 0, MAX_COUPLES)})
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Manage Home couple names, portrait images, and display order.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {(content.couples?.items?.length || 0) < MAX_COUPLES && (
                  <button
                    type="button"
                    onClick={addCouple}
                    className="rounded-lg bg-black px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                  >
                    + Add Couple
                  </button>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  {Math.min(content.couples?.items?.length || 0, MAX_COUPLES)} independent stories
                </span>
              </div>
            </div>

            {(content.couples?.items?.length || 0) > MAX_COUPLES && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                {content.couples.items.length - MAX_COUPLES} stale couple record(s) exist beyond the six-card UI limit and are preserved but not shown.
              </p>
            )}

            {/* Gallery-style layout: one couple per row */}
            <div className="space-y-3">
              {(content.couples?.items || []).slice(0, MAX_COUPLES).map((item, index) => {
                const isDragging = draggedCoupleIdx === index;
                const isOver = dragOverCoupleIdx === index;
                return (
                  <div
                    key={item.id || index}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(index));
                      setDraggedCoupleIdx(index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverCoupleIdx !== index) {
                        setDragOverCoupleIdx(index);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverCoupleIdx === index) {
                        setDragOverCoupleIdx(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleCoupleDrop(index);
                    }}
                    onDragEnd={() => {
                      setDraggedCoupleIdx(null);
                      setDragOverCoupleIdx(null);
                    }}
                    className={`overflow-hidden rounded-xl border bg-white transition-all duration-200 ${
                      isDragging
                        ? 'opacity-40 ring-2 ring-black'
                        : isOver
                          ? 'border-black ring-2 ring-black'
                          : 'border-neutral-200'
                    }`}
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {/* Order + portrait */}
                        <div className="flex shrink-0 items-end gap-3">
                          <div className="flex w-9 flex-col items-center gap-2 self-stretch">
                            <span className="rounded bg-black px-2 py-0.5 text-[9px] font-mono text-white">
                              #{String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="hidden text-[9px] text-neutral-400 xl:block">
                              ⋮⋮ Drag
                            </span>
                          </div>

                          <div className="w-20 shrink-0 sm:w-24">
                            <ImageUploader
                              value={item.img || ''}
                              onChange={(url) => updateCoupleItem(index, 'img', url)}
                              alt={item.name || `Couple ${index + 1}`}
                              aspect="portrait"
                              placeholder="Portrait image"
                            />
                          </div>
                        </div>

                        {/* Couple name */}
                        <div className="min-w-0 flex-1">
                          <Field
                            label="Couple Name"
                            value={item.name}
                            onChange={(v) => updateCoupleItem(index, 'name', v)}
                            placeholder="Kapil & Payal"
                          />
                        </div>

                        {/* Order controls */}
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5 lg:w-auto">
                          <button
                            type="button"
                            onClick={() => moveCouple(index, -1)}
                            disabled={index === 0}
                            className="flex h-9 items-center justify-center rounded-lg border border-neutral-200 bg-white px-2.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30"
                          >
                            <ArrowUp size={11} className="mr-1" />
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCouple(index, 1)}
                            disabled={index === Math.min(content.couples?.items?.length || 1, MAX_COUPLES) - 1}
                            className="flex h-9 items-center justify-center rounded-lg border border-neutral-200 bg-white px-2.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30"
                          >
                            <ArrowDown size={11} className="mr-1" />
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCouple(index)}
                            className="flex h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-[9px] font-semibold uppercase tracking-wider text-red-600 transition hover:bg-red-100"
                          >
                            Delete Couple
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </SectionCard>

        {/* =========================================================
            SECTION 05: VIDEOS
        ========================================================= */}
        <SectionCard
          number={5}
          title="Videos"
          description="The video showcase section (#videos). Supports video upload/replace, video player preview, title editing, and drag-and-drop reordering."
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
            <Field
              label="Eyebrow"
              value={content.videos.eyebrow}
              onChange={(v) => updateField('videos', 'eyebrow', v)}
              placeholder="WATCH OUR FILMS"
            />
            <Field
              label="Heading"
              value={content.videos.heading}
              onChange={(v) => updateField('videos', 'heading', v)}
              placeholder="Moving memories that tell"
            />
            <Field
              label="Italic Heading"
              value={content.videos.italicHeading}
              onChange={(v) => updateField('videos', 'italicHeading', v)}
              placeholder="your story."
            />
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Video Items ({content.videos?.items?.length || 0})
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Add, replace video files/URLs, or reorder films.
                </p>
              </div>
              <button
                type="button"
                onClick={addVideo}
                className="rounded-xl bg-black px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
              >
                + Add Video
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              {content.videos?.items?.map((item, index) => {
                const isDragging = draggedVideoIdx === index;
                const isOver = dragOverVideoIdx === index;

                return (
                  <div
                    key={item.id || index}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(index));
                      setDraggedVideoIdx(index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverVideoIdx !== index) {
                        setDragOverVideoIdx(index);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverVideoIdx === index) {
                        setDragOverVideoIdx(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleVideoDrop(index);
                    }}
                    onDragEnd={() => {
                      setDraggedVideoIdx(null);
                      setDragOverVideoIdx(null);
                    }}
                    className={`flex cursor-grab flex-col justify-between rounded-2xl border bg-[#fbfaf7] p-4 shadow-xs transition-all duration-200 active:cursor-grabbing ${isDragging
                        ? 'opacity-40 ring-2 ring-black'
                        : isOver
                          ? 'border-black bg-[#f0ede6] ring-2 ring-black'
                          : 'border-neutral-200'
                      }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                        <span className="rounded bg-black px-2 py-0.5 text-[9px] font-mono text-white">
                          VIDEO #{String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          ⋮⋮ Drag
                        </span>
                      </div>

                      <VideoUploader
                        label="Video File / URL"
                        value={item.url || ''}
                        onChange={(url) => updateVideoItem(index, 'url', url)}
                        placeholder="https://.../video.mp4 or upload"
                      />

                      <Field
                        label="Video Title / Label"
                        value={item.title}
                        onChange={(v) => updateVideoItem(index, 'title', v)}
                        placeholder="Film 1"
                      />
                    </div>

                    <ArrayControls
                      onMoveUp={() => moveVideo(index, -1)}
                      onMoveDown={() => moveVideo(index, 1)}
                      onRemove={() => removeVideo(index)}
                      disableUp={index === 0}
                      disableDown={index === (content.videos?.items?.length || 1) - 1}
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addVideo}
              className="mt-6 w-full rounded-2xl border border-dashed border-neutral-300 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 transition hover:border-black hover:bg-neutral-50"
            >
              + Add New Video Item
            </button>
          </div>
        </SectionCard>

        {/* =========================================================
            SECTION 06: SOUL CINEMA
        ========================================================= */}
        <SectionCard
          number={6}
          title="Soul Cinema"
          description="Cinematic film feature section (#soul-cinema) with full video player preview and replace functionality."
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
            <Field
              label="Eyebrow"
              value={content.soulCinema.eyebrow}
              onChange={(v) => updateField('soulCinema', 'eyebrow', v)}
              placeholder="AWARD WINNING FILMS"
            />
            <Field
              label="Brand Eyebrow"
              value={content.soulCinema.brandEyebrow}
              onChange={(v) => updateField('soulCinema', 'brandEyebrow', v)}
              placeholder="NI3 CINEMA & SAN"
            />
            <Field
              label="Heading"
              value={content.soulCinema.heading}
              onChange={(v) => updateField('soulCinema', 'heading', v)}
              placeholder="SOUL + CINEMA"
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <Field
              label="Description Text"
              value={content.soulCinema.description}
              onChange={(v) => updateField('soulCinema', 'description', v)}
              textarea
              rows={4}
              placeholder="Every frame tells a story..."
            />
            <div>
              <VideoUploader
                label="Soul Cinema Video Source"
                value={content.soulCinema.videoUrl || ''}
                onChange={(url) => updateField('soulCinema', 'videoUrl', url)}
                placeholder="Video URL or path"
              />
            </div>
          </div>
        </SectionCard>

        {/* =========================================================
            SECTION 07: TESTIMONIALS
        ========================================================= */}
        <SectionCard
          number={7}
          title="Testimonials"
          description="Client reviews and kind words section (#testimonials). Drag cards to reorder."
        >
          <Field
            label="Section Eyebrow"
            value={content.testimonials.eyebrow}
            onChange={(v) => updateField('testimonials', 'eyebrow', v)}
            placeholder="KIND WORDS"
          />

          <div className="mt-8 space-y-5">
            {content.testimonials?.items?.map((item, index) => {
              const isDragging = draggedTestimonialIdx === index;
              const isOver = dragOverTestimonialIdx === index;

              return (
                <div
                  key={item.id || index}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(index));
                    setDraggedTestimonialIdx(index);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverTestimonialIdx !== index) {
                      setDragOverTestimonialIdx(index);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverTestimonialIdx === index) {
                      setDragOverTestimonialIdx(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleTestimonialDrop(index);
                  }}
                  onDragEnd={() => {
                    setDraggedTestimonialIdx(null);
                    setDragOverTestimonialIdx(null);
                  }}
                  className={`cursor-grab rounded-2xl border bg-[#fbfaf7] p-5 shadow-xs transition-all duration-200 active:cursor-grabbing sm:p-6 ${isDragging
                      ? 'opacity-40 ring-2 ring-black'
                      : isOver
                        ? 'border-black bg-[#f0ede6] ring-2 ring-black'
                        : 'border-neutral-200'
                    }`}
                >
                  <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                      Testimonial #{String(index + 1).padStart(2, '0')}
                    </p>
                    <span className="text-[9px] text-neutral-400">
                      ⋮⋮ Drag to reorder
                    </span>
                  </div>

                  <Field
                    label="Quote"
                    value={item.quote}
                    onChange={(v) => updateTestimonialItem(index, 'quote', v)}
                    textarea
                    rows={2}
                    placeholder="Every photograph brought our memories back to life..."
                  />

                  <div className="mt-4">
                    <Field
                      label="Author / Client Attribution"
                      value={item.author}
                      onChange={(v) => updateTestimonialItem(index, 'author', v)}
                      placeholder="A HAPPY SAN FAMILY"
                    />
                  </div>

                  <ArrayControls
                    onMoveUp={() => moveTestimonial(index, -1)}
                    onMoveDown={() => moveTestimonial(index, 1)}
                    onRemove={() => removeTestimonial(index)}
                    disableUp={index === 0}
                    disableDown={index === (content.testimonials?.items?.length || 1) - 1}
                  />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addTestimonial}
            className="mt-6 w-full rounded-2xl border border-dashed border-neutral-300 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 transition hover:border-black hover:bg-neutral-50"
          >
            + Add New Testimonial
          </button>
        </SectionCard>

        {/* STICKY SAVE BAR */}
        <div className="sticky bottom-3 z-30 -mx-1 flex justify-stretch sm:bottom-4 sm:justify-end">
          <button
            type="button"
            onClick={saveContent}
            disabled={saving || !hasChanges}
            className={`w-full rounded-xl px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-white shadow-2xl transition sm:w-auto sm:px-8 ${saving || !hasChanges
                ? 'cursor-not-allowed bg-neutral-400'
                : 'bg-black hover:bg-neutral-800'
              }`}
          >
            {saving ? 'Saving Changes...' : 'Save All Home Changes'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default HomePageManagement;