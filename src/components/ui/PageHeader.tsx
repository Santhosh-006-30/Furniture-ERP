import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="hover:text-slate-300 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-slate-400 font-medium' : ''}>{crumb.label}</span>
                  )}
                  {!isLast && <span>/</span>}
                </React.Fragment>
              );
            })}
          </nav>
        )}
        <h1 className="text-2xl font-black bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
          {title}
        </h1>
        {description && <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 mt-2 md:mt-0 shrink-0">{actions}</div>}
    </div>
  );
}
