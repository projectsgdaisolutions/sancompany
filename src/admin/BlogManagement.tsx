import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { uploadToCloudinary } from '../services/cloudinary';
import type { BlogContent, BlogPost } from '../types';
import weddingFilmUrl from '../assets/portfolio/wedding/VIDEOS/KAPIL PAYAL WEDDING FILM HIGH CORRECTION.MP4';

// =========================================================
// SAN PHOTOGRAPHY — BLOG MANAGEMENT
// Source of truth: src/pages/Blog.jsx
//
// Managed public structure:
// 01 Featured Story
// 02 Latest Stories
// 03 Blog Posts (7 posts)
// 04 Latest Images / Google Drive link
//
// All changes persist through:
// React Admin -> PHP /api/blog.php -> MySQL website_content.blog
// =========================================================

const BLOG_API_URL =
    import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000';

const CLOUDINARY_CLOUD_NAME =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';

const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

// =========================================================
// LOCAL DEFAULT MEDIA — same source as Blog.jsx
// =========================================================

const imageFiles = import.meta.glob(
    '../assets/portfolio/wedding/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
    { eager: true, import: 'default' }
);

const videoFiles = import.meta.glob(
    '../assets/portfolio/wedding/**/*.{mp4,MP4,mov,MOV}',
    { eager: true, import: 'default' }
);

const localImages = Object.values(imageFiles) as string[];
const localVideos = Object.values(videoFiles) as string[];

// =========================================================
// DEFAULT POSTS — EXACT CONTENT FROM PUBLIC Blog.jsx
// =========================================================

interface AdminBlogPost extends BlogPost {
    fallbackVideoUrl?: string;
    video?: string;
}

type EditableBlogField = 'type' | 'category' | 'title' | 'excerpt' | 'date' | 'readTime' | 'image' | 'imageUrl' | 'videoUrl' | 'fallbackVideoUrl';

const DEFAULT_POSTS: AdminBlogPost[] = [
    {
        id: 1,
        type: 'video',
        category: 'WEDDINGS',
        title: 'The Details That Make a Wedding Yours',
        excerpt:
            'From the first look to the final dance, every wedding tells a unique story. We document the in-between moments — the glances, the tears, the laughter — that make your celebration entirely yours.',
        date: '12 August 2026',
        readTime: '5 min watch',
        videoUrl: weddingFilmUrl,
        fallbackVideoUrl: '',
        image: '',
        imageUrl: '',
    },
    {
        id: 2,
        type: 'image',
        category: 'PRE-WEDDING',
        title: 'Planning a Pre-Wedding Session',
        excerpt:
            'A relaxed approach to location, light, and genuine moments that feel completely like you.',
        date: '29 July 2026',
        readTime: '5 min read',
        image:
            localImages[0] ||
            'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        videoUrl: '',
        imageUrl: '',
    },
    {
        id: 3,
        type: 'image',
        category: 'PORTRAITS',
        title: 'The Beauty of Being Yourself',
        excerpt:
            'Portrait photography becomes meaningful when there is space for personality, confidence, and emotion.',
        date: '21 July 2026',
        readTime: '4 min read',
        image:
            localImages[1] ||
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        videoUrl: '',
        imageUrl: '',
    },
    {
        id: 4,
        type: 'video',
        category: 'CINEMATOGRAPHY',
        title: 'The Art of Wedding Films',
        excerpt:
            'A great wedding film is more than just a recording; it is a carefully crafted narrative.',
        date: '01 July 2026',
        readTime: '5 min watch',
        videoUrl: localVideos[0] || '',
        fallbackVideoUrl: '',
        image: '',
        imageUrl: '',
    },
    {
        id: 5,
        type: 'image',
        category: 'EVENTS',
        title: 'Timeless Celebrations',
        excerpt:
            'From grand entrances to intimate gatherings, every event has its own unique pulse.',
        date: '10 July 2026',
        readTime: '4 min read',
        image:
            localImages[2] ||
            'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
        videoUrl: '',
        imageUrl: '',
    },
    {
        id: 6,
        type: 'image',
        category: 'STUDIO',
        title: 'Behind The Lens',
        excerpt:
            'The equipment we use is simply a tool; the true craft lies in how we see and capture light.',
        date: '20 June 2026',
        readTime: '4 min read',
        image:
            localImages[3] ||
            'https://images.unsplash.com/photo-1500000115461-96f5f4ff7e93?auto=format&fit=crop&w=800&q=80',
        videoUrl: '',
        imageUrl: '',
    },
    {
        id: 7,
        type: 'video',
        category: 'PHOTOGRAPHY',
        title: 'What Makes a Photograph Timeless?',
        excerpt:
            'Beyond beautiful images, here are the things that truly matter when choosing someone to document your day.',
        date: '05 August 2026',
        readTime: '4 min watch',
        videoUrl: localVideos[1] || '',
        fallbackVideoUrl: '',
        image: '',
        imageUrl: '',
    },
];

// =========================================================
// DEFAULT BLOG CONTENT — EXACT PUBLIC VALUES
// =========================================================

