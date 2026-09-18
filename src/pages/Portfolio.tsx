import React, { useRef, useState, useEffect, useCallback, createContext, useContext } from 'react'
import {
  ArrowUpRight,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
} from 'framer-motion'
import type { CloudinaryUploadResult } from '../services/cloudinary'
import { readApiJson } from '../services/api'

interface PortfolioImage {
  url: string;
  visible?: boolean;
}

interface PortfolioStory {
  id: string;
  title: string;
  date: string;
  strapline: string;
  paragraphs: string[];
  videoUrl?: string;
  images?: Array<string | PortfolioImage>;
}

interface PortfolioContent {
  heroEyebrow: string;
  heroLabel: string;
  heroLine1: string;
  heroLine2: string;
  heroLine3: string;
  heroVideoUrl: string;
  stories: PortfolioStory[];
  ctaEyebrow: string;
  ctaLine1: string;
  ctaLine2: string;
  ctaDescription: string;
  ctaButtonText: string;
  ctaButtonHref: string;
}

type CursorState = { variant: string; label: string };
type LightboxState =
  | { type: 'image'; storyId: string; images: string[]; index: number }
  | { type: 'video'; src: string }
  | null;

const PORTFOLIO_API_URL =
    import.meta.env.VITE_PHP_API_URL ||
    ''

/* =========================================================
   ASSET IMPORTS
========================================================= */

const imageFiles = import.meta.glob(
  '../assets/portfolio/wedding/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true, import: 'default' }
)

const videoLoaders = import.meta.glob(
  '../assets/portfolio/wedding/**/*.{mp4,mov,MP4,MOV}'
)

// Helper to find specific assets by folder and partial filename
function findAsset<T>(map: Record<string, T>, folder: string, partialName: string): T | null {
  const entries = Object.entries(map) as [string, T][]
  const found = entries.find(([path]) => {
    const normalized = path.replace(/\\/g, '/').toLowerCase()
    return (
      normalized.includes(`/wedding/${folder.toLowerCase()}/`) &&
      normalized.includes(partialName.toLowerCase())
    )
  })
  return found?.[1] || null
}

// Helper to fetch ALL images from a specific folder automatically
function getFolderImages(folderName: string): string[] {
  return Object.keys(imageFiles)
    .filter(path => {
      const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
      return normalizedPath.includes(`/wedding/${folderName.toLowerCase()}/`);
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map(path => imageFiles[path] as string);
}

/* Fetching ALL Images from respective folders */
const kapilPayalImages = getFolderImages('Kapil&Payal1');
const pratikMeghaImages = getFolderImages('PRATIK & MEGHA');
const tanmayAchalImages = getFolderImages('Tanmay&Achal');

// Specific loaders for Hero
const video2Loader = findAsset<() => Promise<unknown>>(videoLoaders, 'video2/VIDEOS', 'KAPIL PAYAL WEDDING FILM')

/* =========================================================
   FOLDER KEY → LOCAL IMAGES MAP
========================================================= */

const FOLDER_IMAGES_MAP: Record<string, string[]> = {
  'kapil-payal': kapilPayalImages,
  'pratik-megha': pratikMeghaImages,
  'tanmay-achal': tanmayAchalImages,
  'rohan-anjali': tanmayAchalImages,
};

/* =========================================================
   DEFAULT PORTFOLIO CONTENT (4 Stories)
========================================================= */

const DEFAULT_STORIES = [
  {
    id: 'kapil-payal',
    title: 'KAPIL & PAYAL',
    date: 'October 24, 2024',
    strapline: 'A homecoming, dressed in gold',
    paragraphs: [
      "From the horse that carried Kapil through Nagpur to the quiet moments between rituals, every frame here is a visual heirloom of their beautiful beginning.",
    ],
  },
  {
    id: 'pratik-megha',
    title: 'PRATIK & MEGHA',
    date: 'August 12, 2024',
    strapline: 'Modern love, old rituals',
    paragraphs: [
      "A day that moved like a story that already knew its ending — candid laughter, timeless traditions, and two families becoming one.",
    ],
  },
  {
    id: 'tanmay-achal',
    title: 'TANMAY & ACHAL',
    date: 'August 3, 2024',
    strapline: 'An intimate kind of grandeur',
    paragraphs: [
      "Low light, an unhurried pace, and a small circle of people who mattered most — a quiet, timeless archive of their most tender moments.",
    ],
  },
  {
    id: 'rohan-anjali',
    title: 'ROHAN & ANJALI',
    date: 'November 15, 2024',
    strapline: 'A vibrant modern classic',
    paragraphs: [
      "Blending contemporary aesthetics with timeless traditions, their wedding was a canvas of vibrant emotions and architectural elegance.",
    ],
  },
];

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
  ctaDescription: 'Every celebration has a story. We are here to preserve yours beautifully.',
  ctaButtonText: 'Start Your Story',
  ctaButtonHref: '/contact',
};

/* =========================================================
   DESIGN TOKENS
========================================================= */

const COLOR = {
  paper: '#F9F7F2',      // Match Contact page
  paperDeep: '#F0EDE6',
  ink: '#171717',
  inkSoft: '#6b6259',
  gold: '#9b7740',
}

const FONT_DISPLAY = "'Fraunces', 'Iowan Old Style', Georgia, serif"
const FONT_BODY = "'Manrope', ui-sans-serif, system-ui, sans-serif"
const EASE_EXPO = [0.19, 1, 0.22, 1] as const

const CursorContext = createContext<(next: Partial<CursorState>) => void>(() => {})
const useSetCursor = () => useContext(CursorContext)

/* =========================================================
   HOOKS & GLOBAL EFFECTS
========================================================= */

function useIsFinePointer() {
  const [isFine, setIsFine] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mq = window.matchMedia('(pointer: fine)')
    setIsFine(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsFine(e.matches)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener(handler)
    }
  }, [])
  return isFine
}

