// content.js
console.log(
	"content.js: Script started execution for URL:",
	window.location.href
);

let siteConfig; // Will hold the configuration for the current site

// Function to send a message to the chatbot
function sendMessageToChatbot(messageText) {
	if (
		!siteConfig ||
		!siteConfig.inputSelector ||
		!siteConfig.sendButtonSelector
	) {
		console.error(
			"content.js:sendMessageToChatbot - Site configuration for selectors not found. Input selector:",
			siteConfig?.inputSelector,
			"Send button selector:",
			siteConfig?.sendButtonSelector
		);
		// No chrome.runtime.sendMessage here, let the main listener handle response
		return false;
	}

	const inputField = document.querySelector(siteConfig.inputSelector);

	// const sendButton = document.querySelector(siteConfig.sendButtonSelector); // No longer directly used for sending

	if (!inputField) {
		// Send button presence is not strictly necessary if we use Enter key
		console.error(
			"content.js:sendMessageToChatbot - Chat input field not found using site config selector. Input field:",
			inputField
		);
		return false;
	}

	try {
		// Helper to set value in a way frameworks like React recognize
		function setNativeValue(element, value) {
			const valueSetter = Object.getOwnPropertyDescriptor(
				element,
				"value"
			)?.set;
			const prototype = Object.getPrototypeOf(element);
			const prototypeValueSetter = Object.getOwnPropertyDescriptor(
				prototype,
				"value"
			)?.set;

			if (valueSetter && valueSetter !== prototypeValueSetter) {
				prototypeValueSetter.call(element, value);
			} else if (valueSetter) {
				valueSetter.call(element, value);
			} else {
				// Fallback for browsers that don't support a value setter (less common)
				element.value = value;
			}
		}

		// 1. Focus the input field
		inputField.focus();

		// 2. Set its value using the native setter
		setNativeValue(inputField, messageText);

		// 3. Dispatch 'input' event
		inputField.dispatchEvent(
			new Event("input", { bubbles: true, cancelable: true })
		);

		// 4. Dispatch 'change' event
		inputField.dispatchEvent(
			new Event("change", { bubbles: true, cancelable: true })
		);

		// 5. Blur and re-focus to trigger any related event handlers
		inputField.blur();
		inputField.focus();

		// 6. Attempt to simulate pressing Enter in the input field
		console.log(
			"content.js:sendMessageToChatbot - Simulating Enter key press."
		);
		const enterKeyEventInit = {
			key: "Enter",
			code: "Enter",
			keyCode: 13,
			which: 13,
			bubbles: true,
			cancelable: true,
		};
		inputField.dispatchEvent(new KeyboardEvent("keydown", enterKeyEventInit));
		// inputField.dispatchEvent(new KeyboardEvent("keypress", enterKeyEventInit)); // Often not needed with keydown
		inputField.dispatchEvent(new KeyboardEvent("keyup", enterKeyEventInit));
		console.log("content.js:sendMessageToChatbot - Enter key press simulated.");

		// If simulating Enter doesn't work, the site might have specific event listeners
		// or use a method that's hard to trigger programmatically without a trusted event.
		// The original click method is known to cause issues on this site.

		return true; // Assume success for now, error handling below will catch issues.
	} catch (e) {
		console.error(
			"content.js:sendMessageToChatbot - Error interacting with page elements:",
			e
		);
		chrome.runtime.sendMessage({
			type: "CONTENT_SCRIPT_ERROR",
			message: `Error interacting with page: ${e.message}. This site may be preventing automated interaction.`,
		});
		return false;
	}
}