const DEFAULT_BLOG: BlogContent & { posts: AdminBlogPost[] } = {
    featuredLabel: 'Featured Story',
    featuredReadText: 'Watch Full Story',

    driveButtonText: 'See Our Latest Images',
    driveButtonHref: 'https://drive.google.com/drive/folders/your-folder-id',

    latestEyebrow: 'FROM THE JOURNAL',
    latestHeading: 'Latest stories',
    latestDescription:
        'Inspiration, advice and behind-the-scenes thoughts from SAN Photography.',
    readStoryText: 'View Details',

    posts: DEFAULT_POSTS,
};

// =========================================================
// HELPERS
// =========================================================

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function normalizePost(savedPost: Partial<AdminBlogPost>, fallbackPost: AdminBlogPost): AdminBlogPost {
    const source =
        savedPost && typeof savedPost === 'object' ? savedPost : {};

    return {
        ...deepClone(fallbackPost),
        ...source,
        id: source.id ?? fallbackPost.id,
        type: source.type ?? fallbackPost.type,
        category: source.category ?? fallbackPost.category,
        title: source.title ?? fallbackPost.title,
        excerpt: source.excerpt ?? fallbackPost.excerpt,
        date: source.date ?? fallbackPost.date,
        readTime: source.readTime ?? fallbackPost.readTime,
        image: source.image ?? source.imageUrl ?? fallbackPost.image ?? '',
        imageUrl:
            source.imageUrl ?? source.image ?? fallbackPost.imageUrl ?? fallbackPost.image ?? '',
        videoUrl:
            source.videoUrl ??
            source.video ??
            fallbackPost.videoUrl ??
            fallbackPost.video ??
            '',
        fallbackVideoUrl:
            source.fallbackVideoUrl ?? fallbackPost.fallbackVideoUrl ?? '',
    };
}

function mergeBlog(saved: Partial<BlogContent> & { featuredImageUrl?: string; featuredVideoUrl?: string; featuredImage?: string; featuredVideo?: string } = {}): BlogContent & { posts: AdminBlogPost[] } {
    if (!saved || typeof saved !== 'object') {
        return deepClone(DEFAULT_BLOG);
    }

    if (!Array.isArray(saved.posts)) {
        return deepClone(DEFAULT_BLOG);
    }

    const posts = saved.posts.map((post, index) =>
        normalizePost(post, {
            id: post?.id ?? `post-${index + 1}`,
            type: post?.type ?? 'image',
            category: post?.category ?? '',
            title: post?.title ?? '',
            excerpt: post?.excerpt ?? '',
            date: post?.date ?? '',
            readTime: post?.readTime ?? '',
            image: '',
            imageUrl: '',
            videoUrl: '',
            fallbackVideoUrl: '',
        })
    );

    if (posts[0]) {
        const savedFeaturedImage =
            saved.featuredImageUrl ?? saved.featuredImage ?? '';
        const savedFeaturedVideo =
            saved.featuredVideoUrl ?? saved.featuredVideo ?? '';

        if (savedFeaturedImage) {
            posts[0].imageUrl = savedFeaturedImage;
            posts[0].image = savedFeaturedImage;
        }

        posts[0].image = posts[0].imageUrl;
        if (savedFeaturedVideo) {
            posts[0].videoUrl = savedFeaturedVideo;
        }
    }

    return {
        featuredLabel: saved.featuredLabel ?? '',
        featuredReadText: saved.featuredReadText ?? '',

        driveButtonText:
            saved.driveButtonText ?? DEFAULT_BLOG.driveButtonText,
        driveButtonHref:
            saved.driveButtonHref ?? DEFAULT_BLOG.driveButtonHref,

        latestEyebrow:
            saved.latestEyebrow ?? DEFAULT_BLOG.latestEyebrow,
        latestHeading:
            saved.latestHeading ?? DEFAULT_BLOG.latestHeading,
        latestDescription:
            saved.latestDescription ?? DEFAULT_BLOG.latestDescription,
        readStoryText:
            saved.readStoryText ?? DEFAULT_BLOG.readStoryText,

        posts,
    };
}

// =========================================================
// FIELD
// =========================================================

function Field({
    label,
    value,
    onChange,
    textarea = false,
    placeholder = '',
    rows = 4,
    type = 'text',
}: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; placeholder?: string; rows?: number; type?: string }) {
    return (
        <div className="w-full">
            <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                {label}
            </label>

            {textarea ? (
                <textarea
                    rows={rows}
                    value={value ?? ''}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full resize-y rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3.5 text-sm leading-6 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                />
            ) : (
                <input
                    type={type}
                    value={value ?? ''}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3.5 text-sm leading-6 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                />
            )}
        </div>
    );
}

// =========================================================
// SECTION CARD
// =========================================================

