//
// Making HTML elements resizable through border dragging
// This allows for dynamic resizing of div elements by dragging their borders
// while maintaining size constraints and handling parent container boundaries
//
import { view } from "../../../schema/v/code/schema.js";
export class resizer extends view {
    //
    // List of elements managed by the Resizer class (HTMLElement[])
    // Currently, only one element
    box;
    //
    // Stores the border coordinates of each element
    // If multiple elements are managed, this should be an array(section[])
    sections;
    //
    // Threshold distance for detecting proximity to borders from mouse position
    static threshold = 20;
    constructor(element) {
        super();
        //
        // Assign elements to the box property
        this.box = element;
        //
        // Calculate initial border coordinates and store them in sections
        this.sections = element.getBoundingClientRect();
    }
    //
    // Detect which border or corner the mouse is near
    detect_border(e, element) {
        //
        // Get element's position and dimensions
        const rect = this.sections;
        //
        // Calculate mouse position relative to element
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const border_threshold = resizer.threshold;
        //
        // Check for corners
        if (x < border_threshold && y < border_threshold) {
            element.style.cursor = "nwse-resize";
            return "top-left corner";
        }
        if (x > rect.width - border_threshold &&
            x < rect.width + border_threshold &&
            y < border_threshold) {
            element.style.cursor = "nesw-resize";
            return "top-right corner";
        }
        if (x < border_threshold &&
            y > rect.height - border_threshold &&
            y < rect.height + border_threshold) {
            element.style.cursor = "nesw-resize";
            return "bottom-left corner";
        }
        if (x > rect.width - border_threshold &&
            x < rect.width + border_threshold &&
            y > rect.height - border_threshold &&
            y < rect.height + border_threshold) {
            element.style.cursor = "nwse-resize";
            return "bottom-right corner";
        }
        //
        // Check for edges
        if (Math.abs(y) < border_threshold) {
            element.style.cursor = "row-resize";
            return "top";
        }
        if (y > rect.height - border_threshold &&
            y < rect.height + border_threshold) {
            element.style.cursor = "row-resize";
            return "bottom";
        }
        if (Math.abs(x) < border_threshold) {
            element.style.cursor = "col-resize";
            return "left";
        }
        if (x > rect.width - border_threshold &&
            x < rect.width + border_threshold) {
            element.style.cursor = "col-resize";
            return "right";
        }
        //
        // Reset cursor and return null if no border is detected
        element.style.cursor = "default";
        return null;
    }
    //
    // Initialize event listeners for the elements
    initialize() {
        //
        // Handle mouse movement over the element
        this.on_mouse_move(this.box);
        //
        // Handle when the mouse is pressed down on the element
        //
    }
    on_mouse_move(element) {
        //
        //Attach the mouse move event to the body
        //
        // Handle mouse movement over the element
        document.addEventListener("mousemove", (e) => {
            this.detect_border(e, element);
        });
    }
    on_mouse_down(element) {
        //
        // Handle mouse leaving the element
        element.addEventListener("mouseleave", () => {
            //
            // Reset all border indicators and background
            element
                .querySelectorAll(".border-indicator")
                .forEach((border) => {
                border.style.opacity = "0";
            });
            element.style.background = "#3498db";
        });
    }
}
