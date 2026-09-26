import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize2,
  X,
} from "lucide-react";
import { API_URL, readApiJson } from "../services/api";
import {
  FILM_CATEGORY_DEFINITIONS,
  normalizeFilmCategory,
} from "../types";

interface FilmItem {
  id?: string | number;
  category: string;
  title: string;
  location?: string;
  date?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  description?: string;
  order?: number;
}

interface FilmsContent {
  heroVideoUrl: string;
  heroVideoText: string;
  items: FilmItem[];
  statementEyebrow: string;
  statementHeading: string;
  statementText: string;
}

type FilmCategory = "All" | "Recent Cinema" | "Wedding Films" | "Pre Wedding Stories" | "Reels";

/* =========================================================
   API
========================================================= */

const API_BASE_URL = API_URL;

/* =========================================================
   DEFAULT CONTENT

   Films are loaded from PHP/MySQL.
   No local/demo films are used as a fallback.
   Hero Video is independent from the 16-film limit.
========================================================= */

const DEFAULT_FILMS: FilmsContent = {
  heroVideoUrl: "",
  heroVideoText: "Inspired by Cinema.",
  items: [],
  statementEyebrow: "SAN PHOTOGRAPHY",
  statementHeading:
    "Every love story deserves to be felt again.",
  statementText:
    "We craft cinematic wedding films with a focus on emotion, atmosphere and authentic moments.",
};

/* =========================================================
   DESIGN TOKENS (Clean White Theme)
========================================================= */

const COLOR = {
  paper: "#FFFFFF",         // Pure white background
  paperSoft: "#F9F7F2",     // Soft ivory for alternating sections
  ink: "#171717",
  gold: "#9b7740",
};

const FONT_DISPLAY =
  "'Fraunces', 'Iowan Old Style', Georgia, serif";

const FONT_BODY =
  "'Manrope', ui-sans-serif, system-ui, sans-serif";

const EASE = [
  0.22,
  1,
  0.36,
  1,
] as const;

/* =========================================================
   GOOGLE FONTS
========================================================= */

function useGoogleFonts() {
  useEffect(() => {
    const id = "san-films-fonts";

    if (
      document.getElementById(id)
    ) {
      return;
    }

    const link =
      document.createElement(
        "link"
      );

    link.id = id;
    link.rel = "stylesheet";

    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=Manrope:wght@300;400;500;600;700&display=swap";

    document.head.appendChild(link);
  }, []);
}

/* =========================================================
   HERO VIDEO
========================================================= */

interface HeroVideoProps {
  videoUrl: string;
  heading: string;
}

function HeroVideo({
  videoUrl,
  heading,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (
      !videoRef.current ||
      !videoUrl
    ) {
      return;
    }

    videoRef.current.muted = true;

    videoRef.current
      .play()
      .catch(() => { });
  }, [videoUrl]);

  if (!videoUrl) {
    return null;
  }

  return (
    <section className="group relative mt-4 sm:mt-8 w-full overflow-hidden">
      {/* Mobile-first height */}
      <div className="relative h-[45vh] min-h-[300px] w-full overflow-hidden bg-[#1D1C1A] md:h-[30vh] md:min-h-[225px]">
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0"
        />

        <div className="absolute inset-0 bg-black/30 transition-opacity duration-500 group-hover:bg-black/10" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

        <div
          className="absolute left-4 top-4 text-[8px] uppercase tracking-[0.35em] text-white/75 sm:left-10 sm:top-8 lg:left-[8vw]"
          style={{
            fontFamily: FONT_BODY,
          }}
        >
          SAN / FILMS
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          <motion.h1
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.2,
              ease: EASE,
            }}
            className="max-w-4xl text-2xl font-light leading-tight tracking-normal text-white sm:text-3xl md:text-4xl"
            style={{
              fontFamily:
                FONT_DISPLAY,
            }}
          >
            {heading}
          </motion.h1>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FULLSCREEN MODAL
========================================================= */

interface VideoModalProps {
  film: FilmItem | null;
  onClose: () => void;
}

