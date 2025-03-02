import { view, options } from "../../../schema/v/code/schema.js";
//
// Adding resizable functionality to panels on a page
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
    this.panels.set("mid", new mid_panel(this));
  }
}
//
/// A panel is a section on a grid/page
class panel extends view {
  //
  // Store regions in a Map for direct access by border type
  public regions: Map<string, region> = new Map();
  //
  // The element representing the panel
  public element: HTMLElement;
  //
  // The coordinates when resizing starts
  public resize_start?: Array<number>;
  //
  // The direction of resizing
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
    //
    // Adding an evt listener directly to the document/element only allows addition of a single event
    // document.onmousemove=(evt:MouseEvent)=>this.on_mouse_move(evt)
    document.addEventListener("mousemove", (evt) => this.on_mouse_move(evt));
    document.addEventListener("mouseup", (evt: MouseEvent) =>
      this.on_mouse_up(evt)
    );
    // adding the mouse move event to the element makes it less responsive to fast mouse move changes
    // this.element.onmousemove=(evt:MouseEvent)=>this.on_mouse_move(evt);
    // this.element.onmouseup=(evt:MouseEvent)=>this.on_mouse_up(evt);
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
  //
  // Get the dimensions of the panel frm the DOMrect
  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }
  //
  // Get the dimensions of the panel from its css styling
  get style() {
    //
    // Use the getCOmputedStyles to get the panels css properties
    const panel_styles = window.getComputedStyle(this.element);
    //
    // Get and parse the top,left,width and heigh of the panel
    const panel_dimensions = {
      height: parseInt(panel_styles.height.split("p")[0]),
      width: parseInt(panel_styles.width.split("p")[0]),
      top: parseInt(panel_styles.top.split("p")[0]),
      left: parseInt(panel_styles.left.split("p")[0]),
    };
    return panel_dimensions;
  }
  //
  // When the mouse moves,resize the panel
  on_mouse_move(e: MouseEvent): void {
    //
    // If resize hasn't started or no direction is set, do not resize
    if (!this.resize_start || !this.resize_direction) return;
    //
    // Calculate the difference from the start position
    const change_x = e.clientX - this.resize_start[0];
    const change_y = e.clientY - this.resize_start[1];
    //
    // Get current dimensions of the panel
    const rect = this.style;
    //
    // Handle resizing based on direction
    switch (this.resize_direction) {
      case "top":
        //
        // Calculate the new height for the panel
        const new_height = rect.height - change_y;
        //
        // Apply the new height and top position
        //
        // Since the panel is positioned relative, we adjust its top position by the change in y
        const new_top = rect.top + change_y;
        this.element.style.top = `${new_top}px`;
        this.element.style.height = `${new_height}px`;

        break;
      //
      //Resise the bottom border
      case "bottom":
        //
        // Increae the height of the panel.The position does not need to be changed
        const bottom_height = rect.height + change_y;
        this.element.style.height = `${bottom_height}px`;

        break;

      case "left":
        const new_width = rect.width - change_x;

        this.element.style.width = `${new_width}px`;

        const new_left = rect.left + change_x;
        this.element.style.left = `${new_left}px`;

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
export class mid_panel extends panel {
  constructor(parent: resizer, options?: options) {
    super("mid", parent, options);
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
    //
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
