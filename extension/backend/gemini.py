# backend/gemini.py
import os
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import google.generativeai as genai
from pathlib import Path

# --- Configuration ---
try:
    key_path = Path(__file__).parent / "key"
    if not key_path.is_file():
        raise ValueError("API key file not found at ./backend/key")
    
    api_key = key_path.read_text().strip()
    if not api_key or "YOUR_GOOGLE_API_KEY_HERE" in api_key:
        raise ValueError("API key is missing or is a placeholder in ./backend/key")
        
    if not api_key:
        raise ValueError("API key file is empty.")
    genai.configure(api_key=api_key)
    print("Gemini API configured successfully.")
except ValueError as e:
    print(f"Error: {e}")


def generate_response(prompt, model_name="gemini-2.5-flash", enabled_tools=None):
    """
    Generates a response from the specified model.
    """
    tools_to_use = []
    
    # Define the 'follow_link' tool
    if enabled_tools and 'follow_link' in enabled_tools:
        tools_to_use.append(genai.protos.Tool(function_declarations=[
            genai.protos.FunctionDeclaration(
                name='follow_link',
                description='Navigate to a link from the provided context.',
                parameters=genai.protos.Schema(type=genai.protos.Type.OBJECT, properties={
                    'mcp_id': genai.protos.Schema(type=genai.protos.Type.STRING, description="The mcp_id of the link to follow, e.g., 'mcp-id-5'."),
                    'reason': genai.protos.Schema(type=genai.protos.Type.STRING, description="Why you are following this link.")
                }, required=['mcp_id', 'reason'])
            )
        ]))

    # Define the 'fill_input' tool
    if enabled_tools and 'fill_input' in enabled_tools:
        tools_to_use.append(genai.protos.Tool(function_declarations=[
            genai.protos.FunctionDeclaration(
                name='fill_input',
                description='Fill a text input, textarea, or select field.',
                parameters=genai.protos.Schema(type=genai.protos.Type.OBJECT, properties={
                    'mcp_id': genai.protos.Schema(type=genai.protos.Type.STRING, description="The mcp_id of the input field to fill, e.g., 'mcp-id-12'."),
                    'value': genai.protos.Schema(type=genai.protos.Type.STRING, description="The text to fill into the input field."),
                    'reason': genai.protos.Schema(type=genai.protos.Type.STRING, description="Why you are filling this input.")
                }, required=['mcp_id', 'value', 'reason'])
            )
        ]))

    # Define the 'press_button' tool
    if enabled_tools and 'press_button' in enabled_tools:
        tools_to_use.append(genai.protos.Tool(function_declarations=[
            genai.protos.FunctionDeclaration(
                name='press_button',
                description='Press a button on the page.',
                parameters=genai.protos.Schema(type=genai.protos.Type.OBJECT, properties={
                    'mcp_id': genai.protos.Schema(type=genai.protos.Type.STRING, description="The mcp_id of the button to press, e.g., 'mcp-id-3'."),
                    'reason': genai.protos.Schema(type=genai.protos.Type.STRING, description="Why you are pressing this button.")
                }, required=['mcp_id', 'reason'])
            )
        ]))

    try:
        # Only pass the tools and tool_config if tools are actually available to be used.
        if tools_to_use:
            # AUTO mode lets the LLM decide whether to call functions or not.
            # also explicitly disable grounding by not providing a google_search tool.
            tool_config = {
                "function_calling_config": "ANY",
            }
            model = genai.GenerativeModel(model_name, tools=tools_to_use, tool_config=tool_config)
        else:
            # If no tools are enabled, create the model without tool-related parameters.
            model = genai.GenerativeModel(model_name)

        response = model.generate_content(prompt, safety_settings={
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE
        })
        return response
    except Exception as e:
        print(f"An error occurred while calling the Gemini API: {e}")
        return f"Error: Could not get a response from the AI model. Please check the server logs. Details: {e}"