# Project Plan: Universal Chatbot Assistant Chrome Extension

**Objective:** Create a Chrome extension with a chat interface to interact with active chatbot webpages (e.g., `monica.im`), displaying responses back in the extension. Support "temporary chat" and aim for robustness via configuration.

## Project Phases and Steps

```mermaid
graph TD
    A[Phase 1: Project Setup & Basic UI] --> B(Step 1.1: Create manifest.json);
    A --> C(Step 1.2: Create popup.html);
    A --> D(Step 1.3: Create popup.css);
    A --> E(Step 1.4: Create popup.js - UI Logic);
    A --> F(Step 1.5: Create background.js - Minimal);
    A --> G(Create images folder with icons);

    H[Phase 2: Content Script & Page Interaction] --> I(Step 2.1: Create content.js);
    H --> J(Step 2.2: Establish Message Passing Popup <-> Content Script);
    H --> K(Step 2.3: Interact with Chatbot Page - monica.im);
    K --> K1(Step 2.3.1: Identify Chat Input - #prompt-textarea);
    K --> K2(Step 2.3.2: Identify Send Button - .chat-input-buttons > div:nth-child(2));
    K --> K3(Step 2.3.3: Function to Send Message);
    H --> L(Step 2.4: Capture Chatbot Responses);
    L --> L1(Step 2.4.1: Identify Response Container - .react-scroll-to-bottom--css-sjwve-79elbk.chat-container);
    L --> L2(Step 2.4.2: Use MutationObserver);
    L --> L3(Step 2.4.3: Identify Bot Messages - .monica-reply);
    L --> L4(Step 2.4.4: Function to Extract & Send Response);

    M[Phase 3: Implement Core Logic in Popup] --> N(Step 3.1: Send Messages from Popup to Content Script);
    M --> O(Step 3.2: Receive & Display Responses in Popup);
    M --> P(Step 3.3: Implement "Temporary Chat");

    Q[Phase 4: Robustness for Different Sites] --> R(Step 4.1: Concept - Site-Specific Configs);
    Q --> S(Step 4.2: Store Configs - chrome.storage.local);
    S --> S1(Define monica.im config with provided selectors);
    Q --> T(Step 4.3: Use Configs in content.js);
    Q --> U(Step 4.4: Optional - Options Page for Config Management);

    V[Phase 5: Testing & Refinement] --> W(Step 5.1: Test with monica.im);
    V --> X(Step 5.2: Test with Other Chatbot Sites);
    V --> Y(Step 5.3: Error Handling & User Feedback);

    subgraph Files to Create
        direction LR
        F1[manifest.json]
        F2[popup.html]
        F3[popup.css]
        F4[popup.js]
        F5[background.js]
        F6[content.js]
        F7[images/icon16.png]
        F8[images/icon48.png]
        F9[images/icon128.png]
        F10[options.html (Optional)]
        F11[options.js (Optional)]
        F12[options.css (Optional)]
    end
```

### Phase 1: Project Setup & Basic Extension UI

- **Goal:** Establish the foundational structure and a simple popup interface.
- **Steps:**
  1.  **Create `manifest.json`**:
      - Name: "Universal Chatbot Assistant"
      - Version: "0.1.0"
      - Description: "Chat with various AI chatbots via an extension interface."
      - `manifest_version`: 3
      - Permissions: `activeTab`, `scripting`, `storage`
      - Action: `default_popup` -> `popup.html`
      - Icons: `images/icon16.png`, `images/icon48.png`, `images/icon128.png`
      - Background: `service_worker` -> `background.js`
  2.  **Create `images` folder**: Add placeholder `icon16.png`, `icon48.png`, `icon128.png`.
  3.  **Create `popup.html`**:
      - Chat display `div` (e.g., `id="chatDisplay"`)
      - User input field (e.g., `id="chatInput"`)
      - Send button (e.g., `id="sendButton"`)
      - (Optional) Clear chat button (e.g., `id="clearChatButton"`)
  4.  **Create `popup.css`**: Basic styling for usability.
  5.  **Create `popup.js`**:
      - Event listeners for `sendButton` and "Enter" in `chatInput`.
      - (Optional) Event listener for `clearChatButton`.
      - `displayMessage(message, sender)` function.
      - `clearChat()` function.
  6.  **Create `background.js`**: Minimal initial file.

