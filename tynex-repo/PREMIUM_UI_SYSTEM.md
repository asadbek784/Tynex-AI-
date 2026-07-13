# TYNEX AI - Premium UI System Documentation

## Overview

TYNEX AI features a cutting-edge, production-ready premium design system with glassmorphism, luxury animations, and enterprise-grade components. Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, and Lucide React.

---

## Design System

### Color Palette

**Primary Colors:**
- **Cyan**: `#00D4FF` - Primary accent, UI highlights, interactive elements
- **Purple**: `#9333EA` - Secondary accent, gradients, premium touches
- **Blue**: `#3B82F6` - Supporting color, backgrounds, tertiary elements

**Neutral Colors:**
- **Background**: `#0B0F19` - Base dark background
- **Surface**: `#111827` - Card and surface backgrounds
- **Border**: `#1F2937` - Borders and dividers
- **Text Primary**: `#FFFFFF` - Main text color
- **Text Secondary**: `#94A3B8` - Secondary text
- **Text Tertiary**: `#64748B` - Tertiary text

### Typography

**Font Stack:**
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
```

**Size Scale:**
- xs: 12px
- sm: 14px
- base: 16px
- lg: 18px
- xl: 20px
- 2xl: 24px
- 3xl: 30px
- 4xl: 36px
- 5xl: 48px

**Font Weights:**
- Light: 300
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800

### Spacing Scale

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 40px
- 3xl: 48px
- 4xl: 64px

### Border Radius

- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- full: 9999px

---

## Glass Effects

The system implements multiple layers of glassmorphism for depth and luxury:

### Glass Effect Classes

```typescript
// Small glass effect (less prominent)
.glass-effect-sm

// Standard glass effect (balanced)
.glass-effect

// Large glass effect (more prominent)
.glass-effect-lg
```

**Technical Implementation:**
```css
background: rgba(30, 41, 59, 0.4);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
border: 1px solid rgba(71, 85, 105, 0.3);
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.3);
```

---

## Aurora Background Effects

Dynamic animated background with floating gradients:

```typescript
// Static aurora effect
.aurora-bg

// Animated aurora effect (15s loop)
.aurora-bg-animated
```

Creates layered radial gradients:
- Cyan glow (20% left, 50% top)
- Purple glow (80% right, 80% bottom)
- Blue glow (40% left, 20% top)

---

## Premium Animations

### Built-in Animations

**Fade In**
```typescript
@keyframes fade-in
.animate-fade-in
Duration: 300ms
Effect: Opacity 0→1, Scale 0.95→1
```

**Slide Up**
```typescript
@keyframes slide-up
.animate-slide-up
Duration: 300ms
Effect: Opacity 0→1, Y position 10px→0
```

**Slide Down, Left, Right**
```typescript
.animate-slide-down
.animate-slide-left
.animate-slide-right
```

**Bounce In**
```typescript
.animate-bounce-in
Duration: 500ms
Effect: Scale animation with easing
```

**Float**
```typescript
.animate-float
Duration: 3s
Effect: Continuous Y-axis oscillation
```

**Typing**
```typescript
.animate-typing
Duration: 3.5s
Effect: Width animation for typing effect
```

**Pulse Glow**
```typescript
.pulse-glow
Duration: 2s
Effect: Box shadow pulsation
```

### Framer Motion Implementation

All major components use Framer Motion for smooth, performant animations:

```typescript
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## Premium Components

### 1. Sidebar Component

**Location:** `components/premium/Sidebar.tsx`

**Features:**
- Responsive mobile/desktop layout
- Glass morphism styling
- Navigation with icons
- User profile section
- New chat button with gradient
- Search functionality
- Logout button
- Animated interactions

**Usage:**
```typescript
import { Sidebar } from '@/components/premium/Sidebar'

<Sidebar
  items={navItems}
  onNewChat={handleNewChat}
  onLogout={handleLogout}
  userEmail="user@example.com"
  isOpen={sidebarOpen}
  onToggle={setSidebarOpen}
/>
```

