import { view, view_options } from "../../../schema/v/code/schema.js";

/**
 * @author Moses Saruni <sarunimaina@gmail.com>
 * @copyright 2025 Mutall
 * @version 1.0.0 g
 * @since 1.0
 *
 * Adding resizable functionality to panels on a page.
 * This class manages the resizing behavior of a set of HTML elements (panels) within a container.
 */
export class resizer extends view {
  /**
   * @var Map<string, panel> The panels/sections on the grid.
   * Each panel is identified by its HTML element ID.
   */
  public panels: Map<string, panel>;

  /**
   * @var Map<string, Set<edge>> The clusters of edges.
   * Edges that should be resized together are grouped into clusters.
   */
  public clusters: Map<string, Set<edge>> = new Map();

  /**
   * @var number|undefined The viewport/container width.
   * Used in edge positioning.
   */
  public client_width?: number;

  /**
   * @var number|undefined The viewport/container height.
   * Used in edge positioning.
   */
  public client_height?: number;

  /**
   * @var number|undefined The viewport/container left offset.
   * Used in edge positioning.
   */
  public client_left?: number;

  /**
   * @var number|undefined The viewport/container top offset.
   * Used in edge positioning.
   */
  public client_top?: number;

  /**
   * @returns DOMRect The dimensions of the resize container.
   */
  get rect(): DOMRect {
    return this.container.getBoundingClientRect();
  }

  /**
   * Constructor for the resizer class.
   *
   * @param container The container for the panels. Defaults to the document body.
   * @param parent Optional parent view.
   * @param options Optional view options.
   */
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
    //
    //
    this.add_reset_button();
  }

  /**
   * Set the dimensions of the container.
   * Updates the `client_left`, `client_top`, `client_width`, and `client_height` properties based on the container element.
   */
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

  /**
   * Create the panel instances from the container's children.
   * Iterates through the children of the container, creates a `panel` instance for each,
   * and stores them in the `panels` map.
   */
  create_panels() {
    // Get the grid elements on the page
    const panels = Array.from(this.container.children);

    // Create the panels
    panels.forEach((curr_panel, index) => {
      //
      // if the panel has no id,add one for it
      if (!curr_panel.id) {
        curr_panel.id = `panel-${index}`;
      }
      //
      // add it to the panels map
      this.panels.set(
        curr_panel.id,
        new panel(curr_panel as HTMLElement, this)
      );
    });
  }

  /**
   * Put all the edges in a cluster.
   * This method identifies groups of connected edges that should be resized together.
   *
   * @returns Map<string, Set<edge>> A map where keys are cluster names and values are sets of edges in that cluster.
   */
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

  /**
   * Reset the grid to its initial layout.
   * Clears the saved dimensions for all panels from local storage.
   */
  clear_saved_panels() {
    this.panels.forEach((panel) => {
      panel.clear_saved_dimensions();
    });
  }

  /**
   * Add a button to the page to reset the layout.
   * This button clears the saved panel dimensions and reloads the page.
   */
  add_reset_button(): void {
    const btn = document.createElement("button");
    //
    // style the button
    btn.innerHTML = "🔄";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = "10000";
    //
    // Color scheme
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.width = "30px";
    btn.style.height = "30px";
    btn.style.cursor = "pointer";
    //
    // Shadow for depth
    btn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    //
    // Button visuals
    btn.style.fontSize = "20px";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    //
    // Transition for all effects
    btn.style.transition = "all 0.2s ease";
    //
    // Hover tiltle foe the button
    btn.title = "Reset panels to default layout";
    //
    // Hover effects
    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "scale(1.05)";
      //
      // Darker blue on hover
      btn.style.background = "#3498db";
    });
    //
    // Effects when no longer overing over the button
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
      btn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    });
    //
    // Reset the layout and reload the page when the button is clicked on
    btn.addEventListener("click", () => {
      // Clear storage
      this.clear_saved_panels();
      // Hard reset (reload page)
      window.location.reload();
      // Alternatively, soft reset without reload:
      // this.reset_panels_to_default();
    });
    //
    // Add the button to the body
    document.body.appendChild(btn);
  }
}

/**
 * Represents one of the grid sections on a page.
 * Each panel has edges that can be dragged to resize it.
 */
export class panel extends view {
  /**
   * @var string The key for storing a panel's dimensions in local storage.
   */
  public saved_dimensions: string;

  /**
   * @var Map<string, edge> The edges of a panel, i.e., its border regions.
   * Each edge is identified by its position (top, bottom, left, right).
   */
  public edges: Map<string, edge> = new Map();

