import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { API_URL, buildApiUrl, readApiJson } from '../services/api'

import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Heart,
  Camera,
  Sparkles,
  Aperture,
  Quote,
  Play,
} from 'lucide-react'

import {
  motion,
  useInView,
} from 'framer-motion'

import { Link } from 'react-router-dom'

interface HomeSlide {
  id?: string;
  _id?: string;
  image?: string;
  url?: string;
  order?: number;
}

interface HomeImage {
  url?: string;
  image?: string;
  visible?: boolean;
}

interface HomeVideo {
  id?: string;
  title: string;
  description?: string;
  url: string;
}

interface Testimonial {
  quote: string;
  author: string;
}

interface HomeContent {
  slides: HomeSlide[];
  about: Record<string, string>;
  collage: { heading: string; eyebrow: string; images: Array<string | HomeImage> };
  couples: { heading: string; italicHeading: string; items: Array<Record<string, string>> };
  videos: { eyebrow: string; heading: string; italicHeading: string; items: HomeVideo[] };
  soulCinema: { eyebrow: string; brandEyebrow: string; heading: string; description: string; videoUrl: string };
  testimonials: { eyebrow: string; items: Testimonial[] };
}

interface HomeApiContent {
  home?: Partial<HomeContent>;
}

/* =========================================================
   API
========================================================= */

const API_BASE_URL = API_URL

/* =========================================================
   HERO IMAGES
========================================================= */



/* =========================================================
   PORTFOLIO IMAGES
========================================================= */

const portfolioFiles = import.meta.glob(
  '../assets/portfolio/wedding/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  {
    eager: true,
    import: 'default',
  }
)

/* =========================================================
   PORTFOLIO VIDEOS (Fetches MP4 files dynamically, case-insensitive)
========================================================= */

const videoFiles2 = import.meta.glob(
  '../assets/portfolio/wedding/video2/**/*.{mp4,MP4,mov,MOV,webm}',
  {
    eager: true,
    import: 'default',
  }
)

const videoFiles3 = import.meta.glob(
  '../assets/portfolio/wedding/video3/**/*.{mp4,MP4,mov,MOV,webm}',
  {
    eager: true,
    import: 'default',
  }
)

// Extract the video URLs into arrays
const allVideoUrls2 = Object.values(videoFiles2) as string[]
const allVideoUrls3 = Object.values(videoFiles3) as string[]

function findPortfolioImage(
  folder: string,
  filename: string
): string | null {
  const entries = Object.entries(portfolioFiles) as [string, string][]

  const found =
    entries.find(([path]) => {
      const normalized =
        path.replace(/\\/g, '/')

      return (
        normalized.includes(
          `/wedding/${folder}/`
        ) &&
        normalized
          .toLowerCase()
          .includes(
            `/${filename.toLowerCase()}.`
          )
      )
    })

  return found?.[1] || null
}

/* =========================================================
   VIDEO LOOKUP BY FILENAME (case-insensitive, partial match)
========================================================= */

function findVideoByName(
  files: Record<string, unknown>,
  filename: string
): string | null {
  const entries = Object.entries(files) as [string, string][]

  const found =
    entries.find(([path]) => {
      const normalized =
        path
          .replace(/\\/g, '/')
          .toLowerCase()

      return normalized.includes(
        filename.toLowerCase()
      )
    })

  return found?.[1] || null
}

/* =========================================================
   LOCAL PORTFOLIO IMAGE LOOKUP
========================================================= */

const kapilPayal01 =
  findPortfolioImage(
    'Kapil&Payal1',
    '02'
  ) ||
  findPortfolioImage(
    'Kapil&Payal1',
    '035A2163'
  )

const kapilPayal02 =
  findPortfolioImage(
    'Kapil&Payal1',
    '035A2853'
  ) ||
  findPortfolioImage(
    'Kapil&Payal1',
    '035A2709'
  )

const kapilPayal03 =
  findPortfolioImage(
    'Kapil&Payal1',
    '035A3022'
  ) ||
  findPortfolioImage(
    'Kapil&Payal1',
    '035A2933'
  )

const pratikMegha01 =
  findPortfolioImage(
    'PRATIK & MEGHA',
    'DSC00039'
  )

const pratikMegha02 =
  findPortfolioImage(
    'PRATIK & MEGHA',
    'DSC00048'
  )

const pratikMegha03 =
  findPortfolioImage(
    'PRATIK & MEGHA',
    'DSC00067'
  )

const tanmayAchal01 =
  findPortfolioImage(
    'Tanmay&Achal',
    '01'
  )

const tanmayAchal02 =
  findPortfolioImage(
    'Tanmay&Achal',
    '02'
  )

const tanmayAchal03 =
  findPortfolioImage(
    'Tanmay&Achal',
    '05'
  )

const image01 = kapilPayal01;

const image02 = kapilPayal02;

const image03 = kapilPayal03;

const image04 = pratikMegha01;

const image05 = pratikMegha02;

const image06 = pratikMegha03;

const image07 = tanmayAchal01;

const image08 = tanmayAchal02;

