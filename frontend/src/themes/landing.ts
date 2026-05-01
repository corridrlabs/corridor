export const landingTheme = {
    background: {
        desktop: '#d4c5a9',
        pattern: {
            type: 'cardboard',
            gradient: `
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px),
        repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px)
      `,
            size: '100px 100px'
        }
    },
    taskbar: {
        background: 'bg-gradient-to-b from-gray-200 to-gray-300',
        border: 'border-b-2 border-gray-400',
        shadow: 'shadow-md'
    },
    window: {
        titleBar: {
            background: 'bg-gradient-to-b from-gray-200 to-gray-300',
            border: 'border-b border-gray-400',
            text: 'text-xs font-medium text-gray-700'
        },
        border: 'border border-gray-400',
        shadow: 'shadow-2xl',
        background: 'bg-white'
    },
    buttons: {
        close: {
            base: 'bg-red-500',
            hover: 'hover:bg-red-600',
            icon: 'text-red-900'
        },
        minimize: {
            base: 'bg-yellow-500',
            hover: 'hover:bg-yellow-600',
            icon: 'text-yellow-900'
        },
        maximize: {
            base: 'bg-green-500',
            hover: 'hover:bg-green-600',
            icon: 'text-green-900'
        }
    },
    icons: {
        background: 'bg-gradient-to-b from-white to-gray-100',
        border: 'border-2 border-gray-400',
        shadow: 'shadow-md',
        label: {
            background: 'bg-white/60',
            border: 'border border-gray-300',
            text: 'text-xs font-semibold text-gray-800'
        },
        selected: 'bg-blue-200/40 border border-blue-400'
    },
    shelf: {
        background: 'bg-gradient-to-b from-gray-100 to-gray-200',
        border: 'border-2 border-gray-400',
        shadow: 'shadow-xl'
    },
    colors: {
        blue: {
            light: 'from-blue-50 to-indigo-50',
            border: 'border-blue-200',
            icon: 'bg-blue-600'
        },
        purple: {
            light: 'from-purple-50 to-pink-50',
            border: 'border-purple-200',
            icon: 'bg-purple-600'
        },
        orange: {
            light: 'from-orange-50 to-red-50',
            border: 'border-orange-200',
            icon: 'bg-orange-600'
        }
    }
};

export type LandingTheme = typeof landingTheme;