  /**
   * @var number The minimum size of a panel in pixels.
   */
  public min_panel_size = 40;

  /**
   * @var edge|undefined The edge currently being resized.
   */
  public resizing_edge?: edge;

  /**
   * @var object The saved dimensions of the panel.
   * Includes top, left, height, and width.
   */
  public dimensions: {
    top: number;
    left: number;
    height: number;
    width: number;
  };

  /**
   * @returns boolean Whether the panel cannot be resized further due to reaching its minimum size.
   */
  get cant_resize(): boolean {
    return this.dimensions.width === this.min_panel_size;
  }

  /**
   * Constructor for the panel class.
   *
   * @param element The HTML element representing the panel.
   * @param parent The parent `resizer` instance.
   * @param options Optional view options.
   */
  constructor(
    public element: HTMLElement,
    parent: resizer,
    options?: view_options
  ) {
    super(parent, options);
    //
    // save the key for this panels dimesnions in local srtorage
    this.saved_dimensions = `saved dimensions key for ${this.element.id}`;
    //
    // Add relative positioning for proper region placement
    this.element.style.position = "relative";
    //
    // Set a minimum size for the panel
    this.element.style.minWidth = `${this.min_panel_size}px`;
    this.element.style.minHeight = `${this.min_panel_size}px`;
    //
    // Set the current dimensions of the panel
    // Check for any saved dimensions,if not,get the current default ones
    this.dimensions = this.check_saved_dimensions() ?? {
      //
      // use offset dimensions to get wisible dimensions of the element including padding,margin and borders
      height: this.element.offsetHeight,
      width: this.element.offsetWidth,
      top: 0,
      left: 0,
    };
    //
    // Set the border regions
    this.#get_regions();
    //
    // Add scroll listener to the panel element
    // To adjust edge positions when we scroll
    this.element.addEventListener("scroll", () => this.panel_scroll());
  }

  /**
   * Adjust edge positions when scrolling within the panel.
   */
  panel_scroll() {
    //
    //
    const scroll_left = this.element.scrollLeft;
    const scroll_top = this.element.scrollTop;
    //
    // Adjust the edges for the scroll
    this.edges.forEach((edge) =>
      edge.adjust_on_scroll(scroll_left, scroll_top)
    );
  }

  /**
   * Get the border regions of this panel with improved positioning.
   * Determines which edges of the panel should be resizable based on its position within the container and scrollbars.
   */
  #get_regions(): void {
    //
    //
    const threshold = edge.threshold;
    //
    // Get the panels dimensions to later compare them to the container
    const rect = this.element.getBoundingClientRect();
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
    if (edge_options.top) this.edges.set("top", new top(this));
    if (edge_options.bottom) this.edges.set("bottom", new bottom(this));
    if (edge_options.left) this.edges.set("left", new left(this));
    if (edge_options.right) this.edges.set("right", new right(this));
  }

  /**
   * Check for saved dimensions in local storage and apply them.
   *
   * @returns { top: number; left: number; height: number; width: number; } | undefined The saved dimensions if found, otherwise undefined.
   */
  check_saved_dimensions() {
    //
    // Checked for saved dimensions in local storage
    const saved_dimensions = localStorage.getItem(this.saved_dimensions);
    //
    //
    //
    if (saved_dimensions) {
      const dimensions = JSON.parse(saved_dimensions);

      // Make sure we have an ID for this panel
      const panelId = this.element.id || "panel-unknown";
      const this_panel: {
        top: number;
        left: number;
        height: number;
        width: number;
      } = dimensions[panelId];

      if (this_panel) {
        //
        // Apply the saved dimensions
        if (this_panel.top) this.element.style.top = `${this_panel.top}px`;
        if (this_panel.left) this.element.style.left = `${this_panel.left}px`;
        if (this_panel.height)
          this.element.style.height = `${this_panel.height}px`;
        if (this_panel.width)
          this.element.style.width = `${this_panel.width}px`;
      }
      return this_panel;
    }
  }

  /**
   * Clear the saved dimensions for this panel from local storage.
   */
  clear_saved_dimensions() {
    localStorage.removeItem(this.saved_dimensions);
  }

  /**
   * Set the width of the panel.
   *
   * @param width The new width in pixels.
   */
  set width(width: number) {
    this.element.style.width = `${width}px`;
  }

  /**
   * Set the height of the panel.
   *
   * @param height The new height in pixels.
   */
  set height(height: number) {
    this.element.style.height = `${height}px`;
  }

  /**
   * Set the top position of the panel.
   *
   * @param top The new top position in pixels.
   */
  set top(top: number) {
    this.element.style.top = `${top}px`;
  }

  /**
   * Set the left position of the panel.
   *
   * @param left The new left position in pixels.
   */
  set left(left: number) {
    this.element.style.left = `${left}px`;
  }
}

