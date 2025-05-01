import { view, view_options } from "../../../schema/v/code/schema.js";
//
// Adding resizable functionality to panels on a page
// Modified resizer class to properly handle overflow
export class resizer extends view {
  public panels: Map<string, panel>;
  public clusters: Map<string, Set<edge>> = new Map();

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

  constructor(
    grid_container?: HTMLElement,
    parent?: view | undefined,
    options?: view_options | undefined
  ) {
    super(parent, options);
    this.panels = new Map();

    // Store the container reference
    this.container = grid_container || document.body;

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

    // Add resize event listener to update measurements on window resize
    window.addEventListener("resize", () => this.handleWindowResize());
  }

  // Handle window resize
  handleWindowResize() {
    this.viewport = [window.innerWidth, window.innerHeight];

    if (this.container === document.body) {
      this.client_width = window.innerWidth;
      this.client_height = window.innerHeight;
    } else {
      this.container_rect = this.container.getBoundingClientRect();
      this.client_width = this.container.clientWidth;
      this.client_height = this.container.clientHeight;
    }

    // Update all panels
    this.panels.forEach((panel) => panel.handleResize());
  }

  // Get the grid elements on the page
  #get_panels(grid?: HTMLElement): Array<Element> {
    if (!grid) {
      grid = document.body;
    }
    const grid_areas = grid.children;
    return Array.from(grid_areas);
  }

  // Put all the edges in a cluster
  create_clusters(): Map<string, Set<edge>> {
    // Create an array to store all the edges
    const all_edges: edge[] = [];

    // Get all the edges and add then to the all_edges array
    this.panels.forEach((panel) => {
      panel.edges.forEach((edge) => {
        all_edges.push(edge);
      });
    });

    // Create a map to store the clusters
    const clusters = new Map<string, Set<edge>>();
    let clusterCount = 0;

    // Continue searching for clusters until all edges are assigned to a cluster
    while (all_edges.length > 0) {
      // Get the first edge in the all_edges array
      const currentEdge = all_edges[0];

      // Create a new cluster and add the current edge to it
      const cluster = new Set<edge>();

      // Find neighbors of the current edge
      currentEdge.get_neigbors(cluster, all_edges);

      // Add the cluster to the clusters map
      clusters.set(`cluster-${clusterCount}`, cluster);
      clusterCount++;
    }

    // Assign clusters to each edge
    clusters.forEach((cluster, clusterName) => {
      cluster.forEach((edge) => {
        edge.cluster = cluster;
      });
    });

    this.clusters = clusters;
    return clusters;
  }
}

// Enhanced panel class with better overflow handling
class panel extends view {
  private resizeObserver: ResizeObserver;
  public edges: Map<string, edge> = new Map();

