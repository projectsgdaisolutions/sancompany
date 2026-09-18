import { useEffect, useRef, useState } from 'react'
import { readApiJson } from '../services/api'
import type { BlogContent, BlogPost } from '../types'
import {
  ArrowRight,
  ArrowUpRight,
  X,
} from 'lucide-react'

// 1st Hero Video Import
import weddingFilmUrl from '../assets/portfolio/wedding/VIDEOS/KAPIL PAYAL WEDDING FILM HIGH CORRECTION.MP4'

const BLOG_API_URL =
  import.meta.env.VITE_PHP_API_URL || ''

/* =========================================================
   DYNAMIC ASSET IMPORTS
========================================================= */

const imageFiles = import.meta.glob(
  '../assets/portfolio/wedding/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  {
    eager: true,
    import: 'default',
  }
)

const videoFiles = import.meta.glob(
  '../assets/portfolio/wedding/**/*.{mp4,MP4,mov,MOV}',
  {
    eager: true,
    import: 'default',
  }
)

const localImages = Object.values(imageFiles) as string[]
const localVideos = Object.values(videoFiles) as string[]

/* =========================================================
   DEFAULT BLOG POSTS
========================================================= */

const DEFAULT_POSTS: BlogPost[] = [
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
    videoUrl: localVideos[0] || weddingFilmUrl,
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
    videoUrl: localVideos[1] || weddingFilmUrl,
    image: '',
    imageUrl: '',
  },
]

/* =========================================================
   DEFAULT BLOG CONTENT
========================================================= */

const DEFAULT_BLOG_CONTENT: BlogContent = {
  featuredLabel: 'Featured Story',
  featuredReadText: 'Watch Full Story',
  driveButtonText: 'See Our Latest Images',
  driveButtonHref:
    'https://drive.google.com/drive/folders/your-folder-id',
  latestEyebrow: 'FROM THE JOURNAL',
  latestHeading: 'Latest stories',
  latestDescription:
    'Inspiration, advice and behind-the-scenes thoughts from SAN Photography.',
  readStoryText: 'View Details',
  posts: DEFAULT_POSTS,
}

/* =========================================================
   NORMALIZE POST
========================================================= */

function normalizePost(post: Record<string, unknown>, index: number): BlogPost {
  const source =
    post && typeof post === 'object'
      ? post
      : {}

  const imageUrl = String(source.imageUrl ?? source.image ?? '')

  const videoUrl = String(source.videoUrl ?? source.video ?? '')

  return {
    ...source,

    id: (source.id as string | number | undefined) ?? `post-${index}`,
    type: String(source.type ?? 'image'),
    category: String(source.category ?? ''),
    title: String(source.title ?? ''),
    excerpt: String(source.excerpt ?? ''),
    date: String(source.date ?? ''),
    readTime: String(source.readTime ?? ''),

    image: imageUrl,

    imageUrl,

    videoUrl,
  }
}

/* =========================================================
   HOOKS & GLOBAL EFFECTS
========================================================= */

const FONT_DISPLAY =
  "'Fraunces', 'Iowan Old Style', Georgia, serif"

const FONT_BODY =
  "'Manrope', ui-sans-serif, system-ui, sans-serif"

function useGoogleFonts() {
  useEffect(() => {
    const id = 'san-blog-vogue-fonts'

    if (document.getElementById(id)) {
      return
    }

    const link = document.createElement('link')

    link.id = id
    link.rel = 'stylesheet'

    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,400&family=Manrope:wght@300;400;500;600;700;800&display=swap'

    document.head.appendChild(link)
  }, [])
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(element)
          }
        },
        {
          threshold,
        }
      )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold])

  return [ref, visible] as const
}

/* =========================================================
   AUTOPLAY VIDEO
========================================================= */

interface AutoPlayVideoProps {
  src: string;
  className?: string;
}

function AutoPlayVideo({
  src,
  className,
}: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true

      videoRef.current
        .play()
        .catch(() => {})
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className={className}
    />
  )
}

/* =========================================================
   BLOG DETAIL MODAL
========================================================= */

interface BlogDetailModalProps {
  post: BlogPost | null;
  onClose: () => void;
}

