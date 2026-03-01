// Your Master API Gateway URL
const API_URL = "https://lqwpmaxk26.execute-api.ap-south-1.amazonaws.com";

// Get elements from the screen
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const loadingText = document.getElementById('loadingText');
const resetButton = document.getElementById('resetButton');

const riskScoreEl = document.getElementById('riskScore');
const sepsisMarkersEl = document.getElementById('sepsisMarkers');
const ashaInstructionsEl = document.getElementById('ashaInstructions');

// When the user selects a photo...
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Hide upload button, show loading spinner
    uploadSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    
    try {
        // STEP 1: Get Secure Upload URL
        loadingText.innerText = "1/4: Getting secure access...";
        const uploadRes = await fetch(`${API_URL}/upload`, { method: 'POST' });
        if (!uploadRes.ok) throw new Error("Failed to contact the server.");
        const uploadData = await uploadRes.json();
        const { uploadUrl, caseId } = uploadData;

        // STEP 2: Upload Photo directly to S3
        loadingText.innerText = "2/4: Uploading clinical photo securely...";
        const s3Res = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file
        });
        if (!s3Res.ok) throw new Error("Failed to upload photo.");

        // STEP 3: Read Handwriting (Amazon Textract)
        loadingText.innerText = "3/4: AI reading handwriting...";
        const ocrRes = await fetch(`${API_URL}/ocr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId: caseId })
        });
        if (!ocrRes.ok) throw new Error("Failed to read the handwriting.");

        // STEP 4: Clinical Analysis (Claude 3.5 Sonnet v2)
        loadingText.innerText = "4/4: Claude AI generating triage plan...";
        const analyzeRes = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId: caseId })
        });
        if (!analyzeRes.ok) throw new Error("Failed to analyze data.");
        
        const analyzeData = await analyzeRes.json();
        const analysis = analyzeData.analysis;

        // STEP 5: Display the Results!
        loadingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        // Populate Risk Score
        riskScoreEl.innerText = analysis.riskScore || "UNKNOWN";
        if (analysis.riskScore?.toUpperCase() === 'HIGH') {
            riskScoreEl.className = "text-2xl font-black px-4 py-1 rounded-lg bg-red-100 text-red-800";
        } else if (analysis.riskScore?.toUpperCase() === 'MEDIUM') {
            riskScoreEl.className = "text-2xl font-black px-4 py-1 rounded-lg bg-yellow-100 text-yellow-800";
        } else {
            riskScoreEl.className = "text-2xl font-black px-4 py-1 rounded-lg bg-green-100 text-green-800";
        }

        // Populate Sepsis Markers
        sepsisMarkersEl.innerHTML = '';
        if (analysis.sepsisMarkers && analysis.sepsisMarkers.length > 0) {
            analysis.sepsisMarkers.forEach(marker => {
                const li = document.createElement('li');
                li.innerText = marker;
                sepsisMarkersEl.appendChild(li);
            });
        } else {
            sepsisMarkersEl.innerHTML = '<li>No clear sepsis markers detected.</li>';
        }

        // Populate ASHA Instructions
        if (Array.isArray(analysis.ashaInstructions)) {
    ashaInstructionsEl.innerText = analysis.ashaInstructions.join('\n\n');
} else {
    ashaInstructionsEl.innerText = analysis.ashaInstructions || "No instructions provided.";
}

    } catch (error) {
        console.error("Pipeline Error:", error);
        alert("An error occurred: " + error.message + "\nPlease check your connection and try again.");
        // Reset the screen if it fails
        loadingSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        fileInput.value = '';
    }
});

// Reset Button Logic
resetButton.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    fileInput.value = '';
});