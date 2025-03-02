import { view } from "../../../schema/v/code/schema.js";
export class resizer extends view {
    panel;
    sections;
    static min_dimensions = 50;
    static threshold = 20;
    border;
    resize_state;
    constructor(panel) {
        super();
        this.panel = panel;
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
    add_event_listeners() {
        const doc = this.document;
        doc.onmousemove = (evt) => this.on_mouse_move(evt);
        doc.onmousedown = (evt) => this.on_mouse_down(evt, this.border, this.panel);
        doc.onmouseup = () => this.on_mouse_up();
    }
    detect_border(evt) {
        const rect = this.panel.getBoundingClientRect();
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
    on_mouse_move(evt) {
        evt.preventDefault();
        this.detect_border(evt);
        if (!this.resize_state.is_resizing) {
            return;
        }
        this.handle_resize(evt, this.resize_state);
    }
    // Update the on_mouse_down method to capture computed style.left and style.top
    on_mouse_down(evt, border, panel) {
        if (!border) {
            return;
        }
        //
        // the final and  values of an element's CSS properties
        const computedStyle = window.getComputedStyle(panel);
        console.log(computedStyle);
        //
        //
        this.resize_state.is_resizing = true;
        this.resize_state.current_panel = panel;
        this.resize_state.current_border = border;
        this.resize_state.start_x = evt.clientX;
        this.resize_state.start_y = evt.clientY;
        this.resize_state.start_width = panel.offsetWidth;
        this.resize_state.start_height = panel.offsetHeight;
        this.resize_state.start_left = parseInt(computedStyle.left, 10) || 0;
        this.resize_state.start_top = parseInt(computedStyle.top, 10) || 0;
    }
    // Correct the handle_resize for left and top borders
    handle_resize(e, panel_state) {
        if (panel_state.current_border === "right") {
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
            const newWidth = Math.max(resizer.min_dimensions, panel_state.start_width - delta);
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
            const height = panel_state.start_height + (e.clientY - panel_state.start_y);
            this.panel.style.height = `${Math.max(resizer.min_dimensions, height)}px`;
        }
        if (panel_state.current_border === "top") {
            const delta = e.clientY - panel_state.start_y;
            const newHeight = Math.max(resizer.min_dimensions, panel_state.start_height - delta);
            const newTop = panel_state.start_top + delta;
            if (newHeight >= resizer.min_dimensions) {
                this.panel.style.top = `${newTop}px`;
                this.panel.style.height = `${newHeight}px`;
            }
        }
    }
    on_mouse_up() {
        this.resize_state.is_resizing = false;
        this.resize_state.current_panel = null;
        this.resize_state.current_border = null;
    }
}