function BlogDetailModal({
  post,
  onClose,
}: BlogDetailModalProps) {
  if (!post) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm md:p-6"
      onClick={onClose}
    >
      <div
        className="relative my-6 w-full max-w-3xl bg-[#F9F7F2] p-5 shadow-2xl sm:p-8 md:p-10"
        onClick={(e: React.MouseEvent<HTMLDivElement>) =>
          e.stopPropagation()
        }
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-[#171717] text-white transition hover:bg-[#9b7740]"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#9b7b45]">
            {post.category}
          </p>

          <h2
            className="mx-auto mt-2 max-w-2xl text-2xl font-light leading-[1.1] tracking-[-0.03em] text-[#171717] sm:text-3xl md:text-4xl"
            style={{
              fontFamily: FONT_DISPLAY,
            }}
          >
            {post.title}
          </h2>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-[9px] uppercase tracking-[0.2em] text-black/40">
              {post.date}
            </span>

            <span className="h-px w-6 bg-black/20" />

            <span className="text-[9px] uppercase tracking-[0.2em] text-black/40">
              {post.readTime}
            </span>
          </div>
        </div>

        <div className="mt-5 overflow-hidden bg-black">
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden">
            {post.type === 'video' &&
            post.videoUrl ? (
              <video
                src={post.videoUrl}
                controls
                autoPlay
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : post.imageUrl ||
              post.image ? (
              <img
                src={
                  post.imageUrl ||
                  post.image
                }
                alt={post.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>
        </div>

        <div
          className="mt-5"
          style={{
            fontFamily: FONT_BODY,
          }}
        >
          <p className="text-sm leading-7 text-[#171717]/80 md:text-base md:leading-8">
            {post.excerpt}
          </p>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   BLOG CARD
========================================================= */

interface BlogCardProps {
  post: BlogPost;
  index: number;
  onOpen: (post: BlogPost) => void;
}

function BlogCard({
  post,
  index,
  onOpen,
}: BlogCardProps) {
  const [ref, visible] =
    useReveal(0.05)

  return (
    <article
      ref={ref}
      onClick={() => onOpen(post)}
      className={`group cursor-pointer transition-all duration-700 ease-out ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-8 opacity-0'
      }`}
      style={{
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <div className="relative mb-2 aspect-[4/5] overflow-hidden bg-[#ECE6DA]">
        {post.type === 'video' &&
        post.videoUrl ? (
          <AutoPlayVideo
            src={post.videoUrl}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
        ) : post.imageUrl ||
          post.image ? (
          <img
            src={
              post.imageUrl ||
              post.image
            }
            alt={post.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center text-[9px] text-black/30">
            No Media
          </div>
        )}

        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-white text-black opacity-0 transition-all duration-300 group-hover:opacity-100">
          <ArrowUpRight
            size={12}
            strokeWidth={1.5}
          />
        </div>
      </div>

      <div className="w-full pt-1">
        <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-[#9b7b45]">
          {post.category}
        </p>

        <h3 className="mt-1 text-sm font-light leading-[1.2] tracking-[-0.025em] text-[#171717] sm:text-base">
          {post.title}
        </h3>
      </div>
    </article>
  )
}

/* =========================================================
   BLOG PAGE
========================================================= */

function Blog() {
  useGoogleFonts()

  /*
   * IMPORTANT FIX:
   *
   * Previously this was:
   *
   * const [blogContent, setBlogContent] = useState(null)
   *
   * When API temporarily failed, blogContent stayed null
   * and posts became [].
   *
   * That made:
   *
   * featuredPost = undefined
   *
   * and the entire Featured Story section disappeared.
   *
   * Now the page always starts with valid default content.
   * Once MySQL API succeeds, the dynamic DB content replaces it.
   */
  const [blogContent, setBlogContent] = useState<BlogContent>(DEFAULT_BLOG_CONTENT)

  const [selectedMedia, setSelectedMedia] = useState<BlogPost | null>(null)

  const [
    storiesRef,
    storiesVisible,
  ] = useReveal()

  /* =======================================================
     FETCH DYNAMIC BLOG CONTENT
  ======================================================= */

  useEffect(() => {
    let isMounted = true

    const fetchBlogContent =
      async () => {
        try {
          /*
           * Cache-busting query parameter prevents an old
           * response from being reused by the browser.
           */
          const response =
            await fetch(
              `${BLOG_API_URL}/api/blog.php?t=${Date.now()}`,
              {
                method: 'GET',
                cache: 'no-store',
                headers: {
                  Accept:
                    'application/json',
                },
              }
            )

          if (!response.ok) {
            throw new Error(
              `Blog API returned HTTP ${response.status}.`
            )
          }

          const data =
            await readApiJson(response, 'Blog')

          if (!data.success) {
            throw new Error(
              data.message ||
                'Blog content could not be loaded.'
            )
          }

          /*
           * PHP returns:
           *
           * {
           *   success: true,
           *   blog: {...},
           *   content: {
           *      blog: {...}
           *   }
           * }
           *
           * Accept either form.
           */
          const rawBlog =
            data.blog ??
            data.content?.blog

          if (
            !rawBlog ||
            typeof rawBlog !==
              'object' ||
            !Array.isArray(
              rawBlog.posts
            )
          ) {
            throw new Error(
              'Blog API returned invalid blog content.'
            )
          }

          /*
           * Normalize all posts so image/imageUrl
           * and video/videoUrl remain compatible.
           */
          const normalizedPosts =
            rawBlog.posts.map(
              normalizePost
            )

          /*
           * Backward compatibility:
           *
           * If old database content has featured media
           * at the top level, use it for post #1 only.
           */
          const featuredImage =
            rawBlog.featuredImageUrl ??
            rawBlog.featuredImage ??
            ''

          const featuredVideo =
            rawBlog.featuredVideoUrl ??
            rawBlog.featuredVideo ??
            ''

          if (
            normalizedPosts[0]
          ) {
            if (
              featuredImage &&
              !normalizedPosts[0]
                .imageUrl
            ) {
              normalizedPosts[0].image =
                featuredImage

              normalizedPosts[0].imageUrl =
                featuredImage
            }

            if (
              featuredVideo &&
              !normalizedPosts[0]
                .videoUrl
            ) {
              normalizedPosts[0].videoUrl =
                featuredVideo
            }
          }

          /*
           * IMPORTANT:
           *
           * Only update state after receiving a valid
           * database response.
           *
           * If the API fails, the current valid state
           * remains on screen.
           *
           * We do NOT set posts to [].
           */
          if (isMounted) {
            setBlogContent({
              featuredLabel:
                rawBlog.featuredLabel ??
                DEFAULT_BLOG_CONTENT.featuredLabel,

              featuredReadText:
                rawBlog.featuredReadText ??
                DEFAULT_BLOG_CONTENT.featuredReadText,

              driveButtonText:
                rawBlog.driveButtonText ??
                DEFAULT_BLOG_CONTENT.driveButtonText,

              driveButtonHref:
                rawBlog.driveButtonHref ??
                DEFAULT_BLOG_CONTENT.driveButtonHref,

              latestEyebrow:
                rawBlog.latestEyebrow ??
                DEFAULT_BLOG_CONTENT.latestEyebrow,

              latestHeading:
                rawBlog.latestHeading ??
                DEFAULT_BLOG_CONTENT.latestHeading,

              latestDescription:
                rawBlog.latestDescription ??
                DEFAULT_BLOG_CONTENT.latestDescription,

              readStoryText:
                rawBlog.readStoryText ??
                DEFAULT_BLOG_CONTENT.readStoryText,

              posts:
                normalizedPosts,
            })
          }
        } catch (error) {
          /*
           * IMPORTANT:
           *
           * Do NOT clear blogContent here.
           *
           * If API temporarily fails, the previous valid
           * content stays visible.
           */
          console.error(
            'Blog content fetch error:',
            error
          )
        }
      }

    fetchBlogContent()

    return () => {
      isMounted = false
    }
  }, [])

  /* =======================================================
     DISPLAY BLOG
  ======================================================= */

  /*
   * IMPORTANT FIX:
   *
   * Previously:
   *
   * const displayBlog =
   *   blogContent || {
   *     ...DEFAULT_BLOG_CONTENT,
   *     posts: []
   *   }
   *
   * That explicitly created an empty posts array.
   *
   * Now blogContent always contains either:
   *
   * 1. DEFAULT_BLOG_CONTENT
   * 2. Valid MySQL blog content
   *
   * Therefore Featured Story cannot disappear simply
   * because of an API timing/failure.
   */
  const displayBlog =
    blogContent || DEFAULT_BLOG_CONTENT

  const posts =
    Array.isArray(
      displayBlog.posts
    )
      ? displayBlog.posts
      : DEFAULT_BLOG_CONTENT.posts

  /*
   * IMPORTANT:
   *
   * First post is ALWAYS Featured Story.
   *
   * This is dynamic:
   * Admin reorders posts -> post #1 becomes Featured.
   */
  const featuredPost =
    posts[0]

  return (
    <>
      {/* =====================================================
          BLOG DETAIL MODAL
      ===================================================== */}

      {selectedMedia && (
        <BlogDetailModal
          post={selectedMedia}
          onClose={() =>
            setSelectedMedia(null)
          }
        />
      )}

      <main
        className="min-h-screen overflow-hidden bg-[#F9F7F2] text-[#171717]"
        style={{
          fontFamily: FONT_DISPLAY,
        }}
      >

        {/* ===================================================
            01 FEATURED STORY
        =================================================== */}

        {featuredPost && (
          <section className="px-4 pb-4 pt-32 sm:px-6 sm:pb-6 sm:pt-36 lg:px-8 lg:pb-8 lg:pt-40">
            <div className="mx-auto max-w-5xl opacity-100 translate-y-0">
              <div className="grid flex-col overflow-hidden bg-[#F0EDE6] shadow-sm lg:grid-cols-2">

                {/* =================================================
                    FEATURED MEDIA
                ================================================= */}

                <div className="relative flex w-full items-center justify-center bg-[#F0EDE6] py-4 lg:py-6">
                  <div className="relative mx-auto aspect-video w-full max-w-[350px] overflow-hidden bg-black shadow-lg">

                    {featuredPost.type ===
                      'video' &&
                    featuredPost.videoUrl ? (
                      <AutoPlayVideo
                        src={
                          featuredPost.videoUrl
                        }
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      featuredPost.imageUrl ||
                      featuredPost.image
                    ) ? (
                      <img
                        src={
                          featuredPost.imageUrl ||
                          featuredPost.image
                        }
                        alt={
                          featuredPost.title
                        }
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-[#e0dbd1] text-xs text-black/30">
                        No Media
                      </div>
                    )}

                    <div className="absolute left-3 top-3 z-10 bg-white px-2 py-1 text-[7px] font-medium uppercase tracking-[0.3em] sm:left-4 sm:top-4 sm:text-[8px]">
                      {displayBlog.featuredLabel}
                    </div>
                  </div>
                </div>

                {/* =================================================
                    FEATURED CONTENT
                ================================================= */}

                <div className="flex flex-col justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

                  <p className="text-[9px] uppercase tracking-[0.35em] text-[#9b7b45]">
                    {featuredPost.category}
                  </p>

                  <h2 className="mt-2 text-xl font-light leading-[1.1] tracking-[-0.035em] sm:text-2xl lg:text-3xl">
                    {featuredPost.title}
                  </h2>

                  <p
                    className="mt-2 line-clamp-2 text-sm leading-5 text-black/50"
                    style={{
                      fontFamily: FONT_BODY,
                    }}
                  >
                    {featuredPost.excerpt}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-black/35">
                      {featuredPost.date}
                    </span>

                    <span className="h-px w-6 bg-black/20" />

                    <span className="text-[9px] uppercase tracking-[0.2em] text-black/35">
                      {featuredPost.readTime}
                    </span>
                  </div>

                  {/* =================================================
                      FEATURED BUTTONS
                  ================================================= */}

                  <div className="mt-4 flex flex-col items-start gap-3">

                    <button
                      onClick={() =>
                        setSelectedMedia(
                          featuredPost
                        )
                      }
                      className="group flex w-fit items-center gap-2 border-b border-black/20 pb-1 text-[9px] font-medium uppercase tracking-[0.3em]"
                    >
                      {displayBlog.featuredReadText}

                      <ArrowRight
                        size={14}
                        strokeWidth={1.4}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </button>

                    <a
                      href={
                        displayBlog.driveButtonHref
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex w-fit items-center gap-2 bg-[#171717] px-4 py-2 text-[8px] font-medium uppercase tracking-[0.3em] text-white transition-all duration-300 hover:bg-[#9b7b45]"
                    >
                      {
                        displayBlog.driveButtonText
                      }

                      <ArrowUpRight
                        size={13}
                        strokeWidth={1.4}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </a>

                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            02 LATEST STORIES
        ===================================================== */}

        <section
          ref={storiesRef}
          className={`bg-[#F9F7F2] px-4 py-4 transition-all duration-1000 sm:px-6 sm:py-6 lg:px-8 lg:py-8 ${
            storiesVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="mx-auto max-w-5xl">

            <div className="mb-4 flex flex-col gap-1 border-t border-black/10 pt-3 sm:mb-5 sm:pt-4">

              <p className="text-[9px] uppercase tracking-[0.4em] text-[#9b7b45]">
                {
                  displayBlog.latestEyebrow
                }
              </p>

              <h2 className="text-xl font-light tracking-[-0.04em] sm:text-2xl">
                {
                  displayBlog.latestHeading
                }
              </h2>

            </div>

            {/* =================================================
                BLOG GRID
            ================================================= */}

            <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-6 lg:gap-x-5 lg:gap-y-8">

              {posts
                .slice(1, 7)
                .map(
                  (
                    post,
                    index
                  ) => (
                    <BlogCard
                      key={`${post.id ?? 'post'}-${index}`}
                      post={post}
                      index={index}
                      onOpen={
                        setSelectedMedia
                      }
                    />
                  )
                )}

            </div>
          </div>
        </section>

      </main>
    </>
  )
}

export default Blog