function SectionCard({ number, title, description, children }: { number: number; title: string; description?: string; children: React.ReactNode }) {
    return (
        <section className="mb-6 overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.025)] sm:mb-8">
            <div className="border-b border-black/[0.07] bg-[#fbfaf7] px-5 py-5 sm:px-8 sm:py-6">
                <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
                        {String(number).padStart(2, '0')}
                    </div>

                    <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.35em] text-[#a18764]">
                            SECTION {String(number).padStart(2, '0')}
                        </p>

                        <h2 className="mt-1 text-2xl font-light tracking-[-0.03em] text-neutral-900 sm:text-3xl">
                            {title}
                        </h2>

                        {description && (
                            <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-5 sm:p-8">{children}</div>
        </section>
    );
}

// =========================================================
// IMAGE UPLOADER
// =========================================================

function ImageUploader({
    label,
    value,
    onChange,
    alt = 'Blog image',
    aspect = 'landscape',
}: { label: string; value: string; onChange: (value: string) => void; alt?: string; aspect?: string }) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [previewError, setPreviewError] = useState(false);
    const [source, setSource] = useState('upload');
    const [urlDraft, setUrlDraft] = useState(value || '');

    useEffect(() => {
        setUrlDraft(value || '');
    }, [value]);

    const upload = async (file: File | undefined) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Please select a valid image.');
            return;
        }

        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            setError('Cloudinary config missing. Check .env variables.');
            return;
        }

        try {
            setUploading(true);
            setError('');
            setPreviewError(false);
            setProgress(5);

            const result = await uploadToCloudinary(
                file,
                'san-photography/blog',
                (pct) => setProgress(pct)
            );

            if (!result?.url) {
                throw new Error('No Cloudinary URL returned.');
            }

            onChange(result.url);
            setProgress(100);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to upload image.');
        } finally {
            setUploading(false);
            setTimeout(() => setProgress(0), 800);
        }
    };

    const previewClass =
        aspect === 'portrait'
            ? 'h-64 sm:h-72'
            : aspect === 'square'
              ? 'h-52 sm:h-60'
              : 'h-44 sm:h-52';

    return (
        <div className="space-y-3">
            <label className="block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                {label}
            </label>

            <div
                className={`relative overflow-hidden rounded-2xl border border-neutral-200 bg-[#f3f0e9] ${previewClass}`}
            >
                {value && !previewError ? (
                    <img
                        src={value}
                        alt={alt}
                        className="h-full w-full object-cover object-center"
                        onError={() => setPreviewError(true)}
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-400">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="m21 15-5-5L5 21" />
                            </svg>
                        </div>

                        <p className="text-xs text-neutral-500">
                            {previewError ? 'Image could not load' : 'No image uploaded'}
                        </p>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
                        <div className="w-full max-w-xs text-center text-white">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                                Uploading...
                            </p>

                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-white transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <p className="mt-2 text-xs text-white/70">
                                {progress}%
                            </p>
                        </div>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (file) {
                            upload(file);
                        }

                        e.target.value = '';
                    }}
                />
            </div>

            <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                    Source
                </span>
                <div className="flex rounded-xl border border-neutral-200 bg-white p-1">
                    {['upload', 'url'].map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setSource(option)}
                            className={`rounded-lg px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] transition ${
                                source === option
                                    ? 'bg-black text-white'
                                    : 'text-neutral-500 hover:bg-neutral-100'
                            }`}
                        >
                            {option === 'upload' ? 'Upload' : 'URL'}
                        </button>
                    ))}
                </div>
            </div>

            {source === 'upload' ? (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="rounded-xl bg-black px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {value ? 'Replace Image' : 'Upload Image'}
                    </button>
                    {value && (
                        <button
                            type="button"
                            onClick={() => {
                                setPreviewError(false);
                                onChange('');
                            }}
                            disabled={uploading}
                            className="rounded-xl bg-red-600 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-red-700 disabled:opacity-50"
                        >
                            Remove Image
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <Field
                        label="Image URL"
                        value={urlDraft}
                        onChange={(v) => {
                            setPreviewError(false);
                            setUrlDraft(v);
                        }}
                        placeholder="Paste image URL"
                    />
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => onChange(urlDraft.trim())}
                            className="rounded-xl bg-black px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                        >
                            Use Image URL
                        </button>
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="rounded-xl bg-red-600 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
                            >
                                Remove Image
                            </button>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {error}
                </div>
            )}
        </div>
    );
}

// =========================================================
// VIDEO PREVIEW
// =========================================================

function VideoPreview({ value, title }: { value: string; title?: string }) {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [value]);

    if (!value || error) {
        return (
            <div className="flex h-52 items-center justify-center rounded-2xl border border-neutral-200 bg-[#f3f0e9] text-xs text-neutral-500">
                {value ? 'Video could not load' : 'No video uploaded'}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-black">
            <video
                src={value}
                controls
                muted
                playsInline
                preload="metadata"
                className="h-52 w-full object-contain"
                onError={() => setError(true)}
            />
            <div className="border-t border-white/10 bg-black px-4 py-2 text-[9px] uppercase tracking-[0.18em] text-white/60">
                {title || 'Video Preview'}
            </div>
        </div>
    );
}

