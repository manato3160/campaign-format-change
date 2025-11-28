import React from 'react';

interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', action }) => {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}>
            {title && (
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                {action && <div>{action}</div>}
            </div>
            )}
            <div className={`${title ? 'p-6' : 'p-4'} flex-1 flex flex-col`}>
                {children}
            </div>
        </div>
    );
};