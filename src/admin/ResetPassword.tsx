import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/logo/san.logo.png";
import loginBg from "../assets/login_bg.png";
import { readApiJson } from "../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      setError("This password reset link is invalid or missing a token.");
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("This password reset link is invalid or missing a token.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/reset-password.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await readApiJson(response, "Password reset");

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to reset your password.");
      }

      setSuccess(data.message || "Password reset successful.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 1800);
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
          <h1 className="font-display text-4xl text-[#171717]">Reset Password</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!token && !error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-[13px] font-medium text-amber-700">
              Checking reset link...
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-2.5 block text-[12px] font-semibold uppercase tracking-[0.18em] text-[#544f4a]">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                className="h-14 w-full rounded-xl border border-[#e5e0d7] bg-[#faf9f7]/80 px-5 pr-14 text-[15px] font-medium text-[#171717] outline-none transition-all duration-300 placeholder:text-[#b0a89e] focus:border-[#171717] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b847c] hover:text-[#171717]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2.5 block text-[12px] font-semibold uppercase tracking-[0.18em] text-[#544f4a]">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
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
            disabled={loading || !token}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-[#171717] text-[12px] font-bold uppercase tracking-[0.24em] text-white transition-all duration-300 hover:-translate-y-[2px] hover:bg-[#292725] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPassword;
