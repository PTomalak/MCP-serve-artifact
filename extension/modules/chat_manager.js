// modules/chat_manager.js

export const ChatManager = {
    elements: {
        history: document.getElementById('chat-history'),
    },

    init() {
        // No setup needed
    },

    addMessage(role, text, contextFull = null) {
        const div = document.createElement('div');
        div.className = `message msg-${role}`;
        
        // If context exists, make the bubble clickable
        if (role === 'ai' && contextFull) {
            div.classList.add('has-context');
            div.title = 'Click to view context';
            div.onclick = () => this.showFullContext(contextFull);
        }

        const textSpan = document.createElement('span');
        textSpan.innerText = text;
        div.appendChild(textSpan);

        this.elements.history.appendChild(div);
        this.elements.history.scrollTop = this.elements.history.scrollHeight;
    },

    addMultiActionRequest(actions, onAllow, onDeny) {
        const div = document.createElement('div');
        div.className = 'message msg-ai action-request';

        const textSpan = document.createElement('span');
        let requestHTML = "The AI wants to perform the following actions:<ol>";

        // Also send a message to the content script to show the action previews on the page
        this.showActionPreviews(actions);

        actions.forEach(action => {
            let details = '';
            switch(action.action) {
                case 'navigate':
                    details = `Navigate to <b>${action.url}</b>`;
                    break;
                case 'fill_input':
                    details = `Fill input with "<b>${action.value}</b>"`;
                    break;
                case 'press_button':
                    details = `Press button`;
                    break;
            }
            requestHTML += `<li>${details} <small>(Reason: ${action.reason})</small></li>`;
        });

        requestHTML += "</ol>";
        textSpan.innerHTML = requestHTML;
        div.appendChild(textSpan);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'action-buttons';

        const allowBtn = document.createElement('button');
        allowBtn.innerText = 'Allow';
        allowBtn.onclick = () => {
            // Pass the list of actions to the handler
            this.clearActionPreviews();
            onAllow(actions);
            div.remove();
        };

        const denyBtn = document.createElement('button');
        denyBtn.innerText = 'Deny';
        denyBtn.onclick = () => {
            // Pass the list of actions to the handler
            this.clearActionPreviews();
            onDeny(actions);
            div.remove();
        };

        buttonContainer.append(allowBtn, denyBtn);
        div.appendChild(buttonContainer);
        this.elements.history.appendChild(div);
        this.elements.history.scrollTop = this.elements.history.scrollHeight;
    },

    async showActionPreviews(actions) {
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
            browser.tabs.sendMessage(activeTab.id, { type: 'SHOW_ACTION_PREVIEWS', actions });
        }
    },

    async clearActionPreviews() {
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
            browser.tabs.sendMessage(activeTab.id, { type: 'CLEAR_ACTION_PREVIEWS' });
        }
    },

    async showFullContext(fullContent) {
        try {
            const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (activeTab) {
                browser.tabs.sendMessage(activeTab.id, {
                    type: 'SHOW_CONTEXT_OVERLAY',
                    content: fullContent
                });
            }
        } catch (error) {
            console.error("Error sending message to content script:", error);
        }
    }
};