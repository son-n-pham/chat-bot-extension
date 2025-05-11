document.addEventListener("DOMContentLoaded", () => {
	const chatDisplay = document.getElementById("chatDisplay");
	const chatInput = document.getElementById("chatInput");
	const sendButton = document.getElementById("sendButton");
	const clearChatButton = document.getElementById("clearChatButton");

	let chatHistory = []; // In-memory chat history

	// Function to save chat history to chrome.storage.local
	function saveChatHistory() {
		chrome.storage.local.set({ chatHistory: chatHistory }, () => {
			if (chrome.runtime.lastError) {
				console.error(
					"Error saving chat history:",
					chrome.runtime.lastError.message
				);
			}
		});
	}

	// Function to load chat history from chrome.storage.local
	function loadChatHistory() {
		chrome.storage.local.get(["chatHistory"], (result) => {
			if (chrome.runtime.lastError) {
				console.error(
					"Error loading chat history:",
					chrome.runtime.lastError.message
				);
				return;
			}
			if (result.chatHistory && Array.isArray(result.chatHistory)) {
				chatHistory = result.chatHistory;
				chatHistory.forEach((message) => {
					// Call displayMessage without adding to history again, as it's already loaded
					// We need a way to display without re-adding and re-saving.
					// For now, let's create a temporary display-only version or adjust displayMessage.
					// Simplified: just display. displayMessage will handle the visual part.
					// The issue is displayMessage also tries to save.
					// Let's adjust displayMessage to take an optional flag.
					displayMessageInternal(message.text, message.sender, false);
				});
			}
		});
	}

	// Internal function to display messages, with an option to skip saving history (for loading)
	function displayMessageInternal(messageText, sender, addToHistory = true) {
		const messageElement = document.createElement("div");
		messageElement.classList.add("message");
		messageElement.classList.add(
			sender === "user"
				? "user-message"
				: sender === "bot"
				? "bot-message"
				: sender === "error"
				? "error-message"
				: "system-message"
		);
		messageElement.textContent = messageText;
		chatDisplay.appendChild(messageElement);
		chatDisplay.scrollTop = chatDisplay.scrollHeight;

		if (addToHistory && sender !== "system") {
			chatHistory.push({ text: messageText, sender: sender });
			saveChatHistory(); // Save after adding a new message
		}
	}

	// Public function to display a message in the chat (and save it)
	function displayMessage(messageText, sender) {
		displayMessageInternal(messageText, sender, true);
	}

	// Function to handle sending a message
	function sendMessage() {
		const userInput = chatInput.value.trim();
		if (userInput) {
			displayMessage(userInput, "user");
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				if (tabs && tabs.length > 0 && tabs[0].id) {
					chrome.tabs.sendMessage(
						tabs[0].id,
						{
							type: "SEND_CHAT_MESSAGE",
							text: userInput,
						},
						function (response) {
							if (chrome.runtime.lastError) {
								console.error(
									"popup.js: Error sending SEND_CHAT_MESSAGE:",
									chrome.runtime.lastError.message
								);
								// Display a more specific error to the user in the popup
								displayMessage(
									"Error: Could not connect to the page. " +
										(chrome.runtime.lastError.message.includes(
											"Receiving end does not exist"
										)
											? "The content script may not be running on this page or is not responding."
											: chrome.runtime.lastError.message),
									"error"
								);
							} else {
								// Optional: Log success or handle response
								console.log(
									"popup.js: SEND_CHAT_MESSAGE successful, response:",
									response
								);
							}
						}
					);
				} else {
					console.error(
						"Could not send message: No active tab found or tab ID missing."
					);
					displayMessage("Error: Could not send message to the page.", "error");
				}
			});
			chatInput.value = "";
		}
	}

	// Function to clear the chat display and history
	function clearChat() {
		chatDisplay.innerHTML = "";
		chatHistory = []; // Clear the in-memory history
		saveChatHistory(); // Save the cleared history
		displayMessage("Chat cleared.", "system"); // Optional: system message
	}

	// Event Listeners
	sendButton.addEventListener("click", sendMessage);

	chatInput.addEventListener("keypress", (event) => {
		if (event.key === "Enter") {
			sendMessage();
		}
	});

	if (clearChatButton) {
		clearChatButton.addEventListener("click", clearChat);
	}

	// Listener for messages from content script or background script
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.type === "CHATBOT_RESPONSE") {
			displayMessage(request.text, "bot");
		} else if (request.type === "CONTENT_SCRIPT_ERROR") {
			displayMessage(`Error: ${request.message}`, "error");
		}
		// It's good practice to return true for asynchronous sendResponse,
		// though not strictly needed here if not using sendResponse.
		return true;
	});

	// Load chat history when the popup is opened
	loadChatHistory();

	// Initial message or welcome (can be re-enabled if desired)
	// displayMessage("Welcome! Type your message below.", 'system');

	// Optional: Remove or comment out the test message to content script if no longer needed
	// chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	// 	if (tabs && tabs.length > 0) {
	// 		const tabId = tabs[0].id;
	// 		if (tabId) {
	// 			chrome.tabs.sendMessage(
	// 				tabId,
	// 				{ type: "POPUP_HELLO", payload: "Test message from popup" },
	// 				function (response) {
	// 					if (chrome.runtime.lastError) {
	// 						console.error(
	// 							"Error sending message from popup to content script:",
	// 							chrome.runtime.lastError.message
	// 						);
	// 						// displayMessage("Error: Could not connect to the page's content script.", "error");
	// 					} else {
	// 						console.log("Response from content.js:", response);
	// 					}
	// 				}
	// 			);
	// 		} else {
	// 			console.error("Could not get active tab ID.");
	// 			// displayMessage("Error: Could not identify active tab.", "error");
	// 		}
	// 	} else {
	// 		console.error("No active tab found.");
	// 		// displayMessage("Error: No active tab found.", "error");
	// 	}
	// });
});