function VideoUploader({ value, onChange, title }: { value: string; onChange: (value: string) => void; title?: string }) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [source, setSource] = useState('upload');
    const [urlDraft, setUrlDraft] = useState(value || '');

    useEffect(() => {
        setUrlDraft(value || '');
    }, [value]);

    const upload = async (file: File | undefined) => {
        if (!file || !file.type.startsWith('video/')) {
            setError('Please select a valid video.');
            return;
        }

        try {
            setUploading(true);
            setError('');
            setProgress(5);

            const result = await uploadToCloudinary(
                file,
                'san-photography/blog',
                (pct) => setProgress(pct)
            );

            if (!result?.url) {
                throw new Error('No Cloudinary URL returned.');
            }

            onChange(result.url);
            setProgress(100);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to upload video.');
        } finally {
            setUploading(false);
            setTimeout(() => setProgress(0), 800);
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                Post Video
            </label>

            <div className="relative">
                <VideoPreview value={value} title={title} />

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 px-6 backdrop-blur-sm">
                        <div className="w-full max-w-xs text-center text-white">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                                Uploading...
                            </p>
                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-white transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-white/70">{progress}%</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                    Source
                </span>
                <div className="flex rounded-xl border border-neutral-200 bg-white p-1">
                    {['upload', 'url'].map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setSource(option)}
                            className={`rounded-lg px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] transition ${
                                source === option
                                    ? 'bg-black text-white'
                                    : 'text-neutral-500 hover:bg-neutral-100'
                            }`}
                        >
                            {option === 'upload' ? 'Upload' : 'URL'}
                        </button>
                    ))}
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                    e.target.value = '';
                }}
            />

            {source === 'upload' ? (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="rounded-xl bg-black px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {value ? 'Replace Video' : 'Upload Video'}
                    </button>
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            disabled={uploading}
                            className="rounded-xl bg-red-600 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-red-700 disabled:opacity-50"
                        >
                            Remove Video
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <Field
                        label="Video URL"
                        value={urlDraft}
                        onChange={setUrlDraft}
                        placeholder="Paste Cloudinary or external video URL"
                    />
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => onChange(urlDraft.trim())}
                            className="rounded-xl bg-black px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                        >
                            Use Video URL
                        </button>
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="rounded-xl bg-red-600 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
                            >
                                Remove Video
                            </button>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {error}
                </div>
            )}
        </div>
    );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

