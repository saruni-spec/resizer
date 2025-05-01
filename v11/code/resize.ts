import { view, view_options } from "../../../schema/v/code/schema.js";
//
// Adding resizable functionality to panels on a page
export class resizer extends view {
  public panels: Map<string, panel>;
  public clusters: Map<string, Set<edge>> = new Map();
  //
  // Store the viewport dimensions
  public viewport: Array<number> = [window.innerWidth, window.innerHeight];
  public container_rect: DOMRect;
  public client_width: number;
  public client_height: number;
  public client_left: number;
  public client_top: number;
  public container: HTMLElement;
  public scrollLeft: number = 0;
  public scrollTop: number = 0;

  // Update the constructor to track scroll positions
  constructor(
    grid_container?: HTMLElement,
    parent?: view | undefined,
    options?: view_options | undefined
  ) {
    super(parent, options);
    this.panels = new Map();

    // Store the container reference
    this.container = grid_container || document.body;

    // Track scroll positions
    this.scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    this.scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (grid_container) {
      this.container_rect = grid_container.getBoundingClientRect();
      this.client_width = grid_container.clientWidth;
      this.client_height = grid_container.clientHeight;
      this.client_left = grid_container.clientLeft;
      this.client_top = grid_container.clientTop;
    } else {
      this.container_rect = document.body.getBoundingClientRect();
      this.client_width = window.innerWidth;
      this.client_height = window.innerHeight;
      this.client_left = document.body.clientLeft;
      this.client_top = document.body.clientTop;
    }

    // Get the grid elements on the page
    const panels = this.#get_panels(grid_container);

    // Create the panels
    panels.forEach((curr_panel, index) => {
      this.panels.set(
        curr_panel.id || `panel-${index}`,
        new panel(curr_panel as HTMLElement, this)
      );
    });

    // Add all edges to the all_edges map
    this.create_clusters();
  }

  //
  // Get the grid elements on the page
  #get_panels(grid?: HTMLElement): Array<Element> {
    if (!grid) {
      grid = document.body;
    }
    //
    // Get the grid-template-areas property
    const grid_areas = grid.children;

    return Array.from(grid_areas);
  }
  //
  // Put all the edges in a cluster
  create_clusters(): Map<string, Set<edge>> {
    //
    // create an array to store all the edges
    const all_edges: edge[] = [];
    //
    // Get all the edges and add then to the all_edges array
    this.panels.forEach((panel) => {
      panel.edges.forEach((edge) => {
        all_edges.push(edge);
      });
    });
    //
    // Create a map to store the clusters
    const clusters = new Map<string, Set<edge>>();
    let clusterCount = 0;
    //
    // Continue searching for clusters until all edges are assigned to a cluster
    while (all_edges.length > 0) {
      //
      // Get the first edge in the all_edges array
      const currentEdge = all_edges[0];
      //
      // Create a new cluster and add the current edge to it
      const cluster = new Set<edge>();
      //
      // Find neighbors of the current edge
      currentEdge.get_neigbors(cluster, all_edges);
      //
      // Add the cluster to the clusters map
      clusters.set(`cluster-${clusterCount}`, cluster);

      clusterCount++;
    }
    //
    // Assign clusters to each edge
    clusters.forEach((cluster, clusterName) => {
      cluster.forEach((edge) => {
        edge.cluster = cluster;
      });
    });

    return clusters;
  }
}
//
/// A panel is a section on a grid/page
class panel extends view {
  //
  // Store regions in a Map for direct access by border type
  public edges: Map<string, edge> = new Map();

  constructor(
    public element: HTMLElement,
    parent: resizer,
    options?: view_options
  ) {
    super(parent, options);
    //
    // Added relative positioning for proper region placement
    this.element.style.position = "relative";
    //
    // Set a minimum size for the panel
    this.element.style.minWidth = "20px";
    this.element.style.minHeight = "20px";
    //
    // Add the border regions
    this.#get_regions();
  }
  //
  // Get the border regions of this panel
  // Modifications to the panel class #get_regions method
  #get_regions(): void {
    const threshold = edge.threshold;
    const rect = this.element.getBoundingClientRect();
    const resizerParent = this.parent as resizer;

    // Calculate position relative to container's content area
    // Account for scrolling by including the scroll position
    const panel_left =
      rect.left -
      (resizerParent.container_rect.left + resizerParent.client_left);
    const panel_top =
      rect.top - (resizerParent.container_rect.top + resizerParent.client_top);
    const panel_right = panel_left + rect.width;
    const panel_bottom = panel_top + rect.height;

