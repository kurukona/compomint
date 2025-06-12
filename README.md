# Compomint: A Template-Based Component Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The Compomint template-based component engine is a lightweight JavaScript framework for creating web applications with a focus on component-based architecture. It provides a powerful template-based system that allows you to create, combine, and reuse UI components efficiently.

[Compomint Website](https://compomint.dev/)
[Github Repository](https://github.com/kurukona/compomint)

## Table of Contents

1. [Introduction](#introduction)
2. [Key Features](#key-features)
3. [Example Applications](#example-applications)
4. [Installation](#installation)
5. [Basic Usage](#basic-usage)
6. [Template Syntax](#template-syntax)
7. [Advanced Features](#advanced-features)
8. [Template Lifecycle](#template-lifecycle)
9. [API Reference](#api-reference)
10. [Built-in Components](#built-in-components)
11. [Internal Workings](#internal-workings)
12. [Best Practices](#best-practices)
13. [Code Examples](#code-examples)
14. [Documentation](#documentation)
15. [License](#license)

## Introduction

Compomint is designed to simplify web application development by providing a lightweight component system. It focuses on high performance and ease of use, allowing developers to create reusable components with HTML, CSS, and JavaScript in a single template.

The framework is particularly suitable for:

- Single Page Applications (SPAs)
- Component-based user interfaces
- Applications that require efficient DOM manipulation

## Other Documentation

- [Compomint Template Style Guide](https://github.com/kurukona/compomint/blob/master/Compomint_Template_Style_Guide.md)

## Key Features

- **SPA Support**: Easy creation of Single Page Applications with component-based architecture
- **Lightweight**: Minimal footprint (~14KB gzipped) for fast loading and execution
- **Template-Based**: Use a simple yet powerful string-based template syntax with JavaScript evaluation
- **All-in-One Templates**: Define HTML, CSS, and JavaScript logic in a single template
- **Data Binding**: Easily bind data to your templates with reactive updates
- **Event Handling**: Attach events to HTML elements with a clean, declarative syntax
- **Component-Oriented**: Build reusable UI components with proper encapsulation
- **Component Composition**: Combine components like building blocks to create complex UIs
- **State Management**: Manage component state efficiently with automatic updates
- **Internationalization (i18n)**: Built-in support for multiple languages
- **Lazy Loading**: Load templates from external files when needed
- **Caching**: Automatic template caching for better performance

## Example Applications

You can find example applications demonstrating Compomint in action:

- **Compomint Core Greeting (ESM) Demo**: [Code](https://github.com/kurukona/compomint/blob/master/examples/greeting.esm.html) | [Demo](https://kurukona.github.io/compomint/examples/greeting.esm.html)
- **Compomint Core Greeting (UMD) Demo**: [Code](https://github.com/kurukona/compomint/blob/master/examples/greeting.umd.html) | [Demo](https://kurukona.github.io/compomint/examples/greeting.umd.html)
- **Component Examples**: [Code](https://github.com/kurukona/compomint/blob/master/examples/component_examples.html) | [Demo](https://kurukona.github.io/compomint/examples/component_examples.html)
- **Simple Counter**: [Code](https://github.com/kurukona/compomint/blob/master/examples/counter.html) | [Demo](https://kurukona.github.io/compomint/examples/counter.html)
- **Todo List**: [Code](https://github.com/kurukona/compomint/blob/master/examples/todo.html) | [Demo](https://kurukona.github.io/compomint/examples/todo.html)
- **Calculator**: [Code](https://github.com/kurukona/compomint/blob/master/examples/calculator.html) | [Demo](https://kurukona.github.io/compomint/examples/calculator.html)

## Installation

You can add Compomint to your project using several methods:

### Option 1: Include via Script Tag (Manual Download)

1. Download the latest `compomint.umd.js` (UMD build) or `compomint.esm.js` (ESM build) file from the [Compomint GitHub releases page](https://github.com/kurukona/compomint/dist).
2. Place the downloaded file in your project directory.
3. Add a script tag to your HTML file, pointing to the downloaded file.

For the UMD build (`compomint.umd.js`):

```html
<!-- index.html -->
<script src="path/to/your/compomint.umd.js"></script>
<!-- OR -->
<script src="path/to/your/compomint.umd.min.js"></script>
<!-- Minified version for production -->

<script>
  Compomint.compomint.addTmpl("greeting-npm", "<span>##=data.message##</span>");
  const greeting = Compomint.tmpl.greeting.npm({
    message: "Hello from Compomint via NPM!",
  });
  document.body.appendChild(greeting.element);
</script>
```

For the ESM build (`compomint.esm.js`), use `type="module"`:

```javascript
import { compomint, tmpl } from "path/to/your/compomint.esm.js";
// OR
import { compomint, tmpl } from "path/to/your/compomint.esm.min.js"; // Minified version for production

compomint.addTmpl("greeting-npm", "<span>##=data.message##</span>");
const greeting = tmpl.greeting.npm({
  message: "Hello from Compomint via NPM!",
});
document.body.appendChild(greeting.element);
```

Replace `path/to/your/` with the actual path to the file in your project.

### Option 2: Use CDN

Include the library directly from a Content Delivery Network (CDN). This is the quickest way to get started.

For the UMD build (`compomint.js`):

```html
<script src="https://cdn.jsdelivr.net/gh/kurukona/compomint@latest/dist/compomint.umd.js"></script>
<script src="https://cdn.jsdelivr.net/gh/kurukona/compomint@latest/dist/compomint.umd.min.js"></script>
<!-- Minified version for production -->
```

For the ESM build (`compomint.esm.js`), use `type="module"`:

```javascript
import {
  compomint,
  tmpl,
} from "https://cdn.jsdelivr.net/gh/kurukona/compomint@latest/dist/compomint.esm.js";
import {
  compomint,
  tmpl,
} from "https://cdn.jsdelivr.net/gh/kurukona/compomint@latest/dist/compomint.esm.min.js"; // Minified version for production
```

Using importmap:

```html
<!-- index.html -->
<script type="importmap">
  {
    "imports": {
      "compomint": "https://unpkg.com/compomint@1.0.0/dist/compomint.esm.min.js"
    }
  }
</script>
```

```javascript
// main.js
import { compomint, tmpl } from "compomint";
const greeting = tmpl.greeting.npm({
  message: "Hello from Compomint via NPM!",
});
document.body.appendChild(greeting.element);
```

Using `@latest` will load the most recent version. You can replace `@latest` with a specific version number (e.g., `@1.0.0`) for better stability in production.

### Option 3: NPM

Compomint is available on NPM, making it easy to integrate into your projects using a module bundler or Node.js.

```bash
npm install compomint
```

or

```bash
yarn add compomint
```

**Usage**:
Once installed, you can import Compomint into your JavaScript files.

If you are using ESM (ECMAScript Modules) (common in modern frontend projects with bundlers like Webpack, Rollup, or Parcel):

```javascript
import { compomint, tmpl } from "compomint";

// Start using Compomint:
compomint.addTmpl("greeting-npm", "<span>##=data.message##</span>");
const greeting = tmpl.greeting.npm({
  message: "Hello from Compomint via NPM!",
});
document.body.appendChild(greeting.element);
```

```javascript
const { compomint, tmpl } = require('compomint');

// Start using Compomint:
compomint.addTmpl('greeting-npm', '<span>##=data.message##</span>');
onst greeting = tmpl.greeting.npm({ message: 'Hello from Compomint via NPM!' });
document.body.appendChild(greeting.element);
```

The NPM package includes builds suitable for various environments, and your build tool will typically select the appropriate one.

**UMD vs. ESM Builds:**

- **UMD (Universal Module Definition):** This build works in various environments, including browsers (via script tags) and Node.js. It's suitable for direct inclusion in HTML files.
- **ESM (ECMAScript Modules):** This build uses the standard JavaScript module system (`import`/`export`). It's ideal for modern JavaScript development workflows using bundlers like Webpack, Rollup, or Parcel.

## Basic Usage

### 1. Define a Template

There are several ways to define templates in Compomint:

#### Method 1: Using compomint.addTmpl()

```javascript
compomint.addTmpl("do-Simple-Label", "<span>##=data.label##</span>");
```

#### Method 2: Using template tags with compomint.addTmpls()

Define templates in your HTML or JavaScript using the `<template>` tag:

```javascript
const templateString = `
  <template id="do-Simple-Label">
    <span class="do-Simple-Label">
      ##=data.label##
    </span>
  </template>

  <template id="do-Simple-Button">
    <style id="style-do-Simple-Button">
      .do-Simple-Button {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 8px 16px;
        text-align: center;
        cursor: pointer;
        border-radius: 4px;
      }
      .do-Simple-Button:hover {
        background-color: #45a049;
      }
    </style>
    <button class="do-Simple-Button"
        style="color: ##=data.color || 'white'##"
        data-co-event="##:data.onClick##">
      ##=data.label##
    </button>
  </template>
`;

compomint.addTmpls(templateString);
```

When using the template tag approach:

- The ID attribute determines the component name
- Styles defined within the template are automatically added to the document head
- Style tag IDs should follow the format "style-{template-id}" to prevent conflicts

#### Method 3: Loading Templates from HTML File

```html
<!DOCTYPE html>
<html>
  <body>
    <template id="do-Simple-Label">
      <span class="do-Simple-Label"> ##=data.label## </span>
    </template>
    <template id="do-Simple-Button">
      <style id="style-do-Simple-Button">
        .do-Simple-Button {
          background-color: #4caf50;
          border: none;
          color: white;
          padding: 8px 16px;
          text-align: center;
          cursor: pointer;
          border-radius: 4px;
        }
      </style>
      <button
        class="do-Simple-Button"
        style="color: ##=data.color || 'white'##"
        data-co-event="##:data.onClick##"
      >
        ##=data.label##
      </button>
    </template>
  </body>
</html>
```

Then load all templates at once:

```javascript
// Second parameter (true) removes template tags after loading
compomint.addTmpls(document.body.innerHTML, true);
```

#### Method 4: Loading Templates from External URL

```javascript
// Load templates from external file with callback
compomint.addTmplByUrl("templates.html", function () {
  console.log("Templates loaded successfully!");
  // Initialize your application here
  const mainScreen = tmpl.do.MainScreen({});
  document.body.appendChild(mainScreen.element);
});

// Promise-based loading (NEW: Version 1.0.3+)
compomint.addTmplByUrl("templates.html")
  .then(() => {
    console.log("Templates loaded successfully!");
    const mainScreen = tmpl.do.MainScreen({});
    document.body.appendChild(mainScreen.element);
  })
  .catch((error) => {
    console.error("Failed to load templates:", error);
  });

// Async/await support
async function loadAndInitialize() {
  try {
    await compomint.addTmplByUrl("templates.html");
    console.log("Templates loaded successfully!");
    const mainScreen = tmpl.do.MainScreen({});
    document.body.appendChild(mainScreen.element);
  } catch (error) {
    console.error("Failed to load templates:", error);
  }
}

// With options for loading
compomint.addTmplByUrl(
  {
    url: "templates.html",
    option: {
      loadScript: true, // Load and execute script tags
      loadStyle: true, // Load style tags
      loadLink: true, // Load link tags
    },
  },
  callback // Optional: if provided, uses callback; otherwise returns Promise
);

// Load multiple template files
compomint.addTmplByUrl([
  "templates/header.html", 
  "templates/main.html", 
  "templates/footer.html"
]).then(() => {
  console.log("All templates loaded successfully!");
  // All templates are now available
  const header = tmpl.ui.Header({ title: "My App" });
  const main = tmpl.ui.Main({ content: "Welcome!" });
  const footer = tmpl.ui.Footer({ year: 2024 });
  
  document.body.appendChild(header.element);
  document.body.appendChild(main.element);
  document.body.appendChild(footer.element);
});
```

### 2. Create and Use Components

Once templates are defined, you can create components and add them to the DOM:

#### Method 1: Using the `tmpl` Namespace

When you add templates using `compomint.addTmpl` or `compomint.addTmpls`, Compomint automatically creates and updates a convenient namespace object called `tmpl`. This object provides easy access to component creation functions based on their template IDs.

If a template ID contains hyphens (`-`), they are converted into a nested object structure. For example, a template with the ID `do-Simple-Label` becomes accessible as `tmpl.do.SimpleLabel`. This can be a more structured and often more readable way to instantiate components compared to using `compomint.tmpl('template-id')`.

```javascript
// Create a simple label component using the tmpl namespace
// The 'do-Simple-Label' ID is converted to tmpl.do.SimpleLabel
const label = tmpl.do.SimpleLabel({ label: "Hello World" });

// Add it to the DOM
document.body.appendChild(label.element);
```

Result:

```html
<span class="do-Simple-Label">Hello World</span>
```

#### Method 2: Using `compomint.tmpl()` function

Instead of using the `tmpl` namespace, you can also create components by directly calling the `compomint.tmpl()` function and passing the template ID as a string. This approach is useful in the following scenarios:

- When the template ID is determined dynamically (e.g., using an ID stored in a variable).
- When you prefer explicit function calls over the automatic namespace generation provided by `tmpl`.

```javascript
// Create a button with click handler
const button = compomint.tmpl("do-Simple-Button")({
  label: "Click Me",
  color: "white",
  onClick: (
    event,
    { data, customData, element, componentElement, component, compomint }
  ) => {
    alert("Button clicked!");
  },
});

// Add it to the DOM
document.body.appendChild(button.element);
```

Result:

```html
<button class="do-Simple-Button" style="color: white">Click Me</button>
<!-- With click event handler attached -->
```

The data you pass to the component (like `{label: 'Click Me', color: 'white'}`) is available inside the template as the `data` object.

### 3. Compose Components

One of Compomint's strengths is component composition. You can easily combine components to build complex UIs:

```javascript
compomint.addTmpls(`
  <template id="do-Counter">
    <style id="style-do-Counter">
      .do-Counter {
        border: 1px solid #ddd;
        padding: 16px;
        margin: 8px;
        border-radius: 4px;
        width: 200px;
        text-align: center;
      }
      .do-Counter .count {
        font-size: 24px;
        margin: 8px 0;
      }
    </style>
    ##
    // Initialize state
    let count = data.initialCount || 0;
    
    // Create child components
    const displayLabel = tmpl.do.SimpleLabel({
      label: 'Count: ' + count
    });
    
    const incrementButton = tmpl.do.SimpleButton({
      label: 'Increment',
      color: 'white',
      onClick: (event, {data}) => {
        count++;
        displayLabel.refresh({label: 'Count: ' + count});
      }
    });
    
    const decrementButton = tmpl.do.SimpleButton({
      label: 'Decrement',
      color: 'white',
      onClick: (event, {data}) => {
        count--;
        displayLabel.refresh({label: 'Count: ' + count});
      }
    });
    ##
    <div class="do-Counter">
      <h3>##=data.title || 'Counter'##</h3>
      <div class="count">##%displayLabel##</div>
      <div class="buttons">
        ##%decrementButton##
        ##%incrementButton##
      </div>
    </div>
  </template>
`);

// Create a counter component with initial count of 5
const counter = tmpl.do.Counter({
  title: "My Counter",
  initialCount: 5,
});

document.body.appendChild(counter.element);
```

Result:

```html
<div class="do-Counter">
  <h3>My Counter</h3>
  <div class="count">
    <span class="do-Simple-Label">Count: 5</span>
  </div>
  <div class="buttons">
    <button class="do-Simple-Button" style="color: white">Decrement</button>
    <button class="do-Simple-Button" style="color: white">Increment</button>
  </div>
</div>
```

## Template Syntax

Compomint uses a special syntax for template expressions and data binding.

### Style Definitions

Templates can include styles, which are automatically extracted and added to the document head:

```javascript
compomint.addTmpls(`
<template id="ui-Card">
  <style id="style-ui-Card">
    .ui-Card {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 16px;
      margin: 8px;
    }
    .ui-Card h3 {
      color: #333;
      margin-top: 0;
    }
  </style>
  <div class="ui-Card">
    <h3>##=data.title##</h3>
    <div>##=data.content##</div>
  </div>
</template>
`);

// Create multiple card instances
document.body.appendChild(
  tmpl.ui.Card({
    title: "Card 1",
    content: "This is the first card",
  }).element
);

document.body.appendChild(
  tmpl.ui.Card({
    title: "Card 2",
    content: "This is the second card",
  }).element
);
```

When included in a template, style elements with IDs are automatically extracted and added to the document head, ensuring that styles are defined only once regardless of how many component instances you create.

### Built-in Variables

These variables are available within templates:

- data
- status
- component
- i18n
- tmpl
- compomint

#### `data`

Contains the data passed when creating the component.

```javascript
// In template: ##=data.userName##
tmpl.user.Profile({ userName: "John Doe" });
```

#### `status`

Object for storing component state information that persists across refreshes.

```html
<!-- In template -->
## status.count = status.count || 0; ##
<button
  data-co-event="##:{
  click: function(event, {data, component}) {
    status.count++;
    component.refresh();
  }
}##"
>
  Clicked ##=status.count## times
</button>
```

#### `component`

Reference to the template scope, providing access to:

- `component.element` - The rendered DOM element
- `component.data` - The data used to render the template
- `component.status` - The status object for template state
- `component.render(data)` - Re-renders with new data
- `component.refresh(data)` - Updates with partial data
- And more (see API Reference section)

```html
<!-- In template -->
<button
  data-co-event="##:{
  click: function(event, {data, component}) {
    component.refresh({message: 'Updated!'});
  }
}##"
>
  Update
</button>
```

#### `i18n`

Internationalization object for localized text.

```javascript
// In template: ##=i18n.greeting##
// After setting up translations:
compomint.addI18n("user-profile.greeting", {
  en: "Welcome",
  fr: "Bienvenue",
  es: "Bienvenido",
});
```

#### `tmpl`

Reference to the template registry, providing access to:
// Create a component instance like

- `tmpl.ui.Button({label: 'Click Me'});`

#### `compomint`

Reference to the global compomint object, providing access to:

- `compomint.tools.genElement('div', {class: 'message'}, 'Hello');` - Creates a DOM element
- `compomint.tools.props({class: 'button', disabled: true});` - Creates HTML attribute string
- `compomint.tools.genId('my-component');` - Generates a unique ID
- `compomint.tools.escapeHtml.escape('Hello World');` - Escapes HTML characters
- And other global functions and configurations

```html
<textarea>
  ##=compomint.tools.escapeHtml.escape(data.userInput)##
</textarea>
```

### Expression Syntax

Compomint uses special delimiters for different types of expressions:

#### `##= ##` - Data Interpolation

Outputs string content. HTML tags will be interpreted as HTML.

```html
<span>##=data.userName##</span>

<!-- With a default value -->
<span>##=data.userName || 'Guest'##</span>

<!--  conditional formatting -->
<span class="##=data.isActive ? 'active' : 'inactive'##">
  ##=data.status##
</span>
```

If the property is a function, it will be called automatically:

```html
<!-- In template -->
<span>##=data.getFormattedName##</span>

<!-- When creating the component -->
tmpl.user.NameTag({ getFormattedName: function() { return 'Dr. John Smith, PhD';
} });
```

#### `##- ##` - HTML Escaping

Outputs the escaped value, preventing HTML injection:

```html
<!-- Unsafe content will be escaped -->
<div>##-data.userComment##</div>

<!--
If data.userComment = '<script>alert("XSS")</script>'
Output: &lt;script&gt;alert("XSS")&lt;/script&gt;
 -->
```

#### `##% ##` - Element Insertion

Used to include other components, HTML elements, or strings:

```html
<!-- Insert a single component -->
<div class="container">##%childComponent##</div>

<!-- Insert an array of components -->
<div class="container">
  ##%data.items.map(item => tmpl.ui.ListItem({text: item}))##
</div>

<!-- With optional non-blocking (async) insertion -->
<div class="heavy-content">##%heavyComponent::true##</div>
```

The second parameter after `::` indicates that insertion should be non-blocking.

#### `##! ##` - Pre-Evaluation

Code that runs when the template is first loaded (not on each render):

```html
<template id="user-profile">
  ##! // This code runs once when the template is loaded compomint.addI18ns({
  'user-profile': { 'greeting': { 'en': 'Welcome', 'fr': 'Bienvenue', 'es':
  'Bienvenido' } } }); ##
  <div>##=i18n.greeting##, ##=data.name##!</div>
</template>
```

#### `## ##` - JavaScript Code Block

Allows you to write JavaScript code that runs during rendering:

```html
<template id="product-list">
  ## // Process data before rendering const sortedProducts =
  data.products.sort((a, b) => a.price - b.price ); // Create a formatted price
  function function formatPrice(price) { return '$' + price.toFixed(2); } ##

  <div class="product-list">
    <h2>##=data.title##</h2>
    <ul>
      ##sortedProducts.forEach(product => {##
      <li>
        <strong>##=product.name##</strong>
        <span>##=formatPrice(product.price)##</span>
      </li>
      ##})##
    </ul>
  </div>
</template>
```

#### `### ##` - Lazy Evaluation

Code that runs after the template is rendered:

```html
<template id="chart-component">
  <div class="chart-container" id="chart-##=data.id##"></div>

  ### // This code runs after the element is in the DOM const chartElement =
  document.getElementById('chart-' + data.id); // Initialize a chart library new
  Chart(chartElement, { type: 'bar', data: data.chartData, options:
  data.chartOptions }); ##
</template>
```

#### `##* ##` - Comment Areas

```html
##* This is a comment area that won't be rendered. Use it for documenting your
template code. ##
```

### HTML Attribute Expressions

Compomint provides special HTML attributes for handling events, references, and dynamic content:

#### `data-co-event="##:handler##"` - Event Handling

Attaches event handlers to HTML elements:

```html
<!-- Simple click handler -->
<button data-co-event="##:handleClick##">Click Me</button>

<!-- Multiple event types -->
<input
  data-co-event="##:{
  focus: handleFocus,
  blur: handleBlur,
  input: handleInput
}##"
/>

<!-- With inline function -->
<button
  data-co-event="##:{
  click: function(event, {data, customData, element, componentElement, component, compomint}) {
    console.log('Clicked:', componentElement.textContent);
    alert('Hello, ' + data.userName + '!');
  }
}##"
>
  Greet
</button>

<!-- With custom data parameter -->
<button data-co-event="##:handleItemClick::data.item##">
  View ##=data.item.name##
</button>
```

Event handlers receive these parameters:

1. `event` - The DOM event object
2. `eventData` - An object containing:
   - `data` - The component's data object
   - `customData` - The optional custom data passed after `::`
   - `element` - The element that triggered the event
   - `componentElement` - The main component element
   - `component` - The element that triggered the event
   - `compomint` - Reference to the global compomint object

#### `data-co-named-element="##:variable##"` - Element References

Creates a named reference to an element in the template scope:

```html
<input type="text" data-co-named-element="##:'nameInput'##" />

<!-- Later in the template or another handler -->
<button
  data-co-event="##:{
  click: function(event, {component}) {
    console.log('Input value:', component.nameInput.value);
  }
}##"
>
  Get Value
</button>
```

#### `data-co-element-ref="##:variable##"` - Element Variables

Binds a DOM element to a variable in the template code:

```html
<template id="form-component">
  ## let formData = {}; function submitForm() { formData.name = nameInput.value;
  formData.email = emailInput.value; console.log('Submitted:', formData); } ##

  <form>
    <input
      type="text"
      placeholder="Name"
      data-co-element-ref="##:nameInput##"
    />
    <input
      type="email"
      placeholder="Email"
      data-co-element-ref="##:emailInput##"
    />

    <button type="button" data-co-event="##:{click: submitForm}##">
      Submit
    </button>
  </form>
</template>
```

#### `data-co-load="##:handler::data##"` - Element Loading

Executes a function when an element is loaded into the DOM:

```html
<div
  class="chart-container"
  data-co-load="##:initializeChart::data.chartData##"
></div>

<!--
Where initializeChart is defined as:

function initializeChart(element, {data, customData, element, component, compomint}) {
  // Initialize a chart in the element using the data
  new Chart(element, {
    type: 'line',
    data: customData
  });
}
-->
```

Load handlers receive these parameters:

1. `element` - The element itself
2. `loadData` - An object containing:
   - `data` - The component's data object
   - `customData` - The optional custom data passed after `::`
   - `element` - The element itself
   - `component` - The template scope object
   - `compomint` - Reference to the global compomint object

## Advanced Features

### Internationalization Support (i18n)

Compomint includes built-in support for multiple languages:

```javascript
// Add translations for a single key
compomint.addI18n("greeting", {
  en: "Hello",
  fr: "Bonjour",
  es: "Hola",
  de: "Hallo",
});

// Add nested translations
compomint.addI18n("messages.welcome", {
  en: "Welcome to our site",
  fr: "Bienvenue sur notre site",
  es: "Bienvenido a nuestro sitio",
});

// Add multiple translations at once
compomint.addI18ns({
  greeting: {
    en: "Hello",
    fr: "Bonjour",
  },
  farewell: {
    en: "Goodbye",
    fr: "Au revoir",
  },
  buttons: {
    submit: {
      en: "Submit",
      fr: "Soumettre",
    },
    cancel: {
      en: "Cancel",
      fr: "Annuler",
    },
  },
});
```

Use in templates

```html
<span>##=compomint.i18n.greeting('Hello!')##</span>
<!-- when language is 'ja' then output is 'Hello!' (default text) -->
<p>##=compomint.i18n.messages.welcome('Welcome to our site')##</p>
<button>##=compomint.i18n.buttons.submit('Submit')##</button>
```

The current language is determined by `document.documentElement.lang`. The parameter passed to the i18n function serves as the default text if no translation is found.

**Use in template i18n object**

```html
<template id="my-component">
  ##! // Define translations in template preloading compomint.addI18ns({
  'my-component': { 'greeting': { 'en': 'Hello', 'fr': 'Bonjour' }, 'subtitle':
  { 'en': 'Welcome to our app', 'fr': 'Bienvenue dans notre application' } } });
  ##
  <div>
    <h1>##=i18n.greeting## ##=data.name##!</h1>
    <p>##=i18n.subtitle##</p>
  </div>
</template>
```

### Template Remapping

You can remap template IDs, which is useful for versioning or aliasing:

```javascript
// Remap template IDs
compomint.remapTmpl({
  "old-button": "ui-Button-v2",
  "legacy-form": "ui-Form-v3",
});

// Now, this:
const button = compomint.tmpl("old-button")(data);

// Is equivalent to:
const button = compomint.tmpl("ui-Button-v2")(data);
```

### Custom Template Settings

You can customize how templates are processed:

```javascript
// Define custom template settings
const customSettings = {
  dataKeyName: "model", // Use 'model' instead of 'data' in templates
  statusKeyName: "state", // Use 'state' instead of 'status' in templates
  // Override other settings as needed
};

// Create template with custom settings
compomint.addTmpl("custom-template", "<div>##=model.label##</div>", {
  keys: customSettings,
});

// Use the template
const component = compomint.tmpl("custom-template")({ label: "Hello" });
```

**Custom Template Expression Syntax**

```javascript
// Use custom delimiters for template expressions
compomint.addTmpl("custom-syntax", "<div>{{=data.label}}</div>", {
  interpolate: {
    pattern: /{{=([\s\S]+?)}}/g,
    exec: function (interpolate) {
      return `';(() => {let interpolate=${interpolate};\n__p+=((__t=(typeof (interpolate)=='function' ? (interpolate)() : (interpolate)))==null?'':__t);})()\n__p+='`;
    },
  },
});
```

## Template Lifecycle

Templates in Compomint have a comprehensive lifecycle that you can manage:

### Creation & Rendering

```javascript
// Render a template with data
const component = compomint.tmpl("my-template")({
  name: "John Doe",
  email: "john@example.com",
});
```

### DOM Insertion

```javascript
// Append by direct reference
document.body.appendChild(component.element);

// Append using component method
component.appendTo(document.getElementById("container"));

// Render directly into a container
compomint.tmpl("my-template")(data, document.getElementById("container"));

// With a callback after insertion
compomint.tmpl("my-template")(
  data,
  document.getElementById("container"),
  function (scope) {
    console.log("Template rendered and inserted!");
    // Initialize additional components
  }
);
```

### Updating

```javascript
// Complete re-render with new data
component.render({
  name: "Jane Doe",
  email: "jane@example.com",
});

// Partial update (only specified properties)
component.refresh({
  name: "Jane Doe",
  // email remains unchanged
});
```

### Removal

```javascript
// Remove completely from DOM
component.remove();

// Remove but leave a placeholder element
// Useful for later re-insertion
component.remove(true);
```

### Replacement

```javascript
// Replace with another template
const newScope = compomint.tmpl("other-template")(otherData);
component.replace(newScope);

// Or replace directly
component.replace(compomint.tmpl("other-template")(otherData));
```

### Lifecycle Hooks

You can define hooks for different lifecycle events:

```javascript
// Define lifecycle hooks
component.beforeAppendTo = function () {
  console.log("About to insert into DOM");
  // Pre-insertion setup
};

component.afterAppendTo = function () {
  console.log("Inserted into DOM");
  // Post-insertion initialization
};

component.beforeRemove = function () {
  console.log("About to remove from DOM");
  // Cleanup resources
};

component.afterRemove = function () {
  console.log("Removed from DOM");
  // Final cleanup
};

component.beforeRefresh = function () {
  console.log("About to update data");
  // Prepare for update
};

component.afterRefresh = function () {
  console.log("Updated with new data");
  // Post-update processing
};
```

### Memory Management

```javascript
// Release template resources
component.release();
```

## API Reference

### Template Creation

- `compomint.addTmpl(id, content, settings)` - Creates a new template

  - `id` - Template identifier
  - `content` - Template string or DOM element
  - `settings` - Optional template settings

- `compomint.addTmpls(source, removeInnerTemplate, settings)` - Loads multiple templates from source

  - `source` - HTML string or DOM element containing templates
  - `removeInnerTemplate` - Whether to remove templates after loading
  - `settings` - Optional template settings

- `compomint.addTmplByUrl(url, options, callback)` - Loads templates from URL
  - `url` - URL string, array of URLs, or object with URL and options
  - `options` - Loading options (loadScript, loadStyle, loadLink) or callback function
  - `callback` - Optional function to call after loading
  - **Returns**: Promise if no callback is provided (NEW: Version 1.0.3+)

### Template Rendering

- `compomint.tmpl(id)(data, container, callback, component)` - Renders a template with data
  - `id` - Template identifier
  - `data` - Data object to render with
  - `container` - Optional element to append to
  - `callback` - Optional function to call after rendering
  - `component` - Optional existing scope to reuse

### Template Scope Methods

- `component.appendTo(element)` - Appends template to element
- `component.render(data)` - Re-renders with new data
- `component.refresh(data)` - Updates with partial data
- `component.remove(spacer)` - Removes from DOM
- `component.replace(newScope)` - Replaces with another template
- `component.release()` - Releases template resources

### Template Scope Properties

- `component.element` - Reference to the rendered DOM element
- `component.data` - The data used to render the template
- `component.status` - Status object for template state
- `component._id` - Unique ID for the template instance
- `component.tmplId` - The template ID
- `component.wrapperElement` - The wrapper element (if provided during rendering)

### Internationalization

- `compomint.addI18n(key, translations)` - Adds translations for a key

  - `key` - Translation key (can be nested with dots)
  - `translations` - Object mapping language codes to translations

- `compomint.addI18ns(translationsObject)` - Adds multiple translations

  - `translationsObject` - Object mapping keys to translation objects

- `compomint.i18n[key](defaultText)` - Gets translation for current language
  - `key` - Translation key
  - `defaultText` - Default text if translation not found

### Utility Functions

- `compomint.tools.genElement(tagName, attrs = {}, ...children)` - Creates a DOM element

  - `tagName` - Type of element to create
  - `attrs` - Object of attributes to set
  - `...children` - Child elements to append

- `compomint.tools.props(...propsObjects)` - Creates HTML attribute string

  - `propsObjects` - Objects of properties to convert to attributes

- `compomint.tools.genId(prefix)` - Generates a unique ID

  - `prefix` - ID prefix (usually template ID)

- `compomint.tools.escapeHtml.escape(string)` - Escapes HTML characters

  - `string` - String to escape

- `compomint.tools.escapeHtml.unescape(string)` - Unescapes HTML characters
  - `string` - String to unescape

### Configuration Options

- `compomint.configs.printExecTime` - Enable template rendering time logging
- `compomint.configs.debug` - Enable debug mode
- `compomint.configs.throwError` - Throw errors instead of silently failing

## Built-in Components

Compomint comes with several built-in utility templates to help you get started:

### co-Ele

Directly uses `compomint.tools.genElement` to create a DOM element.
Expects an array `[tagName, attributes]` as data.
Note: Use `className` for the class attribute within the `attributes` object.

```javascript
// Create a div with id and class
const div = compomint.tmpl('co-Ele')(['div', {
  id: 'myDiv',
  class: 'container', // className also works here
  style: 'background-color: #f0f0f0; padding: 10px;'
}]);
document.body.appendChild(div.element);

// Create an input element
const input = compomint.tmpl('co-Ele')(['input', {
  type: 'text',
  name: 'username',
  placeholder: 'Enter username',
  required: true,
  class: 'form-control' // className also works here
  className: 'form-control'
}]);
document.body.appendChild(input.element);
```

### co-Element

A convenient template for creating generic HTML elements with common attributes and flexible content.
Expects an object `data` with the following optional properties:

- `tag`: The HTML tag name (e.g., 'div', 'span', 'p'). Defaults to `'div'` if not provided.
- `id`: The element's ID attribute. If set to `true`, it automatically uses the component's unique instance ID (`component._id`).
- `props`: An object containing attributes to be set on the element (e.g., `{ class: 'my-class', style: 'color: red;', 'data-value': '123' }`). Uses the `data-co-props` rule internally.
- `event`: An object defining event handlers, similar to the `data-co-event` attribute syntax.
- `content`: The content for the element. If it's a string, it will be directly inserted. If it's a DOM Node, DocumentFragment, or another Compomint component scope, it will be appended.

```javascript
// Create a paragraph element with various attributes and string content
const paragraph = compomint.tmpl("co-Element")({
  tag: "p",
  id: "myParagraph",
  props: {
    class: "info-text important",
    style: "color: blue; font-weight: bold;",
    "data-custom": "value",
  },
  content: "This is an important paragraph.",
  event: { click: () => alert("Paragraph clicked!") },
});
document.body.appendChild(paragraph.element);

// Create a div containing another element (using co-Ele for the inner part)
const innerSpan = compomint.tmpl("co-Ele")([
  "span",
  { className: "highlight" },
  "Highlighted Text",
]);
const wrapperDiv = compomint.tmpl("co-Element")({
  // tag defaults to 'div'
  props: { class: "wrapper" },
  content: innerSpan.element, // Insert the span element
});
document.body.appendChild(wrapperDiv.element);
```

This creates a comprehensive component showcase where you can see the template source code and rendered components side by side.

## Internal Workings

Understanding how Compomint works internally can help you use it more effectively:

### Template Compilation Process

1. **Parsing**: Template text is parsed using regex patterns defined in `Bridge.templateSettings`
2. **Extraction**: Code blocks, expressions, and other template elements are extracted
3. **Compilation**: A JavaScript function is generated that produces HTML when executed
4. **Caching**: The function is cached for future use
5. **Execution**: When called with data, the function evaluates the template and returns HTML
6. **DOM Creation**: The HTML is converted to DOM elements
7. **Post-processing**: Lazy evaluation handlers are applied
8. **Scope Creation**: The template scope object is created and returned

```
┌───────────────┐    ┌─────────────────┐    ┌───────────────────┐
│ Template Text │ -> │ Parse & Extract │ -> │ Generate Function │
└───────────────┘    └─────────────────┘    └───────────────────┘
                                                 │
┌────────────────┐    ┌───────────────┐     ┌────▼─────────────┐
│ Template Scope │ <- │ DOM Creation  │  <- │ Execute Function │
└────────────────┘    └───────────────┘     └──────────────────┘
        │                    ▲
        │                    │
        └────────────────────┘
           Post-processing
```

### Lazy Evaluation System

Compomint uses a "lazy evaluation" system to handle dynamic elements and events:

1. During template rendering, placeholders are inserted into the HTML
2. After the DOM is created, these placeholders are processed
3. Events are attached, elements are inserted, and other dynamic actions are performed

This approach ensures proper timing for DOM manipulation and allows for deferred execution of expensive operations.

### Template Scope Architecture

The template scope (`tmplScope`) is an object that:

1. Holds references to the rendered DOM element
2. Contains the data used for rendering
3. Provides lifecycle methods (render, refresh, remove, etc.)
4. Stores references to important elements
5. Manages events and triggers
6. Connects the template to your application logic

```
┌─────────────────────────────────────────┐
│               Template Scope            │
├─────────────────┬───────────────────────┤
│ Properties      │ Methods               │
├─────────────────┼───────────────────────┤
│ .element        │ .render(data)         │
│ .data           │ .refresh(data)        │
│ .status         │ .remove(spacer)       │
│ ._id            │ .replace(newScope)    │
│ .tmplId         │ .appendTo(element)    │
│ [named elements]│ .release()            │
└─────────────────┴───────────────────────┘
```

## Best Practices

### Performance Optimization

1. **Minimize Re-renders**: Use `refresh()` for minor updates instead of `render()`

   ```javascript
   // Good: Update only what changed
   tmplScope.refresh({ counter: newCount });

   // Avoid: Complete re-render for small changes
   tmplScope.render({ ...data, counter: newCount });
   ```

2. **Batch DOM Operations**: Use document fragments when inserting multiple elements

   ```javascript
   // Create a fragment first
   const fragment = document.createDocumentFragment();
   items.forEach((item) => {
     const element = tmpl.ui.ListItem({ text: item }).element;
     fragment.appendChild(element);
   });

   // Then add to DOM once
   container.appendChild(fragment);
   ```

3. **Cache Element References**: Store references to elements you'll need to access frequently

   ```javascript
   <input type="text" data-co-named-element="##:'nameInput'##">

   // Later: Use the cached reference
   tmplScope.nameInput.focus();
   ```

4. **Use Lazy Loading**: Load and initialize heavy components asynchronously

   ```javascript
   <div id="chart-container">##%heavyChartComponent::true##</div>
   ```

5. **Template Granularity**: Create smaller, reusable templates instead of large monolithic ones
   ```javascript
   // Better: Compose from smaller components
   compomint.tmpl("page-layout")({
     header: tmpl.ui.Header({ title: "Dashboard" }),
     sidebar: tmpl.ui.Sidebar({ items: menuItems }),
     content: tmpl.ui.ContentPanel({
       title: "Welcome",
       body: tmpl.ui.WelcomeMessage({ userName: "John" }),
     }),
   });
   ```

### Code Organization

1. **Template Namespacing**: Use consistent ID patterns

   ```javascript
   // Domain-specific grouping
   "ui-Button"; // UI components
   "form-TextField"; // Form components
   "chart-BarChart"; // Chart components
   "page-Dashboard"; // Page templates
   ```

2. **Data Preparation**: Format data before passing to templates

   ```javascript
   // Prepare data before rendering
   const userData = {
     fullName: user.firstName + " " + user.lastName,
     formattedDate: new Date(user.joinDate).toLocaleDateString(),
     isAdmin: user.role === "admin",
   };

   const userCard = compomint.tmpl("user-card")(userData);
   ```

3. **Event Delegation**: Use event delegation for dynamic content

   ```html
   <ul
     class="item-list"
     data-co-event="##:{
     click: function(event) {
       // Check if a list item was clicked
       if (event.target.closest('li')) {
         const listItem = event.target.closest('li');
         console.log('Item clicked:', listItem.dataset.id);
       }
     }
   }##"
   >
     ## data.items.forEach(item => { ##
     <li data-id="##=item.id##">##=item.name##</li>
     ## }); ##
   </ul>
   ```

4. **Separation of Concerns**: Keep templates focused on presentation

   ```javascript
   // Prepare data and logic outside the template
   function createUserCard(userData) {
     // Business logic
     const isVerified = checkUserVerification(userData);
     const permissions = getUserPermissions(userData);

     // Pass prepared data to template
     return tmpl.user.Card({
       user: userData,
       isVerified: isVerified,
       permissions: permissions,
       onEdit: function () {
         openUserEditForm(userData.id);
       },
     });
   }
   ```

5. **Documentation**: Comment templates with their expected data structure
   ```javascript
   /*
    * User Card Component
    *
    * Expected data:
    * {
    *   user: {
    *     id: string,
    *     name: string,
    *     email: string,
    *     avatar: string (URL)
    *   },
    *   isVerified: boolean,
    *   permissions: string[],
    *   onEdit: function
    * }
    */
   compomint.addTmpl("user-card", `...`);
   ```

### Error Handling

1. **Validate Input Data**: Check data before rendering

   ```javascript
   function renderUserProfile(userData) {
     // Validate required fields
     if (!userData || !userData.id || !userData.name) {
       console.error("Invalid user data:", userData);
       return tmpl.error.InvalidData({
         message: "Unable to display user profile due to missing data",
       });
     }

     return tmpl.user.Profile(userData);
   }
   ```

2. **Provide Fallbacks**: Use default values for missing data

   ```html
   <div class="user-card">
     <img src="##=data.avatar || 'images/default-avatar.png'##" alt="User" />
     <h3>##=data.name || 'Unknown User'##</h3>
     <p>##=data.bio || 'No bio available'##</p>
   </div>
   ```

3. **Error Recovery**: Use try/catch for data processing

   ```html
   <div class="data-chart">
     ## try { const chartData = processChartData(data.rawData); const
     chartOptions = generateChartOptions(data.chartType); } catch (error) {
     console.error('Error processing chart data:', error); chartData = null;
     chartOptions = null; } ## ##if (chartData && chartOptions) {##
     <canvas
       data-co-load="##:initChart::({data: chartData, options: chartOptions})##"
     ></canvas>
     ##} else {##
     <div class="error-message">
       Unable to display chart due to data processing error
     </div>
     ##}##
   </div>
   ```

4. **Debug Mode**: Enable debug mode during development

   ```javascript
   // Enable in development
   compomint.configs.debug = true;
   compomint.configs.printExecTime = true;
   compomint.configs.throwError = true;

   // Disable in production
   compomint.configs.debug = false;
   compomint.configs.printExecTime = false;
   compomint.configs.throwError = false;
   ```

## Code Examples

### Complete Todo Application

```javascript
// First, define the templates
compomint.addTmpls(`
  <template id="todo-App">
    <style id="style-todo-App">
      .todo-App {
        font-family: 'Arial', sans-serif;
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        border-radius: 5px;
      }
      .todo-App .todo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .todo-App .todo-form {
        display: flex;
        margin-bottom: 20px;
      }
      .todo-App .todo-form input {
        flex-grow: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px 0 0 4px;
      }
      .todo-App .todo-form button {
        padding: 8px 16px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
      }
      .todo-App .todo-list {
        list-style-type: none;
        padding: 0;
      }
      .todo-App .todo-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #eee;
      }
      .todo-App .todo-item.completed .todo-text {
        text-decoration: line-through;
        color: #888;
      }
      .todo-App .todo-text {
        flex-grow: 1;
        margin-left: 10px;
      }
      .todo-App .todo-actions button {
        margin-left: 5px;
        background: none;
        border: none;
        color: #777;
        cursor: pointer;
      }
      .todo-App .todo-actions button:hover {
        color: #333;
      }
      .todo-App .todo-stats {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        color: #777;
        font-size: 14px;
      }
      .todo-App .todo-empty {
        text-align: center;
        color: #777;
        padding: 20px;
      }
    </style>
    
    ##
      // Initialize state if not already present
      status.todos = status.todos || data.initialTodos || [];
      
      // Add a new todo item
      function addTodo() {
        const text = newTodoInput.value.trim();
        if (text) {
          status.todos.push({
            id: Date.now(),
            text: text,
            completed: false
          });
          newTodoInput.value = '';
          component.refresh();
        }
      }
      
      // Toggle todo completion status
      function toggleTodo(todoId) {
        const todo = status.todos.find(t => t.id === todoId);
        if (todo) {
          todo.completed = !todo.completed;
          component.refresh();
        }
      }
      
      // Delete a todo item
      function deleteTodo(todoId) {
        status.todos = status.todos.filter(t => t.id !== todoId);
        component.refresh();
      }
      
      // Clear completed todos
      function clearCompleted() {
        status.todos = status.todos.filter(t => !t.completed);
        component.refresh();
      }
      
      // Filter todos based on current filter
      status.filter = status.filter || 'all';
      
      function setFilter(filter) {
        status.filter = filter;
        component.refresh();
      }
      
      function getFilteredTodos() {
        switch(status.filter) {
          case 'active':
            return status.todos.filter(t => !t.completed);
          case 'completed':
            return status.todos.filter(t => t.completed);
          default:
            return status.todos;
        }
      }
      
      const filteredTodos = getFilteredTodos();
      const activeCount = status.todos.filter(t => !t.completed).length;
      const completedCount = status.todos.length - activeCount;
    ##
    
    <div class="todo-App">
      <div class="todo-header">
        <h1>##=data.title || 'Todo List'##</h1>
      </div>
      
      <form class="todo-form">
        <input 
          type="text" 
          placeholder="What needs to be done?" 
          data-co-element-ref="##:newTodoInput##"
        >
        <button type="submit" data-co-event="##:(event) => {
          event.preventDefault();
          addTodo();
      }##">Add</button>
      </form>
      
      <div class="todo-filters">
        <button 
          data-co-event="##:{click: () => setFilter('all')}##"
          class="##=status.filter === 'all' ? 'active' : ''##">
          All
        </button>
        <button 
          data-co-event="##:{click: () => setFilter('active')}##"
          class="##=status.filter === 'active' ? 'active' : ''##">
          Active
        </button>
        <button 
          data-co-event="##:{click: () => setFilter('completed')}##"
          class="##=status.filter === 'completed' ? 'active' : ''##">
          Completed
        </button>
      </div>
      
      ##if (filteredTodos.length === 0) {##
        <div class="todo-empty">
          ##if (status.todos.length === 0) {##
            No todos yet. Add one above!
          ##} else {##
            No todos match the current filter.
          ##}##
        </div>
      ##} else {##
        <ul class="todo-list">
          ##filteredTodos.forEach(todo => {##
            <li class="todo-item ##=todo.completed ? 'completed' : ''##">
              <input 
                type="checkbox" 
                ##=todo.completed ? 'checked' : ''##
                data-co-event="##:{
                  change: () => toggleTodo(todo.id)
                }##"
              >
              <span class="todo-text">##=todo.text##</span>
              <div class="todo-actions">
                <button data-co-event="##:{
                  click: () => deleteTodo(todo.id)
                }##">
                  ×
                </button>
              </div>
            </li>
          ##})##
        </ul>
      ##}##
      
      ##if (status.todos.length > 0) {##
        <div class="todo-stats">
          <span>##=activeCount## item##=activeCount !== 1 ? 's' : ''## left</span>
          ##if (completedCount > 0) {##
            <button data-co-event="##:{
              click: clearCompleted
            }##">
              Clear completed (##=completedCount##)
            </button>
          ##}##
        </div>
      ##}##
    </div>
  </template>
`);

// Initialize the todo app
const todoApp = tmpl.todo.App({
  title: "My Todo List",
  initialTodos: [
    { id: 1, text: "Learn Bridge.js", completed: true },
    { id: 2, text: "Build a todo app", completed: false },
    { id: 3, text: "Share with the community", completed: false },
  ],
});

// Add to the DOM
document.getElementById("app-container").appendChild(todoApp.element);
```

### Theme Switcher Component

```javascript
compomint.addTmpls(`
  <template id="theme-Switcher">
    <style id="style-theme-Switcher">
      .theme-switcher {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .theme-switcher .theme-menu {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 10px;
        margin-bottom: 10px;
        display: none;
      }
      .theme-switcher .theme-menu.active {
        display: block;
      }
      .theme-switcher .theme-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .theme-switcher .theme-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
      }
      .theme-switcher .theme-item:hover {
        background: #f5f5f5;
      }
      .theme-switcher .theme-item.active {
        background: #e3f2fd;
        font-weight: bold;
      }
      .theme-switcher .color-preview {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        margin-right: 8px;
        border: 1px solid #ddd;
      }
      .theme-switcher .theme-toggle {
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      .theme-switcher .theme-toggle:hover {
        background: #1976D2;
      }
    </style>
    
    ##
      // Available themes
      const themes = data.themes || [
        { id: 'light', name: 'Light', primaryColor: '#2196F3', bgColor: '#ffffff', textColor: '#333333' },
        { id: 'dark', name: 'Dark', primaryColor: '#90CAF9', bgColor: '#282c34', textColor: '#f5f5f5' },
        { id: 'sepia', name: 'Sepia', primaryColor: '#FF9800', bgColor: '#f8f0e3', textColor: '#5f4b32' }
      ];
      
      // Initialize the current theme
      status.isMenuOpen = status.isMenuOpen || false;
      status.currentTheme = status.currentTheme || data.defaultTheme || themes[0].id;
      
      // Function to toggle menu open/closed
      function toggleMenu() {
        status.isMenuOpen = !status.isMenuOpen;
        component.refresh({});
      }
      
      // Function to apply theme
      function applyTheme(themeId) {
        status.currentTheme = themeId;
        const theme = themes.find(t => t.id === themeId);
        
        // Apply theme to document
        document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
        document.documentElement.style.setProperty('--background-color', theme.bgColor);
        document.documentElement.style.setProperty('--text-color', theme.textColor);
        
        // Add theme class to body
        document.body.className = '';
        document.body.classList.add('theme-' + themeId);
        
        // Close the menu
        status.isMenuOpen = false;
        
        // Call the onThemeChange callback if provided
        if (data.onThemeChange) {
          data.onThemeChange(themeId, theme);
        }
        
        component.refresh({});
      }
      
      // Initialize theme on first load
      if (data.autoApply !== false && !status.initialized) {
        status.initialized = true;
        
        // Add CSS variables to document if not already present
        const style = document.createElement('style');
        style.textContent = \`
          :root {
            --primary-color: #2196F3;
            --background-color: #ffffff;
            --text-color: #333333;
          }
          body {
            background-color: var(--background-color);
            color: var(--text-color);
          }
          a {
            color: var(--primary-color);
          }
          button.primary {
            background-color: var(--primary-color);
            color: white;
          }
        \`;
        document.head.appendChild(style);
        
        // Apply initial theme
        const theme = themes.find(t => t.id === status.currentTheme);
        if (theme) {
          setTimeout(() => applyTheme(status.currentTheme), 100);
        }
      }
    ##
    
    <div class="theme-Switcher">
      <div class="theme-menu ##=status.isMenuOpen ? 'active' : ''##">
        <ul class="theme-list">
          ##themes.forEach(theme => {##
            <li 
              class="theme-item ##=status.currentTheme === theme.id ? 'active' : ''##"
              data-co-event="##:{
                click: () => applyTheme(theme.id)
              }##"
            >
              <span class="color-preview" style="background-color: ##=theme.primaryColor##"></span>
              ##=theme.name##
            </li>
          ##})##
        </ul>
      </div>
      
      <button class="theme-toggle" data-co-event="##:{
        click: toggleMenu
      }##">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <path d="M12 1v2"></path>
          <path d="M12 21v2"></path>
          <path d="M4.22 4.22l1.42 1.42"></path>
          <path d="M18.36 18.36l1.42 1.42"></path>
          <path d="M1 12h2"></path>
          <path d="M21 12h2"></path>
          <path d="M4.22 19.78l1.42-1.42"></path>
          <path d="M18.36 5.64l1.42-1.42"></path>
        </svg>
      </button>
    </div>
  </template>
`);

// Initialize theme switcher
const themeSwitcher = tmpl.theme.Switcher({
  defaultTheme: "light",
  autoApply: true,
  onThemeChange: function (themeId, theme) {
    console.log("Theme changed to:", themeId);
    console.log("Theme properties:", theme);
  },
});

document.body.appendChild(themeSwitcher.element);
```

## Documentation

For more detailed information and up-to-date examples, check out the official documentation:

[Compomint Website](https://compomint.dev/)
[Github Repository](https://github.com/kurukona/compomint)

## License

Compomint is released under the MIT License.

```
MIT License

Copyright (c) 2016-present, Choi Sungho

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
