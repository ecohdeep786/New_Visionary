/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
        // figma:company-pitch-deck-all-design (Ty6gmHof) — start
        "figma-primary": "hsl(var(--figma-primary))",
        "figma-secondary": "hsl(var(--figma-secondary))",
        "figma-accent": "hsl(var(--figma-accent))",
        "figma-muted": "hsl(var(--figma-muted))",
        "figma-subtle-2": "hsl(var(--figma-subtle-2))",
        "figma-color-9-2": "hsl(var(--figma-color-9-2))",
        "figma-color-10-2": "hsl(var(--figma-color-10-2))",
        "figma-color-11-2": "hsl(var(--figma-color-11-2))",
        "figma-color-14-2": "hsl(var(--figma-color-14-2))",
        "figma-color-15-2": "hsl(var(--figma-color-15-2))",
        "figma-color-16-2": "hsl(var(--figma-color-16-2))",
        "figma-color-17-2": "hsl(var(--figma-color-17-2))",
        "figma-color-18-2": "hsl(var(--figma-color-18-2))",
        "figma-color-19-2": "hsl(var(--figma-color-19-2))",
        "figma-color-20-2": "hsl(var(--figma-color-20-2))",
        "figma-text-1-2": "hsl(var(--figma-text-1-2))",
        // figma:company-pitch-deck-all-design (Ty6gmHof) — end
      
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  		
  		
  		'figma-color-14': 'hsl(var(--figma-color-14))',
  		
  		'figma-text-3': 'hsl(var(--figma-text-3))',
  		
  		'figma-color-19': 'hsl(var(--figma-color-19))',
  		
  		'figma-color-15': 'hsl(var(--figma-color-15))',
  		
  		'figma-color-16': 'hsl(var(--figma-color-16))',
  		
  		'figma-color-20': 'hsl(var(--figma-color-20))',
  		
  		'figma-surface': 'hsl(var(--figma-surface))',
  		
  		'figma-color-10': 'hsl(var(--figma-color-10))',
  		
  		'figma-color-13': 'hsl(var(--figma-color-13))',
  		
  		'figma-highlight': 'hsl(var(--figma-highlight))',
  		
  		'figma-color-18': 'hsl(var(--figma-color-18))',
  		
  		'figma-text-2': 'hsl(var(--figma-text-2))',
  		
  		'figma-color-12': 'hsl(var(--figma-color-12))',
  		
  		'figma-color-17': 'hsl(var(--figma-color-17))',
  		
  		'figma-text-5': 'hsl(var(--figma-text-5))',
  		
  		'figma-text-4': 'hsl(var(--figma-text-4))',
  		
  		'figma-color-11': 'hsl(var(--figma-color-11))',
  		
  		'figma-text-1': 'hsl(var(--figma-text-1))',
  		
  		'figma-color-9': 'hsl(var(--figma-color-9))',
  		
  		'figma-subtle': 'hsl(var(--figma-subtle))',

  		'nav-active': 'hsl(var(--nav-active))',
  		'nav-active-text': 'hsl(var(--nav-active-text))',

  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		
  		
  		fontSize: {
        // figma:company-pitch-deck-all-design (Ty6gmHof) — start
        "figma-6": "6px",
        "figma-12": "12px",
        "figma-14": "14px",
        "figma-16": "16px",
        "figma-18": "18px",
        "figma-19": "19px",
        "figma-24": "24px",
        "figma-32": "32px",
        "figma-42": "42px",
        "figma-48": "48px",
        "figma-96": "96px",
        // figma:company-pitch-deck-all-design (Ty6gmHof) — end
      
  			
  			'figma-10': '10px',
  			
  			'figma-11': '11px',
  			
  			'figma-12': '12px',
  			
  			'figma-14': '14px',
  			
  			'figma-15': '15px',
  			
  			'figma-16': '16px',
  			
  			'figma-18': '18px',
  			
  			'figma-20': '20px',
  			
  			'figma-22': '22px',
  			
  			'figma-24': '24px',
  			
  			'figma-26': '26px',
  			
  			'figma-28': '28px',
  			
  			'figma-30': '30px',
  			
  			'figma-32': '32px',
  			
  			'figma-36': '36px',
  			
  			'figma-38': '38px',
  			
  			'figma-40': '40px',
  			
  			'figma-42': '42px',
  			
  			'figma-52': '52px',
  			
  			'figma-96': '96px',
  			
  		},
  		
  		
  		fontWeight: {
        // figma:company-pitch-deck-all-design (Ty6gmHof) — start
        "figma-normal": "400",
        "figma-medium": "500",
        "figma-w-510": "510",
        "figma-w-590": "590",
        "figma-semibold": "600",
        "figma-bold": "700",
        // figma:company-pitch-deck-all-design (Ty6gmHof) — end
      
  			
  			'figma-normal': '400',
  			
  			'figma-medium': '500',
  			
  			'figma-w-510': '510',
  			
  			'figma-w-590': '590',
  			
  			'figma-semibold': '600',
  			
  			'figma-bold': '700',
  			
  		},
  		
  		
  		lineHeight: {
        // figma:company-pitch-deck-all-design (Ty6gmHof) — start
        "figma-9": "9px",
        "figma-16": "16px",
        "figma-18": "18px",
        "figma-20": "20px",
        "figma-21": "21px",
        "figma-23": "23px",
        "figma-26": "26px",
        "figma-29": "29px",
        "figma-30": "30px",
        "figma-38": "38px",
        "figma-44": "44px",
        "figma-57": "57px",
        "figma-60": "60px",
        "figma-144": "144px",
        // figma:company-pitch-deck-all-design (Ty6gmHof) — end
      
  			
  			'figma-13': '13px',
  			
  			'figma-14': '14px',
  			
  			'figma-15': '15px',
  			
  			'figma-16': '16px',
  			
  			'figma-17': '17px',
  			
  			'figma-18': '18px',
  			
  			'figma-19': '19px',
  			
  			'figma-20': '20px',
  			
  			'figma-21': '21px',
  			
  			'figma-22': '22px',
  			
  			'figma-23': '23px',
  			
  			'figma-24': '24px',
  			
  			'figma-25': '25px',
  			
  			'figma-26': '26px',
  			
  			'figma-28': '28px',
  			
  			'figma-30': '30px',
  			
  			'figma-35': '35px',
  			
  			'figma-36': '36px',
  			
  			'figma-38': '38px',
  			
  			'figma-40': '40px',
  			
  			'figma-44': '44px',
  			
  			'figma-48': '48px',
  			
  			'figma-49': '49px',
  			
  			'figma-52': '52px',
  			
  			'figma-53': '53px',
  			
  			'figma-57': '57px',
  			
  			'figma-65': '65px',
  			
  			'figma-144': '144px',
  			
  		},
  		
  		
  		fontFamily: {
        // figma:company-pitch-deck-all-design (Ty6gmHof) — start
        "figma-inter": ['"Inter"', 'sans-serif'],
        // figma:company-pitch-deck-all-design (Ty6gmHof) — end
      
  			
  			'heading': ['"Google Sans"', 'sans-serif'],
  			
  			'paragraph': ['"Google Sans"', 'sans-serif'],
  			
  			'figma-open-sans': ['"Open Sans"', 'sans-serif'],
  			
  			'figma-roboto': ['"Roboto"', 'sans-serif'],
  			
  			'figma-google-sans-flex': ['"Google Sans Flex"', 'sans-serif'],
  			
  			'figma-sf-pro': ['"SF Pro"', 'sans-serif'],
  			
  			'figma-plus-jakarta-sans': ['"Plus Jakarta Sans"', 'sans-serif'],
  			
  		},
  		transitionTimingFunction: {
  			'google': 'cubic-bezier(0.22, 1, 0.36, 1)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};