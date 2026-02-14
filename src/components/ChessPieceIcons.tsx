import React from 'react';

// Base icons (Classic)
const ClassicIcons = {
    king: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
                <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="currentColor" strokeLinecap="butt" />
                <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-5 2-8 2s-4-1-9-1-5 2-8 2-4-2.5-8-2-1.5-1-6 10.5v7V37z" fill="currentColor" strokeLinecap="butt" />
                <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" />
            </g>
        </svg>
    ),
    queen: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM10.5 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM38.5 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="currentColor" strokeLinejoin="miter" />
                <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14.5V25l-7-11-2 12z" fill="currentColor" strokeLinecap="butt" />
                <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none" />
                <path d="M9 26c0 2 1.5 2 2.5 4 1 2.5 1 1 0.5 4 0 2.5-1.5 4.5-1.5 4.5l22 0c0 0 0-5.5-4-9 .5-1.5 .5-1.5 .5-4 1-2.5 3-2.5 3-4" fill="currentColor" strokeLinecap="butt" />
            </g>
        </svg>
    ),
    rook: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinecap="butt" />
                <path d="M34 14l-3 3H14l-3-3" />
                <path d="M31 17v12.5c0 2.3-1.7 4.5-9 4.5s-9-2.3-9-4.5V17" fill="currentColor" strokeLinecap="butt" strokeLinejoin="miter" />
                <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
                <path d="M11 14h23" fill="none" strokeLinejoin="miter" />
            </g>
        </svg>
    ),
    bishop: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <g fill="currentColor" strokeLinecap="butt">
                    <path d="M9 36c3.39-.97 9.11-1.45 13.5-1.45 4.38 0 10.11.48 13.5 1.45V30c0-2.35-2.45-4-6.6-4-4.15 0-6.6 2-5 3.5-3.09-.94-5.22-2-6.28-2-4.14 0-6.6 1.65-6.6 4 0 4.15 2.45 2.4 8-1.5z" />
                    <path d="M22.5 9c-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9 4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9z" />
                    <path d="M16.5 36c5.23 2.11 12.35 1.77 17.65 0" fill="none" />
                </g>
                <path d="M22.5 9c2.47 0 5.48.96 6.88 4.67.66 1.76-2.07 9.5-2.07 9.5" />
                <path d="M22.5 9c-2.47 0-5.48.96-6.88 4.67-.66 1.76 2.07 9.5 2.07 9.5" />
                <path d="M22.5 5V2" strokeLinejoin="miter" />
                <path d="M20 3h5" strokeLinejoin="miter" />
            </g>
        </svg>
    ),
    knight: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" stroke="#000" />
                <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" fill="currentColor" stroke="#000" />
                <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#000" stroke="#000" />
                <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#000" stroke="#000" />
            </g>
        </svg>
    ),
    pawn: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" stroke="#000" strokeWidth="1.5" fill="currentColor" />
        </svg>
    )
};

// Simplified, abstract geometry
const MinimalIcons = {
    king: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M22.5 10v25M15 35h15M20 15h5" stroke="currentColor" strokeWidth="3" fill="none" />
            <circle cx="22.5" cy="8" r="3" fill="currentColor" />
        </svg>
    ),
    queen: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M22.5 35L15 12l7.5 5 7.5-5-7.5 23z" stroke="currentColor" strokeWidth="3" fill="none" />
            <circle cx="15" cy="12" r="2" fill="currentColor" />
            <circle cx="30" cy="12" r="2" fill="currentColor" />
            <circle cx="22.5" cy="17" r="2" fill="currentColor" />
        </svg>
    ),
    rook: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <rect x="12" y="15" width="21" height="20" rx="1" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M12 15V10h5v3h3v-3h5v3h3v-3h5v5" fill="currentColor" />
        </svg>
    ),
    bishop: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M22.5 35L17 15l5.5-5 5.5 5-5.5 20z" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M22.5 10v-3" stroke="currentColor" strokeWidth="2" />
            <circle cx="22.5" cy="20" r="2" fill="currentColor" />
        </svg>
    ),
    knight: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M15 35h15v-5l-5-5v-5l-5-5-5 5v15z" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M25 15l5 5" stroke="currentColor" strokeWidth="2" />
        </svg>
    ),
    pawn: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <circle cx="22.5" cy="18" r="6" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M15 35h15" stroke="currentColor" strokeWidth="3" />
            <path d="M22.5 24v11" stroke="currentColor" strokeWidth="3" />
        </svg>
    )
};

