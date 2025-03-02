import { view } from "../../../schema/v/code/schema.js";
//
// Adding resizable funtinality to grids on a page
export class resizer extends view {
    //
    //A resizer has mulitple panels
    panels;
    //
    //
    constructor(parent, options) {
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
    //
    // Store regions in a Map for direct access by border type
    // Key: border type as string ('top' | 'bottom' | 'left' | 'right')
    // Value: The region instance
    regions = new Map();
    //
    // The actual HTML element this panel represents
    element;
    constructor(panel_id, parent, options) {
        super(parent, options);
        this.element = this.create(panel_id);
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
    //
    // Create or get the panel element
    create(id) {
        const element = this.get_element(id);
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
        // Top border
        if (rect.top > threshold)
            this.regions.set("top", new top(this));
        //
        // Bottom border
        if (rect.bottom < vh - threshold)
            this.regions.set("bottom", new bottom(this));
        //
        // Left border
        if (rect.left > threshold)
            this.regions.set("left", new left(this));
        //
        // Right border
        if (rect.right < vw - threshold)
            this.regions.set("right", new right(this));
    }
    //
    // The panel's current position and size
    get rect() {
        return this.element.getBoundingClientRect();
    }
    //
    // Detect which region contains the mouse
    detect_border(evt) {
        let cursor = "auto";
        //
        // Iterate through Map values to check each region
        for (const region of this.regions.values()) {
            //
            // If cursor is within region, get the cursor style
            if (region.current(evt)) {
                cursor = region.cursor;
                break;
            }
        }
        //
        // Set the panles cusor style
        this.element.style.cursor = cursor;
    }
}
//
// Panel for a school management page
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
    // How many pixels from edge for a border region
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
    cursor = "ns-resize";
    //
    // Checks if cursor is within top threshold
    current(evt) {
        //
        // Panel's current position
        const rect = this.panel.rect;
        //
        // Distance from top edge to cursor
        return evt.clientY - rect.top <= region.threshold;
    }
}
//
// Bottom border region
class bottom extends region {
    cursor = "ns-resize";
    //
    // Checks if cursor is within bottom threshold
    current(evt) {
        const rect = this.panel.rect;
        //
        // Distance from cursor to bottom
        return rect.bottom - evt.clientY <= region.threshold;
    }
}
//implementation
class left extends region {
    cursor = "ew-resize";
    //
    // Checks if cursor is within left threshold
    current(evt) {
        const rect = this.panel.rect;
        //
        // Distance from left edge to cursor
        return evt.clientX - rect.left <= region.threshold;
    }
}
//
// Right border region implementation
class right extends region {
    cursor = "ew-resize";
    //
    // Checks if cursor is within right threshold
    current(evt) {
        const rect = this.panel.rect;
        //
        // Distance from cursor to right edge
        return rect.right - evt.clientX <= region.threshold;
    }
}
