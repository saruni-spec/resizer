import { view, view_options } from "../../../schema/v/code/schema.js";
//
// Adding resizable functionality to panels on a page
// Modified resizer class to properly handle overflow
export class resizer extends view {
  //
  // the panels/sections on the grid
  public panels: Map<string, panel>;
  //

  //
  // The clusters of edges
  public clusters: Map<string, Set<edge>> = new Map();
  //
  // The viewport/container dimensions
  // To be used in edge positioning
  public client_width?: number;
  public client_height?: number;
  public client_left?: number;
  public client_top?: number;

  get rect(): DOMRect {
    return this.container.getBoundingClientRect();
  }

  constructor(
    //
    // The container for the panels
    public container: HTMLElement = document.body,
    //
    // View options
    parent?: view | undefined,
    options?: view_options | undefined
  ) {
    super(parent, options);
    this.panels = new Map();
    //
    // Set the dimensions of the container
    this.set_container_dimensions();
    //
    // Create the panels
    this.create_panels();

    // Add all edges to the all_edges map
    this.create_clusters();
  }
  //
  // Set container dimensions
  set_container_dimensions() {
    this.client_left = this.container.clientLeft;
    this.client_top = this.container.clientTop;

    if (this.container !== document.body) {
      this.client_width = this.container.clientWidth;
      this.client_height = this.container.clientHeight;
    } else {
      this.client_width = window.innerWidth;
      this.client_height = window.innerHeight;
    }
  }
  //
  // Create the panels
  create_panels() {
    // Get the grid elements on the page
    const panels = Array.from(this.container.children);

    // Create the panels
    panels.forEach((curr_panel, index) => {
      this.panels.set(
        curr_panel.id || `panel-${index}`,
        new panel(curr_panel as HTMLElement, this)
      );
    });
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
    //
    // Save the clusters to the resizer object
    this.clusters = clusters;
    return clusters;
  }
}

// An area on the grid
class panel extends view {
  //
  public saved_dimensions =
    "the dimensions saved on each resize foe each panel";
  //
  // The edges of a panel,ie its border regions
  public edges: Map<string, edge> = new Map();
  //
  // The minimum size of a panel
  public min_panel_size = 40;
  //
  // the edge currently being resized
  public resizing_edge?: edge;
  //
  // Get the dimensions of the panel
  get rect() {
    return this.element.getBoundingClientRect();
  }
  //
  // Get the dimensions of the panel from its latest css styling
  get computed_style() {
    const panel_styles = window.getComputedStyle(this.element);

    return {
      height: parseInt(panel_styles.height),
      width: parseInt(panel_styles.width),
      top: parseInt(panel_styles.top) || 0,
      left: parseInt(panel_styles.left) || 0,
    };
  }
  //
  // Check if the panel can be resized
  get cant_resize(): boolean {
    return this.computed_style.width === this.min_panel_size;
  }

  constructor(
    public element: HTMLElement,
    parent: resizer,
    options?: view_options
  ) {
    super(parent, options);
    //
    // Add relative positioning for proper region placement
    this.element.style.position = "relative";
    //
    // Set a minimum size for the panel
    this.element.style.minWidth = `${this.min_panel_size}px`;
    this.element.style.minHeight = `${this.min_panel_size}px`;
    //
    // Checked for saved dimensions in local storage
    const saved_dimensions = localStorage.getItem(this.saved_dimensions);
    //
    if (saved_dimensions) {
      try {
        const dimensions = JSON.parse(saved_dimensions);

        // Make sure we have an ID for this panel
        const panelId = this.element.id || "panel-unknown";
        const this_panel = dimensions[panelId];

        if (this_panel) {
          // Apply the saved dimensions
          if (this_panel.top) this.element.style.top = `${this_panel.top}px`;
          if (this_panel.left) this.element.style.left = `${this_panel.left}px`;
          if (this_panel.height)
            this.element.style.height = `${this_panel.height}px`;
          if (this_panel.width)
            this.element.style.width = `${this_panel.width}px`;
        }
      } catch (e) {
        console.error("Error loading saved dimensions", e);
      }
    }
    //
    // Add the border regions
    this.#get_regions();
    //
    // Add scroll listener to the panel element
    // To adjust edge positions when we scroll
    this.element.addEventListener("scroll", () => this.panel_scroll());
  }
  //
  // Adjust edge positions when we scroll on the panel
  panel_scroll() {
    //
    //
    const scrollLeft = this.element.scrollLeft;
    const scrollTop = this.element.scrollTop;
    //
    // Adjust the edges for the scroll
    this.edges.forEach((edge) => edge.adjust_on_scroll(scrollLeft, scrollTop));
  }
  //
  // Get the border regions of this panel with improved positioning
  // Modify the #get_regions method in the panel class
  #get_regions(): void {
    //
    //
    const threshold = edge.threshold;
    //
    // Get the panels dimensions to later compare them to the container
    const rect = this.rect;
    //
    // Get the conatiner dimensions
    const container = this.parent as resizer;
    //
    // Comapre the panels dimensions to the containers dimensions
    const panel_left = Math.round(rect.left - container.rect.left);
    const panel_top = Math.round(rect.top - container.rect.top);
    const panel_right = Math.round(panel_left + rect.width);
    const panel_bottom = Math.round(panel_top + rect.height);
    //
    // Check for scroll on the ponel
    const has_vertical_scroll =
      this.element.scrollHeight > this.element.clientHeight;
    const has_horizontal_scroll =
      this.element.scrollWidth > this.element.clientWidth;

