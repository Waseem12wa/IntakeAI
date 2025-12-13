import React from 'react';

/**
 * ResponsiveContainer - A wrapper component that provides responsive padding and max-width
 */
export const ResponsiveContainer = ({ children, maxWidth = '1200px', noPadding = false }) => {
    return (
        <div style={{
            maxWidth,
            margin: '0 auto',
            padding: noPadding ? 0 : 'clamp(16px, 4vw, 40px)',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {children}
        </div>
    );
};

/**
 * ResponsiveGrid - A responsive grid component
 */
export const ResponsiveGrid = ({ children, minWidth = '280px', gap = '1rem' }) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}), 1fr))`,
            gap: `clamp(${parseInt(gap) * 0.75}rem, 3vw, ${gap})`,
            width: '100%'
        }}>
            {children}
        </div>
    );
};

/**
 * ResponsiveButton - A touch-friendly responsive button
 */
export const ResponsiveButton = ({ children, onClick, style = {}, ...props }) => {
    return (
        <button
            onClick={onClick}
            style={{
                minHeight: '44px',
                minWidth: '44px',
                padding: 'clamp(12px, 2vw, 16px) clamp(20px, 3vw, 32px)',
                fontSize: 'clamp(14px, 1.5vw, 16px)',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ...style
            }}
            {...props}
        >
            {children}
        </button>
    );
};

/**
 * ResponsiveText - Responsive typography component
 */
export const ResponsiveText = ({ variant = 'body', children, style = {}, ...props }) => {
    const variants = {
        h1: {
            fontSize: 'clamp(1.75rem, 4vw + 1rem, 2.5rem)',
            fontWeight: 700,
            lineHeight: 1.2
        },
        h2: {
            fontSize: 'clamp(1.5rem, 3vw + 1rem, 2rem)',
            fontWeight: 600,
            lineHeight: 1.3
        },
        h3: {
            fontSize: 'clamp(1.25rem, 2vw + 1rem, 1.5rem)',
            fontWeight: 600,
            lineHeight: 1.4
        },
        body: {
            fontSize: 'clamp(0.875rem, 1vw + 0.5rem, 1rem)',
            lineHeight: 1.6
        },
        small: {
            fontSize: 'clamp(0.75rem, 0.8vw + 0.4rem, 0.875rem)',
            lineHeight: 1.5
        }
    };

    const Tag = variant.startsWith('h') ? variant : 'p';

    return (
        <Tag style={{ ...variants[variant], ...style }} {...props}>
            {children}
        </Tag>
    );
};

/**
 * ResponsiveStack - A flex container that stacks on mobile
 */
export const ResponsiveStack = ({ children, direction = 'row', gap = '1rem', style = {} }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `clamp(${parseInt(gap) * 0.75}rem, 2vw, ${gap})`,
            ...style
        }}>
            {children}
        </div>
    );
};

/**
 * MobileOnly - Show only on mobile
 */
export const MobileOnly = ({ children }) => {
    return (
        <div style={{ display: 'block' }} className="hide-desktop">
            {children}
        </div>
    );
};

/**
 * DesktopOnly - Show only on desktop
 */
export const DesktopOnly = ({ children }) => {
    return (
        <div style={{ display: 'none' }} className="hide-mobile">
            {children}
        </div>
    );
};

export default {
    ResponsiveContainer,
    ResponsiveGrid,
    ResponsiveButton,
    ResponsiveText,
    ResponsiveStack,
    MobileOnly,
    DesktopOnly
};