function useGoogleFonts() {
  useEffect(() => {
    const id = 'san-portfolio-clean-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,400&family=Manrope:wght@300;400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])
}

function useLazyVideoSrc(loader: (() => Promise<unknown>) | null, enabled = true) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled || !loader || src) return
    let active = true
    loader().then((mod: unknown) => {
      if (active && typeof mod === 'object' && mod !== null && 'default' in mod && typeof mod.default === 'string') {
        setSrc(mod.default)
      }
    })
    return () => {
      active = false
    }
  }, [enabled, loader, src])
  return src
}

function GlobalMotionStyles() {
  return (
    <style>{`
      html, body { background-color: ${COLOR.paper}; }
      html { scroll-behavior: smooth; }
      body {
        overscroll-behavior: none;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      ::selection { background: ${COLOR.ink}; color: ${COLOR.paper}; }
      ::-webkit-scrollbar { width: 0px; }
      .san-story-row { scrollbar-width: none; -ms-overflow-style: none; scroll-snap-type: x mandatory; }
      .san-story-row::-webkit-scrollbar { display: none; }
      .san-story-slide { scroll-snap-align: start; }
    `}</style>
  )
}

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.2 })
  return <motion.div className="fixed left-0 top-0 z-[95] h-[3px] w-full origin-left" style={{ scaleX, backgroundColor: COLOR.ink }} />
}

interface CustomCursorProps { variant: string; label: string }

