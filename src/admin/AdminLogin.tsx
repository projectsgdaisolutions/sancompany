import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo/san.logo.png";
import loginBg from "../assets/login_bg.png";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("adminTheme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDark(true);
    }
    const savedUser = localStorage.getItem("rememberedAdmin");
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("adminTheme", newTheme ? "dark" : "light");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid username or password.");
      }

      if (rememberMe) {
        localStorage.setItem("rememberedAdmin", username);
      } else {
        localStorage.removeItem("rememberedAdmin");
      }

      localStorage.setItem("adminToken", data.token);
      navigate("/admin/home", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`relative min-h-screen w-full overflow-hidden bg-cover bg-center font-sans transition-colors duration-700 ${
        isDark ? "text-[#f3f0e9]" : "text-[#171717]"
      }`}
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Premium Styling & Advanced Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        :root {
          --font-serif: 'Cormorant Garamond', serif;
          --font-sans: 'Plus Jakarta Sans', sans-serif;
        }

        body { font-family: var(--font-sans); }
        .font-display { font-family: var(--font-serif); }

        @keyframes sanFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes sanFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes sanScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes sanAurora {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 40px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }

        @keyframes sanFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(3deg); }
        }

        @keyframes sanFloatReverse {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-3deg); }
        }

        @keyframes sanGlow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        @keyframes sanLine {
          from { width: 0; opacity: 0; }
          to { width: 40px; opacity: 1; }
        }

        @keyframes sanShine {
          0% { transform: translateX(-120%) skewX(-20deg); }
          100% { transform: translateX(220%) skewX(-20deg); }
        }

        @keyframes sanSpin { to { transform: rotate(360deg); } }

        @keyframes sanPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes sanGradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .san-fade-up { animation: sanFadeUp 0.9s cubic-bezier(.22,1,.36,1) both; }
        .san-fade-in { animation: sanFadeIn 1.2s ease both; }
        .san-scale-in { animation: sanScaleIn 0.8s cubic-bezier(.22,1,.36,1) both; }
        .san-aurora { animation: sanAurora 20s ease-in-out infinite; }
        .san-float { animation: sanFloat 8s ease-in-out infinite; }
        .san-float-reverse { animation: sanFloatReverse 10s ease-in-out infinite; }
        .san-glow { animation: sanGlow 6s ease-in-out infinite; }
        .san-line { animation: sanLine 1.2s cubic-bezier(.22,1,.36,1) 0.5s both; }
        .san-spinner { animation: sanSpin 0.8s linear infinite; }
        .san-pulse { animation: sanPulse 2.5s ease-in-out infinite; }

        .san-shine-wrap { position: relative; overflow: hidden; }
        .san-shine-wrap::after {
          content: ""; position: absolute; top: 0; left: 0; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: translateX(-120%) skewX(-20deg);
        }
        .san-shine-wrap:hover::after { animation: sanShine 0.9s ease; }

        .san-input {
          transition: all 0.3s ease;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
        }
        .san-input.dark-input { box-shadow: inset 0 1px 3px rgba(0,0,0,0.3); }
        .san-input:focus {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), inset 0 1px 3px rgba(0,0,0,0.02);
        }
        .san-input.dark-input:focus {
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), inset 0 1px 3px rgba(0,0,0,0.3);
        }

        /* Unique Theme Toggle */
        .theme-switch {
          position: relative;
          width: 72px;
          height: 36px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-switch-track {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-switch-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .theme-switch-thumb.dark {
          transform: translateX(36px);
        }

        /* Custom Checkbox */
        .san-checkbox {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 5px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .san-checkbox:checked::after {
          content: "";
          position: absolute;
          left: 5px;
          top: 1px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          animation: sanScaleIn 0.3s ease;
        }

        .theme-icon { transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease; }

        .gradient-text {
          background: linear-gradient(120deg, currentColor, currentColor 40%, rgba(255,255,255,0.6) 50%, currentColor 60%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: sanGradientShift 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Full Screen Background Overlays */}
      <div className={`absolute inset-0 z-0 transition-all duration-700 ${
          isDark 
            ? "bg-gradient-to-br from-[#050505]/80 via-[#0a0a0b]/85 to-[#050505]/95" 
            : "bg-gradient-to-br from-[#f3f0e9]/70 via-[#e9e5dc]/80 to-[#f3f0e9]/90"
      }`}></div>

      {/* Full Screen Dynamic Aurora Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className={`san-aurora absolute left-[-10%] top-[-10%] h-[400px] w-[400px] rounded-full blur-[120px] transition-colors duration-700 ${isDark ? "bg-amber-700/10" : "bg-amber-400/20"}`}></div>
        <div className={`san-aurora absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full blur-[120px] transition-colors duration-700 ${isDark ? "bg-neutral-800/30" : "bg-stone-300/40"}`} style={{ animationDelay: "5s" }}></div>
      </div>

      {/* Full Screen Floating Geometric Rings */}
      <div className={`san-float absolute -left-16 -top-16 h-[180px] w-[180px] rounded-full border transition-colors duration-700 sm:h-[260px] sm:w-[260px] ${isDark ? "border-white/[0.08]" : "border-black/[0.08]"}`}></div>
      <div className={`san-float-reverse absolute -bottom-20 -right-16 h-[230px] w-[230px] rounded-full border transition-colors duration-700 sm:h-[330px] sm:w-[330px] ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}></div>
      <div className={`san-float absolute right-[15%] top-[20%] h-4 w-4 rounded-full border transition-colors duration-700 ${isDark ? "border-white/20" : "border-black/20"}`}></div>

      {/* Floating Premium Theme Toggle */}
      <div className="fixed right-4 top-4 z-50 flex items-center gap-3 sm:right-6 sm:top-6">
        <span className={`hidden font-display text-[10px] uppercase tracking-[0.3em] transition-colors duration-700 sm:block ${isDark ? "text-white/40" : "text-black/40"}`}>
          {isDark ? "Night" : "Day"}
        </span>
        <div
          onClick={toggleTheme}
          className="theme-switch"
          role="button"
          aria-label="Toggle theme"
        >
          <div
            className={`theme-switch-track ${
              isDark
                ? "bg-gradient-to-r from-[#1a1a2e] to-[#0f0f1e] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "bg-gradient-to-r from-[#fef3c7] to-[#fde68a] border border-amber-200/50 shadow-[0_8px_32px_rgba(45,38,30,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]"
            }`}
          >
            {/* Stars in dark mode */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? "opacity-100" : "opacity-0"}`}>
              <span className="absolute top-2 left-2 h-0.5 w-0.5 rounded-full bg-white san-pulse"></span>
              <span className="absolute top-5 left-7 h-1 w-1 rounded-full bg-white san-pulse" style={{animationDelay: '0.5s'}}></span>
              <span className="absolute top-3 left-12 h-0.5 w-0.5 rounded-full bg-white san-pulse" style={{animationDelay: '1s'}}></span>
            </div>
            {/* Cloud in light mode */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? "opacity-0" : "opacity-100"}`}>
              <span className="absolute top-4 left-12 h-2 w-6 rounded-full bg-white/60"></span>
              <span className="absolute top-3 left-14 h-3 w-4 rounded-full bg-white/60"></span>
            </div>
          </div>
          <div
            className={`theme-switch-thumb ${isDark ? "dark" : ""} ${
              isDark
                ? "bg-gradient-to-br from-slate-100 to-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_4px_12px_rgba(251,191,36,0.5)]"
            }`}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">

        {/* =====================================================
            BRAND PANEL (Mobile: Top / Desktop: Left)
        ===================================================== */}
        <section className="relative flex min-h-[35vh] w-full items-center justify-center px-6 py-12 transition-colors duration-700 lg:min-h-screen lg:w-[45%] lg:px-16">
          {/* Brand Content */}
          <div className="flex w-full max-w-md flex-col items-center text-center">
            {/* Logo Wrapper - MADE BIGGER */}
            <div className="san-scale-in mb-8 sm:mb-10">
              <div className="relative">
                {/* Ambient Logo Glow */}
                <div className="san-glow absolute inset-0 scale-150 rounded-full bg-amber-500/20 blur-3xl"></div>

                <img
                  src={logo}
                  alt="SAN Photography"
                  className={`relative h-auto w-[180px] object-contain opacity-95 drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-all duration-700 hover:scale-105 hover:drop-shadow-[0_0_35px_rgba(255,255,255,0.25)] sm:w-[240px] lg:w-[300px] ${isDark ? "" : "invert"}`}
                />
              </div>
            </div>

            {/* ADMIN STUDIO Label */}
            <div className="san-fade-up mb-6 opacity-0 [animation-delay:0.2s]">
              <p className={`font-display text-xs font-semibold uppercase tracking-[0.45em] sm:text-sm transition-colors duration-700 ${isDark ? "text-amber-400/80" : "text-amber-800/70"}`}>
                Admin Studio
              </p>
            </div>

            {/* Divider */}
            <div className="san-fade-up flex items-center gap-4 opacity-0 [animation-delay:0.35s]">
              <span className={`san-line block h-px transition-colors duration-700 ${isDark ? "bg-white/20" : "bg-black/20"}`} />
              <span className={`font-display text-[10px] uppercase tracking-[0.4em] transition-colors duration-700 ${isDark ? "text-white/40" : "text-black/50"}`}>
                Private Access
              </span>
              <span className={`san-line block h-px transition-colors duration-700 ${isDark ? "bg-white/20" : "bg-black/20"}`} />
            </div>

            {/* Description */}
            <p className={`san-fade-up mt-7 max-w-[300px] text-[11px] font-light leading-7 tracking-[0.2em] opacity-0 [animation-delay:0.55s] sm:text-[12px] transition-colors duration-700 ${isDark ? "text-white/40" : "text-black/50"}`}>
              MANAGE YOUR STORIES, IMAGES & CREATIVE WORK.
            </p>
          </div>

          {/* Bottom Watermark */}
          <div className="san-fade-in absolute bottom-5 left-0 right-0 text-center opacity-0 [animation-delay:1.2s]">
            <p className={`font-display text-[9px] uppercase tracking-[0.4em] transition-colors duration-700 ${isDark ? "text-white/20" : "text-black/30"}`}>
              SAN Photography • Private Access
            </p>
          </div>
        </section>

        {/* =====================================================
            LOGIN PANEL (Mobile: Bottom / Desktop: Right)
        ===================================================== */}
        <section className="relative flex min-h-[65vh] w-full items-center justify-center px-5 py-10 sm:px-8 transition-colors duration-700 lg:min-h-screen lg:w-[55%] lg:px-12">
          
          {/* Floating soft gradient blobs specific to login side */}
          <div className={`pointer-events-none absolute top-1/4 left-1/4 z-[-1] h-72 w-72 rounded-full blur-3xl transition-colors duration-700 ${isDark ? "bg-amber-500/5" : "bg-amber-100/40"}`}></div>
          <div className={`pointer-events-none absolute bottom-1/4 right-1/4 z-[-1] h-64 w-64 rounded-full blur-3xl transition-colors duration-700 ${isDark ? "bg-purple-900/5" : "bg-rose-100/30"}`}></div>

          {/* Container - MADE BIGGER (max-w-[480px] sm:max-w-[560px]) */}
          <div className="relative w-full max-w-[480px] sm:max-w-[560px]">
            {/* Header */}
            <div className="san-fade-up mb-8 opacity-0 [animation-delay:0.2s] sm:mb-12">
              <p className={`mb-3 font-display text-[12px] font-semibold uppercase tracking-[0.35em] transition-colors duration-700 ${isDark ? "text-amber-400/60" : "text-amber-800/60"}`}>
                Private Access
              </p>
              <h1 className={`font-display text-[42px] font-medium leading-[1.1] tracking-tight transition-colors duration-700 sm:text-[58px] ${isDark ? "text-white" : "text-[#171717]"}`}>
                Welcome back.
              </h1>
              <p className={`mt-4 text-[15px] font-light leading-6 transition-colors duration-700 sm:mt-5 ${isDark ? "text-white/50" : "text-[#5a524a]"}`}>
                Sign in to manage your photography website.
              </p>
            </div>

            {/* Glassmorphism Login Card - MADE BIGGER (p-8 sm:p-10, rounded-[28px]) */}
            <div
              className={`san-scale-in rounded-[28px] border p-8 opacity-0 [animation-delay:0.4s] backdrop-blur-2xl transition-all duration-700 sm:p-10 ${
                isDark
                  ? "bg-white/[0.03] border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
                  : "bg-white/60 border-white/60 shadow-[0_30px_80px_-20px_rgba(45,38,30,0.15)]"
              }`}
            >
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
                {/* Username Input */}
                <div className="san-fade-up opacity-0 [animation-delay:0.55s]">
                  <label
                    htmlFor="username"
                    className={`mb-2.5 block font-display text-[13px] font-semibold uppercase tracking-[0.15em] transition-colors duration-700 ${isDark ? "text-white/80" : "text-[#3d3833]"}`}
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    className={`san-input h-14 w-full rounded-xl border px-5 text-[15px] font-medium outline-none transition-all duration-300 ${
                      isDark
                        ? "dark-input bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 focus:border-amber-500/40 focus:bg-white/[0.05]"
                        : "bg-[#faf9f7]/80 border-[#e5e0d7] text-[#171717] placeholder:text-[#b0a89e] focus:border-[#171717] focus:bg-white"
                    }`}
                  />
                </div>

                {/* Password Input */}
                <div className="san-fade-up opacity-0 [animation-delay:0.7s]">
                  <label
                    htmlFor="password"
                    className={`mb-2.5 block font-display text-[13px] font-semibold uppercase tracking-[0.15em] transition-colors duration-700 ${isDark ? "text-white/80" : "text-[#3d3833]"}`}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className={`san-input h-14 w-full rounded-xl border px-5 pr-14 text-[15px] font-medium outline-none transition-all duration-300 ${
                        isDark
                          ? "dark-input bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 focus:border-amber-500/40 focus:bg-white/[0.05]"
                          : "bg-[#faf9f7]/80 border-[#e5e0d7] text-[#171717] placeholder:text-[#b0a89e] focus:border-[#171717] focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#8b847c] hover:text-[#171717]"}`}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18.7 18.7 0 0 1-3.1 4.5" />
                          <path d="M6.6 6.6C3.5 8.7 2 12 2 12s3.5 8 10 8c1.4 0 2.7-.3 3.8-.8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me + Forgot */}
                <div className="san-fade-up flex items-center justify-between opacity-0 [animation-delay:0.8s]">
                  <label className="flex cursor-pointer items-center gap-2.5 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`san-checkbox border transition-all duration-300 ${
                        isDark
                          ? "bg-white/[0.03] border-white/20 checked:bg-amber-500 checked:border-amber-500"
                          : "bg-white/50 border-[#d4ccc0] checked:bg-[#171717] checked:border-[#171717]"
                      }`}
                    />
                    <span className={`text-[13px] font-medium tracking-wide transition-colors duration-700 ${isDark ? "text-white/60" : "text-[#5a524a]"}`}>
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/forgot-password')}
                    className={`text-[13px] font-medium tracking-wide transition-colors hover:underline ${isDark ? "text-amber-400/70 hover:text-amber-400" : "text-amber-800/70 hover:text-amber-900"}`}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error Display */}
                {error && (
                  <div className={`san-fade-in rounded-xl border px-4 py-3 text-[13px] font-medium leading-5 backdrop-blur-sm transition-colors duration-300 ${
                    isDark
                      ? "border-red-500/20 bg-red-500/10 text-red-400"
                      : "border-red-200/80 bg-red-50/80 text-red-600"
                  }`}>
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="san-fade-up pt-2 opacity-0 [animation-delay:0.9s]">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`san-shine-wrap flex h-14 w-full items-center justify-center rounded-xl text-[12px] font-bold uppercase tracking-[0.25em] transition-all duration-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 ${
                      isDark
                        ? "bg-white text-[#0a0a0b] shadow-[0_12px_30px_-8px_rgba(255,255,255,0.2)] hover:-translate-y-[2px] hover:bg-white/90 hover:shadow-[0_18px_40px_-8px_rgba(255,255,255,0.3)]"
                        : "bg-[#171717] text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.4)] hover:-translate-y-[2px] hover:bg-[#292725] hover:shadow-[0_18px_40px_-8px_rgba(0,0,0,0.5)]"
                    }`}
                  >
                    {loading ? (
                      <svg className={`san-spinner h-6 w-6 ${isDark ? "text-[#0a0a0b]" : "text-white"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="san-fade-up mt-8 text-center opacity-0 [animation-delay:1.1s] sm:mt-10">
              <p className={`font-display text-[11px] uppercase tracking-[0.3em] transition-colors duration-700 ${isDark ? "text-white/30" : "text-[#aaa29a]"}`}>
                Authorized Personnel Only
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminLogin;