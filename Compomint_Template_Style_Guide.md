# Guide to Converting HTML to Compomint Templates

## Introduction

This guide explains how to convert standard HTML into Compomint-compatible templates, specifically targeting the Preline to compomint conversion process. Compomint is a lightweight JavaScript framework for creating web applications with a component-based architecture, providing a powerful template-based system for creating, combining, and reusing UI components efficiently.

## Table of Contents

1. [Understanding Compomint Template Structure](#understanding-compomint-template-structure)
2. [Basic Template Syntax](#basic-template-syntax)
3. [Converting HTML to Compomint Templates](#converting-html-to-compomint-templates)
4. [Component Lifecycle and State Management](#component-lifecycle-and-state-management)
5. [Event Handling](#event-handling)
6. [Internationalization (i18n)](#internationalization-i18n)
7. [Component Composition](#component-composition)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

---

## Understanding Compomint Template Structure

### Basic Structure

A Compomint template has the following structure:

```html
<template id="plin-ComponentName">
  <style id="style-plin-ComponentName">
    /* Component styles */
  </style>
  ##!
    // i18n definitions (pre-evaluation)
  ##
  ##
    // Component logic
  ##
  <div class="plin-ComponentName">
    <!-- Component content -->
  </div>
  ###
  <!-- Code that runs after render -->
  ##
</template>
```

### Naming Conventions

- **Template IDs**: Prefix with `plin-` (for Preline templates)
- **Style IDs**: Prefix with `style-` and match the template ID
- **CSS Classes**: Base component class should match the template ID
- **Child Elements**: Use BEM-like naming: `{ComponentNamePrefix}-{elementName}`

Example:
- Template ID: `plin-Button`
- Style ID: `style-plin-Button`
- Primary Class: `plin-Button`
- Child elements: `plin-Button-icon`, `plin-Button-text`

---

## Basic Template Syntax
Compomint uses a special syntax for template expressions and data binding:

| Syntax | Purpose | Example |
|--------|---------|---------|
| `##= ##` | Data interpolation (outputs values) | `<span>##=data.name##</span>` |
| `##- ##` | HTML-escaped output | `<div>##-data.html##</div>` |
| `##% ##` | Element insertion | `<div>##%childComponent##</div>` |
| `##! ##` | Pre-evaluation (runs once when template loads) | `##! compomint.addI18ns({ ... }) ##` |
| `## ##` | JavaScript code blocks | `## let x = 5; ##`, `##for (let i = 0; i < 10; i++) {## <span>##=i##</span>> ##}##` |
| `### ##` | Lazy evaluation (runs after render) | `### initComponent(component.element) ##` |
| `##* ##` | Comments | `##* This is a comment ##` |

### HTML Attribute Expressions
| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-co-event` | Event handling | `<button data-co-event="##:handleClick##">Click</button>` |
| `data-co-named-element` | Element references | `<input data-co-named-element="##:'inputField'##">` |
| `data-co-element-ref` | Element variables | `<div data-co-element-ref="##:container##">` |
| `data-co-props` | Setting multiple attributes | `<div data-co-props="##:{class: 'active', 'data-id': 123}##">` |
| `data-co-load` | Load callbacks | `<div data-co-load="##:initElement##">` |

### Built-in Variables
| Variable | Description |
|---|---|
| `data` | Data passed to the component |
| `i18n` | Internationalization object |
| `status` | Component state object |
| `component` | Component instance |
| `tmpl` | Template registry |
| `compomint` | Compomint object |

### Component Instance Methods
| Method                  | Description                       |
|-------------------------|-----------------------------------|
| `component.appendTo(element)` | Appends template to element       |
| `component.render(data)`    | Re-renders with new data          |
| `component.refresh(data)`   | Updates with partial data         |
| `component.remove(spacer)`  | Removes from DOM                  |
| `component.replace(newScope)`| Replaces with another template    |
| `component.release()`       | Releases template resources       |


---

## Converting HTML to Compomint Templates

### Step 1: Define Component Structure

1. Identify the component's boundaries and purpose
2. Determine what data the component needs
3. Decide on component name and ID prefix

### Step 2: Create Basic Template

1. Create a `<template>` tag with the appropriate ID
2. Add styles with matching style ID
3. Create the base HTML structure

Example:

```html
<template id="plin-Card">
  <style id="style-plin-Card"> /** style id should be in the format style-{templateId} */
    .plin-Card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
    }
  </style>
  <div class="plin-Card"> <!-- Primary class should match the template ID -->
    <!-- Content will go here -->
  </div>
</template>

<!-- 
const card = tmpl.plin.Card({});
document.body.appendChild(card);
-->
```

### Step 3: Add Data Bindings

Replace static content with data bindings:

```html
<template id="plin-Card">
  <style id="style-plin-Card">
    .plin-Card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
    }
    .plin-Card .plin-Card-title { <-- -->
      font-size: 1.5rem;
      font-weight: bold;
    }
  </style>
  <div class="plin-Card">
    <!-- tmpl.plin.Card({ title: 'Card Title', content: 'some text'}); data is passed here -->
    <h3 class="plin-Card-title">##=data.title##</h3> 
    <div class="plin-Card-content">##=data.content##</div>
  </div>
</template>

<!-- 
const card = tmpl.plin.Card({ title: 'Card Title', content: 'some text'});
document.body.appendChild(card);
-->
```

### Step 4: Add Component Logic

Include JavaScript code for component behavior:

```html
<template id="plin-Card">
  <style id="style-plin-Card">
    .plin-Card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
    }
  </style>
  ##
  // Component logic
  let cardClasses = 'bg-gray-800 text-gray-300 py-12';
  
  // Add variant classes
  if (data.variant === 'primary') {
    cardClasses += ' plin-Card--primary';
  } else if (data.variant === 'secondary') {
    cardClasses += ' plin-Card--secondary';
  }
  ##
  <div class="plin-Card' ##=cardClasses##">
    <h3 class="plin-Card-title">##=data.title##</h3>
    <div class="plin-Card-content">##=data.content##</div>
  </div>
</template>

<!--
const card = tmpl.plin.Card({ variant: 'primary' });
document.body.appendChild(card.element);
-->

```

### Step 5: Add Event Handlers

Add event handling to interactive elements:

```html
<template id="plin-Card">
  <!-- ... styles and logic ... -->
  <div class="##=cardClasses##">
    <h3 class="plin-Card-title">##=data.title##</h3>
    <div class="plin-Card-content">##=data.content##</div>
    ##if (data.dismissible) {##
      <button 
        class="plin-Card-closeBtn"
        data-co-event="##:{click: data.onClose}##"
      > <!-- data.onClose is a function that closes the card -->
        ×
      </button>
    ##}##
  </div>
</template>

<!--
const card = tmpl.plin.Card({
  title: 'My Card',
  content: 'This is the card content.',
  dismissible: true,
  onClose: () => {
    alert('Card closed!');
  }
});
document.body.appendChild(card.element);
-->
```

### Step 6: Add Internationalization (i18n)

Add support for multiple languages:

```html
<template id="plin-Card">
  <style id="style-plin-Card">
    /* ... styles ... */
  </style>
  ##!
  compomint.addI18ns({
    'plin-Card': {
      'closeButton': {
        'en': 'Close',
        'ko': '닫기',
        'ja': '閉じる',
        'zh': '关闭'
      }
    }
  });
  ##
  <!-- ... styles and logic ... -->
  <div class="##=cardClasses##">
    <h3 class="plin-Card-title">##=data.title##</h3>
    <div class="plin-Card-content">##=data.content##</div>
    ##if (data.dismissible) {##
      <button 
        class="plin-Card-closeBtn"
        data-co-event="##:{click: data.onClose}##"
      > <!-- data.onClose is a function that closes the card -->
        ##=i18n.closeButton## <!-- if document.documentElement.lang is 'ja' it will be '閉じる'-->
      </button>
    ##}##
  </div>
</template>

<!--
const card = tmpl.plin.Card({
  title: 'My Card',
  content: 'This is the card content.',
  dismissible: true,
  onClose: ({compomint}) => {
    alert('Card closed!');
  }
});
document.body.appendChild(card.element);
```

---

## Component Lifecycle and State Management

### Component Lifecycle

1. **Creation**: Template is compiled and rendered with data
2. **Rendering**: HTML is generated and inserted into the DOM
3. **Post-rendering**: Lazy evaluation code is executed
4. **Updates**: Component can be updated with `refresh()` or `render()`
5. **Removal**: Component can be removed from the DOM with `remove()`

### State Management

Use the `status` object to maintain state that persists across renders:

```html
<template id="plin-Counter">
  ##
    // Initialize state if not already present
    status.count = status.count || data.initialCount || 0;
    
    function increment() {
      status.count++;
      component.refresh();
    }
    
    function decrement() {
      status.count--;
      component.refresh();
    }
  ##
  <div class="plin-Counter">
    <span>Count: ##=status.count##</span>
    <button data-co-event="##:{click: decrement}##">-</button>
    <button data-co-event="##:{click: increment}##">+</button>
  </div>
</template>
```

---

## Event Handling

Event handlers receive these parameters:
1. `event` - The DOM event object
2. `eventData` - An object containing:
   - `data` - The component's data object
   - `customData` - The optional custom data passed after `::`
   - `element` - The element that triggered the event
   - `componentElement` - The main component element
   - `component` - The element that triggered the event
   - `compomint` - Reference to the global compomint object

### Basic Event Handling

```html
<button data-co-event="##:data.onClick##">Click Me</button>

<!--
const button = tmpl.plin.Button({
  onClick: (event, {data, customData, element, componentElement, component, compomint}) => {
    alert('Button clicked!');
  }
});
-->
```

### Multiple Event Types

```html
<input data-co-event="##:{
  focus: handleFocus,
  blur: handleBlur,
  input: handleInput
}##" />

<!--
const input = tmpl.plin.Input({
  value: 'initial value',
  handleFocus: () => {
    console.log('Input focused');
  },
  handleBlur: () => {
    console.log('Input blurred');
  },
  input: (event, {data, customData, element, componentElement, component, compomint}) => {
    if (data.onChange) {
      data.changeValue(data, event.target.value);
    }
  },
  changeValue: (data, value) => {
    data.value = value;
    console.log('Input value changed:', value);
  }
});
-->
```

### With Custom Data

```html
<button data-co-event="##:handleClick::data.itemData##">
  View Item
</button>

<!--
const button = tmpl.plin.Button({
  label: 'View Item',
  onClick: (event, {data, customData}) => {
    console.log('Item clicked:', customData); // -> 'Item clicked: { id: 123, name: 'Example Item' }'
  },
  itemData: { id: 123, name: 'Example Item' }
});
-->
```

### Advanced Event Map

```html
<div data-co-event="##:{
  triggerName: 'myTrigger',
  click: handleClick,
  mouseover: handleMouseOver,
  mouseout: handleMouseOut,
  namedElement: 'myDiv'
}##">
  Interactive Element
</div>
```

---

## Internationalization (i18n)

### Adding Translations

```html
##!
compomint.addI18ns({
  'plin-Button': {
    'main': {
      'label': {
        'en': 'Button',
        'ko': '버튼',
        'ja': 'ボタン',
        'zh': '按钮'
      },
    }
  }
});
##
```

### Using Translations

```html
<!-- With out default text -->
<button class="plin-Button">
  ##=i18n.main.label##
</button>

<!-- With default text -->
<button class="plin-Button">
  ##=i18n.main.label('Click me!')##
  <!--
  if document.documentElement.lang is 'ja' it will be '閉じる'
  if document.documentElement.lang is undefined it will be 'Click me!'
  -->
</button>

<!-- With custom text -->
<button class="plin-Button">
  ##=compomint.i18n['plin-Button'].main.label##
  ##=compomint.i18n['plin-Button'].main.label('Click me!')##
</button>
```

---

## Component Composition

### Including Child Components

```html
<template id="plin-Card">
  <!-- ... styles and logic ... -->
  <div class="plin-Card">
    <div class="plin-Card-header">##=data.title##</div>
    <div class="plin-Card-content">
      ##%data.content##
    </div>
    ##if (data.footer) {##
      <div class="plin-Card-footer">
        ##%data.footer##
      </div>
    ##}##
  </div>
</template>

<!--
const card = tmpl.plin.Card({
  title: 'My Card',
  content: 'This is the card content.',
  footer: tmpl.plin.Button({
    label: 'Close',
    variant: 'secondary',
    onClick: () => {
      alert('Card closed!');
    }
  })
});
document.body.appendChild(card);
-->
```

### Creating Child Components in Logic

```html
<template id="plin-UserProfile">
  ##
    // Create child components
    const userAvatar = tmpl.plin.Avatar({
      src: data.user.avatarUrl,
      size: 'large'
    });
    
    const userDetails = tmpl.plin.UserDetails({
      name: data.user.name,
      email: data.user.email,
      role: data.user.role
    });
  ##
  <div class="plin-UserProfile">
    <div class="plin-UserProfile-avatar">
      ##%userAvatar##
    </div>
    <div class="plin-UserProfile-details">
      ##%userDetails##
    </div>
  </div>
</template>
```

---

## Best Practices

### 1. Component Structure

- Keep components focused on a single responsibility
- Use consistent naming conventions
- Structure CSS using BEM methodology

### 2. Performance

- Use `refresh()` for small updates instead of `render()`
- Use non-blocking element insertion for heavy components: `##%heavyComponent::true##`
- Cache references to frequently accessed elements with `data-co-named-element`

### 3. Maintainability

- Add comments for complex logic
- Break large components into smaller, reusable ones
- Use meaningful variable and function names

### 4. Accessibility

- Include proper ARIA attributes
- Ensure keyboard navigation works
- Maintain semantic HTML structure

### 5. Error Handling

- Validate data before using it
- Provide fallbacks for missing or invalid data
- Use try/catch blocks for potentially error-prone operations

---

## Examples

### Button Component

```html
<template id="plin-Button">
  <style id="style-plin-Button">
    .plin-Button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .plin-Button .plin-Button--primary {
      background-color: #3b82f6;
      color: white;
    }
    .plin-Button .plin-Button--primary:hover {
      background-color: #2563eb;
    }
    .plin-Button .plin-Button--secondary {
      background-color: #e5e7eb;
      color: #1f2937;
    }
    .plin-Button .plin-Button--secondary:hover {
      background-color: #d1d5db;
    }
    .plin-Button .plin-Button--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .plin-Button .plin-Button-icon {
      margin-right: 0.5rem;
    }
  </style>
  ##!
  compomint.addI18ns({
    'plin-Button': {
      'label': {
        'en': 'Button',
        'ko': '버튼',
        'ja': 'ボタン',
        'zh': '按钮'
      }
    }
  });
  ##
  ##
  let buttonClasses = '';
  
  // Button variants
  if (data.variant === 'primary') {
    buttonClasses += ' plin-Button--primary';
  } else if (data.variant === 'secondary') {
    buttonClasses += ' plin-Button--secondary';
  } else {
    buttonClasses += ' plin-Button--primary'; // Default: primary
  }
  
  // Button sizes
  if (data.size === 'sm') {
    buttonClasses += ' plin-Button--sm';
  } else if (data.size === 'lg') {
    buttonClasses += ' plin-Button--lg';
  }
  
  // Disabled state
  if (data.disabled) {
    buttonClasses += ' plin-Button--disabled';
  }
  ##
  <button 
    class="plin-Button ##=buttonClasses##" 
    ##=data.disabled ? 'disabled' : ''##
    ##=data.type ? 'type="' + data.type + '"' : 'type="button"'##
    data-co-event="##:{click: data.onClick}##"
  >
    ##if (data.icon) {##
      <span class="plin-Button-icon">##%data.icon##</span>
    ##}##
    <span class="plin-Button-text">##=data.label || i18n.label##</span>
  </button>
</template>

<!--
const button = tmpl.plin.Button({
  label: 'Click me',
  variant: 'primary',
  size: 'lg',
  disabled: false,
  onClick: () => {
    alert('Button clicked!');
  }
});
document.body.appendChild(button);
-->
```

### Multiple Button Component
```html
<template id="plin-MultipleButtons">
  <style id="style-plin-MultipleButtons">
    .plin-MultipleButtons {
      display: flex;
      gap: 0.5rem;
    }
  </style>
  <div class="plin-MultipleButtons">
    ##data.buttons.forEach(buttonData => {##
      ##%tmpl.plin.Button(buttonData)##
    ##})##
  </div>
</template>

<!--
const multipleButtons = tmpl.plin.MultipleButtons({
  buttons: [
    { label: 'Button 1', variant: 'primary', onClick: () => alert('Button 1 clicked!') },
    { label: 'Button 2', variant: 'secondary', onClick: () => alert('Button 2 clicked!') },
    { label: 'Button 3', variant: 'primary', onClick: () => alert('Button 3 clicked!') }
  ]
});
document.body.appendChild(multipleButtons);
-->
```

### Modal Component

```html
<template id="plin-Modal">
  <style id="style-plin-Modal">
    .plin-Modal-backdrop {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 50;
    }
    .plin-Modal-backdrop .plin-Modal {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      max-width: 28rem;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .plin-Modal-backdrop .plin-Modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .plin-Modal-backdrop .plin-Modal-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }
    .plin-Modal-backdrop .plin-Modal-closeBtn {
      background: none;
      border: none;
      cursor: pointer;
      color: #6b7280;
    }
    .plin-Modal-backdrop .plin-Modal-body {
      padding: 1rem;
    }
    .plin-Modal-backdrop .plin-Modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
      gap: 0.5rem;
    }
  </style>
  ##!
  compomint.addI18ns({
    'plin-Modal': {
      'close': {
        'en': 'Close',
        'ko': '닫기',
        'ja': '閉じる',
        'zh': '关闭'
      }
    }
  });
  ##
  ##
  let isOpen = data.isOpen !== undefined ? data.isOpen : true;
  
  component.close = function() {
    isOpen = false;
    component.refresh();
    
    if (data.onClose) {
      data.onClose();
    }
  };
  
  // Close on backdrop click if closeOnBackdropClick is true
  component.handleBackdropClick = function(event) {
    if (data.closeOnBackdropClick && event.target === event.currentTarget) {
      component.close();
    }
  };
  
  // Close on escape key if closeOnEscape is true
  if (data.closeOnEscape) {
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && isOpen) {
        component.close();
      }
    });
  }
  ##
  ##if (isOpen) {##
    <div 
      class="plin-Modal-backdrop"
      data-co-event="##:{click: component.handleBackdropClick}##"
    >
      <div class="plin-Modal">
        <div class="plin-Modal-header">
          <h3 class="plin-Modal-title">##=data.title##</h3>
          ##if (data.showCloseButton !== false) {##
            <button 
              class="plin-Modal-closeBtn"
              data-co-event="##:{click: component.close}##"
            >
              <span aria-hidden="true">×</span>
              <span class="sr-only">##=i18n.close##</span>
            </button>
          ##}##
        </div>
        <div class="plin-Modal-body">
          ##%data.content##
        </div>
        ##if (data.footer) {##
          <div class="plin-Modal-footer">
            ##%data.footer##
          </div>
        ##}##
      </div>
    </div>
  ##}##
</template>

<!--
const modal = tmpl.plin.Modal({
  title: 'Modal Title',
  content: 'This is the modal content.',
  isOpen: false,
  closeOnBackdropClick: true,
  closeOnEscape: true,
  showCloseButton: true,
  onClose: () => {
    alert('Modal closed!');
  },
  footer: tmpl.plin.Button({
    label: 'Save',
    variant: 'primary',
    onClick: () => {
      alert('Save clicked!');
      modal.close();
    }
  })
});
document.body.appendChild(modal);
-->
```

### Form Input Component

```html
<template id="plin-Input">
  <style id="style-plin-Input">
    .plin-Input {
      margin-bottom: 1rem;
    }
    .plin-Input .plin-Input-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }
    .plin-Input .plin-Input-field {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      transition: border-color 0.15s;
    }
    .plin-Input .plin-Input-field:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .plin-Input .plin-Input-field--error {
      border-color: #ef4444;
    }
    .plin-Input .plin-Input-error {
      margin-top: 0.5rem;
      color: #ef4444;
      font-size: 0.875rem;
    }
    .plin-Input .plin-Input-helper {
      margin-top: 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }
  </style>
  ##!
  compomint.addI18ns({
    'plin-Input': {
      'placeholder': {
        'en': 'Enter a value',
        'ko': '값을 입력하세요',
        'ja': '値を入力してください',
        'zh': '请输入值'
      }
    }
  });
  ##
  ##
  let inputId = data.id || 'input-' + component._id;
  let inputValue = data.value || '';
  
  component.handleInput = function(e) {
    inputValue = e.target.value;
    
    if (data.onChange) {
      data.onChange(inputValue, e);
    }
  };
  ##
  <div class="plin-Input">
    ##if (data.label) {##
      <label 
        for="##=inputId##" 
        class="plin-Input-label"
      >
        ##=data.label##
      </label>
    ##}##
    
    <input
      id="##=inputId##"
      type="##=data.type || 'text'##"
      class="plin-Input-field ##=data.error ? 'plin-Input-field--error' : ''##"
      placeholder="##=data.placeholder || i18n.placeholder##"
      value="##=inputValue##"
      ##=data.required ? 'required' : ''##
      ##=data.disabled ? 'disabled' : ''##
      ##=data.readOnly ? 'readonly' : ''##
      data-co-named-element="##:'inputElement'##"
      data-co-event="##:{input: component.handleInput}##"
    >
    
    ##if (data.error) {##
      <div class="plin-Input-error">##=data.error##</div>
    ##}##
    
    ##if (data.helperText) {##
      <div class="plin-Input-helper">##=data.helperText##</div>
    ##}##
  </div>
  
  ###
    // Set focus on the input if autoFocus is true
    if (data.autoFocus && component.inputElement) {
      component.inputElement.focus();
    }
  ##
</template>

<!--
const input = tmpl.plin.Input({
  label: 'Username',
  placeholder: 'Enter your username',
  value: 'initial value',
  type: 'text',
  required: true,
  disabled: false,
  readOnly: false,
  error: 'This field is required',
  helperText: 'Please use a valid username',
  autoFocus: true,
  onChange: (value, event) => {
    console.log('Input changed:', value);
  }
});
document.body.appendChild(input);
-->
```

## Conclusion

Converting HTML to Compomint templates involves understanding the template syntax, component lifecycle, and best practices for component design. By following the guidelines in this document, you can create maintainable, reusable components that leverage the full power of the Compomint framework.

Remember to:
1. Use consistent naming conventions
2. Structure components with clear separation of concerns
3. Leverage data bindings for dynamic content
4. Add proper event handling for interactivity
5. Support internationalization for global applications
6. Compose components for complex UI patterns

With these practices, you'll be able to efficiently convert HTML designs into a robust component library using Compomint.