// modules/ui_builder.js

export const UIBuilder = {
    contentTools: [
        { id: 'btn-select-content', text: 'Select Content' },
        { id: 'btn-clear-content', text: 'Clear Content' },
        { id: 'btn-parse-page', text: 'Parse Entire Page' }
    ],
    mcpTools: [
        { id: 'btn-fill-input', text: 'Fill Input', defaultActive: true},
        { id: 'btn-press-button', text: 'Press Button', defaultActive: true},
        { id: 'btn-follow-link', text: 'Follow Link', defaultActive: true}
    ],
    models: [
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro", 
        "gemini-2.5-flash",        
    ],

    init() {
        this.renderTools('tools-col-content', this.contentTools);
        this.renderTools('tools-col-mcp', this.mcpTools);
        this.renderModelSelector();
    },

    renderTools(containerId, toolsList) {
        const colContainer = document.getElementById(containerId);
        toolsList.forEach(tool => {
            const btn = document.createElement('button');
            btn.id = tool.id;
            btn.className = 'tool-btn';
            btn.innerText = tool.text;
            if (tool.defaultActive) {
                btn.classList.add('active-tool');
            }
            colContainer.appendChild(btn);
        });
    },

    renderModelSelector() {
        const container = document.getElementById('model-selector-container');
        const select = document.createElement('select');
        select.id = "ai-model-select";
        
        this.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.innerText = model;
            select.appendChild(option);
        });
        
        container.appendChild(select);
    }
};