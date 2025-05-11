# Plan to Implement Persistent Chat History

**Goal:** Modify the Chrome extension to store chat history using `chrome.storage.local` so that it persists even when the popup is closed and is only cleared when the "Clear Chat" button is pressed.

**Affected File:** `popup.js`

**Steps:**

1.  **Modify `popup.js`:**
    - **Create `loadChatHistory()` function:**
      - This function will retrieve `chatHistory` from `chrome.storage.local.get(['chatHistory'], (result) => { ... });`.
      - If `result.chatHistory` exists, it will iterate through the saved messages and use the existing `displayMessage()` function to add them to the `chatDisplay`.
      - It will also update the in-memory `chatHistory` array with `result.chatHistory`.
    - **Create `saveChatHistory()` function:**
      - This function will save the current state of the in-memory `chatHistory` array to `chrome.storage.local.set({ chatHistory: chatHistory });`.
    - **Update `displayMessage(messageText, sender)` function:**
      - After a message is added to the in-memory `chatHistory` (and it's not a 'system' message that shouldn't be persisted), call `saveChatHistory()` to persist the updated history.
    - **Update `clearChat()` function:**
      - After clearing the `chatDisplay` and the in-memory `chatHistory`, call `saveChatHistory()` to persist the empty history.
    - **Update `DOMContentLoaded` event listener:**
      - Call `loadChatHistory()` at the beginning of this listener to load and display any existing chat history when the popup is opened.

**Mermaid Diagram of Modified Flow:**

```mermaid
graph TD
    A[Popup Opens (DOMContentLoaded)] --> B{Load Chat History from chrome.storage.local};
    B -- History Exists --> C[Populate chatDisplay & in-memory chatHistory];
    B -- No History --> D[Chat is empty];
    C --> E[User Interacts];
    D --> E;

    E -- Send Message --> F[displayMessage(user)];
    F --> G[Update in-memory chatHistory];
    G --> H[saveChatHistory() to chrome.storage.local];
    H --> I[Send to Content Script];

    J[Receive Message (Bot/Error)] --> K[displayMessage(bot/error)];
    K --> L[Update in-memory chatHistory];
    L --> M[saveChatHistory() to chrome.storage.local];

    E -- Clear Chat --> N[clearChat() called];
    N --> O[Clear chatDisplay];
    O --> P[Clear in-memory chatHistory];
    P --> Q[saveChatHistory() (empty) to chrome.storage.local];
    Q --> R[Display "Chat cleared"];
```
