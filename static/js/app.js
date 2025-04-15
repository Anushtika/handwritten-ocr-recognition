document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const browseBtn = document.getElementById('browseBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const processBtn = document.getElementById('processBtn');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const uploadPreview = document.getElementById('uploadPreview');
    const imagePreview = document.getElementById('imagePreview');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const processingStatus = document.getElementById('processingStatus');
    const errorMessage = document.getElementById('errorMessage');
    const resultsSection = document.getElementById('resultsSection');
    const resultImage = document.getElementById('resultImage');
    const extractedText = document.getElementById('extractedText');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const newImageBtn = document.getElementById('newImageBtn');

    // Variables
    let selectedFile = null;

    // Event Listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelection);
    cancelBtn.addEventListener('click', resetUpload);
    processBtn.addEventListener('click', processImage);
    copyBtn.addEventListener('click', copyTextToClipboard);
    downloadBtn.addEventListener('click', downloadText);
    newImageBtn.addEventListener('click', resetAll);

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);

    // Functions
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropZone.classList.add('dragover');
    }

    function unhighlight() {
        dropZone.classList.remove('dragover');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelection({ target: fileInput });
        }
    }

    function handleFileSelection(e) {
        // Reset any existing error message
        hideError();
        
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
        if (!validTypes.includes(file.type)) {
            showError('Invalid file type. Please select an image (JPG, PNG, GIF, BMP, TIFF).');
            return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('File is too large. Maximum size is 10MB.');
            return;
        }
        
        selectedFile = file;
        
        // Show image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            resultImage.src = e.target.result; // Also set the result image
            uploadPrompt.classList.add('d-none');
            uploadPreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }

    function resetUpload() {
        uploadPrompt.classList.remove('d-none');
        uploadPreview.classList.add('d-none');
        fileInput.value = '';
        selectedFile = null;
        hideError();
    }

    function processImage() {
        if (!selectedFile) {
            showError('Please select an image first.');
            return;
        }
        
        // Show progress and processing status
        progressContainer.classList.remove('d-none');
        processingStatus.classList.remove('d-none');
        hideError();
        
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        // Simulate progress (for better UX)
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += 5;
                progressBar.style.width = progress + '%';
                progressBar.setAttribute('aria-valuenow', progress);
            }
        }, 200);
        
        // Send request to server
        fetch('/api/process-image', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            progressBar.setAttribute('aria-valuenow', 100);
            
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to process image');
                });
            }
            return response.json();
        })
        .then(data => {
            // Hide processing elements
            processingStatus.classList.add('d-none');
            progressContainer.classList.add('d-none');
            
            // Set the extracted text in the textarea
            extractedText.value = data.enhanced_text || data.original_text || 'No text detected';
            
            // Show results section
            resultsSection.classList.remove('d-none');
        })
        .catch(error => {
            clearInterval(progressInterval);
            processingStatus.classList.add('d-none');
            progressContainer.classList.add('d-none');
            showError(error.message || 'An error occurred during processing');
        });
    }

    function copyTextToClipboard() {
        if (!extractedText.value) {
            showToast('No text to copy!', 'warning');
            return;
        }
        
        extractedText.select();
        document.execCommand('copy');
        
        // Visual feedback for copy
        copyBtn.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
        copyBtn.classList.add('btn-success');
        copyBtn.classList.remove('btn-outline-secondary');
        copyBtn.classList.add('copied-animation');
        
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy me-1"></i>Copy';
            copyBtn.classList.remove('btn-success');
            copyBtn.classList.add('btn-outline-secondary');
            copyBtn.classList.remove('copied-animation');
        }, 2000);
    }

    function downloadText() {
        if (!extractedText.value) {
            showToast('No text to download!', 'warning');
            return;
        }
        
        const blob = new Blob([extractedText.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Create filename from current date/time
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
        a.download = `extracted-text-${timestamp}.txt`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function resetAll() {
        resetUpload();
        resultsSection.classList.add('d-none');
        extractedText.value = '';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    function hideError() {
        errorMessage.textContent = '';
        errorMessage.classList.add('d-none');
    }

    // Toast notification system
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-${type}">
                    <strong class="me-auto text-white">Notification</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        // Show and auto-hide toast
        const toastElement = document.getElementById(toastId);
        setTimeout(() => {
            toastElement.classList.add('show');
            setTimeout(() => {
                toastElement.classList.remove('show');
                setTimeout(() => {
                    toastElement.remove();
                }, 300);
            }, 3000);
        }, 100);
    }
});
