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
import { API_URL, fetchApiJson } from "../services/api";
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

type FilmCategory = (typeof FILM_CATEGORY_DEFINITIONS)[number]["label"];

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
  const sectionRef = useRef<HTMLElement | null>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoadVideo(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!shouldLoadVideo || !video) return;

    video.muted = true;
    video.play().catch(() => { });
  }, [shouldLoadVideo, videoUrl]);

  if (!videoUrl) {
    return null;
  }

  return (
    <section ref={sectionRef} className="group relative mt-4 sm:mt-8 w-full overflow-hidden">
      {/* Mobile-first height */}
      <div className="relative h-[45vh] min-h-[300px] w-full overflow-hidden bg-[#1D1C1A] md:h-[30vh] md:min-h-[225px]">
        <video
          ref={videoRef}
          src={shouldLoadVideo ? videoUrl : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload={shouldLoadVideo ? "metadata" : "none"}
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
  const reelPlayerRef = useRef<HTMLDivElement | null>(null);
  const [isReelFullscreen, setIsReelFullscreen] = useState(false);
  const isReel = normalizeFilmCategory(film?.category) === "reels";

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement === reelPlayerRef.current) {
          void document.exitFullscreen();
          return;
        }
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

 useEffect(() => {
  const syncFullscreenState = () => {
    setIsReelFullscreen(document.fullscreenElement === reelPlayerRef.current);
  };

  document.addEventListener("fullscreenchange", syncFullscreenState);

  return () => {
    document.removeEventListener("fullscreenchange", syncFullscreenState);
  };
}, []);

  const toggleReelFullscreen = async () => {
    const player = reelPlayerRef.current;
    if (!player) return;

    try {
      if (document.fullscreenElement === player) {
        await document.exitFullscreen();
      } else {
        await player.requestFullscreen();
      }
    } catch (error) {
      console.error("Could not toggle Reel fullscreen:", error);
    }
  };

  if (!film) {
    return null;
  }

  return (
    <motion.div
      className={`fixed inset-0 z-[100] flex items-center justify-center ${normalizeFilmCategory(film.category) === "reels" ? "bg-black/50" : "bg-black/95 backdrop-blur-md"} p-4 md:p-8`}
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
      {isReel && film.videoUrl && (
        <video
          src={film.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
        />
      )}
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
<div
  ref={isReel ? reelPlayerRef : undefined}
  className={`${isReel
    ? isReelFullscreen
      ? "fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-black"
      : "relative mx-auto aspect-[9/16] w-[min(92vw,calc(92dvh*9/16))] overflow-hidden bg-black shadow-2xl"
    : "aspect-video w-full overflow-hidden bg-black shadow-2xl"
  }`}
>
  {isReel && isReelFullscreen && film.videoUrl && (
    <video
      src={film.videoUrl}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
    />
  )}

  {film.videoUrl && (
    <video
      src={film.videoUrl}
      controls={!isReelFullscreen}
      controlsList={isReel ? "nofullscreen,noremoteplayback" : undefined}
      disablePictureInPicture={isReel}
      autoPlay
      preload="metadata"
      playsInline
     className={
  isReel
    ? isReelFullscreen
      ? "reel-video relative z-10 h-full w-full object-contain"
      : "reel-video relative z-10 h-full w-full aspect-[9/16] object-contain"
    : "h-full w-full object-contain"
}
    />
  )}

  {isReel && (
    <button
      type="button"
      onClick={toggleReelFullscreen}
      aria-label={
        isReelFullscreen ? "Exit fullscreen Reel" : "Fullscreen Reel"
      }
      className={`absolute z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-[#9B7740] hover:text-black ${
        isReelFullscreen
          ? "right-4 top-4"
          : "bottom-4 right-4"
      }`}
    >
      <Maximize2 size={18} />
    </button>
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
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  // isActivated = user has clicked at least once (controls become visible, unmuted)
  // isPlaying = actual video play state, synced via native events
  const [isActivated, setIsActivated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
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
      { rootMargin: "200px 0px" }
    );
    observer.observe(article);
    return () => observer.disconnect();
  }, [film.videoUrl, shouldLoadVideo]);

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

  if (!vertical) {
    video.controls = true;
  }
  video.loop = false;
  video.muted = false;

  // Remove native fullscreen button from video controls
 
}, [isActivated, vertical]);

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
      if (!vertical) {
        video.controls = true;
      }
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

  // Reels (no native controls): let clicks bubble up so play/pause toggles anywhere.
  // Non-Reels (native controls visible once activated): stop the click here so the
  // native control (play/pause, seek, volume, fullscreen) isn't immediately undone
  // by the card's own toggle logic firing on the same click.
  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (isActivated && !vertical) {
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
        className={`relative ${vertical ? "aspect-square" : "aspect-video"} overflow-hidden bg-black transition-all duration-500 group-hover:shadow-2xl`}
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
            controlsList={vertical ? "nofullscreen nodownload noremoteplayback" : "nodownload noremoteplayback"}
            disablePictureInPicture
            poster={shouldLoadVideo ? film.thumbnailUrl || undefined : undefined}
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

        {vertical &&
          film.videoUrl &&
          !hasError && (
            <button
              onClick={
                handleExpandClick
              }
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all duration-300 hover:bg-[#9B7740]"
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
  const [isLoading, setIsLoading] = useState(true);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<FilmCategory>(FILM_CATEGORY_DEFINITIONS[0].label);

  const [
    selectedFilm,
    setSelectedFilm,
  ] = useState<FilmItem | null>(null);

  /* =======================================================
    LOAD FROM PHP API
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    async function fetchContent() {
      try {
        const data = await fetchApiJson(`${API_BASE_URL}/api/content.php`, 'Films');
        if (!isMounted) return;

        const savedFilms =
          data?.content?.films;

        if (
          savedFilms &&
          typeof savedFilms ===
          "object"
        ) {
          setIsLoading(false);
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
        if (isMounted) {
          console.error(
            "Failed to load films content:",
            error
          );
        }
      }
    }

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =======================================================
     FIXED PUBLIC FILTERS
     SAME AS CURRENT PAGE
  ======================================================= */

  const filters: FilmCategory[] = [
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

  if (isLoading) {
    return (
      <main
        aria-busy="true"
        aria-label="Loading films"
        className="min-h-screen bg-white px-4 pt-28 sm:px-6 lg:px-12"
      >
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="mb-8 flex justify-center gap-6 border-b border-black/10 pb-6">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-3 w-16 bg-black/10" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index}>
                <div className="aspect-video bg-black/[0.06]" />
                <div className="mt-3 h-3 w-20 bg-black/10" />
                <div className="mt-2 h-5 max-w-40 bg-black/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

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