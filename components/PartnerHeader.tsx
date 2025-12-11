import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PartnerHeaderProps {
  showBackButton?: boolean;
}

const PartnerHeader: React.FC<PartnerHeaderProps> = ({ showBackButton = true }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Left: Back Button (optional) */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-600 hover:text-brand-orange transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline font-medium">Ana Sayfa</span>
            </Link>
          )}
        </div>

        {/* Center: Logo (Minimal) */}
        <Link to="/" className="flex items-center absolute left-1/2 -translate-x-1/2">
          <span className="yolmov-logo text-2xl md:text-3xl font-bold text-brand-orange">
            yolmov
          </span>
        </Link>

        {/* Right: Help Link */}
        <a
          href="mailto:destek@yolmov.com"
          className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors"
        >
          Yardım
        </a>
      </div>
    </header>
  );
};

export default PartnerHeader;
