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
class panel extends view {
  //
  // Store regions in a Map for direct access by border type
  // Key: border type as string ('top' | 'bottom' | 'left' | 'right')
  // Value: The region instance
  public regions: Map<string, region> = new Map();
  //
  // The actual HTML element this panel represents
  public element: HTMLElement;

  constructor(panel_id: string, parent?: view, options?: options) {
    super(parent, options);
    this.element = this.get_element(panel_id);
    //
    // Get viewport size  (width and height)
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    //
    // Add the border regions
    this.get_regions(vw, vh);

    //
    // Add mousemove event listener to detect border regions
    this.element.onmousemove = (evt) => this.get_current_region(evt);
    // get_region
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
    // Top border
    if (rect.top > threshold) this.regions.set("top", new top(this));
    //
    // Bottom border
    if (rect.bottom < vh - threshold)
      this.regions.set("bottom", new bottom(this));
    //
    // Left border
    if (rect.left > threshold) this.regions.set("left", new left(this));
    //
    // Right border
    if (rect.right < vw - threshold) this.regions.set("right", new right(this));
  }
  //
  // The panel's current position and size
  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }
  //
  // Detect which region contains the mouse
  get_current_region(evt: MouseEvent) {
    let cursor = "auto";
    //
    // Iterate through Map values to check each region
    for (const region of this.regions.values()) {
      //
      // If cursor is within region, get the cursor style
      if (region.is_current(evt)) {
        cursor = region.cursor;
        break;
      }
    }
    //
    // Set the panles cusor style
    this.element.style.cursor = cursor;
  }
}
//
// Panel for a school management page
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
  // How many pixels from edge for a border region
  public static threshold = 20;
  //
  // Each region knows its parent panel
  constructor(public panel: panel) {}
  //
  // Position check
  abstract is_current(evt: MouseEvent): boolean;
  //
  // Cursor style for this border
  abstract cursor: string;
}
//
// Top border region implementation
class top extends region {
  cursor: string = "ns-resize";
  //
  // Checks if cursor is within top threshold
  is_current(evt: MouseEvent): boolean {
    //
    // Panel's current position
    const rect = this.panel.rect;
    //
    // Distance from top edge to cursor
    return evt.clientY - rect.top <= region.threshold;
  }
  //
  // Vertical resize cursor
}
//
// Bottom border region
class bottom extends region {
  cursor: string = "ns-resize";
  //
  // Checks if cursor is within bottom threshold
  is_current(evt: MouseEvent): boolean {
    const rect = this.panel.rect;
    //
    // Distance from cursor to bottom
    return rect.bottom - evt.clientY <= region.threshold;
  }
}
//implementation
class left extends region {
  cursor: string = "ew-resize";
  //
  // Checks if cursor is within left threshold
  is_current(evt: MouseEvent): boolean {
    const rect = this.panel.rect;
    //
    // Distance from left edge to cursor
    return evt.clientX - rect.left <= region.threshold;
  }
}
//
// Right border region implementation
class right extends region {
  cursor: string = "ew-resize";
  //
  // Checks if cursor is within right threshold
  is_current(evt: MouseEvent): boolean {
    const rect = this.panel.rect;
    //
    // Distance from cursor to right edge
    return rect.right - evt.clientX <= region.threshold;
  }
}
