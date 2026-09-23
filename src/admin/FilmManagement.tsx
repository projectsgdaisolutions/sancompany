import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { uploadToCloudinary } from "../services/cloudinary";
import {
    FILM_CATEGORY_DEFINITIONS,
    normalizeFilmCategory,
} from "../types";
import type { FilmCategory, FilmItem, FilmsContent } from "../types";
import {
    GripVertical,
    Upload,
    Trash2,
    ChevronUp,
    ChevronDown,
    Plus,
    X,
    RotateCcw,
    Save,
    Video,
    Play,
    Eye,
    EyeOff,
} from "lucide-react";
import { API_URL } from "../services/api";

/* =========================================================
   API
========================================================= */

const API_BASE_URL = API_URL;

const FILM_CATEGORIES: FilmCategory[] = [
    ...FILM_CATEGORY_DEFINITIONS.map((category) => category.label),
];
const FILM_CATEGORY_SET = new Set<string>(FILM_CATEGORIES);

const MAX_FILMS = 16;
const FILM_CATEGORY_LIMITS: Record<FilmCategory, number> = {
    "Recent Cinema": 4,
    "Wedding Films": 8,
    "Cinematic Stories": 4,
};

const isPopulatedFilm = (film: FilmItem) =>
    typeof film?.videoUrl === "string" &&
    film.videoUrl.trim().length > 0;

const isFilmInCategory = (film: FilmItem, category: FilmCategory) =>
    normalizeFilmCategory(film.category) === normalizeFilmCategory(category);

const canonicalFilmCategory = (value: unknown): FilmCategory | null => {
    const categoryId = normalizeFilmCategory(value);
    return FILM_CATEGORY_DEFINITIONS.find((category) => category.id === categoryId)?.label ?? null;
};

/* =========================================================
   DEFAULT CONTENT

   Films are managed by PHP/MySQL.
   No local/demo films are seeded here.
   Hero Video is separate from the 16-film limit.
========================================================= */

const DEFAULT_FILMS: FilmsContent = {
    heroVideoText: "Inspired by Cinema.",
    heroVideoUrl: "",
    items: [],
    statementEyebrow: "SAN PHOTOGRAPHY",
    statementHeading:
        "Every love story deserves to be felt again.",
    statementText:
        "We craft cinematic wedding films with a focus on emotion, atmosphere and authentic moments.",
};

/* =========================================================
   DESIGN
========================================================= */

const FONT_DISPLAY =
    "'Cormorant Garamond', Georgia, serif";

const FONT_BODY =
    "'Plus Jakarta Sans', sans-serif";

/* =========================================================
   EMPTY FILM
========================================================= */

const createNewFilm = (index: number, category: FilmCategory): FilmItem => ({
    id: `film-${crypto?.randomUUID?.() || `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`}`,
    videoUrl: "",
    title: "New Film",
    category,
    location: "",
    date: "",
    isActive: true,
    order: index,
});

/* =========================================================
   COMPONENT
========================================================= */

