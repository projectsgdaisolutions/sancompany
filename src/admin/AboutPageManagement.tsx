import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { uploadToCloudinary } from '../services/cloudinary';
import type { AboutContent, TeamMember } from '../types';

const API_BASE_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000';

const CLOUDINARY_CLOUD_NAME =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';

const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

/* =========================================================
   TEAM ASSETS
========================================================= */

const teamFiles = import.meta.glob(
    '../assets/team/*.{jpeg,jpg,png,webp,JPEG,JPG,PNG,WEBP}',
    {
        eager: true,
        import: 'default',
    }
);

const normalizeName = (value = '') =>
    value
        .toLowerCase()
        .replace(/\.(jpeg|jpg|png|webp)$/i, '')
        .replace(
            /videographer|photographer|photographar|founder|cinematographer/gi,
            ''
        )
        .replace(/[^a-z0-9]/g, '')
        .trim();

const findTeamImage = (personName: string): string => {
    const target = normalizeName(personName);

    const entries = Object.entries(teamFiles) as [string, string][];

    const exact = entries.find(([path]) => {
        const fileName = path.split('/').pop();
        return normalizeName(fileName) === target;
    });

    if (exact) return exact[1];

    const partial = entries.find(([path]) => {
        const fileName = path.split('/').pop();
        const normalizedFile = normalizeName(fileName);

        return (
            normalizedFile.includes(target) ||
            target.includes(normalizedFile)
        );
    });

    return partial?.[1] || '';
};

/* =========================================================
   DEFAULT ABOUT DATA
   EXACT DATA FROM CURRENT ABOUT.JSX
========================================================= */

