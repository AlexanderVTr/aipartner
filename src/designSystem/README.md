# Design System

This design system provides a comprehensive set of design tokens, mixins, and utilities for consistent styling across the application.

## Structure

```
src/designSystem/theme/
├── variables.scss      # Design tokens (spacing, typography, sizing, etc.)
├── colors.global.scss  # Color palette and CSS custom properties
├── mixins.scss        # Reusable SCSS mixins
├── typography.scss    # Typography styles and utilities
├── reset.scss         # CSS reset
└── resources.scss     # Font imports and other resources
```

## Design Tokens

### Colors
- **Brand Colors**: Gradient colors used throughout the app
- **Semantic Colors**: Background, foreground, text colors
- **Component Colors**: Button, form, state-specific colors
- **Gradients**: Pre-defined gradient combinations

### Typography
- **Font Sizes**: `$font-size-xs` to `$font-size-5xl`
- **Header Sizes**: `$font-size-h1` to `$font-size-h6`
- **Font Weights**: `$font-weight-normal` to `$font-weight-bold`
- **Line Heights**: `$line-height-tight`, `$line-height-normal`, `$line-height-relaxed`

### Spacing
- **Consistent Scale**: `$space-xs` (4px) to `$space-9xl` (80px)
- **Legacy Support**: Maintains backward compatibility with existing naming

### Border Radius
- **Scale**: `$border-radius-none` to `$border-radius-2xl`
- **Special**: `$border-radius-full` (50%), `$border-radius-pill` (128px)

### Breakpoints
- **Mobile**: `$breakpoint-mobile` (440px)
- **Tablet**: `$breakpoint-tablet` (768px)
- **Desktop**: `$breakpoint-desktop` (1024px)
- **Wide**: `$breakpoint-wide` (1440px)

## Mixins

### Layout
```scss
@include flex-center;      // Flex center alignment
@include flex-between;     // Flex space-between
@include container;        // Max-width container with padding
@include absolute-center;  // Absolute center positioning
```

### Typography
```scss
@include heading-base;     // Base heading styles
@include h1;              // H1 specific styles
@include gradient-text;   // Gradient text effect
```

### Buttons
```scss
@include button-base;           // Base button styles
@include button-size('lg');     // Button sizing (sm, md, lg, xl)
```

### Gradients
```scss
@include gradient-primary;      // Primary gradient background
@include gradient-border-shadow; // Gradient border using box-shadow
```

### Responsive
```scss
@include mobile-only { ... }    // Mobile only styles
@include tablet-up { ... }      // Tablet and up
@include desktop-up { ... }     // Desktop and up
@include hover-only { ... }     // Hover states with proper media queries
```

### Transitions
```scss
@include transition-base;       // Standard transitions
@include transition-fast;       // Fast transitions
@include transition-slow;       // Slow transitions
```

## Usage Examples

### Using in Components

```scss
@use '@/designSystem/theme/variables' as *;
@use '@/designSystem/theme/mixins' as *;

.my-component {
  @include container;
  padding: $space-lg;
  border-radius: $border-radius-md;
  
  @include tablet-up {
    padding: $space-xl;
  }
}

.my-button {
  @include button-base;
  @include button-size('md');
  @include gradient-primary;
  
  @include hover-only {
    transform: translateY(-2px);
  }
}
```

### Using CSS Custom Properties

```scss
.my-element {
  background: var(--gradient-primary);
  color: var(--button-text-color);
  border: 1px solid var(--form-field-border-color);
}
```

### Typography Utilities

```html
<h1 class="gradient-text">Gradient Heading</h1>
<p class="text-lg font-medium leading-relaxed">Large text</p>
<span class="text-sm truncate">Truncated text</span>
```

## Benefits

1. **Consistency**: Unified design tokens across all components
2. **Maintainability**: Centralized values make updates easy
3. **Performance**: Optimized mixins reduce code duplication
4. **Scalability**: Easy to extend with new tokens and mixins
5. **Developer Experience**: IntelliSense support and clear naming conventions
6. **Responsive**: Built-in responsive design patterns
7. **Accessibility**: Proper hover states and semantic color naming

## Migration Notes

- Legacy variable names are maintained for backward compatibility
- All existing components have been updated to use the design system
- CSS custom properties provide runtime theming capabilities
- SCSS variables provide compile-time optimizations 