const image09 = tanmayAchal03;

/* =========================================================
   SOUL CINEMA VIDEO (specific file from /video2/VIDEOS)
========================================================= */

const soulCinemaVideo =
  findVideoByName(
    videoFiles2,
    'KAPIL PAYAL WEDDING FILM HIGH CORRECTION'
  ) ||
  allVideoUrls3[0] ||
  allVideoUrls2[0] ||
  null

/* =========================================================
   DESIGN TOKENS
========================================================= */

const COLOR = {
  paper: '#FAFAF8',
  paperDeep: '#FAFAF8',
  ink: '#181715',
  inkSoft: '#69635B',
  gold: '#9B7B45',
  goldLight: '#C8B28B',
  white: '#FFFFFF',
}

const FONT_DISPLAY =
  "'Cormorant Garamond', Georgia, serif"

const FONT_BODY =
  "'Manrope', Arial, sans-serif"

/* =========================================================
   GOOGLE FONTS
========================================================= */

function useGoogleFonts() {
  useEffect(() => {
    const id =
      'san-home-google-fonts'

    if (
      document.getElementById(id)
    ) {
      return
    }

    const link =
      document.createElement('link')

    link.id = id
    link.rel = 'stylesheet'

    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Manrope:wght@300;400;500;600;700&display=swap'

    document.head.appendChild(link)
  }, [])
}

/* =========================================================
   DEFAULT HOME CONTENT (MATCHING CURRENT HOME PAGE EXACTLY)
========================================================= */

const DEFAULT_HERO_SLIDES = [
  {
    id: 'fallback-1',
    image: '',
  },
  {
    id: 'fallback-2',
    image: '',
  },
  {
    id: 'fallback-3',
    image: '',
  },
]

const DEFAULT_HOME_CONTENT: HomeContent = {
  slides: [
    { id: 'hero-1', image: '' },
    { id: 'hero-2', image: '' },
    { id: 'hero-3', image: '' },
  ],

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
    
  },

  collage: {
    heading:
      'What if it could never be recorded? A chronology of a couples journey where they vow together to be One.',
    eyebrow: 'WE ARE CREATING FICTION OUT OF REALITY',
    images: [],
  },

  couples: {
    heading: 'Real love',
    italicHeading: 'stories.',
    items: [
      { id: 'couple-0', name: 'Kapil & Payal', img: '' },
      { id: 'couple-1', name: 'Pratik & Megha', img: '' },
      { id: 'couple-2', name: 'Tanmay & Achal', img: '' },
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
      { 
        id: 'video-1', 
        title: 'Love In Second Innings // Deepal x Nishant // Mumbai', 
        description: 'A beautiful tale of finding love again. Two souls merging their paths into one, proving that second chances can be the most beautiful beginning of all.',
        url: '' 
      },
      { 
        id: 'video-2', 
        title: 'Twenty Years in the Making // Aman x Shruti // London', 
        description: 'From schoolyard crushes to a lifelong commitment, this cross-border love story blossomed over two decades, culminating in a wedding worth the wait.',
        url: '' 
      },
      { 
        id: 'video-3', 
        title: 'A Soulful Cinematic Tale // Kapil x Payal // Pune', 
        description: 'An intimate celebration of love, culture, and raw emotions. Every frame captures the essence of their bond, framed with soul and cinematic grace.',
        url: '' 
      },
      { 
        id: 'video-4', 
        title: 'Whispers of Forever // Rohan x Anjali // Jaipur', 
        description: 'A vibrant celebration blending modern aesthetics with timeless traditions. Every moment is captured with cinematic brilliance and heartfelt emotion.',
        url: '' 
      },
    ],
  },

  soulCinema: {
    eyebrow: 'AWARD WINNING FILMS',
    brandEyebrow: 'NI3 CINEMA & SAN',
    heading: 'SOUL + CINEMA',
    description:
      'Every frame tells a story — captured with heart, framed with soul, and made to be relived for a lifetime.',
    videoUrl: '',
  },

  testimonials: {
    eyebrow: 'KIND WORDS',
    items: [
      {
        quote:
          'Every photograph brought our memories back to life. The moments feel natural, emotional and truly ours.',
        author: 'A HAPPY SAN FAMILY',
      },
      {
        quote:
          'They captured the laughter, the tears and all the little details we never wanted to forget.',
        author: 'A HAPPY COUPLE',
      },
      {
        quote:
          'Beautiful work, wonderful team and memories we will cherish for a lifetime.',
        author: 'A HAPPY CLIENT',
      },
    ],
  },
}

/* =========================================================
   MERGE HOME CONTENT FROM API
========================================================= */

