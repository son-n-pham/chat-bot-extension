document.addEventListener("DOMContentLoaded", () => {
	const chatDisplay = document.getElementById("chatDisplay");
	const chatInput = document.getElementById("chatInput");
	const sendButton = document.getElementById("sendButton");
	const clearChatButton = document.getElementById("clearChatButton");

	let chatHistory = []; // In-memory chat history

	// Function to display a message in the chat
	function displayMessage(messageText, sender) {
		const messageElement = document.createElement("div");
		messageElement.classList.add("message");
		messageElement.classList.add(
			sender === "user"
				? "user-message"
				: sender === "bot"
				? "bot-message"
				: sender === "error" // Changed "error-message" to "error" for consistency
				? "error-message"
				: "system-message" // Added for system messages like "Chat cleared"
		);
		messageElement.textContent = messageText;
		chatDisplay.appendChild(messageElement);
		chatDisplay.scrollTop = chatDisplay.scrollHeight; // Scroll to the bottom

		// Add to in-memory history unless it's a system message not meant for history
		if (sender !== "system") {
			chatHistory.push({ text: messageText, sender: sender });
		}
	}

	// Function to handle sending a message
	function sendMessage() {
		const userInput = chatInput.value.trim();
		if (userInput) {
			displayMessage(userInput, "user");
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				if (tabs && tabs.length > 0 && tabs[0].id) {
					chrome.tabs.sendMessage(tabs[0].id, {
						type: "SEND_CHAT_MESSAGE",
						text: userInput,
					});
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