function VideoModal({
  film,
  onClose,
}: VideoModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        handleKey
      );

      document.body.style.overflow =
        "auto";
    };
  }, [onClose]);

  if (!film) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md md:p-8"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 0.3,
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-[#9B7740] hover:text-black md:right-8 md:top-8"
      >
        <X size={24} />
      </button>

      <motion.div
        className="relative w-full max-w-5xl"
        initial={{
          scale: 0.9,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        transition={{
          duration: 0.4,
          ease: EASE,
        }}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className={`${normalizeFilmCategory(film.category) === "reels" ? "mx-auto aspect-[9/16] max-h-[85vh] max-w-sm" : "aspect-video w-full"} overflow-hidden bg-black shadow-2xl`}>
          {film.videoUrl && (
            <video
              src={film.videoUrl}
              controls
              autoPlay
              preload="metadata"
              className="h-full w-full object-contain"
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   VIDEO CARD
========================================================= */

interface FilmCardProps {
  film: FilmItem;
  index: number;
  onExpand: (film: FilmItem) => void;
  vertical?: boolean;
}

function FilmCard({
  film,
  index,
  onExpand,
  vertical = false,
}: FilmCardProps) {
  const articleRef = useRef<HTMLElement | null>(null);
  const videoRef =
    useRef<HTMLVideoElement | null>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(index < 2);

  // isActivated = user has clicked at least once (controls become visible, unmuted)
  // isPlaying = actual video play state, synced via native events
  const [isActivated, setIsActivated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(film.videoUrl) && index < 2);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (index < 2) {
      setShouldLoadVideo(true);
      return;
    }
    if (shouldLoadVideo) return;

    const article = articleRef.current;
    if (!article || typeof IntersectionObserver === "undefined") {
      setShouldLoadVideo(true);
      setIsLoading(Boolean(film.videoUrl));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadVideo(true);
          setIsLoading(Boolean(film.videoUrl));
          observer.disconnect();
        }
      },
      { rootMargin: "0px" }
    );
    observer.observe(article);
    return () => observer.disconnect();
  }, [film.videoUrl, index, shouldLoadVideo]);

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    const setStillFrame = () => {
      if (video.duration > 1) {
        video.currentTime = 1;
      } else if (
        video.duration > 0
      ) {
        video.currentTime =
          video.duration / 2;
      }
    };

    if (video.readyState >= 1) {
      setStillFrame();
    } else {
      video.addEventListener(
        "loadedmetadata",
        setStillFrame
      );
    }

    // Sync isPlaying with native video events
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onReady = () => {
      setIsLoading(false);
      setHasError(false);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setHasError(false);
    };
    const onError = () => {
      setIsLoading(false);
      setHasError(true);
    };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("stalled", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener(
        "loadedmetadata",
        setStillFrame
      );
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("stalled", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
    };
  }, [film.videoUrl]);

  // When activated, imperatively enable controls and unmute
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActivated) return;
    video.controls = true;
    video.loop = false;
    video.muted = false;
  }, [isActivated]);

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();

    const video =
      videoRef.current;

    if (!video || !film.videoUrl) return;
    if (!shouldLoadVideo) {
      setShouldLoadVideo(true);
      setIsLoading(true);
      video.src = film.videoUrl;
      video.load();
    }

    if (!isActivated) {
      // First click: activate — unmute, show controls, play from start
      setIsActivated(true);
      video.muted = false;
      video.controls = true;
      video.loop = false;
      video.currentTime = 0;
      video.play().catch(() => { });
    } else {
      // Already activated: toggle play/pause
      if (video.paused) {
        video.play().catch(() => { });
      } else {
        video.pause();
      }
    }
  };

  // Prevent native controls clicks from bubbling to the parent div (double-toggle fix)
  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (isActivated) {
      e.stopPropagation();
    }
  };

  const handleExpandClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onExpand(film);
  };

  return (
    <motion.article
      ref={articleRef}
      className="group cursor-pointer"
      initial={{
        opacity: 0,
        y: 30,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.1,
      }}
      transition={{
        duration: 0.7,
        delay: Math.min(
          index * 0.05,
          0.4
        ),
        ease: EASE,
      }}
    >
      <div
        className={`relative ${vertical ? "aspect-[9/16]" : "aspect-video"} overflow-hidden bg-black transition-all duration-500 group-hover:shadow-2xl`}
        onClick={
          handleCardClick
        }
      >
        {film.videoUrl && !hasError ? (
          <video
            ref={videoRef}
            src={shouldLoadVideo ? film.videoUrl : undefined}
            muted
            loop
            playsInline
            poster={film.thumbnailUrl || undefined}
            preload={shouldLoadVideo ? "metadata" : "none"}
            onLoadedData={() => setIsLoading(false)}
            onCanPlay={() => setIsLoading(false)}
            onWaiting={() => setIsLoading(true)}
            onStalled={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            onClick={handleVideoClick}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-[0.2em] text-white/40">
            {hasError ? "Film unavailable" : "No Film Available"}
          </div>
        )}

        {isLoading && !hasError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-label="Loading video" />
          </div>
        )}

        {!isActivated &&
          film.videoUrl &&
          !hasError && (
            <button
              onClick={
                handleExpandClick
              }
              className="absolute right-3 top-3 z-20 flex h-9 w-9 scale-90 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 hover:bg-[#9B7740]"
              aria-label="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          )}
      </div>

      <div className="pt-2">
        <div className="mb-1 flex items-center justify-between">
          <p
            className="text-[8px] sm:text-[9px] uppercase tracking-[0.12em] text-[#9b7740]"
            style={{
              fontFamily: FONT_BODY,
            }}
          >
            {FILM_CATEGORY_DEFINITIONS.find((category) => category.id === normalizeFilmCategory(film.category))?.label || film.category}
          </p>

          <p
            className="text-[8px] sm:text-[9px] uppercase tracking-[0.08em] text-[#171717]/40"
            style={{
              fontFamily: FONT_BODY,
            }}
          >
            {film.date}
          </p>
        </div>

        <h3
          className="text-sm sm:text-lg md:text-xl font-light leading-[1.1] tracking-[-0.02em] text-[#171717] transition-opacity duration-300 group-hover:opacity-60"
          style={{
            fontFamily:
              FONT_DISPLAY,
          }}
        >
          {film.title}
        </h3>

        <p
          className="mt-0.5 text-[10px] sm:text-xs leading-5 text-[#171717]/50"
          style={{
            fontFamily: FONT_BODY,
          }}
        >
          {film.location}
        </p>
      </div>
    </motion.article>
  );
}

/* =========================================================
   FILMS PAGE
========================================================= */

function Films() {
  useGoogleFonts();

  const [
    content,
    setContent,
  ] = useState<FilmsContent>(DEFAULT_FILMS);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<FilmCategory>("All");

  const [
    selectedFilm,
    setSelectedFilm,
  ] = useState<FilmItem | null>(null);

  /* =======================================================
    LOAD FROM PHP API
  ======================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    async function fetchContent() {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/content.php`,
            {
              signal:
                controller.signal,
              cache: 'no-store',
            }
          );

        if (!response.ok) {
          return;
        }

        const data =
          await readApiJson(response, 'Films');

        const savedFilms =
          data?.content?.films;

        if (
          savedFilms &&
          typeof savedFilms ===
          "object"
        ) {
          setContent({
            ...DEFAULT_FILMS,
            ...savedFilms,

            /*
              Preserve an empty list when the PHP API has no films.
            */
            items: Array.isArray(
              savedFilms.items
            )
              ? savedFilms.items
              : DEFAULT_FILMS.items,
          });
        }
      } catch (error) {
        if (
          error instanceof Error && error.name !==
          "AbortError"
        ) {
          console.error(
            "Failed to load films content:",
            error
          );
        }
      }
    }

    fetchContent();

    return () => {
      controller.abort();
    };
  }, []);

  /* =======================================================
     FIXED PUBLIC FILTERS
     SAME AS CURRENT PAGE
  ======================================================= */

  const filters: FilmCategory[] = [
    "All",
    ...FILM_CATEGORY_DEFINITIONS.map((category) => category.label),
  ];

  /* =======================================================
     FILTER FILMS
  ======================================================= */

  const filteredFilms =
    useMemo(() => {
      const items =
        Array.isArray(
          content.items
        )
          ? content.items
          : [];

      const visibleItems = items.filter(
        (film) =>
          film.isActive !== false &&
          typeof film.videoUrl === "string" &&
          film.videoUrl.trim().length > 0
      );

      if (activeFilter === "All") {
        return visibleItems;
      }

      const filteredItems = visibleItems.filter(
        (film) => normalizeFilmCategory(film.category) === normalizeFilmCategory(activeFilter)
      );

      if (activeFilter === "Reels") {
        return filteredItems
          .sort((first, second) => (first.order ?? 0) - (second.order ?? 0))
          .slice(0, 8);
      }

      return filteredItems;
    }, [
      content.items,
      activeFilter,
    ]);

  /* =======================================================
     HERO VIDEO
  ======================================================= */

  const heroVideo =
    content.heroVideoUrl ||
    "";

  return (
    <>
      <AnimatePresence>
        {selectedFilm && (
          <VideoModal
            film={selectedFilm}
            onClose={() =>
              setSelectedFilm(null)
            }
          />
        )}
      </AnimatePresence>

      <main
        className="min-h-screen pt-20 sm:pt-24" // Mobile-first padding to clear navbar
        style={{
          backgroundColor:
            COLOR.paper,
          color: COLOR.ink,
          fontFamily:
            FONT_BODY,
        }}
      >
     

        {/* FILMS GRID - Mobile First Padding */}

        <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-6xl">
          
            {/* ADDED gap-x-6 for mobile and sm:gap-x-0 for larger screens to fix overlap */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-b border-[#171717]/10 pb-4 sm:mb-8 sm:gap-x-0 sm:pb-6 md:flex-nowrap">
              <p
                className="whitespace-nowrap text-[9px] uppercase tracking-[0.08em] text-[#9b7740]"
                style={{ fontFamily: FONT_BODY }}
              >
                {content.heroVideoText || "Inspired by Cinema."}
              </p>
              <span className="mx-4 hidden h-4 w-px shrink-0 bg-[#171717]/25 sm:block" />
              {filters.map(
                (
                  filter,
                  index
                ) => (
                  <React.Fragment
                    key={
                      filter
                    }
                  >
                    {index >
                      0 && (
                        <span className="mx-4 hidden h-4 w-px bg-[#171717]/25 sm:block" />
                      )}

                    <button
                      type="button"
                      onClick={() =>
                        setActiveFilter(
                          filter
                        )
                      }
                      className={`text-[9px] tracking-[0.08em] transition-colors duration-300 ${activeFilter ===
                          filter
                          ? "text-[#171717]"
                          : "text-[#171717]/45 hover:text-[#171717]"
                        }`}
                      style={{
                        fontFamily:
                          FONT_BODY,
                      }}
                    >
                      {
                        filter
                      }
                    </button>
                  </React.Fragment>
                )
              )}
            </div>

            {filteredFilms.length >
              0 ? (
              // Updated Grid: 2 cols on mobile, 2 on tablet/small desktop, 3 on large, 4 on extra large
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-2 md:grid-cols-3 sm:gap-x-6 sm:gap-y-10 xl:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
                {filteredFilms.map(
                  (
                    film,
                    index
                  ) => (
                    <FilmCard
                      key={
                        film.id ||
                        `film-${index}`
                      }
                      film={
                        film
                      }
                      index={
                        index
                      }
                      onExpand={
                        setSelectedFilm
                      }
                      vertical={activeFilter === "Reels"}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p
                  className="text-sm text-[#171717]/50"
                  style={{
                    fontFamily:
                      FONT_BODY,
                  }}
                >
                  No films available
                  in this category.
                </p>
              </div>
            )}
          </div>
        </section>
     {heroVideo && (
          <HeroVideo
            videoUrl={heroVideo}
            heading="Every love story deserves to be felt again."
          />
        )}

        <section className="border-t border-[#171717]/10 bg-[#F9F7F2] px-6 py-20 sm:py-24 lg:py-28">
  <div className="mx-auto max-w-4xl text-center">
    <p
      className="mb-4 text-[9px] uppercase tracking-[0.32em] text-[#9b7740]"
      style={{ fontFamily: FONT_BODY }}
    >
      {content.statementEyebrow || "SAN PHOTOGRAPHY"}
    </p>

    <h2
      className="text-3xl font-light leading-tight tracking-[-0.03em] text-[#171717] sm:text-4xl md:text-5xl"
      style={{ fontFamily: FONT_DISPLAY }}
    >
      {content.statementHeading ||
        "Every love story deserves to be felt again."}
    </h2>

    <p
      className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#171717]/55"
      style={{ fontFamily: FONT_BODY }}
    >
      {content.statementText ||
        "We craft cinematic wedding films with a focus on emotion, atmosphere and authentic moments."}
    </p>
  </div>
</section>
      </main>
    </>
  );
}

export default Films;