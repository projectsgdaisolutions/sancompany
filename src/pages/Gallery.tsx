import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import {
  motion,
  useScroll,
  useSpring,
  useInView,
} from "framer-motion";
import type { GalleryCouple } from "../types";
import { API_URL, readApiJson } from "../services/api";

const API_BASE_URL = API_URL;

/* =========================================================
   DEFAULT COUPLES
========================================================= */

interface GalleryAlbum extends GalleryCouple {
  image: string;
  order?: number;
}

interface GalleryContent {
  heroEyebrow: string;
  heroHeadingLine1: string;
  heroHeadingLine2: string;
  heroDescription: string;
  couples: GalleryAlbum[];
  recentAlbums: GalleryAlbum[];
  ctaEyebrow: string;
  ctaHeadingLine1: string;
  ctaHeadingLine2: string;
  ctaDescription: string;
  ctaButtonText: string;
  ctaButtonHref: string;
}

const DEFAULT_COUPLES: GalleryAlbum[] = [
  {
    id: 1,
    slug: "kapil-payal",
    name: "Kapil & Payal",
    location: "Udaipur, Rajasthan",
    image: "",
  },
  {
    id: 2,
    slug: "pratik-megha",
    name: "Pratik & Megha",
    location: "Goa, India",
    image: "",
  },
  {
    id: 3,
    slug: "tanmay-achal",
    name: "Tanmay & Achal",
    location: "Jaipur, Rajasthan",
    image: "",
  },
];

/* =========================================================
   DEFAULT GALLERY CONTENT
========================================================= */

const DEFAULT_GALLERY: GalleryContent = {
  heroEyebrow: "SAN / GALLERY",
  heroHeadingLine1: "Stories in",
  heroHeadingLine2: "Frames.",
  heroDescription:
    "A visual diary of timeless moments. Browse through our collection of iconic wedding frames, raw emotions, and beautiful details that capture the essence of every celebration.",

  couples: DEFAULT_COUPLES.map((couple, index) => ({
    ...couple,
    order: index,
  })),
  recentAlbums: [],

  ctaEyebrow: "SAN Photography",
  ctaHeadingLine1: "Your story.",
  ctaHeadingLine2: "Our frame.",
  ctaDescription:
    "Every celebration has a story. We are here to preserve yours beautifully.",
  ctaButtonText: "Start Your Story",
  ctaButtonHref: "/contact",
};

/* =========================================================
   MERGE GALLERY
========================================================= */

const DEFAULT_RECENT_ALBUMS: GalleryAlbum[] = [];
const MAX_PUBLIC_RECENT_ALBUMS = 4;
const MAX_PUBLIC_ALL_ALBUMS = 12;