    // Top edge (if not at container's top)
    if (panel_top > threshold) this.edges.set("top", new top(this));

    // Bottom edge (if not at container's bottom)
    if (panel_bottom < resizerParent.client_height - threshold)
      this.edges.set("bottom", new bottom(this));

    // Left edge (if not at container's left)
    if (panel_left > threshold) this.edges.set("left", new left(this));

    // Right edge (if not at container's right)
    if (panel_right < resizerParent.client_width - threshold)
      this.edges.set("right", new right(this));
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
//  The mouse down event should be handled in the region class because:
//  Each region knows its own resize behavior (top/bottom vs left/right)
//  The region contains the physical element being interacted with
//  Regions manage their own interactions
// The base edge class
abstract class edge {
  static threshold = 5;
  public element: HTMLElement;
  protected resize_start?: Array<number>;
  public alignment?: "vertical" | "horizontal";
  public cluster?: Set<edge>;
  protected initial_scroll: Array<number> = [0, 0];

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
    this.element.onmousedown = (evt: MouseEvent) => this.#on_mouse_down(evt);
    document.addEventListener("mousemove", (evt) => this.#on_mouse_move(evt));
    document.addEventListener("mouseup", (evt: MouseEvent) =>
      this.#on_mouse_up(evt)
    );

    this.element.addEventListener("mouseenter", () => this.#on_mouse_enter());
    this.element.addEventListener("mouseleave", () => this.#on_mouse_leave());
  }
  //
  // Mouse down event handler

  //
  // When the mouse moves, resize the panel
  //
  // Add a check that prevents one edge from oveerlapping another
  // during resizing
  // Modifications to the edge class #on_mouse_down method
  #on_mouse_down(e: MouseEvent): void {
    e.preventDefault();

    // Store the initial mouse position
    this.resize_start = [e.clientX, e.clientY];

    // Store the initial scroll position
    const resizerParent = this.panel.parent as resizer;
    this.initial_scroll = [resizerParent.scrollLeft, resizerParent.scrollTop];
  }

  // Modifications to the edge class #on_mouse_move method
  #on_mouse_move(e: MouseEvent): void {
    // If resize hasn't started, do not resize
    if (!this.resize_start) return;

    // Get the current scroll position
    const resizerParent = this.panel.parent as resizer;
    const currentScrollLeft = resizerParent.scrollLeft;
    const currentScrollTop = resizerParent.scrollTop;

    // Calculate the scroll delta since resize started
    const scrollDeltaX = currentScrollLeft - this.initial_scroll[0];
    const scrollDeltaY = currentScrollTop - this.initial_scroll[1];

    // Calculate the difference from the start position, accounting for scroll
    const change_x = e.clientX - this.resize_start[0] + scrollDeltaX;
    const change_y = e.clientY - this.resize_start[1] + scrollDeltaY;

    // Handle resizing based on edge type
    if (this.cluster) {
      this.cluster.forEach((edge) => {
        edge.resize(edge.panel.style, change_x, change_y);
      });
    }

    // Handle minimum width logic
    if (this.panel.style.width < 31) {
      const opposite_edge = this.get_opposite_edge();
      if (!opposite_edge) return;
      opposite_edge.element.style.backgroundColor = "red";

      opposite_edge.cluster?.forEach((edge) => {
        edge.resize(edge.panel.style, change_x, change_y);
      });
    }

    // Update the start position for the next move event
    this.resize_start = [e.clientX, e.clientY];

    // Create new clusters
    (this.panel.parent as resizer).create_clusters();
  }

  //
  // Get the opposite edge in the cluster
  get_opposite_edge(): edge | undefined {
    //
    // Get the opposite edge in the cluster
    // if right edge, get left edge
    // if left edge, get right edge
    // if top edge, get bottom edge
    // if bottom edge, get top edge
    if (this instanceof right) {
      return this.panel.edges.get("left");
    }
    if (this instanceof left) {
      return this.panel.edges.get("right");
    }
    if (this instanceof top) {
      return this.panel.edges.get("bottom");
    }

    return this.panel.edges.get("top");
  }

