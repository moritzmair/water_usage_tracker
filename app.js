// App State
const state = {
    cameraStream: null,
    db: null,
    chart: null
};

// IndexedDB Setup
const DB_NAME = 'WaterMeterDB';
const DB_VERSION = 1;
const STORE_NAME = 'readings';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            state.db = request.result;
            resolve(state.db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Save Reading to IndexedDB
function saveReading(value) {
    return new Promise((resolve, reject) => {
        const transaction = state.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        
        const reading = {
            value: parseFloat(value),
            timestamp: Date.now(),
            date: new Date().toISOString()
        };
        
        const request = objectStore.add(reading);
        request.onsuccess = () => resolve(reading);
        request.onerror = () => reject(request.error);
    });
}

// Get All Readings
function getAllReadings() {
    return new Promise((resolve, reject) => {
        const transaction = state.db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Delete Reading
function deleteReading(id) {
    return new Promise((resolve, reject) => {
        const transaction = state.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Camera Functions
async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
        
        state.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = document.getElementById('camera-preview');
        videoElement.srcObject = state.cameraStream;
        
        document.getElementById('start-camera-btn').style.display = 'none';
        document.getElementById('capture-btn').style.display = 'block';
        document.getElementById('stop-camera-btn').style.display = 'block';
    } catch (error) {
        console.error('Camera error:', error);
        alert('Kamerazugriff fehlgeschlagen. Bitte Berechtigungen prüfen.');
    }
}

function stopCamera() {
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
        state.cameraStream = null;
        
        const videoElement = document.getElementById('camera-preview');
        videoElement.srcObject = null;
        
        document.getElementById('start-camera-btn').style.display = 'block';
        document.getElementById('capture-btn').style.display = 'none';
        document.getElementById('stop-camera-btn').style.display = 'none';
    }
}

async function capturePhoto() {
    const videoElement = document.getElementById('camera-preview');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/png');
    
    // Show loading overlay
    document.getElementById('loading-overlay').style.display = 'flex';
    
    // Perform OCR
    try {
        const result = await performOCR(imageData);
        document.getElementById('loading-overlay').style.display = 'none';
        
        // Extract numbers from OCR result
        const numbers = extractMeterReading(result);
        
        if (numbers) {
            document.getElementById('meter-reading').value = numbers;
            document.getElementById('ocr-result').style.display = 'block';
        } else {
            alert('Kein Zählerstand erkannt. Bitte manuell eingeben.');
        }
    } catch (error) {
        document.getElementById('loading-overlay').style.display = 'none';
        console.error('OCR error:', error);
        alert('OCR fehlgeschlagen. Bitte manuell eingeben.');
    }
}

// OCR Function
async function performOCR(imageData) {
    const worker = await Tesseract.createWorker('deu', 1, {
        logger: m => console.log(m)
    });
    
    const { data: { text } } = await worker.recognize(imageData);
    await worker.terminate();
    
    return text;
}

// Extract meter reading from OCR text
function extractMeterReading(text) {
    // Look for numbers in the format: XXXXX.XXX or XXXXX,XXX
    const patterns = [
        /(\d{1,6}[.,]\d{1,3})/g,
        /(\d{1,6})/g
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            // Get the largest number found
            const numbers = matches.map(m => parseFloat(m.replace(',', '.')));
            const maxNumber = Math.max(...numbers);
            return maxNumber.toFixed(3);
        }
    }
    
    return null;
}

// Save Reading Handler
async function handleSaveReading(value) {
    if (!value || isNaN(value) || value <= 0) {
        alert('Bitte gültigen Zählerstand eingeben.');
        return;
    }
    
    try {
        await saveReading(value);
        alert('Zählerstand gespeichert!');
        
        // Reset UI
        document.getElementById('meter-reading').value = '';
        document.getElementById('ocr-result').style.display = 'none';
        stopCamera();
        
        // Refresh displays
        await updateReadingsList();
        await updateChart();
    } catch (error) {
        console.error('Save error:', error);
        alert('Fehler beim Speichern.');
    }
}

// Update Readings List
async function updateReadingsList() {
    const readings = await getAllReadings();
    const container = document.getElementById('readings-list');
    
    if (readings.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Noch keine Messungen vorhanden.</p>';
        return;
    }
    
    // Sort by timestamp descending
    readings.sort((a, b) => b.timestamp - a.timestamp);
    
    container.innerHTML = '';
    
    readings.forEach((reading, index) => {
        const date = new Date(reading.timestamp);
        const formattedDate = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Calculate usage
        let usageText = '';
        if (index < readings.length - 1) {
            const usage = reading.value - readings[index + 1].value;
            if (usage > 0) {
                usageText = `Verbrauch: ${usage.toFixed(3)} m³`;
            }
        }
        
        const item = document.createElement('div');
        item.className = 'reading-item';
        item.innerHTML = `
            <div class="reading-info">
                <div class="reading-value">${reading.value.toFixed(3)} m³</div>
                <div class="reading-time">${formattedDate}</div>
                ${usageText ? `<div class="reading-usage">${usageText}</div>` : ''}
            </div>
            <button class="delete-btn" onclick="handleDeleteReading(${reading.id})">🗑️</button>
        `;
        
        container.appendChild(item);
    });
}

// Delete Reading Handler
async function handleDeleteReading(id) {
    if (confirm('Messung wirklich löschen?')) {
        try {
            await deleteReading(id);
            await updateReadingsList();
            await updateChart();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Fehler beim Löschen.');
        }
    }
}

// Chart Functions
async function updateChart() {
    const chartType = document.getElementById('chart-type').value;
    const readings = await getAllReadings();
    
    if (readings.length < 2) {
        return;
    }
    
    // Sort by timestamp ascending
    readings.sort((a, b) => a.timestamp - b.timestamp);
    
    let chartData;
    
    if (chartType === 'daily') {
        chartData = calculateHourlyUsage(readings, 'today');
    } else if (chartType === 'weekly') {
        chartData = calculateDailyUsage(readings, 7);
    } else if (chartType === 'hourly-week') {
        chartData = calculateHourlyByDayOfWeek(readings);
    }
    
    renderChart(chartData);
}

// Calculate hourly usage for a specific day
function calculateHourlyUsage(readings, day) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const todayReadings = readings.filter(r => {
        const date = new Date(r.timestamp);
        return date >= startOfDay && date <= endOfDay;
    });
    
    const hourlyUsage = new Array(24).fill(0);
    
    for (let i = 0; i < todayReadings.length - 1; i++) {
        const current = todayReadings[i];
        const next = todayReadings[i + 1];
        const usage = next.value - current.value;
        const hour = new Date(next.timestamp).getHours();
        
        if (usage > 0) {
            hourlyUsage[hour] += usage;
        }
    }
    
    return {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        data: hourlyUsage,
        label: 'Wasserverbrauch heute (m³)'
    };
}

// Calculate daily usage for last N days
function calculateDailyUsage(readings, days) {
    const now = new Date();
    const dailyUsage = new Array(days).fill(0);
    const labels = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });
        labels.push(dayName);
        
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        
        const dayReadings = readings.filter(r => {
            const rDate = new Date(r.timestamp);
            return rDate >= startOfDay && rDate <= endOfDay;
        });
        
        if (dayReadings.length >= 2) {
            const firstReading = dayReadings[0];
            const lastReading = dayReadings[dayReadings.length - 1];
            const usage = lastReading.value - firstReading.value;
            dailyUsage[days - 1 - i] = Math.max(0, usage);
        }
    }
    
    return {
        labels: labels,
        data: dailyUsage,
        label: 'Wasserverbrauch (m³)'
    };
}

