import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import { uploadToCloudinary } from '../services/cloudinary'

const PORTFOLIO_API_URL =
    import.meta.env.VITE_PHP_API_URL ||
    'http://localhost:8000'

const CLOUDINARY_CLOUD_NAME =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''

const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

const MAX_STORY_IMAGES = 30

type PortfolioImage = {
    url: string
    visible: boolean
}

type PortfolioStory = {
    id: string
    title: string
    date: string
    strapline: string
    paragraphs: string[]
    videoUrl: string
    coverImageUrl?: string
    images: PortfolioImage[]
    [key: string]: unknown
}

type PortfolioContent = {
    heroEyebrow: string
    heroLabel: string
    heroLine1: string
    heroLine2: string
    heroLine3: string
    heroVideoUrl: string
    stories: PortfolioStory[]
    ctaEyebrow: string
    ctaLine1: string
    ctaLine2: string
    ctaDescription: string
    ctaButtonText: string
    ctaButtonHref: string
}

type StatusMessage = {
    type: 'success' | 'error'
    message: string
}

/*
 * IMPORTANT:
 * This admin is intentionally based on the existing public Portfolio.jsx.
 * It does not redesign the public Portfolio.
 *
 * Public order:
 *   01 Hero
 *   02 Featured Wedding Stories
 *   03 Final CTA
 *
 * Each story can have up to 30 images. Every image persists as
 * { url, visible }, while the public Portfolio keeps its existing
 * editorial composition and receives media from PHP/MySQL/Cloudinary.
 */

const DEFAULT_STORIES: PortfolioStory[] = [
    {
        id: 'kapil-payal',
        title: 'KAPIL & PAYAL',
        date: 'October 24, 2024',
        strapline: 'A homecoming, dressed in gold',
        paragraphs: [
            'From the horse that carried Kapil through Nagpur to the quiet moments between rituals, every frame here is a visual heirloom of their beautiful beginning.',
        ],
        videoUrl: '',
        images: [],
    },
    {
        id: 'pratik-megha',
        title: 'PRATIK & MEGHA',
        date: 'August 12, 2024',
        strapline: 'Modern love, old rituals',
        paragraphs: [
            'A day that moved like a story that already knew its ending — candid laughter, timeless traditions, and two families becoming one.',
        ],
        videoUrl: '',
        images: [],
    },
    {
        id: 'tanmay-achal',
        title: 'TANMAY & ACHAL',
        date: 'August 3, 2024',
        strapline: 'An intimate kind of grandeur',
        paragraphs: [
            'Low light, an unhurried pace, and a small circle of people who mattered most — a quiet, timeless archive of their most tender moments.',
        ],
        videoUrl: '',
        images: [],
    },
    {
        id: 'rohan-anjali',
        title: 'ROHAN & ANJALI',
        date: 'November 15, 2024',
        strapline: 'A vibrant modern classic',
        paragraphs: [
            'Blending contemporary aesthetics with timeless traditions, their wedding was a canvas of vibrant emotions and architectural elegance.',
        ],
        videoUrl: '',
        images: [],
    },
]

const DEFAULT_PORTFOLIO: PortfolioContent = {
    heroEyebrow: 'SAN / PORTFOLIO',
    heroLabel: 'Selected Works & Films',
    heroLine1: 'Timeless',
    heroLine2: 'moments,',
    heroLine3: 'beautifully captured.',
    heroVideoUrl: '',
    stories: DEFAULT_STORIES,
    ctaEyebrow: 'SAN Photography',
    ctaLine1: 'Your story.',
    ctaLine2: 'Our frame.',
    ctaDescription:
        'Every celebration has a story. We are here to preserve yours beautifully.',
    ctaButtonText: 'Start Your Story',
    ctaButtonHref: '/contact',
}

const clone = <T,>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T

const normalizeStory = (story: Partial<PortfolioStory> | undefined, index: number): PortfolioStory => {
    const fallback =
        DEFAULT_STORIES[index] ||
        DEFAULT_STORIES[0]

    const images =
        Array.isArray(story?.images)
            ? story.images
                .filter(Boolean)
                .slice(0, MAX_STORY_IMAGES)
                .map((image) => {
                    if (typeof image === 'string') {
                        return {
                            url: image,
                            visible: true,
                        }
                    }

                    return {
                        url: image?.url || '',
                        visible: image?.visible !== false,
                    }
                })
                .filter((image) => image.url)
            : []

    return {
        ...clone(fallback),
        ...(story || {}),
        id: story?.id || fallback.id,
        title: story?.title ?? fallback.title,
        date: story?.date ?? fallback.date,
        strapline:
            story?.strapline ??
            fallback.strapline,
        paragraphs:
            Array.isArray(story?.paragraphs)
                ? story.paragraphs
                : clone(fallback.paragraphs),
        videoUrl:
            story?.videoUrl ?? '',
        images,
    }
}