function mergeHomeContent(
  apiHome: Partial<HomeContent> = {}
): HomeContent {
  if (!apiHome || typeof apiHome !== 'object') {
    return DEFAULT_HOME_CONTENT
  }

  return {
    slides:
      Array.isArray(apiHome.slides)
        ? apiHome.slides
        : DEFAULT_HOME_CONTENT.slides,

    about: {
      ...DEFAULT_HOME_CONTENT.about,
      ...(apiHome.about || {}),
    },

    collage: {
      ...DEFAULT_HOME_CONTENT.collage,
      ...(apiHome.collage || {}),
      images:
        Array.isArray(apiHome.collage?.images)
          ? apiHome.collage.images
          : DEFAULT_HOME_CONTENT.collage.images,
    },

    couples: {
      ...DEFAULT_HOME_CONTENT.couples,
      ...(apiHome.couples || {}),
      items:
        Array.isArray(apiHome.couples?.items)
          ? apiHome.couples.items
          : [],
    },

    videos: {
      ...DEFAULT_HOME_CONTENT.videos,
      ...(apiHome.videos || {}),
      items:
        Array.isArray(apiHome.videos?.items)
          ? apiHome.videos.items
          : DEFAULT_HOME_CONTENT.videos.items,
    },

    soulCinema: {
      ...DEFAULT_HOME_CONTENT.soulCinema,
      ...(apiHome.soulCinema || {}),
    },

    testimonials: {
      ...DEFAULT_HOME_CONTENT.testimonials,
      ...(apiHome.testimonials || {}),
      items:
        Array.isArray(apiHome.testimonials?.items)
          ? apiHome.testimonials.items
          : DEFAULT_HOME_CONTENT.testimonials.items,
    },
  }
}

/* =========================================================
   FADE IN
========================================================= */

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

function FadeIn({
  children,
  delay = 0,
  className = '',
}: FadeInProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  const isInView =
    useInView(ref, {
      once: true,
      amount: 0.15,
    })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        y: 35,
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
            }
          : {}
      }
      transition={{
        duration: 0.9,
        delay,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ] as const,
      }}
    >
      {children}
    </motion.div>
  )
}

/* =========================================================
   SECTION HEADING
========================================================= */

interface SectionHeadingProps {
  eyebrow: string;
  heading: string;
  italicHeading?: string;
  light?: boolean;
}

function SectionHeading({
  eyebrow,
  heading,
  italicHeading,
  light = false,
}: SectionHeadingProps) {
  return (
    <div>
      <p
        className={`text-[9px] uppercase tracking-[0.42em] ${
          light
            ? 'text-white/55'
            : 'text-[#9B7B45]'
        }`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-3 text-xl sm:text-[clamp(1.5rem,3vw,2.5rem)] font-light leading-[1.1] tracking-[-0.025em] ${
          light
            ? 'text-white'
            : 'text-[#181715]'
        }`}
        style={{
          fontFamily:
            FONT_DISPLAY,
        }}
      >
        {heading}

        {italicHeading && (
          <span className="block italic">
            {italicHeading}
          </span>
        )}
      </h2>
    </div>
  )
}

/* =========================================================
   VIDEO CARD COMPONENT (In-place play with sound)
========================================================= */

interface VideoCardProps {
  videoItem: HomeVideo;
  videoSrc: string;
}

function VideoCard({ videoItem, videoSrc }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      // First click: activate, unmute, and play from start
      setIsActive(true);
      video.currentTime = 0;
      video.muted = false;
      video.play().catch(() => {});
    } else {
      // Subsequent clicks: toggle play/pause
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  };

  return (
    <div className="group flex flex-col">
      <div 
        className="relative w-full overflow-hidden bg-black aspect-video cursor-pointer transition-all duration-500"
        onClick={handleVideoClick}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted={!isActive} // Muted initially, unmuted on click
          loop
          playsInline
          preload="metadata"
          controls={isActive} // Show native controls once activated
          className="w-full h-full object-cover grayscale transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:scale-105"
        />
        
        {/* Show overlay & play button only before activation */}
        {!isActive && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-white/80 bg-black/30 backdrop-blur-sm opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110">
                <Play size={20} className="text-white ml-1" fill="white" strokeWidth={0} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Text Below Video - Responsive Font Sizes for 2-Column Layout */}
      <div className="mt-2 sm:mt-4 text-center px-1 sm:px-2">
        {videoItem.title && (
          <h3 className="text-[11px] sm:text-lg md:text-xl font-light text-[#181715] tracking-wide line-clamp-2" style={{ fontFamily: FONT_DISPLAY }}>
            {videoItem.title}
          </h3>
        )}
        {videoItem.description && (
          <p className="hidden sm:block mt-2 text-xs text-[#69635B] leading-relaxed max-w-md mx-auto line-clamp-2">
            {videoItem.description}
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TESTIMONIAL CAROUSEL
========================================================= */

interface TestimonialCarouselProps {
  items?: Testimonial[];
}

function TestimonialCarousel({
  items = [],
}: TestimonialCarouselProps) {
  const [index, setIndex] =
    useState(0)

  useEffect(() => {
    if (items.length < 2) {
      return undefined
    }

    const timer =
      setInterval(() => {
        setIndex(
          (previous) =>
            (previous + 1) %
            items.length
        )
      }, 6000)

    return () =>
      clearInterval(timer)
  }, [items.length])

  const item =
    items[index] || items[0]

  if (!item) {
    return null
  }

  return (
    <div className="mx-auto max-w-[800px] text-center">
      <Quote
        size={24}
        strokeWidth={1}
        className="mx-auto mb-3 text-black/20"
      />

      {items.map((it, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            opacity: i === index ? 1 : 0,
            y: i === index ? 0 : 20,
          }}
          transition={{ duration: 0.6 }}
          style={{ display: i === index ? 'block' : 'none' }}
        >
          <blockquote
            className="text-base sm:text-xl md:text-2xl lg:text-3xl font-light leading-[1.3]"
            style={{
              fontFamily:
                FONT_DISPLAY,
            }}
          >
            “{it.quote}”
          </blockquote>

          <p className="mt-4 text-[9px] uppercase tracking-[0.35em] text-black/45">
            {it.author}
          </p>
        </motion.div>
      ))}

      <div className="mt-5 flex justify-center gap-2">
        {items.map(
          (_, itemIndex) => (
            <button
              key={itemIndex}
              type="button"
              aria-label={`Testimonial ${
                itemIndex + 1
              }`}
              onClick={() =>
                setIndex(itemIndex)
              }
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === itemIndex
                  ? 'w-8 bg-black'
                  : 'w-1.5 bg-black/20'
              }`}
            />
          )
        )}
      </div>
    </div>
  )
}

