//
// Making HTML elements resizable through border dragging
// This allows for dynamic resizing of div elements by dragging their borders
// while maintaining size constraints and handling parent container boundaries
//

// Interface defining the structure of resize border elements
// Each resizable element has four borders that can be dragged
type resize_state = {
  is_resizing: boolean;
  direction: string;
  start_x: number;
  start_y: number;
  start_width: number;
  start_height: number;
  child_proportions?: Map<
    HTMLElement,
    { widthPercent: number; heightPercent: number }
  >;
};

export class resizable_grids {
  static readonly min_size = 20;
  static readonly directions = ["top", "right", "bottom", "left"] as const;
  // Pixels from edge to detect as border
  static readonly border_threshold = 10;
  #observer: MutationObserver;

  constructor() {
    this.#observer = new MutationObserver(this.#handle_mutations.bind(this));
  }

  public initialize(): void {
    //
    // Make all divs resizable
    this.#make_all_divs_resizable();
    //
    // Observe the body for new divs
    // This allows for dynamically resizable divs
    this.#observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  //
  // Calculates the minimum size of an element
  // Usefull for divs with multiple children
  #min_size(element: HTMLElement): number {
    const childCount = Array.from(element.children).length;
    return childCount > 1
      ? (childCount + 2) * resizable_grids.min_size
      : resizable_grids.min_size;
  }
  //
  // Makes all divs resizable
  #make_all_divs_resizable(): void {
    document.querySelectorAll("div").forEach((div) => {
      this.#make_resizable(div as HTMLDivElement);
    });
  }
  //
  // Makes a div resizable
  #make_resizable(element: HTMLDivElement): void {
    if (element.dataset.resizable) return;
    //
    // Set the element as resizable
    element.dataset.resizable = "true";
    //
    // Ensure the element has a position style
    this.#ensure_position_style(element);
    //
    // Initialize the resize state
    const state: resize_state = {
      is_resizing: false,
      direction: "",
      start_x: 0,
      start_y: 0,
      start_width: 0,
      start_height: 0,
    };

    this.#attach_listeners(element, state);
  }

  #detect_border(event: MouseEvent, element: HTMLElement): string {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const threshold = resizable_grids.border_threshold;

    // Check corners first (they take precedence)
    if (y < threshold && x < threshold) return "top-left";
    if (y < threshold && x > rect.width - threshold) return "top-right";
    if (y > rect.height - threshold && x < threshold) return "bottom-left";
    if (y > rect.height - threshold && x > rect.width - threshold)
      return "bottom-right";

    // Then check edges
    if (y < threshold) return "top";
    if (y > rect.height - threshold) return "bottom";
    if (x < threshold) return "left";
    if (x > rect.width - threshold) return "right";

    return "";
  }
  //
  // Attaches event listeners to the element
  #attach_listeners(element: HTMLDivElement, state: resize_state): void {
    const on_mouse_move = (event: MouseEvent) =>
      this.#handle_mouse_move(event, element, state);
    const on_mouse_up = () => this.#handle_mouse_up(state, on_mouse_move);
    //
    // Mouse move for cursor change
    element.addEventListener("mousemove", (e: MouseEvent) => {
      if (!state.is_resizing) {
        const border = this.#detect_border(e, element);
        this.#update_cursor(element, border);
      }
    });
    //
    // Mouse leave to reset cursor
    element.addEventListener("mouseleave", () => {
      if (!state.is_resizing) {
        element.style.cursor = "default";
      }
    });
    //
    // Mouse down to start resizing
    element.addEventListener("mousedown", (e: MouseEvent) => {
      const border = this.#detect_border(e, element);
      if (border) {
        this.#handle_mouse_down(
          e,
          border,
          element,
          state,
          on_mouse_move,
          on_mouse_up
        );
      }
    });
  }
  //
  // Updates the cursor based on the border
  #update_cursor(element: HTMLElement, border: string): void {
    switch (border) {
      case "top":
      case "bottom":
        element.style.cursor = "ns-resize";
        break;
      case "left":
      case "right":
        element.style.cursor = "ew-resize";
        break;
      case "top-left":
      case "bottom-right":
        element.style.cursor = "nwse-resize";
        break;
      case "top-right":
      case "bottom-left":
        element.style.cursor = "nesw-resize";
        break;
      default:
        element.style.cursor = "default";
    }
  }
  //
  // When the mouse is pressed down on the element,
  // capture the initial state and start resizing
  #handle_mouse_down(
    event: MouseEvent,
    border: string,
    element: HTMLDivElement,
    state: resize_state,
    onMouseMove: (event: MouseEvent) => void,
    onMouseUp: () => void
  ): void {
    //
    // Prevent default behavior,which is text selection
    event.stopPropagation();
    //
    state.is_resizing = true;
    //
    // Capture the direction of the resize
    state.direction = border;
    //
    // Get the initial mouse position
    state.start_x = event.clientX;
    state.start_y = event.clientY;
    //
    // Capture the initial dimensions of the element
    state.start_width = element.offsetWidth;
    state.start_height = element.offsetHeight;
    //
    // Capture child proportions if the element has children
    state.child_proportions = this.#capture_child_proportions(element);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }
  //
  // When the mouse is moved, resize the element
  #handle_mouse_move(
    event: MouseEvent,
    element: HTMLDivElement,
    state: resize_state
  ): void {
    //
    // If not resizing, return
    if (!state.is_resizing) return;
    //
    // Prevent default behavior, which is text selection
    event.preventDefault();
    //
    // Resize the element based on the direction
    const { direction } = state;
    //
    // Handle corner cases
    if (direction.includes("-")) {
      const [vertical, horizontal] = direction.split("-");
      if (vertical === "top") {
        this.#resize_top(event, element, state);
      }
      if (vertical === "bottom") {
        this.#resize_bottom(event, element, state);
      }
      if (horizontal === "left") {
        this.#resize_left(event, element, state);
      }
      if (horizontal === "right") {
        this.#resize_right(event, element, state);
      }
    } else {
      // Handle single direction using switch statement instead of dynamic method calling
      switch (direction) {
        case "top":
          this.#resize_top(event, element, state);
          break;
        case "right":
          this.#resize_right(event, element, state);
          break;
        case "bottom":
          this.#resize_bottom(event, element, state);
          break;
        case "left":
          this.#resize_left(event, element, state);
          break;
      }
    }
  }

  #resize_right(
    event: MouseEvent,
    element: HTMLDivElement,
    state: resize_state
  ): void {
    const { start_x: startX, start_width: startWidth } = state;
    //
    // Retrieve parent and element dimensions
    const parent_dimensions = element.parentElement?.getBoundingClientRect();
    const element_dimensions = element.getBoundingClientRect();
    if (!parent_dimensions) return;
    //
    // Calculate the maximum width allowed by the parent's right boundary
    const max_right = parent_dimensions.right - element_dimensions.left;
    //
    // Calculate how much the mouse has moved
    const delta = event.clientX - startX;
    //
    // Calculate the new width, constrained by minimum size and parent boundary
    const new_width = Math.min(
      max_right,
      Math.max(this.#min_size(element), startWidth + delta)
    );
    //
    // Apply the new width to the element
    element.style.width = `${new_width}px`;
    // Update children sizes if proportions were captured
    if (state.child_proportions) {
      this.#update_children_sizes(element, state.child_proportions);
    }
  }

  #resize_bottom(
    event: MouseEvent,
    element: HTMLDivElement,
    state: resize_state
  ): void {
    const { start_y: startY, start_height: startHeight } = state;

    // Retrieve parent and element dimensions
    const parent_dimensions = element.parentElement?.getBoundingClientRect();
    const element_dimensions = element.getBoundingClientRect();
    if (!parent_dimensions) return;

    // Calculate the maximum height allowed by the parent's bottom boundary
    const max_bottom = parent_dimensions.bottom - element_dimensions.top;

    // Calculate how much the mouse has moved
    const delta = event.clientY - startY;

    // Calculate the new height, constrained by minimum size and parent boundary
    const newHeight = Math.min(
      max_bottom,
      Math.max(this.#min_size(element), startHeight + delta)
    );

    // Apply the new height to the element
    element.style.height = `${newHeight}px`;
    if (state.child_proportions) {
      this.#update_children_sizes(element, state.child_proportions);
    }
  }
  #resize_left(
    event: MouseEvent,
    element: HTMLDivElement,
    state: resize_state
  ): void {
    const { start_x, start_width } = state;
    const parent_dimensions = element.parentElement?.getBoundingClientRect();
    if (!parent_dimensions) return;

    const delta = start_x - event.clientX;
    const rawWidth = start_width + delta;
    const leftOffset = element.offsetLeft;
    const usableWidth = parent_dimensions.width - leftOffset;
    // Clamp width
    const newWidth = Math.min(
      usableWidth,
      Math.max(this.#min_size(element), rawWidth)
    );
    element.style.width = `${newWidth}px`;
    //
    if (state.child_proportions) {
      this.#update_children_sizes(element, state.child_proportions);
    }
  }

  // Example adjustment for #resize_top
  #resize_top(
    event: MouseEvent,
    element: HTMLDivElement,
    state: resize_state
  ): void {
    const { start_y, start_height } = state;
    const parent_dimensions = element.parentElement?.getBoundingClientRect();
    if (!parent_dimensions) return;

    // How far the mouse moved upwards
    const delta = start_y - event.clientY;
    // Calculate new height only
    const newHeight = Math.max(this.#min_size(element), start_height + delta);
    // Constrain within parent
    const maxHeight = element.offsetTop + element.offsetHeight;
    if (newHeight <= maxHeight) {
      element.style.height = `${newHeight}px`;
    }
    //
    if (state.child_proportions) {
      this.#update_children_sizes(element, state.child_proportions);
    }
  }
  //
  // Capture the proportions of the children
  #capture_child_proportions(
    element: HTMLDivElement
  ): Map<HTMLElement, { widthPercent: number; heightPercent: number }> {
    //
    // Create a map to store the proportions
    // The key is the child element and the value is an object with width and height percentages
    const proportions = new Map();
    const children = Array.from(element.children) as HTMLElement[];
    //
    // Calculate the parent dimensions
    const parent_width = element.offsetWidth;
    const parent_height = element.offsetHeight;

    children.forEach((child) => {
      proportions.set(child, {
        width_percent: (child.offsetWidth / parent_width) * 100,
        height_percent: (child.offsetHeight / parent_height) * 100,
      });
    });

    return proportions;
  }
  //
  // Update the sizes of the children based on the proportions
  #update_children_sizes(
    element: HTMLDivElement,
    childProportions: Map<
      HTMLElement,
      { widthPercent: number; heightPercent: number }
    >
  ): void {
    childProportions.forEach((proportions, child) => {
      const newWidth = (element.offsetWidth * proportions.widthPercent) / 100;
      const newHeight =
        (element.offsetHeight * proportions.heightPercent) / 100;
      child.style.width = `${Math.max(this.#min_size(child), newWidth)}px`;
      child.style.height = `${Math.max(this.#min_size(child), newHeight)}px`;
    });
  }

  #handle_mouse_up(
    state: resize_state,
    onMouseMove: (event: MouseEvent) => void
  ): void {
    state.is_resizing = false;
    state.direction = "";
    document.removeEventListener("mousemove", onMouseMove);
  }

  #handle_mutations(mutations: MutationRecord[]): void {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).tagName === "DIV"
        ) {
          this.#make_resizable(node as HTMLDivElement);
        }
      });
    });
  }

  #ensure_position_style(element: HTMLDivElement): void {
    const computed_style = window.getComputedStyle(element);

    if (computed_style.position === "static") {
      element.style.position = "relative";
    }

    if (computed_style.width === "auto") {
      element.style.width = `${element.offsetWidth}px`;
    }
    if (computed_style.height === "auto") {
      element.style.height = `${element.offsetHeight}px`;
    }
  }

  public destroy(): void {
    this.#observer.disconnect();
  }
}