// Callback function for the main MutationObserver watching the response container
function handleNewNodesInResponseContainer(mutationList, mainObserver) {
	console.log(
		"content.js:handleNewNodesInResponseContainer - Main observer triggered.",
		mutationList
	);
	if (
		!siteConfig ||
		!siteConfig.botReplyContainerSelector ||
		!siteConfig.completionIndicatorSelector ||
		!siteConfig.botMessageTextSelector
	) {
		console.warn(
			"content.js:handleNewNodesInResponseContainer - Site configuration for structured selectors not found. Current siteConfig:",
			siteConfig
		);
		return;
	}

	for (const mutation of mutationList) {
		if (mutation.type === "childList") {
			console.log(
				`content.js:handleNewNodesInResponseContainer - Processing ${mutation.addedNodes.length} added node(s) in one mutation record.`
			);
			for (const addedNode of mutation.addedNodes) {
				if (addedNode.nodeType === Node.ELEMENT_NODE) {
					console.log(
						"content.js:handleNewNodesInResponseContainer - Examining added ELEMENT_NODE:",
						addedNode,
						"Class:",
						addedNode.className
					);

					// Check if the added node itself is a new bot reply container
					if (addedNode.matches(siteConfig.botReplyContainerSelector)) {
						console.log(
							"content.js:handleNewNodesInResponseContainer - DIRECT MATCH: New bot reply container detected:",
							addedNode,
							"Using selector:",
							siteConfig.botReplyContainerSelector
						);
						observeForCompletion(addedNode);
					} else {
						console.log(
							"content.js:handleNewNodesInResponseContainer - DIRECT MATCH FAILED. Checking for nested containers in:",
							addedNode
						);
						// If the added node is not a reply container itself,
						// check if it *contains* a reply container (e.g., if replies are wrapped)
						const replyContainers = addedNode.querySelectorAll(
							siteConfig.botReplyContainerSelector
						);
						if (replyContainers.length > 0) {
							console.log(
								`content.js:handleNewNodesInResponseContainer - NESTED: Found ${replyContainers.length} bot reply container(s) inside:`,
								addedNode
							);
							replyContainers.forEach((container) => {
								console.log(
									"content.js:handleNewNodesInResponseContainer - NESTED MATCH: Processing nested bot reply container:",
									container
								);
								observeForCompletion(container);
							});
						} else {
							console.log(
								"content.js:handleNewNodesInResponseContainer - NESTED: No bot reply containers found inside:",
								addedNode
							);
						}
					}
				} else {
					console.log(
						"content.js:handleNewNodesInResponseContainer - Skipping added node, not ELEMENT_NODE:",
						addedNode
					);
				}
			}
		}
	}
}

