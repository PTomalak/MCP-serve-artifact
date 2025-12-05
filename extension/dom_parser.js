// dom_parser.js

const DOMParser = {

    parseNodes(nodes) {
        const mcpIdMap = new Map();
        const counter = { value: 0 }; 

        // Each user-selected element is a distinct block.
        const representations = nodes.map(node => {
            if (!this.isVisibleNode(node)) return null;

            // 1. Build the full, detailed tree.
            const detailedTree = this.buildDetailedTree(node, counter, mcpIdMap);
            if (!detailedTree) return null;

            // 2. Generate the simplified "semantic string" from that tree.
            const simplifiedString = this.generateSimplifiedString(detailedTree);

            return {
                simplified: simplifiedString,
                detailed: detailedTree
            };
        }).filter(Boolean); // Filter out any null results

        ElementSelector.mcpIdMap = mcpIdMap;
        return representations;
    },

    // Build the detailed tree
    buildDetailedTree(node, counter, mcpIdMap) {
        if (node.nodeType === Node.TEXT_NODE) {
            return { role: 'text', value: node.textContent };
        }

        if (node.nodeType !== Node.ELEMENT_NODE || !this.isRelevantNode(node)) {
            return null;
        }

        const result = {
            role: this.getNodeRole(node),
            name: this.getBestNameForNode(node),
            attributes: {},
            children: []
        };
        
        if (this.isInteractive(node)) {
            counter.value++;
            const mcpId = `mcp-id-${counter.value}`;
            result.attributes['mcp_id'] = mcpId;
            // Capture the href for navigation
            if (node.href) {
                result.attributes['href'] = node.href;
            }
            mcpIdMap.set(mcpId, node);
        }

        // iterate over all childNodes to capture text and elements in order
        node.childNodes.forEach(child => {
            const childTree = this.buildDetailedTree(child, counter, mcpIdMap);
            if (childTree) {
                result.children.push(childTree);
            }
        });

        return result;
    },

    // generate simplified string from the detailed tree
    generateSimplifiedString(node) {
        if (!node) return '';
        if (node.role === 'text') return node.value;

        // If it has children, combine their simplified strings
        let innerContent = '';
        if (node.children && node.children.length > 0) {
            innerContent = node.children.map(child => this.generateSimplifiedString(child)).join('');
        }

        // Wrap interactive elements in "markdown"
        if (node.attributes.mcp_id) {
            const linkText = node.name || innerContent.trim();
            if (linkText) {
                return `[${linkText}](${node.attributes.mcp_id})`;
            }
        }
        
        return innerContent;
    },
    
    // Helpers
    getBestNameForNode(node) {
        // highest priority attribute
        let name = node.getAttribute('aria-label') || node.placeholder || node.title;
        if (name) return name.trim();

        // use alt text for images TODO: use PIL to extract and parse images to LLM
        if (node.tagName.toLowerCase() === 'img') return node.alt.trim();
        
        // for attribute as node ID
        if (node.id) {
            const label = document.querySelector(`label[for="${node.id}"]`);
            if (label && label.textContent) return label.textContent.trim();
        }

        const parentLabel = node.closest('label');
        if (parentLabel && parentLabel.textContent) return parentLabel.textContent.trim();

        let sibling = node.previousElementSibling || node.parentElement.previousElementSibling;
        if (sibling && sibling.textContent) {
            const text = sibling.textContent.trim();
            if (text.length > 0 && text.length < 100) {
                return text;
            }
        }

        // fallback for linked images
        const innerImg = node.querySelector('img');
        if (innerImg && innerImg.alt) return innerImg.alt.trim();
        
        return null;
    },
    
    isVisibleNode: (node) => node.nodeType === Node.ELEMENT_NODE ? window.getComputedStyle(node).display !== 'none' : true,
    isRelevantNode: (node) => !['script', 'style', 'noscript', 'meta', 'link'].includes(node.tagName?.toLowerCase()),
    isInteractive: (node) => ['a', 'button', 'input', 'select', 'textarea'].includes(node.tagName?.toLowerCase()),
    getNodeRole: (node) => node.tagName?.toLowerCase() || 'text'
};