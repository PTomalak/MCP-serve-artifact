// modules/context_builder.js

function formatSimplifiedStringForHTML(contentString) {
    if (!contentString || typeof contentString !== 'string') return "";

    // Escape HTML special characters to prevent XSS
    const escaped = contentString
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Replace custom markdown [Text](mcp-id-X) with styled spans
    const interactiveFormatted = escaped.replace(
        /\[([^\]]+)\]\((mcp-id-\d+)\)/g,
        '<span class="interactive" title="$2">$1</span>'
    );

    return interactiveFormatted;
}

function buildContextHTML(parsedContent) {
    let rows_html = [];
    if (parsedContent && Array.isArray(parsedContent) && parsedContent.length > 0) {
        for (const block of parsedContent) {
            const simplified_html = formatSimplifiedStringForHTML(block.simplified || '');
            const detailed_json = JSON.stringify(block.detailed || {}, null, 2);
            const detailed_html = detailed_json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            rows_html.push(`
            <div class="context-row">
                <div class="simplified-view">${simplified_html}</div>
                <pre class="detailed-view">${detailed_html}</pre>
            </div>
            `);
        }
    } else {
        rows_html.push("<p>No content was selected or parsed from the page. Use the 'Select Content' or 'Parse Entire Page' tools first.</p>");
    }

    return `
    <div class="content-modal">
        <div class="modal-header">
            <h3>Context Inspector</h3>
            <span class="close-btn" onclick="this.closest('#ai-sidebar-context-overlay').remove()">&times;</span>
        </div>
        <div class="modal-body">
            <div class="column-header">Human-Readable View</div>
            <div class="column-header">Full Context for AI</div>
            ${rows_html.join('')}
        </div>
    </div>
    `;
}

export const ContextBuilder = {
    showContextPreview: async (parsedData) => {
        const fullContent = buildContextHTML(parsedData);
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        browser.tabs.sendMessage(activeTab.id, { type: 'SHOW_CONTEXT_OVERLAY', content: fullContent });
    },
    showContextFromReply: async (parsedData) => {
        const fullContent = buildContextHTML(parsedData);
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        browser.tabs.sendMessage(activeTab.id, { type: 'SHOW_CONTEXT_OVERLAY', content: fullContent });
    }
};