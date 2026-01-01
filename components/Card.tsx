import React from 'react';

interface CardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
    return (
        <div className={`bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden flex flex-col ${className}`}>
            <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
                <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            </div>
            <div className="p-6 flex-grow">
                {children}
            </div>
        </div>
    );
};

export default Card;