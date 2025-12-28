// App State
const state = {
    cameraStream: null,
    db: null,
    chart: null,
    autoCapture: {
        active: false,
        interval: null,
        timer: null,
        nextCaptureTime: null,
        intervalMinutes: 60,
        successCount: 0
    },
    wakeLock: null,
    settings: {
        keepScreenOn: true,
        soundEnabled: false,
        flashIndicator: true
    }
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
function saveReading(value, isAuto = false) {
    return new Promise((resolve, reject) => {
        const transaction = state.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        
        const reading = {
            value: parseFloat(value),
            timestamp: Date.now(),
            date: new Date().toISOString(),
            auto: isAuto
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

// Wake Lock API - Keep Screen On
async function requestWakeLock() {
    if ('wakeLock' in navigator && state.settings.keepScreenOn) {
        try {
            state.wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock activated');
            
            state.wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released');
            });
            
            return true;
        } catch (err) {
            console.error('Wake Lock error:', err);
            return false;
        }
    }
    return false;
}

async function releaseWakeLock() {
    if (state.wakeLock) {
        await state.wakeLock.release();
        state.wakeLock = null;
    }
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
        
        console.log('Camera started');
        return true;
    } catch (error) {
        console.error('Camera error:', error);
        alert('Kamerazugriff fehlgeschlagen. Bitte Berechtigungen prüfen.');
        return false;
    }
}

function stopCamera() {
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
        state.cameraStream = null;
        
        const videoElement = document.getElementById('camera-preview');
        videoElement.srcObject = null;
    }
}

// Auto-Capture Functions
async function startAutoCapture() {
    const intervalMinutes = parseInt(document.getElementById('capture-interval').value);
    state.autoCapture.intervalMinutes = intervalMinutes;
    
    // Request wake lock
    await requestWakeLock();
    
    // Start camera
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
        return;
    }
    
    // Update UI
    state.autoCapture.active = true;
    state.autoCapture.successCount = 0;
    document.getElementById('start-auto-btn').style.display = 'none';
    document.getElementById('stop-auto-btn').style.display = 'block';
    document.getElementById('auto-status').textContent = 'Aktiv';
    document.getElementById('auto-status').className = 'status-value status-active';
    document.getElementById('capture-interval').disabled = true;
    
    // Show recording indicator
    if (state.settings.flashIndicator) {
        document.getElementById('capture-indicator').classList.add('recording');
    }
    
    // Show battery warning
    checkBatteryStatus();
    
    // Perform first capture immediately (after 1 second for camera to initialize)
    setTimeout(async () => {
        await performAutoCapture();
        // Then start regular interval-based capture loop
        scheduleNextCapture();
    }, 1000);
    
    console.log(`Auto-capture started with ${intervalMinutes} minute interval`);
}

function stopAutoCapture() {
    state.autoCapture.active = false;
    
    // Clear timers
    if (state.autoCapture.timer) {
        clearTimeout(state.autoCapture.timer);
        state.autoCapture.timer = null;
    }
    
    // Release wake lock
    releaseWakeLock();
    
    // Stop camera
    stopCamera();
    
    // Update UI
    document.getElementById('start-auto-btn').style.display = 'block';
    document.getElementById('stop-auto-btn').style.display = 'none';
    document.getElementById('auto-status').textContent = 'Inaktiv';
    document.getElementById('auto-status').className = 'status-value status-inactive';
    document.getElementById('next-capture').textContent = '---';
    document.getElementById('capture-interval').disabled = false;
    document.getElementById('capture-indicator').classList.remove('recording');
    
    console.log('Auto-capture stopped');
}

function scheduleNextCapture() {
    if (!state.autoCapture.active) return;
    
    const intervalMs = state.autoCapture.intervalMinutes * 60 * 1000;
    state.autoCapture.nextCaptureTime = Date.now() + intervalMs;
    
    updateNextCaptureDisplay();
    
    state.autoCapture.timer = setTimeout(async () => {
        await performAutoCapture();
        scheduleNextCapture();
    }, intervalMs);
}

function updateNextCaptureDisplay() {
    if (!state.autoCapture.active) return;
    
    const update = () => {
        if (!state.autoCapture.active) return;
        
        const now = Date.now();
        const remaining = state.autoCapture.nextCaptureTime - now;
        
        if (remaining <= 0) {
            document.getElementById('next-capture').textContent = 'Läuft...';
        } else {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            document.getElementById('next-capture').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')} min`;
        }
        
        if (state.autoCapture.active) {
            setTimeout(update, 1000);
        }
    };
    
    update();
}