function CustomCursor({ variant, label }: CustomCursorProps) {
  const isFine = useIsFinePointer()
  const mx = useMotionValue(-200)
  const my = useMotionValue(-200)
  const sx = useSpring(mx, { stiffness: 500, damping: 40, mass: 0.3 })
  const sy = useSpring(my, { stiffness: 500, damping: 40, mass: 0.3 })

  useEffect(() => {
    if (!isFine) return undefined
    const move = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [isFine, mx, my])

  if (!isFine) return null
  const isView = variant === 'view'

  return (
    <motion.div className="pointer-events-none fixed left-0 top-0 z-[100] mix-blend-difference" style={{ x: sx, y: sy }}>
      <div className="-translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: isView ? 1 : 0, opacity: isView ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE_EXPO }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-black">
            {label || 'View'}
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* =========================================================
   REVEAL HEADING
========================================================= */

interface RevealLine { text: string; italic?: boolean; block?: boolean }
interface RevealHeadingProps { lines: RevealLine[]; as?: 'h1' | 'h2' | 'h3'; className?: string; delayStart?: number }

function RevealHeading({ lines, as = 'h2', className = '', delayStart = 0 }: RevealHeadingProps) {
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const MotionTag = motion[as as keyof typeof motion] as React.ElementType
  let wordIndex = 0

  return (
    <MotionTag ref={ref} className={className}>
      {lines.map((line: RevealLine, li: number) => {
        const words = (line.text || '').split(' ')
        const content = words.map((word: string, wi: number) => {
          const i = wordIndex++
          return (
            <span key={wi} className="inline-block overflow-hidden pb-[0.15em] align-bottom">
              <motion.span
                className={`inline-block will-change-transform ${line.italic ? 'italic font-light' : ''}`}
                initial={{ y: '110%' }}
                animate={inView ? { y: '0%' } : {}}
                transition={{ duration: 1.2, ease: EASE_EXPO, delay: delayStart + i * 0.06 }}
              >
                {word}{wi < words.length - 1 ? '\u00A0' : ''}
              </motion.span>
            </span>
          )
        })
        return line.block ? <span key={li} className="block">{content}</span> : <span key={li}>{content} </span>
      })}
    </MotionTag>
  )
}

/* =========================================================
   SMART IMAGE
========================================================= */

interface SmartImageProps { src: string; alt: string; className?: string; onClick?: () => void }

function SmartImage({ src, alt, className = '', onClick }: SmartImageProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useSpring(useTransform(scrollYProgress, [0, 1], ['-10%', '10%']), { stiffness: 80, damping: 25 })

  const setCursor = useSetCursor()
  const cursorProps = {
    onMouseEnter: () => setCursor({ variant: 'view', label: 'View' }),
    onMouseLeave: () => setCursor({ variant: 'default' })
  }

  if (!src) return null;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-[${COLOR.paperDeep}] cursor-pointer ${className}`}
      onClick={onClick}
      {...cursorProps}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-[#ECE6DA]" />
      )}
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute -top-[10%] left-0 w-full h-[120%] object-cover object-center transition-transform duration-700 group-hover:scale-105 ${loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-xl'}`}
        style={{ y }}
      />
    </div>
  )
}

/* =========================================================
   STORY EDITORIAL SECTION
========================================================= */

function chunkItems(items: string[], size = 8): string[][] {
  const groups: string[][] = []
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size))
  }
  return groups
}

interface StoryCompositionProps { group: string[]; title: string; offset?: number; onItemClick: (image: string, index: number) => void }

function StoryComposition({ group, title, offset = 0, onItemClick }: StoryCompositionProps) {
  const [big1, g1, g2, g3, g4, g5, g6, big2] = group
  const smallsTop = [g1, g2]
  const smallsMid = [g3, g4, g5, g6]

  const handleClick = (image: string, index: number) => {
    onItemClick(image, offset + index)
  }

  // Mobile-first: 2 column grid to reduce scrolling, then flex mosaic on md+
  return (
    <div className="san-story-slide w-full flex-none snap-start">
      <div className="grid grid-cols-2 gap-1.5 md:flex md:h-[42vh] md:min-h-[280px] md:max-h-[420px] md:gap-1.5">
        {big1 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative aspect-[4/5] w-full md:aspect-auto md:h-full"
          >
            <SmartImage src={big1} alt={`${title} 1`} className="absolute inset-0 h-full w-full" onClick={() => handleClick(big1, 0)} />
          </motion.div>
        )}

        {smallsTop.some(Boolean) && (
          <div className="grid grid-rows-2 gap-1.5 md:h-full">
            {smallsTop.map((img, i) => img && (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.05 * (i + 1) }}
                className="relative aspect-[4/3] w-full md:aspect-auto md:h-full"
              >
                <SmartImage src={img} alt={`${title} ${i + 2}`} className="absolute inset-0 h-full w-full" onClick={() => handleClick(img, i + 1)} />
              </motion.div>
            ))}
          </div>
        )}

        {smallsMid.some(Boolean) && (
          <div className="grid grid-cols-2 grid-rows-2 gap-1.5 md:h-full">
            {smallsMid.map((img, i) => img && (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.05 * (i + 3) }}
                className="relative aspect-square w-full md:aspect-auto md:h-full"
              >
                <SmartImage src={img} alt={`${title} ${i + 4}`} className="absolute inset-0 h-full w-full" onClick={() => handleClick(img, i + 3)} />
              </motion.div>
            ))}
          </div>
        )}

        {big2 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative aspect-[4/5] w-full md:aspect-auto md:h-full"
          >
            <SmartImage src={big2} alt={`${title} 8`} className="absolute inset-0 h-full w-full" onClick={() => handleClick(big2, 7)} />
          </motion.div>
        )}
      </div>
    </div>
  )
}

