// DOM Elements
const fileUpload = document.getElementById('file-upload');
const workflowFile = document.getElementById('workflow-file');
const browseBtn = document.getElementById('browse-btn');
const fileName = document.getElementById('file-name');
const customerEmail = document.getElementById('customer-email');
const customerRequest = document.getElementById('customer-request');
const urgentRequest = document.getElementById('urgent-request');
const generateBtn = document.getElementById('generate-btn');
const spinner = document.getElementById('spinner');
const btnText = document.getElementById('btn-text');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const resultsSection = document.getElementById('results-section');
const loadingResults = document.getElementById('loading-results');
const quoteResults = document.getElementById('quote-results');
const totalPrice = document.getElementById('total-price');
const quoteDescription = document.getElementById('quote-description');
const quoteItemsBody = document.getElementById('quote-items-body');
const confidenceBadge = document.getElementById('confidence-badge');
const reviewSection = document.getElementById('review-section');
const downloadPdf = document.getElementById('download-pdf');
const downloadCsv = document.getElementById('download-csv');
const sendReview = document.getElementById('send-review');

// State
let currentFile = null;
let currentQuote = null;
let resultId = null; // Store the result ID if viewing a saved result
let chatMessages = []; // Store chat messages
let approvalCheckInterval = null; // Store interval for checking approval status

// Check if we're viewing a saved result
function checkForSavedResult() {
    // Get the ID from the URL path
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'n8n-quote-result') {
        resultId = pathParts[pathParts.length - 1];
        loadSavedResult(resultId);
    }
}

