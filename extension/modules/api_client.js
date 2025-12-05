// modules/api_client.js
const SERVER_URL = "http://localhost:5000/api";

export const ApiClient = {
    async sendMessage(text, model, parsedContent = null, enabledMcpTools = [], intent) {
        try {
            const response = await fetch(`${SERVER_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    prompt: text, 
                    model: model,
                    parsed_content: parsedContent,
                    enabled_mcp_tools: enabledMcpTools,
                    intent: intent // 'act' or 'answer'
                })
            });
            if (!response.ok) throw new Error("Server error");
            return await response.json();
        } catch (error) {
            console.warn("Python backend unreachable. Using Mock Data.");
            return {
                reply: `Mock AI: I received "${text}"`,
                context_summary: "Mock context summary",
                context_full: `<h1>Mock Context</h1><p>Data was not sent to the server. Parsed content:</p><pre>${JSON.stringify(parsedContent, null, 2)}</pre>`
            };
        }
    }
};