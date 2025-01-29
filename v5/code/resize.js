import { view } from "../../../schema/v/code/schema.js";
export class resizer extends view {
    constructor() {
        const parent = undefined;
        const options = {};
        super(parent, options);
    }
}
//
// Base Region Class (Abstract)
class region {
    type;
    cursor;
    panel;
    //
    // How close to border we consider "near" (in pixels)
    static threshold = 20;
    constructor(type, cursor, panel) {
        this.type = type;
        this.cursor = cursor;
        this.panel = panel;
    }
    //
    // Get current panel rect (updated on every check)
    get rect() {
        return this.panel.element.getBoundingClientRect();
    }
}
//
// Concrete Region Implementations
class top_border extends region {
    constructor(panel) {
        super("top", "ns-resize", panel);
    }
    contains(x, y) {
        const { top, left, right } = this.rect;
        return y >= top && y <= top + region.threshold && x >= left && x <= right;
    }
}
class bottom_border extends region {
    constructor(panel) {
        super("bottom", "ns-resize", panel);
    }
    contains(x, y) {
        const { bottom, left, right } = this.rect;
        return (y <= bottom && y >= bottom - region.threshold && x >= left && x <= right);
    }
}
class left_border extends region {
    constructor(panel) {
        super("left", "ew-resize", panel);
    }
    contains(x, y) {
        const { left, top, bottom } = this.rect;
        return x >= left && x <= left + region.threshold && y >= top && y <= bottom;
    }
}
class right_border extends region {
    constructor(panel) {
        super("right", "ew-resize", panel);
    }
    contains(x, y) {
        const { right, top, bottom } = this.rect;
        return (x <= right && x >= right - region.threshold && y >= top && y <= bottom);
    }
}
//
// Updated Panel Class
export class panel extends view {
    //
    // Track all border regions
    regions;
    //
    // the element that is being resized
    element;
    constructor(element, parent, options) {
        super(parent, options);
        this.element = element;
        // Initialize regions
        this.regions = [
            new top_border(this),
            new bottom_border(this),
            new left_border(this),
            new right_border(this),
        ];
        // Add mousemove event listener
        this.element.addEventListener("mousemove", (evt) => this.detect_border(evt));
    }
    //
    // Detect which region contains the mouse
    detect_border(evt) {
        const { clientX: x, clientY: y } = evt;
        // Check regions in priority order (top before left, etc.)
        for (const region of this.regions) {
            if (region.contains(x, y)) {
                document.body.style.cursor = region.cursor;
                return region.type;
            }
        }
        // No region found
        document.body.style.cursor = "default";
        return undefined;
    }
}
class school extends panel {
}
class student extends panel {
}
class student_class extends panel {
}
class stream extends panel {
}
class year extends panel {
}
