
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg ${className}`}>
            <div className="p-3 sm:p-5">
                {children}
            </div>
        </div>
    );
};
