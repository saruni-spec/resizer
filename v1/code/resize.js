//
// Making HTML elements resizable through border dragging
// This allows for dynamic resizing of div elements by dragging their borders
// while maintaining size constraints and handling parent container boundaries
//
export class resizable_grids {
    //
    // Minimum allowed size for any resizable element...
    static min_size = 20;
    //
    // Valid directions for resizing operations
    static directions = ["top", "right", "bottom", "left"];
    //
    // MutationObserver instance to track DOM changes
    // Used to automatically make new divs resizable as they're added to the document
    #observer;
    constructor() {
        //
        // Initialize MutationObserver to watch for new div elements
        // Binds the mutation handler to maintain correct 'this' context
        // By binding, we ensure that 'this' refers to the resizable_grids instance
        this.#observer = new MutationObserver(this.#handle_mutations.bind(this));
    }
    //
    // Start the resizable functionality
    // Sets up initial elements and starts observing DOM changes
    initialize() {
        //
        // Make all existing div elements resizable
        this.#make_all_divs_resizable();
        //
        // Begin observing the document for DOM changes
        // Watches for both direct children and nested elements
        this.#observer.observe(document.body, {
            //
            // Watch for element additions/removals
            childList: true,
            //
            // Watch all descendants, not just direct children
            subtree: true,
        });
    }
    #min_size(element) {
        const nonBorderChildren = Array.from(element.children).filter((child) => !(child instanceof HTMLElement &&
            child.classList.contains("resize-border")));
        const childCount = nonBorderChildren.length;
        console.log(childCount);
        const min = childCount > 1
            ? (childCount + 2) * resizable_grids.min_size
            : resizable_grids.min_size;
        console.log(min);
        return min;
    }
    //
    // Makes all existing div elements in the document resizable
    // Excludes elements that are already resize borders
    #make_all_divs_resizable() {
        document.querySelectorAll("div").forEach((div) => {
            //
            // Skip if this is a resize border itself
            if (!div.classList.contains("resize-border")) {
                this.#make_resizable(div);
            }
        });
    }
    //
    // Transforms a single div element into a resizable element
    // Sets up all necessary event handlers and visual elements
    #make_resizable(element) {
        //
        // Prevent double initialization
        if (element.dataset.resizable)
            return;
        //
        // Mark element as resizable to prevent future re-initialization
        element.dataset.resizable = "true";
        //
        // Configure element styling for proper resize behavior
        this.#ensure_position_style(element);
        //
        // Create and attach resize handles to the element
        const borders = this.#create_borders(element);
        //
        // Initialize state object for tracking resize operations
        const state = {
            is_resizing: false,
            direction: "",
            start_x: 0,
            start_y: 0,
            start_width: 0,
            start_height: 0,
        };
        //
        // Set up all necessary event listeners for resize operations
        this.#attach_listeners(element, borders, state);
    }
    //
    // Creates and attaches resize border elements to the target element
    // Returns an object containing references to all border elements
    #create_borders(element) {
        const borders = {};
        //
        // Create border elements for each resize direction
        resizable_grids.directions.forEach((direction) => {
            const border = document.createElement("div");
            border.className = `resize-border ${direction}`;
            element.appendChild(border);
            borders[direction] = border;
        });
        return borders;
    }
    //
    // Sets up event listeners for resize operations
    // Handles mouse interactions for resize functionality
    #attach_listeners(element, borders, state) {
        //
        // Create event handler functions
        const on_mouse_move = (event) => this.#handle_mouse_move(event, element, state);
        const on_mouse_up = () => this.#handle_mouse_up(state, on_mouse_move);
        //
        // Attach mousedown listeners to each border
        resizable_grids.directions.forEach((direction) => {
            borders[direction].addEventListener("mousedown", (e) => this.#handle_mouse_down(e, direction, element, state, on_mouse_move, on_mouse_up));
        });
    }
    //
    // Handles the start of a resize operation
    // Initializes resize state and sets up document-level event listeners
    #handle_mouse_down(event, direction, element, state, onMouseMove, onMouseUp) {
        //
        // Prevent event bubbling
        // Stops the event from reaching parent elements
        event.stopPropagation();
        //
        // Initialize resize state
        // Store initial values for calculating new dimensions
        state.is_resizing = true;
        state.direction = direction;
        state.start_x = event.clientX;
        state.start_y = event.clientY;
        state.start_width = element.offsetWidth;
        state.start_height = element.offsetHeight;
        // Capture child proportions at the start of resize
        state.child_proportions = this.#capture_child_proportions(element);
        //
        // Add document-level event listeners for drag operations
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }
    //
    // Handles the resize operation during mouse movement
    // Calculates and applies new dimensions while respecting constraints
    #handle_mouse_move(event, element, state) {
        //
        // Exit early if resizing is not active
        if (!state.is_resizing)
            return;
        //
        // Prevent default browser behavior during resizing
        event.preventDefault();
        const { direction } = state;
        //
        // Delegate resizing logic based on the direction
        switch (direction) {
            case "right":
                this.#resize_right(event, element, state);
                break;
            case "bottom":
                this.#resize_bottom(event, element, state);
                break;
            case "left":
                this.#resize_left(event, element, state);
                break;
            case "top":
                this.#resize_top(event, element, state);
                break;
        }
    }
    // Store child proportions before resize
    #capture_child_proportions(element) {
        const proportions = new Map();
        const children = Array.from(element.children).filter((child) => child instanceof HTMLElement &&
            !child.classList.contains("resize-border"));
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
    // Update children sizes based on stored proportions
    #update_children_sizes(element, childProportions) {
        childProportions.forEach((proportions, child) => {
            const newWidth = (element.offsetWidth * proportions.widthPercent) / 100;
            const newHeight = (element.offsetHeight * proportions.heightPercent) / 100;
            // Ensure children don't become smaller than minimum size
            child.style.width = `${Math.max(this.#min_size(child), newWidth)}px`;
            child.style.height = `${Math.max(this.#min_size(child), newHeight)}px`;
        });
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
    // Handles the end of a resize operation
    // Cleans up event listeners and resets state
    #handle_mouse_up(state, onMouseMove) {
        state.is_resizing = false;
        state.direction = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", () => this.#handle_mouse_up(state, onMouseMove));
    }
    // Processes DOM mutations to handle dynamically added elements
    // Makes new div elements resizable automatically
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
    // Ensures proper CSS positioning and dimension styles
    // Required for resize operations to work correctly
    #ensure_position_style(element) {
        const computed_style = window.getComputedStyle(element);
        // Set relative positioning if not already positioned
        if (computed_style.position === "static") {
            element.style.position = "relative";
        }
        // Convert auto dimensions to explicit pixel values
        if (computed_style.width === "auto") {
            element.style.width = `${element.offsetWidth}px`;
        }
        if (computed_style.height === "auto") {
            element.style.height = `${element.offsetHeight}px`;
        }
        // Ensure explicit positioning values
        if (computed_style.top === "auto") {
            element.style.top = "0px";
        }
        if (computed_style.left === "auto") {
            element.style.left = "0px";
        }
    }
    // Cleanup method to remove observers and event listeners
    destroy() {
        this.#observer.disconnect();
        // Additional cleanup could be added here if needed
    }
}
