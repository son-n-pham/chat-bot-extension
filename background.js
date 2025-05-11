// background.js
// console.log("Background service worker started.");

chrome.runtime.onInstalled.addListener(() => {
	// console.log("Extension installed/updated.");
	// Define default site configurations
	const DEFAULT_SITE_CONFIGS = {
		"monica.im": {
			inputSelector: 'textarea.ant-input[data-input_node="monica-chat-input"]',
			sendButtonSelector: 'div[class^="input-msg-btn"]', // Keep as is, or review if Enter key is 100% reliable
			responseContainerSelector: "#monica-chat-scroll-box",
			botReplyContainerSelector:
				'div[class*="chat-message--"][class*="chat-reply--"]', // UPDATED based on HTML structure
			botMessageTextSelector: 'div[class*="markdown--"]', // Confirmed correct
			completionIndicatorSelector:
				'div[class*="message-toolbar--"][class*="show--"]', // UPDATED based on HTML structure
		},
		// Add configurations for other sites here
		// "example.com": {
		//   inputSelector: "#chat-input",
		//   sendButtonSelector: "#send-button",
		//   responseContainerSelector: "#chat-history",
		//   botReplyContainerSelector: ".bot-message",
		//   botMessageTextSelector: ".message-text",
		//   completionIndicatorSelector: ".message-actions"
		// }
	};

	// Load existing configurations or set defaults if none exist
	chrome.storage.local.get("siteConfigurations", (data) => {
		const existingConfigs = data.siteConfigurations || {};
		const mergedConfigs = { ...DEFAULT_SITE_CONFIGS, ...existingConfigs };

		// Save the merged configurations back to storage
		chrome.storage.local.set({ siteConfigurations: mergedConfigs }, () => {
			console.log(
				"Default and existing site configurations merged and stored."
			);
			// You can optionally send a message to other parts of the extension here
			// chrome.runtime.sendMessage({ type: "CONFIGS_LOADED" });
		});
	});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === "fileUploaded") {
		const { name, content } = request.payload;
		console.log(`Background script received file: ${name}`);

		// TODO: Add chatbot's file analysis logic here
		// For example, you might send the content to a chatbot API
		// and then send the chatbot's response back to the popup.

		// Simulate processing and send a response
		sendResponse({
			status: "success",
			message: `File "${name}" received by background script.`,
		});
	}
	// Return true to indicate that sendResponse will be called asynchronously.
	// This is important even if the response is sent quickly in this version.
	return true;
});
