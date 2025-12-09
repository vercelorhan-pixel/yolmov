import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  countdown: number;
  autoReload: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    countdown: 5,
    autoReload: true,
  };

  private countdownInterval: NodeJS.Timeout | null = null;

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ [ErrorBoundary] Caught error:', error);
    console.error('❌ [ErrorBoundary] Error info:', errorInfo);
    this.setState({ errorInfo, countdown: 5, autoReload: true });
    
    // Start countdown for auto-reload
    this.startCountdown();
    
    // Optional: Send error to logging service
    // logErrorToService(error, errorInfo);
  }

  public componentWillUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private startCountdown = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      this.setState((prevState) => {
        const newCountdown = prevState.countdown - 1;
        
        if (newCountdown <= 0 && prevState.autoReload) {
          if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
          }
          window.location.reload();
          return prevState;
        }
        
        return { countdown: newCountdown };
      });
    }, 1000);
  };

  private cancelAutoReload = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.setState({ autoReload: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Bir Şeyler Yanlış Gitti
            </h1>
            
            {this.state.autoReload ? (
              <div className="mb-6">
                <p className="text-slate-600 mb-3">
                  Sayfa yüklenirken beklenmeyen bir hata oluştu.
                </p>
                <div className="flex items-center justify-center gap-2 text-brand-orange">
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                  <span className="font-bold text-lg">
                    {this.state.countdown} saniye içinde otomatik yenileniyor...
                  </span>
                </div>
                <button
                  onClick={this.cancelAutoReload}
                  className="text-sm text-slate-500 hover:text-slate-700 underline mt-2"
                >
                  Otomatik yenilemeyi iptal et
                </button>
              </div>
            ) : (
              <p className="text-slate-600 mb-6">
                Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
              </p>
            )}

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-700 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {!this.state.autoReload && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  <RefreshCcw size={18} />
                  Şimdi Yenile
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  <Home size={18} />
                  Ana Sayfa
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-6">
              Sorun devam ederse lütfen destek ekibimizle iletişime geçin.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
