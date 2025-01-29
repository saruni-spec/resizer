import { view, options } from "../../../schema/v/code/schema.js";
//
// Adding resizable funtinality to grids on a page
export class resizer extends view {
  //
  //A resizer has mulitple panels
  public panels: Map<string, panel>;
  //
  //
  constructor(parent?: view | undefined, options?: options | undefined) {
    super(parent, options);
    //
    // Add the panels
    this.panels = new Map();
    this.panels.set("school", new school(this));
    this.panels.set("student", new student(this));
    this.panels.set("class", new student_class(this));
    this.panels.set("stream", new stream(this));
    this.panels.set("year", new year(this));
  }
}

/// A panel is a resizable grid on a page
abstract class panel extends view {
  //
  // Store regions in a Map for direct access by border type
  // Key: border type as string ('top' | 'bottom' | 'left' | 'right')
  // Value: The region instance
  public regions: Map<string, region>;
  //
  // The actual HTML element this panel represents
  public element: HTMLElement;

  constructor(public panel_id: string, parent?: view, options?: options) {
    super(parent, options);
    this.element = this.create(panel_id);
    //
    // Initialize as Map instead of array
    this.regions = new Map();
    //
    // Get viewport size  (width and height)
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    //
    // Add the border regions
    this.get_regions(vw, vh);

    //
    // Add mousemove event listener to detect border regions
    this.element.addEventListener("mousemove", (evt) =>
      this.detect_border(evt)
    );
  }
  create(id: string): HTMLElement {
    const element = document.createElement("div");
    element.id = id;
    document.body.appendChild(element);
    return element;
  }
  //
  // Get the border regions of this panel
  get_regions(vw: number, vh: number): void {
    const threshold = region.threshold;
    //
    const rect = this.element.getBoundingClientRect();
    // Add regions to the panel
    //
    // Only create borders that aren't at viewport edges
    // Top border: only if panel isn't touching viewport top
    if (rect.top > threshold) this.regions.set("top", new top(this));
    //
    // Bottom border: only if panel isn't touching viewport bottom
    if (rect.bottom < vh - threshold)
      this.regions.set("bottom", new bottom(this));
    //
    // Left border: only if panel isn't touching viewport left
    if (rect.left > threshold) this.regions.set("left", new left(this));
    //
    // Right border: only if panel isn't touching viewport right
    if (rect.right < vw - threshold) this.regions.set("right", new right(this));
  }
  //
  // Get the panel's current position and size
  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }

  //
  // Detect which region contains the mouse
  detect_border(evt: MouseEvent) {
    let cursor = "auto";
    //
    // Iterate through Map values to check each region
    for (const region of this.regions.values()) {
      if (region.check(evt)) {
        cursor = region.get_cursor();
        break;
      }
    }
    this.element.style.cursor = cursor;
  }
}
//
// Panel implementations for a school management page
export class school extends panel {
  constructor(parent?: view, options?: options) {
    super("school", parent, options);
  }
}
export class student extends panel {
  constructor(parent?: view, options?: options) {
    super("student", parent, options);
  }
}

export class student_class extends panel {
  constructor(parent?: view, options?: options) {
    super("class", parent, options);
  }
}
export class stream extends panel {
  constructor(parent?: view, options?: options) {
    super("stream", parent, options);
  }
}

export class year extends panel {
  constructor(parent?: view, options?: options) {
    super("year", parent, options);
  }
}
//
// Base class for all border regions
abstract class region {
  //
  // How many pixels from edge constitutes a border region
  public static threshold = 20;
  //
  // Each region knows its parent panel
  constructor(public panel: panel) {}
  //
  // Must implement position check logic
  abstract check(evt: MouseEvent): boolean;
  //
  // Must provide cursor style for this border
  abstract get_cursor(): string;
}
//
// Top border region implementation
class top extends region {
  //
  // Checks if cursor is within top threshold
  check(evt: MouseEvent): boolean {
    //
    // Panel's current position
    const rect = this.panel.rect;
    //
    // Distance from top edge to cursor
    return evt.clientY - rect.top <= region.threshold;
  }
  //
  // Vertical resize cursor for top/bottom borders
  get_cursor(): string {
    return "ns-resize";
  }
}
//
// Bottom border region implementation
class bottom extends region {
  //
  // Checks if cursor is within bottom threshold
  check(evt: MouseEvent): boolean {
    const rect = this.panel.rect;
    //
    // Distance from cursor to bottom edge
    return rect.bottom - evt.clientY <= region.threshold;
  }
  get_cursor(): string {
    return "ns-resize";
  }
}
//
// Left border region implementation
class left extends region {
  //
  // Checks if cursor is within left threshold
  check(evt: MouseEvent): boolean {
    const rect = this.panel.rect;
    //
    // Distance from left edge to cursor
    return evt.clientX - rect.left <= region.threshold;
  }
  //
  // Horizontal resize cursor for left/right borders
  get_cursor(): string {
    return "ew-resize";
  }
}
//
// Right border region implementation
class right extends region {
  //
  // Checks if cursor is within right threshold
  check(evt: MouseEvent): boolean {
    const rect = this.panel.rect;
    //
    // Distance from cursor to right edge
    return rect.right - evt.clientX <= region.threshold;
  }
  get_cursor(): string {
    return "ew-resize";
  }
}
