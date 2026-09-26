import React, { useMemo, useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import type { AboutContent } from '../types'
import { API_URL, readApiJson } from '../services/api'

const API_BASE_URL = API_URL

/* =========================================================
   TEAM IMAGES
========================================================= */

const teamFiles = import.meta.glob(
  '../assets/team/*.{jpeg,jpg,png,webp,JPEG,JPG,PNG,WEBP}',
  {
    eager: true,
    import: 'default',
  }
)

const normalizeName = (value = '') =>
  value
    .toLowerCase()
    .replace(/\.(jpeg|jpg|png|webp)$/i, '')
    .replace(/videographer|photographer|photographar|founder|cinematographer/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()

const findTeamImage = (personName: string): string | null => {
  const target = normalizeName(personName)
  const entries = Object.entries(teamFiles) as [string, string][]

  const exact = entries.find(([path]) => {
    const fileName = path.split('/').pop()
    return normalizeName(fileName) === target
  })
  if (exact) return exact[1]

  const partial = entries.find(([path]) => {
    const fileName = path.split('/').pop()
    const normalizedFile = normalizeName(fileName)
    return normalizedFile.includes(target) || target.includes(normalizedFile)
  })
  return partial?.[1] || null
}

/* =========================================================
   DEFAULT ABOUT DATA (Source of Truth)
========================================================= */

const DEFAULT_ABOUT = {
  // 01 HERO
  heroEyebrow: 'About SAN Photography',
  heroLine1: 'We capture',
  heroLine2: 'what you feel.',
  heroLine3: 'Not just what you see.',

  // 02 INTRO
  introText:
    'At SAN Photography, our team brings together creativity, experience, and passion to capture every special moment beautifully. From candid emotions to the smallest details, we work together to create photographs and films that tell your story.',

  // 03 FOUNDER (Now injected into Team Array)
  founderEyebrow: 'Founder',
  founderHeadingNormal: 'The person behind',
  founderHeadingItalic: 'SAN.',
  founderName: 'SANDEEP BRAHMANKAR',
  founderRole: 'Founder & Professional Photographer / Cinematographer',
  founderDescription:
    'SANDEEP is the founder and creative force behind SAN Photography, with 15+ years of professional experience in photography and cinematography. With a passion for storytelling and an eye for detail, he specializes in capturing weddings, pre-wedding celebrations, maternity moments, birthdays, kids, and other special occasions. His goal is to capture genuine emotions and create timeless photographs and cinematic films that clients can treasure for generations.',
  founderQuote:
    'Every picture has a story, and our job is to capture it beautifully.',
  founderImage: findTeamImage('SANDEEP BRAHMANKAR'),

  // 04 TEAM
  teamEyebrow: 'The Creative Team',
  teamHeadingNormal: 'People behind',
  teamHeadingItalic: 'the frames.',
  teamMembers: [],
}

/* =========================================================
   DESIGN TOKENS (Clean Off-White Editorial Theme)
========================================================= */

const COLOR = {
  paper: '#F9F7F2',       // Warm fresh ivory
  paperDeep: '#F0EDE8',   // Slightly deeper warm tone for sections
  ink: '#171717',         // Rich black for text
  inkSoft: '#555555',     // Soft grey for body text
  gold: '#9b7740',        // Muted bronze accent
}

const FONT_DISPLAY = "'Fraunces', 'Iowan Old Style', Georgia, serif"
const EASE_EXPO = [0.19, 1, 0.22, 1] as const

/* =========================================================
   HOOKS & GLOBAL EFFECTS
========================================================= */

function useGoogleFonts() {
  useEffect(() => {
    const id = 'san-about-clean-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,400&family=Manrope:wght@300;400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])
}

function GlobalStyles() {
  return (
    <style>{`
      html { scroll-behavior: smooth; }
      body {
        background-color: ${COLOR.paper};
        overscroll-behavior: none;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      ::selection { background: ${COLOR.ink}; color: ${COLOR.paper}; }
      ::-webkit-scrollbar { width: 0px; }
    `}</style>
  )
}

/* =========================================================
   REVEAL HEADING
========================================================= */

interface RevealLine {
  text: string;
  italic?: boolean;
  block?: boolean;
}

interface RevealHeadingProps {
  lines: RevealLine[];
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
  delayStart?: number;
}

function RevealHeading({ lines, as = 'h2', className = '', delayStart = 0 }: RevealHeadingProps) {
  const ref = useRef<HTMLElement>(null)
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
            <span key={wi} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <motion.span
                className={`inline-block will-change-transform ${line.italic ? 'italic font-light' : ''}`}
                initial={{ y: '110%' }}
                animate={inView ? { y: '0%' } : {}}
                transition={{ duration: 1.1, ease: EASE_EXPO, delay: delayStart + i * 0.05 }}
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
   ABOUT PAGE COMPONENT
========================================================= */

function About() {
  useGoogleFonts()

  const [aboutData, setAboutData] = useState(DEFAULT_ABOUT)

  useEffect(() => {
    let isMounted = true
    const loadContent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/about.php`, { cache: 'no-store' })
        const data = await readApiJson(res, 'About')
        if (isMounted && data?.success && data?.content?.about) {
          const remote = data.content.about
          setAboutData({
            heroEyebrow: remote.heroEyebrow ?? DEFAULT_ABOUT.heroEyebrow,
            heroLine1: remote.heroLine1 ?? DEFAULT_ABOUT.heroLine1,
            heroLine2: remote.heroLine2 ?? DEFAULT_ABOUT.heroLine2,
            heroLine3: remote.heroLine3 ?? DEFAULT_ABOUT.heroLine3,
            introText: remote.introText ?? DEFAULT_ABOUT.introText,
            founderEyebrow: remote.founderEyebrow ?? DEFAULT_ABOUT.founderEyebrow,
            founderHeadingNormal: remote.founderHeadingNormal ?? DEFAULT_ABOUT.founderHeadingNormal,
            founderHeadingItalic: remote.founderHeadingItalic ?? DEFAULT_ABOUT.founderHeadingItalic,
            founderName: remote.founderName || DEFAULT_ABOUT.founderName,
            founderRole: remote.founderRole || DEFAULT_ABOUT.founderRole,
            founderDescription: remote.founderDescription || DEFAULT_ABOUT.founderDescription,
            founderQuote: remote.founderQuote || DEFAULT_ABOUT.founderQuote,
            founderImage: remote.founderImage || DEFAULT_ABOUT.founderImage,
            teamEyebrow: remote.teamEyebrow ?? DEFAULT_ABOUT.teamEyebrow,
            teamHeadingNormal: remote.teamHeadingNormal ?? DEFAULT_ABOUT.teamHeadingNormal,
            teamHeadingItalic: remote.teamHeadingItalic ?? DEFAULT_ABOUT.teamHeadingItalic,
            teamMembers: Array.isArray(remote.teamMembers)
              ? remote.teamMembers
              : [],
          })
        }
      } catch (err) {
        console.error('Failed to load about content from API:', err)
      }
    }
    loadContent()
    return () => {
      isMounted = false
    }
  }, [])

  const {
    heroEyebrow = DEFAULT_ABOUT.heroEyebrow,
    heroLine1 = DEFAULT_ABOUT.heroLine1,
    heroLine2 = DEFAULT_ABOUT.heroLine2,
    heroLine3 = DEFAULT_ABOUT.heroLine3,
    introText = DEFAULT_ABOUT.introText,
    founderName = DEFAULT_ABOUT.founderName,
    founderRole = DEFAULT_ABOUT.founderRole,
    founderDescription = DEFAULT_ABOUT.founderDescription,
    founderImage = DEFAULT_ABOUT.founderImage,
    teamEyebrow = DEFAULT_ABOUT.teamEyebrow,
    teamHeadingNormal = DEFAULT_ABOUT.teamHeadingNormal,
    teamHeadingItalic = DEFAULT_ABOUT.teamHeadingItalic,
    teamMembers = [],
  } = aboutData

  const allTeamMembers = teamMembers

  return (
    <>
      <GlobalStyles />
      
      <main className="relative overflow-hidden" style={{ backgroundColor: COLOR.paper, color: COLOR.ink, fontFamily: FONT_DISPLAY }}>
        
        {/* TEAM GRID (Top) */}
        <section className="relative overflow-hidden px-6 pt-28 pb-12 sm:px-10 lg:px-16 lg:pt-32 lg:pb-16 bg-[#F0EDE8]">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <p className="text-[9px] uppercase tracking-[0.45em] text-[#9b7740]">{teamEyebrow}</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-light tracking-[-0.03em] text-[#171717]">
                {teamHeadingNormal} <span className="italic">{teamHeadingItalic}</span>
              </h2>
            </div>

            {/* Added items-stretch to make sure grid items stretch to equal heights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 sm:gap-x-6 sm:gap-y-10 items-stretch">
              {allTeamMembers.map((member, index) => {
                const image = member.image || findTeamImage(member.name)
                return (
                  <motion.div
                    key={member.id || member.name || index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.8, ease: EASE_EXPO, delay: (index % 4) * 0.1 }}
                    className="group cursor-pointer flex flex-col h-full"
                  >
                    {/* Image Container - Uniform aspect ratio for all */}
                    <div className="relative overflow-hidden bg-[#ECE6DA] aspect-[4/5] mb-3 rounded-sm shadow-sm">
                      {image ? (
                        <img
                          src={image}
                          alt={member.name}
                          className="w-full h-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center">
                          <p className="text-[9px] uppercase tracking-[0.3em] text-black/30">{member.name}</p>
                        </div>
                      )}
                    </div>

                    {/* Text Below Image - Aligned perfectly with min-heights */}
                    <div className="text-center flex-grow flex flex-col">
                      <h3 className="text-sm sm:text-base font-medium tracking-[0.05em] text-[#171717] uppercase min-h-[2.5rem] flex items-center justify-center">
                        {member.name}
                      </h3>
                      <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-[#9b7740] min-h-[1.5rem] flex items-center justify-center">
                        {member.role}
                      </p>
                      {member.description && (
                        <p className="mt-2 text-xs leading-5 text-[#555] line-clamp-4 min-h-[5rem]">
                          {member.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* HERO SECTION + INTRO TEXT (Bottom) */}
        <section className="relative flex flex-col items-center justify-center px-6 py-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_EXPO }}
            className="mb-4 text-[9px] uppercase tracking-[0.45em] text-[#9b7740]"
          >
            {heroEyebrow}
          </motion.p>

          <RevealHeading
            as="h1"
            lines={[
              { text: heroLine1, block: true },
              { text: heroLine2, italic: true, block: true },
              { text: heroLine3, block: true }
            ]}
            className="max-w-4xl text-[clamp(2rem,5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.03em] text-[#171717]"
          />

          <div className="mx-auto max-w-2xl mt-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: EASE_EXPO }}
              className="text-sm leading-7 text-[#555] sm:text-base sm:leading-8"
            >
              {introText}
            </motion.p>
          </div>
        </section>

      </main>
    </>
  )
}

export default About