// Circular/Soft
const RoundIcons = {
    king: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <circle cx="22.5" cy="22.5" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M22.5 12v21M16 22.5h13" stroke="currentColor" strokeWidth="4" />
        </svg>
    ),
    queen: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <circle cx="22.5" cy="22.5" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M22.5 12v21M16 22.5h13" stroke="currentColor" strokeWidth="4" />
            <circle cx="22.5" cy="22.5" r="4" fill="currentColor" />
        </svg>
    ),
    rook: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <rect x="10" y="20" width="25" height="15" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="15" cy="15" r="3" fill="currentColor" />
            <circle cx="22.5" cy="15" r="3" fill="currentColor" />
            <circle cx="30" cy="15" r="3" fill="currentColor" />
        </svg>
    ),
    bishop: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <ellipse cx="22.5" cy="25" rx="8" ry="12" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="22.5" cy="10" r="3" fill="currentColor" />
        </svg>
    ),
    knight: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M15 30a10 10 0 0 1 10-10h5a5 5 0 0 1 5 5v5H15z" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="25" cy="15" r="3" fill="currentColor" />
        </svg>
    ),
    pawn: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <circle cx="22.5" cy="25" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="22.5" cy="15" r="4" fill="currentColor" />
        </svg>
    )
};

// Boxy/Pixel-like (but distinct from 'Pixel' theme)
const CubistIcons = {
    king: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <rect x="15" y="15" width="15" height="20" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="20" y="5" width="5" height="10" fill="currentColor" />
            <rect x="15" y="10" width="15" height="2" fill="currentColor" />
        </svg>
    ),
    queen: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <rect x="15" y="15" width="15" height="20" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="12" y="8" width="5" height="5" fill="currentColor" />
            <rect x="28" y="8" width="5" height="5" fill="currentColor" />
            <rect x="20" y="8" width="5" height="5" fill="currentColor" />
        </svg>
    ),
    rook: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <rect x="12" y="15" width="21" height="20" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="12" y="10" width="5" height="5" fill="currentColor" />
            <rect x="20" y="10" width="5" height="5" fill="currentColor" />
            <rect x="28" y="10" width="5" height="5" fill="currentColor" />
        </svg>
    ),
    bishop: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <polygon points="22.5,5 12,35 33,35" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="21" y="15" width="3" height="10" fill="currentColor" />
        </svg>
    ),
    knight: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M15 35h15v-10h-5v-5h-5v-5h-5z" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="18" y="12" width="3" height="3" fill="currentColor" />
        </svg>
    ),
    pawn: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <rect x="18" y="20" width="9" height="15" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="18" y="12" width="9" height="6" fill="currentColor" />
        </svg>
    )
};

// Modern Thin Line
const ModernIcons = {
    king: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M22.5 10v25M12 35h21" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M18 15l4.5-5 4.5 5" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
    ),
    queen: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M22.5 35l-5-20-5 5-3-5" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M22.5 35l5-20 5 5 3-5" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
    ),
    rook: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M12 35h21v-20h-21z" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M12 15v-5h5v3h3v-3h5v3h3v-3h5v5" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
    ),
    bishop: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M22.5 35l-6-20 6-5 6 5z" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
    ),
    knight: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M15 35h15l-5-15-5-5-5 5z" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
    ),
    pawn: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <circle cx="22.5" cy="15" r="4" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M18 35h9l-2-15h-5z" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
    )
};

// Bold/Filled
const SimpleIcons = {
    king: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M22.5 5v30M10 35h25" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
    ),
    queen: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <circle cx="22.5" cy="20" r="10" fill="currentColor" />
            <rect x="12" y="32" width="21" height="6" rx="3" fill="currentColor" />
        </svg>
    ),
    rook: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <rect x="12" y="12" width="21" height="26" rx="3" fill="currentColor" />
            <path d="M12 12h5v-3h-5zM20 12h5v-3h-5zM28 12h5v-3h-5z" fill="currentColor" />
        </svg>
    ),
    bishop: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M22.5 10l8 25h-16z" fill="currentColor" />
            <circle cx="22.5" cy="8" r="3" fill="currentColor" />
        </svg>
    ),
    knight: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <path d="M15 35h15v-10l-10-10-5 5z" fill="currentColor" />
        </svg>
    ),
    pawn: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 45 45" {...props}>
            <circle cx="22.5" cy="20" r="8" fill="currentColor" />
            <rect x="15" y="30" width="15" height="5" rx="2" fill="currentColor" />
        </svg>
    )
};

export const PieceIcons = {
    ...ClassicIcons
};

export const PieceIconSets = {
    classic: ClassicIcons,
    minimal: MinimalIcons,
    round: RoundIcons,
    cubist: CubistIcons,
    modern: ModernIcons,
    simple: SimpleIcons
};