const DEFAULT_ABOUT: AboutContent = {
    heroEyebrow: 'About SAN Photography',
    heroLine1: 'We capture',
    heroLine2: 'what you feel.',
    heroLine3: 'Not just what you see.',

    introText:
        'At SAN Photography, our team brings together creativity, experience, and passion to capture every special moment beautifully. From candid emotions to the smallest details, we work together to create photographs and films that tell your story.',

    founderEyebrow: 'Founder',
    founderHeadingNormal: 'The person behind',
    founderHeadingItalic: 'SAN.',
    founderName: 'SANDEEP BRAHMANKAR',
    founderRole:
        'Founder & Professional Photographer / Cinematographer',
    founderDescription:
        'SANDEEP is the founder and creative force behind SAN Photography, with 15+ years of professional experience in photography and cinematography. With a passion for storytelling and an eye for detail, he specializes in capturing weddings, pre-wedding celebrations, maternity moments, birthdays, kids, and other special occasions. His goal is to capture genuine emotions and create timeless photographs and cinematic films that clients can treasure for generations.',
    founderQuote:
        'Every picture has a story, and our job is to capture it beautifully.',
    founderImage: findTeamImage('SANDEEP BRAHMANKAR') || '',

    teamEyebrow: 'The Creative Team',
    teamHeadingNormal: 'People behind',
    teamHeadingItalic: 'the frames.',

    teamMembers: [
        {
            id: 'team-01',
            number: '01',
            name: 'AIFAZ KHAN',
            role: 'Videographer',
            description:
                'AIFAZ is a talented member of the SAN Photography team, contributing creativity and expertise to every project. He specializes in cinematography and works closely with clients to ensure every important moment is captured beautifully.',
            image:
                findTeamImage('AHEFAZ KHAN') ||
                findTeamImage('AIFAZ KHAN') ||
                '',
        },
        {
            id: 'team-02',
            number: '02',
            name: 'BHAGWAT SHAHARE',
            role: 'Videographer',
            description:
                'Bhagwat is part of the creative team at SAN Photography and plays an important role in delivering high-quality photographs and films. With a passion for photography and storytelling, he brings a unique creative perspective to every celebration.',
            image: findTeamImage('BHAGWAT SHAHARE') || '',
        },
        {
            id: 'team-03',
            number: '03',
            name: 'NITIN BRAHMANKAR',
            role: 'Photographer',
            description:
                'A passionate and talented candid photographer with a keen eye for capturing genuine emotions, natural expressions, and unforgettable moments. Known for creative compositions and attention to detail, he specializes in weddings, pre-weddings, birthdays, maternity, kids, and special celebrations. His goal is to turn every beautiful moment into a timeless memory.',
            image: findTeamImage('NITIN BRAHMANKAR') || '',
        },
        {
            id: 'team-04',
            number: '04',
            name: 'YASH MESHRAM',
            role: 'Videographer',
            description:
                'A skilled traditional photographer and videographer specializing in capturing every important moment with clarity and creativity. With a strong focus on weddings, ceremonies, birthdays, and celebrations, he ensures that every tradition, emotion, and memorable moment is beautifully documented for you to cherish forever.',
            image: findTeamImage('YASH MESHRAM') || '',
        },
        {
            id: 'team-05',
            number: '05',
            name: 'SAMYAK MESHRAM',
            role: 'Videographer',
            description:
                'Samyak is a talented member of the SAN Photography team, contributing creativity and expertise to every project. He specializes in cinematography and works closely with clients to ensure every important moment is captured beautifully.',
            image:
                findTeamImage('SAMAYK MESHRAM') ||
                findTeamImage('SAMYAK MESHRAM') ||
                '',
        },
        {
            id: 'team-06',
            number: '06',
            name: 'SARANG KANHERKAR',
            role: 'Photographer',
            description:
                'Sarang is a talented traditional photographer who specializes in capturing weddings, ceremonies, celebrations, and meaningful moments. With a keen eye for detail, he beautifully documents every important tradition and emotion, creating timeless memories for every client.',
            image:
                findTeamImage('SARANG KANERKAR') ||
                findTeamImage('SARANG KANHERKAR') ||
                '',
        },
        {
            id: 'team-07',
            number: '07',
            name: 'GURUSH MOHARKAR',
            role: 'Photographer',
            description:
                'A skilled traditional photographer and videographer specializing in capturing every important moment with clarity and creativity. With a strong focus on weddings, ceremonies, birthdays, and celebrations, he ensures that every tradition, emotion, and memorable moment is beautifully documented for you to cherish forever.',
            image: findTeamImage('GURUSH MOHARKAR') || '',
        },
    ],

    ctaEyebrow: 'SAN Photography',
    ctaLine1: 'Your story.',
    ctaLine2: 'Our frame.',
    ctaDescription:
        'Every celebration has a story. We are here to preserve yours beautifully.',
    ctaButtonText: 'Start Your Story',
    ctaButtonHref: '/contact',
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const mergeAbout = (saved: Partial<AboutContent> = {}): AboutContent => {
    const base = clone(DEFAULT_ABOUT);

    if (!saved || typeof saved !== 'object') {
        return base;
    }

    return {
        ...base,
        ...saved,

        teamMembers:
            Array.isArray(saved.teamMembers)
                ? saved.teamMembers
                : base.teamMembers,
    };
};

/* =========================================================
   FIELD
========================================================= */

interface FieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    textarea?: boolean;
    rows?: number;
    placeholder?: string;
}