  constructor(
    public element: HTMLElement,
    parent: resizer,
    options?: view_options
  ) {
    super(parent, options);

    // Added relative positioning for proper region placement
    this.element.style.position = "relative";

    // Set a minimum size for the panel
    this.element.style.minWidth = "20px";
    this.element.style.minHeight = "20px";

    // Add the border regions
    this.#get_regions();

    // Setup resize observer to adjust edges when panel size changes
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.element);
    // Add scroll listener to the panel element
    this.element.addEventListener("scroll", () => this.handleScroll());
  }

  // Handle scroll events
  handleScroll() {
    const scrollLeft = this.element.scrollLeft;
    const scrollTop = this.element.scrollTop;
    this.edges.forEach((edge) => edge.adjustForScroll(scrollLeft, scrollTop));
  }
  // Handle resize events
  handleResize() {
    const rect = this.element.getBoundingClientRect();

    this.edges.forEach((edge) => {
      // Update edge positions based on panel's new dimensions
      if (edge instanceof right) {
        edge.element.style.left = `${
          this.element.clientWidth - right.threshold
        }px`;
      } else if (edge instanceof bottom) {
        edge.element.style.top = `${
          this.element.clientHeight - top.threshold
        }px`;
      }

      // Reapply scroll adjustments
      const resizerParent = this.parent as resizer;
      edge.adjustForScroll(resizerParent.scrollLeft, resizerParent.scrollTop);
    });
  }

  // Get the border regions of this panel with improved positioning
  #get_regions(): void {
    const threshold = edge.threshold;
    const rect = this.element.getBoundingClientRect();
    const resizerParent = this.parent as resizer;

    // Calculate position relative to container's content area
    const panel_left = rect.left - resizerParent.container_rect.left;
    const panel_top = rect.top - resizerParent.container_rect.top;
    const panel_right = panel_left + rect.width;
    const panel_bottom = panel_top + rect.height;

    // Get computed style of the panel to check for scrollbars
    const panelStyle = window.getComputedStyle(this.element);
    const hasVerticalScrollbar =
      this.element.scrollHeight > this.element.clientHeight;
    const hasHorizontalScrollbar =
      this.element.scrollWidth > this.element.clientWidth;

    // Container dimensions including scrollbars
    const containerWidth = resizerParent.client_width;
    const containerHeight = resizerParent.client_height;

    // Improved edge detection with scrollbar considerations
    const edgeOptions: { [key: string]: boolean } = {
      top: panel_top > threshold,
      bottom: panel_bottom < containerHeight - threshold,
      left: panel_left > threshold,
      right: panel_right < containerWidth - threshold,
    };

    // Adjust edge detection based on scrollbar presence
    if (hasVerticalScrollbar) {
      // If there's a vertical scrollbar on the left, disable left resizing
      if (panelStyle.overflowY === "scroll" && panelStyle.direction === "rtl") {
        edgeOptions.left = false;
      }
      // If there's a vertical scrollbar on the right, disable right resizing
      if (panelStyle.overflowY === "scroll" && panelStyle.direction === "ltr") {
        edgeOptions.right = false;
      }
    }

    if (hasHorizontalScrollbar) {
      // If there's a horizontal scrollbar at the bottom, disable bottom resizing
      if (panelStyle.overflowX === "scroll") {
        edgeOptions.bottom = false;
      }
    }

    // Create edges based on the refined detection
    if (edgeOptions.top) this.edges.set("top", new top(this));
    if (edgeOptions.bottom) this.edges.set("bottom", new bottom(this));
    if (edgeOptions.left) this.edges.set("left", new left(this));
    if (edgeOptions.right) this.edges.set("right", new right(this));
  }

  // Get the dimensions of the panel from its css styling
  get style() {
    const panel_styles = window.getComputedStyle(this.element);

    const panel_dimensions = {
      height: parseInt(panel_styles.height),
      width: parseInt(panel_styles.width),
      top: parseInt(panel_styles.top) || 0,
      left: parseInt(panel_styles.left) || 0,
    };
    return panel_dimensions;
  }

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