/**
 * Represents a border of a panel that allows resizing.
 * This is an abstract class that provides common functionality for all edge types.
 */
export abstract class edge {
  /**
   * @var number The threshold for edge detection in pixels.
   * How close the mouse needs to be to an edge to detect it for resizing.
   */
  static threshold = 5;

  /**
   * @var number How close edges need to be to be considered neighbors in pixels.
   */
  public closeness = 30;

  /**
   * @var HTMLElement The element representing the visual edge in the DOM.
   */
  public element: HTMLElement;

  /**
   * @var Array<number> | undefined The starting mouse position of a resize operation [clientX, clientY].
   */
  protected resize_start?: Array<number>;

  /**
   * @var "vertical" | "horizontal" The alignment of the edge.
   */
  public alignment: "vertical" | "horizontal" = "vertical";

  /**
   * @var Set<edge> | undefined The cluster this edge belongs to.
   * Edges in the same cluster are resized together.
   */
  public cluster?: Set<edge>;

  /**
   * @var Array<number> The initial scroll position of the panel [scrollLeft, scrollTop].
   * Used to adjust edge position during scrolling.
   */
  protected initial_scroll: Array<number> = [0, 0];

  /**
   * @returns DOMRect The dimensions of the edge element.
   */
  get rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }

  /**
   * @returns edge | undefined The edge opposite to the current edge.
   * This is an abstract getter that must be implemented by subclasses.
   */
  abstract get opposite_edge(): edge | undefined;

  /**
   * Constructor for the edge class.
   *
   * @param panel The `panel` instance this edge belongs to.
   */
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

  /**
   * Adjust the edge's position based on the panel's scroll.
   *
   * @param scroll_left The horizontal scroll amount.
   * @param scroll_top The vertical scroll amount.
   */
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

  /**
   * Handles the mouse down event on the edge.
   * Stores the initial mouse position and scroll position.
   *
   * @param e The MouseEvent object.
   */
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

  /**
   * Handles the mouse move event on the document.
   * Resizes the associated panel and other edges in the same cluster.
   *
   * @param e The MouseEvent object.
   */
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
      edge.resize(change_x, change_y);
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
          edge.resize(change_x, change_y);
        });
      }
    });
    //
    // Update the start position for the next move event
    this.resize_start = [e.clientX, e.clientY];
  }

  /**
   * Handles the mouse up event on the document.
   * Resets the `resize_start` property and triggers cluster recreation and dimension saving.
   */
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
      edge.save_dimensions_to_storage();
    });
  }

  /**
   * Save the new dimensions of the panel to local storage.
   */
  save_dimensions_to_storage() {
    const saved = localStorage.getItem(this.panel.saved_dimensions);
    let saved_obj: Record<
      string,
      {
        top: number;
        left: number;
        height: number;
        width: number;
      }
    > = {}; // Initialize with empty object

    if (saved) {
      try {
        saved_obj = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved dimensions", e);
        saved_obj = {};
      }
    }

    const panelId = this.panel.element.id || "panel-unknown";
    saved_obj[panelId] = this.panel.dimensions;

    localStorage.setItem(
      this.panel.saved_dimensions,
      JSON.stringify(saved_obj)
    );
  }

  /**
   * Provides visual feedback when the mouse enters the edge area.
   */
  #on_mouse_enter() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = "rgba(0, 120, 215, 0.5)";
      edge.element.style.transition = "background-color 0.2s ease";
    });
  }

  /**
   * Removes visual feedback when the mouse leaves the edge area.
   */
  #on_mouse_leave() {
    if (!this.cluster) return;
    this.cluster.forEach((edge) => {
      edge.element.style.backgroundColor = "transparent";
    });
  }

  /**
   * Find all connected edges to form a cluster.
   * This method recursively finds all edges that share a border with the current edge.
   *
   * @param cluster The set to store the connected edges.
   * @param all_edges An array containing all available edges.
   */
  get_neigbors(cluster: Set<edge>, all_edges: edge[]): void {
    //
    // Create a stack to store the edges we are checking
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
          stack.push(neighbor);
        }
      });
    }
  }

  /**
   * Find edges that are directly adjacent to the given edge.
   *
   * @param edge The edge to find neighbors for.
   * @param all_edges An array containing all available edges.
   * @returns Set<edge> A set of neighboring edges.
   */
  #immediate_neighbors(edge: edge, all_edges: edge[]): Set<edge> {
    //
    // Create a set to store the neighbors
    const neighbors = new Set<edge>();
    //
    // Get the type of the edge (vertical or horizontal)
    const type = edge.alignment;
    //
    // Filter edges of the same type (vertical/horizontal)
    const same_type_edges = all_edges.filter((e) => e.alignment === type);
    //
    // Check each edge for shared border
    same_type_edges.forEach((otherEdge) => {
      //
      // If the edges share a border, add the other edge to the neighbors set
      if (this.share_border(edge.rect, otherEdge.rect, type)) {
        neighbors.add(otherEdge);
      }
    });

    return neighbors;
  }

  /**
   * Abstract method to determine if resizing this edge increases the panel size.
   *
   * @param change_x The change in the x-axis.
   * @param change_y The change in the y-axis.
   * @returns boolean True if resizing increases the size, false otherwise.
   */
  abstract increases_size(change_x: number, change_y: number): boolean;

  /**
   * Abstract method to check if two edges share a border.
   *
   * @param rect1 The DOMRect of the first edge.
   * @param rect2 The DOMRect of the second edge.
   * @param alignment The alignment of the edges ("vertical" or "horizontal").
   * @returns boolean True if the edges share a border, false otherwise.
   */
  abstract share_border(
    rect1: DOMRect,
    rect2: DOMRect,
    alignment: "vertical" | "horizontal" | undefined
  ): boolean;

  /**
   * Abstract method to create the HTML element for the edge.
   *
   * @returns HTMLElement The created edge element.
   */
  abstract create_edge(): HTMLElement;

  /**
   * Abstract method to resize the associated panel based on the mouse movement.
   *
   * @param change_x The change in the x-axis.
   * @param change_y The change in the y-axis.
   */
  abstract resize(change_x: number, change_y: number): void;
}

