let promptSession = null;
let summarizerSession = null;

// Initialize Summarizer API
async function initializeSummarizerAPI() {
  try {
    const capabilities = await ai.summarizer.capabilities();
    console.log('Summarizer capabilities:', capabilities);

    if (capabilities && capabilities.available !== 'no') {
      summarizerSession = await ai.summarizer.create();

      if (capabilities.available !== 'readily') {
        summarizerSession.addEventListener('downloadprogress', (e) => {
          console.log(`Downloading summarizer model: ${e.loaded}/${e.total} bytes`);
        });

        await summarizerSession.ready;
      }
      console.log('Summarizer API initialized successfully');
    } else {
      console.error('Summarizer API is not available on this device');
    }
  } catch (error) {
    console.error('Error initializing Summarizer API:', error);
    throw error;
  }
}

// Initialize Prompt API
async function initializePromptAPI() {
  try {
    const capabilities = await ai.languageModel.capabilities();
    console.log('Language model capabilities:', capabilities);

    if (capabilities.available !== "no") {
      promptSession = await ai.languageModel.create({
        systemPrompt: "You are a helpful AI assistant.",
        monitor(m) {
          m.addEventListener("downloadprogress", e => {
            console.log(`Downloading language model: ${e.loaded}/${e.total} bytes`);
          });
        }
      });
      console.log('Prompt API initialized successfully');
    } else {
      console.error('Prompt API is not available on this device');
    }
  } catch (error) {
    console.error('Error initializing Prompt API:', error);
    throw error;
  }
}

// Handle messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request)
    .then(sendResponse)
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    });
  return true;
});

async function handleMessage(request) {
  try {
    switch (request.action) {
      case 'promptText':
        return await handlePrompt(request.text);
      case 'summarizeText':
        return await handleSummarize(request.text);
      default:
        throw new Error('Unknown action: ' + request.action);
    }
  } catch (error) {
    console.error(`Error in handleMessage: ${error.message}`);
    throw error;
  }
}

async function handlePrompt(text) {
  if (!promptSession) {
    await initializePromptAPI();
    if (!promptSession) {
      throw new Error('Failed to initialize Prompt API');
    }
  }
  
  try {
    const result = await promptSession.prompt(text);
    return { result };
  } catch (error) {
    console.error('Error in handlePrompt:', error);
    throw new Error(`Prompt API error: ${error.message}`);
  }
}

async function handleSummarize(text) {
  if (!summarizerSession) {
    await initializeSummarizerAPI();
    if (!summarizerSession) {
      throw new Error('Failed to initialize Summarizer API');
    }
  }
  
  try {
    const summary = await summarizerSession.summarize(text);
    return { summary };
  } catch (error) {
    console.error('Error in handleSummarize:', error);
    throw new Error(`Summarizer API error: ${error.message}`);
  }
}

// Initialize APIs when extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated - initializing APIs...');
  try {
    await Promise.all([
      initializePromptAPI(),
      initializeSummarizerAPI()
    ]);
    console.log('APIs initialized successfully');
  } catch (error) {
    console.error('Error during API initialization:', error);
  }
});

// Cleanup when extension is unloaded
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension unloading - cleaning up...');
  if (promptSession) {
    promptSession.destroy();
    promptSession = null;
  }
  if (summarizerSession) {
    summarizerSession.destroy();
    summarizerSession = null;
  }
});