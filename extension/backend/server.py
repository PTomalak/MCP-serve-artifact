# backend/server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import html
import json
import re
import gemini

app = Flask(__name__)
CORS(app)

def find_node_by_mcp_id(nodes, mcp_id):
    """
    Recursively search through a list of content blocks for a node with a specific mcp_id.
    """
    for node in nodes:
        def search_tree(current_node):
            if not current_node or not isinstance(current_node, dict):
                return None
            if current_node.get('attributes', {}).get('mcp_id') == mcp_id:
                return current_node
            for child in current_node.get('children', []):
                found = search_tree(child)
                if found: return found
            return None
        result = search_tree(node.get('detailed'))
        if result: return result
    return None

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_prompt = data.get('prompt', '')
    model = data.get('model', 'Unknown')
    parsed_content = data.get('parsed_content', [])
    enabled_mcp_tools = data.get('enabled_mcp_tools', [])
    intent = data.get('intent', 'act')
    
    ai_prompt_context = "\n\n".join([block.get('simplified', '') for block in parsed_content])
    print(f"--- Context for AI ---\n{ai_prompt_context}\n--------------------")
    print(f"--- User Intent: {intent} ---")


    if intent == 'answer':
        # User wants an answer based on the context, not an action.
        answer_prompt = f"""You are a helpful assistant. Answer the user's question based *only* on the provided context.
Do not use any tools. Be concise and directly answer the question.
CONTEXT:
---
{ai_prompt_context}
---
USER QUESTION: {user_prompt}"""
        ai_response = gemini.generate_response(prompt=answer_prompt, model_name=model, enabled_tools=None)
        if isinstance(ai_response, str): # Handle potential errors
            return jsonify({"reply": ai_response, "context_full": parsed_content})
        return jsonify({"reply": ai_response.text, "context_full": parsed_content})
    
    elif intent == 'act':
        # User wants the AI to perform an action using tools.
        interaction_prompt = f"""You are a web-browsing assistant. Use the provided tools to act on the page context based on the user's command.

CONTEXT FROM CURRENT WEBPAGE:
---
{ai_prompt_context}
---
USER COMMAND: {user_prompt}"""
        ai_response = gemini.generate_response(
            prompt=interaction_prompt, 
            model_name=model, 
            enabled_tools=enabled_mcp_tools
        )
    else:
        return jsonify({"reply": f"Error: Unknown intent '{intent}'", "context_full": None})

    # Handle AI response (for 'act')
    if isinstance(ai_response, str):
        return jsonify({"reply": ai_response, "context_full": None})

    # Process tool calls or text response
    actions_to_confirm = []
    try:
        for part in ai_response.candidates[0].content.parts:
            if part.function_call:
                tool_call = part.function_call
                mcp_id = tool_call.args.get('mcp_id')
                reason = tool_call.args.get('reason', 'No reason provided.')
                
                target_node = find_node_by_mcp_id(parsed_content, mcp_id)
                if not target_node:
                    return jsonify({"reply": f"AI error: Tried to use a tool on an element with an invalid ID ('{mcp_id}').", "context_full": None})

                if tool_call.name == 'follow_link':
                    if 'href' in target_node.get('attributes', {}):
                        url = target_node['attributes']['href']
                        actions_to_confirm.append({"action": "navigate", "url": url, "reason": reason, "mcp_id": mcp_id})
                
                elif tool_call.name == 'fill_input':
                    value = tool_call.args.get('value')
                    actions_to_confirm.append({"action": "fill_input", "value": value, "reason": reason, "mcp_id": mcp_id})

                elif tool_call.name == 'press_button':
                    actions_to_confirm.append({"action": "press_button", "reason": reason, "mcp_id": mcp_id})

            elif part.text:
                if not actions_to_confirm:
                    return jsonify({"reply": part.text, "context_full": parsed_content})

        if actions_to_confirm:
            return jsonify({"actions": actions_to_confirm})

        return jsonify({"reply": "The AI analyzed the context but decided no action was necessary.", "context_full": parsed_content})

    except (IndexError, AttributeError, ValueError) as e:
        print(f"Error processing AI response: {e}\nResponse: {ai_response}")
        return jsonify({"reply": "An error occurred while processing the AI's response.", "context_full": None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)