// Calculate average hourly usage by day of week
function calculateHourlyByDayOfWeek(readings) {
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const weeklyData = new Array(7).fill(0).map(() => new Array(24).fill(0));
    const counts = new Array(7).fill(0).map(() => new Array(24).fill(0));
    
    for (let i = 0; i < readings.length - 1; i++) {
        const current = readings[i];
        const next = readings[i + 1];
        const usage = next.value - current.value;
        
        if (usage > 0) {
            const date = new Date(next.timestamp);
            const dayOfWeek = date.getDay();
            const hour = date.getHours();
            
            weeklyData[dayOfWeek][hour] += usage;
            counts[dayOfWeek][hour]++;
        }
    }
    
    // Calculate averages
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            if (counts[day][hour] > 0) {
                weeklyData[day][hour] /= counts[day][hour];
            }
        }
    }
    
    // Find peak usage day and hour
    let maxUsage = 0;
    let maxDay = 0;
    
    const dailyTotals = weeklyData.map((hours, dayIndex) => {
        const total = hours.reduce((sum, h) => sum + h, 0);
        if (total > maxUsage) {
            maxUsage = total;
            maxDay = dayIndex;
        }
        return total;
    });
    
    return {
        labels: dayNames,
        data: dailyTotals,
        label: 'Durchschn. Verbrauch pro Wochentag (m³)'
    };
}

// Render Chart
function renderChart(chartData) {
    const ctx = document.getElementById('usage-chart').getContext('2d');
    
    if (state.chart) {
        state.chart.destroy();
    }
    
    state.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: chartData.label,
                data: chartData.data,
                backgroundColor: 'rgba(33, 150, 243, 0.6)',
                borderColor: 'rgba(33, 150, 243, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'm³'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Scroll to appropriate section
            if (targetSection === 'camera') {
                sections[0].scrollIntoView({ behavior: 'smooth' });
            } else if (targetSection === 'chart') {
                sections[2].scrollIntoView({ behavior: 'smooth' });
            } else if (targetSection === 'history') {
                sections[3].scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Service Worker Registration
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// Initialize App
async function initApp() {
    try {
        await initDB();
        await registerServiceWorker();
        
        // Event Listeners
        document.getElementById('start-camera-btn').addEventListener('click', startCamera);
        document.getElementById('stop-camera-btn').addEventListener('click', stopCamera);
        document.getElementById('capture-btn').addEventListener('click', capturePhoto);
        
        document.getElementById('save-reading-btn').addEventListener('click', () => {
            const value = document.getElementById('meter-reading').value;
            handleSaveReading(value);
        });
        
        document.getElementById('save-manual-btn').addEventListener('click', () => {
            const value = document.getElementById('manual-reading').value;
            handleSaveReading(value);
        });
        
        document.getElementById('chart-type').addEventListener('change', updateChart);
        
        setupNavigation();
        
        // Initial load
        await updateReadingsList();
        await updateChart();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('App initialization error:', error);
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