  //
  // Mouse up event handler
  #on_mouse_up(e: MouseEvent): void {
    //
    // Reset the resize_start property
    this.resize_start = undefined;
  }
  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }

  //
  // Highlight the edges in the cluster on hover
  #on_mouse_enter() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = "lightblue";
    });
  }

  #on_mouse_leave() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = "transparent";
    });
  }
  //
  // Abstract methods to be implemented by subclasses
  abstract create_edge(): HTMLElement;
  abstract resize(rect: any, change_x: number, change_y: number): void;

  // We are using a depth-first search to find the neighbors of the current edge
  // This means we will continue to search the neighbors of the neighbors
  // until we have found all the edges in the cluster while adding them to a stack
  // We will use an array(a stack) to store the edges we are checking
  // We will continue until the stack is empty
  get_neigbors(cluster: Set<edge>, all_edges: edge[]): void {
    //
    // Create a stack to store the edges to be that we are checking
    const stack: edge[] = [this];
    //
    // Continue until the stack is empty
    while (stack.length > 0) {
      //
      // Get the current edge from the stack
      const current = stack.pop()!;
      //
      // Skip if the edge is already in the cluster
      if (cluster.has(current)) continue;
      //
      // Add the current edge to the cluster
      cluster.add(current);
      //
      // Find the index of the current edge in the all_edges array
      const index = all_edges.indexOf(current);
      //
      // Remove the edge from the all_edges array
      if (index !== -1) all_edges.splice(index, 1);
      //
      // Find its neighbors and push to stack
      const neighbors = this.#immediate_neighbors(current, all_edges);
      //
      // Loop through the neighbors
      neighbors.forEach((neighbor) => {
        //
        // If the neighbor is not already in the cluster, add it to the stack
        if (!cluster.has(neighbor)) {
          //
          // Add the neighbor to the stack
          stack.push(neighbor);
        }
      });
    }
  }
  //
  // Get the neighbors of an edge
  #immediate_neighbors(edge: edge, all_edges: edge[]): Set<edge> {
    //
    // Create a set to store the neighbors
    const neighbors = new Set<edge>();
    //
    // Get the type of the edge (vertical or horizontal)
    const type = edge.alignment;
    //
    // Filter edges of the same type (vertical/horizontal)
    const sameTypeEdges = all_edges.filter((e) => e.alignment === type);
    //
    // Check each edge for shared border
    sameTypeEdges.forEach((otherEdge) => {
      //
      // If the edges share a border, add the other edge to the neighbors set
      if (this.#share_border(edge.rect, otherEdge.rect, type)) {
        neighbors.add(otherEdge);
      }
    });
    return neighbors;
  }
  //
  // Check if two edges share a border
  #share_border(
    rect1: DOMRect,
    rect2: DOMRect,
    alignment: "vertical" | "horizontal" | undefined
  ): boolean {
    if (!alignment) {
      return false;
    }

    const closeness = 30;
    //
    // For vertical edges (left/right borders)
    if (alignment === "vertical") {
      //
      // Check if one edge's right equals or is very close to the other's left (or vice versa)
      const touching =
        Math.abs(rect1.right - rect2.left) < closeness ||
        Math.abs(rect2.right - rect1.left) < closeness;
      //
      // Check if they overlap vertically
      const vertical_overlap =
        Math.max(rect1.top, rect2.top) < Math.min(rect1.bottom, rect2.bottom);

      return touching && vertical_overlap;
    }
    //
    // For horizontal edges (top/bottom borders)
    else {
      //
      // Check if one edge's bottom equals or is very close to the other's top (or vice versa)
      const touching =
        Math.abs(rect1.bottom - rect2.top) < closeness ||
        Math.abs(rect2.bottom - rect1.top) < closeness;
      //
      // Check if they overlap horizontally
      const horizontal_ovrlap =
        Math.max(rect1.left, rect2.left) < Math.min(rect1.right, rect2.right);

      return touching && horizontal_ovrlap;
    }
  }

  // Add this method to the edge class
  updatePositionAfterScroll(deltaX: number, deltaY: number): void {
    // If we're currently resizing, adjust the resize_start to maintain proper relative position
    if (this.resize_start) {
      this.resize_start[0] += deltaX;
      this.resize_start[1] += deltaY;
    }
  }
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
  create_edge(): HTMLElement {
    const el = document.createElement("div");
    //
    // Style application
    el.style.top = "0";
    el.style.left = "0";
    el.style.right = "0";
    el.style.height = `${edge.threshold}px`;

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
  create_edge(): HTMLElement {
    const el = document.createElement("div");
    el.style.bottom = "0";
    el.style.left = "0";
    el.style.right = "0";
    el.style.height = `${edge.threshold}px`;

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
  create_edge(): HTMLElement {
    const el = document.createElement("div");
    el.style.left = "0";
    el.style.top = "0";
    el.style.bottom = "0";
    el.style.width = `${edge.threshold}px`;
    el.style.backgroundColor = "blue";

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
  create_edge(): HTMLElement {
    const el = document.createElement("div");
    el.style.right = "0";
    el.style.top = "0";
    el.style.bottom = "0";
    el.style.width = `${edge.threshold}px`;

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