interface StoryRowProps { items: string[]; title: string; onItemClick: (image: string, index: number) => void }

function StoryRow({ items, title, onItemClick }: StoryRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null)
  const groups = chunkItems(items, 8)
  const [active, setActive] = useState(0)
  const hasMultiple = groups.length > 1

  const scrollToIndex = (index: number) => {
    const el = rowRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(groups.length - 1, index))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
    setActive(clamped)
  }

  const handleScroll = () => {
    const el = rowRef.current
    if (!el || !el.clientWidth) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="relative">
      <div
        ref={rowRef}
        onScroll={hasMultiple ? handleScroll : undefined}
        className="san-story-row flex overflow-x-auto scroll-smooth gap-0 pl-0"
      >
        {groups.map((group, gi) => (
          <StoryComposition
            key={gi}
            group={group}
            title={title}
            offset={gi * 8}
            onItemClick={onItemClick}
          />
        ))}
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollToIndex(active - 1)}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#F9F7F2]/90 text-[#171717] shadow-md backdrop-blur transition-transform duration-300 hover:scale-105 md:h-11 md:w-11"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollToIndex(active + 1)}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#F9F7F2]/90 text-[#171717] shadow-md backdrop-blur transition-transform duration-300 hover:scale-105 md:h-11 md:w-11"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </>
      )}
    </div>
  )
}

interface FeaturedStoriesProps {
  stories: PortfolioStory[];
  onImageClick: (storyId: string, images: string[], index: number) => void;
  onVideoClick: (src: string) => void;
}

function FeaturedStories({ stories, onImageClick, onVideoClick }: FeaturedStoriesProps) {
  return (
    // Reduced top/bottom padding: py-6 md:py-10
    <section className="relative bg-[#F9F7F2] py-6 md:py-10">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-12">
        {stories.map((story, index) => {
          const localImages = FOLDER_IMAGES_MAP[story.id] || [];

          // Cloudinary/MySQL images are authoritative when saved.
          // Hidden images remain stored but are excluded from the public gallery.
          // Backward compatibility: old string entries are treated as visible.
          const remoteImages = Array.isArray(story.images)
            ? story.images
                .filter((img: string | PortfolioImage) => {
                  if (typeof img === 'string') return Boolean(img);
                  return Boolean(img?.url) && img.visible !== false;
                })
                .map((img: string | PortfolioImage) => (typeof img === 'string' ? img : img.url))
            : [];

          const storyImages = remoteImages.length > 0
            ? remoteImages
            : localImages;

          return (
            // Reduced margins and top padding
            <div key={story.id || index} className="mb-6 border-t border-black/10 pt-4 md:mb-10 md:pt-6">

              {/* Text Content - Mobile-first sizing */}
              <RevealHeading
                lines={[{ text: story.title || '', block: true }]}
                className="text-[1.5rem] md:text-[clamp(1.5rem,4vw,2.5rem)] font-light leading-[0.95] tracking-[-0.02em] text-[#171717]"
              />
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mt-2 text-[10px] md:text-xs uppercase tracking-[0.2em] text-[#9b7740]"
                style={{ fontFamily: FONT_BODY }}
              >
                {story.date}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1, ease: EASE_EXPO }}
                className="mt-2 w-full text-base md:text-lg lg:text-xl italic leading-6 md:leading-7 text-[#171717]"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                &lsquo;{story.strapline}
              </motion.p>

              <div className="mt-3 w-full max-w-3xl space-y-2">
                {(story.paragraphs || []).map((p, pi) => (
                  <motion.p
                    key={pi}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.15 + pi * 0.1, ease: EASE_EXPO }}
                    className="text-xs md:text-sm lg:text-base leading-6 md:leading-7 text-[#555]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {p}
                  </motion.p>
                ))}
              </div>

              {/* Couple's film - Width increased to match photos, Height reduced, mobile-first */}
              {story.videoUrl && (() => {
                const videoUrl = story.videoUrl;
                return (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="mt-4 md:mt-6"
                >
                  <div 
                    // Height reduced further as requested
                    className="relative w-full overflow-hidden rounded-lg h-[16vh] min-h-[120px] md:h-[18vh] md:min-h-[140px] md:max-h-[180px] cursor-pointer group"
                    onClick={() => onVideoClick(videoUrl)}
                  >
                    <CleanVideoReel src={videoUrl} className="absolute inset-0 h-full w-full" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                      <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
                        <Play size={20} className="text-white md:h-6 md:w-6" />
                      </div>
                    </div>
                  </div>
                </motion.div>
                )
              })()}

              {/* Photos Grid - Reduced top margin */}
              {storyImages.length > 0 && (
                <div className="mt-4 md:mt-6">
                  <StoryRow
                    items={storyImages}
                    title={story.title || ''}
                    onItemClick={(_item: string, imageIndex: number) => onImageClick(story.id, storyImages, imageIndex)}
                  />
                </div>
              )}

            </div>
          );
        })}
      </div>
    </section>
  )
}

