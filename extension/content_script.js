// content_script.js

function showOverlay(content) {
    const existingOverlay = document.getElementById('ai-sidebar-context-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    const overlay = document.createElement('div');
    overlay.id = 'ai-sidebar-context-overlay';
    
    overlay.innerHTML = content;

    document.body.appendChild(overlay);
}

function showActionPreviews(actions) {
    clearActionPreviews();
    const container = document.createElement('div');
    container.id = 'ai-sidebar-action-previews';
    document.body.appendChild(container);

    actions.forEach(action => {
        const targetNode = ElementSelector.mcpIdMap.get(action.mcp_id);
        if (!targetNode) return;

        const rect = targetNode.getBoundingClientRect();
        const previewEl = document.createElement('div');
        previewEl.className = 'ai-sidebar-action-preview-indicator';
        
        let actionText = '';
        if (action.action === 'fill_input') {
            actionText = `Fill with: "${action.value}"`;
        } else if (action.action === 'press_button') {
            actionText = 'Press Button';
        } else if (action.action === 'navigate') {
            actionText = `Follow Link: <span>${action.url}</span>`;
        }
        previewEl.innerHTML = actionText;
        previewEl.style.top = `${window.scrollY + rect.top - 30}px`;
        previewEl.style.left = `${window.scrollX + rect.left}px`;
        container.appendChild(previewEl);
    });
}
function clearActionPreviews() {
    document.getElementById('ai-sidebar-action-previews')?.remove();
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Helper to find a DOM node from an mcp_id
    const findNode = (mcpId) => ElementSelector.mcpIdMap.get(mcpId);

    const actionHandlers = {
        navigate: (action) => {
            if (action.url) window.location.href = action.url;
        },
        fill_input: (action) => {
            const node = findNode(action.mcp_id);
            if (!node) return;

            if (node.tagName === 'INPUT' && (node.type === 'radio' || node.type === 'checkbox')) {
                node.click();
            } else if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT') {
                node.value = action.value;
            } else {
                console.warn(`Attempted to fill non-input element with mcp_id: ${action.mcp_id}`);
            }
        },
        press_button: (action) => {
            const node = findNode(action.mcp_id);
            if (node) {
                node.click();
            }
        }
    };

    switch (message.type) {
        case 'SHOW_CONTEXT_OVERLAY':
            showOverlay(message.content);
            break;
        case 'START_SELECTION':
            ElementSelector.start();
            break;
        case 'STOP_SELECTION':
            ElementSelector.stop();
            break;
        case 'CLEAR_SELECTION':
            ElementSelector.clearSelections();
            break;
        case 'PARSE_ENTIRE_PAGE':
            ElementSelector.parseEntirePage();
            break;
        case 'GET_SELECTED_CONTENT':
            const nodes = ElementSelector.getNodesToParse(true);
            if (nodes && nodes.length > 0) {
                const parsedData = DOMParser.parseNodes(nodes);
                return Promise.resolve(parsedData);
            }
            if (ElementSelector.isPageParsed) {
                 const parsedData = DOMParser.parseNodes([document.body]);
                 return Promise.resolve(parsedData);
            }
            return Promise.resolve(null);
        case 'EXECUTE_ACTIONS':
            if (message.actions && message.actions.length > 0) {
                console.log("Executing actions:", message.actions);
                for (const action of message.actions) {
                    actionHandlers[action.action]?.(action);
                }
            }
            break;
        case 'SHOW_ACTION_PREVIEWS':
            showActionPreviews(message.actions);
            break;
        case 'CLEAR_ACTION_PREVIEWS':
            clearActionPreviews();
            break;
    }
});