const BlogManagement = () => {
    const [blog, setBlog] = useState<BlogContent & { posts: AdminBlogPost[] }>(deepClone(DEFAULT_BLOG));
    const [original, setOriginal] = useState<BlogContent & { posts: AdminBlogPost[] }>(deepClone(DEFAULT_BLOG));

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [saveMsg, setSaveMsg] = useState('');
    const [errMsg, setErrMsg] = useState('');

    const [draggedPostIndex, setDraggedPostIndex] = useState<number | null>(null);
    const [dragOverPostIndex, setDragOverPostIndex] = useState<number | null>(null);
    const [mediaTabs, setMediaTabs] = useState<Record<string, string>>({});

    const hasChanges = useMemo(
        () => JSON.stringify(blog) !== JSON.stringify(original),
        [blog, original]
    );

    // =====================================================
    // GET BLOG
    // =====================================================

    const fetchBlog = useCallback(async () => {
        try {
            setLoading(true);
            setErrMsg('');
            setSaveMsg('');

            const res = await fetch(`${BLOG_API_URL}/api/blog.php`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(
                    data.message || 'Failed to load Blog content.'
                );
            }

            const merged = mergeBlog(data.blog);

            setBlog(merged);
            setOriginal(deepClone(merged));
        } catch (err: unknown) {
            console.error('Blog GET error:', err);
            setErrMsg(
                err instanceof Error ? err.message : 'Failed to load Blog content.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlog();
    }, [fetchBlog]);

    // =====================================================
    // GENERIC BLOG FIELD
    // =====================================================

    const set = (field: keyof BlogContent, value: string) => {
        setBlog((prev) => ({
            ...prev,
            [field]: value,
        }));

        setSaveMsg('');
        setErrMsg('');
    };

    // =====================================================
    // POST FIELD
    // =====================================================

    const setPostField = (index: number, field: EditableBlogField, value: string) => {
        setBlog((prev) => {
            const posts = deepClone(prev.posts || []);

            if (!posts[index]) return prev;

            posts[index][field] = value;

            return {
                ...prev,
                posts,
            };
        });

        setSaveMsg('');
        setErrMsg('');
    };

    // =====================================================
    // ADD POST
    // =====================================================

    const addPost = () => {
        const newPost = {
            id: Date.now(),
            type: 'image',
            category: 'PHOTOGRAPHY',
            title: 'New Story Title',
            excerpt: 'Short description of this blog story...',
            date: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }),
            readTime: '4 min read',
            image: '',
            imageUrl: '',
            videoUrl: '',
        };

        setBlog((prev) => ({
            ...prev,
            posts: [...(prev.posts || []), newPost],
        }));

        setSaveMsg('');
        setErrMsg('');
    };

    // =====================================================
    // DELETE POST
    // =====================================================

    const removePost = (index: number) => {
        const post = blog.posts?.[index];

        const confirmed = window.confirm(
            `Delete "${post?.title || 'this post'}"? This will be saved when you click Save Changes.`
        );

        if (!confirmed) return;

        setBlog((prev) => ({
            ...prev,
            posts: (prev.posts || []).filter((_, i) => i !== index),
        }));

        setSaveMsg('');
        setErrMsg('');
    };

    // =====================================================
    // MOVE POST
    // =====================================================

    const movePost = (index: number, direction: number) => {
        setBlog((prev) => {
            const posts = [...(prev.posts || [])];
            const target = index + direction;

            if (
                target < 0 ||
                target >= posts.length
            ) {
                return prev;
            }

            [posts[index], posts[target]] = [
                posts[target],
                posts[index],
            ];

            return {
                ...prev,
                posts,
            };
        });

        setSaveMsg('');
        setErrMsg('');
    };

    // =====================================================
    // DRAG & DROP
    // =====================================================

    const handlePostDrop = (targetIndex: number) => {
        if (
            draggedPostIndex === null ||
            draggedPostIndex === targetIndex
        ) {
            setDraggedPostIndex(null);
            setDragOverPostIndex(null);
            return;
        }

        setBlog((prev) => {
            const posts = [...(prev.posts || [])];

            const [moved] = posts.splice(
                draggedPostIndex,
                1
            );

            posts.splice(targetIndex, 0, moved);

            return {
                ...prev,
                posts,
            };
        });

        setDraggedPostIndex(null);
        setDragOverPostIndex(null);
        setSaveMsg('');
        setErrMsg('');
    };

    // =====================================================
    // SAVE BLOG
    // =====================================================

    const handleSave = async () => {
        if (!hasChanges) {
            setSaveMsg('No changes to save.');
            return;
        }

        const token =
            localStorage.getItem('adminToken') || '';

        if (!token) {
            setErrMsg(
                'Admin session not found. Please log in again.'
            );
            setSaveMsg('');
            return;
        }

        try {
            setSaving(true);
            setSaveMsg('');
            setErrMsg('');

            const res = await fetch(
                `${BLOG_API_URL}/api/blog.php`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        content: {
                            blog,
                        },
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                if (res.status === 401) {
                    throw new Error(
                        'Admin authentication expired. Please log in again.'
                    );
                }

                throw new Error(
                    data.message || 'Failed to save Blog content.'
                );
            }

            // Do not trust only the PUT response.
            // Re-read the saved record from MySQL with a cache-busting GET.
            const verifyRes = await fetch(
                `${BLOG_API_URL}/api/blog.php?t=${Date.now()}`,
                {
                    method: 'GET',
                    cache: 'no-store',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const verifyData = await verifyRes.json();

            if (
                !verifyRes.ok ||
                !verifyData.success ||
                !verifyData.blog
            ) {
                throw new Error(
                    'Blog was saved, but the saved data could not be verified from MySQL.'
                );
            }

            const saved = mergeBlog(verifyData.blog);

            setBlog(saved);
            setOriginal(deepClone(saved));

            setSaveMsg(
                'Blog page saved and verified successfully.'
            );

            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        } catch (err: unknown) {
            console.error('Blog PUT error:', err);
            setErrMsg(
                err instanceof Error ? err.message : 'Failed to save Blog content.'
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // RESET
    // =====================================================

    const handleReset = () => {
        if (!hasChanges) return;

        const confirmed = window.confirm(
            'Discard all unsaved changes?'
        );

        if (!confirmed) return;

        setBlog(deepClone(original));
        setSaveMsg('');
        setErrMsg('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="min-h-[70vh] bg-[#f6f2ea] p-5 sm:p-8">
                <div className="mx-auto max-w-[1200px]">
                    <div className="animate-pulse space-y-4">
                        <div className="h-3 w-24 rounded bg-neutral-200" />
                        <div className="h-10 w-72 rounded bg-neutral-200" />
                        <div className="h-4 w-96 max-w-full rounded bg-neutral-200" />
                        <div className="mt-10 h-80 rounded-2xl bg-neutral-200" />
                    </div>
                </div>
            </div>
        );
    }

    const posts = Array.isArray(blog.posts)
        ? blog.posts
        : [];
    const featuredPost = posts[0];
    const featuredDefaultMediaTab =
        featuredPost?.imageUrl || featuredPost?.image
            ? 'image'
            : featuredPost?.videoUrl
              ? 'video'
              : 'image';
    const featuredMediaTab =
        mediaTabs.featured || featuredDefaultMediaTab;

    return (
        <div className="min-h-screen bg-[#f6f2ea] pb-28">
            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="border-b border-neutral-200 bg-[#fbfaf7]">
                <div className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 sm:py-10">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#a18764]">
                                JOURNAL & STORIES
                            </p>

                            <h1 className="mt-2 text-4xl font-light tracking-[-0.05em] text-neutral-900 sm:text-5xl lg:text-6xl">
                                Blog Page Management
                            </h1>

                            <p className="mt-3 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                                Manage the exact content, media and serial order displayed on the public Blog page.
                            </p>
                        </div>

                        <div className="flex w-full gap-3 sm:w-auto">
                            {hasChanges && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={saving}
                                    className="flex-1 rounded-xl border border-neutral-300 bg-white px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 sm:flex-none"
                                >
                                    Reset
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={
                                    saving ||
                                    !hasChanges
                                }
                                className={`flex-1 rounded-xl px-6 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition sm:flex-none ${
                                    saving || !hasChanges
                                        ? 'cursor-not-allowed bg-neutral-400'
                                        : 'bg-black hover:bg-neutral-800'
                                }`}
                            >
                                {saving
                                    ? 'Saving...'
                                    : hasChanges
                                      ? 'Save Changes'
                                      : 'Saved'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 sm:py-10">
                {saveMsg && (
                    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-xs leading-5 text-green-700 sm:mb-8 sm:px-5">
                        ✓ {saveMsg}
                    </div>
                )}

                {errMsg && (
                    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-xs leading-5 text-red-700 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <span>{errMsg}</span>

                        <button
                            type="button"
                            onClick={fetchBlog}
                            className="self-start rounded-lg bg-white px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-red-600 sm:self-auto"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* =================================================
                    SECTION 01 — FEATURED STORY
                ================================================= */}

                <SectionCard
                    number={1}
                    title="Featured Story"
                    description="The first post in the list is automatically displayed as the large Featured Story on the public Blog page."
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field
                            label="Featured Badge Label"
                            value={blog.featuredLabel}
                            onChange={(value) =>
                                set(
                                    'featuredLabel',
                                    value
                                )
                            }
                            placeholder="Featured Story"
                        />

                        <Field
                            label="Featured Button Text"
                            value={blog.featuredReadText}
                            onChange={(value) =>
                                set(
                                    'featuredReadText',
                                    value
                                )
                            }
                            placeholder="Watch Full Story"
                        />
                    </div>

                    {featuredPost && (
                        <div className="mt-8 rounded-2xl border border-neutral-200 bg-[#fbfaf7] p-5 sm:p-6">
                            <div className="mb-5 flex flex-wrap items-center gap-2">
                                <span className="rounded bg-black px-2 py-1 text-[9px] font-mono text-white">
                                    #01
                                </span>

                                <span className="rounded bg-[#9b7b45] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">
                                    Featured Story
                                </span>

                                <span className="text-sm font-medium text-neutral-800">
                                    {featuredPost.title}
                                </span>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="Category"
                                    value={featuredPost.category}
                                    onChange={(value) =>
                                        setPostField(
                                            0,
                                            'category',
                                            value
                                        )
                                    }
                                />

                                <Field
                                    label="Title"
                                    value={featuredPost.title}
                                    onChange={(value) =>
                                        setPostField(
                                            0,
                                            'title',
                                            value
                                        )
                                    }
                                />

                                <Field
                                    label="Publish Date"
                                    value={featuredPost.date}
                                    onChange={(value) =>
                                        setPostField(
                                            0,
                                            'date',
                                            value
                                        )
                                    }
                                />

                                <Field
                                    label="Read / Watch Time"
                                    value={featuredPost.readTime}
                                    onChange={(value) =>
                                        setPostField(
                                            0,
                                            'readTime',
                                            value
                                        )
                                    }
                                />
                            </div>

                            <div className="mt-5">
                                <Field
                                    label="Excerpt / Description"
                                    value={featuredPost.excerpt}
                                    onChange={(value) =>
                                        setPostField(
                                            0,
                                            'excerpt',
                                            value
                                        )
                                    }
                                    textarea
                                    rows={4}
                                />
                            </div>

                            <div className="mt-8 border-t border-neutral-200 pt-6">
                                <label className="block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                                    Post Media
                                </label>

                                <div className="mt-3 flex max-w-xs rounded-xl border border-neutral-200 bg-white p-1">
                                    {['image', 'video'].map((mediaType) => (
                                        <button
                                            key={`featured-${mediaType}`}
                                            type="button"
                                            onClick={() =>
                                                setMediaTabs((prev) => ({
                                                    ...prev,
                                                    featured: mediaType,
                                                }))
                                            }
                                            className={`flex-1 rounded-lg px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] transition ${
                                                featuredMediaTab === mediaType
                                                    ? 'bg-black text-white'
                                                    : 'text-neutral-500 hover:bg-neutral-100'
                                            }`}
                                        >
                                            {mediaType}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-5 max-w-xl">
                                    {featuredMediaTab === 'image' ? (
                                        <ImageUploader
                                            label="Featured Image"
                                            value={
                                                featuredPost.imageUrl ||
                                                featuredPost.image || ''
                                            }
                                            onChange={(value) => {
                                                setPostField(
                                                    0,
                                                    'imageUrl',
                                                    value
                                                );
                                                setPostField(
                                                    0,
                                                    'image',
                                                    value
                                                );
                                            }}
                                            alt={featuredPost.title}
                                            aspect="landscape"
                                        />
                                    ) : (
                                        <VideoUploader
                                            value={featuredPost.videoUrl || ''}
                                            title={featuredPost.title}
                                            onChange={(value) =>
                                                setPostField(
                                                    0,
                                                    'videoUrl',
                                                    value
                                                )
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>

                {/* =================================================
                    SECTION 02 — LATEST STORIES
                ================================================= */}

                <SectionCard
                    number={2}
                    title="Latest Stories"
                    description="These settings control the heading area and action text above the public three-column story grid."
                >
                    <div className="space-y-6">
                        <Field
                            label="Section Eyebrow"
                            value={blog.latestEyebrow}
                            onChange={(value) =>
                                set(
                                    'latestEyebrow',
                                    value
                                )
                            }
                            placeholder="FROM THE JOURNAL"
                        />

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Section Heading"
                                value={blog.latestHeading}
                                onChange={(value) =>
                                    set(
                                        'latestHeading',
                                        value
                                    )
                                }
                                placeholder="Latest stories"
                            />

                            <Field
                                label="Card Button Text"
                                value={blog.readStoryText}
                                onChange={(value) =>
                                    set(
                                        'readStoryText',
                                        value
                                    )
                                }
                                placeholder="View Details"
                            />
                        </div>

                        <Field
                            label="Section Description"
                            value={blog.latestDescription}
                            onChange={(value) =>
                                set(
                                    'latestDescription',
                                    value
                                )
                            }
                            textarea
                            rows={3}
                            placeholder="Inspiration, advice and behind-the-scenes thoughts from SAN Photography."
                        />
                    </div>
                </SectionCard>

                {/* =================================================
                    SECTION 03 — LATEST IMAGES / DRIVE
                ================================================= */}

                <SectionCard
                    number={3}
                    title="Latest Images — Google Drive"
                    description="This is the exact button shown beside the Featured Story on the public Blog page. Paste the Google Drive folder link here; visitors will be sent to it in a new tab."
                >
                    <div className="space-y-6">
                        <Field
                            label="Button Text"
                            value={
                                blog.driveButtonText
                            }
                            onChange={(value) =>
                                set(
                                    'driveButtonText',
                                    value
                                )
                            }
                            placeholder="See Our Latest Images"
                        />

                        <Field
                            label="Google Drive Folder URL"
                            value={
                                blog.driveButtonHref
                            }
                            onChange={(value) =>
                                set(
                                    'driveButtonHref',
                                    value
                                )
                            }
                            placeholder="https://drive.google.com/drive/folders/..."
                        />

                        <div className="rounded-xl border border-neutral-200 bg-[#fbfaf7] p-5">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#927344]">
                                Current Link
                            </p>

                            <p className="mt-2 break-all text-xs leading-5 text-neutral-600">
                                {blog.driveButtonHref ||
                                    'No Google Drive link added yet.'}
                            </p>

                            {blog.driveButtonHref && (
                                <a
                                    href={
                                        blog.driveButtonHref
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex rounded-xl bg-black px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                                >
                                    Test Drive Link ↗
                                </a>
                            )}
                        </div>
                    </div>
                </SectionCard>

                {/* =================================================
                    SECTION 04 — ALL BLOG POSTS
                ================================================= */}

                <SectionCard
                    number={4}
                    title="Blog Posts"
                    description="Manage the complete serial order used by the public Blog page. Post #01 is Featured; posts #02–#07 appear in the Latest Stories grid."
                >
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-neutral-900">
                                All Blog Posts ({posts.length})
                            </h3>

                            <p className="mt-1 text-xs text-neutral-500">
                                Drag to reorder, or use Move Up / Move Down.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addPost}
                            className="rounded-xl bg-black px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                        >
                            + Add New Blog Post
                        </button>
                    </div>

                    <div className="space-y-6">
                        {posts.map((post, index) => {
                            const isDragging =
                                draggedPostIndex ===
                                index;

                            const isOver =
                                dragOverPostIndex ===
                                index;

                            const isFeatured =
                                index === 0;

                            const mediaKey = String(post.id ?? index);
                            const defaultMediaTab =
                                post.imageUrl || post.image
                                    ? 'image'
                                    : post.videoUrl
                                      ? 'video'
                                      : 'image';
                            const selectedMediaTab =
                                mediaTabs[mediaKey] || defaultMediaTab;

                            return (
                                <div
                                    key={`${String(post.id ?? 'post')}-${index}`}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData(
                                            'text/plain',
                                            String(index)
                                        );

                                        setDraggedPostIndex(
                                            index
                                        );
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();

                                        if (
                                            dragOverPostIndex !==
                                            index
                                        ) {
                                            setDragOverPostIndex(
                                                index
                                            );
                                        }
                                    }}
                                    onDragLeave={() => {
                                        if (
                                            dragOverPostIndex ===
                                            index
                                        ) {
                                            setDragOverPostIndex(
                                                null
                                            );
                                        }
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handlePostDrop(
                                            index
                                        );
                                    }}
                                    onDragEnd={() => {
                                        setDraggedPostIndex(
                                            null
                                        );
                                        setDragOverPostIndex(
                                            null
                                        );
                                    }}
                                    className={`cursor-grab rounded-2xl border bg-[#fbfaf7] p-4 shadow-sm transition-all duration-200 active:cursor-grabbing sm:p-6 ${
                                        isDragging
                                            ? 'opacity-40 ring-2 ring-black'
                                            : isOver
                                              ? 'border-black bg-[#f0ede6] ring-2 ring-black'
                                              : 'border-neutral-200'
                                    }`}
                                >
                                    {/* POST HEADER */}

                                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded bg-black px-2 py-1 text-[9px] font-mono text-white">
                                                #
                                                {String(
                                                    index +
                                                        1
                                                ).padStart(
                                                    2,
                                                    '0'
                                                )}
                                            </span>

                                            {isFeatured && (
                                                <span className="rounded bg-[#9b7b45] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">
                                                    ★ Featured
                                                </span>
                                            )}

                                            <span className="rounded border border-neutral-200 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                                                {post.type ===
                                                'video'
                                                    ? 'VIDEO'
                                                    : 'IMAGE'}
                                            </span>

                                            <span className="text-sm font-medium text-neutral-800">
                                                {post.title ||
                                                    'Untitled Post'}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removePost(
                                                    index
                                                )
                                            }
                                            className="rounded-lg px-2.5 py-1.5 text-[9px] uppercase tracking-[0.2em] text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                        >
                                            Delete Post
                                        </button>
                                    </div>

                                    {/* POST FIELDS */}

                                    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
                                        {/* MEDIA */}

                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                                                    Post Media
                                                </label>
                                                <div className="mt-3 flex rounded-xl border border-neutral-200 bg-white p-1">
                                                    {['image', 'video'].map((mediaType) => (
                                                        <button
                                                            key={mediaType}
                                                            type="button"
                                                            onClick={() =>
                                                                setMediaTabs((prev) => ({
                                                                    ...prev,
                                                                    [mediaKey]: mediaType,
                                                                }))
                                                            }
                                                            className={`flex-1 rounded-lg px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] transition ${
                                                                selectedMediaTab === mediaType
                                                                    ? 'bg-black text-white'
                                                                    : 'text-neutral-500 hover:bg-neutral-100'
                                                            }`}
                                                        >
                                                            {mediaType}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {selectedMediaTab === 'image' ? (
                                                <ImageUploader
                                                    label="Post Image"
                                                    value={post.imageUrl || post.image || ''}
                                                    onChange={(value) => {
                                                        setPostField(index, 'imageUrl', value);
                                                        setPostField(index, 'image', value);
                                                    }}
                                                    alt={post.title}
                                                    aspect="portrait"
                                                />
                                            ) : (
                                                <VideoUploader
                                                    value={post.videoUrl || ''}
                                                    title={post.title}
                                                    onChange={(value) =>
                                                        setPostField(index, 'videoUrl', value)
                                                    }
                                                />
                                            )}
                                        </div>

                                        {/* CONTENT */}

                                        <div className="space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field
                                                    label="Category"
                                                    value={
                                                        post.category
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPostField(
                                                            index,
                                                            'category',
                                                            value
                                                        )
                                                    }
                                                    placeholder="WEDDINGS"
                                                />

                                                <Field
                                                    label="Post Type"
                                                    value={
                                                        post.type
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPostField(
                                                            index,
                                                            'type',
                                                            value ===
                                                            'video'
                                                                ? 'video'
                                                                : 'image'
                                                        )
                                                    }
                                                    placeholder="image / video"
                                                />
                                            </div>

                                            <Field
                                                label="Title"
                                                value={
                                                    post.title
                                                }
                                                onChange={(
                                                    value
                                                ) =>
                                                    setPostField(
                                                        index,
                                                        'title',
                                                        value
                                                    )
                                                }
                                                placeholder="Post headline"
                                            />

                                            <Field
                                                label="Excerpt / Description"
                                                value={
                                                    post.excerpt
                                                }
                                                onChange={(
                                                    value
                                                ) =>
                                                    setPostField(
                                                        index,
                                                        'excerpt',
                                                        value
                                                    )
                                                }
                                                textarea
                                                rows={4}
                                                placeholder="Short description of this story..."
                                            />

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field
                                                    label="Publish Date"
                                                    value={
                                                        post.date
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPostField(
                                                            index,
                                                            'date',
                                                            value
                                                        )
                                                    }
                                                    placeholder="12 August 2026"
                                                />

                                                <Field
                                                    label="Read / Watch Time"
                                                    value={
                                                        post.readTime
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setPostField(
                                                            index,
                                                            'readTime',
                                                            value
                                                        )
                                                    }
                                                    placeholder="5 min read"
                                                />
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        movePost(
                                                            index,
                                                            -1
                                                        )
                                                    }
                                                    disabled={
                                                        index ===
                                                        0
                                                    }
                                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
                                                >
                                                    Move Up
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        movePost(
                                                            index,
                                                            1
                                                        )
                                                    }
                                                    disabled={
                                                        index ===
                                                        posts.length -
                                                            1
                                                    }
                                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
                                                >
                                                    Move Down
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={addPost}
                        className="mt-6 w-full rounded-2xl border border-dashed border-neutral-300 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 transition hover:border-black hover:bg-white hover:text-black"
                    >
                        + Add New Blog Post
                    </button>
                </SectionCard>

                {/* =================================================
                    STICKY SAVE
                ================================================= */}

                <div className="sticky bottom-4 z-30 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={
                            saving ||
                            !hasChanges
                        }
                        className={`rounded-xl px-8 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-white shadow-2xl transition ${
                            saving || !hasChanges
                                ? 'cursor-not-allowed bg-neutral-400'
                                : 'bg-black hover:bg-neutral-800'
                        }`}
                    >
                        {saving
                            ? 'Saving Changes...'
                            : 'Save All Blog Changes'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default BlogManagement;