### 2. Chat Message Component

**Location:** `components/premium/ChatMessage.tsx`

**Features:**
- User and AI message styling
- Gradient avatars
- Code block support
- Message actions (copy, retry, share, bookmark)
- Hover animations
- Timestamps
- Streaming-ready structure

**Usage:**
```typescript
import { ChatMessage } from '@/components/premium/ChatMessage'

<ChatMessage
  role="assistant"
  content="Your message here..."
  hasCode={false}
  timestamp={new Date()}
  onCopy={() => {}}
  onRetry={() => {}}
/>
```

### 3. Prompt Composer Component

**Location:** `components/premium/PromptComposer.tsx`

**Features:**
- Auto-expanding textarea
- AI suggestion buttons
- File attachment support
- Voice input button
- Character counter
- Gradient submit button
- File type filtering
- Keyboard shortcuts (Shift+Enter for multiline)

**Usage:**
```typescript
import { PromptComposer } from '@/components/premium/PromptComposer'

<PromptComposer
  onSubmit={handleSendMessage}
  onAttach={handleAttachFiles}
  loading={isLoading}
  placeholder="Ask anything..."
/>
```

### 4. Auth Card Component

**Location:** `components/premium/AuthCard.tsx`

**Features:**
- Google OAuth integration
- GitHub OAuth integration
- Email/password authentication
- Show/hide password toggle
- Error message display
- Loading states
- Beautiful form styling
- Sign up/Sign in toggle

**Usage:**
```typescript
import { AuthCard } from '@/components/premium/AuthCard'

<AuthCard
  type="login"
  onGoogleLogin={handleGoogleLogin}
  onEmailSubmit={handleEmailSubmit}
  loading={isLoading}
  error={errorMessage}
/>
```

---

## Premium Pages

### Dashboard Page

**Location:** `app/dashboard/page.tsx`

**Features:**
- Full-screen chat interface
- Sidebar integration
- Message history
- Loading indicators
- Aurora background
- Premium styling throughout

### Login Page

**Location:** `app/auth/login/page.tsx`

**Features:**
- Animated background with floating orbs
- Premium login form
- Feature showcase
- Responsive design
- Error handling
- Loading states

---

## Gradient Utilities

### Gradient Border

```typescript
.gradient-border          // Cyan to Blue
.gradient-border-accent   // Purple to Cyan
```

Creates beautiful animated borders using Tailwind's `border-box` technique.

---

## Glow Effects

```typescript
.glow-cyan               // Cyan glow
.glow-purple             // Purple glow
.glow-blue               // Blue glow
.pulse-glow              // Animated pulsing glow
```

---

## Animation Classes Reference

| Class | Duration | Effect |
|-------|----------|--------|
| `.animate-fade-in` | 300ms | Fade in with scale |
| `.animate-slide-up` | 300ms | Slide up entry |
| `.animate-slide-down` | 300ms | Slide down entry |
| `.animate-slide-left` | 300ms | Slide left entry |
| `.animate-slide-right` | 300ms | Slide right entry |
| `.animate-shimmer` | 2s | Shimmer effect |
| `.animate-bounce-in` | 500ms | Bounce entry |
| `.animate-float` | 3s | Floating motion |
| `.animate-typing` | 3.5s | Typing animation |
| `.animate-cursor-blink` | 1s | Cursor blink |
| `.pulse-glow` | 2s | Glow pulse |

---

## Utility Classes

### Glass Effects
```css
.glass-effect      /* Standard glass */
.glass-effect-sm   /* Subtle glass */
.glass-effect-lg   /* Prominent glass */
```

### Backgrounds
```css
.aurora-bg         /* Static aurora */
.aurora-bg-animated /* Animated aurora */
```

### Scrollbar
```css
/* Custom scrollbar applied globally */
::-webkit-scrollbar
::-webkit-scrollbar-track
::-webkit-scrollbar-thumb
```

### Responsive Classes
```css
/* Mobile-first responsive design */
md: /* tablets and up */
lg: /* desktops and up */
```

---

