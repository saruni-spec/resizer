//
// Making HTML elements resizable through border dragging
// This allows for dynamic resizing of div elements by dragging their borders
// while maintaining size constraints and handling parent container boundaries
//
export class resizable_grids {
    static min_size = 20;
    static directions = ["top", "right", "bottom", "left"];
    static border_threshold = 10; // Pixels from edge to detect as border
    #observer;
    constructor() {
        this.#observer = new MutationObserver(this.#handle_mutations.bind(this));
    }
    initialize() {
        this.#make_all_divs_resizable();
        this.#observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
    #min_size(element) {
        const childCount = Array.from(element.children).length;
        return childCount > 1
            ? (childCount + 2) * resizable_grids.min_size
            : resizable_grids.min_size;
    }
    #make_all_divs_resizable() {
        document.querySelectorAll("div").forEach((div) => {
            this.#make_resizable(div);
        });
    }
    #make_resizable(element) {
        if (element.dataset.resizable)
            return;
        element.dataset.resizable = "true";
        this.#ensure_position_style(element);
        const state = {
            is_resizing: false,
            direction: "",
            start_x: 0,
            start_y: 0,
            start_width: 0,
            start_height: 0,
        };
        this.#attach_listeners(element, state);
    }
    #detect_border(event, element) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const threshold = resizable_grids.border_threshold;
        // Check corners first (they take precedence)
        if (y < threshold && x < threshold)
            return "top-left";
        if (y < threshold && x > rect.width - threshold)
            return "top-right";
        if (y > rect.height - threshold && x < threshold)
            return "bottom-left";
        if (y > rect.height - threshold && x > rect.width - threshold)
            return "bottom-right";
        // Then check edges
        if (y < threshold)
            return "top";
        if (y > rect.height - threshold)
            return "bottom";
        if (x < threshold)
            return "left";
        if (x > rect.width - threshold)
            return "right";
        return "";
    }
    #attach_listeners(element, state) {
        const on_mouse_move = (event) => this.#handle_mouse_move(event, element, state);
        const on_mouse_up = () => this.#handle_mouse_up(state, on_mouse_move);
        // Mouse move for cursor change
        element.addEventListener("mousemove", (e) => {
            if (!state.is_resizing) {
                const border = this.#detect_border(e, element);
                this.#update_cursor(element, border);
            }
        });
        // Mouse leave to reset cursor
        element.addEventListener("mouseleave", () => {
            if (!state.is_resizing) {
                element.style.cursor = "default";
            }
        });
        // Mouse down to start resizing
        element.addEventListener("mousedown", (e) => {
            const border = this.#detect_border(e, element);
            if (border) {
                this.#handle_mouse_down(e, border, element, state, on_mouse_move, on_mouse_up);
            }
        });
    }
    #update_cursor(element, border) {
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
    #handle_mouse_down(event, border, element, state, onMouseMove, onMouseUp) {
        event.stopPropagation();
        state.is_resizing = true;
        state.direction = border;
        state.start_x = event.clientX;
        state.start_y = event.clientY;
        state.start_width = element.offsetWidth;
        state.start_height = element.offsetHeight;
        state.child_proportions = this.#capture_child_proportions(element);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }
    #handle_mouse_move(event, element, state) {
        if (!state.is_resizing)
            return;
        event.preventDefault();
        const { direction } = state;
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
        }
        else {
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
    #resize_right(event, element, state) {
        const { start_x: startX, start_width: startWidth } = state;
        //
        // Retrieve parent and element dimensions
        const parent_dimensions = element.parentElement?.getBoundingClientRect();
        const element_dimensions = element.getBoundingClientRect();
        if (!parent_dimensions)
            return;
        //
        // Calculate the maximum width allowed by the parent's right boundary
        const max_right = parent_dimensions.right - element_dimensions.left;
        //
        // Calculate how much the mouse has moved
        const delta = event.clientX - startX;
        //
        // Calculate the new width, constrained by minimum size and parent boundary
        const new_width = Math.min(max_right, Math.max(this.#min_size(element), startWidth + delta));
        //
        // Apply the new width to the element
        element.style.width = `${new_width}px`;
        // Update children sizes if proportions were captured
        if (state.child_proportions) {
            this.#update_children_sizes(element, state.child_proportions);
        }
    }
    #resize_bottom(event, element, state) {
        const { start_y: startY, start_height: startHeight } = state;
        // Retrieve parent and element dimensions
        const parent_dimensions = element.parentElement?.getBoundingClientRect();
        const element_dimensions = element.getBoundingClientRect();
        if (!parent_dimensions)
            return;
        // Calculate the maximum height allowed by the parent's bottom boundary
        const max_bottom = parent_dimensions.bottom - element_dimensions.top;
        // Calculate how much the mouse has moved
        const delta = event.clientY - startY;
        // Calculate the new height, constrained by minimum size and parent boundary
        const newHeight = Math.min(max_bottom, Math.max(this.#min_size(element), startHeight + delta));
        // Apply the new height to the element
        element.style.height = `${newHeight}px`;
        if (state.child_proportions) {
            this.#update_children_sizes(element, state.child_proportions);
        }
    }
    #resize_left(event, element, state) {
        const { start_x, start_width } = state;
        const parent_dimensions = element.parentElement?.getBoundingClientRect();
        if (!parent_dimensions)
            return;
        const delta = start_x - event.clientX;
        const rawWidth = start_width + delta;
        const leftOffset = element.offsetLeft;
        const usableWidth = parent_dimensions.width - leftOffset;
        // Clamp width
        const newWidth = Math.min(usableWidth, Math.max(this.#min_size(element), rawWidth));
        element.style.width = `${newWidth}px`;
        //
        if (state.child_proportions) {
            this.#update_children_sizes(element, state.child_proportions);
        }
    }
    // Example adjustment for #resize_top
    #resize_top(event, element, state) {
        const { start_y, start_height } = state;
        const parent_dimensions = element.parentElement?.getBoundingClientRect();
        if (!parent_dimensions)
            return;
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
    #capture_child_proportions(element) {
        const proportions = new Map();
        const children = Array.from(element.children);
        const parentWidth = element.offsetWidth;
        const parentHeight = element.offsetHeight;
        children.forEach((child) => {
            proportions.set(child, {
                widthPercent: (child.offsetWidth / parentWidth) * 100,
                heightPercent: (child.offsetHeight / parentHeight) * 100,
            });
        });
        return proportions;
    }
    #update_children_sizes(element, childProportions) {
        childProportions.forEach((proportions, child) => {
            const newWidth = (element.offsetWidth * proportions.widthPercent) / 100;
            const newHeight = (element.offsetHeight * proportions.heightPercent) / 100;
            child.style.width = `${Math.max(this.#min_size(child), newWidth)}px`;
            child.style.height = `${Math.max(this.#min_size(child), newHeight)}px`;
        });
    }
    #handle_mouse_up(state, onMouseMove) {
        state.is_resizing = false;
        state.direction = "";
        document.removeEventListener("mousemove", onMouseMove);
    }
    #handle_mutations(mutations) {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE &&
                    node.tagName === "DIV") {
                    this.#make_resizable(node);
                }
            });
        });
    }
    #ensure_position_style(element) {
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
    destroy() {
        this.#observer.disconnect();
    }
}
