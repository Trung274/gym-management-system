import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: React.ReactNode;
    className?: string;
}

export default function PageHeader({ title, subtitle, className = '' }: PageHeaderProps) {
    return (
        <div className={className}>
            <h1 className="text-3xl font-black font-headline text-text-primary tracking-tight uppercase">
                {title}
            </h1>
            {subtitle && (
                <p className="text-text-secondary font-body mt-1">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
