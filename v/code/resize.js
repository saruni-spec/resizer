import { view } from "../../../schema/v/code/schema.js";
//
// Adding resizable funtinality to grids on a page
export class resizer extends view {
    //
    //A resizer has mulitple panels
    panels;
    //
    //
    constructor() {
        const parent = undefined;
        const options = {};
        super(parent, options);
        //
        // Add the panels
        this.panels = new Map();
        this.panels.set("school", new school(this));
        this.panels.set("student", new student(this));
        this.panels.set("class", new student_class(this));
        this.panels.set("stream", new stream(this));
        this.panels.set("year", new year(this));
    }
}
/// A panel is a resizable grid on a page
class panel extends view {
    panel_id;
    //
    // Store regions in a Map for direct access by border type
    // Key: border type as string ('top' | 'bottom' | 'left' | 'right')
    // Value: The region instance
    regions;
    //
    // The actual HTML element this panel represents
    element;
    constructor(panel_id, parent, options) {
        super(parent, options);
        this.panel_id = panel_id;
        this.element = this.create(panel_id);
        //
        // Initialize as Map instead of array
        this.regions = new Map();
        //
        // Get viewport size  (width and height)
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        //
        // Add the border regions
        this.get_regions(vw, vh);
        //
        // Add mousemove event listener to detect border regions
        this.element.addEventListener("mousemove", (evt) => this.detect_border(evt));
    }
    create(id) {
        const element = document.createElement("div");
        element.id = id;
        document.body.appendChild(element);
        return element;
    }
    //
    // Get the border regions of this panel
    get_regions(vw, vh) {
        const threshold = region.threshold;
        //
        const rect = this.element.getBoundingClientRect();
        // Add regions to the panel
        //
        // Only create borders that aren't at viewport edges
        // Top border: only if panel isn't touching viewport top
        if (rect.top > threshold)
            this.regions.set("top", new top(this));
        //
        // Bottom border: only if panel isn't touching viewport bottom
        if (rect.bottom < vh - threshold)
            this.regions.set("bottom", new bottom(this));
        //
        // Left border: only if panel isn't touching viewport left
        if (rect.left > threshold)
            this.regions.set("left", new left(this));
        //
        // Right border: only if panel isn't touching viewport right
        if (rect.right < vw - threshold)
            this.regions.set("right", new right(this));
    }
    //
    // Get the panel's current position and size
    get rect() {
        return this.element.getBoundingClientRect();
    }
    //
    // Detect which region contains the mouse
    detect_border(evt) {
        let cursor = "auto";
        //
        // Iterate through Map values in insertion order (top->bottom->left->right)
        for (const region of this.regions.values()) {
            if (region.check(evt)) {
                cursor = region.getCursorStyle();
                break;
            }
        }
        this.element.style.cursor = cursor;
    }
}
//
// Panel implementations for a school management page
export class school extends panel {
    constructor(parent, options) {
        super("school", parent, options);
    }
}
export class student extends panel {
    constructor(parent, options) {
        super("student", parent, options);
    }
}
export class student_class extends panel {
    constructor(parent, options) {
        super("class", parent, options);
    }
}
export class stream extends panel {
    constructor(parent, options) {
        super("stream", parent, options);
    }
}
export class year extends panel {
    constructor(parent, options) {
        super("year", parent, options);
    }
}
//
// Base class for all border regions
class region {
    panel;
    //
    // How many pixels from edge constitutes a border region
    static threshold = 20;
    //
    // Each region knows its parent panel
    constructor(panel) {
        this.panel = panel;
    }
}
//
// Top border region implementation
class top extends region {
    //
    // Checks if cursor is within top threshold
    check(evt) {
        //
        // Panel's current position
        const rect = this.panel.rect;
        //
        // Distance from top edge to cursor
        return evt.clientY - rect.top <= region.threshold;
    }
    //
    // Vertical resize cursor for top/bottom borders
    getCursorStyle() {
        return "ns-resize";
    }
}
//
// Bottom border region implementation
class bottom extends region {
    //
    // Checks if cursor is within bottom threshold
    check(evt) {
        const rect = this.panel.rect;
        //
        // Distance from cursor to bottom edge
        return rect.bottom - evt.clientY <= region.threshold;
    }
    getCursorStyle() {
        return "ns-resize";
    }
}
//
// Left border region implementation
class left extends region {
    //
    // Checks if cursor is within left threshold
    check(evt) {
        const rect = this.panel.rect;
        //
        // Distance from left edge to cursor
        return evt.clientX - rect.left <= region.threshold;
    }
    //
    // Horizontal resize cursor for left/right borders
    getCursorStyle() {
        return "ew-resize";
    }
}
//
// Right border region implementation
class right extends region {
    //
    // Checks if cursor is within right threshold
    check(evt) {
        const rect = this.panel.rect;
        //
        // Distance from cursor to right edge
        return rect.right - evt.clientX <= region.threshold;
    }
    getCursorStyle() {
        return "ew-resize";
    }
}
