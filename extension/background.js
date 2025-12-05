// background.js
browser.commands.onCommand.addListener((command) => {
    if (command === "_execute_sidebar_action") {
        console.log("Sidebar toggled via shortcut.");
    }
});