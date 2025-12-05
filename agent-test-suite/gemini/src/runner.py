# runner.py

CONFIG_VALUE = "42"
DEBUG_MSG = "Processing your request..."

def process_input(user_input: str) -> str:
    # Simple example logic
    if user_input.lower() == "hello":
        return f"{DEBUG_MSG} Hello there!"
    elif user_input.lower() == "appname":
        return f"The app name is MYAPP"  # Will fail unless imported
    elif user_input.lower() == "config":
        return f"Config value is {CONFIG_VALUE}"
    else:
        return "Unknown command"