async function performAutoCapture() {
    if (!state.autoCapture.active) return;
    
    console.log('Performing auto-capture...');
    
    // Visual indicator
    if (state.settings.flashIndicator) {
        const indicator = document.getElementById('capture-indicator');
        indicator.classList.add('capturing');
        setTimeout(() => indicator.classList.remove('capturing'), 500);
    }
    
    // Sound indicator
    if (state.settings.soundEnabled) {
        playBeep();
    }
    
    try {
        // Capture image
        const videoElement = document.getElementById('camera-preview');
        const canvas = document.getElementById('camera-canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/png');
        
        // Perform OCR
        const result = await performOCR(imageData);
        const reading = extractMeterReading(result);
        
        if (reading && parseFloat(reading) > 0) {
            // Save reading
            await saveReading(reading, true);
            state.autoCapture.successCount++;
            
            // Update UI
            document.getElementById('last-reading').textContent = `${parseFloat(reading).toFixed(3)} m³`;
            document.getElementById('success-count').textContent = state.autoCapture.successCount;
            
            // Refresh displays
            await updateReadingsList();
            await updateChart();
            
            console.log(`Auto-capture successful: ${reading} m³`);
        } else {
            console.warn('Auto-capture: No valid reading detected');
        }
    } catch (error) {
        console.error('Auto-capture error:', error);
    }
}

// OCR Function
async function performOCR(imageData) {
    // Check API configuration
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Kein OpenRouter API Key konfiguriert. Bitte in den Einstellungen eingeben.');
    }

    try {
        // Convert data URL to base64
        const base64Image = imageData.split(',')[1];

        // Call OpenRouter API
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Wasserzähler Auto-Capture'
            },
            body: JSON.stringify({
                model: getModel(),
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: API_CONFIG.systemPrompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/png;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 100,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Fehler: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content || '';
        
        return aiResponse;
    } catch (error) {
        console.error('OpenRouter API Error:', error);
        throw error;
    }
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
            
            // Validate: water meter readings are typically < 100000
            if (maxNumber > 0 && maxNumber < 100000) {
                return maxNumber.toFixed(3);
            }
        }
    }
    
    return null;
}

// Battery Status
async function checkBatteryStatus() {
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            const warningBox = document.getElementById('battery-warning');
            
            const updateBatteryWarning = () => {
                if (!battery.charging && battery.level < 0.8) {
                    warningBox.style.display = 'block';
                } else if (!battery.charging) {
                    warningBox.style.display = 'block';
                    warningBox.textContent = '⚡ Bitte Smartphone an Netzteil anschließen!';
                } else {
                    warningBox.style.display = 'none';
                }
            };
            
            updateBatteryWarning();
            battery.addEventListener('chargingchange', updateBatteryWarning);
            battery.addEventListener('levelchange', updateBatteryWarning);
        } catch (error) {
            console.warn('Battery API not available:', error);
        }
    }
}

