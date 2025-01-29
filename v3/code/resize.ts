//
// Making HTML elements resizable through border dragging
// This allows for dynamic resizing of div elements by dragging their borders
// while maintaining size constraints and handling parent container boundaries
//
import { view } from "../../../schema/v/code/schema.js";
//
// The Resizer class manages the resizing of a list of HTML elements
type box_dimensions = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

export class resizer extends view {
  //
  // List of elements managed by the Resizer class (HTMLElement[])
  // Currently, only one element
  public panel: HTMLElement;
  //
  // Stores the border coordinates of each element
  // If multiple elements are managed, this should be an array(section[])
  public sections: box_dimensions;
  //
  // Threshold distance for detecting proximity to borders from mouse position
  private static threshold = 20;

  constructor(element: HTMLElement) {
    super();
    //
    // Assign elements to the box property
    this.panel = element;
    //
    // Calculate initial border coordinates and store them in sections
    this.sections = element.getBoundingClientRect();
  }
  //
  // Detect which border or corner the mouse is near
  private detect_border(e: MouseEvent, element: HTMLElement): string | null {
    //
    // Get element's position and dimensions
    const rect = this.sections;
    //
    // Distance from left border
    const left = Math.abs(rect.left - e.clientX);
    //
    // Distance from top border
    const top = Math.abs(rect.top - e.clientY);
    //
    // Distance from right border
    const right = Math.abs(rect.right - e.clientX);
    //
    // Distance from bottom border
    const bottom = Math.abs(rect.bottom - e.clientY);
    const border_threshold = resizer.threshold;
    //
    // Check for corners first
    if (left < border_threshold && top < border_threshold) {
      element.style.cursor = "nwse-resize";
      return "top-left";
    }
    if (right < border_threshold && top < border_threshold) {
      element.style.cursor = "nesw-resize";
      return "top-right";
    }
    if (left < border_threshold && bottom < border_threshold) {
      element.style.cursor = "nesw-resize";
      return "bottom-left";
    }
    if (right < border_threshold && bottom < border_threshold) {
      element.style.cursor = "nwse-resize";
      return "bottom-right";
    }
    //
    // Check edges
    if (top < border_threshold) {
      element.style.cursor = "row-resize";
      return "top";
    }
    if (bottom < border_threshold) {
      element.style.cursor = "ns-resize";
      return "bottom";
    }
    if (left < border_threshold) {
      element.style.cursor = "ew-resize";
      return "left";
    }
    if (right < border_threshold) {
      element.style.cursor = "ew-resize";
      return "right";
    }

    element.style.cursor = "default";
    return null;
  }
  //
  // Initialize event listeners for the elements
  initialize() {
    //
    // Handle mouse movement over the element
    this.on_mouse_move(this.panel);
    //
    // Handle when the mouse is pressed down on the element
    //
  }
  private on_mouse_move(element: HTMLElement) {
    //
    //Attach the mouse move event to the body
    //
    // Handle mouse movement over the element
    document.addEventListener("mousemove", (e: MouseEvent) => {
      this.detect_border(e, element);
    });
  }
  private add_mouse_down(panel: HTMLElement) {
    panel.addEventListener("mousedown", (e) => {
      const border = this.detect_border(e, panel);
      //
      //
      if (border) {
        this.#handle_mouse_down(
          e,
          border,
          panel,
          state,
          on_mouse_move,
          on_mouse_up
        );
      }
    });
  }
}
