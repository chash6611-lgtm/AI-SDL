import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-10 h-10 border-4',
        lg: 'w-16 h-16 border-4',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className={`${sizeClasses[size]} border-neon-blue border-t-transparent rounded-full animate-spin`}></div>
            {text && <p className="text-slate-600 font-medium">{text}</p>}
        </div>
    );
};