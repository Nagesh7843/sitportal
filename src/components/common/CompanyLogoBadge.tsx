import React, { useState, useEffect } from 'react';
import {
  resolveCompanyDomain,
  getClearbitLogoUrl,
  getGoogleFaviconUrl,
  getDuckDuckGoIconUrl,
  getCompanyInitials,
  getCompanyColorGradient
} from '@/utils/companyLogo';

interface CompanyLogoBadgeProps {
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallbackText?: boolean;
}

export const CompanyLogoBadge: React.FC<CompanyLogoBadgeProps> = ({
  name,
  logoUrl,
  websiteUrl,
  size = 'md',
  className = '',
  showFallbackText = true,
}) => {
  const [sourceIndex, setSourceIndex] = useState<number>(0);
  const [sources, setSources] = useState<string[]>([]);
  const [hasError, setHasError] = useState<boolean>(false);

  const domain = resolveCompanyDomain(name, websiteUrl);

  useEffect(() => {
    const list: string[] = [];

    // 1. Explicit user/database provided URL
    if (logoUrl && logoUrl.trim()) {
      list.push(logoUrl.trim());
    }

    // 2. Multi-tier web logo APIs for the resolved domain
    if (domain) {
      // Clearbit Vector / High-Res PNG
      list.push(getClearbitLogoUrl(domain));
      // Unavatar API
      list.push(`https://unavatar.io/${domain}?fallback=false`);
      // Google HD Favicon & Web Icon (128px)
      list.push(getGoogleFaviconUrl(domain, 128));
      // DuckDuckGo HD Icon
      list.push(getDuckDuckGoIconUrl(domain));
    }

    // Remove duplicates
    const unique = Array.from(new Set(list.filter(Boolean)));
    setSources(unique);
    setSourceIndex(0);
    setHasError(unique.length === 0);
  }, [name, logoUrl, websiteUrl, domain]);

  const handleImageError = () => {
    if (sourceIndex + 1 < sources.length) {
      setSourceIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px] rounded-lg',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-2xl',
    xl: 'w-16 h-16 text-base rounded-2xl',
  }[size];

  const imgSizeClasses = {
    sm: 'max-w-[22px] max-h-[22px]',
    md: 'max-w-[30px] max-h-[30px]',
    lg: 'max-w-[38px] max-h-[38px]',
    xl: 'max-w-[50px] max-h-[50px]',
  }[size];

  const currentSrc = sources[sourceIndex];
  const initials = getCompanyInitials(name);
  const palette = getCompanyColorGradient(name);

  if (hasError || !currentSrc) {
    return (
      <div
        className={`flex items-center justify-center font-black shadow-xs bg-gradient-to-br ${palette.bg} ${palette.text} ${sizeClasses} ${className}`}
        title={name}
      >
        {showFallbackText ? initials : <span className="material-symbols-outlined text-[16px]">domain</span>}
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center bg-white border border-gray-100 shadow-xs p-1 overflow-hidden shrink-0 ${sizeClasses} ${className}`}
      title={name}
    >
      <img
        key={currentSrc}
        src={currentSrc}
        alt={`${name} logo`}
        onError={handleImageError}
        className={`object-contain transition-transform duration-200 hover:scale-105 ${imgSizeClasses}`}
        loading="lazy"
      />
    </div>
  );
};