// Sound Beep
function playBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Save Reading Handler
async function handleSaveReading(value) {
    if (!value || isNaN(value) || value <= 0) {
        alert('Bitte gültigen Zählerstand eingeben.');
        return;
    }
    
    try {
        await saveReading(value, false);
        alert('Zählerstand gespeichert!');
        
        // Reset UI
        document.getElementById('manual-reading').value = '';
        
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
        
        const autoIndicator = reading.auto ? ' 🔄' : '';
        
        const item = document.createElement('div');
        item.className = 'reading-item';
        item.innerHTML = `
            <div class="reading-info">
                <div class="reading-value">${reading.value.toFixed(3)} m³${autoIndicator}</div>
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
    
    // Calculate daily totals
    const dailyTotals = weeklyData.map(hours => 
        hours.reduce((sum, h) => sum + h, 0)
    );
    
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

// Pump Recommendation Functions
function calculatePumpSchedule(coveragePercentage) {
    return new Promise(async (resolve) => {
        const readings = await getAllReadings();
        
        if (readings.length < 10) {
            alert('Nicht genügend Daten. Bitte sammle mindestens 2 Wochen Daten.');
            resolve(null);
            return;
        }
        
        // Sort readings by timestamp
        readings.sort((a, b) => a.timestamp - b.timestamp);
        
        // Calculate hourly usage for each day of week
        const weekdayHourlyUsage = new Array(7).fill(0).map(() => new Array(24).fill(0));
        const weekdayHourlyCounts = new Array(7).fill(0).map(() => new Array(24).fill(0));
        
        for (let i = 0; i < readings.length - 1; i++) {
            const current = readings[i];
            const next = readings[i + 1];
            const usage = next.value - current.value;
            
            if (usage > 0) {
                const date = new Date(next.timestamp);
                const dayOfWeek = date.getDay();
                const hour = date.getHours();
                
                weekdayHourlyUsage[dayOfWeek][hour] += usage;
                weekdayHourlyCounts[dayOfWeek][hour]++;
            }
        }
        
        // Calculate averages
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                if (weekdayHourlyCounts[day][hour] > 0) {
                    weekdayHourlyUsage[day][hour] /= weekdayHourlyCounts[day][hour];
                }
            }
        }
        
        // Determine threshold based on coverage percentage
        const allUsageValues = [];
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                if (weekdayHourlyUsage[day][hour] > 0) {
                    allUsageValues.push(weekdayHourlyUsage[day][hour]);
                }
            }
        }
        
        allUsageValues.sort((a, b) => b - a);
        
        // Calculate threshold to cover X% of usage
        const targetCoverage = coveragePercentage / 100;
        const totalUsage = allUsageValues.reduce((sum, val) => sum + val, 0);
        let cumulativeUsage = 0;
        let threshold = 0;
        
        for (const usage of allUsageValues) {
            cumulativeUsage += usage;
            if (cumulativeUsage >= totalUsage * targetCoverage) {
                threshold = usage;
                break;
            }
        }
        
        // Generate schedule
        const schedule = [];
        const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        
        let totalActiveHours = 0;
        let coveredUsage = 0;
        
        for (let day = 0; day < 7; day++) {
            const daySchedule = {
                dayName: dayNames[day],
                timeSlots: []
            };
            
            let rangeStart = null;
            
            for (let hour = 0; hour < 24; hour++) {
                const shouldRun = weekdayHourlyUsage[day][hour] >= threshold;
                
                if (shouldRun) {
                    totalActiveHours++;
                    coveredUsage += weekdayHourlyUsage[day][hour];
                    
                    if (rangeStart === null) {
                        rangeStart = hour;
                    }
                } else {
                    if (rangeStart !== null) {
                        daySchedule.timeSlots.push({
                            start: rangeStart,
                            end: hour
                        });
                        rangeStart = null;
                    }
                }
            }
            
            // Close any open range at end of day
            if (rangeStart !== null) {
                daySchedule.timeSlots.push({
                    start: rangeStart,
                    end: 24
                });
            }
            
            if (daySchedule.timeSlots.length > 0) {
                schedule.push(daySchedule);
            }
        }
        
        const coverageAchieved = (coveredUsage / totalUsage) * 100;
        const energySavings = ((24 * 7 - totalActiveHours) / (24 * 7)) * 100;
        
        resolve({
            schedule,
            stats: {
                activeHoursPerDay: (totalActiveHours / 7).toFixed(1),
                coverageAchieved: coverageAchieved.toFixed(1),
                energySavings: energySavings.toFixed(1)
            }
        });
    });
}

function displayPumpSchedule(data) {
    const container = document.getElementById('pump-schedule');
    container.innerHTML = '';
    
    data.schedule.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-schedule';
        
        const timeSlotsHtml = day.timeSlots.map(slot => {
            const startTime = `${slot.start.toString().padStart(2, '0')}:00`;
            const endTime = slot.end === 24 ? '24:00' : `${slot.end.toString().padStart(2, '0')}:00`;
            return `<span class="time-slot">${startTime} - ${endTime}</span>`;
        }).join('');
        
        dayDiv.innerHTML = `
            <div class="day-name">${day.dayName}</div>
            <div class="time-slots">${timeSlotsHtml}</div>
        `;
        
        container.appendChild(dayDiv);
    });
    
    document.getElementById('active-hours').textContent = `${data.stats.activeHoursPerDay} Std.`;
    document.getElementById('covered-usage').textContent = `${data.stats.coverageAchieved}%`;
    document.getElementById('energy-savings').textContent = `${data.stats.energySavings}%`;
    
    document.getElementById('pump-recommendation').style.display = 'block';
}

async function handleCalculatePump() {
    const coveragePercentage = parseInt(document.getElementById('coverage-percentage').value);
    const data = await calculatePumpSchedule(coveragePercentage);
    
    if (data) {
        displayPumpSchedule(data);
    }
}

function exportPumpScheduleAsText() {
    const schedule = document.getElementById('pump-schedule').innerText;
    const stats = `
Aktive Stunden/Tag: ${document.getElementById('active-hours').textContent}
Abgedeckter Verbrauch: ${document.getElementById('covered-usage').textContent}
Energieeinsparung: ${document.getElementById('energy-savings').textContent}
`;
    
    const text = `ZIRKULATIONSPUMPEN-PROGRAMMIERUNG\n${'='.repeat(50)}\n\n${schedule}\n\nSTATISTIK\n${'-'.repeat(50)}\n${stats}`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pumpen-zeitplan.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function exportPumpScheduleAsICal() {
    const scheduleData = [];
    document.querySelectorAll('.day-schedule').forEach((dayDiv, dayIndex) => {
        const dayName = dayDiv.querySelector('.day-name').textContent;
        const timeSlots = dayDiv.querySelectorAll('.time-slot');
        
        timeSlots.forEach(slot => {
            const timeRange = slot.textContent.trim();
            scheduleData.push({ day: dayIndex, dayName, timeRange });
        });
    });
    
    let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Wasserzähler Tracker//Pumpen-Zeitplan//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Zirkulationspumpe
X-WR-TIMEZONE:Europe/Berlin

`;
    
    scheduleData.forEach((entry, index) => {
        const [startTime, endTime] = entry.timeRange.split(' - ');
        ical += `BEGIN:VEVENT
UID:pump-${index}@watermeter-tracker
SUMMARY:Zirkulationspumpe AN
DESCRIPTION:Automatisch generiert basierend auf Verbrauchsdaten
DTSTART:${startTime.replace(':', '')}00
DTEND:${endTime.replace(':', '')}00
RRULE:FREQ=WEEKLY;BYDAY=${['SU','MO','TU','WE','TH','FR','SA'][entry.day]}
END:VEVENT

`;
    });
    
    ical += 'END:VCALENDAR';
    
    const blob = new Blob([ical], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pumpen-zeitplan.ics';
    a.click();
    URL.revokeObjectURL(url);
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
            let sectionIndex = 0;
            if (targetSection === 'auto') {
                sectionIndex = 0;
            } else if (targetSection === 'chart') {
                sectionIndex = 2;
            } else if (targetSection === 'history') {
                sectionIndex = 4;
            } else if (targetSection === 'settings') {
                sectionIndex = 1;
            }
            
            sections[sectionIndex].scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Settings
function loadSettings() {
    const saved = localStorage.getItem('waterMeterSettings');
    if (saved) {
        state.settings = JSON.parse(saved);
    }
    
    document.getElementById('keep-screen-on').checked = state.settings.keepScreenOn;
    document.getElementById('sound-enabled').checked = state.settings.soundEnabled;
    document.getElementById('flash-indicator').checked = state.settings.flashIndicator;
}

function saveSettings() {
    state.settings.keepScreenOn = document.getElementById('keep-screen-on').checked;
    state.settings.soundEnabled = document.getElementById('sound-enabled').checked;
    state.settings.flashIndicator = document.getElementById('flash-indicator').checked;
    
    localStorage.setItem('waterMeterSettings', JSON.stringify(state.settings));
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

// Prevent screen sleep on visibility change
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && state.autoCapture.active && state.settings.keepScreenOn) {
        await requestWakeLock();
    }
});

// Initialize App
async function initApp() {
    try {
        await initDB();
        await registerServiceWorker();
        loadSettings();
        loadApiConfig();
        
        // Event Listeners - Auto-Capture
        document.getElementById('start-auto-btn').addEventListener('click', startAutoCapture);
        document.getElementById('stop-auto-btn').addEventListener('click', stopAutoCapture);
        
        // Event Listeners - Manual Entry
        document.getElementById('save-manual-btn').addEventListener('click', () => {
            const value = document.getElementById('manual-reading').value;
            handleSaveReading(value);
        });
        
        // Event Listeners - Settings
        document.getElementById('keep-screen-on').addEventListener('change', saveSettings);
        document.getElementById('sound-enabled').addEventListener('change', saveSettings);
        document.getElementById('flash-indicator').addEventListener('change', saveSettings);
        
        // Event Listeners - API Configuration
        document.getElementById('save-api-config-btn').addEventListener('click', handleSaveApiConfig);
        
        // Event Listeners - Chart
        document.getElementById('chart-type').addEventListener('change', updateChart);
        
        // Event Listeners - Pump Recommendation
        document.getElementById('coverage-percentage').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('coverage-value').textContent = `${value}%`;
            document.getElementById('coverage-text').textContent = `${value}%`;
        });
        document.getElementById('calculate-pump-btn').addEventListener('click', handleCalculatePump);
        document.getElementById('export-text-btn').addEventListener('click', exportPumpScheduleAsText);
        document.getElementById('export-ical-btn').addEventListener('click', exportPumpScheduleAsICal);
        
        setupNavigation();
        
        // Initial load
        await updateReadingsList();
        await updateChart();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('App initialization error:', error);
    }
}

// API Configuration Handler
function handleSaveApiConfig() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const model = document.getElementById('model-select').value;
    
    if (!apiKey) {
        alert('Bitte gib einen gültigen API Key ein.');
        return;
    }
    
    setApiKey(apiKey);
    setModel(model);
    alert('API-Konfiguration gespeichert! ✅');
}

// Load API config on startup
function loadApiConfig() {
    const savedKey = getApiKey();
    const savedModel = getModel();
    
    if (savedKey) {
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) apiKeyInput.value = savedKey;
    }
    if (savedModel) {
        const modelSelect = document.getElementById('model-select');
        if (modelSelect) modelSelect.value = savedModel;
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