// Check if a quote has been approved
async function checkApprovalStatus(quoteId) {
    try {
        const response = await fetch(`/api/n8n-quote/project-quotes/${quoteId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                // If the quote is approved, show notification and display results
                if (data.data.status === 'approved') {
                    // Stop checking
                    if (approvalCheckInterval) {
                        clearInterval(approvalCheckInterval);
                        approvalCheckInterval = null;
                    }
                    
                    // Show notification that can be clicked to open project section
                    const resultUrl = `${window.location.origin}/n8n-quote-result/${quoteId}`;
                    showSuccess('Project approved successfully! Click here to view the project.');
                    
                    // Make the success message clickable to open the project section
                    successMessage.classList.add('clickable');
                    successMessage.onclick = () => {
                        window.open(resultUrl, '_blank');
                    };
                    
                    // Remove waiting message if it exists
                    const waitingMessage = document.getElementById('waiting-approval-message');
                    if (waitingMessage) {
                        waitingMessage.remove();
                    }
                    
                    // Update current quote
                    currentQuote = {
                        customer_email: data.data.customerEmail,
                        total_price: data.data.totalPrice,
                        total_delta: data.data.modificationsPrice,
                        confidence: 0.95,
                        items: data.data.nodes.map(node => ({
                            node_label: node.nodeLabel,
                            node_type: node.nodeType,
                            base_price: node.basePrice,
                            total_price: node.totalPrice,
                            requires_manual_review: node.requiresManualReview
                        })),
                        review_required: false,
                        review_reasons: [],
                        created_at: data.data.createdAt
                    };
                }
            }
        }
    } catch (error) {
        console.error('Error checking approval status:', error);
    }
}

// Load saved result data
async function loadSavedResult(id) {
    try {
        console.log('Loading saved result with ID:', id);
        showLoading();
        
        const response = await fetch(`/api/n8n-quote/chats/${id}`);
        if (!response.ok) {
            throw new Error('Failed to load saved result');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error('Failed to load saved result');
        }
        
        // Convert the saved chat data to quote format
        const quoteData = {
            customer_email: data.data.customerEmail || '',
            total_price: data.data.totalPrice || 0,
            total_delta: data.data.totalPrice - (data.data.basePrice || 0),
            confidence: 0.95, // Default confidence
            items: data.data.items || [],
            review_required: false,
            review_reasons: [],
            created_at: data.data.createdAt || new Date().toISOString()
        };
        
        // Display the saved result
        // Commented out to fulfill user request: don't show quote results
        // displayQuoteResults(quoteData);
        currentQuote = quoteData;
        
        // Hide the form section since we're viewing a saved result
        document.querySelector('.form-section').style.display = 'none';
        
        // Ensure results section stays hidden as per user request
        resultsSection.style.display = 'none';
        
        hideLoading();
    } catch (error) {
        console.error('Error loading saved result:', error);
        hideLoading();
        showError(`Error loading saved result: ${error.message}`);
    }
}

// Save chat data
async function saveChatData(quoteData) {
    try {
        // Prepare chat data
        const chatData = {
            workflowId: 'workflow-' + Date.now(), // Generate a unique workflow ID
            fileName: currentFile ? currentFile.name : 'unknown-workflow.json',
            fileSize: currentFile ? currentFile.size : 0,
            messages: chatMessages,
            modifications: customerRequest.value,
            totalPrice: quoteData.total_price,
            basePrice: quoteData.total_price - (quoteData.total_delta || 0),
            modificationsPrice: quoteData.total_delta || 0,
            items: quoteData.items.map(item => ({
                nodeId: item.node_id || item.nodeId,
                nodeLabel: item.node_label || item.nodeLabel || 'Unknown',
                nodeType: item.node_type || item.nodeType || 'Unknown',
                basePrice: item.base_price || item.basePrice || 0,
                totalPrice: item.total_price || item.totalPrice || 0
            })),
            customerEmail: quoteData.customer_email
        };
        
        // Send chat data to backend
        const response = await fetch('/api/n8n-quote/save-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to save chat data:', errorData);
            return null;
        }
        
        const result = await response.json();
        console.log('Chat data saved successfully:', result);
        return result.data; // Return the saved chat data
    } catch (error) {
        console.error('Error saving chat data:', error);
        return null;
    }
}

// Event Listeners
browseBtn.addEventListener('click', () => {
    workflowFile.click();
});

workflowFile.addEventListener('change', handleFileSelect);

fileUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUpload.classList.add('dragover');
});

fileUpload.addEventListener('dragleave', () => {
    fileUpload.classList.remove('dragover');
});

fileUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUpload.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
        handleFileSelection(e.dataTransfer.files[0]);
    }
});

generateBtn.addEventListener('click', generateQuote);

downloadPdf.addEventListener('click', downloadPDF);
downloadCsv.addEventListener('click', downloadCSV);
sendReview.addEventListener('click', sendToReview);

// File handling functions
function handleFileSelect(e) {
    if (e.target.files.length) {
        handleFileSelection(e.target.files[0]);
    }
}

function handleFileSelection(file) {
    // Validate file type
    if (!file.name.endsWith('.json')) {
        showError('Please select a JSON file (.json)');
        return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        return;
    }
    
    currentFile = file;
    fileName.textContent = file.name;
    fileName.style.display = 'block';
    hideError();
}

// Main quote generation function
async function generateQuote() {
    // Don't allow generation if we're viewing a saved result
    if (resultId) {
        return;
    }
    
    try {
        // Validate inputs
        if (!currentFile) {
            showError('Please select an n8n workflow JSON file');
            return;
        }
        
        const email = customerEmail.value.trim();
        if (!email) {
            showError('Please enter a customer email');
            return;
        }
        
        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        // Show loading state
        showLoading();
        
        // Generate quote using actual backend API
        const quoteData = await generateQuoteWithAPI(currentFile, email, customerRequest.value, urgentRequest.checked);
        
        // Save chat data
        const savedChat = await saveChatData(quoteData);
        if (savedChat) {
            // Check if the quote requires admin approval
            const requiresApproval = quoteData.items && quoteData.items.some(item => 
                (item.requires_manual_review || (item.base_price === 0))
            );
            
            // Always show waiting for admin approval message to fulfill user request
            // Don't display quote results immediately
            showSuccess('Project submitted successfully! Waiting for admin approval...');
            
            // Hide the results section and show a waiting message instead
            resultsSection.style.display = 'none';
            
            // Remove any existing waiting message
            const existingWaitingMessage = document.getElementById('waiting-approval-message');
            if (existingWaitingMessage) {
                existingWaitingMessage.remove();
            }
            
            // Create and show waiting approval message
            const waitingMessage = document.createElement('div');
            waitingMessage.id = 'waiting-approval-message';
            waitingMessage.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">⏳</div>
                    <h3 style="color: #ffc107; margin-bottom: 15px;">Waiting for Admin Approval</h3>
                    <p style="color: #6c757d; font-size: 1.1rem;">
                        Your project has been submitted and is pending admin approval.
                    </p>
                    <div style="margin-top: 20px; font-size: 0.9rem; color: #adb5bd;">
                        Project ID: ${savedChat._id}
                    </div>
                </div>
            `;
            document.querySelector('.form-section').parentNode.insertBefore(waitingMessage, resultsSection);
            
            // Start checking for approval status
            if (approvalCheckInterval) {
                clearInterval(approvalCheckInterval);
            }
            approvalCheckInterval = setInterval(() => {
                checkApprovalStatus(savedChat._id);
            }, 10000); // Check every 10 seconds
        } else {
            // If save failed, show error but don't display results
            showError('Project processed but could not be saved.');
            hideLoading();
            return;
        }
        
        // Store quote data for downloads
        currentQuote = quoteData;
        
        hideLoading();
    } catch (error) {
        console.error('Error in generateQuote:', error);
        hideLoading();
        showError(`Error generating quote: ${error.message}`);
    }
}

