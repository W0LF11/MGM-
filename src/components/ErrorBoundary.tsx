import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught boundary error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-slate-950/80 border border-slate-900 rounded-3xl m-4 text-center space-y-6" id="error-boundary-container">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-xl shadow-rose-500/5">
            <ShieldAlert className="h-8 w-8 animate-pulse" />
          </div>
          
          <div className="space-y-2 max-w-md">
            <h2 className="text-lg font-black tracking-wider uppercase text-rose-500">
              Command Deck Execution Intercepted
            </h2>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              An unexpected rendering exception was caught inside the panel tree. The operator node has been safely isolated.
            </p>
            {this.state.error && (
              <div className="mt-4 p-3.5 bg-slate-950 rounded-xl border border-slate-900 text-left">
                <span className="text-[10px] font-mono text-rose-400/80 uppercase tracking-widest font-bold block mb-1">
                  Diagnostics:
                </span>
                <span className="text-[11px] font-mono text-slate-300 break-words leading-relaxed block">
                  {this.state.error.toString()}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload & Reset Console
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
