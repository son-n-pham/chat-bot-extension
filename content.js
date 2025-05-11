// content.js

let siteConfig; // Will hold the configuration for the current site

// Function to send a message to the chatbot
function sendMessageToChatbot(messageText) {
	if (
		!siteConfig ||
		!siteConfig.inputSelector ||
		!siteConfig.sendButtonSelector
	) {
		console.error("Site configuration for selectors not found.");
		chrome.runtime.sendMessage({
			type: "NO_CONFIG_FOUND",
			host: window.location.hostname,
		});
		return;
	}
	const inputField = document.querySelector(siteConfig.inputSelector);
	const sendButton = document.querySelector(siteConfig.sendButtonSelector);

	if (!inputField || !sendButton) {
		console.error(
			"Chat input field or send button not found using site config selectors."
		);
		return;
	}

	inputField.value = messageText;
	inputField.dispatchEvent(new Event("input", { bubbles: true }));
	inputField.dispatchEvent(new Event("change", { bubbles: true }));
	sendButton.click();
}

// Callback function for the MutationObserver
function extractAndSendResponse(mutationList, observer) {
	if (!siteConfig || !siteConfig.botMessageSelector) {
		// console.warn("Site configuration for bot message selector not found. Cannot extract responses.");
		// No need to send NO_CONFIG_FOUND here as it's handled during initialization
		return;
	}
	for (const mutation of mutationList) {
		if (mutation.type === "childList") {
			for (const addedNode of mutation.addedNodes) {
				if (addedNode.nodeType === Node.ELEMENT_NODE) {
					// Check if the added node itself is a bot message
					if (addedNode.matches(siteConfig.botMessageSelector)) {
						const nodeText = addedNode.textContent || addedNode.innerText;
						if (nodeText && nodeText.trim()) {
							chrome.runtime.sendMessage({
								type: "CHATBOT_RESPONSE",
								text: nodeText.trim(),
							});
						}
					} else {
						// Check if the added node contains bot messages
						const botMessages = addedNode.querySelectorAll(
							siteConfig.botMessageSelector
						);
						botMessages.forEach((botMessageNode) => {
							const nodeText =
								botMessageNode.textContent || botMessageNode.innerText;
							if (nodeText && nodeText.trim()) {
								chrome.runtime.sendMessage({
									type: "CHATBOT_RESPONSE",
									text: nodeText.trim(),
								});
							}
						});
					}
				}
			}
		}
	}
}

// Function to set up the MutationObserver
function observeChatResponses() {
	if (!siteConfig || !siteConfig.responseContainerSelector) {
		console.error(
			"Site configuration for response container selector not found."
		);
		// NO_CONFIG_FOUND message is sent during initialization if siteConfig is missing
		return;
	}
	const responseContainer = document.querySelector(
		siteConfig.responseContainerSelector
	);

	if (!responseContainer) {
		console.error(
			"Chat response container not found using site config selector:",
			siteConfig.responseContainerSelector
		);
		return;
	}

	const observer = new MutationObserver(extractAndSendResponse);
	observer.observe(responseContainer, { childList: true, subtree: true });
	// console.log("MutationObserver set up to observe chat responses using site config.");
}

// Listener for messages from other parts of the extension (e.g., popup)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	// console.log("Message received in content.js:", request, sender);

	if (request.type === "SEND_CHAT_MESSAGE") {
		if (siteConfig) {
			sendMessageToChatbot(request.text);
			sendResponse({
				status: "Chat message sent via content.js",
				text: request.text,
			});
		} else {
			sendResponse({
				status: "Error: No site configuration loaded.",
				text: request.text,
			});
			chrome.runtime.sendMessage({
				type: "NO_CONFIG_FOUND",
				host: window.location.hostname,
			});
		}
	} else if (request.type === "POPUP_HELLO") {
		sendResponse({
			status: "Message received by content.js",
			originalRequest: request,
		});
	} else {
		sendResponse({
			status: "Unknown message type received by content.js",
			requestType: request.type,
		});
	}
	return true; // Indicates asynchronous response
});

// Main logic to initialize content script based on site configuration
function initializeScript() {
	const hostname = window.location.hostname;
	// console.log(`Current hostname: ${hostname}`);

	chrome.storage.local.get(null, (items) => {
		// console.log("All stored configs:", items);
		if (items && items[hostname]) {
			siteConfig = items[hostname];
			// console.log(`Configuration found for ${hostname}:`, siteConfig);
			// Call the function to start observing chat responses now that config is loaded
			observeChatResponses();
		} else {
			// console.warn(`No configuration found for ${hostname}.`);
			chrome.runtime.sendMessage({ type: "NO_CONFIG_FOUND", host: hostname });
			// Do not call observeChatResponses or other functions that depend on siteConfig
		}
	});
}

// Initialize the script
initializeScript();