// Generate quote using backend API
async function generateQuoteWithAPI(file, email, request, urgent) {
    try {
        console.log('Starting quote generation with API');
        // Step 1: Validate the workflow
        const validateFormData = new FormData();
        validateFormData.append('workflow', file);
        
        console.log('Sending validation request');
        const validateResponse = await fetch('/api/n8n-quote/validate', {
            method: 'POST',
            body: validateFormData
        });
        
        if (!validateResponse.ok) {
            const errorData = await validateResponse.json().catch(() => ({}));
            throw new Error(`Validation failed: ${errorData.message || validateResponse.statusText}`);
        }
        
        const validateData = await validateResponse.json();
        console.log('Validation response:', validateData);
        
        if (!validateData.success) {
            throw new Error(validateData.message || 'Invalid n8n workflow file');
        }
        
        // Step 2: Generate price list
        const priceListFormData = new FormData();
        priceListFormData.append('workflow', file);
        
        console.log('Sending price list request');
        const priceListResponse = await fetch('/api/n8n-quote/price-list', {
            method: 'POST',
            body: priceListFormData
        });
        
        if (!priceListResponse.ok) {
            const errorData = await priceListResponse.json().catch(() => ({}));
            throw new Error(`Price list generation failed: ${errorData.message || priceListResponse.statusText}`);
        }
        
        const priceListData = await priceListResponse.json();
        console.log('Price list response:', priceListData);
        
        if (!priceListData.success) {
            throw new Error(priceListData.message || 'Failed to generate price list');
        }
        
        // Step 3: Build compact payload for LLM
        const payloadFormData = new FormData();
        payloadFormData.append('workflow', file);
        payloadFormData.append('customer_text', request);
        
        console.log('Sending compact payload request');
        const payloadResponse = await fetch('/api/n8n-quote/compact-payload', {
            method: 'POST',
            body: payloadFormData
        });
        
        if (!payloadResponse.ok) {
            const errorData = await payloadResponse.json().catch(() => ({}));
            throw new Error(`Payload building failed: ${errorData.message || payloadResponse.statusText}`);
        }
        
        const payloadData = await payloadResponse.json();
        console.log('Payload response:', payloadData);
        
        if (!payloadData.success) {
            throw new Error(payloadData.message || 'Failed to build LLM payload');
        }
        
        // Step 4: Build prompt for LLM
        const promptResponse = await fetch('/api/n8n-quote/build-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadData.data)
        });
        
        if (!promptResponse.ok) {
            const errorData = await promptResponse.json().catch(() => ({}));
            throw new Error(`Prompt building failed: ${errorData.message || promptResponse.statusText}`);
        }
        
        const promptData = await promptResponse.json();
        console.log('Prompt response:', promptData);
        
        if (!promptData.success) {
            throw new Error(promptData.message || 'Failed to build LLM prompt');
        }
        
        // For now, we'll create a simulated quote since we don't have the actual LLM integration
        // In a real implementation, you would send the prompt to your LLM service
        const simulatedQuote = {
            customer_email: email,
            total_price: priceListData.data.total_price || 0,
            total_delta: priceListData.data.total_delta || 0,
            confidence: 0.95,
            items: priceListData.data.items || [],
            review_required: false,
            review_reasons: [],
            created_at: new Date().toISOString()
        };
        
        console.log('Simulated quote created:', simulatedQuote);
        
        // Check if review is required (simulated)
        const reviewRequired = simulatedQuote.confidence < 0.8 || 
                              (simulatedQuote.total_price > 1000) ||
                              (simulatedQuote.items && simulatedQuote.items.some(item => (item.confidence || 1.0) < 0.7));
        
        if (reviewRequired) {
            simulatedQuote.review_required = true;
            simulatedQuote.review_reasons = ['low_confidence', 'high_value'];
        }
        
        console.log('Final quote:', simulatedQuote);
        return simulatedQuote;
    } catch (error) {
        console.error('Error in generateQuoteWithAPI:', error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Unable to connect to the server. Please make sure the backend is running.');
        }
        throw error;
    }
}

