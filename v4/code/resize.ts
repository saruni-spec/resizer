import { view } from "../../../schema/v/code/schema.js";

//
// The resizer class manages the resizing of
// HTML elements through border dragging
//
// The panel_dimensions type stores the border coordinates
type panel_dimensions = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};
//
// Store the current state of resizing operations
type resize_state = {
  is_resizing: boolean;
  current_panel: HTMLElement | null;
  current_border: string | null;
  start_x: number;
  start_y: number;
  start_width: number;
  start_height: number;
};

export class resizer extends view {
  //
  // Stores the border coordinates of the element
  public sections: panel_dimensions;
  //
  // Minimum dimensions for the panel
  private static min_dimensions = 50;
  //
  // Threshold distance for detecting proximity to borders from mouse position
  private static threshold = 20;
  //
  // Current border
  private border?: region;
  //
  // Stores the current state of resizing operations
  private resize_state: resize_state;

  constructor(public panel: HTMLElement) {
    super();
    //
    // Calculate initial border coordinates and store them
    this.sections = panel.getBoundingClientRect();
    //
    // Initialize resize state
    this.resize_state = {
      is_resizing: false,
      current_panel: null,
      current_border: null,
      start_x: 0,
      start_y: 0,
      start_width: 0,
      start_height: 0,
    };
    //
    // Add the event listeners
    this.add_event_listeners();
  }

  //
  // Initialize event listeners for the element
  public add_event_listeners(): void {
    const doc = this.document;
    //
    // Set up mouse movement tracking
    doc.onmousemove = (evt) => this.on_mouse_move(evt);
    //
    // Set up resize initiation
    doc.onmousedown = (evt) => this.on_mouse_down(evt, this.border, this.panel);
    //
    // Set up resize completion
    doc.onmouseup = () => this.on_mouse_up();
  }

  //
  // Detect which border or corner the mouse is near
  private detect_border(evt: MouseEvent): region | undefined {
    //
    // Get element's position and dimensions
    const rect: DOMRect = this.panel.getBoundingClientRect();
    //
    // Calculate distances from each border
    const left = Math.abs(rect.left - evt.clientX);
    const top = Math.abs(rect.top - evt.clientY);
    const right = Math.abs(rect.right - evt.clientX);
    const bottom = Math.abs(rect.bottom - evt.clientY);

    const body = this.document.body;

    //
    // Check for corners first
    if (left < resizer.threshold && top < resizer.threshold) {
      body.style.cursor = "nwse-resize";
      this.border = "top_left";
      return "top_left";
    }
    if (right < resizer.threshold && top < resizer.threshold) {
      body.style.cursor = "nesw-resize";
      this.border = "top_right";
      return "top_right";
    }
    if (left < resizer.threshold && bottom < resizer.threshold) {
      body.style.cursor = "nesw-resize";
      this.border = "bottom_left";
      return "bottom_left";
    }
    if (right < resizer.threshold && bottom < resizer.threshold) {
      body.style.cursor = "nwse-resize";
      this.border = "bottom_right";
      return "bottom_right";
    }

    //
    // Check edges
    if (top < resizer.threshold) {
      body.style.cursor = "ns-resize";
      this.border = "top";
      return "top";
    }
    if (bottom < resizer.threshold) {
      body.style.cursor = "ns-resize";
      this.border = "bottom";
      return "bottom";
    }
    if (left < resizer.threshold) {
      body.style.cursor = "ew-resize";
      this.border = "left";
      return "left";
    }
    if (right < resizer.threshold) {
      body.style.cursor = "ew-resize";
      this.border = "right";
      return "right";
    }

    this.border = undefined;
    body.style.cursor = "default";
  }
  //
  // Handle mouse movement for border detection and resizing
  private on_mouse_move(evt: MouseEvent): void {
    //
    // Prevent default behavior whixh is to select text
    evt.preventDefault();
    //
    //
    this.detect_border(evt);
    //
    // Check if the panel is currently being resized
    if (!this.resize_state.is_resizing) {
      return;
    }

    this.handle_resize(evt, this.resize_state);
  }
  //
  // Set up mouse down event for initiating resize
  private on_mouse_down(
    evt: MouseEvent,
    border: region | undefined,
    panel: HTMLElement
  ): void {
    if (!border) {
      return;
    }
    //
    // Handle when the mouse is pressed down on the element
    this.resize_state.is_resizing = true;
    this.resize_state.current_panel = panel;
    this.resize_state.current_border = border;
    this.resize_state.start_x = evt.clientX;
    this.resize_state.start_y = evt.clientY;
    this.resize_state.start_width = panel.offsetWidth;
    this.resize_state.start_height = panel.offsetHeight;
  }

  //
  // Handle the actual resizing calculations
  private handle_resize(e: MouseEvent, state: resize_state): void {
    //
    //
    if (state.current_border?.includes("right")) {
      const width = state.start_width + (e.clientX - state.start_x);
      this.panel.style.width = `${Math.max(resizer.min_dimensions, width)}px`;
    }

    if (state.current_border?.includes("left")) {
      const width = state.start_width - (e.clientX - state.start_x);
      this.panel.style.width = `${Math.max(resizer.min_dimensions, width)}px`;
    }

    if (state.current_border?.includes("bottom")) {
      const height = state.start_height + (e.clientY - state.start_y);
      this.panel.style.height = `${Math.max(resizer.min_dimensions, height)}px`;
    }

    if (state.current_border?.includes("top")) {
      const height = state.start_height - (e.clientY - state.start_y);
      this.panel.style.height = `${Math.max(resizer.min_dimensions, height)}px`;
    }
  }

  //
  // Set up mouse up event for completing resize
  private on_mouse_up(): void {
    this.resize_state.is_resizing = false;
    this.resize_state.current_panel = null;
    this.resize_state.current_border = null;
  }
}
//
// Defining the regions of the border
type region =
  | "top_left"
  | "top_right"
  | "top"
  | "left"
  | "bottom_left"
  | "bottom"
  | "bottom_right"
  | "right";
