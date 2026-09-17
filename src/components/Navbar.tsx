import {
  Menu,
  X,
  Mail,
  Phone,
} from 'lucide-react'

import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa'


import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useState } from 'react'

import sanLogo from '../assets/logo/san.logo.png'

/* =========================================================
   NAVIGATION
========================================================= */

const navItems = [
  {
    label: 'Home',
    path: '/',
  },
  {
    label: 'Photo Gallery',
    path: '/gallery',
  },
  {
    label: 'Films',
    path: '/films',
  },
  {
    label: 'Portfolio',
    path: '/portfolio',
  },
  {
    label: 'Blog',
    path: '/blog',
  },
  {
    label: 'About',
    path: '/about',
  },
  {
    label: 'Careers',
    path: '/careers',
  },
  {
    label: 'Contact',
    path: '/contact',
  },
]

/* =========================================================
   NAVBAR
========================================================= */

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const location = useLocation()

  const navigate = useNavigate()

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    navigate(path)
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <header
      className="
        absolute
        left-0
        top-0
        z-[100]
        w-full
        bg-transparent
        text-[#171717]
      "
      style={{ fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400&family=Manrope:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* ===================================================
          TOP ROW
      =================================================== */}

      <div
        className="
          relative
          mx-auto
          flex
          h-[56px]
          max-w-[1440px]
          items-center
          justify-between
          px-4

          sm:h-[80px]
          sm:px-6

          lg:h-[94px]
          lg:px-10
        "
      >
        {/* =================================================
            DESKTOP SOCIAL ICONS
        ================================================= */}

        <div
          className="
            hidden
            items-center
            gap-5
            lg:flex
          "
        >
          <a
            href="https://www.facebook.com/share/1Exh3t24TC/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="transition-all duration-300 hover:text-[#9b7b45]"
          >
            <FaFacebookF size={15} />
          </a>

          <a
            href="https://www.linkedin.com/in/san-photo-ni3cinema-a1693a121/?skipRedirect=true"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="transition-all duration-300 hover:text-[#9b7b45]"
          >
            <FaLinkedinIn size={15} />
          </a>

         

          <a
            href="https://www.instagram.com/ni3cinema/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="transition-all duration-300 hover:text-[#9b7b45]"
          >
            <FaInstagram size={17} />
          </a>

          <a
            href="https://www.youtube.com/@ni3cinema274"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="transition-all duration-300 hover:text-[#9b7b45]"
          >
            <FaYoutube size={17} />
          </a>

          <a
            href="mailto:sancompany0@gmail.com"
            aria-label="Email"
            className="transition-all duration-300 hover:text-[#9b7b45]"
          >
            <Mail size={17} strokeWidth={1.7} />
          </a>

          <a
            href="tel:+919359338557"
            aria-label="Phone"
            className="transition-all duration-300 hover:text-[#9b7b45]"
          >
            <Phone size={17} strokeWidth={1.7} />
          </a>
        </div>

        {/* =================================================
            SAN LOGO
        ================================================= */}

        <Link
          to="/"
          onClick={() => {
            setIsOpen(false)

            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            })
          }}
          className="
            absolute
            left-1/2
            top-1/2
            z-20
            -translate-x-1/2
            -translate-y-1/2

            sm:top-1/2 sm:-translate-y-1/2

            lg:top-1 lg:translate-y-0
          "
        >
          <img
            src={sanLogo}
            alt="SAN Photography"
            className="
              block
              h-auto
              w-[110px]
              max-w-none
              object-contain

              sm:w-[190px]

              md:w-[210px]

              lg:w-[240px]
            "
          />
        </Link>

        {/* =================================================
            DESKTOP BOOK NOW
        ================================================= */}

        <button
          type="button"
          onClick={() => handleNavigation('/contact')}
          className="
            hidden
            items-center
            gap-2
            px-7
            py-3
            text-sm
            font-semibold
            transition-all
            duration-300
            lg:flex

            bg-[#171717]
            text-white
            hover:bg-[#9b7b45] hover:text-white
          "
        >
          Book Now

          <span className="text-lg leading-none">→</span>
        </button>

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="
            relative
            z-30
            ml-auto
            flex
            h-8
            w-8
            items-center
            justify-center
            transition-opacity
            duration-300
            hover:opacity-60
            lg:hidden
          "
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <X size={20} strokeWidth={1.6} />
          ) : (
            <Menu size={20} strokeWidth={1.6} />
          )}
        </button>
      </div>

      {/* ===================================================
          DESKTOP NAVIGATION
      =================================================== */}

      <div className="hidden lg:block">
        <nav
          className="
            flex
            items-center
            justify-center
            gap-8
            pb-7

            xl:gap-9
          "
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavigation(item.path)}
                className="
                  group
                  relative
                  text-sm
                  font-medium
                  tracking-wide
                  transition-all
                  duration-300
                  hover:text-[#9b7b45]
                "
              >
                {item.label}

                <span
                  className={`
                    absolute
                    -bottom-2
                    left-0
                    h-px
                    bg-current
                    transition-all
                    duration-300

                    ${isActive
                      ? 'w-full'
                      : 'w-0 group-hover:w-full'
                    }
                  `}
                />
              </button>
            )
          })}
        </nav>
      </div>

      {/* ===================================================
          MOBILE NAVIGATION (Aesthetic Floating Centered Panel)
      =================================================== */}

      <div
        className={`
          overflow-hidden
          transition-all
          duration-500
          ease-in-out
          lg:hidden

          ${isOpen
            ? 'max-h-[800px] opacity-100 mt-2'
            : 'max-h-0 opacity-0 mt-0'
          }
        `}
      >
        <div
          className="
            relative
            mx-auto
            w-[90%]
            max-w-[320px]
            border
            border-black/10
            bg-[#F5F1E8]/95
            backdrop-blur-2xl
            rounded-xl
            shadow-2xl
            p-2
          "
        >
          {/* Close button inside the panel for better UX */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center text-[#171717] transition-opacity hover:opacity-60"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.6} />
          </button>

          <nav className="flex flex-col gap-1 px-2 py-2">
            {/* MOBILE NAV LINKS - No border lines, clean hover effect */}

            {navItems.map((item) => {
              const isActive = location.pathname === item.path

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    flex
                    items-center
                    justify-between
                    px-3
                    py-2.5
                    text-left
                    text-[13px]
                    font-medium
                    tracking-wide
                    transition-all
                    duration-300
                    rounded-md
                    
                    ${isActive 
                      ? 'bg-black/5 text-[#9b7b45]' 
                      : 'hover:bg-black/5 hover:text-[#9b7b45] text-[#171717]'
                    }
                  `}
                >
                  <span>{item.label}</span>

                  {/* Replaced 'Active' text with a small aesthetic dot */}
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9b7b45]"></span>
                  )}
                </button>
              )
            })}

            {/* MOBILE BOOK NOW */}

            <button
              type="button"
              onClick={() => handleNavigation('/contact')}
              className="
                mt-2
                flex
                w-full
                items-center
                justify-center
                gap-3
                px-6
                py-2.5
                text-[13px]
                font-semibold
                transition-all
                duration-300

                bg-[#171717]
                text-white
                hover:bg-[#9b7b45] hover:text-white
                rounded-md
              "
            >
              Book Your Session

              <span className="text-base leading-none">→</span>
            </button>

            {/* MOBILE SOCIAL ICONS - Grouped nicely at the bottom */}

            <div className="mt-3 flex items-center justify-center gap-4 border-t border-black/5 pt-3">
              <a
                href="https://www.facebook.com/share/1Exh3t24TC/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="transition-all duration-300 hover:text-[#9b7b45]"
              >
                <FaFacebookF size={13} />
              </a>

              <a
                href="https://www.linkedin.com/in/san-photo-ni3cinema-a1693a121/?skipRedirect=true"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="transition-all duration-300 hover:text-[#9b7b45]"
              >
                <FaLinkedinIn size={13} />
              </a>

         

              <a
                href="https://www.instagram.com/ni3cinema/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition-all duration-300 hover:text-[#9b7b45]"
              >
                <FaInstagram size={15} />
              </a>

              <a
                href="https://www.youtube.com/@ni3cinema274"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="transition-all duration-300 hover:text-[#9b7b45]"
              >
                <FaYoutube size={15} />
              </a>

              <a
                href="mailto:sancompany0@gmail.com"
                aria-label="Email"
                className="transition-all duration-300 hover:text-[#9b7b45]"
              >
                <Mail size={15} strokeWidth={1.7} />
              </a>

              <a
                href="tel:+919359338557"
                aria-label="Phone"
                className="transition-all duration-300 hover:text-[#9b7b45]"
              >
                <Phone size={15} strokeWidth={1.7} />
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Navbar