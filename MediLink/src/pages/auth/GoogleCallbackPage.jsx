import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { api } from "../../services/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { T } from "../../utils/theme.js";

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState("processing"); // processing | success | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    if (errorParam) {
      setStatus("error");
      setErrorMessage(errorDesc || errorParam || "Access was denied by Google authentication.");
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("No authorization code received from Google OAuth callback.");
      return;
    }

    async function exchangeCode() {
      try {
        const result = await api.post("/auth/google/callback", { code });
        if (result && result.user && result.token) {
          localStorage.setItem("medilink.token", result.token);
          localStorage.setItem("medilink.session", JSON.stringify(result.user));
          await login(result.user);
          setStatus("success");
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 800);
        } else {
          throw new Error("Invalid token exchange response from server.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(err.message || "Failed to complete Google OAuth authentication.");
      }
    }

    exchangeCode();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: T.bg }}>
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl border text-center" style={{ borderColor: T.border }}>
        {status === "processing" && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Verifying Google OAuth 2.0 Session</h2>
            <p className="text-xs text-slate-500">Exchanging authorization code with backend & retrieving identity...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Authentication Verified!</h2>
            <p className="text-xs text-slate-500">Redirecting to your MediLink dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Google OAuth Error</h2>
            <div className="text-xs p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-left font-mono">
              {errorMessage}
            </div>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