    //
    // Check for the panels bounderies
    const edge_options: { [key: string]: boolean } = {
      top: panel_top > threshold,
      bottom: Math.abs(panel_bottom - container.client_height!) > threshold,
      left: panel_left > threshold,
      right: Math.abs(panel_right - container.client_width!) > threshold,
    };
    //
    // Check for scroll bar width and height
    const scroll_bar_width =
      this.element.offsetWidth - this.element.clientWidth;
    const scroll_bar_height =
      this.element.offsetHeight - this.element.clientHeight;
    //
    // Disable left/right resize if scrollbar is present near container edges
    // Disable top/bottom resize if scrollbar is present near container edges
    // Check for vertical scrollbars
    if (has_vertical_scroll) {
      //
      //
      if (panel_left <= threshold + scroll_bar_width) {
        edge_options.left = false;
      }
      if (
        panel_right >=
        container.client_width! - threshold - scroll_bar_width
      ) {
        edge_options.right = false;
      }
    }
    //
    // Check for horizontal scrollbars
    if (has_horizontal_scroll) {
      // Similar logic for horizontal scrollbars
      if (panel_top <= threshold + scroll_bar_height) {
        edge_options.top = false;
      }
      if (
        panel_bottom >=
        container.client_height! - threshold - scroll_bar_height
      ) {
        edge_options.bottom = false;
      }
    }
    //
    // Create the edges based on the edge_options
    //
    if (edge_options.top) this.edges.set("top", new top(this));
    if (edge_options.bottom) this.edges.set("bottom", new bottom(this));
    if (edge_options.left) this.edges.set("left", new left(this));
    if (edge_options.right) this.edges.set("right", new right(this));
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
// Represents a border of a panel
abstract class edge {
  //
  // The threshold for edge detection
  // How close we need to be to an edge to detect it
  static threshold = 5;
  //
  // how close edges need to be to be considered neighbors
  public closeness = 30;
  //
  // The element representing the edge
  public element: HTMLElement;
  //
  // The starting position of a resize operation
  protected resize_start?: Array<number>;
  //
  // The alignment of the edge (vertical or horizontal)
  public alignment: "vertical" | "horizontal" = "vertical";
  //
  // The cluster this edge belongs to
  public cluster?: Set<edge>;
  //
  // The initial scroll position of the panel
  // To adjust edge position for scroll
  protected initial_scroll: Array<number> = [0, 0];
  //
  // Get the dimensions of the edge
  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }
  //
  // Get the opposite edge of the current edge
  abstract get opposite_edge(): edge | undefined;

