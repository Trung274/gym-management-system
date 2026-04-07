import { toast as hotToast } from 'react-hot-toast';

/**
 * Centralized toast notification utility
 * Ensures consistent styling and behavior across the application
 */

const defaultStyle = {
    background: 'rgba(17, 24, 39, 0.95)',
    color: '#fff',
    backdropFilter: 'blur(10px)',
};

const defaultOptions = {
    duration: 4000,
    position: 'top-center' as const,
};

export const toast = {
    /**
     * Show success toast notification
     * @param message - Success message to display
     * @param duration - Optional custom duration (default: 4000ms)
     */
    success: (message: string, duration?: number) => {
        hotToast.success(message, {
            ...defaultOptions,
            duration: duration || defaultOptions.duration,
            style: {
                ...defaultStyle,
                border: '1px solid rgba(34, 197, 94, 0.5)',
            },
            iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
            },
        });
    },

    /**
     * Show error toast notification
     * @param message - Error message to display
     * @param duration - Optional custom duration (default: 4000ms)
     */
    error: (message: string, duration?: number) => {
        hotToast.error(message, {
            ...defaultOptions,
            duration: duration || defaultOptions.duration,
            style: {
                ...defaultStyle,
                border: '1px solid rgba(239, 68, 68, 0.5)',
            },
            iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
            },
        });
    },

    /**
     * Show info toast notification
     * @param message - Info message to display
     * @param duration - Optional custom duration (default: 4000ms)
     */
    info: (message: string, duration?: number) => {
        hotToast(message, {
            ...defaultOptions,
            duration: duration || defaultOptions.duration,
            icon: 'ℹ️',
            style: {
                ...defaultStyle,
                border: '1px solid rgba(59, 130, 246, 0.5)',
            },
        });
    },

    /**
     * Show warning toast notification
     * @param message - Warning message to display
     * @param duration - Optional custom duration (default: 4000ms)
     */
    warning: (message: string, duration?: number) => {
        hotToast(message, {
            ...defaultOptions,
            duration: duration || defaultOptions.duration,
            icon: '⚠️',
            style: {
                ...defaultStyle,
                border: '1px solid rgba(245, 158, 11, 0.5)',
            },
        });
    },

    /**
     * Show custom toast with icon
     * @param message - Message to display
     * @param icon - Custom icon/emoji
     * @param duration - Optional custom duration (default: 4000ms)
     */
    custom: (message: string, icon: string, duration?: number) => {
        hotToast(message, {
            ...defaultOptions,
            duration: duration || defaultOptions.duration,
            icon,
            style: defaultStyle,
        });
    },
};