/**
 * Base class for horizontal edges (top and bottom).
 */
export abstract class horizontal_edge extends edge {
  /**
   * @var "vertical" | "horizontal" The alignment of the edge.
   */
  public alignment: "vertical" | "horizontal" = "horizontal";

  /**
   * Check if two horizontal edges share a border.
   *
   * @param rect1 The DOMRect of the first edge.
   * @param rect2 The DOMRect of the second edge.
   * @param alignment The alignment of the edges (should be "horizontal").
   * @returns boolean True if the edges share a border, false otherwise.
   */
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
    //
    // Check if they overlap horizontally
    const horizontal_overlap =
      Math.max(rect1.left, rect2.left) < Math.min(rect1.right, rect2.right);

    return touching && horizontal_overlap;
  }
  //
  //
}

/**
 * Base class for vertical edges (left and right).
 */
export abstract class vertical_edge extends edge {
  /**
   * @var "vertical" | "horizontal" The alignment of the edge.
   */
  public alignment: "vertical" | "horizontal" = "vertical";

  /**
   * Check if two vertical edges share a border.
   *
   * @param rect1 The DOMRect of the first edge.
   * @param rect2 The DOMRect of the second edge.
   * @param alignment The alignment of the edges (should be "vertical").
   * @returns boolean True if the edges share a border, false otherwise.
   */
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

/**
 * Implementation for the top border region of a panel.
 */
export class top extends horizontal_edge {
  /**
   * @returns edge | undefined The bottom edge of the panel.
   */
  get opposite_edge(): edge | undefined {
    return this.panel.edges.get("bottom");
  }

  /**
   * Create the HTML element for the top edge.
   *
   * @returns HTMLElement The created div element for the top edge.
   */
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

  /**
   * Resize the panel when the top edge is dragged.
   *
   * @param change_x The change in the x-axis (not used for top edge).
   * @param change_y The change in the y-axis. Negative value increases height.
   */
  resize(change_x: number, change_y: number): void {
    //
    // Calculate the new height for the panel (prevent negative values)
    const new_height = this.panel.element.offsetHeight - change_y;

    const new_top = this.panel.dimensions.top + change_y;
    //
    // reposition the top
    this.panel.top = new_top;
    //
    // save the new top
    this.panel.dimensions.top = new_top;
    //
    // Only adjust height if we're not at minimum height,and the change increases the size
    if (
      this.panel.cant_resize &&
      !this.panel.resizing_edge?.increases_size(change_x, change_y)
    )
      return;
    //
    // adjust the panel height
    this.panel.height = new_height;
    //
    // save the new height
    this.panel.dimensions.height = new_height;
  }

