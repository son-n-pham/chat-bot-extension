// background.js
// console.log("Background service worker started.");

chrome.runtime.onInstalled.addListener(() => {
	// console.log("Extension installed/updated.");
	const initialConfig = {
		"monica.im": {
			inputSelector: "#prompt-textarea",
			sendButtonSelector: ".chat-input-buttons > div:nth-child(2)",
			responseContainerSelector:
				".react-scroll-to-bottom--css-sjwve-79elbk.chat-container",
			botMessageSelector: ".monica-reply",
		},
	};

	chrome.storage.local.get("monica.im", (result) => {
		if (Object.keys(result).length === 0) {
			chrome.storage.local.set(initialConfig, () => {
				// console.log("Initial configuration for monica.im stored.");
			});
		} else {
			// console.log("Configuration for monica.im already exists. Skipping initial setup.");
		}
	});
});