const normalizePortfolio = (saved: unknown): PortfolioContent => {
    const source =
        saved && typeof saved === 'object'
            ? saved as Partial<PortfolioContent>
            : {} as Partial<PortfolioContent>

    const sourceStories: PortfolioStory[] =
        Array.isArray(source.stories)
            ? source.stories as PortfolioStory[]
            : []

    /*
     * Keep the same four editorial story positions used by the
     * current public Portfolio. Existing saved stories are used;
     * missing positions retain the original content.
     */
    const stories = DEFAULT_STORIES.map(
        (fallback, index) =>
            normalizeStory(
                sourceStories[index] || fallback,
                index
            )
    )

    return {
        ...clone(DEFAULT_PORTFOLIO),
        ...source,
        heroEyebrow:
            source.heroEyebrow ??
            DEFAULT_PORTFOLIO.heroEyebrow,
        heroLabel:
            source.heroLabel ??
            DEFAULT_PORTFOLIO.heroLabel,
        heroLine1:
            source.heroLine1 ??
            DEFAULT_PORTFOLIO.heroLine1,
        heroLine2:
            source.heroLine2 ??
            DEFAULT_PORTFOLIO.heroLine2,
        heroLine3:
            source.heroLine3 ??
            DEFAULT_PORTFOLIO.heroLine3,
        heroVideoUrl:
            source.heroVideoUrl ?? '',
        stories,
        ctaEyebrow:
            source.ctaEyebrow ??
            DEFAULT_PORTFOLIO.ctaEyebrow,
        ctaLine1:
            source.ctaLine1 ??
            DEFAULT_PORTFOLIO.ctaLine1,
        ctaLine2:
            source.ctaLine2 ??
            DEFAULT_PORTFOLIO.ctaLine2,
        ctaDescription:
            source.ctaDescription ??
            DEFAULT_PORTFOLIO.ctaDescription,
        ctaButtonText:
            source.ctaButtonText ??
            DEFAULT_PORTFOLIO.ctaButtonText,
        ctaButtonHref:
            source.ctaButtonHref ??
            DEFAULT_PORTFOLIO.ctaButtonHref,
    }
}

/* =========================================================
   FIELD
========================================================= */

function Field({
    label,
    value,
    onChange,
    textarea = false,
    rows = 3,
    placeholder = '',
}: {
    label: string
    value?: string
    onChange: (value: string) => void
    textarea?: boolean
    rows?: number
    placeholder?: string
}) {
    return (
        <div>
            <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                {label}
            </label>

            {textarea ? (
                <textarea
                    rows={rows}
                    value={value ?? ''}
                    placeholder={placeholder}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    className="w-full resize-y rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3.5 text-sm leading-6 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                />
            ) : (
                <input
                    type="text"
                    value={value ?? ''}
                    placeholder={placeholder}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3.5 text-sm leading-6 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                />
            )}
        </div>
    )
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
    number,
    title,
    description,
    children,
}: {
    number: number
    title: string
    description: string
    children: React.ReactNode
}) {
    return (
        <section className="mb-7 overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
            <div className="border-b border-black/[0.07] bg-[#fbfaf7] px-5 py-5 sm:px-8 sm:py-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
                        {String(number).padStart(2, '0')}
                    </div>

                    <div>
                        <p className="text-[9px] uppercase tracking-[0.35em] text-[#a18764]">
                            SECTION {String(number).padStart(2, '0')}
                        </p>

                        <h2 className="mt-1 text-2xl font-light tracking-[-0.03em] text-neutral-900 sm:text-3xl">
                            {title}
                        </h2>

                        <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 sm:p-8">
                {children}
            </div>
        </section>
    )
}

/* =========================================================
   VIDEO UPLOADER
========================================================= */

function VideoUploader({
    label,
    value,
    fallbackSrc = '',
    onChange,
}: {
    label: string
    value?: string
    fallbackSrc?: string
    onChange: (value: string) => void
}) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [uploading, setUploading] =
        useState(false)
    const [progress, setProgress] =
        useState(0)
    const [error, setError] =
        useState('')

    const previewSrc =
        value || fallbackSrc

    const upload = async (file?: File) => {
        if (
            !file ||
            !file.type.startsWith('video/')
        ) {
            setError(
                'Please select a valid video file.'
            )
            return
        }

        if (
            !CLOUDINARY_CLOUD_NAME ||
            !CLOUDINARY_UPLOAD_PRESET
        ) {
            setError(
                'Cloudinary config missing. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'
            )
            return
        }

        try {
            setUploading(true)
            setError('')
            setProgress(1)

            const result =
                await uploadToCloudinary(
                    file,
                    'san-photography/portfolio',
                    (pct) =>
                        setProgress(pct)
                )

            if (!result?.url) {
                throw new Error(
                    'Cloudinary did not return a video URL.'
                )
            }

            onChange(result.url)
            setProgress(100)
        } catch (err) {
            console.error(
                'Portfolio video upload error:',
                err
            )

            setError(
                err instanceof Error ? err.message : 'Failed to upload video.'
            )
        } finally {
            setUploading(false)
            setTimeout(
                () => setProgress(0),
                800
            )
        }
    }

    return (
        <div className="space-y-3">
            <label className="block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                {label}
            </label>

            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-black">
                {previewSrc ? (
                    <video
                        key={previewSrc}
                        src={previewSrc}
                        controls
                        muted
                        playsInline
                        preload="metadata"
                        className="h-64 w-full object-contain bg-black sm:h-80"
                    />
                ) : (
                    <div className="flex h-64 items-center justify-center text-xs text-neutral-500 sm:h-80">
                        No video selected
                    </div>
                )}

                <div className="absolute left-3 top-3 rounded-lg bg-black/75 px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-white">
                    {value
                        ? 'Cloudinary video'
                        : fallbackSrc
                            ? 'Current local video'
                            : 'No video'}
                </div>

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="w-64 text-center text-white">
                            <p className="text-[10px] uppercase tracking-[0.2em]">
                                Uploading video...
                            </p>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-white transition-all"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>

                            <p className="mt-2 text-xs text-white/70">
                                {progress}%
                            </p>
                        </div>
                    </div>
                )}

                {!uploading && (
                    <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                inputRef.current?.click()
                            }
                            className="rounded-xl bg-white px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-black shadow-lg hover:bg-neutral-100"
                        >
                            {previewSrc
                                ? 'Replace Video'
                                : 'Upload Video'}
                        </button>

                        {value && (
                            <button
                                type="button"
                                onClick={() =>
                                    onChange('')
                                }
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white shadow-lg hover:bg-red-700"
                            >
                                Remove Uploaded
                            </button>
                        )}
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                    className="hidden"
                    onChange={(e) => {
                        const file =
                            e.target.files?.[0]

                        if (file) {
                            upload(file)
                        }

                        e.target.value = ''
                    }}
                />
            </div>

            {fallbackSrc && !value && (
                <p className="text-[11px] leading-5 text-neutral-500">
                    Current Portfolio video is still using the
                    local asset. Uploading a replacement stores
                    the new Cloudinary URL permanently.
                </p>
            )}

            <Field
                label="Video URL"
                value={value}
                onChange={onChange}
                placeholder="Cloudinary video URL"
            />

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {error}
                </div>
            )}
        </div>
    )
}

