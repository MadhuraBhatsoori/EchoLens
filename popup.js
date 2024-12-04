document.addEventListener('DOMContentLoaded', async () => {
  const resultDiv = document.getElementById('result');
  const statusDiv = document.getElementById('status');
  const selectedTextDiv = document.getElementById('selectedText');
  const promptButton = document.getElementById('sendPrompt');
  const summarizeButton = document.getElementById('summarize');
  const translateButton = document.getElementById('translate');
  const languageSelect = document.getElementById('targetLanguage');
  const downloadButton = document.getElementById('download');
  const addToNotesButton = document.getElementById('addToNotes');
  const clearButton = document.getElementById('clear');

  let notes = ''; // To store appended results

  function updateStatus(message) {
    statusDiv.textContent = message;
  }

  function showResult(content) {
    resultDiv.textContent = content;
    downloadButton.disabled = false;
    addToNotesButton.disabled = false;
    clearButton.disabled = false;
  }

  function downloadResult(content, fileName) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Get selected text when popup opens
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
  const selectedText = response?.selection || '';

  // Update UI with selected text
  selectedTextDiv.textContent = selectedText || 'No text selected';
  promptButton.disabled = !selectedText;
  summarizeButton.disabled = !selectedText;

  // Handle generate response button click
  promptButton.addEventListener('click', async () => {
    updateStatus('Processing prompt...');
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'promptText',
        text: selectedText
      });

      if (response.error) {
        updateStatus(`Error: ${response.error}`);
      } else {
        updateStatus('Response generated successfully');
        showResult(response.result);
      }
    } catch (error) {
      updateStatus(`Error: ${error.message}`);
    }
  });

  // Handle summarize button click
  summarizeButton.addEventListener('click', async () => {
    updateStatus('Summarizing...');
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'summarizeText',
        text: selectedText
      });

      if (response.error) {
        updateStatus(`Error: ${response.error}`);
      } else {
        updateStatus('Summary generated successfully');
        showResult(response.summary);
      }
    } catch (error) {
      updateStatus(`Error: ${error.message}`);
    }
  });

  // Handle download button click
  downloadButton.addEventListener('click', () => {
    downloadResult(notes || resultDiv.textContent, 'result.txt');
  });

  // Handle add to notes button click
  addToNotesButton.addEventListener('click', () => {
    notes += resultDiv.textContent + '\n\n'; // Append result to notes
    updateStatus('Added to notes');
  });

  // Handle clear button click
  clearButton.addEventListener('click', () => {
    resultDiv.textContent = '';
    updateStatus('Output cleared');
    addToNotesButton.disabled = true;
    clearButton.disabled = true;
  });
});