  /**
   * Indicates if resizing this edge increases the panel's size.
   *
   * @param change_x The change in the x-axis.
   * @param change_y The change in the y-axis.
   * @returns boolean True if dragging upwards increases the height.
   */
  increases_size(change_x: number, change_y: number): boolean {
    return change_y < 0;
  }
}

/**
 * Implementation for the bottom border region of a panel.
 */
export class bottom extends horizontal_edge {
  /**
   * @returns edge | undefined The top edge of the panel.
   */
  get opposite_edge(): edge | undefined {
    return this.panel.edges.get("top");
  }

  /**
   * Create the HTML element for the bottom edge.
   *
   * @returns HTMLElement The created div element for the bottom edge.
   */
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

  /**
   * Resize the panel when the bottom edge is dragged.
   *
   * @param change_x The change in the x-axis (not used for bottom edge).
   * @param change_y The change in the y-axis. Positive value increases height.
   */
  resize(change_x: number, change_y: number): void {
    const new_height = this.panel.element.offsetHeight + change_y;

    if (
      this.panel.cant_resize &&
      !this.panel.resizing_edge?.increases_size(change_x, change_y)
    )
      return;
    //
    // adjust the panels height
    this.panel.height = new_height;
    //
    // save the new height
    this.panel.dimensions.height = new_height;
  }

  /**
   * Indicates if resizing this edge increases the panel's size.
   *
   * @param change_x The change in the x-axis.
   * @param change_y The change in the y-axis.
   * @returns boolean True if dragging downwards increases the height.
   */
  increases_size(change_x: number, change_y: number): boolean {
    return change_y > 0;
  }
}

/**
 * Implementation for the left border region of a panel.
 */
export class left extends vertical_edge {
  /**
   * @returns edge | undefined The right edge of the panel.
   */
  get opposite_edge(): edge | undefined {
    return this.panel.edges.get("right");
  }

  /**
   * Create the HTML element for the left edge.
   *
   * @returns HTMLElement The created div element for the left edge.
   */
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

  /**
   * Resize the panel when the left edge is dragged.
   *
   * @param change_x The change in the x-axis. Negative value increases width.
   * @param change_y The change in the y-axis (not used for left edge).
   */
  resize(change_x: number, change_y: number): void {
    //
    // Calculate new width and left position (with minimum size protection)
    const new_width = this.panel.element.offsetWidth - change_x;

    const new_left = this.panel.dimensions.left + change_x;
    //
    // adjust the panels left position
    this.panel.left = new_left;
    //
    // save the panels new left position
    this.panel.dimensions.left = new_left;
    //
    // Only adjust the width if we're not at minimum width and the change increases the size
    if (
      this.panel.cant_resize &&
      !this.panel.resizing_edge?.increases_size(change_x, change_y)
    )
      return;
    //
    // adjust the panels width
    this.panel.width = new_width;
    //
    // save the panels new width
    this.panel.dimensions.width = new_width;
  }

  /**
   * Indicates if resizing this edge increases the panel's size.
   *
   * @param change_x The change in the x-axis.
   * @param change_y The change in the y-axis.
   * @returns boolean True if dragging leftwards increases the width.
   */
  increases_size(change_x: number, change_y: number): boolean {
    return change_x < 0;
  }
}

/**
 * Implementation for the right border region of a panel.
 */
export class right extends vertical_edge {
  /**
   * @returns edge | undefined The left edge of the panel.
   */
  get opposite_edge(): edge | undefined {
    return this.panel.edges.get("left");
  }

  /**
   * Create the HTML element for the right edge.
   *
   * @returns HTMLElement The created div element for the right edge.
   */
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

  /**
   * Resize the panel when the right edge is dragged.
   *
   * @param change_x The change in the x-axis. Positive value increases width.
   * @param change_y The change in the y-axis (not used for right edge).
   */
  resize(change_x: number, change_y: number): void {
    const new_width = this.panel.element.offsetWidth + change_x;

    if (
      this.panel.cant_resize &&
      !this.panel.resizing_edge?.increases_size(change_x, change_y)
    )
      return;
    //
    // adjust the panels width
    this.panel.width = new_width;
    //
    // save the panels new width
    this.panel.dimensions.width = new_width;
  }

  /**
   * Indicates if resizing this edge increases the panel's size.
   *
   * @param change_x The change in the x-axis.
   * @param change_y The change in the y-axis.
   * @returns boolean True if dragging rightwards increases the width.
   */
  increases_size(change_x: number, change_y: number): boolean {
    return change_x > 0;
  }
}
