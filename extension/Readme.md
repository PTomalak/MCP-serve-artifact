### Backend

1.  **Add API Key**:
    - Create `./backend/key` and paste your Gemini API key inside.

2.  **Run Server** (from `./backend`):
    - `uv pip install flask flask_cors google-generativeai`
    - more if missing in system configuration
    - `uv run server.py`

### Firefox Add-on

1.  **Load**:
    - Go to `about:debugging` -> This Firefox -> Load Temporary Add-on...
    - Select the `manifest.json` file.

2.  **Toggle Sidebar**:
    - Press `ALT+Q`.