// Enhanced edge class with proper scroll handling
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

    // Add repeating styles to the element
    this.element.style.position = "absolute";
    this.element.style.zIndex = "2";
    this.element.classList.add("edge");

    // Add mouse event listeners with passive: false for better performance
    this.element.addEventListener(
      "mousedown",
      (evt: MouseEvent) => this.#on_mouse_down(evt),
      { passive: false }
    );

    // Use document for mouse move and up to capture events outside the element
    document.addEventListener("mousemove", (evt: MouseEvent) =>
      this.#on_mouse_move(evt)
    );
    document.addEventListener("mouseup", () => this.#on_mouse_up());

    // Visual feedback on hover
    this.element.addEventListener("mouseenter", () => this.#on_mouse_enter());
    this.element.addEventListener("mouseleave", () => this.#on_mouse_leave());
  }

  // Adjust edge position for scroll
  adjustForScroll(scrollLeft: number, scrollTop: number): void {
    // Different handling based on edge type
    if (this instanceof vertical_edge) {
      // For vertical edges (left/right), adjust for horizontal scroll
      this.element.style.transform = `translateX(${scrollLeft}px)`;
    } else if (this instanceof horizontal_edge) {
      // For horizontal edges (top/bottom), adjust for vertical scroll
      this.element.style.transform = `translateY(${scrollTop}px)`;
    }
  }

  // Improved mouse down handler with proper scroll tracking
  #on_mouse_down(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    // Store the initial mouse position
    this.resize_start = [e.clientX, e.clientY];

    // Store the initial scroll position
    const resizerParent = this.panel.parent as resizer;
    this.initial_scroll = [resizerParent.scrollLeft, resizerParent.scrollTop];

    // Add a class to the body to indicate resizing is in progress
    document.body.classList.add("resizing");
  }

  // Improved mouse move handler with scroll compensation
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

    // Handle resizing based on edge type and cluster
    if (this.cluster) {
      this.cluster.forEach((edge) => {
        edge.resize(edge.panel.style, change_x, change_y);
      });
    }

    // Update the start position for the next move event
    this.resize_start = [e.clientX, e.clientY];

    // Prevent minimum size issues
    const minSize = 20; // minimum size in pixels

    // Check if panel size is below minimum and adjust if needed
    const style = this.panel.style;
    if (style.width < minSize || style.height < minSize) {
      if (style.width < minSize) this.panel.width = minSize;
      if (style.height < minSize) this.panel.height = minSize;
    }
  }

  // Mouse up event handler
  #on_mouse_up(): void {
    if (!this.resize_start) return;

    // Reset the resize_start property
    this.resize_start = undefined;

    // Remove resizing class from body
    document.body.classList.remove("resizing");

    // Recreate clusters as panel dimensions have changed
    (this.panel.parent as resizer).create_clusters();
  }

  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }

  // Visual feedback when hovering over edges
  #on_mouse_enter() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = "rgba(0, 120, 215, 0.5)";
      edge.element.style.transition = "background-color 0.2s ease";
    });
  }

  #on_mouse_leave() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = "transparent";
    });
  }

  // Get the opposite edge in the cluster
  get_opposite_edge(): edge | undefined {
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

  // Abstract methods to be implemented by subclasses
  abstract create_edge(): HTMLElement;
  abstract resize(rect: any, change_x: number, change_y: number): void;

  // Find all connected edges (cluster detection)
  get_neigbors(cluster: Set<edge>, all_edges: edge[]): void {
    // Create a stack to store the edges we are checking
    const stack: edge[] = [this];

    // Continue until the stack is empty
    while (stack.length > 0) {
      // Get the current edge from the stack
      const current = stack.pop()!;

      // Skip if the edge is already in the cluster
      if (cluster.has(current)) continue;

      // Add the current edge to the cluster
      cluster.add(current);

      // Find the index of the current edge in the all_edges array
      const index = all_edges.indexOf(current);

      // Remove the edge from the all_edges array
      if (index !== -1) all_edges.splice(index, 1);

      // Find its neighbors and push to stack
      const neighbors = this.#immediate_neighbors(current, all_edges);

      // Loop through the neighbors
      neighbors.forEach((neighbor) => {
        // If the neighbor is not already in the cluster, add it to the stack
        if (!cluster.has(neighbor)) {
          stack.push(neighbor);
        }
      });
    }
  }

  // Find edges that are directly adjacent
  #immediate_neighbors(edge: edge, all_edges: edge[]): Set<edge> {
    // Create a set to store the neighbors
    const neighbors = new Set<edge>();

    // Get the type of the edge (vertical or horizontal)
    const type = edge.alignment;

    // Filter edges of the same type (vertical/horizontal)
    const sameTypeEdges = all_edges.filter((e) => e.alignment === type);

    // Check each edge for shared border
    sameTypeEdges.forEach((otherEdge) => {
      // If the edges share a border, add the other edge to the neighbors set
      if (this.#share_border(edge.rect, otherEdge.rect, type)) {
        neighbors.add(otherEdge);
      }
    });

    return neighbors;
  }

  // Check if two edges share a border (with better tolerance)
  #share_border(
    rect1: DOMRect,
    rect2: DOMRect,
    alignment: "vertical" | "horizontal" | undefined
  ): boolean {
    if (!alignment) return false;

    const closeness = 30; // Tolerance in pixels

    // For vertical edges (left/right borders)
    if (alignment === "vertical") {
      // Check if edges are close enough horizontally
      const touching =
        Math.abs(rect1.right - rect2.left) < closeness ||
        Math.abs(rect2.right - rect1.left) < closeness;

      // Check if they overlap vertically
      const vertical_overlap =
        Math.max(rect1.top, rect2.top) < Math.min(rect1.bottom, rect2.bottom);

      return touching && vertical_overlap;
    }
    // For horizontal edges (top/bottom borders)
    else {
      // Check if edges are close enough vertically
      const touching =
        Math.abs(rect1.bottom - rect2.top) < closeness ||
        Math.abs(rect2.bottom - rect1.top) < closeness;

      // Check if they overlap horizontally
      const horizontal_overlap =
        Math.max(rect1.left, rect2.left) < Math.min(rect1.right, rect2.right);

      return touching && horizontal_overlap;
    }
  }
}