/* =========================================================
   CLEAN VIDEO REEL
========================================================= */

interface CleanVideoReelProps { src: string; className?: string }

function CleanVideoReel({ src, className = '' }: CleanVideoReelProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useSpring(useTransform(scrollYProgress, [0, 1], ['-5%', '5%']), { stiffness: 80, damping: 25 })

  return (
    <div ref={ref} className={`relative overflow-hidden bg-black ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-black" />
      )}
      {src && (
        <motion.div className="absolute -top-[5%] left-0 h-[110%] w-full" style={{ y }}>
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            className={`h-full w-full object-cover object-center transition-opacity duration-700 ${loaded ? 'opacity-90' : 'opacity-0'}`}
          />
        </motion.div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </div>
  )
}

/* =========================================================
   LIGHTBOX MODAL
========================================================= */

interface LightboxProps {
  src?: string;
  images?: string[];
  index?: number;
  type: 'image' | 'video';
  onClose: () => void;
  onNavigate: (direction: number) => void;
}

function Lightbox({ src, images = [], index = 0, type, onClose, onNavigate }: LightboxProps) {
  const total = type === 'image' ? images.length : 0
  const currentIndex = type === 'image' ? Math.min(Math.max(index, 0), Math.max(total - 1, 0)) : 0
  const currentSrc = type === 'image' ? images[currentIndex] : src

  useEffect(() => {
    if (type !== 'image') return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
      if (event.key === 'ArrowLeft') onNavigate?.(-1)
      if (event.key === 'ArrowRight') onNavigate?.(1)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [type, onClose, onNavigate])

  if (type === 'video' && !src) return null
  if (type === 'image' && !currentSrc) return null

  const hasPrev = type === 'image' && currentIndex > 0
  const hasNext = type === 'image' && currentIndex < total - 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-16"
      onClick={onClose}
    >
      {type === 'image' && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            disabled={!hasPrev}
            onClick={(e) => { e.stopPropagation(); onNavigate?.(-1) }}
            className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-lg text-white transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-30 md:left-8"
          >
            <ChevronLeft size={20} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Next image"
            disabled={!hasNext}
            onClick={(e) => { e.stopPropagation(); onNavigate?.(1) }}
            className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-lg text-white transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-30 md:right-8"
          >
            <ChevronRight size={20} strokeWidth={1.8} />
          </button>
        </>
      )}

      <button
        type="button"
        className="absolute right-4 top-4 z-20 text-white/80 transition-colors hover:text-white md:right-8 md:top-8"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={28} strokeWidth={1.5} />
      </button>

      {type === 'video' ? (
        <motion.video
          src={src}
          autoPlay
          loop
          controls
          className="max-h-[90vh] max-w-[95vw] md:max-w-[90vw] object-contain shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE_EXPO }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <motion.img
          src={currentSrc}
          alt="Full view"
          className="max-h-[90vh] max-w-[95vw] md:max-w-[90vw] object-contain shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE_EXPO }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {type === 'image' && total > 0 && (
        <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-[11px] font-medium tracking-[0.26em] text-white/90 uppercase">
          {currentIndex + 1} / {total}
        </div>
      )}
    </motion.div>
  )
}

/* =========================================================
   MAIN PORTFOLIO COMPONENT
========================================================= */

function Portfolio() {
  useGoogleFonts()
  const [cursor, setCursorState] = useState<CursorState>({ variant: 'default', label: '' })
  const setCursor = useCallback((next: Partial<CursorState>) => setCursorState((prev) => ({ ...prev, ...next })), [])

  const [lightboxState, setLightboxState] = useState<LightboxState>(null);
  const [portfolioContent, setPortfolioContent] = useState<PortfolioContent>(DEFAULT_PORTFOLIO);

  const handleLightboxNavigate = useCallback((direction: number) => {
    setLightboxState((prev) => {
      if (!prev || prev.type !== 'image' || !Array.isArray(prev.images) || !prev.images.length) {
        return prev
      }

      const total = prev.images.length
      const nextIndex = Math.min(Math.max(prev.index + direction, 0), total - 1)
      return { ...prev, index: nextIndex }
    })
  }, [])

  const heroRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroTextY = useSpring(useTransform(heroProgress, [0, 1], ['0%', '50%']), { stiffness: 80, damping: 20 })
  const heroTextOpacity = useTransform(heroProgress, [0, 0.8], [1, 0])
  const heroVideoScale = useSpring(useTransform(heroProgress, [0, 1], [1, 1.3]), { stiffness: 80, damping: 20 })

  const localHeroVideoSrc = useLazyVideoSrc(video2Loader, true)
  const heroVideoSrc = portfolioContent.heroVideoUrl || localHeroVideoSrc
  const [heroVideoReady, setHeroVideoReady] = useState(false)

  const handleImageClick = (storyId: string, images: string[], index: number) => setLightboxState({ storyId, images, index, type: 'image' });
  const handleVideoClick = (src: string) => setLightboxState({ src, type: 'video' });

  // Fetch dynamic portfolio content from API
  useEffect(() => {
    let isMounted = true
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`${PORTFOLIO_API_URL}/api/portfolio.php`)
        const data = await readApiJson(res, 'Portfolio')
        if (isMounted && data.success && data.portfolio) {
          const remote = data.portfolio
          
          // Keep the four existing editorial story positions fixed.
          // Saved Story N updates only Story N; missing positions retain defaults.
          const remoteStories = Array.isArray(remote.stories) ? remote.stories : [];
          const finalStories = DEFAULT_PORTFOLIO.stories.map((fallback, index) => ({
            ...fallback,
            ...(remoteStories[index] || {}),
            id: fallback.id,
            title: remoteStories[index]?.title ?? fallback.title,
            date: remoteStories[index]?.date ?? fallback.date,
            strapline: remoteStories[index]?.strapline ?? fallback.strapline,
            paragraphs: Array.isArray(remoteStories[index]?.paragraphs)
              ? remoteStories[index].paragraphs
              : fallback.paragraphs,
            videoUrl: remoteStories[index]?.videoUrl ?? '',
            images: Array.isArray(remoteStories[index]?.images)
              ? remoteStories[index].images
              : [],
          }));

          setPortfolioContent({
            heroEyebrow: remote.heroEyebrow ?? DEFAULT_PORTFOLIO.heroEyebrow,
            heroLabel: remote.heroLabel ?? DEFAULT_PORTFOLIO.heroLabel,
            heroLine1: remote.heroLine1 ?? DEFAULT_PORTFOLIO.heroLine1,
            heroLine2: remote.heroLine2 ?? DEFAULT_PORTFOLIO.heroLine2,
            heroLine3: remote.heroLine3 ?? DEFAULT_PORTFOLIO.heroLine3,
            heroVideoUrl: remote.heroVideoUrl ?? DEFAULT_PORTFOLIO.heroVideoUrl,
            stories: finalStories,
            ctaEyebrow: remote.ctaEyebrow ?? DEFAULT_PORTFOLIO.ctaEyebrow,
            ctaLine1: remote.ctaLine1 ?? DEFAULT_PORTFOLIO.ctaLine1,
            ctaLine2: remote.ctaLine2 ?? DEFAULT_PORTFOLIO.ctaLine2,
            ctaDescription: remote.ctaDescription ?? DEFAULT_PORTFOLIO.ctaDescription,
            ctaButtonText: remote.ctaButtonText ?? DEFAULT_PORTFOLIO.ctaButtonText,
            ctaButtonHref: remote.ctaButtonHref ?? DEFAULT_PORTFOLIO.ctaButtonHref,
          })
        }
      } catch (error) {
        console.error('Failed to fetch portfolio content:', error)
      }
    }

    fetchPortfolio()
    return () => { isMounted = false }
  }, [])

  const pc = portfolioContent

  return (
    <CursorContext.Provider value={setCursor}>
      <GlobalMotionStyles />
      <ScrollProgressBar />
      <CustomCursor variant={cursor.variant} label={cursor.label} />
      <AnimatePresence>
        {lightboxState?.type === 'image' && (
          <Lightbox
            images={lightboxState.images}
            index={lightboxState.index}
            type="image"
            onClose={() => setLightboxState(null)}
            onNavigate={handleLightboxNavigate}
          />
        )}
        {lightboxState?.type === 'video' && (
          <Lightbox
            src={lightboxState.src}
            type="video"
            onClose={() => setLightboxState(null)}
            onNavigate={handleLightboxNavigate}
          />
        )}
      </AnimatePresence>

      <main className="relative bg-[#F9F7F2] text-[#171717]" style={{ fontFamily: FONT_DISPLAY }}>

        {/* HERO SECTION - Mobile-first margins/padding */}
        <section
          ref={heroRef}
          className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-black mt-20 sm:mt-24 md:h-[74vh] md:min-h-[460px] lg:mt-36"
        >
          <motion.div className="absolute inset-0 h-full w-full" style={{ scale: heroVideoScale }}>
            {heroVideoSrc && (
              <video
                src={heroVideoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onLoadedData={() => setHeroVideoReady(true)}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${heroVideoReady ? 'opacity-70' : 'opacity-0'}`}
              />
            )}
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30" />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: EASE_EXPO }}
            className="absolute left-4 top-4 sm:left-10 sm:top-8 lg:left-16"
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#C9A467]" />
              <p className="text-[8px] uppercase tracking-[0.4em] text-white/70 sm:text-[9px] sm:tracking-[0.45em]">{pc.heroEyebrow}</p>
            </div>
          </motion.div>

          <motion.div
            className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-10 sm:pb-14 lg:px-16 lg:pb-16"
            style={{ y: heroTextY, opacity: heroTextOpacity }}
          >
            <div className="mx-auto max-w-7xl">
              <p className="mb-2 text-[8px] uppercase tracking-[0.4em] text-[#C9A467] sm:mb-4 sm:text-[9px] sm:tracking-[0.45em]">{pc.heroLabel}</p>
              <RevealHeading
                as="h1"
                lines={[
                  { text: pc.heroLine1 || 'Timeless', block: true },
                  { text: pc.heroLine2 || 'moments,', italic: true, block: true },
                  { text: pc.heroLine3 || 'beautifully captured.', block: true }
                ]}
                className="max-w-6xl text-[clamp(2rem,8vw,6rem)] font-light leading-[0.9] tracking-[-0.04em] text-white sm:leading-[0.86] sm:tracking-[-0.065em]"
              />
            </div>
          </motion.div>
        </section>

        {/* FEATURED STORIES (Independent story images + independent story videos) */}
        <FeaturedStories
          stories={pc.stories || []}
          onImageClick={handleImageClick}
          onVideoClick={handleVideoClick}
        />

        {/* FINAL CTA - Mobile-first adjustments */}
        <section id="contact" className="relative flex items-center justify-center overflow-hidden bg-[#F9F7F2] px-4 py-12 text-center sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EASE_EXPO }}
            className="relative z-10 mx-auto max-w-5xl"
          >
            <p className="text-[9px] uppercase tracking-[0.45em] text-[#9b7740]">{pc.ctaEyebrow}</p>
            <RevealHeading
              lines={[
                { text: pc.ctaLine1 || 'Your story.', block: true },
                { text: pc.ctaLine2 || 'Our frame.', italic: true, block: true }
              ]}
              className="mt-3 text-[clamp(1.75rem,5vw,4.2rem)] font-light leading-[0.9] tracking-[-0.06em] text-[#171717] sm:mt-4"
            />
            <p className="mx-auto mt-4 max-w-lg text-xs leading-6 text-[#555] sm:text-sm sm:leading-7" style={{ fontFamily: FONT_BODY }}>{pc.ctaDescription}</p>
            <a
              href={pc.ctaButtonHref || '/contact'}
              className="group mt-6 inline-flex items-center gap-3 bg-[#171717] px-6 py-3 text-[9px] uppercase tracking-[0.3em] text-[#F9F7F2] transition-all duration-500 hover:bg-[#9b7740] sm:gap-4 sm:px-7 sm:py-3.5 sm:text-[10px]"
            >
              {pc.ctaButtonText}
              <ArrowUpRight size={14} strokeWidth={1.2} className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 sm:h-4 sm:w-4" />
            </a>
          </motion.div>
        </section>

      </main>
    </CursorContext.Provider>
  )
}

export default Portfolio