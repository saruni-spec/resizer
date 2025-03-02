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

type resize_state = {
  is_resizing: boolean;
  current_panel: HTMLElement | null;
  current_border: string | null;
  start_x: number;
  start_y: number;
  start_width: number;
  start_height: number;
  start_left: number; // Added to track initial position
  start_top: number; // Added to track initial position
};

export class resizer extends view {
  public sections: panel_dimensions;
  private static min_dimensions = 50;
  private static threshold = 20;
  private border?: region;
  private resize_state: resize_state;

  constructor(public panel: HTMLElement) {
    super();
    this.sections = panel.getBoundingClientRect();
    this.resize_state = {
      is_resizing: false,
      current_panel: null,
      current_border: null,
      start_x: 0,
      start_y: 0,
      start_width: 0,
      start_height: 0,
      start_left: 0,
      start_top: 0,
    };
    this.add_event_listeners();
  }

  public add_event_listeners(): void {
    const doc = this.document;
    doc.onmousemove = (evt) => this.on_mouse_move(evt);
    doc.onmousedown = (evt) => this.on_mouse_down(evt, this.border, this.panel);
    doc.onmouseup = () => this.on_mouse_up();
  }

  private detect_border(evt: MouseEvent): region | undefined {
    const rect: DOMRect = this.panel.getBoundingClientRect();
    const left = Math.abs(rect.left - evt.clientX);
    const top = Math.abs(rect.top - evt.clientY);
    const right = Math.abs(rect.right - evt.clientX);
    const bottom = Math.abs(rect.bottom - evt.clientY);

    const body = this.document.body;

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

  private on_mouse_move(evt: MouseEvent): void {
    evt.preventDefault();
    this.detect_border(evt);

    if (!this.resize_state.is_resizing) {
      return;
    }

    this.handle_resize(evt, this.resize_state);
  }

  // Update the on_mouse_down method to capture computed style.left and style.top
  private on_mouse_down(
    evt: MouseEvent,
    border: region | undefined,
    panel: HTMLElement
  ): void {
    if (!border) {
      return;
    }
    //
    // the values of an element's CSS properties
    const computedStyle = window.getComputedStyle(panel);
    console.log(computedStyle);
    //
    // Get the panels state when you begin resizing
    this.resize_state.is_resizing = true;
    //
    // the panel being resized
    this.resize_state.current_panel = panel;
    //
    // the border
    this.resize_state.current_border = border;
    //
    // the mouse positions when resize starts
    this.resize_state.start_x = evt.clientX;
    this.resize_state.start_y = evt.clientY;
    //
    //the panels width and height
    this.resize_state.start_width = panel.offsetWidth;
    this.resize_state.start_height = panel.offsetHeight;
    //
    // the panels top and left positions
    this.resize_state.start_left = parseInt(computedStyle.left, 10) || 0;
    this.resize_state.start_top = parseInt(computedStyle.top, 10) || 0;
  }

  //
  // Resize the panel in diffrent directions on mouse move
  private handle_resize(e: MouseEvent, panel_state: resize_state): void {
    //
    // Right side resizing
    if (panel_state.current_border === "right") {
      //
      // Increase the panels width based on the mouse change distance
      const width = panel_state.start_width + (e.clientX - panel_state.start_x);
      this.panel.style.width = `${Math.max(resizer.min_dimensions, width)}px`;
    }
    //
    // Handle resizing the left border
    if (panel_state.current_border === "left") {
      //
      // Get the change in mouse position
      const delta = e.clientX - panel_state.start_x;
      //
      // Calculate the new width
      const newWidth = Math.max(
        resizer.min_dimensions,
        panel_state.start_width - delta
      );
      //
      // Calculate the new left position from its computed style position and the change in mouse position
      const newLeft = panel_state.start_left + delta;
      //
      // Resize the panel if the new width is greater than the minimum dimensions
      if (newWidth >= resizer.min_dimensions) {
        this.panel.style.left = `${newLeft}px`;
        this.panel.style.width = `${newWidth}px`;
      }
    }

    if (panel_state.current_border === "bottom") {
      const height =
        panel_state.start_height + (e.clientY - panel_state.start_y);
      this.panel.style.height = `${Math.max(resizer.min_dimensions, height)}px`;
    }

    if (panel_state.current_border === "top") {
      const delta = e.clientY - panel_state.start_y;
      const newHeight = Math.max(
        resizer.min_dimensions,
        panel_state.start_height - delta
      );
      const newTop = panel_state.start_top + delta;

      if (newHeight >= resizer.min_dimensions) {
        this.panel.style.top = `${newTop}px`;
        this.panel.style.height = `${newHeight}px`;
      }
    }
  }
  private on_mouse_up(): void {
    this.resize_state.is_resizing = false;
    this.resize_state.current_panel = null;
    this.resize_state.current_border = null;
  }
}

type region = "top" | "left" | "bottom" | "right";
