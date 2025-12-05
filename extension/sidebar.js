// sidebar.js
import { ChatManager } from './modules/chat_manager.js';
import { ContextBuilder } from './modules/context_builder.js';
import { UIBuilder } from './modules/ui_builder.js';
import { ApiClient } from './modules/api_client.js';

async function sendMessageToContentScript(message) {
    try {
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
            return browser.tabs.sendMessage(activeTab.id, message);
        }
        return null;
    } catch (error) {
        console.error("Error sending message to content script:", error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    UIBuilder.init();
    ChatManager.init();

    const sendBtn = document.getElementById('btn-send');
    const inputField = document.getElementById('user-prompt');
    const modelSelect = document.getElementById('ai-model-select');
    const selectContentBtn = document.getElementById('btn-select-content');
    const previewContextBtn = document.getElementById('btn-preview-context');
    const clearContentBtn = document.getElementById('btn-clear-content');
    const parsePageBtn = document.getElementById('btn-parse-page');
    const followLinkBtn = document.getElementById('btn-follow-link');
    const fillInputBtn = document.getElementById('btn-fill-input');
    const pressButtonBtn = document.getElementById('btn-press-button');
    let isSelectionActive = false;
    const actBtn = document.getElementById('btn-act');
    const askBtn = document.getElementById('btn-ask');

    // --- Main Event Handlers ---
    actBtn.addEventListener('click', () => handleSend('act'));
    askBtn.addEventListener('click', () => handleSend('answer'));

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend('act'); }
    });
    selectContentBtn.addEventListener('click', () => {
        if (!isSelectionActive && parsePageBtn.classList.contains('active-tool')) {
            parsePageBtn.classList.remove('active-tool');
        }
        isSelectionActive = !isSelectionActive;
        selectContentBtn.innerText = isSelectionActive ? 'Stop Selecting' : 'Select Content';
        selectContentBtn.classList.toggle('active-tool', isSelectionActive);
        if(isSelectionActive) parsePageBtn.classList.remove('active-tool');
        sendMessageToContentScript({ type: isSelectionActive ? 'START_SELECTION' : 'STOP_SELECTION' });
    });
    clearContentBtn.addEventListener('click', () => {
        sendMessageToContentScript({ type: 'CLEAR_SELECTION' });
        parsePageBtn.classList.remove('active-tool');
        if (isSelectionActive) {
            isSelectionActive = false;
            selectContentBtn.innerText = 'Select Content';
            selectContentBtn.classList.remove('active-tool');
        }
    });
    parsePageBtn.addEventListener('click', () => {
        const wasActive = parsePageBtn.classList.contains('active-tool');
        parsePageBtn.classList.toggle('active-tool', !wasActive);
        sendMessageToContentScript({ type: wasActive ? 'CLEAR_SELECTION' : 'PARSE_ENTIRE_PAGE' });
        if (!wasActive && isSelectionActive) {
            isSelectionActive = false;
            selectContentBtn.innerText = 'Select Content';
            selectContentBtn.classList.remove('active-tool');
        }
    });
    previewContextBtn.addEventListener('click', async () => {
        const parsedData = await sendMessageToContentScript({ type: 'GET_SELECTED_CONTENT' });
        ContextBuilder.showContextPreview(parsedData);
    });
    followLinkBtn.addEventListener('click', () => {
        followLinkBtn.classList.toggle('active-tool');
    });
    fillInputBtn.addEventListener('click', () => {
        fillInputBtn.classList.toggle('active-tool');
    });
    pressButtonBtn.addEventListener('click', () => {
        pressButtonBtn.classList.toggle('active-tool');
    });

    // --- Message Listeners ---
    browser.runtime.onMessage.addListener((message) => {
        if (message.type === 'SELECTION_STOPPED_BY_USER' && isSelectionActive) {
            isSelectionActive = false;
            selectContentBtn.innerText = 'Select Content';
            selectContentBtn.classList.remove('active-tool');
        }
    });
    
    async function handleSend(intent) {
        const clickedButton = (intent === 'act') ? actBtn : askBtn;
        const text = inputField.value.trim();
        if (!text) return;

        ChatManager.addMessage('user', text);
        inputField.value = '';
        const parsedData = await sendMessageToContentScript({ type: 'GET_SELECTED_CONTENT' });
        if (!parsedData || parsedData.length === 0) {
            console.log("No content was selected or parsed.");
            ChatManager.addMessage('ai', "Please select some content on the page first using the 'Select Content' or 'Parse Entire Page' tools.");
            return;
        }

        // --- Set Loading State ---
        actBtn.disabled = true;
        askBtn.disabled = true;
        clickedButton.classList.add('loading');

        try {
            // Get a list of currently enabled MCP tools
            const enabledMcpTools = [];
            if (followLinkBtn.classList.contains('active-tool')) {
                enabledMcpTools.push('follow_link');
            }
            if (fillInputBtn.classList.contains('active-tool')) {
                enabledMcpTools.push('fill_input');
            }
            if (pressButtonBtn.classList.contains('active-tool')) {
                enabledMcpTools.push('press_button');
            }

            const data = await ApiClient.sendMessage(text, modelSelect.value, parsedData, enabledMcpTools, intent);

            if (data.actions && data.actions.length > 0) {
                // Handle AI's request for one or more actions
                ChatManager.addMultiActionRequest(data.actions, 
                    (approvedActions) => {
                        console.log(`User approved actions:`, approvedActions);
                        // Send the sequence of actions to the content script to be executed
                        sendMessageToContentScript({ type: 'EXECUTE_ACTIONS', actions: approvedActions });
                    },
                    (deniedActions) => {
                        console.log(`User denied actions:`, deniedActions);
                    }
                );
            } else if (data.reply) {
                ChatManager.addMessage('ai', data.reply, data.context_full);
            } else {
                console.warn("Received an empty or unexpected response from the backend:", data);
            }
        } catch (error) {
            console.error("Error during handleSend:", error);
            ChatManager.addMessage('ai', "An error occurred. Please check the console or server logs.");
        } finally {
            // --- Clear Loading State ---
            actBtn.disabled = false;
            askBtn.disabled = false;
            clickedButton.classList.remove('loading');
        }
    }
});