function Field({
    label,
    value,
    onChange,
    textarea = false,
    rows = 4,
    placeholder = '',
}: FieldProps) {
    return (
        <div>
            <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                {label}
            </label>

            {textarea ? (
                <textarea
                    value={value ?? ''}
                    rows={rows}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full resize-y rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3 text-sm leading-6 text-neutral-800 outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
            ) : (
                <input
                    type="text"
                    value={value ?? ''}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3 text-sm text-neutral-800 outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
            )}
        </div>
    );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
    number,
    title,
    description,
    children,
}: { number: number; title: string; description?: string; children: React.ReactNode }) {
    return (
        <section className="mb-7 overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm">
            <div className="border-b border-black/[0.07] bg-[#fbfaf7] px-5 py-6 sm:px-8">
                <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-[10px] text-white">
                        {String(number).padStart(2, '0')}
                    </div>

                    <div>
                        <p className="text-[9px] uppercase tracking-[0.35em] text-[#a18764]">
                            SECTION {String(number).padStart(2, '0')}
                        </p>

                        <h2 className="mt-1 text-2xl font-light text-neutral-900">
                            {title}
                        </h2>

                        {description && (
                            <p className="mt-2 text-xs leading-5 text-neutral-500">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-5 sm:p-8">
                {children}
            </div>
        </section>
    );
}

/* =========================================================
   IMAGE UPLOADER
========================================================= */

function ImageUploader({
    label,
    value,
    onChange,
    alt,
}: { label: string; value: string; onChange: (value: string) => void; alt?: string }) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    const upload = async (file: File | undefined) => {
        if (!file?.type?.startsWith('image/')) {
            setError('Please select a valid image.');
            return;
        }

        if (
            !CLOUDINARY_CLOUD_NAME ||
            !CLOUDINARY_UPLOAD_PRESET
        ) {
            setError(
                'Cloudinary configuration is missing.'
            );
            return;
        }

        try {
            setUploading(true);
            setError('');
            setProgress(5);

            const result = await uploadToCloudinary(
                file,
                'san-photography/about',
                (percent) => setProgress(percent)
            );

            if (!result?.url) {
                throw new Error(
                    'Cloudinary did not return an image URL.'
                );
            }

            onChange(result.url);
            setProgress(100);
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Image upload failed.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
                {label}
            </label>

            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f3f0e9]">
                {value ? (
                    <img
                        src={value}
                        alt={alt || 'About image'}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                        No image
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                        <p className="text-[10px] uppercase tracking-[0.2em]">
                            Uploading {progress}%
                        </p>

                        <div className="mt-4 h-1 w-48 overflow-hidden rounded bg-white/20">
                            <div
                                className="h-full bg-white"
                                style={{
                                    width: `${progress}%`,
                                }}
                            />
                        </div>
                    </div>
                )}

                {!uploading && (
                    <button
                        type="button"
                        onClick={() =>
                            inputRef.current?.click()
                        }
                        className="absolute bottom-4 right-4 rounded-xl bg-black px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white"
                    >
                        {value
                            ? 'Replace Image'
                            : 'Upload Image'}
                    </button>
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

            <Field
                label="Image URL / Cloudinary URL"
                value={value}
                onChange={onChange}
                placeholder="Paste image URL"
            />

            {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}

/* =========================================================
   MAIN
========================================================= */

const AboutPageManagement = () => {
    const [about, setAbout] = useState<AboutContent>(clone(DEFAULT_ABOUT));

    const [original, setOriginal] = useState<AboutContent>(clone(DEFAULT_ABOUT));

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [draggedIndex, setDraggedIndex] =
        useState<number | null>(null);

    const hasChanges = useMemo(
        () =>
            JSON.stringify(about) !==
            JSON.stringify(original),
        [about, original]
    );

    /* =====================================================
       LOAD
    ===================================================== */

    const loadAbout = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            setMessage('');

            const response = await fetch(
                `${API_BASE_URL}/api/about.php`
            );

            const data = await response.json();

            if (!response.ok || !data?.success) {
                throw new Error(
                    data?.message ||
                        'Failed to load About content.'
                );
            }

            const savedAbout =
                data?.content?.about;

            const merged =
                mergeAbout(savedAbout);

            setAbout(merged);
            setOriginal(clone(merged));
        } catch (err: unknown) {
            console.error(
                'About load error:',
                err
            );

            setError(
                err instanceof Error ? err.message : 'Failed to load About content.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAbout();
    }, [loadAbout]);

    /* =====================================================
       GENERAL FIELD UPDATE
    ===================================================== */

    const updateField = (field: keyof AboutContent, value: string) => {
        setAbout((prev) => ({
            ...prev,
            [field]: value,
        }));

        setMessage('');
    };

    /* =====================================================
       TEAM UPDATE
    ===================================================== */

    const updateTeamMember = (
        index: number,
        field: keyof TeamMember,
        value: string
    ) => {
        setAbout((prev) => {
            const members = [...prev.teamMembers];

            members[index] = {
                ...members[index],
                [field]: value,
            };

            return {
                ...prev,
                teamMembers: members,
            };
        });

        setMessage('');
    };

    /* =====================================================
       ADD TEAM
    ===================================================== */

    const addTeamMember = () => {
        setAbout((prev) => {
            const count =
                prev.teamMembers.length + 1;

            return {
                ...prev,
                teamMembers: [
                    ...prev.teamMembers,
                    {
                        id: `team-${Date.now()}`,
                        number: String(count).padStart(
                            2,
                            '0'
                        ),
                        name: 'NEW MEMBER',
                        role: 'Photographer',
                        description: '',
                        image: '',
                    },
                ],
            };
        });
    };

    /* =====================================================
       REMOVE TEAM
    ===================================================== */

    const removeTeamMember = (index: number) => {
        if (
            !window.confirm(
                'Remove this team member?'
            )
        ) {
            return;
        }

        setAbout((prev) => ({
            ...prev,
            teamMembers:
                prev.teamMembers.filter(
                    (_, i) => i !== index
                ),
        }));
    };

    /* =====================================================
       MOVE TEAM
    ===================================================== */

    const moveTeam = (index: number, direction: number) => {
        setAbout((prev) => {
            const members = [
                ...prev.teamMembers,
            ];

            const target =
                index + direction;

            if (
                target < 0 ||
                target >= members.length
            ) {
                return prev;
            }

            [
                members[index],
                members[target],
            ] = [
                members[target],
                members[index],
            ];

            return {
                ...prev,
                teamMembers: members,
            };
        });
    };

    /* =====================================================
       DRAG DROP
    ===================================================== */

    const dropTeam = (targetIndex: number | null) => {
        if (
            draggedIndex === null ||
            draggedIndex === targetIndex ||
            targetIndex === null
        ) {
            setDraggedIndex(null);
            return;
        }

        setAbout((prev) => {
            const members = [
                ...prev.teamMembers,
            ];

            const [moved] =
                members.splice(
                    draggedIndex,
                    1
                );

            members.splice(
                targetIndex,
                0,
                moved
            );

            return {
                ...prev,
                teamMembers: members,
            };
        });

        setDraggedIndex(null);
    };

    /* =====================================================
       SAVE
    ===================================================== */

    const handleSave = async () => {
        if (!hasChanges) {
            setMessage(
                'No changes to save.'
            );
            return;
        }

        try {
            setSaving(true);
            setError('');
            setMessage('');

            const token =
                localStorage.getItem(
                    'adminToken'
                );

            if (!token) {
                throw new Error(
                    'Admin session not found. Please login again.'
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/api/about.php`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        content: {
                            about,
                        },
                    }),
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data?.success
            ) {
                throw new Error(
                    data?.message ||
                        'Failed to save About content.'
                );
            }

            const saved =
                mergeAbout(
                    data?.content?.about ||
                        about
                );

            setAbout(saved);
            setOriginal(clone(saved));

            setMessage(
                'About page saved successfully.'
            );

            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        } catch (err: unknown) {
            console.error(
                'About save error:',
                err
            );

            setError(
                err instanceof Error ? err.message : 'Failed to save About content.'
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       RESET
    ===================================================== */

    const handleReset = () => {
        if (!hasChanges) return;

        if (
            !window.confirm(
                'Discard all unsaved changes?'
            )
        ) {
            return;
        }

        setAbout(clone(original));
        setMessage('');
        setError('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="min-h-[70vh] bg-[#f6f2ea] p-8">
                <div className="mx-auto max-w-[1200px] animate-pulse space-y-5">
                    <div className="h-4 w-32 rounded bg-neutral-200" />
                    <div className="h-12 w-80 rounded bg-neutral-200" />
                    <div className="h-5 w-96 rounded bg-neutral-200" />
                    <div className="h-96 rounded-2xl bg-neutral-200" />
                </div>
            </div>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="min-h-screen bg-[#f6f2ea] pb-28">
            {/* HEADER */}

            <header className="border-b border-neutral-200 bg-[#fbfaf7]">
                <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[9px] uppercase tracking-[0.4em] text-[#a18764]">
                                ABOUT PAGE
                            </p>

                            <h1 className="mt-2 text-4xl font-light tracking-[-0.05em] text-neutral-900 sm:text-5xl">
                                About Page Management
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
                                Manage every editable
                                content item of the
                                public About page in
                                the exact same order.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            {hasChanges && (
                                <button
                                    type="button"
                                    onClick={
                                        handleReset
                                    }
                                    disabled={saving}
                                    className="rounded-xl border border-neutral-300 bg-white px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.18em]"
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
                                className={`rounded-xl px-7 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white ${
                                    saving ||
                                    !hasChanges
                                        ? 'bg-neutral-400'
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

            <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
                {/* MESSAGES */}

                {message && (
                    <div className="mb-7 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-xs text-green-700">
                        ✓ {message}
                    </div>
                )}

                {error && (
                    <div className="mb-7 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-xs text-red-700">
                        {error}
                    </div>
                )}

                {/* =================================================
                    01 TEAM
                ================================================= */}

                <SectionCard
                    number={1}
                    title="Creative Team"
                    description="This is the first section rendered on the public About page. Manage the section heading and every team member."
                >
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field
                            label="Section Eyebrow"
                            value={
                                about.teamEyebrow
                            }
                            onChange={(value) =>
                                updateField(
                                    'teamEyebrow',
                                    value
                                )
                            }
                        />

                        <Field
                            label="Heading Normal"
                            value={
                                about.teamHeadingNormal
                            }
                            onChange={(value) =>
                                updateField(
                                    'teamHeadingNormal',
                                    value
                                )
                            }
                        />

                        <Field
                            label="Heading Italic"
                            value={
                                about.teamHeadingItalic
                            }
                            onChange={(value) =>
                                updateField(
                                    'teamHeadingItalic',
                                    value
                                )
                            }
                        />
                    </div>

                    <div className="my-8 border-t border-neutral-200" />

                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900">
                                Team Members (
                                {
                                    about
                                        .teamMembers
                                        .length
                                }
                                )
                            </h3>

                            <p className="mt-1 text-xs text-neutral-500">
                                Edit, upload, remove
                                or reorder members.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                addTeamMember
                            }
                            className="rounded-xl bg-black px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white"
                        >
                            + Add Member
                        </button>
                    </div>

                    <div className="space-y-6">
                        {about.teamMembers.map(
                            (member, index) => (
                                <div
                                    key={
                                        member.id ||
                                        index
                                    }
                                    draggable
                                    onDragStart={() =>
                                        setDraggedIndex(
                                            index
                                        )
                                    }
                                    onDragOver={(
                                        e
                                    ) =>
                                        e.preventDefault()
                                    }
                                    onDrop={() =>
                                        dropTeam(
                                            index
                                        )
                                    }
                                    className="rounded-2xl border border-neutral-200 bg-[#fbfaf7] p-5 sm:p-7"
                                >
                                    {/* CARD HEADER */}

                                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="rounded bg-black px-3 py-1 text-[9px] font-mono text-white">
                                                #
                                                {member.number ||
                                                    String(
                                                        index +
                                                            1
                                                    ).padStart(
                                                        2,
                                                        '0'
                                                    )}
                                            </span>

                                            <span className="text-sm font-semibold">
                                                {member.name ||
                                                    'Unnamed'}
                                            </span>

                                            <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-400">
                                                Drag to
                                                reorder
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeTeamMember(
                                                    index
                                                )
                                            }
                                            className="rounded-lg px-3 py-2 text-[9px] uppercase tracking-[0.18em] text-red-500 hover:bg-red-50"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid gap-7 lg:grid-cols-[240px_1fr]">
                                        {/* IMAGE */}

                                        <ImageUploader
                                            label="Team Photo"
                                            value={
                                                member.image
                                            }
                                            onChange={(
                                                value
                                            ) =>
                                                updateTeamMember(
                                                    index,
                                                    'image',
                                                    value
                                                )
                                            }
                                            alt={
                                                member.name
                                            }
                                        />

                                        {/* TEXT */}

                                        <div className="space-y-5">
                                            <div className="grid gap-5 sm:grid-cols-3">
                                                <Field
                                                    label="Member Number"
                                                    value={
                                                        member.number
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        updateTeamMember(
                                                            index,
                                                            'number',
                                                            value
                                                        )
                                                    }
                                                />

                                                <Field
                                                    label="Full Name"
                                                    value={
                                                        member.name
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        updateTeamMember(
                                                            index,
                                                            'name',
                                                            value
                                                        )
                                                    }
                                                />

                                                <Field
                                                    label="Role"
                                                    value={
                                                        member.role
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        updateTeamMember(
                                                            index,
                                                            'role',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>

                                            <Field
                                                label="Description"
                                                value={
                                                    member.description
                                                }
                                                textarea
                                                rows={6}
                                                onChange={(
                                                    value
                                                ) =>
                                                    updateTeamMember(
                                                        index,
                                                        'description',
                                                        value
                                                    )
                                                }
                                            />

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        index ===
                                                        0
                                                    }
                                                    onClick={() =>
                                                        moveTeam(
                                                            index,
                                                            -1
                                                        )
                                                    }
                                                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[9px] uppercase tracking-[0.18em] disabled:opacity-30"
                                                >
                                                    ↑ Move
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        index ===
                                                        about
                                                            .teamMembers
                                                            .length -
                                                            1
                                                    }
                                                    onClick={() =>
                                                        moveTeam(
                                                            index,
                                                            1
                                                        )
                                                    }
                                                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[9px] uppercase tracking-[0.18em] disabled:opacity-30"
                                                >
                                                    ↓ Move
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={
                            addTeamMember
                        }
                        className="mt-6 w-full rounded-2xl border border-dashed border-neutral-300 py-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 hover:border-black hover:text-black"
                    >
                        + Add Another Team Member
                    </button>
                </SectionCard>

                {/* =================================================
                    02 HERO
                ================================================= */}

                <SectionCard
                    number={2}
                    title="Hero"
                    description="This section appears after the Creative Team on the public About page."
                >
                    <div className="space-y-5">
                        <Field
                            label="Hero Eyebrow"
                            value={
                                about.heroEyebrow
                            }
                            onChange={(value) =>
                                updateField(
                                    'heroEyebrow',
                                    value
                                )
                            }
                        />

                        <div className="grid gap-5 md:grid-cols-3">
                            <Field
                                label="Heading Line 1"
                                value={
                                    about.heroLine1
                                }
                                onChange={(value) =>
                                    updateField(
                                        'heroLine1',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Heading Line 2 — Italic"
                                value={
                                    about.heroLine2
                                }
                                onChange={(value) =>
                                    updateField(
                                        'heroLine2',
                                        value
                                    )
                                }
                            />

                            <Field
                                label="Heading Line 3"
                                value={
                                    about.heroLine3
                                }
                                onChange={(value) =>
                                    updateField(
                                        'heroLine3',
                                        value
                                    )
                                }
                            />
                        </div>

                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                                Preview
                            </p>

                            <div className="mt-4 text-center">
                                <p className="text-[9px] uppercase tracking-[0.4em] text-[#9b7740]">
                                    {
                                        about.heroEyebrow
                                    }
                                </p>

                                <p className="mt-3 text-3xl font-light text-neutral-800">
                                    {
                                        about.heroLine1
                                    }
                                    <br />
                                    <em>
                                        {
                                            about.heroLine2
                                        }
                                    </em>
                                    <br />
                                    {
                                        about.heroLine3
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* =================================================
                    03 INTRO
                ================================================= */}

                <SectionCard
                    number={3}
                    title="Introduction"
                    description="The paragraph displayed directly below the Hero heading."
                >
                    <Field
                        label="Introduction Paragraph"
                        value={
                            about.introText
                        }
                        textarea
                        rows={7}
                        onChange={(value) =>
                            updateField(
                                'introText',
                                value
                            )
                        }
                    />

                    <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                            Live Preview
                        </p>

                        <p className="mt-3 text-sm leading-7 text-[#555]">
                            {
                                about.introText
                            }
                        </p>
                    </div>
                </SectionCard>

                {/* SAVE */}

                <div className="sticky bottom-5 z-30 flex justify-end">
                    <button
                        type="button"
                        onClick={
                            handleSave
                        }
                        disabled={
                            saving ||
                            !hasChanges
                        }
                        className={`rounded-xl px-8 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-white shadow-xl ${
                            saving ||
                            !hasChanges
                                ? 'bg-neutral-400'
                                : 'bg-black hover:bg-neutral-800'
                        }`}
                    >
                        {saving
                            ? 'Saving Changes...'
                            : hasChanges
                            ? 'Save All About Changes'
                            : 'Saved'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AboutPageManagement;