// Base class for horizontal edges (top and bottom)
abstract class horizontal_edge extends edge {
  public alignment?: "vertical" | "horizontal" | undefined = "horizontal";
}

// Base class for vertical edges (left and right)
abstract class vertical_edge extends edge {
  public alignment?: "vertical" | "horizontal" | undefined = "vertical";
}

// Top border region implementation
class top extends horizontal_edge {
  create_edge(): HTMLElement {
    const el = document.createElement("div");

    // Style application
    el.style.top = "0";
    el.style.left = "0";
    el.style.right = "0";
    el.style.height = `${top.threshold}px`;
    el.style.cursor = "ns-resize";

    return el;
  }

  resize(rect: any, change_x: number, change_y: number): void {
    // Calculate the new height for the panel (prevent negative values)
    const new_height = Math.max(20, rect.height - change_y);

    // Only adjust top position if we're not at minimum height
    if (new_height > 20) {
      const new_top = rect.top + change_y;
      this.panel.top = new_top;
      this.panel.height = new_height;
    }
  }
}

// Bottom border region
class bottom extends horizontal_edge {
  create_edge(): HTMLElement {
    const el = document.createElement("div");

    // Position at bottom of panel
    el.style.bottom = "0";
    el.style.left = "0";
    el.style.right = "0";
    el.style.height = `${bottom.threshold}px`;
    el.style.cursor = "ns-resize";

    return el;
  }

  resize(rect: any, change_x: number, change_y: number): void {
    // Increase the height of the panel (with minimum size protection)
    const bottom_height = Math.max(20, rect.height + change_y);
    this.panel.height = bottom_height;
  }
}

// Left border region
class left extends vertical_edge {
  create_edge(): HTMLElement {
    const el = document.createElement("div");

    // Position at left of panel
    el.style.left = "0";
    el.style.top = "0";
    el.style.bottom = "0";
    el.style.width = `${left.threshold}px`;
    el.style.cursor = "ew-resize";

    return el;
  }

  resize(rect: any, change_x: number, change_y: number): void {
    // Calculate new width and left position (with minimum size protection)
    const new_width = Math.max(20, rect.width - change_x);

    // Only adjust position if we're not at minimum width
    if (new_width > 20) {
      const new_left = rect.left + change_x;
      this.panel.left = new_left;
      this.panel.width = new_width;
    }
  }
}

// Right border region
class right extends vertical_edge {
  create_edge(): HTMLElement {
    const el = document.createElement("div");

    // Position at right of panel
    el.style.right = "0";
    el.style.top = "0";
    el.style.bottom = "0";
    el.style.width = `${right.threshold}px`;
    el.style.cursor = "ew-resize";

    return el;
  }

  resize(rect: any, change_x: number, change_y: number): void {
    // Increase the width of the panel (with minimum size protection)
    const right_width = Math.max(20, rect.width + change_x);
    this.panel.width = right_width;
  }
}
