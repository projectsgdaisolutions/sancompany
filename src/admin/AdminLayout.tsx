import React, { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import logo from "../assets/logo/san.logo.png";

const AdminLayout = ({
  children,
}: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/logout.php`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        // ignore errors, proceed to clear local data
      }
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };


  

  /* =====================================================
     ADMIN MENU (Reordered to match website flow)
  ===================================================== */

  const menuItems = [
    {
      name: "Home Page Management",
      path: "/admin/home",
    },
    {
      name: "Gallery Management",
      path: "/admin/gallery",
    },
    {
      name: "Film Management",
      path: "/admin/films",
    },
    {
      name: "Portfolio Management",
      path: "/admin/portfolio",
    },
    {
      name: "Blog Management",
      path: "/admin/blog",
    },
    {
      name: "About Page Management",
      path: "/admin/about",
    },
    {
      name: "Contact Management",
      path: "/admin/contact",
    },
    {
      name: "Career Management",
      path: "/admin/career",
    },
  ];

  /* =====================================================
     ACTIVE MENU
  ===================================================== */

  const isMenuActive = (itemOrPath: string | { path: string; altPath?: string }) => {
    if (
      typeof itemOrPath === "object" &&
      itemOrPath !== null
    ) {
      const { path, altPath } = itemOrPath;

      return (
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`) ||
        Boolean(
          altPath &&
            (location.pathname === altPath ||
              location.pathname.startsWith(`${altPath}/`))
        )
      );
    }

    return (
      location.pathname === itemOrPath ||
      location.pathname.startsWith(`${itemOrPath}/`)
    );
  };

  /* =====================================================
     CURRENT PAGE TITLE
  ===================================================== */

  const currentPage = menuItems.find((item) =>
    isMenuActive(item)
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#f3f0e9] font-sans text-[#171717]">

      {/* =================================================
          PREMIUM FONTS + ANIMATIONS
      ================================================= */}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        :root {
          --font-serif: 'Cormorant Garamond', serif;
          --font-sans: 'Plus Jakarta Sans', sans-serif;
        }

        body {
          font-family: var(--font-sans);
        }

        .font-display {
          font-family: var(--font-serif);
        }

        @keyframes sanFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .san-fade-up {
          animation: sanFadeUp 0.6s cubic-bezier(.22,1,.36,1) both;
        }

        @keyframes sanShine {
          0% {
            transform: translateX(-120%) skewX(-20deg);
          }

          100% {
            transform: translateX(220%) skewX(-20deg);
          }
        }

        .san-shine-wrap {
          position: relative;
          overflow: hidden;
        }

        .san-shine-wrap::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-120%) skewX(-20deg);
          pointer-events: none;
        }

        .san-shine-wrap:hover::after {
          animation: sanShine 0.9s ease;
        }

        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
        }

        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.25);
        }
      `}</style>

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-72 bg-[#1c1c1c] text-white 
          transition-transform duration-500 ease-in-out lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* LOGO */}

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
          <Link
            to="/admin/home"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3"
          >
            <img
              src={logo}
              alt="SAN Photography"
              className="h-auto w-10 object-contain invert drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
            />

            <div>
              <h1 className="font-display text-xl font-medium tracking-wide">
                SAN Photography
              </h1>

              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                Admin Panel
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="text-white/50 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="custom-scroll h-[calc(100vh-180px)] space-y-1 overflow-y-auto p-4">
          {menuItems.map((item, index) => {
            const isActive = isMenuActive(item);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  san-fade-up flex items-center gap-3 rounded-lg px-4 py-3 text-sm 
                  transition-all duration-300
                  ${
                    isActive
                      ? "bg-white text-[#1c1c1c] shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                `}
                style={{
                  animationDelay: `${0.1 + index * 0.05}s`,
                }}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-[#1c1c1c]" : "bg-white/20"
                  }`}
                />

                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* =================================================
            LOGOUT
        ================================================= */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#1c1c1c]/80 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={handleLogout}
            className="san-shine-wrap flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/70 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>

            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="min-h-screen lg:ml-72">

        {/* TOP HEADER */}

        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-black/[0.06] bg-white/70 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10">
          
          <div className="flex items-center gap-3">
            
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-white text-[#1c1c1c] hover:bg-[#1c1c1c] hover:text-white lg:hidden"
              aria-label="Open sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>

            <div>
              <h2 className="font-display text-lg font-medium tracking-tight text-[#1c1c1c] sm:text-xl">
                {currentPage?.name || "Admin Panel"}
              </h2>

              <p className="hidden text-xs text-gray-500 sm:block">
                Manage your photography website
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">
            
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-[#1c1c1c]">Admin User</p>
              <p className="text-[10px] text-gray-500">Administrator</p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1c] text-sm font-semibold text-white shadow-sm">
              A
            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <section className="p-4 sm:p-6 lg:p-10">
          {children}
        </section>

      </main>

    </div>
  );
};

export default AdminLayout;