/* =========================================================
   HOME (Footer Removed)
========================================================= */

function Home() {
  useGoogleFonts()

  /* =====================================================
     CONTENT
  ===================================================== */

  const [content, setContent] = useState<HomeApiContent | null>(null)

  const [sliders, setSliders] = useState<HomeSlide[]>([])

  const [sliderLoading, setSliderLoading] =
    useState(true)

  /* =====================================================
     FETCH HOME CONTENT
  ===================================================== */

  useEffect(() => {
    const controller =
      new AbortController()

    async function fetchContent() {
      try {
        const response =
          await fetch(
            buildApiUrl(API_BASE_URL, 'api/content.php'),
            {
              signal:
                controller.signal,
              cache: 'no-store',
            }
          )

        if (!response.ok) {
          throw new Error(
            `Content API error: ${response.status}`
          )
        }

        const data =
          await readApiJson(response, 'Home')

        if (
          data?.success &&
          data?.content
        ) {
          setContent(data.content)
          setSliders(
            Array.isArray(data.content.home?.slides)
              ? data.content.home.slides.filter((item: HomeSlide) => item?.image)
              : []
          )
          setSliderLoading(false)
        }
      } catch (error) {
        if (
          error instanceof Error && error.name !==
          'AbortError'
        ) {
          console.error(
            'Failed to load website content:',
            error
          )
        }
      }
    }

    fetchContent()

    return () =>
      controller.abort()
  }, [])

  /* =====================================================
     MERGED CONTENT
  ===================================================== */

  const homeContent =
    useMemo(
      () =>
        mergeHomeContent(
          content?.home || {}
        ),
      [content]
    )

  /* =====================================================
     ACTIVE SLIDES (Saved in Home Content or Backend Sliders)
  ===================================================== */

  const activeSlides =
    useMemo(() => {
      if (homeContent.slides.length > 0) {
        return homeContent.slides.filter((s) => s?.image || s?.url).map((s, i) => ({
          id: s.id || `slide-${i}`,
          image: typeof s === 'string' ? s : s.image || s.url || '',
        }))
      }

      if (
        Array.isArray(homeContent.slides) &&
        homeContent.slides.length > 0
      ) {
        return homeContent.slides.map((s, i) => ({
          id: s.id || `slide-${i}`,
          image: typeof s === 'string' ? s : s.image || s.url || '',
        }))
      }

      const backendSlides =
        sliders
          .filter(
            (item) =>
              item?.image
          )
          .sort(
            (a, b) =>
              (Number(a.order) ||
                0) -
              (Number(b.order) ||
                0)
          )
          .map(
            (item, index) => ({

              id:
                item._id ||
                `backend-${index}`,
              image:
                item.image,
            })
          )

      return backendSlides.length >= 1
        ? backendSlides
        : DEFAULT_HERO_SLIDES
    }, [content?.home, homeContent.slides, sliders])

  /* =====================================================
     COLLAGE IMAGES (Dynamic or fallback 32 images)
  ===================================================== */

  const allPortfolioImages = useMemo(() => {
    return (Object.values(portfolioFiles) as string[]).slice(0, 32)
  }, [])

  const collageImagesToRender = useMemo(() => {
    if (homeContent.collage.images.length > 0) {
      return homeContent.collage.images
        .filter((image) => typeof image === 'string' || image.visible !== false)
        .map((image) => (typeof image === 'string' ? image : image?.url || image?.image))
        .filter(Boolean)
    }
    return allPortfolioImages
  }, [homeContent.collage?.images, allPortfolioImages])

  /* =====================================================
     COLLAGE SLIDER (Pages of images, repeats images to
     fill a page when there aren't enough to go around)
  ===================================================== */

  const COLLAGE_PAGE_SIZE = 24

  const collagePages = useMemo(() => {
    const images = collageImagesToRender.filter(Boolean)

    if (images.length === 0) {
      return [[]]
    }

    const pageCount = Math.max(
      1,
      Math.ceil(images.length / COLLAGE_PAGE_SIZE)
    )

    const pages = []

    for (let page = 0; page < pageCount; page += 1) {
      const pageImages = []

      for (let slot = 0; slot < COLLAGE_PAGE_SIZE; slot += 1) {
        const sourceIndex =
          (page * COLLAGE_PAGE_SIZE + slot) % images.length

        pageImages.push(images[sourceIndex])
      }

      pages.push(pageImages)
    }

    return pages
  }, [collageImagesToRender])

  const collagePageCount = collagePages.length

  const [collagePage, setCollagePage] = useState(0)

  useEffect(() => {
    if (collagePage >= collagePageCount) {
      setCollagePage(0)
    }
  }, [collagePage, collagePageCount])

  const nextCollagePage = useCallback(() => {
    setCollagePage(
      (previous) => (previous + 1) % collagePageCount
    )
  }, [collagePageCount])

  const prevCollagePage = useCallback(() => {
    setCollagePage(
      (previous) =>
        (previous - 1 + collagePageCount) % collagePageCount
    )
  }, [collagePageCount])

  /* =====================================================
     COUPLES GRID (Dynamic list of couples)
  ===================================================== */

  const couplesToRender = useMemo(() => {
    return Array.isArray(homeContent.couples?.items)
      ? homeContent.couples.items.slice(0, 6)
      : []
  }, [homeContent.couples?.items])

  /* =====================================================
     VIDEOS TO RENDER (Dynamic list of videos - Strictly 4)
  ===================================================== */

  const defaultVideoUrls = useMemo(() => {
    const combined = [...allVideoUrls2, ...allVideoUrls3].filter(Boolean)
    return combined
  }, [])

  const videosToRender = useMemo(() => {
    if (Array.isArray(homeContent.videos?.items) && homeContent.videos.items.length > 0) {
      return homeContent.videos.items.slice(0, 4)
    }
    
    const items = []
    for (let i = 0; i < 4; i++) {
      const url = defaultVideoUrls[i % (defaultVideoUrls.length || 1)] || defaultVideoUrls[0] || ''
      items.push({
        id: `vid-${i}`,
        title: `Film ${i + 1}`,
        description: 'A beautiful cinematic representation of love, laughter, and timeless memories captured perfectly.',
        url,
      })
    }
    return items
  }, [homeContent.videos?.items, defaultVideoUrls])

  /* =====================================================
     SLIDER
  ===================================================== */

  const [current, setCurrent] =
    useState(0)

  const slideCount =
    activeSlides.length || 1

  useEffect(() => {
    if (
      current >= slideCount
    ) {
      setCurrent(0)
    }
  }, [
    current,
    slideCount,
  ])

  const nextSlide =
    useCallback(() => {
      setCurrent(
        (previous) =>
          (previous + 1) %
          slideCount
      )
    }, [slideCount])

  const prevSlide =
    useCallback(() => {
      setCurrent(
        (previous) =>
          (previous - 1 +
            slideCount) %
          slideCount
      )
    }, [slideCount])

  /* =====================================================
     SCROLL
  ===================================================== */

  const goToSection =
    (id: string) => {
      const element =
        document.getElementById(id)

      if (element) {
        element.scrollIntoView({
          behavior:
            'smooth',
          block:
            'start',
        })
      }
    }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: ${COLOR.paper};
          color: ${COLOR.ink};
          font-family: ${FONT_BODY};
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        * {
          box-sizing: border-box;
        }

        .cinema-video-section {
          width: 100%;
          background: #FFFFFF;
          padding: 3rem 0;
        }

        .video-frame {
          position: relative;
          left: 50%;
          width: 100vw;
          transform: translateX(-50%);
          overflow: hidden;
          background: #000;
          aspect-ratio: 4 / 5;
          clip-path: polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%);
          -webkit-clip-path: polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%);
        }

        .video-frame video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: grayscale(1) contrast(1.05);
        }

        .video-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.32);
        }

        .video-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 1.5rem;
          pointer-events: none;
        }

        .video-content .brand-eyebrow {
          font-family: ${FONT_BODY};
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 1.1rem;
        }

        .video-content h2 {
          font-family: ${FONT_DISPLAY};
          font-weight: 300;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #FFFFFF;
          font-size: clamp(1.9rem, 5vw, 3.4rem);
          margin: 0;
          line-height: 1.15;
        }

        .video-content p {
          font-family: ${FONT_BODY};
          font-weight: 300;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          line-height: 1.9;
          max-width: 34rem;
          margin: 1.6rem auto 0;
        }

        @media (min-width: 640px) {
          .video-frame {
            aspect-ratio: 16 / 9;
            clip-path: polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%);
            -webkit-clip-path: polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%);
          }
        }

        @media (min-width: 1024px) {
          .video-frame {
            aspect-ratio: auto;
            height: 700px;
            clip-path: polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%);
            -webkit-clip-path: polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%);
          }
        }

        .soul-cinema-shape-wrapper {
          position: relative;
          width: 100vw;
          left: 50%;
          transform: translateX(-50%);
          overflow: hidden;
          background: #000;
          aspect-ratio: 4 / 5.6;
        }

        .soul-cinema-shape-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
        }

        .soul-cinema-shape-dark {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.38);
          pointer-events: none;
        }

        .soul-cinema-shape-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 1.5rem;
          pointer-events: none;
          color: #fff;
          z-index: 4;
        }

        .soul-cinema-top-shape {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 29%;
          background: ${COLOR.paper};
          z-index: 5;

          clip-path: polygon(
            0 0,
            100% 0,
            100% 0,
            74% 100%,
            0 0
          );

          -webkit-clip-path: polygon(
            0 0,
            100% 0,
            100% 0,
            74% 100%,
            0 0
          );
        }

        .soul-cinema-top-shape-left {
          position: absolute;
          top: 0;
          left: 0;
          width: 74%;
          height: 29%;
          background: ${COLOR.paper};
          z-index: 6;

          clip-path: polygon(
            0 0,
            100% 100%,
            0 0
          );

          -webkit-clip-path: polygon(
            0 0,
            100% 100%,
            0 0
          );
        }

        .soul-cinema-bottom-shape {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 20%;
          background: ${COLOR.paper};
          z-index: 5;

          clip-path: polygon(
            0 100%,
            0 0,
            26% 100%,
            100% 0,
            100% 100%
          );

          -webkit-clip-path: polygon(
            0 100%,
            0 0,
            26% 100%,
            100% 0,
            100% 100%
          );
        }

        @media (min-width: 640px) {
          .soul-cinema-shape-wrapper {
            aspect-ratio: 16 / 11;
          }
        }

        @media (min-width: 1024px) {
          .soul-cinema-shape-wrapper {
            aspect-ratio: auto;
            height: 820px;
          }
        }

        @media (max-width: 767px) {
          .soul-cinema-top-shape,
          .soul-cinema-top-shape-left {
            height: 18%;
          }

          .soul-cinema-top-shape-left {
            width: 78%;
          }

          .soul-cinema-bottom-shape {
            height: 13%;
          }
        }
      `}</style>

      <main
        className="min-h-screen overflow-hidden"
        style={{
          backgroundColor:
            COLOR.paper,
          color:
            COLOR.ink,
          fontFamily:
            FONT_BODY,
        }}
      >
        {/* ===============================================
            01 — HERO / SLIDER (Height Reduced, Side Space Added)
        =============================================== */}

        <section
          id="home"
          className="px-4 pt-24 pb-6 sm:px-10 sm:pt-28 sm:pb-8 lg:px-14 lg:pt-32 lg:pb-8"
          style={{
            backgroundColor:
              COLOR.paper,
          }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="relative w-full aspect-[9/4] overflow-hidden bg-black sm:aspect-[4/1] md:aspect-[5/1] lg:aspect-[32/15]">
              {activeSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className="absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out"
                  style={{
                    opacity: index === current ? 1 : 0,
                    zIndex: index === current ? 10 : 1,
                  }}
                >
                  <img
                    src={slide.image}
                    alt="SAN Photography"
                    className="h-full w-full object-cover object-center"
                    loading={index === 0 ? 'eager' : index === 1 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding="async"
                  />
                </div>
              ))}

              <div className="absolute inset-0 bg-black/45" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/65" />

              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous slide"
                className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 text-white transition hover:border-white hover:bg-white hover:text-black sm:left-6"
              >
                <ChevronLeft size={18} strokeWidth={1.4} />
              </button>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next slide"
                className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 text-white transition hover:border-white hover:bg-white hover:text-black sm:right-6"
              >
                <ChevronRight size={18} strokeWidth={1.4} />
              </button>

              <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 text-white">
                <span className="text-[8px] tracking-[0.2em] text-white/70">
                  {String(current + 1).padStart(2, '0')}
                </span>
                <div className="h-px w-10 bg-white/40" />
                <span className="text-[8px] tracking-[0.2em] text-white/70">
                  {String(slideCount).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </section>

    {/* ===============================================
  03 — COLLAGE
=============================================== */}

<section
  id="collage"
  className="px-4 py-6 sm:px-10 sm:py-8 lg:px-14 lg:py-8"
  style={{ backgroundColor: COLOR.paper }}
>
  <div className="mx-auto mb-5 max-w-6xl text-center">
    <p
      className="text-base sm:text-lg md:text-xl font-light leading-6 sm:leading-9 text-[#2B2824] max-w-3xl mx-auto"
      style={{ fontFamily: FONT_DISPLAY }}
    >
      {homeContent.collage.heading}
    </p>

    <p className="mt-3 sm:mt-4 text-[9px] uppercase tracking-[0.42em] text-[#9B7B45]">
      {homeContent.collage.eyebrow}
    </p>
  </div>

  <FadeIn className="relative mx-auto max-w-6xl">
    {/* Same overall responsive ratio as the Hero */}
    <div
      className="
        relative
        w-full
        aspect-[9/4]
        sm:aspect-[4/1]
        md:aspect-[5/1]
        lg:aspect-[32/15]
        overflow-hidden
        bg-black
      "
    >
   {/* Sliding collage pages */}
<div
  className="flex h-full w-full transition-transform duration-700 ease-out"
  style={{
    width: `${collagePageCount * 100}%`,
    transform: `translateX(-${
      (100 / collagePageCount) * collagePage
    }%)`,
  }}
>
  {collagePages.map((page, pageIndex) => (
    <div
      key={`collage-page-${pageIndex}`}
   className="grid h-full grid-cols-8 grid-rows-3 gap-0 sm:grid-cols-6 sm:grid-rows-4 lg:grid-cols-8 lg:grid-rows-3"
      style={{
        width: `${100 / collagePageCount}%`,
        flexShrink: 0,
      }}
    >
      {page.map((src, index) => (
        <div
          key={`collage-${pageIndex}-${index}`}
          className="relative min-h-0 min-w-0 overflow-hidden bg-black"
        >
          <img
            src={src}
            alt={`SAN Wedding ${
              pageIndex * COLLAGE_PAGE_SIZE + index + 1
            }`}
            className="block h-full w-full object-cover object-center"
            loading={pageIndex === 0 ? 'eager' : 'lazy'}
            fetchPriority={pageIndex === 0 && index < 8 ? 'high' : 'auto'}
            decoding="async"
          />
        </div>
      ))}
    </div>
  ))}
</div>

      {/* Previous */}
      {collagePageCount > 1 && (
        <button
          type="button"
          onClick={prevCollagePage}
          aria-label="Previous collage page"
          className="
            absolute
            left-2
            top-1/2
            z-10
            flex
            h-9
            w-9
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            border
            border-black/25
            bg-white/80
            text-black
            backdrop-blur-sm
            transition
            hover:border-black
            hover:bg-black
            hover:text-white
            sm:left-3
            sm:h-10
            sm:w-10
          "
        >
          <ChevronLeft
            size={16}
            strokeWidth={1.4}
          />
        </button>
      )}

      {/* Next */}
      {collagePageCount > 1 && (
        <button
          type="button"
          onClick={nextCollagePage}
          aria-label="Next collage page"
          className="
            absolute
            right-2
            top-1/2
            z-10
            flex
            h-9
            w-9
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            border
            border-black/25
            bg-white/80
            text-black
            backdrop-blur-sm
            transition
            hover:border-black
            hover:bg-black
            hover:text-white
            sm:right-3
            sm:h-10
            sm:w-10
          "
        >
          <ChevronRight
            size={16}
            strokeWidth={1.4}
          />
        </button>
      )}
    </div>
  </FadeIn>
</section>
        {/* ===============================================
            04 — COUPLES GRID (3 by 3 on all devices)
        =============================================== */}

        <section
          id="couples"
          className="px-4 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-10"
          style={{ backgroundColor: COLOR.paper }}
        >
          <div className="mx-auto max-w-5xl mb-6 text-center">
            <h2
              className="text-2xl sm:text-[clamp(2rem,4.2vw,3.2rem)] font-light uppercase leading-[1.05] tracking-[0.04em] text-[#181715]"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {homeContent.couples.heading}{' '}
              {homeContent.couples.italicHeading}
            </h2>
            <div className="mx-auto mt-3 h-px w-12 bg-[#9B7B45]/40" />
          </div>

          {/* Changed to 3 columns on mobile and desktop (3 by 3 layout) */}
          <FadeIn className="grid grid-cols-3 gap-x-2 gap-y-4 sm:gap-x-6 sm:gap-y-8 lg:gap-x-10 lg:gap-y-10 max-w-6xl mx-auto">
            {couplesToRender.map((couple, index) => {
              return (
                <Link
                  key={couple.id || `couple-${index}`}
                  to={`/gallery/${couple.slug}`}
                  className="group cursor-pointer block"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="relative overflow-hidden bg-black aspect-[94/100] mb-2 sm:mb-3">
                    {couple.img ? (
                      <img
                        src={couple.img}
                        alt={couple.name}
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                        loading={index < 3 ? 'eager' : 'lazy'}
                        fetchPriority={index < 3 ? 'high' : 'auto'}
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-[0.2em] text-white/60">
                        No cover image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
                  </div>

                  <div className="text-left pt-1">
                    <h3
                      className="text-[8px] sm:text-[11px] font-normal tracking-[0.28em] text-[#181715] uppercase transition-colors duration-300 group-hover:text-[#9B7B45]"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      {couple.name}
                    </h3>
                  </div>
                </Link>
              )
            })}
          </FadeIn>
        </section>

        {/* ===============================================
            05 — VIDEOS SECTION (Reduced Mobile Fonts)
        =============================================== */}

        <section
          id="videos"
          className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-8"
          style={{ backgroundColor: COLOR.paper }}
        >
          <div className="mx-auto max-w-[1000px]">
            <FadeIn>
              <div className="mb-5 text-center">
                <p className="text-[9px] uppercase tracking-[0.42em] text-[#9B7B45]">
                  {homeContent.videos.eyebrow}
                </p>
                <h2
                  className="mt-4 text-2xl sm:text-4xl md:text-5xl font-light tracking-[-0.02em] text-[#181715]"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  {homeContent.videos.heading}{' '}
                  {homeContent.videos.italicHeading && (
                    <span className="italic">
                      {homeContent.videos.italicHeading}
                    </span>
                  )}
                </h2>
              </div>
            </FadeIn>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {videosToRender.map((videoItem, index) => {
                const videoSrc =
                  videoItem.url ||
                  defaultVideoUrls[index % defaultVideoUrls.length] ||
                  defaultVideoUrls[0]

                if (!videoSrc) return null

                return (
                  <FadeIn
                    key={videoItem.id || `video-${index}`}
                    delay={index * 0.1}
                    className="group flex flex-col"
                  >
                    <VideoCard videoItem={videoItem} videoSrc={videoSrc} />
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===============================================
            06 — SOUL CINEMA / FLASHBACK SECTION
        =============================================== */}

        <section
          id="soul-cinema"
          className="relative w-full overflow-hidden"
          style={{ backgroundColor: COLOR.paper }}
        >
          {(homeContent.soulCinema.videoUrl || soulCinemaVideo) && (
            <FadeIn delay={0.15}>
              <div className="soul-cinema-shape-wrapper">

                <video
                  src={homeContent.soulCinema.videoUrl || soulCinemaVideo || undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="soul-cinema-shape-video"
                />

                <div className="soul-cinema-shape-dark" />

                <div className="soul-cinema-shape-content">
                  <p className="mb-4 text-[9px] uppercase tracking-[0.42em] text-white/80">
                    {homeContent.soulCinema.brandEyebrow}
                  </p>

                  <h2
                    className="text-[clamp(3rem,7vw,7rem)] font-light leading-[0.9] tracking-[-0.04em]"
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    {homeContent.soulCinema.heading}
                  </h2>

                  <p className="mt-6 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
                    {homeContent.soulCinema.description}
                  </p>
                </div>

                <div className="soul-cinema-top-shape" />
                <div className="soul-cinema-top-shape-left" />
                <div className="soul-cinema-bottom-shape" />

              </div>
            </FadeIn>
          )}

          <div className="px-4 pb-5 pt-4 sm:px-6 lg:px-10">
            <FadeIn>
              <p
                className="text-center text-[9px] uppercase tracking-[0.42em]"
                style={{ color: COLOR.gold }}
              >
                {homeContent.soulCinema.eyebrow}
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ===============================================
            02 — ABOUT (Reduced Mobile Fonts)
        =============================================== */}

        <section
          id="about"
          className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
          style={{
            backgroundColor: COLOR.paper,
          }}
        >
          <div className="mx-auto grid max-w-[920px] gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
            <FadeIn>
              <SectionHeading
                eyebrow={homeContent.about.eyebrow}
                heading={homeContent.about.heading}
                italicHeading={homeContent.about.italicHeading}
              />
            </FadeIn>

            <FadeIn delay={0.12}>
              <div className="pt-1">
                <p className="text-xs sm:text-sm font-light leading-6 text-[#2B2824] sm:text-base">
                  {homeContent.about.intro}
                </p>

                <div
                  className="mt-3 max-w-2xl text-[10px] sm:text-[11px] leading-5 space-y-1.5"
                  style={{ color: COLOR.inkSoft }}
                >
                  {homeContent.about.paragraph1 && (
                    <p>{homeContent.about.paragraph1}</p>
                  )}
                  {homeContent.about.paragraph2 && (
                    <p>{homeContent.about.paragraph2}</p>
                  )}
                  {homeContent.about.paragraph3 && (
                    <p>{homeContent.about.paragraph3}</p>
                  )}
                  {homeContent.about.ending && (
                    <p className="font-medium" style={{ color: COLOR.ink }}>
                      {homeContent.about.ending}
                    </p>
                  )}
                </div>

                {homeContent.about.buttonText && (
                  <button
                    type="button"
                    onClick={() => goToSection('videos')}
                    className="group mt-4 inline-flex items-center gap-3 border-b border-black/60 pb-2 text-[9px] font-semibold uppercase tracking-[0.22em]"
                  >
                    {homeContent.about.buttonText}
                    <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ===============================================
            07 — TESTIMONIALS
        =============================================== */}

        <section
          id="testimonials"
          className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12"
          style={{ backgroundColor: COLOR.paper }}
        >
          <FadeIn>
            <p
              className="text-center text-[9px] uppercase tracking-[0.42em]"
              style={{ color: COLOR.gold }}
            >
              {homeContent.testimonials.eyebrow}
            </p>
          </FadeIn>

          <div className="mt-5">
            <TestimonialCarousel
              items={homeContent.testimonials.items}
            />
          </div>
        </section>

      </main>
    </>
  )        
}

export default Home