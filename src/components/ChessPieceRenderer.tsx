import React from 'react';
import { PieceType, PieceColor } from '@/chess/types';
import { PieceTheme } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { PieceIconSets } from './ChessPieceIcons';

interface ChessPieceRendererProps {
    type: PieceType;
    color: PieceColor;
    theme: PieceTheme;
    className?: string;
    style?: React.CSSProperties;
}

export function ChessPieceRenderer({ type, color, theme, className, style }: ChessPieceRendererProps) {
    // Select the appropriate icon set based on the theme
    // Default to Classic if the theme doesn't have a specific geometry set
    const iconSet = (PieceIconSets as any)[theme] || PieceIconSets.classic;
    const Icon = iconSet[type] || PieceIconSets.classic.pawn;

    // Base styles for all pieces
    const baseClasses = 'select-none transition-transform duration-500 relative z-20 w-[1em] h-[1em] block';

    // Theme-specific styles
    const getThemeStyles = () => {
        switch (theme) {
            case 'neo':
                return color === 'white'
                    ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] stroke-cyan-200'
                    : 'text-slate-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.3)] stroke-cyan-500';

            case 'alpha':
                return cn(
                    'stroke-2',
                    color === 'white' ? 'text-white stroke-black' : 'text-black stroke-white'
                );

            case 'vintage':
                return cn(
                    'sepia-[.6] drop-shadow-md',
                    color === 'white' ? 'text-[#f0d9b5] stroke-[#8b4513]' : 'text-[#4b3c2a] stroke-[#2d1b0e]'
                );

            case 'pixel':
                return cn(
                    'shape-rendering-crispEdges',
                    color === 'white' ? 'text-white stroke-black drop-shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'text-black stroke-white drop-shadow-[2px_2px_0_rgba(255,255,255,1)]'
                );

            case 'fantasy':
                return color === 'white'
                    ? 'text-amber-100 stroke-amber-700 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]'
                    : 'text-red-950 stroke-red-500 drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]';

            case 'scifi':
                return color === 'white'
                    ? 'text-blue-100 stroke-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                    : 'text-slate-900 stroke-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]';

            case 'glass':
                return cn(
                    'opacity-90',
                    color === 'white'
                        ? 'text-white/40 stroke-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)] backdrop-blur-sm'
                        : 'text-black/40 stroke-white/50 drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)] backdrop-blur-sm'
                );

            case 'metal':
                return color === 'white'
                    ? 'text-gray-200 stroke-gray-600 drop-shadow-[1px_1px_0_rgba(255,255,255,0.5)]'
                    : 'text-gray-800 stroke-gray-400 drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]';

            case 'neon_pieces':
                return color === 'white'
                    ? 'text-transparent stroke-fuchsia-400 drop-shadow-[0_0_3px_#e879f9] stroke-[2px]'
                    : 'text-transparent stroke-lime-400 drop-shadow-[0_0_3px_#a3e635] stroke-[2px]';

            // New Free Themes
            case 'minimal':
                return color === 'white'
                    ? 'text-white stroke-slate-800'
                    : 'text-slate-800 stroke-white';
            case 'round':
                return color === 'white'
                    ? 'text-indigo-100 stroke-indigo-600'
                    : 'text-indigo-900 stroke-indigo-300';
            case 'cubist':
                return color === 'white'
                    ? 'text-orange-100 stroke-orange-800'
                    : 'text-orange-900 stroke-orange-200';
            case 'modern':
                return color === 'white'
                    ? 'text-rose-50 stroke-rose-600'
                    : 'text-rose-900 stroke-rose-300';
            case 'simple':
                return color === 'white'
                    ? 'text-white stroke-black'
                    : 'text-black stroke-white';

            case 'classic':
            default:
                return color === 'white'
                    ? 'text-white stroke-black stroke-[1.5px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]'
                    : 'text-black stroke-white stroke-[1.5px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]';
        }
    };

    return (
        <div
            className={cn(baseClasses, getThemeStyles(), className)}
            style={{
                ...style,
                width: '1em',
                height: '1em',
            }}
        >
            <Icon width="100%" height="100%" />
        </div>
    );
}