// Function to observe a specific bot reply container for the completion indicator
function observeForCompletion(replyContainerElement) {
	console.log(
		"content.js:observeForCompletion - Setting up observer for completion indicator inside:",
		replyContainerElement
	);

	const processCompletion = (container, observerToDisconnect) => {
		console.log(
			"content.js:processCompletion - Processing completion for container:",
			container,
			"using indicator selector:",
			siteConfig.completionIndicatorSelector
		);
		if (observerToDisconnect) {
			observerToDisconnect.disconnect();
			console.log("content.js:processCompletion - Disconnected observer.");
		}

		const messageTextElement = container.querySelector(
			siteConfig.botMessageTextSelector
		);
		if (messageTextElement) {
			const nodeText =
				messageTextElement.textContent || messageTextElement.innerText;
			if (nodeText && nodeText.trim()) {
				console.log(
					"content.js:processCompletion - Extracted message text:",
					nodeText.trim(),
					"from selector:",
					siteConfig.botMessageTextSelector
				);
				chrome.runtime.sendMessage({
					type: "CHATBOT_RESPONSE",
					text: nodeText.trim(),
				});
			} else {
				console.warn(
					"content.js:processCompletion - Message text element found, but text is empty.",
					messageTextElement
				);
			}
		} else {
			console.error(
				"content.js:processCompletion - Bot message text element NOT FOUND within reply container using selector:",
				siteConfig.botMessageTextSelector,
				"in container:",
				container
			);
		}
	};

	const completionObserver = new MutationObserver(
		(mutations, observerInstance) => {
			console.log(
				"content.js:observeForCompletion - Completion observer CALLBACK TRIGGERED. Mutations:",
				mutations
			);
			let completionIndicatorFound = false;
			for (const mutation of mutations) {
				if (mutation.type === "childList") {
					console.log(
						"content.js:observeForCompletion - childList mutation. Added nodes:",
						mutation.addedNodes
					);
					for (const node of mutation.addedNodes) {
						if (node.nodeType === Node.ELEMENT_NODE) {
							console.log(
								"content.js:observeForCompletion - Examining added ELEMENT_NODE:",
								node.outerHTML.substring(0, 200) +
									(node.outerHTML.length > 200 ? "..." : "")
							);
							if (
								node.matches(siteConfig.completionIndicatorSelector) ||
								node.querySelector(siteConfig.completionIndicatorSelector)
							) {
								console.log(
									"content.js:observeForCompletion - Completion indicator MATCHED via added node (or its child):",
									node
								);
								completionIndicatorFound = true;
								break;
							}
						}
					}
				} else if (
					mutation.type === "attributes" &&
					mutation.attributeName === "class"
				) {
					console.log(
						"content.js:observeForCompletion - attributes mutation on target:",
						mutation.target,
						"New class:",
						mutation.target.className
					);
					// Check if the target element itself now matches the completion indicator selector
					if (mutation.target.matches(siteConfig.completionIndicatorSelector)) {
						console.log(
							"content.js:observeForCompletion - Completion indicator MATCHED via class attribute change on:",
							mutation.target
						);
						completionIndicatorFound = true;
						break;
					}
					// Or if a child now matches due to a class change higher up (less direct, but possible)
					// This check is often redundant if the direct querySelector below is effective,
					// but can provide more immediate logging if a parent's class change reveals a child.
					if (
						mutation.target.querySelector(
							siteConfig.completionIndicatorSelector
						)
					) {
						console.log(
							"content.js:observeForCompletion - Completion indicator potentially found via querySelector after class attribute change on parent:",
							mutation.target
						);
						// completionIndicatorFound = true; // Let the direct query below confirm
					}
				}

				// Fallback/Re-check: if any mutation occurred, or if indicator was found by attribute change,
				// re-check the whole container directly. This catches cases where the indicator might appear
				// without being a direct addedNode in *this specific* mutation batch, or due to class changes.
				if (
					replyContainerElement.querySelector(
						siteConfig.completionIndicatorSelector
					)
				) {
					console.log(
						"content.js:observeForCompletion - Completion indicator CONFIRMED via direct querySelector in container after mutation processing."
					);
					completionIndicatorFound = true;
					break;
				}
				if (completionIndicatorFound) break;
			}

			if (completionIndicatorFound) {
				processCompletion(replyContainerElement, observerInstance);
			} else {
				console.log(
					"content.js:observeForCompletion - Completion indicator NOT YET FOUND in this mutation batch."
				);
			}
		}
	);

	// Initial check: If the completion indicator is ALREADY there when we start observing
	if (
		replyContainerElement.querySelector(siteConfig.completionIndicatorSelector)
	) {
		console.log(
			"content.js:observeForCompletion - Completion indicator found on INITIAL CHECK for:",
			replyContainerElement
		);
		processCompletion(replyContainerElement, null); // Process immediately, no observer to disconnect yet
		return; // Don't start observing if already complete
	}

	// Start observing the specific reply container
	completionObserver.observe(replyContainerElement, {
		childList: true, // For new elements added
		subtree: true, // For changes in descendants
		attributes: true, // To catch class changes on existing elements
		attributeFilter: ["class"], // Specifically interested in class attribute changes
	});
	console.log(
		"content.js:observeForCompletion - Observer now watching for completion indicator in:",
		replyContainerElement
	);
}

