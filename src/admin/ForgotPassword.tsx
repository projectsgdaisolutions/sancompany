import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo/san.logo.png";
import loginBg from "../assets/login_bg.png";
import { readApiJson } from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("deeptiajoshi01@gmail.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/forgot-password.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await readApiJson(response, "Forgot password");

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send reset link right now.");
      }

      setSuccess(data.message || "If an account exists for this email, a password reset link has been sent.");
      setEmail("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d0d0d] px-4 py-8 text-[#171717]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.14),_transparent_30%)]" />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[#f7f3ee]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
        <div className="mb-7 flex items-center justify-center">
          <img src={logo} alt="SAN Photography" className="h-14 w-auto" />
        </div>

        <div className="mb-7 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7a7168]">Admin Access</p>
          <h1 className="font-display text-4xl text-[#171717]">Forgot Password</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2.5 block text-[12px] font-semibold uppercase tracking-[0.18em] text-[#544f4a]">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="h-14 w-full rounded-xl border border-[#e5e0d7] bg-[#faf9f7]/80 px-5 text-[15px] font-medium text-[#171717] outline-none transition-all duration-300 placeholder:text-[#b0a89e] focus:border-[#171717] focus:bg-white"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-[13px] font-medium text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-[13px] font-medium text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-[#171717] text-[12px] font-bold uppercase tracking-[0.24em] text-white transition-all duration-300 hover:-translate-y-[2px] hover:bg-[#292725] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-7 text-center">
          <Link to="/admin/login" className="text-[13px] font-medium text-amber-800/80 transition-colors hover:text-amber-900 hover:underline">
            Back to Login
          </Link>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#5a524a] transition-colors hover:text-[#171717]"
          >
            Return to Admin Login
          </button>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
