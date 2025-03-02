import { view, options } from "../../../schema/v/code/schema.js";
//
// Adding resizable functionality to panels on a page
export class resizer extends view {
  public panels: Map<string, panel>;
  public clusters: Map<string, Set<edge>> = new Map();
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
    //
    // Add all edges to the all_edges map
    this.create_clusters();
  }
  //
  // Put all the edges in a cluster
  create_clusters(): Map<string, Set<edge>> {
    const all_edges: edge[] = [];
    this.panels.forEach((panel) => {
      panel.edges.forEach((edge) => {
        all_edges.push(edge);
      });
    });

    const clusters = new Map<string, Set<edge>>();
    let clusterCount = 0;

    while (all_edges.length > 0) {
      const currentEdge = all_edges[0];
      const cluster = new Set<edge>();
      this.get_neighbors(currentEdge, cluster, all_edges);
      clusters.set(`cluster-${clusterCount}`, cluster);
      clusterCount++;
    }

    clusters.forEach((cluster, clusterName) => {
      cluster.forEach((edge) => {
        edge.cluster = cluster;
      });
    });

    return clusters;
  }

  private get_neighbors(
    edge: edge,
    cluster: Set<edge>,
    all_edges: edge[]
  ): void {
    const stack: edge[] = [edge];
    while (stack.length > 0) {
      const current = stack.pop()!;
      // Skip if already processed
      if (cluster.has(current)) continue;
      // Add to cluster and remove from all_edges
      cluster.add(current);
      const index = all_edges.indexOf(current);
      if (index !== -1) all_edges.splice(index, 1);
      // Find neighbors and push to stack
      const neighbors = this.get_neighbor(current, all_edges);
      neighbors.forEach((neighbor) => {
        if (!cluster.has(neighbor)) {
          stack.push(neighbor);
        }
      });
    }
  }

  private get_neighbor(edge: edge, all_edges: edge[]): Set<edge> {
    const neighbors = new Set<edge>();
    const type = edge.alignment;
    // Filter edges of the same type (vertical/horizontal)
    const sameTypeEdges = all_edges.filter((e) => e.alignment === type);
    // Check each edge for shared border
    sameTypeEdges.forEach((otherEdge) => {
      if (this.share_border(edge.rect, otherEdge.rect, type)) {
        neighbors.add(otherEdge);
      }
    });
    return neighbors;
  }
  //
  // Check if two edges share a border
  share_border(
    rect1: DOMRect,
    rect2: DOMRect,
    alignment: "vertical" | "horizontal" | undefined
  ): boolean {
    if (!alignment) {
      return false;
    }

    // For vertical edges (left/right borders)
    if (alignment === "vertical") {
      // Check if one edge's right equals or is very close to the other's left (or vice versa)
      const touching =
        Math.abs(rect1.right - rect2.left) < 2 ||
        Math.abs(rect2.right - rect1.left) < 2;

      // Check if they overlap vertically
      const verticalOverlap =
        Math.max(rect1.top, rect2.top) < Math.min(rect1.bottom, rect2.bottom);

      return touching && verticalOverlap;
    }
    // For horizontal edges (top/bottom borders)
    else {
      // Check if one edge's bottom equals or is very close to the other's top (or vice versa)
      const touching =
        Math.abs(rect1.bottom - rect2.top) < 2 ||
        Math.abs(rect2.bottom - rect1.top) < 2;

      // Check if they overlap horizontally
      const horizontalOverlap =
        Math.max(rect1.left, rect2.left) < Math.min(rect1.right, rect2.right);

      return touching && horizontalOverlap;
    }
  }
}
//
/// A panel is a section on a grid/page
class panel extends view {
  //
  // Store regions in a Map for direct access by border type
  public edges: Map<string, edge> = new Map();
  //
  // The element representing the panel
  public element: HTMLElement;