const FilmManagement = () => {
    const [films, setFilms] = useState<FilmsContent>(DEFAULT_FILMS);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [uploadingByFilmId, setUploadingByFilmId] = useState<Record<string, boolean>>({});
    const [uploadProgressByFilmId, setUploadProgressByFilmId] = useState<Record<string, number>>({});
    const [uploadFileNameByFilmId, setUploadFileNameByFilmId] = useState<Record<string, string>>({});
    const [uploadErrorByFilmId, setUploadErrorByFilmId] = useState<Record<string, string>>({});
    const uploadStateRef = useRef<Record<string, symbol>>({});

    const [draggedIndex, setDraggedIndex] =
        useState<number | null>(null);

    const [activeFilter, setActiveFilter] =
        useState<FilmCategory | "All">("All");
    const [categoryPickerOpen, setCategoryPickerOpen] =
        useState(false);

    const heroInputRef = useRef<HTMLInputElement | null>(null);

    /* =======================================================
       AUTH
    ======================================================= */

    const getAuthHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken") || ""
            }`,
    });

    /* =======================================================
       LOAD CONTENT
    ======================================================= */

    const loadContent = useCallback(async () => {
        const controller = new AbortController();

        const timeoutId = window.setTimeout(() => {
            controller.abort();
        }, 20000);

        try {
            setLoading(true);
            setError("");
            setMessage("");

            const response = await fetch(
                `${API_BASE_URL}/api/content.php`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                    signal: controller.signal,
                    cache: "no-store",
                }
            );

            const rawText = await response.text();

            let data = null;

            try {
                data = rawText ? JSON.parse(rawText) : null;
            } catch {
                throw new Error(
                    "Server returned an invalid response. Please check the PHP API."
                );
            }

            if (!response.ok || !data?.success) {
                throw new Error(
                    data?.message ||
                    `Unable to load website content (${response.status}).`
                );
            }

            const savedFilms = data?.content?.films;

            /*
             * If PHP/MySQL contains items: [], preserve [].
             * Never replace an existing empty database with demo films.
             */
            if (
                savedFilms &&
                typeof savedFilms === "object"
            ) {
                const loadedItems = Array.isArray(savedFilms.items)
                    ? savedFilms.items
                    : [];

                setFilms({
                    ...DEFAULT_FILMS,
                    ...savedFilms,
                    items: loadedItems,
                });

                const invalidFilm = loadedItems.find(
                    (film: FilmItem) => isPopulatedFilm(film) && !normalizeFilmCategory(film.category)
                );
                if (invalidFilm) {
                    setError(
                        `Film "${invalidFilm.title || "Untitled Film"}" has an invalid category. Choose a valid category before saving.`
                    );
                }
            } else {
                setFilms({
                    ...DEFAULT_FILMS,
                    items: [],
                });
            }
        } catch (err: unknown) {
            console.error("Failed to load films:", err);

            if (err instanceof Error && err.name === "AbortError") {
                setError(
                    "Loading films timed out. Please make sure the PHP server is running on port 8000."
                );
            } else {
                setError(
                    err instanceof Error ? err.message : "Failed to load films."
                );
            }
        } finally {
            window.clearTimeout(timeoutId);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContent();
    }, [loadContent]);


    /* =======================================================
       STATUS TOAST AUTO-HIDE
    ======================================================= */

    useEffect(() => {
        if (!message && !error) {
            return;
        }

        const timer = window.setTimeout(() => {
            setMessage("");
            setError("");
        }, 5000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [message, error]);

    /* =======================================================
       UPDATE FIELD
    ======================================================= */

    const updateField = (field: keyof FilmsContent, value: string) => {
        setFilms((previous) => ({
            ...previous,
            [field]: value,
        }));

        setMessage("");
        setError("");
    };

    /* =======================================================
       UPDATE FILM
    ======================================================= */

    const updateFilm = (
        index: number,
        field: keyof FilmItem,
        value: string
    ) => {
        if (field === "category") {
            const currentCategory = films.items[index]?.category;
            const categoryCount = films.items.filter(
                (film) => normalizeFilmCategory(film.category) === normalizeFilmCategory(value)
            ).length;
            const categoryLimit = FILM_CATEGORY_LIMITS[value as FilmCategory];

            if (
                value !== currentCategory &&
                categoryCount >= categoryLimit
            ) {
                setError(
                    `${value} is full (${categoryCount}/${categoryLimit}). Delete or move a film before using this category.`
                );
                return;
            }
        }

        setFilms((previous) => {
            const items = [...previous.items];

            items[index] = {
                ...items[index],
                [field]: value,
            };

            return {
                ...previous,
                items,
            };
        });

        setMessage("");
        setError("");
    };

    /* =======================================================
       ADD FILM
    ======================================================= */

    const addFilm = (category: FilmCategory | "All" = activeFilter) => {
        if (category === "All") {
            setCategoryPickerOpen(true);
            return;
        }

        const actualFilmCount = films.items.filter(isPopulatedFilm).length;

        if (actualFilmCount >= MAX_FILMS) {
            setError(
                `Maximum ${MAX_FILMS} films are allowed. Please remove an existing film before adding a new one.`
            );
            setMessage("");
            return;
        }

        const categoryCount = films.items.filter((film) => isFilmInCategory(film, category)).length;

        if (categoryCount >= FILM_CATEGORY_LIMITS[category]) {
            setError(
                `Maximum ${FILM_CATEGORY_LIMITS[category]} videos allowed`
            );
            return;
        }

        setFilms((previous) => {
            const newFilm = {
                ...createNewFilm(previous.items.length, category),
                isDraft: true,
            };

            return {
                ...previous,
                items: [...previous.items, newFilm],
            };
        });

            setCategoryPickerOpen(false);
        setMessage("");
        setError("");
    };

    /* =======================================================
       DELETE FILM
    ======================================================= */

    const deleteFilm = (index: number) => {
        const confirmed = window.confirm(
            "Are you sure you want to remove this film?"
        );

        if (!confirmed) return;

        setFilms((previous) => ({
            ...previous,
            items: previous.items
                .filter(
                    (_, itemIndex) =>
                        itemIndex !== index
                )
                .map((item, itemIndex) => ({
                    ...item,
                    order: itemIndex,
                })),
        }));

        setMessage("");
    };

    /* =======================================================
       MOVE FILM
    ======================================================= */

    const moveFilm = (
        index: number,
        direction: "up" | "down"
    ) => {
        setFilms((previous) => {
            const items = [...previous.items];

            const newIndex =
                direction === "up"
                    ? index - 1
                    : index + 1;

            if (
                newIndex < 0 ||
                newIndex >= items.length
            ) {
                return previous;
            }

            [
                items[index],
                items[newIndex],
            ] = [
                    items[newIndex],
                    items[index],
                ];

            return {
                ...previous,
                items: items.map(
                    (item, itemIndex) => ({
                        ...item,
                        order: itemIndex,
                    })
                ),
            };
        });

        setMessage("");
    };

    /* =======================================================
       DRAG START
    ======================================================= */

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    /* =======================================================
       DROP
    ======================================================= */

    const handleDrop = (targetIndex: number) => {
        if (
            draggedIndex === null ||
            draggedIndex === targetIndex
        ) {
            setDraggedIndex(null);
            return;
        }

        setFilms((previous) => {
            const items = [...previous.items];

            const [movedItem] =
                items.splice(
                    draggedIndex,
                    1
                );

            items.splice(
                targetIndex,
                0,
                movedItem
            );

            return {
                ...previous,
                items: items.map(
                    (item, index) => ({
                        ...item,
                        order: index,
                    })
                ),
            };
        });

        setDraggedIndex(null);
        setMessage("");
    };

    /* =======================================================
       UPLOAD FILM VIDEO
    ======================================================= */

    const handleVideoUpload = async (file: File | undefined, index: number) => {
        if (!file) return;

        const film = films.items[index];
        if (!film || uploadStateRef.current[film.id]) return;

        if (!file.type.startsWith("video/")) {
            setUploadErrorByFilmId((previous) => ({ ...previous, [film.id]: "Please select a valid video file." }));
            return;
        }

        const uploadToken = Symbol(film.id);
        const filmId = film.id;
        uploadStateRef.current[filmId] = uploadToken;
        setUploadingByFilmId((previous) => ({ ...previous, [filmId]: true }));
        setUploadProgressByFilmId((previous) => ({ ...previous, [filmId]: 0 }));
        setUploadFileNameByFilmId((previous) => ({ ...previous, [filmId]: file.name }));
        setUploadErrorByFilmId((previous) => ({ ...previous, [filmId]: "" }));

        try {
            setMessage("");

            const result =
                await uploadToCloudinary(
                    file,
                    "san-photography/films",
                    (progress) => {
                        if (uploadStateRef.current[filmId] === uploadToken) {
                            setUploadProgressByFilmId((previous) => ({ ...previous, [filmId]: progress }));
                        }
                    }
                );

            if (uploadStateRef.current[filmId] !== uploadToken) return;

            setFilms((previous) => ({
                ...previous,
                items: previous.items.map((item) =>
                    item.id === filmId ? { ...item, videoUrl: result.url } : item
                ),
            }));
            setUploadProgressByFilmId((previous) => ({ ...previous, [filmId]: 100 }));

            setMessage(
                "Video uploaded successfully. Save changes to publish it."
            );
        } catch (err: unknown) {
            console.error(
                "Film upload error:",
                err
            );

            if (uploadStateRef.current[filmId] === uploadToken) {
                setUploadErrorByFilmId((previous) => ({
                    ...previous,
                    [filmId]: err instanceof Error ? err.message : "Video upload failed.",
                }));
            }
        } finally {
            if (uploadStateRef.current[filmId] === uploadToken) {
                window.setTimeout(() => {
                    if (uploadStateRef.current[filmId] !== uploadToken) return;
                    delete uploadStateRef.current[filmId];
                    setUploadingByFilmId((previous) => ({ ...previous, [filmId]: false }));
                    setUploadProgressByFilmId((previous) => {
                        const next = { ...previous };
                        delete next[filmId];
                        return next;
                    });
                    setUploadFileNameByFilmId((previous) => {
                        const next = { ...previous };
                        delete next[filmId];
                        return next;
                    });
                }, 800);
            }
        }
    };

    /* =======================================================
       UPLOAD HERO VIDEO
    ======================================================= */

    const handleHeroVideoUpload = async (file: File | undefined) => {
        if (!file) return;

        const uploadKey = "hero";
        if (uploadStateRef.current[uploadKey]) return;

        if (!file.type.startsWith("video/")) {
            setError(
                "Please select a valid video file."
            );
            return;
        }

        const uploadToken = Symbol(uploadKey);
        uploadStateRef.current[uploadKey] = uploadToken;
        setUploadingByFilmId((previous) => ({ ...previous, [uploadKey]: true }));
        setUploadProgressByFilmId((previous) => ({ ...previous, [uploadKey]: 0 }));
        setUploadFileNameByFilmId((previous) => ({ ...previous, [uploadKey]: file.name }));

        try {
            setError("");
            setMessage("");

            const result =
                await uploadToCloudinary(
                    file,
                    "san-photography/films/hero",
                    (progress) => {
                        if (uploadStateRef.current[uploadKey] === uploadToken) {
                            setUploadProgressByFilmId((previous) => ({ ...previous, [uploadKey]: progress }));
                        }
                    }
                );

            if (uploadStateRef.current[uploadKey] !== uploadToken) return;

            updateField(
                "heroVideoUrl",
                result.url
            );

            setUploadProgressByFilmId((previous) => ({ ...previous, [uploadKey]: 100 }));
            setMessage(
                "Hero video uploaded successfully. Save changes to publish it."
            );
        } catch (err: unknown) {
            console.error(
                "Hero video upload error:",
                err
            );

            setError(
                err instanceof Error ? err.message : "Hero video upload failed."
            );
        } finally {
            if (uploadStateRef.current[uploadKey] === uploadToken) {
                window.setTimeout(() => {
                    if (uploadStateRef.current[uploadKey] !== uploadToken) return;
                    delete uploadStateRef.current[uploadKey];
                    setUploadingByFilmId((previous) => ({ ...previous, [uploadKey]: false }));
                    setUploadProgressByFilmId((previous) => {
                        const next = { ...previous };
                        delete next[uploadKey];
                        return next;
                    });
                    setUploadFileNameByFilmId((previous) => {
                        const next = { ...previous };
                        delete next[uploadKey];
                        return next;
                    });
                }, 800);
            }
        }
    };

    /* =======================================================
       REMOVE HERO VIDEO
    ======================================================= */

    const removeHeroVideo = () => {
        setFilms((previous) => ({
            ...previous,
            heroVideoUrl: "",
        }));

        setMessage("");
    };

    /* =======================================================
       REMOVE FILM VIDEO
    ======================================================= */

    const removeFilmVideo = (index: number) => {
        updateFilm(
            index,
            "videoUrl",
            ""
        );
    };

    const toggleFilmVisibility = (index: number) => {
        setFilms((previous) => ({
            ...previous,
            items: previous.items.map((film, itemIndex) =>
                itemIndex === index
                    ? { ...film, isActive: film.isActive === false }
                    : film
            ),
        }));
        setMessage("");
        setError("");
    };

    /* =======================================================
       SAVE
    ======================================================= */

    const saveChanges = async () => {
        try {
            setSaving(true);
            setError("");
            setMessage("");

            const actualFilms = films.items.filter(isPopulatedFilm);

            if (actualFilms.length > MAX_FILMS) {
                throw new Error(
                    `Maximum ${MAX_FILMS} films are allowed.`
                );
            }

            const invalidFilm = actualFilms.find(
                (film) =>
                    !normalizeFilmCategory(film.category)
            );

            if (invalidFilm) {
                throw new Error(
                    `Invalid category "${String(invalidFilm.category)}" for film "${invalidFilm.title || "Untitled Film"}". Please select Recent Cinema, Wedding Films or Cinematic Stories.`
                );
            }

            const categoryCountsForSave = FILM_CATEGORIES.reduce<Record<FilmCategory, number>>(
                (counts, category) => ({
                    ...counts,
                    [category]: actualFilms.filter((film) => isFilmInCategory(film, category)).length,
                }),
                { "Recent Cinema": 0, "Wedding Films": 0, "Cinematic Stories": 0 }
            );
            const overLimitCategory = FILM_CATEGORIES.find(
                (category) =>
                    (categoryCountsForSave[category] || 0) > FILM_CATEGORY_LIMITS[category]
            );
            if (overLimitCategory) {
                throw new Error(
                    `${overLimitCategory} exceeds its maximum of ${FILM_CATEGORY_LIMITS[overLimitCategory]} videos.`
                );
            }

            const normalizedItems = films.items.map((film, index) => {
                const category = canonicalFilmCategory(film.category);

                if (isPopulatedFilm(film) && (!category || !FILM_CATEGORY_SET.has(category))) {
                    throw new Error(
                        `Invalid category "${String(film.category)}" for film "${film.title || "Untitled Film"}".`
                    );
                }

                return {
                    ...film,
                    isDraft: undefined,
                    category: category || "Recent Cinema",
                    order: index,
                };
            });

            const payload = {
                ...films,
                items: normalizedItems,
            };

            const response =
                await fetch(
                    `${API_BASE_URL}/api/content.php`,
                    {
                        method: "PUT",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            content: {
                                films: payload,
                            },
                        }),
                    }
                );

            const rawText = await response.text();

            let data = null;

            try {
                data = rawText ? JSON.parse(rawText) : null;
            } catch {
                throw new Error(
                    "Server returned an invalid response while saving. Please check content.php."
                );
            }

            if (!response.ok || !data?.success) {
                throw new Error(
                    data?.message ||
                    "Failed to save films."
                );
            }

            if (data?.content?.films) {
                setFilms({
                    ...DEFAULT_FILMS,
                    ...data.content.films,

                    items: Array.isArray(
                        data.content.films.items
                    )
                        ? data.content.films.items
                        : [],
                });
            }

            setMessage(
                "Film changes saved successfully."
            );
        } catch (err: unknown) {
            console.error(
                "Save films error:",
                err
            );

            setError(
                err instanceof Error ? err.message : "Failed to save film changes."
            );
        } finally {
            setSaving(false);
        }
    };

    /* =======================================================
       RESET
    ======================================================= */

    const resetChanges = () => {
        const confirmed =
            window.confirm(
                "Reset all unsaved film changes?"
            );

        if (!confirmed) return;

        loadContent();
        setMessage("");
        setError("");
    };

    /* =======================================================
       FILTER CATEGORY INFO
    ======================================================= */

    const categoryCounts = useMemo(() => {
        return FILM_CATEGORIES.reduce(
            (counts, category) => {
                counts[category] = films.items.filter((film) => isFilmInCategory(film, category)).length;

                return counts;
            },
            {} as Record<FilmCategory, number>
        );
    }, [films.items]);

    const actualFilmCount = useMemo(
        () => films.items.filter(isPopulatedFilm).length,
        [films.items]
    );

    const visibleFilms = useMemo(() => {
        if (activeFilter === "All") {
            return films.items.map((film, index) => ({
                film,
                index,
            })).filter(({ film }) => isPopulatedFilm(film) || film.isDraft);
        }

        return films.items.reduce<Array<{ film: FilmItem; index: number }>>((items, film, index) => {
            if (
                isFilmInCategory(film, activeFilter) &&
                (isPopulatedFilm(film) || film.isDraft)
            ) {
                items.push({ film, index });
            }
            return items;
        }, []);
    }, [films.items, activeFilter]);

    const selectedCategoryCount = activeFilter === "All"
        ? actualFilmCount
        : categoryCounts[activeFilter] || 0;
    const selectedCategoryLimit = activeFilter === "All"
        ? MAX_FILMS
        : FILM_CATEGORY_LIMITS[activeFilter];
    const selectedCategoryFull = selectedCategoryCount >= selectedCategoryLimit;

    /* =======================================================
       LOADING
    ======================================================= */

    if (loading) {
        return (
            <div
                className="fixed inset-0 z-[9998] flex min-h-screen items-center justify-center bg-[#f8f6f1]"
                style={{
                    fontFamily: FONT_BODY,
                }}
            >
                <div className="flex flex-col items-center justify-center px-6 text-center">
                    <div className="relative mb-6 h-12 w-12">
                        <div className="absolute inset-0 rounded-full border-2 border-black/10" />
                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#171717]" />
                    </div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#171717]">
                        Loading Films
                    </p>

                    <p className="mt-2 text-xs text-black/40">
                        Fetching the latest film content...
                    </p>
                </div>
            </div>
        );
    }

    /* =======================================================
       RENDER
    ======================================================= */

    return (
        <>
            {/* =================================================
                FULL-WIDTH STATUS NOTIFICATION
            ================================================= */}

            <div
                className={`fixed left-0 right-0 top-0 z-[9999] transition-all duration-300 ${
                    message || error
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-full opacity-0 pointer-events-none"
                }`}
                role={message ? "status" : "alert"}
                aria-live="polite"
            >
                {message ? (
                    <div className="flex min-h-14 w-full items-center justify-center gap-3 bg-emerald-600 px-5 py-3 text-center text-sm font-medium text-white shadow-xl">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                            ✓
                        </span>
                        <span>{message}</span>
                    </div>
                ) : (
                    <div className="flex min-h-14 w-full items-center justify-center gap-3 bg-red-600 px-5 py-3 text-center text-sm font-medium text-white shadow-xl">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                            !
                        </span>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div
                className="space-y-8"
            style={{
                fontFamily: FONT_BODY,
            }}
        >
            {categoryPickerOpen && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 px-5 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[9px] uppercase tracking-[0.25em] text-[#9b7740]">
                                    New Film
                                </p>
                                <h3 className="mt-2 text-2xl font-light" style={{ fontFamily: FONT_DISPLAY }}>
                                    Choose category
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCategoryPickerOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-black/50 hover:bg-black hover:text-white"
                                aria-label="Close category selection"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="mt-5 space-y-2">
                            {FILM_CATEGORIES.map((category) => {
                                const count = categoryCounts[category] || 0;
                                const full = count >= FILM_CATEGORY_LIMITS[category];

                                return (
                                    <button
                                        key={category}
                                        type="button"
                                        disabled={full}
                                        onClick={() => addFilm(category)}
                                        className="flex w-full items-center justify-between rounded-lg border border-black/10 px-4 py-3 text-left text-xs transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <span>{category}</span>
                                        <span className="text-[10px] text-black/45">
                                            {count}/{FILM_CATEGORY_LIMITS[category]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
          PAGE HEADER
      ================================================= */}

            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8 lg:p-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-3 text-[9px] uppercase tracking-[0.4em] text-[#9b7740]">
                            SAN PHOTOGRAPHY · FILMS
                        </p>

                        <h1
                            className="text-4xl font-light tracking-[-0.04em] text-[#171717] sm:text-5xl lg:text-6xl"
                            style={{
                                fontFamily:
                                    FONT_DISPLAY,
                            }}
                        >
                            Film Management
                        </h1>

                        <p className="mt-4 max-w-2xl text-sm leading-6 text-black/50">
                            Manage, edit, replace, remove and
                            reorder the films displayed on the
                            public Films page.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={resetChanges}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:bg-black/[0.03] disabled:opacity-50"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>

                        <button
                            type="button"
                            onClick={saveChanges}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 rounded-full bg-[#171717] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black/85 disabled:opacity-50"
                        >
                            <Save size={14} />

                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>

            {/* =================================================
          STATUS
      ================================================= */}

            {message && (
                <div className="rounded-xl border border-black/10 bg-white px-5 py-4 text-sm text-[#171717] shadow-sm">
                    {message}
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* =================================================
          HERO SECTION
      ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
                <div className="border-b border-black/[0.06] p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[10px] text-white">
                            01
                        </div>

                        <div>
                            <p className="text-[9px] uppercase tracking-[0.35em] text-[#9b7740]">
                                SECTION 01
                            </p>

                            <h2
                                className="mt-1 text-3xl font-light"
                                style={{
                                    fontFamily:
                                        FONT_DISPLAY,
                                }}
                            >
                                Hero Video
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-black/50">
                                Manage the video and heading shown
                                above the Films grid.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* VIDEO */}

                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-[9px] uppercase tracking-[0.25em] text-black/50">
                                Hero Video
                            </label>

                            {films.heroVideoUrl && (
                                <button
                                    type="button"
                                    onClick={removeHeroVideo}
                                    className="text-[9px] uppercase tracking-[0.12em] text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        {films.heroVideoUrl ? (
                            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                                <video
                                    src={
                                        films.heroVideoUrl
                                    }
                                    muted
                                    loop
                                    controls
                                    playsInline
                                    preload="metadata"
                                    className="h-full w-full object-cover"
                                />

                                <div className="absolute left-3 top-3 max-w-[70%] truncate rounded-full bg-black/70 px-3 py-1 text-[8px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                                    Current Video: {films.heroVideoUrl.split('/').pop() || 'Hero Video'}
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            heroInputRef.current?.click()
                                        }
                                        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[9px] font-semibold uppercase tracking-wider text-black"
                                    >
                                        <Upload size={12} />
                                        Replace
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    heroInputRef.current?.click()
                                }
                                className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-dashed border-black/15 bg-[#f8f6f1] text-black/40 transition hover:border-black/30 hover:text-black/60"
                            >
                                <Video size={28} />

                                <span className="mt-3 text-[10px] uppercase tracking-[0.15em]">
                                    Upload Hero Video
                                </span>
                            </button>
                        )}

                        <input
                            ref={heroInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(event) => {
                                const file =
                                    event.target.files?.[0];

                                if (file) {
                                    handleHeroVideoUpload(file);
                                }

                                event.target.value = "";
                            }}
                            disabled={uploadingByFilmId.hero}
                        />

                        {uploadingByFilmId.hero && (
                            <div className="mt-3">
                                <div className="mb-1 flex justify-between text-[9px] text-black/50">
                                    <span>
                                        Uploading {uploadFileNameByFilmId.hero || "video"}...
                                    </span>
                                    <span>
                                        {uploadProgressByFilmId.hero || 0}%
                                    </span>
                                </div>

                                <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
                                    <div
                                        className="h-full bg-[#171717] transition-all"
                                        style={{
                                            width: `${uploadProgressByFilmId.hero || 0}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* HERO TEXT */}

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-[9px] uppercase tracking-[0.2em] text-black/50">
                                Hero Heading
                            </label>

                            <input
                                value={
                                    films.heroVideoText ||
                                    ""
                                }
                                onChange={(e) =>
                                    updateField(
                                        "heroVideoText",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/30"
                                placeholder="Inspired by Cinema."
                            />
                        </div>

                        <div className="rounded-xl bg-[#f8f6f1] p-4 text-xs leading-5 text-black/50">
                            This heading is displayed below
                            the hero video on the public Films
                            page.
                        </div>
                    </div>
                </div>
            </section>

            {/* =================================================
          FILMS
      ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
                <div className="border-b border-black/[0.06] p-6 sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[10px] text-white">
                                02
                            </div>

                            <div>
                                <p className="text-[9px] uppercase tracking-[0.35em] text-[#9b7740]">
                                    SECTION 02
                                </p>

                                <h2
                                    className="mt-1 text-3xl font-light"
                                    style={{
                                        fontFamily:
                                            FONT_DISPLAY,
                                    }}
                                >
                                    Films
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-black/50">
                                    Drag cards to reorder films. Upload,
                                    replace or remove individual videos.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => addFilm()}
                            disabled={selectedCategoryFull}
                            title={
                                selectedCategoryFull
                                    ? activeFilter === "All"
                                        ? `Maximum ${MAX_FILMS} films allowed`
                                        : `Maximum ${FILM_CATEGORY_LIMITS[activeFilter]} videos allowed`
                                    : "Add a new film"
                            }
                            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#171717] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Plus size={14} />
                            Add New Film
                        </button>
                    </div>
                </div>

                <div className="border-b border-black/[0.06] bg-[#f8f6f1] px-6 py-4 sm:px-8">
                    <div className="flex flex-wrap gap-2">
                        {(["All", ...FILM_CATEGORIES] as Array<FilmCategory | "All">).map((filter) => {
                            const count = filter === "All"
                                ? actualFilmCount
                                : categoryCounts[filter] || 0;
                            const limit = filter === "All"
                                ? MAX_FILMS
                                : FILM_CATEGORY_LIMITS[filter];

                            return (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => setActiveFilter(filter)}
                                    className={`rounded-full border px-3 py-1.5 text-[9px] transition ${activeFilter === filter
                                        ? "border-[#171717] bg-[#171717] text-white"
                                        : "border-black/10 bg-white text-black/50 hover:border-black/30"
                                        }`}
                                >
                                    {filter === "All" ? "ALL" : filter}: {count}/{limit}
                                </button>
                            );
                        })}

                        {selectedCategoryFull && (
                            <span className="basis-full text-[9px] uppercase tracking-[0.12em] text-black/40 sm:basis-auto">
                                Maximum {selectedCategoryLimit} videos allowed
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5 lg:grid-cols-3 lg:gap-5 lg:p-6 xl:grid-cols-4">
                    {visibleFilms.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-black/15 bg-[#f8f6f1] px-6 py-16 text-center">
                            <Video
                                size={30}
                                className="mx-auto text-black/25"
                            />

                            <p className="mt-4 text-sm text-black/50">
                                No films available.
                            </p>

                            <button
                                type="button"
                                onClick={() => addFilm()}
                                className="mt-5 rounded-full bg-[#171717] px-5 py-2.5 text-[9px] font-semibold uppercase tracking-wider text-white"
                            >
                                Add First Film
                            </button>
                        </div>
                    ) : (
                        visibleFilms.map(
                            ({ film, index }) => (
                                <article
                                    key={
                                        film.id ||
                                        `film-${index}`
                                    }
                                    draggable
                                    onDragStart={() =>
                                        handleDragStart(index)
                                    }
                                    onDragOver={(e) =>
                                        e.preventDefault()
                                    }
                                    onDrop={() =>
                                        handleDrop(index)
                                    }
                                    className={`min-w-0 rounded-xl border bg-white transition-all ${draggedIndex === index
                                            ? "border-black/30 opacity-50"
                                            : film.isActive === false
                                                ? "border-dashed border-black/20 opacity-60"
                                                : "border-black/10"
                                        }`}
                                >
                                    {/* CARD HEADER */}

                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] px-3 py-2.5 sm:px-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="cursor-grab text-black/25 active:cursor-grabbing"
                                                title="Drag to reorder"
                                            >
                                                <GripVertical
                                                    size={18}
                                                />
                                            </div>

                                            <span className="rounded bg-[#171717] px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-white">
                                                FILM #
                                                {String(
                                                    index + 1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </span>

                                            <span className="text-[9px] text-black/35">
                                                Drag to reorder
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                disabled={
                                                    index === 0
                                                }
                                                onClick={() =>
                                                    moveFilm(
                                                        index,
                                                        "up"
                                                    )
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-black/50 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                                                aria-label="Move up"
                                            >
                                                <ChevronUp
                                                    size={15}
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    index ===
                                                    films.items
                                                        .length -
                                                    1
                                                }
                                                onClick={() =>
                                                    moveFilm(
                                                        index,
                                                        "down"
                                                    )
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-black/50 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                                                aria-label="Move down"
                                            >
                                                <ChevronDown
                                                    size={15}
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleFilmVisibility(index)
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-black/50 transition hover:bg-black hover:text-white"
                                                aria-label={
                                                    film.isActive === false
                                                        ? "Show film"
                                                        : "Hide film"
                                                }
                                                title={
                                                    film.isActive === false
                                                        ? "Show film"
                                                        : "Hide film"
                                                }
                                            >
                                                {film.isActive === false ? (
                                                    <EyeOff size={15} />
                                                ) : (
                                                    <Eye size={15} />
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deleteFilm(
                                                        index
                                                    )
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-400 transition hover:bg-red-500 hover:text-white"
                                                aria-label="Delete film"
                                            >
                                                <Trash2
                                                    size={15}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* CARD BODY */}

                                    <div className="grid min-w-0 gap-4 p-3 sm:p-4 lg:grid-cols-1">
                                        {/* VIDEO */}

                                        <div>
                                            <label className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-black/45">
                                                Film Video
                                            </label>

                                            {film.videoUrl ? (
                                                <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                                                    <video
                                                        src={
                                                            film.videoUrl
                                                        }
                                                        muted
                                                        loop
                                                        playsInline
                                                        controls
                                                        preload="metadata"
                                                        className="h-full w-full object-cover"
                                                    />

                                                    <div className="absolute left-2 top-2 max-w-[70%] truncate rounded-full bg-black/60 px-2.5 py-1 text-[8px] uppercase tracking-wider text-white backdrop-blur">
                                                        <span className="flex items-center gap-1.5 truncate">
                                                            <Play
                                                                size={
                                                                    9
                                                                }
                                                                fill="currentColor"
                                                            />
                                                            {film.videoUrl.split('/').pop() || 'Current Video'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-black/15 bg-[#f8f6f1]">
                                                    <div className="text-center text-black/30">
                                                        <Video
                                                            size={26}
                                                            className="mx-auto"
                                                        />
                                                        <p className="mt-2 text-[9px] uppercase tracking-wider">
                                                            No Video
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-2 flex gap-2">
                                                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#171717] px-3 py-2.5 text-[9px] font-semibold uppercase tracking-wider text-white transition hover:bg-black/85">
                                                    <Upload
                                                        size={12}
                                                    />

                                                    {uploadingByFilmId[film.id]
                                                        ? `${uploadProgressByFilmId[film.id] || 0}%`
                                                        : film.videoUrl
                                                            ? "Replace Video"
                                                            : "Upload Video"}

                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        disabled={uploadingByFilmId[film.id]}
                                                        className="hidden"
                                                        onChange={(
                                                            event
                                                        ) => {
                                                            const file =
                                                                event
                                                                    .target
                                                                    .files?.[0];

                                                            if (
                                                                file
                                                            ) {
                                                                handleVideoUpload(
                                                                    file,
                                                                    index
                                                                );
                                                            }

                                                            event.target.value =
                                                                "";
                                                        }}
                                                    />
                                                </label>

                                                {film.videoUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeFilmVideo(
                                                                index
                                                            )
                                                        }
                                                        className="rounded-lg border border-red-100 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wider text-red-500 transition hover:bg-red-50"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            {uploadingByFilmId[film.id] && (
                                                    <div className="mt-2">
                                                        <div className="mb-1 truncate text-[9px] text-black/50">
                                                            Uploading {uploadFileNameByFilmId[film.id] || "video"}...
                                                        </div>
                                                        <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
                                                            <div
                                                                className="h-full bg-[#171717] transition-all"
                                                                style={{
                                                                    width: `${uploadProgressByFilmId[film.id] || 0}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {uploadErrorByFilmId[film.id] && (
                                                    <p className="mt-2 text-[9px] text-red-500">
                                                        {uploadErrorByFilmId[film.id]}
                                                    </p>
                                                )}

                                            <input
                                                value={
                                                    film.videoUrl ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    updateFilm(
                                                        index,
                                                        "videoUrl",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Or paste video URL"
                                                className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2 text-[11px] outline-none focus:border-black/30"
                                            />
                                        </div>

                                        {/* DETAILS */}

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-black/45">
                                                    Film Title
                                                </label>

                                                <input
                                                    value={
                                                        film.title ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateFilm(
                                                            index,
                                                            "title",
                                                            e.target
                                                                .value
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-black/10 px-3 py-3 text-sm outline-none focus:border-black/30"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-black/45">
                                                    Category
                                                </label>

                                                <div className="rounded-lg border border-black/10 bg-[#f8f6f1] px-3 py-3 text-xs text-black/60">
                                                    {film.category || "Uncategorized"}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-black/45">
                                                    Date
                                                </label>

                                                <input
                                                    value={
                                                        film.date ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateFilm(
                                                            index,
                                                            "date",
                                                            e.target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="12 / 01 / 2026"
                                                    className="w-full rounded-lg border border-black/10 px-3 py-3 text-xs outline-none focus:border-black/30"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-black/45">
                                                    Location
                                                </label>

                                                <input
                                                    value={
                                                        film.location ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateFilm(
                                                            index,
                                                            "location",
                                                            e.target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Mumbai, India"
                                                    className="w-full rounded-lg border border-black/10 px-3 py-3 text-xs outline-none focus:border-black/30"
                                                />
                                            </div>

                                            <div className="sm:col-span-2 rounded-lg bg-[#f8f6f1] p-3 text-[10px] leading-5 text-black/45">
                                                Film order:{" "}
                                                <strong className="text-black/70">
                                                    {index + 1}
                                                </strong>
                                                . Use drag & drop or the
                                                arrow buttons to change its
                                                position.
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            )
                        )
                    )}
                </div>

                {/* ADD NEW FILM - BOTTOM ACTION */}
                <div className="border-t border-black/[0.06] bg-[#f8f6f1] px-6 py-5 sm:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#171717]">
                                {actualFilmCount >= MAX_FILMS
                                    ? `Maximum ${MAX_FILMS} films reached`
                                    : `Add another film (${MAX_FILMS - actualFilmCount} slots remaining)`}
                            </p>
                            <p className="mt-1 text-xs text-black/45">
                                Each category has its own public capacity: Recent 4, Wedding 8, Cinematic 4. Deleting a film frees its category slot.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => addFilm()}
                            disabled={selectedCategoryFull}
                            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#171717] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Plus size={14} />
                            {selectedCategoryFull
                                ? activeFilter === "All"
                                    ? "16 Films Added"
                                    : `${selectedCategoryLimit} Films Added`
                                : "Add New Film"}
                        </button>
                    </div>
                </div>
            </section>

            {/* =================================================
          STATEMENT
      ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
                <div className="border-b border-black/[0.06] p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[10px] text-white">
                            03
                        </div>

                        <div>
                            <p className="text-[9px] uppercase tracking-[0.35em] text-[#9b7740]">
                                SECTION 03
                            </p>

                            <h2
                                className="mt-1 text-3xl font-light"
                                style={{
                                    fontFamily:
                                        FONT_DISPLAY,
                                }}
                            >
                                Cinematic Statement
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-black/50">
                                Edit the text shown below the Films
                                grid.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 p-6 sm:p-8">
                    <div>
                        <label className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-black/45">
                            Eyebrow
                        </label>

                        <input
                            value={
                                films.statementEyebrow ||
                                ""
                            }
                            onChange={(e) =>
                                updateField(
                                    "statementEyebrow",
                                    e.target.value
                                )
                            }
                            className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-black/45">
                            Heading
                        </label>

                        <textarea
                            rows={3}
                            value={
                                films.statementHeading ||
                                ""
                            }
                            onChange={(e) =>
                                updateField(
                                    "statementHeading",
                                    e.target.value
                                )
                            }
                            className="w-full resize-none rounded-lg border border-black/10 px-4 py-3 text-sm leading-6 outline-none focus:border-black/30"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-black/45">
                            Description
                        </label>

                        <textarea
                            rows={4}
                            value={
                                films.statementText ||
                                ""
                            }
                            onChange={(e) =>
                                updateField(
                                    "statementText",
                                    e.target.value
                                )
                            }
                            className="w-full resize-none rounded-lg border border-black/10 px-4 py-3 text-sm leading-6 outline-none focus:border-black/30"
                        />
                    </div>
                </div>
            </section>

            {/* =================================================
          FLOATING SAVE
          Always visible while scrolling
      ================================================= */}

            <div className="fixed right-4 top-20 z-[60] sm:right-6 sm:top-24">
                <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl">
                    <span className="hidden px-3 text-[9px] font-medium uppercase tracking-[0.12em] text-black/45 md:block">
                        {actualFilmCount} / {MAX_FILMS} films
                    </span>

                    <button
                        type="button"
                        onClick={saveChanges}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-full bg-[#171717] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-3"
                        title="Save all film changes"
                    >
                        <Save size={13} />

                        <span className="hidden sm:inline">
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </span>

                        <span className="sm:hidden">
                            {saving
                                ? "..."
                                : "Save"}
                        </span>
                    </button>
                </div>
            </div>
            </div>
        </>
    );
};

export default FilmManagement;