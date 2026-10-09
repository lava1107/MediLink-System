import React from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[MediLink Global ErrorBoundary]", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      // Clear localStorage cache keys to clear corrupted states
      localStorage.removeItem("medilink:db_v2");
      localStorage.removeItem("medilink:notifications_v2");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <ShieldAlert size={32} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white mb-2">MediLink Recovery Console</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                A runtime exception occurred in the application view. The system has prevented a blank screen and preserved your session.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left font-mono text-[11px] text-red-300 max-h-36 overflow-y-auto break-all">
              {this.state.error?.message || "Unknown rendering exception"}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                <RefreshCw size={14} />
                Refresh Application
              </button>
              <button
                onClick={this.handleHardReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-colors"
              >
                <Home size={14} />
                Reset Cache & Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