  constructor(panel_id: string, parent: resizer, options?: options) {
    super(parent, options);
    this.element = this.get_element(panel_id);
    //
    // Added relative positioning for proper region placement
    this.element.style.position = "relative";
    //
    // Add the border regions
    this.get_regions(parent.viewport[0], parent.viewport[1]);
  }
  //
  // Get the border regions of this panel
  get_regions(vw: number, vh: number): void {
    const threshold = edge.threshold;
    const rect = this.element.getBoundingClientRect();
    //
    // Only create borders that aren't at viewport edges
    // Top border
    if (rect.top > threshold) this.edges.set("top", new top(this));
    //
    // Bottom border
    if (rect.bottom < vh - threshold)
      this.edges.set("bottom", new bottom(this));
    //
    // Left border
    if (rect.left > threshold) this.edges.set("left", new left(this));
    //
    // Right border
    if (rect.right < vw - threshold) this.edges.set("right", new right(this));
  }
  //
  // Get the dimensions of the panel from the DOMrect
  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }
  //
  // Get the dimensions of the panel from its css styling
  get style() {
    //
    // Use the getComputedStyles to get the panels css properties
    const panel_styles = window.getComputedStyle(this.element);
    //
    // Get and parse the top, left, width and height of the panel
    const panel_dimensions = {
      height: parseInt(panel_styles.height.split("p")[0]),
      width: parseInt(panel_styles.width.split("p")[0]),
      top: parseInt(panel_styles.top.split("p")[0]),
      left: parseInt(panel_styles.left.split("p")[0]),
    };
    return panel_dimensions;
  }
  //
  // Change the dimensions of the panel using its css properties
  set width(width: number) {
    this.element.style.width = `${width}px`;
  }
  set height(height: number) {
    this.element.style.height = `${height}px`;
  }
  set top(top: number) {
    this.element.style.top = `${top}px`;
  }
  set left(left: number) {
    this.element.style.left = `${left}px`;
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
// The base edge class
abstract class edge {
  static threshold = 20;
  public element: HTMLElement;
  protected resize_start?: Array<number>;
  public alignment?: "vertical" | "horizontal";
  public cluster?: Set<edge>;
  public color: string = "transparent";

  constructor(public panel: panel) {
    this.element = this.create_edge();
    this.panel.element.appendChild(this.element);
    //
    // Add repeating styles to the element
    this.element.style.position = "absolute";
    this.element.style.zIndex = "2";
    this.element.classList.add("edge");
    //
    // Add mouse event listeners
    this.element.onmousedown = (evt: MouseEvent) => this.on_mouse_down(evt);
    document.addEventListener("mousemove", (evt) => this.on_mouse_move(evt));
    document.addEventListener("mouseup", (evt: MouseEvent) =>
      this.on_mouse_up(evt)
    );

    this.element.addEventListener("mouseenter", () => this.on_mouse_enter());
    this.element.addEventListener("mouseleave", () => this.on_mouse_leave());
  }
  //
  // Mouse down event handler
  on_mouse_down(e: MouseEvent): void {
    e.preventDefault();
    this.resize_start = [e.clientX, e.clientY];
  }
  //
  // When the mouse moves, resize the panel
  on_mouse_move(e: MouseEvent): void {
    //
    // If resize hasn't started, do not resize
    if (!this.resize_start) return;
    //
    // Calculate the difference from the start position
    const change_x = e.clientX - this.resize_start[0];
    const change_y = e.clientY - this.resize_start[1];
    //
    // Get current dimensions of the panel
    // const rect = this.panel.style;
    // //
    // // Handle resizing based on edge type (implemented by subclasses)
    // this.resize(rect, change_x, change_y);
    // Resize all edges in the cluster
    if (this.cluster) {
      this.cluster.forEach((edge) => {
        edge.resize(edge.panel.style, change_x, change_y);
      });
    }
    //
    // Update the start position for the next move event
    this.resize_start = [e.clientX, e.clientY];
    //
    // Create new clusters
  }
  //
  // Mouse up event handler
  on_mouse_up(e: MouseEvent): void {
    //
    // Reset the resize_start property
    this.resize_start = undefined;
  }
  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }

  // 3. Hover handlers
  private on_mouse_enter() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = "red"; // Highlight color
    });
  }

  private on_mouse_leave() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = this.color;
    });
  }
  //
  // Abstract methods to be implemented by subclasses
  abstract create_edge(): HTMLElement;
  abstract resize(rect: any, change_x: number, change_y: number): void;
}
//
// Base class for horizontal edges (top and bottom)
abstract class horizontal_edge extends edge {
  //
  //
  public alignment?: "vertical" | "horizontal" | undefined = "horizontal";
  public neighbors: Map<string, horizontal_edge> = new Map();
}
//
// Base class for vertical edges (left and right)
abstract class vertical_edge extends edge {
  //
  //
  public alignment?: "vertical" | "horizontal" | undefined = "vertical";
  public neighbors: Map<string, vertical_edge> = new Map();
}
//
// Top border region implementation
class top extends horizontal_edge {
  public color: string = "gold";
  create_edge(): HTMLElement {
    const el = document.createElement("div");
    //
    // Style application
    el.style.top = "0";
    el.style.left = "0";
    el.style.right = "0";
    el.style.height = `${edge.threshold}px`;
    el.style.backgroundColor = "gold";
    //
    // Cursor style assignment
    el.style.cursor = "ns-resize";
    return el;
  }

  resize(rect: any, change_x: number, change_y: number): void {
    //
    // Calculate the new height for the panel
    const new_height = rect.height - change_y;
    //
    // Apply the new height and top position
    // Since the panel is positioned relative, we adjust its top position by the change in y
    const new_top = rect.top + change_y;
    this.panel.top = new_top;
    this.panel.height = new_height;
  }
}
//
// Bottom border region
class bottom extends horizontal_edge {
  public color: string = "silver";
  create_edge(): HTMLElement {
    const el = document.createElement("div");
    el.style.bottom = "0";
    el.style.left = "0";
    el.style.right = "0";
    el.style.height = `${edge.threshold}px`;
    el.style.backgroundColor = "silver";
    el.style.cursor = "ns-resize";
    return el;
  }

  resize(rect: any, change_x: number, change_y: number): void {
    //
    // Increase the height of the panel. The position does not need to be changed
    const bottom_height = rect.height + change_y;
    this.panel.height = bottom_height;
  }
}
//
// Left border region
class left extends vertical_edge {
  public color: string = "gold";
  create_edge(): HTMLElement {
    const el = document.createElement("div");
    el.style.left = "0";
    el.style.top = "0";
    el.style.bottom = "0";
    el.style.width = `${edge.threshold}px`;
    el.style.backgroundColor = "gold";
    el.style.cursor = "ew-resize";
    return el;
  }

  resize(rect: any, change_x: number, change_y: number): void {
    //
    // Calculate new width and left position
    const new_width = rect.width - change_x;
    this.panel.width = new_width;

    const new_left = rect.left + change_x;
    this.panel.left = new_left;
  }
}
///
// Right border region
class right extends vertical_edge {
  public color: string = "silver";
  create_edge(): HTMLElement {
    const el = document.createElement("div");
    el.style.right = "0";
    el.style.top = "0";
    el.style.bottom = "0";
    el.style.width = `${edge.threshold}px`;
    el.style.backgroundColor = "silver";
    el.style.cursor = "ew-resize";
    return el;
  }

  resize(rect: any, change_x: number, change_y: number): void {
    //
    // Increase the width of the panel. The position does not need to be changed
    const right_width = rect.width + change_x;
    this.panel.width = right_width;
  }
}
