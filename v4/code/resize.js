import { view } from "../../../schema/v/code/schema.js";
export class resizer extends view {
    panel;
    //
    // Stores the border coordinates of the element
    sections;
    //
    // Minimum dimensions for the panel
    static min_dimensions = 50;
    //
    // Threshold distance for detecting proximity to borders from mouse position
    static threshold = 20;
    //
    // Current border
    border;
    //
    // Stores the current state of resizing operations
    resize_state;
    constructor(panel) {
        super();
        this.panel = panel;
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
    add_event_listeners() {
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
    detect_border(evt) {
        //
        // Get element's position and dimensions
        const rect = this.panel.getBoundingClientRect();
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
    on_mouse_move(evt) {
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
    on_mouse_down(evt, border, panel) {
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
    handle_resize(e, state) {
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
    on_mouse_up() {
        this.resize_state.is_resizing = false;
        this.resize_state.current_panel = null;
        this.resize_state.current_border = null;
    }
}