### Phase 2: Content Script & Page Interaction Core

- **Goal:** Develop the content script to interact with chatbot webpages.
- **Steps:**
  1.  **Create `content.js`**.
  2.  **Establish Message Passing (`popup.js` <-> `content.js`)**:
      - `popup.js`: Use `chrome.tabs.sendMessage` to send user input.
      - `content.js`: Use `chrome.runtime.onMessage.addListener` to receive from popup and `chrome.runtime.sendMessage` to send responses/errors back.
  3.  **Interacting with `monica.im` (using provided selectors in `content.js`)**:
      - Chat Input Field: `document.querySelector('#prompt-textarea')`
      - Send Button: `document.querySelector('.chat-input-buttons > div:nth-child(2)')`
      - Function `sendMessageToChatbot(messageText)`:
        - Set input field value.
        - Dispatch `input` and `change` events.
        - Click the send button.
  4.  **Capturing Chatbot Responses (in `content.js`)**:
      - Response Container: `document.querySelector('.react-scroll-to-bottom--css-sjwve-79elbk.chat-container')`
      - Bot Message Identifier: `.monica-reply` (to be used within the observer to find new bot messages)
      - Use `MutationObserver` on the response container to detect `childList` changes.
      - Callback extracts text from new nodes matching `.monica-reply` and sends it to `popup.js`.

### Phase 3: Implementing Core Logic in Popup

- **Goal:** Connect the popup UI to the content script for a full chat flow.
- **Steps:**
  1.  **In `popup.js`, `sendButton` / "Enter" handler**:
      - Get text from `chatInput`.
      - Call `displayMessage(userInput, 'user')`.
      - Send message to `content.js`: `chrome.tabs.sendMessage(tabId, { type: "SEND_CHAT_MESSAGE", text: userInput })`.
      - Clear `chatInput`.
  2.  **In `popup.js`, `chrome.runtime.onMessage.addListener`**:
      - Handle `request.type === "CHATBOT_RESPONSE"`: `displayMessage(request.text, 'bot')`.
      - Handle `request.type === "CONTENT_SCRIPT_ERROR"`: `displayMessage(Error: ${request.message}, 'error')`.
  3.  **Implement "Temporary Chat"**:
      - Option 1 (Simplest): In-memory history in `popup.js` (clears on popup close).
      - Option 2 (Clear Button): `clearChatButton` triggers `clearChat()` in `popup.js`.

### Phase 4: Achieving Robustness for Different Chatbot Sites

- **Goal:** Make the extension adaptable using configurable selectors.
- **Steps:**
  1.  **Concept**: Store site-specific selectors.
  2.  **Storing Configurations (`chrome.storage.local`)**:
      - Structure:
        ```json
        {
        	"monica.im": {
        		"inputSelector": "#prompt-textarea",
        		"sendButtonSelector": ".chat-input-buttons > div:nth-child(2)",
        		"responseContainerSelector": ".react-scroll-to-bottom--css-sjwve-79elbk.chat-container",
        		"botMessageSelector": ".monica-reply"
        	},
        	"another.chatbot.com": {
        		/* ... */
        	}
        }
        ```
  3.  **Using Configurations in `content.js`**:
      - On load, get `window.location.hostname`.
      - Retrieve configs from `chrome.storage.local`.
      - Use matching config's selectors.
      - If no config, disable functionality or notify popup.
  4.  **(Optional but Recommended) Options Page (`options.html`, `options.js`, `options.css`)**:
      - Declare in `manifest.json`: `"options_page": "options.html"`.
      - Allow users to view, add, edit, delete configurations.

### Phase 5: Testing and Refinement

- **Goal:** Ensure functionality and handle issues.
- **Steps:**
  1.  Test thoroughly with `monica.im`.
  2.  Test with 1-2 other chatbot sites (manually adding configs initially).
  3.  Implement robust error handling and user feedback in both `popup.js` and `content.js`.
