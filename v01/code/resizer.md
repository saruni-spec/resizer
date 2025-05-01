# Resizer Module Documentation

## Table of Contents

- [Module Overview](#module-overview)
  - [Purpose and Motivation](#purpose-and-motivation)
  - [Architectural Approach](#architectural-approach)
  - [Key Concepts & Workflow](#key-concepts--workflow)
- [Class References](#class-references)
  - [resizer](#resizer)
  - [panel](#panel)
  - [edge (Abstract)](#edge-abstract)
  - [horizontal_edge (Abstract)](#horizontal_edge-abstract)
  - [vertical_edge (Abstract)](#vertical_edge-abstract)
  - [top](#top)
  - [bottom](#bottom)
  - [left](#left)
  - [right](#right)
- [Example Usage](#example-usage)
  - [HTML Structure](#html-structure)
  - [CSS Styling](#css-styling)
  - [JavaScript Initialization](#javascript-initialization)
  - [Integration with TypeScript](#integration-with-typescript)
- [Known Issues and Limitations](#known-issues-and-limitations)
- [Future Considerations & Potential Enhancements](#future-considerations--potential-enhancements)
- [Contributions](#contributions)

## Module Overview

### Purpose and Motivation

This module (resizer.ts) provides dynamic, user-resizable panel layouts for web pages designed using a grid template layout (Mutall web pages). It allows end-users to adjust the size of different sections (panels) within a designated container by dragging the borders between them. This functionality is essential for applications requiring flexible, user-configurable interfaces, such as dashboards, admin panels, content management systems, and mutual portfolios. The module also includes features for layout persistence across sessions (using local storage) and a straightforward mechanism to reset the layout to its default state.

### Architectural Approach

The module's architecture is built around three core class concepts:

- **Resizer** (Controller): The main class managing the overall resizing functionality within a specified HTML container. It discovers child elements (panels), initializes them, identifies interactive borders (edges), and logically groups these edges into clusters for synchronized resizing. It also handles container-level concerns and provides the reset layout functionality.
- **panel** (The Resizable Unit): Wraps each direct child element within the resizer's container, representing a single resizable section. It manages its dimensions, creates and manages its interactive edge instances, handles internal scrolling adjustments, persists its state to local storage, and enforces minimum size constraints.
- **edge** (The Interactive Border): Represents the draggable borders. An abstract class hierarchy defines common behavior:
  - edge: Base abstract class for drag event handling, hover effects, clustering logic, and common properties.
  - horizontal_edge / vertical_edge: Abstract subclasses defining orientation-specific logic, particularly for neighbor detection (share_border).
  - top, bottom, left, right: Concrete subclasses implementing the specific logic for each border type, including visual element creation (create_edge), dimension calculations during resize (resize), and identifying opposite edges.

### Key Concepts & Workflow

- **Initialization:** A resizer instance is created, targeting a container element.
- **Panel & Edge Creation:** The resizer identifies child elements, creates panel objects, and each panel creates its interactive edge instances (if not on the container boundary).
- **Clustering:** Adjacent edges of the same orientation are grouped into clusters. Dragging one edge moves all edges in its cluster simultaneously, ensuring smooth, synchronized resizing of adjacent panels.
- **Resize Interaction:** User hovers (visual feedback), mousedowns (start resize), drags (calculate change, call resize on cluster edges, update panel styles, respect constraints), and mouseups (end resize, save dimensions).
- **Resizing(width vs offsetWidth):** The resizing uses offsetWidth and offsetHeight to determine panel dimensions.This is important in that offsetDimensions alwways include the padding,margin and borders of an element in its dimension calculations unlike the width/height properties which may or may not inlude them depending on the browser the user is on.
- **Persistence:** Panel dimensions are saved to localStorage on resize completion and loaded on initialization.
- **Reset:** A default reset button clears saved dimensions and reloads the page (restoring CSS-defined layout).
- **Scroll Handling:** Internal panel scrolling triggers visual adjustment of edge positions.

## Class References

### resizer

This class is the main entry point for adding resizable functionality to panels within a specified container.

**Extends:** [`view`](../../../schema/v/code/schema.js)

**Properties:**

- `panels`: `Map<string, panel>`
  - A map storing the `panel` objects, with the panel's ID as the key.
- `clusters`: `Map<string, Set<edge>>` = `new Map()`
  - A map storing clusters of connected `edge` objects. Each cluster represents a set of edges that should be resized together.
- `client_width`: `number | undefined`
  - The width of the viewport or container. Used in edge positioning.
- `client_height`: `number | undefined`
  - The height of the viewport or container. Used in edge positioning.
- `client_left`: `number | undefined`
  - The left offset of the viewport or container.
- `client_top`: `number | undefined`
  - The top offset of the viewport or container.

**Getters:**

- `rect`: `DOMRect`
  - Returns the bounding rectangle of the container element.

**Constructor:**

```typescript
constructor(container: HTMLElement = document.body, parent?: view | undefined, options?: view_options | undefined)
```

- `container`: `HTMLElement` = `document.body`
  - The HTML element that will contain the resizable panels. Defaults to the `document.body`.
- `parent`: `view | undefined`
  - Optional parent view object (from the schema).
- `options`: `view_options | undefined`
  - Optional view options object (from the schema).

**Methods:**

- `set_container_dimensions()`: `void`
  - Sets the `client_width`, `client_height`, `client_left`, and `client_top` properties based on the container element. If the container is the `document.body`, it uses the window dimensions.
- `create_panels()`: `void`
  - Identifies all direct child elements of the container and creates a new `panel` object for each. These panels are then stored in the `panels` map. If a child element does not have an ID, one is automatically assigned.
- `create_clusters()`: `Map<string, Set<edge>>`
  - Analyzes all the `edge` objects associated with the panels and groups them into clusters. Edges are considered part of the same cluster if they are connected (share a border). This method is crucial for ensuring that resizing one edge correctly affects the connected edges.
  - **Returns:** `Map<string, Set<edge>>` - A map of clusters, where each cluster is a set of connected `edge` objects.
- `clear_saved_panels()`: `void`
  - Iterates through all the `panel` objects and calls their `clear_saved_dimensions()` method to remove any saved dimensions from local storage.
- `add_reset_button()`: `void`
  - Creates and appends a fixed reset button to the `document.body`. When clicked, this button clears any saved panel dimensions from local storage and reloads the page, effectively resetting the layout to its initial state.

### panel

Represents one of the resizable sections within the grid. Each panel has its own set of edges that can be manipulated to resize it.

**Extends:** [`view`](../../../schema/v/code/schema.js)

**Properties:**

- `element`: `HTMLElement`
  - The actual HTML element representing the panel.
- `saved_dimensions`: `string`
  - The key used to store this panel's dimensions in local storage.
- `edges`: `Map<string, edge>` = `new Map()`
  - A map storing the `edge` objects associated with this panel (top, bottom, left, right).
- `min_panel_size`: `number` = `40`
  - The minimum allowed width and height of the panel in pixels. Defaults to `40`.
- `resizing_edge`: `edge | undefined`
  - The `edge` object that is currently being resized.
- `dimensions`: `{ top: number; left: number; height: number; width: number; }`
  - An object storing the current top, left, height, and width of the panel.

**Getters:**

- `cant_resize`: `boolean`
  - Returns `true` if the panel's current width is equal to the `min_panel_size`, indicating that it cannot be resized further in that direction.

**Constructor:**

```typescript
constructor(element: HTMLElement, parent: resizer, options?: view_options)
```

- `element`: `HTMLElement`
  - The HTML element for this panel.
- `parent`: `resizer`
  - The parent `resizer` object.
- `options`: `view_options | undefined`
  - Optional view options object.

**Methods:**

- `panel_scroll()`: `void`
  - An event listener callback that is triggered when the panel element is scrolled. It adjusts the position of the panel's edges to account for the scroll offset.
- `#get_regions()`: `void`
  - **Private method.** Determines the presence of scrollbars and the panel's position relative to the container to create the appropriate `edge` objects (top, bottom, left, right) for the panel. It takes into account scrollbar dimensions to avoid creating resizable edges where scrollbars are present.
- `check_saved_dimensions()`: `{ top: number; left: number; height: number; width: number; } | undefined`
  - Checks local storage for any previously saved dimensions for this panel using the `saved_dimensions` key. If found, it parses the stored data, applies the saved dimensions to the panel's style, and returns the dimensions.
  - **Returns:** `{ top: number; left: number; height: number; width: number; } | undefined` - The saved dimensions object if found, otherwise `undefined`.
- `clear_saved_dimensions()`: `void`
  - Removes the saved dimensions for this panel from local storage.
- `width`: `number` **(Setter)**
  - Sets the `width` style property of the panel's element.
- `height`: `number` **(Setter)**
  - Sets the `height` style property of the panel's element.
- `top`: `number` **(Setter)**
  - Sets the `top` style property of the panel's element.
- `left`: `number` **(Setter)**
  - Sets the `left` style property of the panel's element.

### edge (Abstract)

An abstract class representing a border region of a panel that can be dragged to resize the panel. Subclasses implement specific edge behaviors (top, bottom, left, right).

**Static Properties:**

- `threshold`: `number` = `5`
  - The distance in pixels from the edge of the panel within which the mouse cursor will trigger the resize functionality.

**Properties:**

- `closeness`: `number` = `30`
  - The maximum distance between two edges for them to be considered neighbors and potentially part of the same cluster.
- `element`: `HTMLElement`
  - The HTML element that visually represents the draggable edge.
- `resize_start`: `Array<number> | undefined`
  - An array storing the initial mouse coordinates (`[clientX, clientY]`) when a resize operation starts.
- `alignment`: `"vertical" | "horizontal"` = `"vertical"`
  - Indicates whether the edge is vertical (left or right) or horizontal (top or bottom).
- `cluster`: `Set<edge> | undefined`
  - The set of connected `edge` objects that this edge belongs to.
- `initial_scroll`: `Array<number>` = `[0, 0]`
  - An array storing the initial scroll position (`[scrollLeft, scrollTop]`) of the panel when a resize operation starts. Used to compensate for scrolling during resizing.

**Getters:**

- `rect`: `DOMRect`
  - Returns the bounding rectangle of the edge element.
- `opposite_edge`: `edge | undefined` **(Abstract Getter)**
  - Returns the `edge` object on the opposite side of the panel (e.g., the opposite of 'top' is 'bottom'). This is an abstract getter that must be implemented by subclasses.

**Constructor:**

```typescript
constructor(panel: panel)
```

- `panel`: `panel`
  - The `panel` object that this edge belongs to.

**Methods:**

- `adjust_on_scroll(scroll_left: number, scroll_top: number)`: `void`
  - Adjusts the position of the edge element when the panel is scrolled. Vertical edges are translated horizontally, and horizontal edges are translated vertically.
- `#on_mouse_down(e: MouseEvent)`: `void`
  - **Private method.** Handles the `mousedown` event on the edge element. It prevents the default browser behavior (text selection), stops event propagation to prevent panel dragging, and stores the initial mouse and scroll positions.
- `#on_mouse_move(e: MouseEvent)`: `void`
  - **Private method.** Handles the `mousemove` event when the mouse is moved while a resize operation is in progress. It calculates the change in mouse position and calls the `resize()` method of all edges in the same cluster. It also handles the scenario where a panel reaches its minimum size, in which case it starts resizing the opposite edge.
- `#on_mouse_up()`: `void`
  - **Private method.** Handles the `mouseup` event, which signifies the end of a resize operation. It resets the `resize_start` property, recreates the edge clusters as panel dimensions might have changed, and saves the new dimensions of all panels associated with the edges in the cluster to local storage.
- `save_dimensions_to_storage()`: `void`
  - Saves the current dimensions of the panel to local storage. This method is called after a resize operation is complete.
- `#on_mouse_enter()`: `void`
  - **Private method.** Provides visual feedback by changing the background color of all edges in the same cluster when the mouse cursor enters any of them.
- `#on_mouse_leave()`: `void`
  - **Private method.** Removes the visual feedback by resetting the background color of all edges in the same cluster when the mouse cursor leaves any of them.
- `get_neigbors(cluster: Set<edge>, all_edges: edge[])`: `void`
  - Recursively finds all `edge` objects that are connected to the current edge and adds them to the provided `cluster` set. It uses a stack-based approach to traverse the connected edges.
- `#immediate_neighbors(edge: edge, all_edges: edge[])`: `Set<edge>`
  - **Private method.** Finds the edges that are directly adjacent to the given `edge` and share a border. It considers only edges of the same alignment (vertical or horizontal).
  - **Returns:** `Set<edge>` - A set of immediately neighboring `edge` objects.
- `increases_size(change_x: number, change_y: number)`: `boolean` **(Abstract)**
  - An abstract method that must be implemented by subclasses to determine if the current mouse movement during a resize operation would increase the size of the panel along the edge's axis.
- `share_border(rect1: DOMRect, rect2: DOMRect, alignment: "vertical" | "horizontal" | undefined)`: `boolean` **(Abstract)**
  - An abstract method that must be implemented by subclasses to check if two given edge rectangles share a border based on their alignment.
- `create_edge()`: `HTMLElement` **(Abstract)**
  - An abstract method that must be implemented by subclasses to create and style the specific HTML element for the edge.
  - **Returns:** `HTMLElement` - The created edge element.
- `resize(change_x: number, change_y: number)`: `void` **(Abstract)**
  - An abstract method that must be implemented by subclasses to handle the resizing logic for the specific edge based on the change in mouse coordinates.

### horizontal_edge (Abstract)

An abstract base class for horizontal edges (top and bottom).

**Extends:** [`edge`](#edge-abstract)

**Properties:**

- `alignment`: `"vertical" | "horizontal"` = `"horizontal"`
  - Overrides the `alignment` property from the `edge` class to specifically indicate a horizontal alignment.

**Methods:**

- `share_border(rect1: DOMRect, rect2: DOMRect, alignment: "vertical" | "horizontal")`: `boolean`
  - Overrides the abstract `share_border` method from the `edge` class to provide a specific implementation for horizontal edges. It checks if two edges are close enough vertically and overlap horizontally within the defined `closeness` threshold.

### vertical_edge (Abstract)

An abstract base class for vertical edges (left and right).

**Extends:** [`edge`](#edge-abstract)

**Properties:**

- `alignment`: `"vertical" | "horizontal"` = `"vertical"`
  - Overrides the `alignment` property from the `edge` class to specifically indicate a vertical alignment.

**Methods:**

- `share_border(rect1: DOMRect, rect2: DOMRect, alignment: "vertical" | "horizontal")`: `boolean`
  - Overrides the abstract `share_border` method from the `edge` class to provide a specific implementation for vertical edges. It checks if two edges are close enough horizontally and overlap vertically within the defined `closeness` threshold.

### top

Represents the top border region of a panel.

**Extends:** [`horizontal_edge`](#horizontal_edge-abstract)

**Getters:**

- `opposite_edge`: [`edge`](#edge-abstract) | `undefined`
  - Overrides the `opposite_edge` getter to return the `bottom` edge of the panel.

**Methods:**

- `create_edge()`: `HTMLElement`
  - Overrides the `create_edge` method to create a `div` element styled to represent the top edge.
  - **Returns:** `HTMLElement` - The created top edge element.
- `resize(change_x: number, change_y: number)`: `void`
  - Overrides the `resize` method to handle resizing the panel from the top edge. It adjusts the panel's height and top position based on the vertical change in mouse coordinates, while respecting the minimum panel size.
- `increases_size(change_x: number, change_y: number)`: `boolean`
  - Overrides the `increases_size` method to return `true` if the vertical change in mouse coordinates is negative (moving the mouse upwards), indicating an increase in the panel's height when resizing from the top.

### bottom

Represents the bottom border region of a panel.

**Extends:** [`horizontal_edge`](#horizontal_edge-abstract)

**Getters:**

- `opposite_edge`: [`edge`](#edge-abstract) | `undefined`
  - Overrides the `opposite_edge` getter to return the `top` edge of the panel.

**Methods:**

- `create_edge()`: `HTMLElement`
  - Overrides the `create_edge` method to create a `div` element styled to represent the bottom edge.
  - **Returns:** `HTMLElement` - The created bottom edge element.
- `resize(change_x: number, change_y: number)`: `void`
  - Overrides the `resize` method to handle resizing the panel from the bottom edge. It adjusts the panel's height based on the vertical change in mouse coordinates, while respecting the minimum panel size.
- `increases_size(change_x: number, change_y: number)`: `boolean`
  - Overrides the `increases_size` method to return `true` if the vertical change in mouse coordinates is positive (moving the mouse downwards), indicating an increase in the panel's height when resizing from the bottom.

### left

Represents the left border region of a panel.

**Extends:** [`vertical_edge`](#vertical_edge-abstract)

**Getters:**

- `opposite_edge`: [`edge`](#edge-abstract) | `undefined`
  - Overrides the `opposite_edge` getter to return the `right` edge of the panel.

**Methods:**

- `create_edge()`: `HTMLElement`
  - Overrides the `create_edge` method to create a `div` element styled to represent the left edge.
  - **Returns:** `HTMLElement` - The created left edge element.
- `resize(change_x: number, change_y: number)`: `void`
  - Overrides the `resize` method to handle resizing the panel from the left edge. It adjusts the panel's width and left position based on the horizontal change in mouse coordinates, while respecting the minimum panel size.
- `increases_size(change_x: number, change_y: number)`: `boolean`
  - Overrides the `increases_size` method to return `true` if the horizontal change in mouse coordinates is negative (moving the mouse to the left), indicating an increase in the panel's width when resizing from the left.

### right

Represents the right border region of a panel.

**Extends:** [`vertical_edge`](#vertical_edge-abstract)

**Getters:**

- `opposite_edge`: [`edge`](#edge-abstract) | `undefined`
  - Overrides the `opposite_edge` getter to return the `left` edge of the panel.

**Methods:**

- `create_edge()`: `HTMLElement`
  - Overrides the `create_edge` method to create a `div` element styled to represent the right edge.
  - **Returns:** `HTMLElement` - The created right edge element.
- `resize(change_x: number, change_y: number)`: `void`
  - Overrides the `resize` method to handle resizing the panel from the right edge. It adjusts the panel's width based on the horizontal change in mouse coordinates, while respecting the minimum panel size.
- `increases_size(change_x: number, change_y: number)`: `boolean`
  - Overrides the `increases_size` method to return `true` if the horizontal change in mouse coordinates is positive (moving the mouse to the right), indicating an increase in the panel's width when resizing from the right.

## Example Usage

This example shows the fundamental setup for using the resizer.

### HTML Structure

Define a container (.container) and place child elements within it. These children become the resizable panels.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Border resize</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="resize.css" />
    <script type="module">
      import { resizer } from "./resize.js";
      //
      //
      window.onload = () => {
        const container = document.querySelector(".container");
        //
        //Create an instance of the resizer class
        new resizer(container);
      };
    </script>
  </head>
  <body>
    <div class="container">
      <div class="header">header</div>
      <div class="resume">resume</div>
      <div class="work-plan">work</div>
      <div class="facts">facts</div>
      <div class="footer">footer</div>
    </div>
  </body>
</html>
```

### CSS Styling

Container: MUST use display: grid;.
Grid Template: MUST use percentage-based units for grid-template-rows and grid-template-columns.
Box Sizing: Highly recommended: \* { box-sizing: border-box; }.

```css
* {
  box-sizing: border-box;
}

body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* --- REQUIRED Container Styling --- */
.container {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-areas:
    "school stream student"
    "class  year   student";

  /* MUST use percentage units */
  grid-template-rows: 60% 40%;
  grid-template-columns: 30% 30% 40%;
}
```

### JavaScript Initialization

Import and instantiate the resizer after the window is loaded, passing the container element.

```javascript
import { resizer } from "./resize.js"; // Adjust path

window.onload = () => {
  const container = document.querySelector(".container");
  if (container) {
    new resizer(container); // Initialize
  }
};
```

**Important Note on CSS Grid & Percentages:**
For the resizer module to function correctly, the container element must use display: grid; and its layout must be defined using percentage-based units for both grid-template-rows and grid-template-columns to avoid resizing glitches.

## Integration with TypeScript

Here's how to integrate the resizer within a class structure, ensuring correct initialization timing.

1. TypeScript Class Example:
   Initialize the resizer after the component's elements are rendered (e.g., in a show or mount method).

```typescript
import { resizer } from "../../../resizer/v0/code/resize.js";
//
//This is an abstract class that was developed to care of my different panel in the school page management system
import { panel, page, panel_options } from "./panel.js";
//
//School page is the class that helps in managing school system
export class school_page extends page {
  public resizer?: resizer;
  //
  //Properties of the school page
  public school: school_panel;
  public class_: class_;
  public stream: stream;
  public year: year;
  public student: student;
  //
  constructor(
    //
    //To implement the view has-a hierarchy
    public parent: view
  ) {
    //
    //Options for controlling school management system
    const options: table_options = {
      dbname: "school",
      //
      //Makes the entire system read only
      io_type: "read_only",
    };
    //
    //
    super(parent, options);
    //
    //Creating instance from the classes that represent the panels
    this.panels = [
      (this.school = new school_panel(this)),
      (this.class_ = new class_(this)),
      (this.stream = new stream(this)),
      (this.year = new year(this)),
      (this.student = new student(this)),
    ];
  }
  //
  //Displays the entire school page
  async show() {
    //
    await super.show();
    //
    //Create a resizer for the school page
    //
    const container: HTMLElement | null = document.querySelector(".container");
    //
    //
    if (!container) throw new mutall_error("Container not found");
    //
    this.resizer = new resizer(container);
  }
}
```

2. Relevant CSS Notes:

   - Ensure the CSS includes:
   - `* { box-sizing: border-box; }` (Highly Recommended)
   - `.container { display: grid; /* + percentage rows/columns */ }` (Required)
   - Panel elements (#school_panel, etc.) should have `overflow: auto;` and `position: relative;`.

3. Important Integration Notes:
   - Initialization Timing: The resizer needs access to rendered DOM elements. Initialize it after the container and panels are present in the DOM (e.g., in show()). Initializing too early will fail.
   - box-sizing: border-box;: Strongly recommended globally or for panels/container. It ensures padding and borders are included within element dimensions, preventing layout issues common with percentage grids and dynamic resizing.

## Known Issues and Limitations

- Neighbor Detection with Grid Gaps/Scrollbars: Pixel-based proximity (closeness) may fail to detect adjacent panels if CSS gap or scrollbars create too much distance. Increasing closeness risks clustering edges from the same panel.
- Initial Edge Positioning with Scrolled Panels: If panels load already scrolled, initial edge positions might be calculated incorrectly relative to the viewport, potentially affecting initial neighbor clustering.
- Layout Persistence using Pixels: Saving layout dimensions in absolute pixels (px) breaks layout responsiveness on viewport/screen size changes. Workaround: Use the reset button.
- Container Overflow During Resizing: The sum of panel dimensions might exceed the main resizer container's bounds during resizing, causing unwanted overflow/scrollbars on the container itself. The logic lacks an overall container boundary check during resize.

## Future Considerations & Potential Enhancements

- Enhanced Panel Size Flexibility: Allow panels to collapse below min_panel_size or be hidden entirely, with a mechanism to restore them.
- Customizable Reset Button: Allow developers to provide their own reset button element or configure the default one's style/placement.
- Improved Neighbor Detection Across Gaps: Implement more robust neighbor detection that accounts for CSS gap, potentially by analyzing the grid structure.
- Responsive Layout Persistence: Implement saving layout state using proportional units instead of pixels. This can be implemented using Joan's hotspot module.
- Container Boundary Constraints: Add checks during resize operations to prevent the total size of panels exceeding the main resizer container dimensions.
- API for customizations: Providing an options interface to allow the users to customize the resizer.Some customizable features as requested would be border size,border color,min panel dimensions and neigbor proximity and any additional customizations that might be requested.

---

**Brower Compatibility** Always make sure that any features added are tested across different browsers to ensure cross compatibility.

## Contributions

This was developed by Moses Saruni under the guidance of Mr.Muraya, with contributions from James Mogaka.
