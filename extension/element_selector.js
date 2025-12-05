// element_selector.js

const ElementSelector = {
    isActive: false,
    isPageParsed: false,
    hoveredElement: null,
    selectedElements: new Set(),
    mcpIdMap: new Map(),

    start() {
        if (this.isActive) return;
        this.clearSelections();
        this.isActive = true;
        document.body.classList.add('ai-sidebar-selecting');
        document.addEventListener('mousemove', this.onMouseMove, true);
        document.addEventListener('click', this.onClick, true);
        document.addEventListener('keydown', this.onKeyDown, true);
    },

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        document.body.classList.remove('ai-sidebar-selecting');
        this.clearHoverHighlight();
        document.removeEventListener('mousemove', this.onMouseMove, true);
        document.removeEventListener('click', this.onClick, true);
        document.removeEventListener('keydown', this.onKeyDown, true);
    },

    clearSelections() {
        this.selectedElements.forEach(el => el.classList.remove('ai-sidebar-selected-highlight'));
        this.selectedElements.clear();
        document.documentElement.classList.remove('ai-sidebar-page-highlight');
        this.isPageParsed = false;
    },
    
    parseEntirePage() {
        this.clearSelections();
        document.documentElement.classList.add('ai-sidebar-page-highlight');
        this.isPageParsed = true;
    },

    getNodesToParse() {
        return Array.from(this.selectedElements);
    },

    onMouseMove: (event) => {
        if (!ElementSelector.isActive) return;
        const target = event.target;
        if (target.id === 'ai-sidebar-context-overlay' || target.closest('#ai-sidebar-context-overlay') || target === ElementSelector.hoveredElement) {
            return;
        }
        ElementSelector.clearHoverHighlight();
        ElementSelector.hoveredElement = target;
        ElementSelector.hoveredElement.classList.add('ai-sidebar-hover-highlight');
    },

    onClick: (event) => {
        if (!ElementSelector.isActive) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const target = event.target;
        if (ElementSelector.selectedElements.has(target)) {
            target.classList.remove('ai-sidebar-selected-highlight');
            ElementSelector.selectedElements.delete(target);
        } else {
            target.classList.add('ai-sidebar-selected-highlight');
            ElementSelector.selectedElements.add(target);
        }
        return false;
    },

    onKeyDown: (event) => {
        if (ElementSelector.isActive && event.key === 'Escape') {
            ElementSelector.stop();
            browser.runtime.sendMessage({ type: 'SELECTION_STOPPED_BY_USER' });
        }
    },
    
    clearHoverHighlight() {
        if (ElementSelector.hoveredElement) {
            ElementSelector.hoveredElement.classList.remove('ai-sidebar-hover-highlight');
            ElementSelector.hoveredElement = null;
        }
    }
};