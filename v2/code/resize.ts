import { view, options } from "../../../schema/v/code/schema.js";

export class resizer extends view {
  constructor() {
    const parent: view | undefined = undefined;
    const options: options = {};
    super(parent, options);
  }
}
//
// The diffrent border types we are checking for
type border_type = "top" | "bottom" | "left" | "right";
type cursor_type = "ns-resize" | "ew-resize";
//
// The resion class which represents a border region
abstract class region {
  //
  // How close to border we want to be to trigger resize
  public static threshold = 20;

  constructor(
    public readonly type: border_type,
    public readonly cursor: cursor_type,
    public panel: panel
  ) {}

  //
  // Check if point is within this region
  abstract check(rect: DOMRect): boolean;

  //
  // Get current panel rect (updated on every check)
  protected get rect(): DOMRect {
    return this.panel.element.getBoundingClientRect();
  }
}

//
// Define the border regions
class top_border extends region {
  constructor(panel: panel) {
    super("top", "ns-resize", panel);
  }

  check(rect: DOMRect): boolean {}
}

class bottom_border extends region {
  constructor(panel: panel) {
    super("bottom", "ns-resize", panel);
  }

  check(rect: DOMRect): boolean {}
}

class left_border extends region {
  constructor(panel: panel) {
    super("left", "ew-resize", panel);
  }

  check(rect: DOMRect): boolean {}
}

class right_border extends region {
  constructor(panel: panel) {
    super("right", "ew-resize", panel);
  }

  check(rect: DOMRect): boolean {}
}

//
// Updated Panel Class
export abstract class panel extends view {
  //
  // Track all border regions
  public regions: region[];
  //
  // the element that is being resized
  public element: HTMLElement;

  constructor(parent?: view, options?: options) {
    super(parent, options);

    // Initialize regions
    this.regions = [
      new top_border(this),
      new bottom_border(this),
      new left_border(this),
      new right_border(this),
    ];

    // Add mousemove event listener
    this.element.addEventListener("mousemove", (evt) =>
      this.detect_border(evt)
    );
  }
  get_rect(): DOMRect {
    return this.element.getBoundingClientRect();
  }

  //
  // Detect which region contains the mouse
  detect_border(evt: MouseEvent): border_type | undefined {
    const { clientX: x, clientY: y } = evt;

    // Check regions in priority order (top before left, etc.)
    for (const region of this.regions) {
      if (region.check(this.get_rect())) {
        document.body.style.cursor = region.cursor;
        return region.type;
      }
    }

    // No region found
    document.body.style.cursor = "default";
  }
}
class school extends panel {}
class student extends panel {}

class student_class extends panel {}
class stream extends panel {}

class year extends panel {}