## Color Tokens

All colors use CSS custom properties for consistency:

```css
--primary: #00D4FF
--secondary: #9333EA
--accent: #3B82F6
--background: #0B0F19
--surface: #111827
--border: #1F2937
--text-foreground: #FFFFFF
--text-secondary: #94A3B8
--text-tertiary: #64748B
```

---

## Responsive Design

### Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Approach

All components are designed mobile-first then enhanced for larger screens:

```typescript
// Mobile (default)
<div className="w-full px-4">
  {/* Mobile layout */}
</div>

// Tablet and up
<div className="md:grid md:grid-cols-2">
  {/* Enhanced layout */}
</div>

// Desktop and up
<div className="lg:grid-cols-3">
  {/* Full-width layout */}
</div>
```

---

## Accessibility

### ARIA Attributes
- Semantic HTML elements
- Proper heading hierarchy
- Alt text for images
- Focus management
- Keyboard navigation support

### Reduced Motion
```css
@media (prefers-reduced-motion) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Only Text
```html
<span class="sr-only">Screen reader text</span>
```

---

## Performance Optimizations

### CSS-in-JS
- Tailwind CSS v4 (no runtime overhead)
- Pure CSS animations
- Hardware-accelerated transforms

### Code Splitting
- Dynamic imports for components
- Lazy loading of routes
- Optimized bundle size

### Images
- Optimized with Next.js Image component
- WebP format support
- Responsive images

### Animations
- GPU-accelerated with transform
- Smooth 60fps performance
- Respects prefers-reduced-motion

---

## Development Workflow

### Using Components

```typescript
import { Sidebar } from '@/components/premium/Sidebar'
import { ChatMessage } from '@/components/premium/ChatMessage'
import { PromptComposer } from '@/components/premium/PromptComposer'
import { AuthCard } from '@/components/premium/AuthCard'

// Use in your pages
export default function Page() {
  return (
    <div className="glass-effect rounded-lg p-6">
      {/* Your component */}
    </div>
  )
}
```

### Adding New Components

1. Create component in `components/premium/`
2. Use Framer Motion for animations
3. Apply glass effects and gradients
4. Test on mobile and desktop
5. Add TypeScript interfaces for props

### Tailwind Class Naming

```typescript
// Glass effects
.glass-effect
.glass-effect-sm
.glass-effect-lg

// Animations
.animate-fade-in
.animate-slide-up
.pulse-glow

// Gradients
.gradient-border
.gradient-border-accent

// Glows
.glow-cyan
.glow-purple
.glow-blue
```

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

### Fallbacks

- `backdrop-filter` with `-webkit-backdrop-filter`
- CSS gradients with fallback colors
- Animations work with `prefers-reduced-motion`

---

## File Structure

```
components/
├── premium/
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── ChatMessage.tsx      # Message display
│   ├── PromptComposer.tsx   # Input component
│   └── AuthCard.tsx         # Authentication form

app/
├── globals.css              # Design system styles
├── layout.tsx               # Root layout
├── dashboard/
│   └── page.tsx            # Dashboard page
└── auth/
    └── login/
        └── page.tsx        # Login page
```

---

## Getting Started

### 1. View Design System

All styles defined in `app/globals.css`

### 2. Use Premium Components

Import from `components/premium/`

### 3. Apply Tailwind Classes

Use glass effects, animations, and gradients in your markup

### 4. Customize Colors

Modify CSS custom properties in `globals.css`

---

## Production Ready

✅ TypeScript strict mode  
✅ Accessibility compliant  
✅ Mobile responsive  
✅ Performance optimized  
✅ SEO friendly  
✅ Dark theme (primary)  
✅ Custom scrollbars  
✅ Smooth animations  
✅ Error handling  
✅ Loading states  

---

## Support & Resources

- **Framer Motion**: https://www.framer.com/motion/
- **Tailwind CSS**: https://tailwindcss.com/
- **Lucide React**: https://lucide.dev/
- **Next.js**: https://nextjs.org/

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** 2026  
**License:** MIT