/* =========================================================
   STORY IMAGE MANAGER
========================================================= */

function StoryImageManager({
    story,
    storyIndex,
    onChange,
}: {
    story: PortfolioStory
    storyIndex: number
    onChange: (images: PortfolioImage[]) => void
}) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const [uploading, setUploading] =
        useState(false)

    const [progress, setProgress] =
        useState(0)

    const [error, setError] =
        useState('')

    const [replacingIndex, setReplacingIndex] =
        useState<number | null>(null)

    const images =
        Array.isArray(story.images)
            ? story.images
                .map((image) => {
                    if (typeof image === 'string') {
                        return {
                            url: image,
                            visible: true,
                        }
                    }

                    return {
                        url: image?.url || '',
                        visible: image?.visible !== false,
                    }
                })
                .filter((image) => image.url)
            : []

    const remaining =
        MAX_STORY_IMAGES - images.length

    const [showImages, setShowImages] =
        useState(false)

    const setImages = (next: PortfolioImage[]) => {
        onChange(
            next
                .filter((image) => image?.url)
                .slice(0, MAX_STORY_IMAGES)
                .map((image) => ({
                    url: image.url,
                    visible: image.visible !== false,
                }))
        )
    }

    const uploadFiles = async (files: FileList | null) => {
        const selected =
            Array.from(files || [])

        if (!selected.length) {
            return
        }

        if (remaining <= 0) {
            setError(
                `Maximum ${MAX_STORY_IMAGES} images are already added.`
            )
            return
        }

        const validFiles =
            selected.filter((file) =>
                file.type.startsWith('image/')
            )

        if (validFiles.length !== selected.length) {
            setError(
                'Only image files are accepted.'
            )
        } else {
            setError('')
        }

        const filesToUpload =
            validFiles.slice(0, remaining)

        if (validFiles.length > remaining) {
            setError(
                `Only ${remaining} more image${remaining === 1 ? '' : 's'} can be added.`
            )
        }

        if (
            !CLOUDINARY_CLOUD_NAME ||
            !CLOUDINARY_UPLOAD_PRESET
        ) {
            setError(
                'Cloudinary config missing. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'
            )
            return
        }

        try {
            setUploading(true)
            setProgress(0)

            const uploadedImages: PortfolioImage[] = []

            for (
                let i = 0;
                i < filesToUpload.length;
                i++
            ) {
                const file =
                    filesToUpload[i]

                const result =
                    await uploadToCloudinary(
                        file,
                        'san-photography/portfolio',
                        (fileProgress) => {
                            const totalProgress =
                                Math.round(
                                    ((i +
                                        fileProgress / 100) /
                                        filesToUpload.length) *
                                    100
                                )

                            setProgress(totalProgress)
                        }
                    )

                if (!result?.url) {
                    throw new Error(
                        `Cloudinary did not return a URL for ${file.name}.`
                    )
                }

                uploadedImages.push({
                    url: result.url,
                    visible: true,
                })
            }

            setImages([
                ...images,
                ...uploadedImages,
            ])

            setProgress(100)
        } catch (err) {
            console.error(
                `Story ${storyIndex + 1} image upload error:`,
                err
            )

            setError(
                err instanceof Error ? err.message : 'One or more images could not be uploaded.'
            )
        } finally {
            setUploading(false)

            setTimeout(
                () => setProgress(0),
                900
            )
        }
    }

    const replaceImage = async (index: number, file?: File) => {
        if (!file) {
            return
        }

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.')
            return
        }

        if (
            !CLOUDINARY_CLOUD_NAME ||
            !CLOUDINARY_UPLOAD_PRESET
        ) {
            setError(
                'Cloudinary config missing. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'
            )
            return
        }

        try {
            setReplacingIndex(index)
            setError('')

            const result =
                await uploadToCloudinary(
                    file,
                    'san-photography/portfolio',
                    () => {}
                )

            if (!result?.url) {
                throw new Error(
                    'Cloudinary did not return an image URL.'
                )
            }

            const next = images.map(
                (image, imageIndex) =>
                    imageIndex === index
                        ? {
                            ...image,
                            url: result.url,
                        }
                        : image
            )

            // Visibility state and position are deliberately preserved.
            setImages(next)
        } catch (err) {
            console.error(
                `Story ${storyIndex + 1} image replacement error:`,
                err
            )

            setError(
                err instanceof Error ? err.message : 'Failed to replace image.'
            )
        } finally {
            setReplacingIndex(null)
        }
    }

    const removeImage = (index: number) => {
        setImages(
            images.filter(
                (_, i) => i !== index
            )
        )
    }

    const toggleVisibility = (index: number) => {
        const next = images.map(
            (image, i) =>
                i === index
                    ? {
                        ...image,
                        visible: !image.visible,
                    }
                    : image
        )

        setImages(next)
    }

    const moveImage = (
        index: number,
        direction: number
    ) => {
        const target =
            index + direction

        if (
            target < 0 ||
            target >= images.length
        ) {
            return
        }

        const next = [...images]

        ;[
            next[index],
            next[target],
        ] = [
            next[target],
            next[index],
        ]

        setImages(next)
    }

    const handleDragStart = (index: number) => {
        if (inputRef.current) {
            inputRef.current.dataset.dragSource =
                String(index)
        }
    }

    const handleDrop = (targetIndex: number) => {
        const sourceIndex =
            Number(
                inputRef.current?.dataset
                    ?.dragSource ?? -1
            )

        if (
            sourceIndex < 0 ||
            sourceIndex === targetIndex
        ) {
            return
        }

        const next = [...images]
        const [moved] =
            next.splice(
                sourceIndex,
                1
            )

        next.splice(
            targetIndex,
            0,
            moved
        )

        setImages(next)

        if (inputRef.current) {
            delete inputRef.current.dataset
                .dragSource
        }
    }

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-neutral-900">
                            Story Images
                        </p>

                        <span className="rounded-full bg-black px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                            {images.length}/{MAX_STORY_IMAGES}
                        </span>
                    </div>

                    <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
                        Add up to 30 images. Order, Show/Hide state,
                        Replace, and removals are saved permanently.
                        Hidden images remain in Cloudinary and MySQL
                        and can be shown again later in the same position.
                    </p>
                </div>

                <button
                    type="button"
                    disabled={
                        uploading ||
                        remaining <= 0
                    }
                    onClick={() =>
                        inputRef.current?.click()
                    }
                    className="w-full rounded-xl bg-black px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400 sm:w-auto"
                >
                    {remaining > 0
                        ? `+ Add Images (${remaining} left)`
                        : '30 Images Added'}
                </button>
            </div>

            {uploading && (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-[#fbfaf7] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-700">
                            Uploading to Cloudinary
                        </p>

                        <span className="text-xs font-medium text-neutral-600">
                            {progress}%
                        </span>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                        <div
                            className="h-full rounded-full bg-black transition-all"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError('')}
                        className="shrink-0 text-red-500"
                    >
                        ×
                    </button>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="hidden"
                onChange={(e) => {
                    uploadFiles(e.target.files)
                    e.target.value = ''
                }}
            />

            {images.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf7] px-5 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-400">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                        >
                            <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                            />
                            <circle
                                cx="8.5"
                                cy="8.5"
                                r="1.5"
                            />
                            <path d="m21 15-5-5L5 21" />
                        </svg>
                    </div>

                    <p className="mt-3 text-sm text-neutral-600">
                        No saved Portfolio images yet.
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                        Add images and press Save Changes to persist
                        the Portfolio state.
                    </p>
                </div>
            ) : (
                <div className="mt-5">
                    <div className="mb-3 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-[#fbfaf7] p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
                                Saved image order
                            </p>
                            <p className="mt-1 text-[10px] text-neutral-400">
                                {images.length} images saved • {images.filter((image) => image.visible).length} visible • {images.filter((image) => !image.visible).length} hidden
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowImages((value) => !value)}
                            className="w-full rounded-lg bg-black px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-neutral-800 sm:w-auto"
                        >
                            {showImages
                                ? 'Hide Image Manager'
                                : 'Show Images'}
                        </button>
                    </div>

                    {showImages && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {images.map(
                            (image, imageIndex) => (
                                <div
                                    key={`${image.url}-${imageIndex}`}
                                    draggable
                                    onDragStart={() =>
                                        handleDragStart(imageIndex)
                                    }
                                    onDragOver={(e) =>
                                        e.preventDefault()
                                    }
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        handleDrop(imageIndex)
                                    }}
                                    className={`group relative overflow-hidden rounded-xl border bg-[#f3f0e9] ${
                                        image.visible
                                            ? 'border-neutral-200'
                                            : 'border-amber-300'
                                    }`}
                                >
                                    <div className="relative aspect-[4/5]">
                                        <img
                                            src={image.url}
                                            alt={`${story.title} ${imageIndex + 1}`}
                                            className={`h-full w-full object-cover transition ${
                                                image.visible
                                                    ? ''
                                                    : 'scale-[1.02] opacity-35 grayscale'
                                            }`}
                                            loading="lazy"
                                        />

                                        {!image.visible && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                                <span className="rounded-full bg-black/80 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                                                    Hidden
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-1 text-[9px] font-mono text-white">
                                        {String(imageIndex + 1).padStart(2, '0')}
                                    </div>

                                    <div className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-neutral-700">
                                        {image.visible ? 'Visible' : 'Hidden'}
                                    </div>

                                    <div className="absolute inset-x-2 bottom-2 flex flex-wrap items-center justify-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                                        <button
                                            type="button"
                                            disabled={imageIndex === 0}
                                            onClick={() =>
                                                moveImage(
                                                    imageIndex,
                                                    -1
                                                )
                                            }
                                            className="rounded-lg bg-white/95 px-2.5 py-2 text-[10px] font-semibold text-black shadow disabled:opacity-30"
                                            title="Move left"
                                        >
                                            ←
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleVisibility(
                                                    imageIndex
                                                )
                                            }
                                            className={`rounded-lg px-2.5 py-2 text-[9px] font-semibold uppercase shadow ${
                                                image.visible
                                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            }`}
                                            title={
                                                image.visible
                                                    ? 'Hide image'
                                                    : 'Show image'
                                            }
                                        >
                                            {image.visible
                                                ? 'Hide'
                                                : 'Show'}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={replacingIndex === imageIndex}
                                            onClick={() => {
                                                const input =
                                                    document.getElementById(
                                                        `replace-image-${story.id}-${imageIndex}`
                                                    )
                                                input?.click()
                                            }}
                                            className="rounded-lg bg-white px-2.5 py-2 text-[9px] font-semibold uppercase text-black shadow hover:bg-neutral-100 disabled:opacity-50"
                                        >
                                            {replacingIndex === imageIndex
                                                ? 'Uploading...'
                                                : 'Replace'}
                                        </button>

                                        <input
                                            id={`replace-image-${story.id}-${imageIndex}`}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/avif"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file =
                                                    e.target.files?.[0]

                                                if (file) {
                                                    replaceImage(
                                                        imageIndex,
                                                        file
                                                    )
                                                }

                                                e.target.value = ''
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeImage(
                                                    imageIndex
                                                )
                                            }
                                            className="rounded-lg bg-red-600 px-2.5 py-2 text-[9px] font-semibold uppercase text-white shadow hover:bg-red-700"
                                        >
                                            Remove
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                imageIndex ===
                                                images.length - 1
                                            }
                                            onClick={() =>
                                                moveImage(
                                                    imageIndex,
                                                    1
                                                )
                                            }
                                            className="rounded-lg bg-white/95 px-2.5 py-2 text-[10px] font-semibold text-black shadow disabled:opacity-30"
                                            title="Move right"
                                        >
                                            →
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                    )}
                </div>
            )}

            <div className="mt-5 rounded-xl border border-[#e6dccb] bg-[#faf7f0] px-4 py-3 text-[11px] leading-5 text-[#74634d]">
                <strong>Persistence:</strong> Hide/Show changes only
                the saved visibility state. The Cloudinary asset and
                MySQL media record are kept. Replace uploads a new
                Cloudinary image while preserving the same position
                and visibility state. Remove deletes the old Portfolio
                media slot when you press <strong>Save Changes</strong>.
            </div>
        </div>
    )
}