// Download functions
function downloadPDF() {
    if (!currentQuote) return;
    
    // In a real implementation, this would download the actual PDF
    alert('PDF download would start now. In a real implementation, this would generate and download a PDF file.');
    
    // Simulate download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentQuote, null, 2)));
    element.setAttribute('download', 'n8n-quote.pdf');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function downloadCSV() {
    if (!currentQuote) return;
    
    // Create CSV content
    let csvContent = 'Item,Type,Base Price,Modifiers,Total Price\n';
    
    currentQuote.items.forEach(item => {
        const modifiers = item.modifiers ? item.modifiers.map(m => `${m.name}:${m.value}`).join(';') : '';
        csvContent += `"${item.node_label}","${item.node_type}",${item.base_price},"${modifiers}",${item.total_price}\n`;
    });
    
    // Add summary row
    csvContent += `\nTotal Price,${currentQuote.total_price}\n`;
    csvContent += `Confidence,${(currentQuote.confidence * 100).toFixed(0)}%\n`;
    
    // Download CSV
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', 'n8n-quote.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function sendToReview() {
    if (!currentQuote) return;
    
    // In a real implementation, this would send the quote to the review queue
    alert('Quote sent to review queue. In a real implementation, this would notify reviewers.');
    showSuccess('Quote sent to review queue successfully!');
}

// Utility functions
function showLoading() {
    console.log('Showing loading state');
    generateBtn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Generating Quote...';
    loadingResults.style.display = 'block';
    quoteResults.style.display = 'none';
    console.log('Finished showing loading state');
}

function hideLoading() {
    console.log('Hiding loading state');
    generateBtn.disabled = false;
    spinner.style.display = 'none';
    btnText.textContent = 'Generate Quote';
    loadingResults.style.display = 'none';
    // Ensure results section stays hidden as per user request
    resultsSection.style.display = 'none';
    console.log('Finished hiding loading state');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    // Reset cursor and click handler
    successMessage.classList.remove('clickable');
    successMessage.onclick = null;
}

function hideError() {
    errorMessage.style.display = 'none';
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Clean up interval on page unload
window.addEventListener('beforeunload', () => {
    if (approvalCheckInterval) {
        clearInterval(approvalCheckInterval);
        approvalCheckInterval = null;
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer if needed
    console.log('n8n Quote Generator App Initialized');
    // Check if we're viewing a saved result
    checkForSavedResult();
});