# Universal Chatbot Assistant

## Description

This Chrome extension allows users to interact with various AI chatbots directly from an extension interface. It works by injecting a content script into active chatbot webpages (e.g., `monica.im`), capturing user input from the extension's popup, sending it to the chatbot on the page, and then relaying the chatbot's responses back to the popup. The extension supports "temporary chat" (chat history is in-memory and clears when the popup closes or is manually cleared) and aims for adaptability across different chatbot sites through a configuration system for site-specific CSS selectors.

## Installation

1.  Download or clone the project repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle switch (usually in the top right corner).
4.  Click the "Load unpacked" button.
5.  In the file dialog, select the root directory of the cloned/downloaded project.
6.  The "Universal Chatbot Assistant" extension should now appear in your list of extensions and be active.

## Usage

1.  Navigate to a supported chatbot website for which a configuration exists (e.g., `monica.im`).
2.  Click on the "Universal Chatbot Assistant" icon in your Chrome toolbar to open the extension popup.
3.  The popup will display a chat interface with:
    - A chat display area.
    - A text input field to type your message.
    - A "Send" button.
    - A "Clear Chat" button.
4.  Type your message into the input field.
5.  Click the "Send" button or press the "Enter" key.
6.  Your message will be displayed in the chat interface and sent to the chatbot on the active webpage.
7.  The chatbot's response from the webpage will be captured and displayed in the extension's chat interface.
8.  You can clear the current chat session in the popup by clicking the "Clear Chat" button. The chat history is temporary and stored in memory while the popup is open.

## Running Tests

- The project currently does not have an automated testing framework.
- Testing is performed manually by interacting with the extension on supported chatbot websites like `monica.im`.
- Guidance for running tests with Visual Studio Code's integrated test support: Since there are no automated tests, users should perform manual testing as described above. If automated tests are added in the future, this section can be updated with instructions for VS Code's test runner.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