/* =========================================================
   LOCAL VIDEO FALLBACKS
========================================================= */

const localVideoFiles = import.meta.glob(
    '../assets/portfolio/wedding/**/*.{mp4,mov,MP4,MOV}',
    { eager: true, import: 'default' }
)

const findLocalVideo = (
    folder: string,
    partialName: string
): string => {
    const entry =
        Object.entries(
            localVideoFiles
        ).find(([path]) => {
            const normalized =
                path
                    .replace(/\\/g, '/')
                    .toLowerCase()

            return (
                normalized.includes(
                    `/wedding/${folder.toLowerCase()}/`
                ) &&
                normalized.includes(
                    partialName.toLowerCase()
                )
            )
        })

    return typeof entry?.[1] === 'string' ? entry[1] : ''
}

const LOCAL_HERO_VIDEO =
    findLocalVideo(
        'video2/VIDEOS',
        'KAPIL PAYAL WEDDING FILM'
    )

/* =========================================================
   MAIN MANAGEMENT
========================================================= */

const PortfolioManagement = () => {
    const [portfolio, setPortfolio] =
        useState<PortfolioContent>(
            clone(DEFAULT_PORTFOLIO)
        )

    const [original, setOriginal] =
        useState<PortfolioContent>(
            clone(DEFAULT_PORTFOLIO)
        )

    const [loading, setLoading] =
        useState(true)

    const [saving, setSaving] =
        useState(false)

    const [status, setStatus] =
        useState<StatusMessage | null>(null)

    const [loadError, setLoadError] =
        useState('')

    const [expandedStoryId, setExpandedStoryId] =
        useState<string | null>(null)

    const hasChanges =
        useMemo(
            () =>
                JSON.stringify(
                    portfolio
                ) !==
                JSON.stringify(
                    original
                ),
            [portfolio, original]
        )

    const setField = (
        field: keyof PortfolioContent,
        value: string
    ) => {
        setPortfolio(
            (prev) => ({
                ...prev,
                [field]: value,
            })
        )

        setStatus(null)
    }

    const setStoryField = (
        storyIndex: number,
        field: keyof PortfolioStory,
        value: string
    ) => {
        setPortfolio(
            (prev) => {
                const stories =
                    clone(
                        prev.stories
                    )

                stories[
                    storyIndex
                ] = {
                    ...stories[
                        storyIndex
                    ],
                    [field]: value,
                }

                return {
                    ...prev,
                    stories,
                }
            }
        )

        setStatus(null)
    }

    const setStoryImages = (
        storyIndex: number,
        images: PortfolioImage[]
    ) => {
        if (
            images.length >
            MAX_STORY_IMAGES
        ) {
            setStatus({
                type: 'error',
                message: `A story can contain maximum ${MAX_STORY_IMAGES} images.`,
            })
            return
        }

        setPortfolio(
            (prev) => {
                const stories =
                    clone(
                        prev.stories
                    )

                stories[
                    storyIndex
                ].images =
                    images.slice(
                        0,
                        MAX_STORY_IMAGES
                    )

                return {
                    ...prev,
                    stories,
                }
            }
        )

        setStatus(null)
    }

    const setStoryParagraph = (
        storyIndex: number,
        paragraphIndex: number,
        value: string
    ) => {
        setPortfolio(
            (prev) => {
                const stories =
                    clone(
                        prev.stories
                    )

                const paragraphs =
                    Array.isArray(
                        stories[
                            storyIndex
                        ].paragraphs
                    )
                        ? [
                            ...stories[
                                storyIndex
                            ].paragraphs,
                        ]
                        : []

                paragraphs[
                    paragraphIndex
                ] = value

                stories[
                    storyIndex
                ].paragraphs =
                    paragraphs

                return {
                    ...prev,
                    stories,
                }
            }
        )

        setStatus(null)
    }

    const toggleStory = (storyId: string) => {
        setExpandedStoryId((current) =>
            current === storyId ? null : storyId
        )
    }

    const addParagraph = (
        storyIndex: number
    ) => {
        setPortfolio(
            (prev) => {
                const stories =
                    clone(
                        prev.stories
                    )

                stories[
                    storyIndex
                ].paragraphs = [
                    ...(stories[
                        storyIndex
                    ].paragraphs || []),
                    'New paragraph text...',
                ]

                return {
                    ...prev,
                    stories,
                }
            }
        )

        setStatus(null)
    }

    const removeParagraph = (
        storyIndex: number,
        paragraphIndex: number
    ) => {
        setPortfolio(
            (prev) => {
                const stories =
                    clone(
                        prev.stories
                    )

                stories[
                    storyIndex
                ].paragraphs =
                    (
                        stories[
                            storyIndex
                        ].paragraphs || []
                    ).filter(
                        (_, i) =>
                            i !==
                            paragraphIndex
                    )

                return {
                    ...prev,
                    stories,
                }
            }
        )

        setStatus(null)
    }

    /* =====================================================
       FETCH
    ===================================================== */

    const fetchPortfolio =
        useCallback(
            async () => {
                const controller =
                    new AbortController()

                const timeout =
                    setTimeout(
                        () =>
                            controller.abort(),
                        20000
                    )

                try {
                    setLoading(true)
                    setLoadError('')
                    setStatus(null)

                    const res =
                        await fetch(
                            `${PORTFOLIO_API_URL}/api/portfolio.php`,
                            {
                                method: 'GET',
                                signal:
                                    controller.signal,
                                cache: 'no-store',
                            }
                        )

                    const data =
                        await res.json()

                    if (
                        !res.ok ||
                        !data.success
                    ) {
                        throw new Error(
                            data.message ||
                            `Failed to load Portfolio (${res.status}).`
                        )
                    }

                    const merged =
                        normalizePortfolio(
                            data.portfolio
                        )

                    setPortfolio(
                        merged
                    )

                    setOriginal(
                        clone(merged)
                    )
                } catch (error: unknown) {
                    console.error(
                        'Portfolio fetch error:',
                        error
                    )

                    setLoadError(
                        error instanceof Error && error.name === 'AbortError'
                            ? 'Portfolio API request timed out. Check that PHP is running on port 8000.'
                            : error instanceof Error
                                ? error.message
                                : 'Failed to load Portfolio.'
                    )
                } finally {
                    clearTimeout(
                        timeout
                    )
                    setLoading(false)
                }
            },
            []
        )

    useEffect(() => {
        fetchPortfolio()
    }, [fetchPortfolio])

    /* =====================================================
       SAVE
    ===================================================== */

    const handleSave =
        async () => {
            if (saving) {
                return
            }

            if (!hasChanges) {
                setStatus({
                    type: 'success',
                    message:
                        'Everything is already saved.',
                })
                return
            }

            const invalidStory =
                portfolio.stories.find(
                    (story: PortfolioStory) =>
                        !Array.isArray(
                            story.images
                        ) ||
                        story.images.length >
                            MAX_STORY_IMAGES
                )

            if (invalidStory) {
                setStatus({
                    type: 'error',
                    message: `${invalidStory.title || 'A story'} cannot contain more than ${MAX_STORY_IMAGES} images.`,
                })
                return
            }

            try {
                setSaving(true)
                setStatus(null)

                const token =
                    localStorage.getItem(
                        'adminToken'
                    ) || ''

                if (!token) {
                    throw new Error(
                        'Admin session not found. Please log in again.'
                    )
                }

                const controller =
                    new AbortController()

                const timeout =
                    setTimeout(
                        () =>
                            controller.abort(),
                        30000
                    )

                let res: Response

                try {
                    res = await fetch(
                        `${PORTFOLIO_API_URL}/api/portfolio.php`,
                        {
                            method: 'PUT',
                            headers: {
                                'Content-Type':
                                    'application/json',
                                Authorization:
                                    `Bearer ${token}`,
                            },
                            body: JSON.stringify(
                                {
                                    content: {
                                        portfolio,
                                    },
                                }
                            ),
                            signal:
                                controller.signal,
                        }
                    )
                } finally {
                    clearTimeout(
                        timeout
                    )
                }

                let data: { success?: boolean; message?: string; portfolio?: unknown }

                try {
                    data = await res.json()
                } catch {
                    throw new Error(
                        `PHP API returned an invalid response (${res.status}).`
                    )
                }

                if (
                    !res.ok ||
                    !data.success
                ) {
                    throw new Error(
                        data.message ||
                        `Portfolio save failed (${res.status}).`
                    )
                }

                const saved =
                    normalizePortfolio(
                        data.portfolio ||
                        portfolio
                    )

                setPortfolio(
                    saved
                )

                setOriginal(
                    clone(saved)
                )

                setStatus({
                    type: 'success',
                    message:
                        'Portfolio page saved successfully.',
                })
            } catch (error: unknown) {
                console.error(
                    'Portfolio save error:',
                    error
                )

                setStatus({
                    type: 'error',
                    message:
                        error instanceof Error && error.name === 'AbortError'
                            ? 'Save timed out. Check that PHP/MySQL is running and try again.'
                            : error instanceof Error
                                ? error.message
                                : 'Failed to save Portfolio.',
                })
            } finally {
                setSaving(false)
            }
        }

    /* =====================================================
       RESET
    ===================================================== */

    const handleReset =
        () => {
            if (!hasChanges) {
                return
            }

            if (
                !window.confirm(
                    'Discard all unsaved Portfolio changes?'
                )
            ) {
                return
            }

            setPortfolio(
                clone(original)
            )

            setStatus(null)
        }

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#f6f2ea]">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
                    <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-neutral-700">
                        Loading Portfolio
                    </p>
                    <p className="mt-2 text-xs text-neutral-400">
                        Fetching saved Portfolio content...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f6f2ea] pb-28">
            {/* =================================================
                FIXED SAVE STATUS
            ================================================= */}

            {status && (
                <div
                    className={`fixed left-0 right-0 top-0 z-[200] px-4 py-3 text-center text-xs font-semibold text-white shadow-lg ${
                        status.type === 'success'
                            ? 'bg-emerald-600'
                            : 'bg-red-600'
                    }`}
                >
                    {status.type === 'success'
                        ? '✓ '
                        : '⚠ '}
                    {status.message}
                </div>
            )}

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="border-b border-neutral-200 bg-[#fbfaf7]">
                <div className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 sm:py-10">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#a18764]">
                                SAN / PORTFOLIO
                            </p>

                            <h1 className="mt-2 text-4xl font-light tracking-[-0.05em] text-neutral-900 sm:text-5xl lg:text-6xl">
                                Portfolio Management
                            </h1>

                            <p className="mt-3 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                                Edit the same Hero, Wedding Stories,
                                image order, videos and CTA used by
                                the current public Portfolio.
                            </p>
                        </div>

                        <div className="flex w-full gap-3 sm:w-auto">
                            {hasChanges && (
                                <button
                                    type="button"
                                    onClick={
                                        handleReset
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="flex-1 rounded-xl border border-neutral-300 bg-white px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 sm:flex-none"
                                >
                                    Reset
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={
                                    handleSave
                                }
                                disabled={
                                    saving ||
                                    !hasChanges
                                }
                                className={`flex-1 rounded-xl px-6 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition sm:flex-none ${
                                    saving ||
                                    !hasChanges
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
            </header>

            {loadError && (
                <div className="mx-auto mt-6 max-w-[1200px] px-5 sm:px-8">
                    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-xs text-red-700 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            {loadError}
                        </span>

                        <button
                            type="button"
                            onClick={
                                fetchPortfolio
                            }
                            className="self-start rounded-lg bg-white px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-red-600 sm:self-auto"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 sm:py-10">
                {/* =================================================
                    01 — HERO
                ================================================= */}

                <SectionCard
                    number={1}
                    title="Hero Section"
                    description="Same Hero content as the existing public Portfolio. Only the content/media source is managed here; the public design remains unchanged."
                >
                    <div className="space-y-6">
                        <Field
                            label="Eyebrow"
                            value={
                                portfolio.heroEyebrow
                            }
                            onChange={(value) =>
                                setField(
                                    'heroEyebrow',
                                    value
                                )
                            }
                        />

                        <Field
                            label="Label Above Heading"
                            value={
                                portfolio.heroLabel
                            }
                            onChange={(value) =>
                                setField(
                                    'heroLabel',
                                    value
                                )
                            }
                        />

                        <div className="grid gap-5 md:grid-cols-3">
                            <Field
                                label="Heading Line 1"
                                value={
                                    portfolio.heroLine1
                                }
                                onChange={(value) =>
                                    setField(
                                        'heroLine1',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Heading Line 2 — Italic"
                                value={
                                    portfolio.heroLine2
                                }
                                onChange={(value) =>
                                    setField(
                                        'heroLine2',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Heading Line 3"
                                value={
                                    portfolio.heroLine3
                                }
                                onChange={(value) =>
                                    setField(
                                        'heroLine3',
                                        value
                                    )
                                }
                            />
                        </div>

                        <div className="border-t border-neutral-200 pt-6">
                            <VideoUploader
                                label="Hero Video — Current / Replace / Remove"
                                value={
                                    portfolio.heroVideoUrl ||
                                    ''
                                }
                                fallbackSrc={
                                    LOCAL_HERO_VIDEO
                                }
                                onChange={(value) =>
                                    setField(
                                        'heroVideoUrl',
                                        value
                                    )
                                }
                            />
                        </div>

                        <div className="rounded-2xl bg-neutral-900 p-6">
                            <div className="flex items-center gap-3">
                                <span className="h-px w-8 bg-[#C9A467]" />
                                <span className="text-[9px] uppercase tracking-[0.4em] text-white/70">
                                    {
                                        portfolio.heroEyebrow
                                    }
                                </span>
                            </div>

                            <p className="mt-5 text-[9px] uppercase tracking-[0.4em] text-[#C9A467]">
                                {
                                    portfolio.heroLabel
                                }
                            </p>

                            <p className="mt-3 max-w-4xl text-3xl font-light leading-[0.9] tracking-[-0.04em] text-white sm:text-5xl">
                                {
                                    portfolio.heroLine1
                                }{' '}
                                <em>
                                    {
                                        portfolio.heroLine2
                                    }
                                </em>{' '}
                                {
                                    portfolio.heroLine3
                                }
                            </p>
                        </div>
                    </div>
                </SectionCard>

                {/* =================================================
                    02 — FEATURED WEDDING STORIES
                ================================================= */}

                <SectionCard
                    number={2}
                    title="Featured Wedding Stories"
                    description="This is the exact content block shown after the Hero on the public Portfolio. Each story keeps its existing title, date, strapline, paragraphs, video and editorial image carousel."
                >
                    <div className="mb-6 rounded-xl border border-[#e6dccb] bg-[#faf7f0] px-4 py-4 text-xs leading-5 text-[#74634d]">
                        <strong>Image rule:</strong> each wedding
                        story supports up to{' '}
                        <strong>
                            {MAX_STORY_IMAGES}
                        </strong>{' '}
                        images. Upload order is preserved. The
                        public Portfolio still displays them using
                        its existing 8-image composition and
                        horizontal carousel — this admin does not
                        change that design.
                    </div>

                    <div className="space-y-4">
                        {portfolio.stories.map(
                            (story, storyIndex) => {
                                const isExpanded =
                                    expandedStoryId ===
                                    story.id

                                return (
                                    <article
                                        key={
                                            story.id ||
                                            storyIndex
                                        }
                                        className="overflow-hidden rounded-2xl border border-neutral-200 bg-[#fbfaf7]"
                                    >
                                        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                                                    {story.coverImageUrl ? (
                                                        <img
                                                            src={story.coverImageUrl}
                                                            alt={story.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>
                                                            {String(
                                                                storyIndex +
                                                                1
                                                            ).padStart(
                                                                2,
                                                                '0'
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9b7740]">
                                                        Story {String(storyIndex + 1).padStart(2, '0')}
                                                    </p>
                                                    <p className="mt-1 truncate text-sm font-medium text-neutral-800">
                                                        {story.title}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 self-end sm:self-center">
                                                <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                                                    {(story.images || []).length}/30 PHOTOS
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleStory(
                                                            story.id
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-700 shadow-sm transition hover:bg-neutral-100"
                                                >
                                                    <span>
                                                        {isExpanded
                                                            ? 'Hide Photos'
                                                            : 'Manage Photos'}
                                                    </span>
                                                    <span className="text-xs leading-none">
                                                        {isExpanded ? '↑' : '↓'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="space-y-7 border-t border-neutral-200 p-5 sm:p-6">
                                                <div className="grid gap-5 md:grid-cols-2">
                                                    <Field
                                                        label="Story Title"
                                                        value={
                                                            story.title
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            setStoryField(
                                                                storyIndex,
                                                                'title',
                                                                value
                                                            )
                                                        }
                                                    />

                                                    <Field
                                                        label="Date"
                                                        value={
                                                            story.date
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            setStoryField(
                                                                storyIndex,
                                                                'date',
                                                                value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <Field
                                                    label="Strapline"
                                                    value={
                                                        story.strapline
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        setStoryField(
                                                            storyIndex,
                                                            'strapline',
                                                            value
                                                        )
                                                    }
                                                />

                                                <div>
                                                    <div className="mb-3 flex items-center justify-between gap-3">
                                                        <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                                                            Story Paragraphs
                                                        </label>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                addParagraph(
                                                                    storyIndex
                                                                )
                                                            }
                                                            className="rounded-lg bg-black px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-neutral-800"
                                                        >
                                                            + Add Paragraph
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {(story.paragraphs || []).map((paragraph, paragraphIndex) => (
                                                            <div
                                                                key={
                                                                    paragraphIndex
                                                                }
                                                                className="relative"
                                                            >
                                                                <textarea
                                                                    rows={4}
                                                                    value={
                                                                        paragraph
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setStoryParagraph(
                                                                            storyIndex,
                                                                            paragraphIndex,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-14 text-sm leading-6 text-neutral-800 outline-none focus:border-black focus:ring-1 focus:ring-black"
                                                                />

                                                                <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                                                                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-mono text-neutral-400">
                                                                        P
                                                                        {paragraphIndex +
                                                                            1}
                                                                    </span>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeParagraph(
                                                                                storyIndex,
                                                                                paragraphIndex
                                                                            )
                                                                        }
                                                                        className="rounded px-1.5 py-0.5 text-[9px] text-red-500 hover:bg-red-50"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="order-2">
                                                    <VideoUploader
                                                        label="Story Video — Optional"
                                                        value={
                                                            story.videoUrl ||
                                                            ''
                                                        }
                                                        onChange={(
                                                            value
                                                        ) =>
                                                            setStoryField(
                                                                storyIndex,
                                                                'videoUrl',
                                                                value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="order-3">
                                                    <StoryImageManager
                                                        story={
                                                            story
                                                        }
                                                        storyIndex={
                                                            storyIndex
                                                        }
                                                        onChange={(
                                                            images
                                                        ) =>
                                                            setStoryImages(
                                                                storyIndex,
                                                                images
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[11px] leading-5 text-neutral-500">
                                                    Story video remains attached to this story, and the Story Image Manager handles the photo order, hide/show, replace, and bulk uploads for this couple only.
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                )
                            }
                        )}
                    </div>
                </SectionCard>

                {/* =================================================
                    03 — FINAL CTA
                ================================================= */}

                <SectionCard
                    number={3}
                    title="Final CTA Section"
                    description="Same final Portfolio CTA: Your story. Our frame. and Start Your Story."
                >
                    <div className="space-y-6">
                        <Field
                            label="CTA Eyebrow"
                            value={
                                portfolio.ctaEyebrow
                            }
                            onChange={(value) =>
                                setField(
                                    'ctaEyebrow',
                                    value
                                )
                            }
                        />

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Heading Line 1"
                                value={
                                    portfolio.ctaLine1
                                }
                                onChange={(value) =>
                                    setField(
                                        'ctaLine1',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Heading Line 2 — Italic"
                                value={
                                    portfolio.ctaLine2
                                }
                                onChange={(value) =>
                                    setField(
                                        'ctaLine2',
                                        value
                                    )
                                }
                            />
                        </div>

                        <Field
                            label="Description"
                            value={
                                portfolio.ctaDescription
                            }
                            textarea
                            rows={4}
                            onChange={(value) =>
                                setField(
                                    'ctaDescription',
                                    value
                                )
                            }
                        />

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Button Text"
                                value={
                                    portfolio.ctaButtonText
                                }
                                onChange={(value) =>
                                    setField(
                                        'ctaButtonText',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Button Link"
                                value={
                                    portfolio.ctaButtonHref
                                }
                                onChange={(value) =>
                                    setField(
                                        'ctaButtonHref',
                                        value
                                    )
                                }
                            />
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-[#F9F7F2] px-5 py-10 text-center">
                            <p className="text-[9px] uppercase tracking-[0.45em] text-[#9b7740]">
                                {
                                    portfolio.ctaEyebrow
                                }
                            </p>

                            <h3 className="mt-4 text-4xl font-light leading-none tracking-[-0.05em] text-[#171717] sm:text-5xl">
                                {
                                    portfolio.ctaLine1
                                }
                                <br />
                                <em>
                                    {
                                        portfolio.ctaLine2
                                    }
                                </em>
                            </h3>

                            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#555]">
                                {
                                    portfolio.ctaDescription
                                }
                            </p>

                            <div className="mt-7 inline-flex items-center bg-[#171717] px-7 py-3.5 text-[10px] uppercase tracking-[0.3em] text-[#F9F7F2]">
                                {
                                    portfolio.ctaButtonText
                                }
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* =================================================
                    BOTTOM SAVE
                ================================================= */}

                <div className="fixed bottom-4 right-4 z-[80] sm:right-8">
                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <button
                                type="button"
                                onClick={
                                    handleReset
                                }
                                disabled={
                                    saving
                                }
                                className="rounded-xl border border-neutral-300 bg-white px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-700 shadow-xl hover:bg-neutral-100 disabled:opacity-50"
                            >
                                Reset
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={
                                handleSave
                            }
                            disabled={
                                saving ||
                                !hasChanges
                            }
                            className={`rounded-xl px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-white shadow-2xl transition ${
                                saving ||
                                !hasChanges
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
            </main>
        </div>
    )
}

export default PortfolioManagement