// Function to set up the MutationObserver
function observeChatResponses() {
	if (!siteConfig || !siteConfig.responseContainerSelector) {
		console.error(
			"content.js:observeChatResponses - Site configuration or responseContainerSelector is missing. Cannot observe.",
			"Current siteConfig:",
			siteConfig
		);
		return;
	}

	const attemptToFindContainerAndObserve = () => {
		let attempts = 0;
		const maxAttempts = 20; // Try for 10 seconds (20 * 500ms)
		const intervalTime = 500; // ms

		console.log(
			`content.js:observeChatResponses - Starting attempts to find response container: ${siteConfig.responseContainerSelector}. Document readyState: ${document.readyState}`
		);

		const intervalId = setInterval(() => {
			const responseContainer = document.querySelector(
				siteConfig.responseContainerSelector
			);

			if (responseContainer) {
				clearInterval(intervalId);
				console.log(
					"content.js:observeChatResponses - Response container FOUND:",
					responseContainer,
					"using selector:",
					siteConfig.responseContainerSelector
				);
				const mainChatObserver = new MutationObserver(
					handleNewNodesInResponseContainer
				);
				mainChatObserver.observe(responseContainer, {
					childList: true,
					subtree: true,
				});
				console.log(
					"content.js:observeChatResponses - Main MutationObserver set up to observe chat responses."
				);
			} else {
				attempts++;
				console.log(
					`content.js:observeChatResponses - Attempt ${attempts}/${maxAttempts}: Response container NOT FOUND with selector: ${siteConfig.responseContainerSelector}`
				);
				if (attempts >= maxAttempts) {
					clearInterval(intervalId);
					console.error(
						`content.js:observeChatResponses - MAX ATTEMPTS REACHED. Response container NOT FOUND with selector: ${siteConfig.responseContainerSelector}. Aborting observation.`
					);
					chrome.runtime.sendMessage({
						type: "CONTENT_SCRIPT_ERROR",
						message: "Response container not found after max attempts.",
						details: `Selector: ${siteConfig.responseContainerSelector}`,
					});
				}
			}
		}, intervalTime);
	};

	// Ensure the DOM is ready before trying to query selectors
	if (document.readyState === "loading") {
		console.log(
			"content.js:observeChatResponses - Document is 'loading'. Waiting for DOMContentLoaded."
		);
		document.addEventListener("DOMContentLoaded", () => {
			console.log(
				"content.js:observeChatResponses - DOMContentLoaded event fired. Proceeding with finding container."
			);
			attemptToFindContainerAndObserve();
		});
	} else if (
		document.readyState === "interactive" ||
		document.readyState === "complete"
	) {
		console.log(
			`content.js:observeChatResponses - Document is '${document.readyState}'. Proceeding with finding container directly.`
		);
		attemptToFindContainerAndObserve();
	} else {
		// Fallback for any other unexpected readyState, though less likely
		console.warn(
			`content.js:observeChatResponses - Document in unexpected readyState: '${document.readyState}'. Waiting for DOMContentLoaded as a fallback.`
		);
		document.addEventListener("DOMContentLoaded", () => {
			console.log(
				"content.js:observeChatResponses - DOMContentLoaded event fired (fallback). Proceeding with finding container."
			);
			attemptToFindContainerAndObserve();
		});
	}
}

// Listener for messages from other parts of the extension (e.g., popup)
console.log("content.js: Attempting to add runtime.onMessage listener.");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log("content.js: Message received:", request, "from sender:", sender);

	if (request.type === "SEND_CHAT_MESSAGE") {
		if (siteConfig) {
			const success = sendMessageToChatbot(request.text);
			if (success) {
				sendResponse({
					status: "Message successfully processed by content script.",
					text: request.text,
				});
			} else {
				sendResponse({
					status:
						"Error: Content script failed to interact with page elements.",
					text: request.text,
				});
			}
		} else {
			// This case means siteConfig was not loaded for the current hostname
			sendResponse({
				status: "Error: No site configuration loaded in content script.",
				text: request.text,
			});
			// Optionally, still inform background/popup that config is missing for this host
			// This is already done during initializeScript, but can be reinforced here if needed.
			// chrome.runtime.sendMessage({ type: "NO_CONFIG_FOUND", host: window.location.hostname });
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
	// console.log(`content.js:initializeScript - Attempting to load config for hostname: ${hostname}`);

	// Specifically request 'siteConfigurations' key from storage
	chrome.storage.local.get("siteConfigurations", (data) => {
		if (chrome.runtime.lastError) {
			console.error(
				`content.js:initializeScript - Error fetching siteConfigurations: ${chrome.runtime.lastError.message}`
			);
			chrome.runtime.sendMessage({
				type: "CONTENT_SCRIPT_ERROR",
				message: `Error fetching site config: ${chrome.runtime.lastError.message}`,
			});
			return;
		}

		// console.log("content.js:initializeScript - Received data from storage:", data);

		const allSiteConfigs = data.siteConfigurations;
		if (allSiteConfigs && allSiteConfigs[hostname]) {
			siteConfig = allSiteConfigs[hostname];
			console.log(
				`content.js:initializeScript - Configuration FOUND for ${hostname}.` // Simplified log
				// JSON.stringify(siteConfig) // Keep this commented unless deep debugging config values
			);
			observeChatResponses();
		} else {
			console.warn(
				`content.js:initializeScript - No configuration found for ${hostname} within 'siteConfigurations'.`
				// "Full data:", data, // Keep commented unless deep debugging
				// "All configs object:", allSiteConfigs // Keep commented unless deep debugging
			);
			chrome.runtime.sendMessage({ type: "NO_CONFIG_FOUND", host: hostname });
		}
	});
}

// Initialize the script
initializeScript();