  constructor(public panel: panel) {
    //
    // Create an edge
    this.element = this.create_edge();
    //
    // Add this edge to the panel
    this.panel.element.appendChild(this.element);
    //
    // Style the edge
    this.element.style.position = "absolute";
    this.element.style.zIndex = "2";
    this.element.classList.add("edge");
    //
    // Add mouse event listeners with passive: false for better performance
    this.element.addEventListener(
      "mousedown",
      (evt: MouseEvent) => this.#on_mouse_down(evt),
      { passive: false }
    );
    //
    // Use document for mouse move and up to capture events outside the element
    document.addEventListener("mousemove", (evt: MouseEvent) =>
      this.#on_mouse_move(evt)
    );
    document.addEventListener("mouseup", () => this.#on_mouse_up());
    //
    // Visual feedback on hover
    this.element.addEventListener("mouseenter", () => this.#on_mouse_enter());
    //
    this.element.addEventListener("mouseleave", () => this.#on_mouse_leave());
  }
  //
  // Adjust edge position for scroll
  adjust_on_scroll(scroll_left: number, scroll_top: number): void {
    //
    // Different handling based on edge type
    if (this instanceof vertical_edge) {
      //
      // For vertical edges (left/right), adjust for horizontal scroll
      this.element.style.transform = `translateX(${scroll_left}px)`;
    } else if (this instanceof horizontal_edge) {
      //
      // For horizontal edges (top/bottom), adjust for vertical scroll
      this.element.style.transform = `translateY(${scroll_top}px)`;
    }
  }

  // Mouse down handler with proper scroll tracking
  #on_mouse_down(e: MouseEvent): void {
    //
    // PRevent the default behavior
    // Which is text selection
    e.preventDefault();
    //
    //Prevent the event from bubbling up the DOM tree
    // This prevents the panel from being dragged
    e.stopPropagation();
    //
    // Store the initial mouse position
    this.resize_start = [e.clientX, e.clientY];
    //
    // Store the initial scroll position
    this.initial_scroll = [
      this.panel.element.scrollLeft,
      this.panel.element.scrollTop,
    ];
  }

  // Mouse move handler with scroll compensation
  #on_mouse_move(e: MouseEvent): void {
    //
    // If resize hasn't started, do not resize
    if (!this.resize_start) return;
    //
    // Calculate the difference from the start position
    let change_x = e.clientX - this.resize_start[0];
    let change_y = e.clientY - this.resize_start[1];
    //
    // Resize all edges in the cluster
    if (!this.cluster) return;
    //
    //
    this.cluster.forEach((edge) => {
      //
      // Resize the edges in this cluster
      edge.resize(edge.panel.computed_style, change_x, change_y);
      //
      // Save the edge being resized
      edge.panel.resizing_edge = edge;
      //
      //
      // when we get to the panels min width or height,
      // We start resizing the opposite edge and all the same cluster
      // We will need to get the opposite edge (top/bottom or left/right)
      // and resize it
      if (edge.panel.cant_resize) {
        //
        const opposite_edge = edge.opposite_edge;
        //
        if (!opposite_edge) {
          change_x = 0;
          change_y = 0;
          return;
        }
        //
        // get its cluster and resize all edges in the cluster
        opposite_edge.cluster?.forEach((edge) => {
          //
          edge.resize(edge.panel.computed_style, change_x, change_y);
        });
      }
    });
    //
    // Update the start position for the next move event
    this.resize_start = [e.clientX, e.clientY];
  }
  //
  // Mouse up event handler
  #on_mouse_up(): void {
    if (!this.resize_start) return;
    //
    // Reset the resize_start property
    this.resize_start = undefined;
    //
    // Recreate clusters as panel dimensions have changed
    (this.panel.parent as resizer).create_clusters();
    //
    // Save the dimensions of the panel
    this.cluster?.forEach((edge) => {
      edge.save_new_dimensions();
    });
  }
  //
  // Save the panels current dimensions to local storage
  // new_left,new_width,new_height,new_top
  // Then, update the save_new_dimensions method in the edge class
  save_new_dimensions() {
    // Get existing saved dimensions or create a new object
    const saved = localStorage.getItem(this.panel.saved_dimensions);
    let saved_obj;

    if (saved) {
      try {
        saved_obj = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved dimensions", e);
        saved_obj = {};
      }
    }

    // Update or add this panel's dimensions
    saved_obj[this.panel.element.id] = this.panel.computed_style;

    // Save back to localStorage
    localStorage.setItem(
      this.panel.saved_dimensions,
      JSON.stringify(saved_obj)
    );
  }
  //
  // Visual feedback when hovering over edges
  #on_mouse_enter() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = "rgba(0, 120, 215, 0.5)";
      edge.element.style.transition = "background-color 0.2s ease";
    });
  }
  //
  // Remove visual feedback when leaving the edge
  #on_mouse_leave() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = "transparent";
    });
  }
  //
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
  //
  // Find edges that are directly adjacent
  #immediate_neighbors(edge: edge, all_edges: edge[]): Set<edge> {
    // Create a set to store the neighbors
    const neighbors = new Set<edge>();

    // Get the type of the edge (vertical or horizontal)
    const type = edge.alignment;

    // Filter edges of the same type (vertical/horizontal)
    const same_type_edges = all_edges.filter((e) => e.alignment === type);

    // Check each edge for shared border
    same_type_edges.forEach((otherEdge) => {
      // If the edges share a border, add the other edge to the neighbors set
      if (this.share_border(edge.rect, otherEdge.rect, type)) {
        neighbors.add(otherEdge);
      }
    });

    return neighbors;
  }
  // Add this method to the abstract edge class
  abstract increases_size(change_x: number, change_y: number): boolean;
  //
  // Check if two edges share a border
  abstract share_border(
    rect1: DOMRect,
    rect2: DOMRect,
    alignment: "vertical" | "horizontal" | undefined
  ): boolean;
  //
  // Abstract methods to be implemented by subclasses
  abstract create_edge(): HTMLElement;
  abstract resize(
    panel_dimesions: {
      height: number;
      width: number;
      top: number;
      left: number;
    },
    change_x: number,
    change_y: number
  ): void;
}

// Base class for horizontal edges (top and bottom)
abstract class horizontal_edge extends edge {
  public alignment: "vertical" | "horizontal" = "horizontal";

