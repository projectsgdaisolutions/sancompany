import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { GalleryCouple, GalleryPhoto } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

/* =========================================================
   FALLBACK COUPLES
========================================================= */

const DEFAULT_COUPLES = [
  {
    id: 1,
    slug: "kapil-payal",
    name: "Kapil & Payal",
    location: "Udaipur, Rajasthan",
    description: "",
  },
  {
    id: 2,
    slug: "pratik-megha",
    name: "Pratik & Megha",
    location: "Goa, India",
    description: "",
  },
  {
    id: 3,
    slug: "tanmay-achal",
    name: "Tanmay & Achal",
    location: "Jaipur, Rajasthan",
    description: "",
  },
];

/* =========================================================
   MAIN ALBUM DETAIL COMPONENT
========================================================= */

export default function AlbumDetail() {
  const { slug } = useParams();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [couple, setCouple] = useState<GalleryCouple | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  /* =======================================================
     LOAD FONTS
  ======================================================= */

  useEffect(() => {
    const id = "san-album-detail-fonts";

    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Manrope:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  /* =======================================================
     FETCH ALBUM DETAILS & INNER PHOTOS VIA PHP API
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const fetchAlbumData = async () => {
      try {
        setLoading(true);

        // 1. Fetch album and photos directly from /api/gallery.php?slug=<slug>
        // Reads from MySQL gallery_media WHERE category = 'gallery:<slug>' or 'recent:<slug>'
        let albumPhotosList: string[] = [];
        let matchedCouple: GalleryCouple | null = null;

        try {
          const photosRes = await fetch(
            `${API_BASE_URL}/api/gallery.php?slug=${encodeURIComponent(slug || "")}`
          );
          if (photosRes.ok) {
            const photosData = await photosRes.json();
            if (photosData.success) {
              if (photosData.album) {
                matchedCouple = photosData.album;
              }
              if (Array.isArray(photosData.photos)) {
                // Maximum 40 photos for this album
                albumPhotosList = photosData.photos
                  .slice(0, 40)
                  .map((p: GalleryPhoto) => p.imageUrl || p.image_url || p.url)
                  .filter(Boolean);
              }
            }
          }
        } catch (e) {
          console.warn("Could not load gallery photos from MySQL:", e);
        }

        // 2. Fallback to website_content if album metadata wasn't populated
        if (!matchedCouple) {
          try {
            const contentRes = await fetch(`${API_BASE_URL}/api/content.php`);
            if (contentRes.ok) {
              const contentData = await contentRes.json();
              const savedCouples = contentData.content?.gallery?.couples;
              const savedRecent = contentData.content?.gallery?.recentAlbums;
              if (Array.isArray(savedCouples)) {
                matchedCouple = savedCouples.find((c: GalleryCouple) => c.slug === slug);
              }
              if (!matchedCouple && Array.isArray(savedRecent)) {
                matchedCouple = savedRecent.find((c: GalleryCouple) => c.slug === slug);
              }
            }
          } catch (e) {
            console.warn("Could not load content couples list:", e);
          }
        }

        if (!matchedCouple) {
          // Check fallback defaults
          matchedCouple = DEFAULT_COUPLES.find((c: GalleryCouple) => c.slug === slug) || null;
        }

        // If still not matched, format a basic couple object from the slug
        if (!matchedCouple) {
          const formattedName = slug
            ? slug
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            : "Gallery Album";
          matchedCouple = {
            slug: slug || "",
            name: formattedName,
            location: "",
            description: "",
          };
        }

        if (isMounted) {
          setCouple(matchedCouple);
          setImages(albumPhotosList);
        }
      } catch (err) {
        console.error("Failed to load album data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAlbumData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  /* =======================================================
     LIGHTBOX NAVIGATION
  ======================================================= */

  const nextImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setActiveIndex((prev) =>
        prev !== null ? (prev + 1) % images.length : null
      );
    },
    [images.length]
  );

  const prevImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setActiveIndex((prev) =>
        prev !== null ? (prev - 1 + images.length) % images.length : null
      );
    },
    [images.length]
  );

  // Keyboard Navigation
  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden"; // Prevent background scroll

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [activeIndex, nextImage, prevImage]);

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          backgroundColor: "#FAFAF8",
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        <div className="flex items-center gap-3 text-neutral-600">
          <RefreshCw className="w-5 h-5 animate-spin text-[#9b7740]" />
          <span className="text-sm font-medium tracking-wide">
            Loading Album...
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     ALBUM NOT FOUND
  ======================================================= */

  if (!couple) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          backgroundColor: "#FAFAF8",
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        <h1
          className="text-3xl font-light mb-4 text-[#181715]"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}
        >
          Album Not Found
        </h1>

        <p className="text-gray-600 mb-6 text-sm">
          The album you are looking for does not exist.
        </p>

        <Link
          to="/gallery"
          className="px-6 py-3 border border-[#181715] text-[10px] uppercase tracking-[0.25em] hover:bg-[#181715] hover:text-white transition-all duration-300"
        >
          ← Back to Gallery
        </Link>
      </div>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <div
      className="min-h-screen pt-28 md:pt-32 pb-10"
      style={{
        backgroundColor: "#FAFAF8",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      <main className="max-w-[950px] mx-auto px-5 sm:px-8 md:px-10">
        {/* ===============================================
            COUPLE NAME
        =============================================== */}

        <motion.h1
          className="text-[28px] sm:text-[36px] md:text-[42px] leading-[0.95] font-light tracking-[-0.04em] text-[#181715]"
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
            ease: "easeOut",
          }}
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}
        >
          {couple.name}
        </motion.h1>

        {/* DIVIDER */}

        <div className="w-full h-px bg-[#e5e2dc] mt-3 md:mt-4" />

        {/* LOCATION & DESCRIPTION */}

        {(couple.location || couple.description) && (
          <div className="mt-3 md:mt-4 max-w-[700px]">
            {couple.location && (
              <p className="text-[9px] uppercase tracking-[0.32em] text-[#9b7740] mb-2">
                {couple.location}
              </p>
            )}

            {couple.description && (
              <p className="text-[11px] md:text-[12px] leading-[1.6] text-[#66615b]">
                {couple.description}
              </p>
            )}
          </div>
        )}

        {/* ===============================================
            BACK TO GALLERY
        =============================================== */}

        <Link
          to="/gallery"
          className="inline-block mt-6 md:mt-7 text-[9px] uppercase tracking-[0.35em] text-gray-500 hover:text-[#181715] transition-colors"
        >
          ← Back to Gallery
        </Link>

        {/* ===============================================
            GALLERY HEADING
        =============================================== */}

        <section className="mt-10 md:mt-12">
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.35em] text-[#9b7740]">
              The Gallery
            </p>
            {images.length > 0 && (
              <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                {images.length} / 40 photos
              </span>
            )}
          </div>

          <h2
            className="mt-2 text-[22px] sm:text-[28px] font-light leading-tight tracking-[-0.03em] text-[#181715]"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >
            Moments from their day
          </h2>
        </section>

        {/* ===============================================
            ALL ALBUM IMAGES (Masonry Layout)
        =============================================== */}

        <section className="mt-5 md:mt-6 pb-8 md:pb-10">
          {images.length > 0 ? (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-2 sm:gap-3">
              {images.map((src, index) => (
                <motion.div
                  key={`${couple.slug}-${index}`}
                  className="mb-2 sm:mb-3 break-inside-avoid overflow-hidden bg-[#f0ede5] cursor-pointer group"
                  initial={{
                    opacity: 0,
                    y: 10,
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
                    duration: 0.4,
                    delay: Math.min(index * 0.03, 0.2),
                  }}
                  onClick={() => setActiveIndex(index)}
                >
                  <img
                    src={src}
                    alt={`${couple.name} - Moment ${index + 1}`}
                    className="w-full h-auto block object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-[#e5e2dc]">
              <p className="text-sm text-gray-600">
                No images uploaded to this album yet.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                You can add photos in Admin &gt; Gallery Management &gt; Manage Photos.
              </p>
            </div>
          )}
        </section>

        {/* ===============================================
            BOTTOM BUTTON
        =============================================== */}

        <section className="pb-8 md:pb-10 text-center">
          <Link
            to="/gallery"
            className="inline-block px-6 py-2.5 border border-[#181715] text-[10px] uppercase tracking-[0.22em] text-[#181715] hover:bg-[#181715] hover:text-white transition-all duration-300"
          >
            View All Stories
          </Link>
        </section>
      </main>

      {/* ===============================================
          FULLSCREEN LIGHTBOX MODAL
      =============================================== */}

      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setActiveIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveIndex(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#9b7740] transition-colors duration-300"
              aria-label="Close"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* Previous Button */}
            <button
              onClick={prevImage}
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#9b7740] transition-colors duration-300"
              aria-label="Previous Image"
            >
              <ChevronLeft size={24} strokeWidth={1.5} />
            </button>

            {/* Image Display */}
            <motion.img
              key={activeIndex}
              src={images[activeIndex]}
              alt={`${couple.name} - Full View ${activeIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next Button */}
            <button
              onClick={nextImage}
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#9b7740] transition-colors duration-300"
              aria-label="Next Image"
            >
              <ChevronRight size={24} strokeWidth={1.5} />
            </button>

            {/* Bottom Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-widest uppercase">
              {activeIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}