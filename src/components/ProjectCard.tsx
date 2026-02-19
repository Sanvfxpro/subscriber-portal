import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface ProjectCardProps {
    content: string;
    description?: string;
    isDraggable?: boolean;
    onDragStart?: () => void;
    className?: string; // Allow extra styling (like borders, shadows) from parent
    style?: React.CSSProperties; // For inline styles like dynamic cursors
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
    content,
    description,
    isDraggable = true,
    onDragStart,
    className = '',
    style = {},
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const iconRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            // Position above the icon, centered horizontally relative to icon
            setTooltipPos({
                top: rect.top - 10, // 10px spacing
                left: rect.left + rect.width / 2
            });
            setShowTooltip(true);
        }
    };

    return (
        <div
            draggable={isDraggable}
            onDragStart={onDragStart}
            className={`p-3 rounded-lg border transition-all hover:shadow-md relative group ${className}`}
            style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-primary)',
                color: 'var(--color-text-primary)',
                cursor: isDraggable ? 'move' : 'default',
                ...style,
            }}
        >
            <div className="break-words pr-6">{content}</div>

            {description && (
                <>
                    <div
                        ref={iconRef}
                        className="absolute top-3 right-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible transition-all duration-200 outline-none"
                        role="button"
                        aria-label="Show card description"
                        tabIndex={0}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={() => setShowTooltip(false)}
                        onFocus={handleMouseEnter}
                        onBlur={() => setShowTooltip(false)}
                    >
                        <Info size={16} className="text-blue-400 cursor-help" />
                    </div>
                    {showTooltip && createPortal(
                        <div
                            className="fixed z-50 w-48 p-2 text-xs rounded shadow-lg pointer-events-none"
                            style={{
                                top: tooltipPos.top,
                                left: tooltipPos.left + 8,
                                transform: 'translate(-100%, -100%)',
                                backgroundColor: 'var(--color-neutral-800)',
                                color: 'white'
                            }}
                        >
                            {description}
                            {/* Arrow */}
                            <div
                                className="absolute -bottom-1 right-2 w-2 h-2 rotate-45"
                                style={{ backgroundColor: 'var(--color-neutral-800)' }}
                            />
                        </div>,
                        document.body
                    )}
                </>
            )
            }
        </div >
    );
};
