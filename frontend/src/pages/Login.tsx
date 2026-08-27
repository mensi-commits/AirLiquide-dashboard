import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Lock,
    Eye,
    EyeOff,
    Shield,
    BarChart3,
    Users,
    Leaf,
    Loader2,
} from "lucide-react";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json().catch(() => ({ error: "Server error. Please try again later." }));

            if (!response.ok) {
                throw new Error(data.error || "Invalid credentials");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/dashboard");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white">
            {/* h-screen + w-screen + overflow-hidden = fills viewport exactly, no scroll */}

            {/* ─────────── Left Panel ─────────── */}
            <div className="relative hidden w-1/2 lg:block">
                <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyNOwR8-www_qgJz477i9UdWFDE8ANI15K8C2yzKNS1lSj46vdpgQJIcY&s=10"
                    alt="Air Liquide Factory"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-blue-900/30 to-blue-950/90" />

                <div className="relative flex h-full flex-col justify-between p-10 text-white">
                    <div />

                    <div className="max-w-sm">
                        <h2 className="text-[2.75rem] font-light leading-[1.15] tracking-tight">
                            Delivering
                            <br />
                            essential gases,
                            <br />
                            empowering
                            <br />
                            life and industry
                        </h2>
                        <div className="mt-8 h-0.5 w-10 bg-white/70" />
                        <p className="mt-6 text-sm font-light leading-relaxed text-white/80">
                            Secure. Reliable. Efficient.
                            <br />
                            Together, we build a better future.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Shield, title: "Safety First", desc: "Safety at the heart of everything." },
                            { icon: BarChart3, title: "Excellence", desc: "Continuous process improvement." },
                            { icon: Users, title: "Collaboration", desc: "Stronger together across all teams." },
                            { icon: Leaf, title: "Sustainability", desc: "Committed to a cleaner future." },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/10"
                            >
                                <item.icon className="mb-3 h-6 w-6 text-white/90" strokeWidth={1.5} />
                                <div className="text-[13px] font-semibold leading-snug">
                                    {item.title}
                                </div>
                                <div className="mt-1 text-[11px] leading-relaxed text-white/70">
                                    {item.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─────────── Right Panel ─────────── */}
            <div className="flex w-full flex-col justify-center lg:w-1/2 h-full overflow-y-auto">
                {/* overflow-y-auto here allows the form to scroll ONLY if viewport is extremely small */}

                <div className="mx-auto w-full max-w-[420px] px-8 py-10 sm:px-12 lg:px-16">

                    <div className="flex h-16 items-center justify-center">
                        <img src="/air-liquide.png" alt="Air Liquide Logo" className="h-10 w-auto" />
                    </div>

                    <h1 className="mt-6 text-center text-[1.75rem] font-bold text-slate-900">
                        Operations Control Center
                    </h1>
                    <p className="mt-2 text-center text-[15px] text-slate-500">
                        Sign in to access the manufacturing dashboard
                    </p>

                    <form className="mt-8 space-y-5" onSubmit={handleLogin}>

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200 flex items-center gap-2">
                                <Shield className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Username */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g., logistics, laboratory, admin"
                                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 outline-none transition hover:text-slate-600 focus:text-slate-600"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot password */}
                        <div className="flex justify-end">
                            <a
                                href="#"
                                className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                                onClick={(e) => {
                                    e.preventDefault();
                                    alert("Please contact your system administrator to reset your password.");
                                }}
                            >
                                Forgot password?
                            </a>
                        </div>

                        {/* Sign in Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0053b3] text-sm font-semibold text-white shadow-sm transition hover:bg-[#004494] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>

                        {/* Helper Text for Internship Demo */}
                        <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-100">
                            <p className="font-semibold mb-1">Demo Credentials (Password: 123456)</p>
                            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                                <li><span className="font-mono bg-blue-100 px-1 rounded">logistics</span> (Logistique Team)</li>
                                <li><span className="font-mono bg-blue-100 px-1 rounded">laboratory</span> (Lab Team)</li>
                                <li><span className="font-mono bg-blue-100 px-1 rounded">production</span> (Production Team)</li>
                                <li><span className="font-mono bg-blue-100 px-1 rounded">admin</span> (Full Access)</li>
                            </ul>
                        </div>
                    </form>

                    {/* Footer notice */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <Shield className="h-3.5 w-3.5" />
                        <span>This is a secure system. All activities are monitored.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}