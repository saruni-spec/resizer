import { view, options } from "../../../schema/v/code/schema.js";
//
// Adding resizable functionality to grids on a page
export class resizer extends view {
  public panels: Map<string, panel>;
  //
  // Store the viewport dimensions
  public viewport: Array<number> = [window.innerWidth, window.innerHeight];

  constructor(parent?: view | undefined, options?: options | undefined) {
    super(parent, options);
    this.panels = new Map();
    this.panels.set("school", new school(this));
    this.panels.set("student", new student(this));
    this.panels.set("class", new student_class(this));
    this.panels.set("stream", new stream(this));
    this.panels.set("year", new year(this));
  }
}
//
/// A panel is a resizable grid on a page
class panel extends view {
  //
  // Store regions in a Map for direct access by border type
  public regions: Map<string, region> = new Map();
  public element: HTMLElement;
  //
  //
  public resize_start?: Array<number>;
  public resize_direction?: "top" | "bottom" | "left" | "right";

  constructor(panel_id: string, parent: resizer, options?: options) {
    super(parent, options);
    this.element = this.get_element(panel_id);
    //
    // Added relative positioning for proper region placement
    this.element.style.position = "relative";
    //
    // Add the border regions
    this.get_regions(parent.viewport[0], parent.viewport[1]);
    //
    // Add mouse move and mouse up listeners to the document
    document.onmousemove = (e: MouseEvent) => this.on_mouse_move(e);
    document.onmouseup = (e: MouseEvent) => this.on_mouse_up(e);
  }
  //
  // Get the border regions of this panel
  get_regions(vw: number, vh: number): void {
    const threshold = region.threshold;
    const rect = this.element.getBoundingClientRect();
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

  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }

  on_mouse_move(e: MouseEvent): void {
    //
    // If resize hasn't started or no direction is set, exit
    if (!this.resize_start || !this.resize_direction) return;
    //
    // Calculate the difference from the start position
    const change_x = e.clientX - this.resize_start[0];
    const change_y = e.clientY - this.resize_start[1];

    // Get current dimensions
    const rect = this.rect;

    // Handle resizing based on direction
    switch (this.resize_direction) {
      //
      // Resizing for the top border
      case "top":
        //
        // Calculate the new height for the panel
        const new_height = rect.height - change_y;
        //
        // Calculate the new top position for the panel
        const new_top = rect.top + change_y;
        //
        // Apply the new top and height to the panel
        this.element.style.top = `-${new_top}px`;
        this.element.style.height = `${new_height}px`;

        break;
      //
      // Resizing for the bottom border
      case "bottom":
        const bottom_height = rect.height + change_y;
        this.element.style.height = `${bottom_height}px`;

        break;

      case "left":
        const new_width = rect.width - change_x;
        const new_left = rect.left + change_x;
        this.element.style.width = `${new_width}px`;
        this.element.style.left = `-${new_left}px`;

        break;

      case "right":
        const right_width = rect.width + change_x;

        this.element.style.width = `${right_width}px`;

        break;
    }

    // Update the start position for the next move event
    this.resize_start = [e.clientX, e.clientY];
  }
  //
  on_mouse_up(e: MouseEvent): void {
    //
    // Reset the resize_start property
    this.resize_start = undefined;
    //
    // Reset the resize direction
    this.resize_direction = undefined;
  }
}
//
// Concrete panel implementations (remain unchanged)
export class school extends panel {
  constructor(parent: resizer, options?: options) {
    super("school", parent, options);
  }
}
export class student extends panel {
  constructor(parent: resizer, options?: options) {
    super("student", parent, options);
  }
}
export class student_class extends panel {
  constructor(parent: resizer, options?: options) {
    super("class", parent, options);
  }
}
export class stream extends panel {
  constructor(parent: resizer, options?: options) {
    super("stream", parent, options);
  }
}
export class year extends panel {
  constructor(parent: resizer, options?: options) {
    super("year", parent, options);
  }
}
//
//  The mouse down event should be handled in the region class because:
//  Each region knows its own resize behavior (top/bottom vs left/right)
//  The region contains the physical element being interacted with
//  Regions manage their own interactions
abstract class region {
  static threshold = 20;
  public element: HTMLElement;

  constructor(public panel: panel) {
    this.element = this.create_element();
    this.panel.element.appendChild(this.element);
    //
    //Add repeating styles to the element
    this.element.style.position = "absolute";

    this.element.style.zIndex = "2";

    //
    // Add mouse down listener to the element
    this.element.onmousedown = (evt: MouseEvent) => this.on_mouse_down(evt);
  }
  //
  // Mouse down event handler
  on_mouse_down(e: MouseEvent): void {
    e.preventDefault();
    this.panel.resize_start = [e.clientX, e.clientY];

    // Set the resize direction based on the region type
    if (this instanceof top) this.panel.resize_direction = "top";
    else if (this instanceof bottom) this.panel.resize_direction = "bottom";
    else if (this instanceof left) this.panel.resize_direction = "left";
    else if (this instanceof right) this.panel.resize_direction = "right";

    // Add mouse move and mouse up listeners to the document
    document.addEventListener("mousemove", (e) => this.panel.on_mouse_move(e));
    document.addEventListener("mouseup", (e) => {
      this.panel.on_mouse_up(e);
      // Remove the listeners when mouse is up
      document.removeEventListener("mousemove", (e) =>
        this.panel.on_mouse_move(e)
      );
      document.removeEventListener("mouseup", (e) => this.panel.on_mouse_up(e));
    });
  }
  //
  //
  abstract create_element(): HTMLElement;
}
//
// Top border region implementation
class top extends region {
  create_element(): HTMLElement {
    const el = document.createElement("div");
    //
    // style application

    el.style.top = "0";
    el.style.left = "0";
    el.style.right = "0";
    el.style.height = `${region.threshold}px`;
    el.style.backgroundColor = "gold";
    //
    // Cursor style assignment
    el.style.cursor = "ns-resize";
    return el;
  }
}
//
// Bottom border region
class bottom extends region {
  create_element(): HTMLElement {
    const el = document.createElement("div");

    el.style.bottom = "0";
    el.style.left = "0";
    el.style.right = "0";
    el.style.height = `${region.threshold}px`;
    el.style.backgroundColor = "silver";
    el.style.cursor = "ns-resize";
    return el;
  }
}
//
// Left border region
class left extends region {
  create_element(): HTMLElement {
    const el = document.createElement("div");

    el.style.left = "0";
    el.style.top = "0";
    el.style.bottom = "0";
    el.style.width = `${region.threshold}px`;
    el.style.backgroundColor = "gold";

    el.style.cursor = "ew-resize";
    return el;
  }
}
//
// Right border region
class right extends region {
  create_element(): HTMLElement {
    const el = document.createElement("div");

    el.style.right = "0";
    el.style.top = "0";
    el.style.bottom = "0";
    el.style.width = `${region.threshold}px`;
    el.style.backgroundColor = "silver";

    el.style.cursor = "ew-resize";
    return el;
  }
}
