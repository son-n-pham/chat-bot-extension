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