  // Check if two edges share a border (with better tolerance)
  share_border(
    rect1: DOMRect,
    rect2: DOMRect,
    alignment: "vertical" | "horizontal"
  ): boolean {
    if (!alignment) return false;
    //
    // Define the closeness threshold
    const closeness = this.closeness;
    //

    // For horizontal edges (top/bottom borders)

    // Check if edges are close enough vertically
    const touching =
      Math.abs(rect1.bottom - rect2.top) < closeness ||
      Math.abs(rect2.bottom - rect1.top) < closeness;

    // Check if they overlap horizontally
    const horizontal_overlap =
      Math.max(rect1.left, rect2.left) < Math.min(rect1.right, rect2.right);

    return touching && horizontal_overlap;
  }
  //
  //
}

// Base class for vertical edges (left and right)
abstract class vertical_edge extends edge {
  public alignment: "vertical" | "horizontal" = "vertical";

  // Check if two edges share a border (with better tolerance)
  share_border(
    rect1: DOMRect,
    rect2: DOMRect,
    alignment: "vertical" | "horizontal"
  ): boolean {
    if (!alignment) return false;
    //
    // Define the closeness threshold
    const closeness = this.closeness;
    //
    // Check if edges are close enough horizontally
    const touching =
      Math.abs(rect1.right - rect2.left) < closeness ||
      Math.abs(rect2.right - rect1.left) < closeness;
    //
    // Check if they overlap vertically
    const vertical_overlap =
      Math.max(rect1.top, rect2.top) < Math.min(rect1.bottom, rect2.bottom);

    return touching && vertical_overlap;
  }
}
//
// Top border region implementation
class top extends horizontal_edge {
  get opposite_edge(): edge | undefined {
    return this.panel.edges.get("bottom");
  }

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

  resize(
    rect: {
      height: number;
      width: number;
      top: number;
      left: number;
    },
    change_x: number,
    change_y: number
  ): void {
    //
    // Calculate the new height for the panel (prevent negative values)
    const new_height = this.panel.element.offsetHeight - change_y;

    const new_top = rect.top + change_y;
    this.panel.top = new_top;
    //
    // Only adjust height if we're not at minimum height,and the change increases the size
    if (
      this.panel.cant_resize &&
      !this.panel.resizing_edge?.increases_size(change_x, change_y)
    )
      return;
    this.panel.height = new_height;
  }
  //
  //
  increases_size(change_x: number, change_y: number): boolean {
    return change_y < 0;
  }
}

// Bottom border region
class bottom extends horizontal_edge {
  get opposite_edge(): edge | undefined {
    return this.panel.edges.get("top");
  }

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
  //
  // Resize the panel
  resize(
    rect: {
      height: number;
      width: number;
      top: number;
      left: number;
    },
    change_x: number,
    change_y: number
  ): void {
    const currentOffsetHeight = this.panel.element.offsetHeight;
    const newOffsetHeight = currentOffsetHeight + change_y;

    if (
      this.panel.cant_resize &&
      !this.panel.resizing_edge?.increases_size(change_x, change_y)
    )
      return;
    this.panel.height = newOffsetHeight;
  }
  //
  //
  increases_size(change_x: number, change_y: number): boolean {
    return change_y > 0;
  }
}
//
// Left border region
class left extends vertical_edge {
  get opposite_edge(): edge | undefined {
    return this.panel.edges.get("right");
  }

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
  //
  resize(
    rect: {
      height: number;
      width: number;
      top: number;
      left: number;
    },
    change_x: number,
    change_y: number
  ): void {
    //
    // Calculate new width and left position (with minimum size protection)
    const new_width = this.panel.element.offsetWidth - change_x;

    const new_left = rect.left + change_x;
    this.panel.left = new_left;
    //
    // Only adjust the width if we're not at minimum width and the change increases the size
    if (
      this.panel.cant_resize &&
      !this.panel.resizing_edge?.increases_size(change_x, change_y)
    )
      return;
    this.panel.width = new_width;
  }
  //
  //
  increases_size(change_x: number, change_y: number): boolean {
    return change_x < 0;
  }
}
//
// Right border region
class right extends vertical_edge {
  get opposite_edge(): edge | undefined {
    return this.panel.edges.get("left");
  }

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
  //
  // Resize the panel
  resize(
    rect: {
      height: number;
      width: number;
      top: number;
      left: number;
    },
    change_x: number,
    change_y: number
  ): void {
    const current_offset_width = this.panel.element.offsetWidth;
    const new_offset_width = current_offset_width + change_x;

    if (
      this.panel.cant_resize &&
      !this.panel.resizing_edge?.increases_size(change_x, change_y)
    )
      return;
    this.panel.width = new_offset_width;
  }
  //
  //
  increases_size(change_x: number, change_y: number): boolean {
    return change_x > 0;
  }
}
