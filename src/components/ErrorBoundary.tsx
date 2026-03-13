import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-zinc-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl border border-black/10 dark:border-white/10 p-8 text-center shadow-xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-2">Something went wrong</h2>
            <p className="text-sm text-black/50 dark:text-white/40 mb-6">
              The app encountered an unexpected error. Your data is safe.
            </p>
            <p className="text-[10px] font-mono text-black/30 dark:text-white/20 mb-6 break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