function normalizeCouples(savedCouples: unknown): GalleryAlbum[] {
  if (!Array.isArray(savedCouples)) {
    return DEFAULT_COUPLES.slice(0, 12);
  }

  return savedCouples
    .map((couple: Partial<GalleryAlbum>, index: number) => ({
      id: couple?.id ?? `couple-${Date.now()}-${index}`,
      slug: couple?.slug ?? "",
      name: couple?.name ?? "",
      location: couple?.location ?? "",
      image: couple?.image ?? "",
      order: typeof couple?.order === "number" ? couple.order : index,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeRecentAlbums(savedRecent: unknown): GalleryAlbum[] {
  if (!Array.isArray(savedRecent)) {
    return DEFAULT_RECENT_ALBUMS;
  }

  return savedRecent
    .map((album: Partial<GalleryAlbum>, index: number) => ({
      id: album?.id ?? `recent-${Date.now()}-${index}`,
      slug: album?.slug ?? "",
      name: album?.name ?? "",
      location: album?.location ?? "",
      image: album?.image ?? "",
      order: typeof album?.order === "number" ? album.order : index,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function mergeGallery(remote: Partial<GalleryContent> | null): GalleryContent {
  if (!remote || typeof remote !== "object") {
    return DEFAULT_GALLERY;
  }

  return {
    heroEyebrow:
      remote.heroEyebrow ?? DEFAULT_GALLERY.heroEyebrow,
    heroHeadingLine1:
      remote.heroHeadingLine1 ?? DEFAULT_GALLERY.heroHeadingLine1,
    heroHeadingLine2:
      remote.heroHeadingLine2 ?? DEFAULT_GALLERY.heroHeadingLine2,
    heroDescription:
      remote.heroDescription ?? DEFAULT_GALLERY.heroDescription,
    couples: normalizeCouples(remote.couples),
    recentAlbums: normalizeRecentAlbums(remote.recentAlbums),
    ctaEyebrow:
      remote.ctaEyebrow ?? DEFAULT_GALLERY.ctaEyebrow,
    ctaHeadingLine1:
      remote.ctaHeadingLine1 ?? DEFAULT_GALLERY.ctaHeadingLine1,
    ctaHeadingLine2:
      remote.ctaHeadingLine2 ?? DEFAULT_GALLERY.ctaHeadingLine2,
    ctaDescription:
      remote.ctaDescription ?? DEFAULT_GALLERY.ctaDescription,
    ctaButtonText:
      remote.ctaButtonText ?? DEFAULT_GALLERY.ctaButtonText,
    ctaButtonHref:
      remote.ctaButtonHref ?? DEFAULT_GALLERY.ctaButtonHref,
  };
}

/* =========================================================
   DESIGN TOKENS
========================================================= */

const COLOR = {
  paper: "#FAFAF8",
  paperDeep: "#F5F3EF",
  ink: "#181715",
  gold: "#9b7740",
  goldLight: "#C9A467",
};

const FONT_DISPLAY =
  "'Cormorant Garamond', 'Fraunces', Georgia, serif";

const FONT_BODY =
  "'Manrope', ui-sans-serif, system-ui, sans-serif";

const EASE_EXPO = [0.19, 1, 0.22, 1] as const;

/* =========================================================
   GOOGLE FONTS
========================================================= */

function useGoogleFonts() {
  useEffect(() => {
    const id = "san-gallery-light-fonts";

    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700;1,0..144,300;1,0..144,400&family=Manrope:wght@300;400;500;600;700;800&display=swap";

    document.head.appendChild(link);
  }, []);
}

/* =========================================================
   GLOBAL STYLES
========================================================= */

function GlobalMotionStyles() {
  return (
    <style>{`
      html {
        scroll-behavior: smooth;
      }

      body {
        background-color: ${COLOR.paper};
        overscroll-behavior: none;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      ::selection {
        background: ${COLOR.gold};
        color: ${COLOR.paper};
      }

      ::-webkit-scrollbar {
        width: 0px;
      }
    `}</style>
  );
}

/* =========================================================
   FILM GRAIN
========================================================= */

function FilmGrain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] opacity-[0.015] mix-blend-multiply"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/* =========================================================
   SCROLL PROGRESS BAR
========================================================= */

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.2,
  });

  return (
    <motion.div
      className="fixed left-0 top-0 z-[95] h-[2px] w-full origin-left"
      style={{
        scaleX,
        backgroundColor: COLOR.gold,
      }}
    />
  );
}

/* =========================================================
   REVEAL HEADING
========================================================= */

interface RevealLine {
  text: string;
  color?: string;
  italic?: boolean;
  block?: boolean;
  font?: string;
  weight?: number;
}

interface RevealHeadingProps {
  lines: RevealLine[];
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  delayStart?: number;
}

function RevealHeading({
  lines,
  as = "h2",
  className = "",
  delayStart = 0,
}: RevealHeadingProps) {
  const ref = useRef<HTMLElement | null>(null);

  const inView = useInView(ref, {
    once: true,
    amount: 0.3,
  });

  const MotionTag = motion[as as keyof typeof motion] as React.ElementType;
  let wordIndex = 0;

  return (
    <MotionTag ref={ref} className={className}>
      {lines.map((line: RevealLine, lineIndex: number) => {
        const words = (line.text || "").split(" ");

        const content = words.map((word: string, wordIndexInLine: number) => {
          const currentWordIndex = wordIndex++;
          return (
            <span
              key={`${lineIndex}-${wordIndexInLine}`}
              className="inline-block overflow-hidden align-top"
            >
              <motion.span
                className="inline-block"
                initial={{ y: "105%", opacity: 0 }}
                animate={
                  inView
                    ? { y: 0, opacity: 1 }
                    : { y: "105%", opacity: 0 }
                }
                transition={{
                  duration: 0.8,
                  ease: EASE_EXPO,
                  delay: delayStart + currentWordIndex * 0.04,
                }}
                style={{
                  color: line.color || "inherit",
                  fontStyle: line.italic ? "italic" : "normal",
                  fontWeight: line.weight || "inherit",
                }}
              >
                {word}
                {wordIndexInLine < words.length - 1 ? "\u00A0" : ""}
              </motion.span>
            </span>
          );
        });

        return line.block ? (
          <span
            key={lineIndex}
            style={{
              fontFamily: line.font || "inherit",
            }}
            className="block"
          >
            {content}
          </span>
        ) : (
          <span key={lineIndex}>{content} </span>
        );
      })}
    </MotionTag>
  );
}

/* =========================================================
   ALBUM CARD (GALLERY ALBUM & RECENT ALBUM)
========================================================= */

interface AlbumCardProps {
  album: GalleryAlbum;
  index: number;
}

function AlbumCard({ album, index }: AlbumCardProps) {
  return (
    <motion.div
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
        ease: EASE_EXPO,
        delay: index * 0.05,
      }}
      className="group relative"
    >
      <Link
        to={`/gallery/${album.slug}`}
        className="relative block overflow-hidden"
      >
        <div className="relative aspect-[5/6] overflow-hidden bg-[#f0ede5]">
          {album.image ? (
            <img
              src={album.image}
              alt={album.name}
              loading={index < 3 ? 'eager' : 'lazy'}
              fetchPriority={index < 3 ? 'high' : 'auto'}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-out grayscale-[15%] group-hover:scale-[1.04] group-hover:grayscale-0"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#e9e5dd]">
              <span
                className="text-[10px] uppercase tracking-[0.2em] text-black/40"
                style={{
                  fontFamily: FONT_BODY,
                }}
              >
                View Album
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-90 transition-opacity duration-700 group-hover:opacity-100" />

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div className="transition-transform duration-500 group-hover:-translate-y-1">
              {album.location && (
                <p className="text-[8px] uppercase tracking-[0.3em] text-white/60 transition-colors duration-700 group-hover:text-white/90">
                  {album.location}
                </p>
              )}
            </div>

            <div className="flex h-7 w-7 translate-y-3 items-center justify-center bg-white text-black opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              <ArrowUpRight size={12} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <h3
          className="mt-2 text-sm font-light tracking-[-0.02em] text-[#181715] sm:text-base"
          style={{
            fontFamily: FONT_DISPLAY,
          }}
        >
          {album.name}
        </h3>
      </Link>
    </motion.div>
  );
}

/* =========================================================
   MAIN GALLERY
========================================================= */

function Gallery() {
  useGoogleFonts();

  const [galleryContent, setGalleryContent] = useState<GalleryContent>(DEFAULT_GALLERY);
  const [activeFilter, setActiveFilter] = useState<"All" | "Recent">("All");

  useEffect(() => {
    let isMounted = true;

    // Fetch Gallery metadata (couples + recentAlbums) from PHP API
    const fetchGalleryContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/content.php`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Content request failed: ${response.status}`);
        }
        const data = await readApiJson(response, 'Gallery');
        if (isMounted && data.success && data.content?.gallery) {
          setGalleryContent(mergeGallery(data.content.gallery));
        }
      } catch (error) {
        console.error("Failed to fetch gallery content:", error);
      }
    };

    fetchGalleryContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const {
    heroEyebrow,
    heroHeadingLine1,
    heroHeadingLine2,
    heroDescription,
    couples,
    recentAlbums = [],
    ctaEyebrow,
    ctaHeadingLine1,
    ctaHeadingLine2,
    ctaDescription,
    ctaButtonText,
    ctaButtonHref,
  } = galleryContent;

  const filters: Array<"All" | "Recent"> = ["All", "Recent"];

  const getAlbumKey = (album: GalleryAlbum) =>
    String(album?.id ?? album?.slug ?? "").trim();

  const publicRecentAlbums = recentAlbums.slice(0, MAX_PUBLIC_RECENT_ALBUMS);
  const publicAllAlbums = [
    ...publicRecentAlbums,
    ...couples,
  ].filter((album: GalleryAlbum, index: number, albums: GalleryAlbum[]) => {
    const key = getAlbumKey(album);
    return albums.findIndex((candidate: GalleryAlbum) => getAlbumKey(candidate) === key) === index;
  }).slice(0, MAX_PUBLIC_ALL_ALBUMS);

  return (
    <>
      <GlobalMotionStyles />
      <FilmGrain />
      <ScrollProgressBar />

      <main
        className="relative text-[#181715]"
        style={{
          backgroundColor: COLOR.paper,
        }}
      >
        {/* ===================================================
            HERO SECTION
        =================================================== */}
        <section className="relative px-8 pt-28 pb-12 sm:px-12 sm:pt-32 sm:pb-16 lg:px-24">
          <div className="mx-auto max-w-5xl">
            <motion.p
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                ease: EASE_EXPO,
              }}
              className="text-[9px] uppercase tracking-[0.45em] text-[#9b7740]"
              style={{
                fontFamily: FONT_BODY,
              }}
            >
              {heroEyebrow}
            </motion.p>

            <RevealHeading
              as="h1"
              lines={[
                {
                  text: heroHeadingLine1,
                  font: FONT_DISPLAY,
                  weight: 300,
                  block: true,
                },
                {
                  text: heroHeadingLine2,
                  font: FONT_DISPLAY,
                  weight: 300,
                  italic: true,
                  block: true,
                },
              ]}
              delayStart={0.08}
              className="mt-3 text-4xl font-light leading-[1.05] tracking-[-0.03em] text-[#181715] sm:text-6xl md:text-7xl lg:text-8xl"
            />

            <motion.p
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: EASE_EXPO,
              }}
              className="mt-4 max-w-sm text-xs leading-6 text-black/50 md:text-sm md:leading-7"
              style={{
                fontFamily: FONT_BODY,
              }}
            >
              {heroDescription}
            </motion.p>
          </div>
        </section>

        {/* ===================================================
            FILTERS BAR (All and Recent)
        =================================================== */}
        <section className="px-8 sm:px-12 lg:px-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-b border-[#171717]/10 pb-4 sm:mb-10 sm:gap-x-0">
              {filters.map((filter, index) => (
                <React.Fragment key={filter}>
                  {index > 0 && (
                    <span className="mx-4 hidden h-4 w-px bg-[#171717]/25 sm:block" />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`text-[9px] uppercase tracking-[0.15em] transition-colors duration-300 ${
                      activeFilter === filter
                        ? "text-[#181715] font-semibold"
                        : "text-[#171717]/45 hover:text-[#181715]"
                    }`}
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {filter}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================
            GALLERY ITEMS / RECENT ITEMS (ALBUM CARDS ONLY)
        =================================================== */}
        <section className="relative px-8 pb-16 sm:px-12 lg:px-24 lg:pb-20">
          <div className="mx-auto max-w-5xl">
            {activeFilter === "Recent" ? (
              /* RECENT TAB: Only Recent Album Cards (Max 4) */
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 lg:gap-x-5 lg:gap-y-8">
                {publicRecentAlbums.length > 0 ? (
                  publicRecentAlbums.map((album, index) => (
                    <AlbumCard
                      key={album.id ?? `recent-${album.slug}-${index}`}
                      album={album}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center">
                    <p
                      className="text-sm text-[#171717]/50"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      No recent albums available.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ALL TAB: Combined Photo Gallery + Recent Album Cards (Max 12 displayed) */
              (() => {
                return (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 lg:gap-x-5 lg:gap-y-8">
                    {publicAllAlbums.length > 0 ? (
                      publicAllAlbums.map((album, index) => (
                        <AlbumCard
                          key={album.id ?? `${album.slug}-${index}`}
                          album={album}
                          index={index}
                        />
                      ))
                    ) : (
                      <div className="col-span-full py-16 text-center">
                        <p
                          className="text-sm text-[#171717]/50"
                          style={{ fontFamily: FONT_BODY }}
                        >
                          No galleries available.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </section>

        {/* ===================================================
            FINAL CTA
        =================================================== */}
        <section
          id="contact"
          className="relative flex min-h-[50vh] items-center justify-center overflow-hidden px-8 py-16 text-center sm:px-12 lg:px-24 lg:py-20"
        >
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.8,
              ease: EASE_EXPO,
            }}
            className="relative z-10 mx-auto max-w-4xl"
          >
            <p className="text-[9px] uppercase tracking-[0.45em] text-[#9b7740]">
              {ctaEyebrow}
            </p>

            <RevealHeading
              as="h2"
              lines={[
                {
                  text: ctaHeadingLine1,
                  font: FONT_DISPLAY,
                  weight: 300,
                  block: true,
                },
                {
                  text: ctaHeadingLine2,
                  font: FONT_DISPLAY,
                  weight: 300,
                  italic: true,
                  block: true,
                },
              ]}
              delayStart={0.1}
              className="mt-3 text-3xl font-light leading-[1.1] tracking-[-0.03em] text-[#181715] sm:text-5xl md:text-6xl"
            />

            <p
              className="mx-auto mt-4 max-w-xs text-xs leading-6 text-black/50 sm:max-w-sm sm:text-sm"
              style={{
                fontFamily: FONT_BODY,
              }}
            >
              {ctaDescription}
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                to={ctaButtonHref}
                className="group inline-flex items-center gap-2 border border-[#181715] px-6 py-2.5 text-[9px] uppercase tracking-[0.3em] text-[#181715] transition-all duration-300 hover:bg-[#181715] hover:text-[#FAFAF8]"
                style={{
                  fontFamily: FONT_BODY,
                }}
              >
                <span>{ctaButtonText}</span>
                <ArrowUpRight
                  size={12}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}

export default Gallery;