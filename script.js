// ==================== ENHANCED CLOCK APP WITH ORIENTATION SUPPORT ==================== 

// ==================== GLOBAL STATE ==================== 
let currentMode = 'alarm';
let alarmTime = null;
let alarmEnabled = false;
let alarmTimeout = null;

// Stopwatch state
let stopwatchRunning = false;
let stopwatchTime = 0;
let stopwatchInterval = null;
let lapCounter = 0;
let stopwatchStartTime = 0;

// Timer state
let timerRunning = false;
let timerTime = 0;
let timerInterval = null;
let timerOriginalTime = 0;

// Weather state
let lastWeatherFetch = 0;
let currentWeatherData = null;

// ==================== OPENWEATHERMAP API WEATHER FUNCTIONS ==================== 
// Get your free API key from: https://openweathermap.org/api

// TODO: Replace with your actual OpenWeatherMap API key
const API_KEY   = 'd7ec5ec49c18e556850dec352cef4e62';
const BASE_URL  = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetches and displays current weather for a given city
 * @param {string} cityName - Name of the city (e.g., 'Delhi', 'New York')
 * @returns {Promise<Object|null>} Weather data object or null if error
 */
async function fetchWeather(cityName) {
    // Validate input
    if (!cityName || typeof cityName !== 'string') {
        displayWeatherError('Please provide a valid city name');
        return null;
    }

    // Check if API key is placeholder
    if (API_KEY === 'your_api_key_here') {
        console.warn('OpenWeatherMap API key not set, using mock data');
        displayMockWeatherData(cityName);
        return null;
    }

    // Rate-limit: max 1 request per 10 seconds
    const now = Date.now();
    if (now - lastWeatherFetch < 10000) {
        displayWeatherError('Please wait before fetching weather again');
        return null;
    }
    lastWeatherFetch = now;

    // Show loading state
    displayWeatherLoading();

    try {
        // Build URL with metric units
        const url = `${BASE_URL}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;
        
        // Fetch with 10s timeout
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 10000);
        const response   = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        // HTTP error handling
        if (!response.ok) {
            switch (response.status) {
                case 401: throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
                case 404: throw new Error('City not found. Please check the spelling.');
                case 429: throw new Error('API rate limit exceeded. Please try again later.');
                default:  throw new Error(`Weather service error: ${response.status}`);
            }
        }

        // Parse JSON
        const weatherData = await response.json();

        // Process into simpler object
        const processedData = {
            city:        weatherData.name,
            country:     weatherData.sys.country,
            temperature: Math.round(weatherData.main.temp),
            feelsLike:   Math.round(weatherData.main.feels_like),
            condition:   weatherData.weather[0].main,
            description: weatherData.weather[0].description,
            icon:        weatherData.weather[0].icon,
            humidity:    weatherData.main.humidity,
            windSpeed:   weatherData.wind ? Math.round(weatherData.wind.speed * 10) / 10 : 0,
            pressure:    weatherData.main.pressure,
            visibility:  weatherData.visibility ? Math.round(weatherData.visibility / 1000) : 'N/A',
            timestamp:   new Date().toLocaleTimeString()
        };

        // Display on the page
        displayWeatherData(processedData);
        console.log('✅ Weather data fetched successfully:', processedData);
        return processedData;

    } catch (error) {
        console.error('❌ Weather fetch error:', error);

        // Handle timeout or network errors
        if (error.name === 'AbortError') {
            displayWeatherError('Request timed out. Please try again.');
        } else if (error.name === 'TypeError') {
            displayWeatherError('Network error. Please check your internet connection.');
        } else {
            displayWeatherError(error.message);
        }
        return null;
    }
}

/**
 * Fetches weather by coordinates (for geolocation)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function fetchWeatherByCoordinates(lat, lon) {
    if (API_KEY === 'your_api_key_here') {
        console.warn('OpenWeatherMap API key not set, using mock data');
        displayMockWeatherData('Current Location');
        return null;
    }

    displayWeatherLoading();

    try {
        const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Weather service error: ${response.status}`);
        }

        const weatherData = await response.json();
        
        const processedData = {
            city: weatherData.name,
            country: weatherData.sys.country,
            temperature: Math.round(weatherData.main.temp),
            feelsLike: Math.round(weatherData.main.feels_like),
            condition: weatherData.weather[0].main,
            description: weatherData.weather[0].description,
            icon: weatherData.weather[0].icon,
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind ? Math.round(weatherData.wind.speed * 10) / 10 : 0,
            pressure: weatherData.main.pressure,
            visibility: weatherData.visibility ? Math.round(weatherData.visibility / 1000) : 'N/A',
            timestamp: new Date().toLocaleTimeString()
        };

        currentWeatherData = processedData;
        displayWeatherData(processedData);
        
        console.log('✅ Weather data fetched by coordinates:', processedData);
        return processedData;

    } catch (error) {
        console.error('❌ Weather fetch by coordinates error:', error);
        displayWeatherError('Failed to fetch weather for your location');
        return null;
    }
}

/**
 * Display weather data in the UI.
 * @param {Object} data - Processed weather data
 */
function displayWeatherData(data) {
    // FIX: Removed the call to requestGeolocationPermission().
    // This was the source of the premature permission prompt on mobile.
    // Geolocation is now only requested on a direct user click.

    const weatherEmojis = {
        'Clear':       '☀️',
        'Clouds':      '☁️',
        'Rain':        '🌧️',
        'Drizzle':     '🌦️',
        'Thunderstorm':'⛈️',
        'Snow':        '🌨️',
        'Mist':        '🌫️',
        'Fog':         '🌫️',
        'Haze':        '🌫️',
        'Dust':        '💨',
        'Sand':        '💨',
        'Ash':         '💨',
        'Squall':      '💨',
        'Tornado':     '🌪️'
    };

    // ... (rest of the function is unchanged)
    const tempEl      = document.getElementById('weather-temp');
    const condEl      = document.getElementById('weather-condition');
    const detailsEl   = document.getElementById('weather-details');
    const iconEl      = document.getElementById('weather-icon');

    if (tempEl)    tempEl.textContent    = `${data.temperature}°C`;
    if (condEl)    condEl.textContent    = data.condition;
    if (detailsEl) detailsEl.textContent = `${data.city}, ${data.country} • Feels like ${data.feelsLike}°C • Humidity ${data.humidity}%`;
    if (iconEl)    iconEl.textContent    = weatherEmojis[data.condition] || '🌤️';

    const weatherDiv = document.getElementById('weather');
    if (weatherDiv) {
        weatherDiv.innerHTML = `
            <div class="weather-card">
              <div class="weather-header">
                <h3>${data.city}, ${data.country}</h3>
                <p>Updated: ${data.timestamp}</p>
              </div>
              <div class="weather-main">
                <div class="temperature-info">
                  <div class="temp-value">${data.temperature}°C</div>
                  <div class="feels-like">Feels like ${data.feelsLike}°C</div>
                  <div class="description">${data.description}</div>
                </div>
                <div class="weather-icon-large">
                  ${weatherEmojis[data.condition] || '🌤️'}
                </div>
              </div>
              <div class="weather-details-grid">
                <div class="detail-item"><div>Humidity</div><div>${data.humidity}%</div></div>
                <div class="detail-item"><div>Wind Speed</div><div>${data.windSpeed} m/s</div></div>
                <div class="detail-item"><div>Pressure</div><div>${data.pressure} hPa</div></div>
                <div class="detail-item"><div>Visibility</div><div>${data.visibility} km</div></div>
              </div>
            </div>
        `;
    }
}

/**
 * Display loading state for weather
 */
function displayWeatherLoading() {
    const tempElement = document.getElementById('weather-temp');
    const conditionElement = document.getElementById('weather-condition');
    const detailsElement = document.getElementById('weather-details');
    
    if (tempElement) tempElement.textContent = '--°C';
    if (conditionElement) conditionElement.textContent = 'Loading...';
    if (detailsElement) detailsElement.textContent = 'Fetching weather data...';
    
    const weatherDiv = document.getElementById('weather');
    if (weatherDiv) {
        weatherDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);">
                <div class="loading-spinner" style="width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p>Loading weather data...</p>
            </div>
        `;
    }
}

/**
 * Display weather error
 * @param {string} message - Error message to display
 */
function displayWeatherError(message) {
    const tempElement = document.getElementById('weather-temp');
    const conditionElement = document.getElementById('weather-condition');
    const detailsElement = document.getElementById('weather-details');
    
    if (tempElement) tempElement.textContent = '--°C';
    if (conditionElement) conditionElement.textContent = 'Error';
    if (detailsElement) detailsElement.textContent = message;
    
    const weatherDiv = document.getElementById('weather');
    if (weatherDiv) {
        weatherDiv.innerHTML = `
            <div style="background: rgba(255, 65, 108, 0.1); border: 1px solid rgba(255, 65, 108, 0.3); color: #ff6b9d; padding: 1rem; border-radius: 0.75rem; text-align: center;">
                <p><strong>⚠️ Error:</strong> ${message}</p>
            </div>
        `;
    }
}

/**
 * Display mock weather data when API key is not available
 * @param {string} cityName - Name of the city
 */
function displayMockWeatherData(cityName) {
    const mockData = {
        city: cityName,
        country: 'IN',
        temperature: 28,
        feelsLike: 32,
        condition: 'Clear',
        description: 'clear sky',
        icon: '01d',
        humidity: 65,
        windSpeed: 3.2,
        pressure: 1013,
        visibility: 10,
        timestamp: new Date().toLocaleTimeString()
    };
    
    currentWeatherData = mockData;
    displayWeatherData(mockData);
    
    // Add notice about mock data
    const weatherDiv = document.getElementById('weather');
    if (weatherDiv) {
        const existingContent = weatherDiv.innerHTML;
        weatherDiv.innerHTML = existingContent + `
            <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); color: #ffc107; padding: 1rem; border-radius: 0.75rem; text-align: center; margin-top: 1rem;">
                <p><strong>🔧 Mock Data:</strong> Replace API_KEY in script.js with your OpenWeatherMap key for real data</p>
            </div>
        `;
    }
    
    console.log('📊 Mock weather data displayed for:', cityName);
}

// ==================== ALARM CLOCK FUNCTIONS ==================== 
/**
 * Update current time display and check alarm trigger
 */
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
    
    // FIXED: Check alarm trigger more reliably
    checkAlarmTrigger(now);
}

/**
 * IMPROVED: Check if alarm should trigger with better logic
 * @param {Date} currentTime - Current time
 */
function checkAlarmTrigger(currentTime) {
    if (alarmEnabled && alarmTime) {
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        const currentSecond = currentTime.getSeconds();
        
        // FIXED: Only trigger at exactly 0 seconds to prevent multiple triggers
        if (currentHour === alarmTime.hour && 
            currentMinute === alarmTime.minute && 
            currentSecond === 0) {
            // ADDED: Prevent duplicate triggers by temporarily disabling
            if (!alarmTimeout) {
                triggerAlarm();
            }
        }
    }
}

/**
 * IMPROVED: Set alarm with better validation and feedback
 */
function setAlarm() {
    const hourInput = document.getElementById('alarm-hour');
    const minuteInput = document.getElementById('alarm-minute');
    
    if (!hourInput || !minuteInput) {
        updateAlarmStatus('Alarm inputs not found');
        return;
    }
    
    const hour = parseInt(hourInput.value);
    const minute = parseInt(minuteInput.value);
    
    // IMPROVED: Better validation with specific error messages
    if (isNaN(hour) || hour < 0 || hour > 23) {
        updateAlarmStatus('Invalid hour (0-23)');
        return;
    }
    
    if (isNaN(minute) || minute < 0 || minute > 59) {
        updateAlarmStatus('Invalid minute (0-59)');
        return;
    }
    
    alarmTime = { hour, minute };
    
    // ADDED: Automatically enable alarm when set
    if (!alarmEnabled) {
        alarmEnabled = true;
        const toggle = document.getElementById('alarm-toggle');
        if (toggle) {
            toggle.classList.add('active');
        }
    }
    
    updateAlarmStatus(`Alarm set for ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    console.log('⏰ Alarm set and enabled for:', alarmTime);
}

/**
 * Toggle alarm on/off
 */
function toggleAlarm() {
    if (!alarmTime) {
        updateAlarmStatus('Please set alarm time first');
        return;
    }
    
    alarmEnabled = !alarmEnabled;
    const toggle = document.getElementById('alarm-toggle');
    if (toggle) {
        toggle.classList.toggle('active', alarmEnabled);
    }
    
    const status = alarmEnabled ? 'ON' : 'OFF';
    updateAlarmStatus(`Alarm ${status} - ${alarmTime.hour.toString().padStart(2, '0')}:${alarmTime.minute.toString().padStart(2, '0')}`);
    
    console.log('🔔 Alarm', alarmEnabled ? 'enabled' : 'disabled');
}

/**
 * Clear alarm
 */
function clearAlarm() {
    alarmTime = null;
    alarmEnabled = false;
    
    const toggle = document.getElementById('alarm-toggle');
    if (toggle) {
        toggle.classList.remove('active');
    }
    
    if (alarmTimeout) {
        clearTimeout(alarmTimeout);
        alarmTimeout = null;
    }
    
    updateAlarmStatus('No alarm set');
    console.log('🗑️ Alarm cleared');
}

/**
 * IMPROVED: Trigger alarm with better state management
 */
function triggerAlarm() {
    console.log('🚨 ALARM TRIGGERED!');
    
    // FIXED: Set timeout reference to prevent duplicate triggers
    alarmTimeout = true;
    
    // Update status
    updateAlarmStatus('⏰ ALARM! Tap anywhere to stop');
    
    // Vibrate if supported
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }
    
    // Flash the screen
    document.body.style.animation = 'pulse 0.5s infinite';
    
    // IMPROVED: Auto-stop alarm after 30 seconds (was 60)
    const autoStopTimeout = setTimeout(() => {
        stopAlarm();
    }, 30000);
    
    // FIXED: Store timeout reference properly
    alarmTimeout = autoStopTimeout;
    
    // Add click listener to stop alarm
    const stopAlarmHandler = () => {
        stopAlarm();
        document.removeEventListener('click', stopAlarmHandler);
        document.removeEventListener('touchstart', stopAlarmHandler);
    };
    
    document.addEventListener('click', stopAlarmHandler);
    document.addEventListener('touchstart', stopAlarmHandler);
}

/**
 * IMPROVED: Stop alarm with proper cleanup
 */
function stopAlarm() {
    console.log('⏹️ Alarm stopped');
    
    // Remove flashing animation
    document.body.style.animation = '';
    
    // FIXED: Clear timeout properly
    if (alarmTimeout && typeof alarmTimeout !== 'boolean') {
        clearTimeout(alarmTimeout);
    }
    alarmTimeout = null;
    
    // Update status
    if (alarmTime && alarmEnabled) {
        updateAlarmStatus(`Alarm ON - ${alarmTime.hour.toString().padStart(2, '0')}:${alarmTime.minute.toString().padStart(2, '0')}`);
    } else {
        updateAlarmStatus('No alarm set');
    }
    
    // Stop vibration
    if (navigator.vibrate) {
        navigator.vibrate(0);
    }
}

/**
 * Update alarm status text
 * @param {string} message - Status message
 */
function updateAlarmStatus(message) {
    const statusElement = document.getElementById('alarm-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// ==================== STOPWATCH FUNCTIONS ==================== 
/**
 * Start stopwatch
 */
function startStopwatch() {
    if (!stopwatchRunning) {
        stopwatchRunning = true;
        stopwatchStartTime = Date.now() - stopwatchTime;
        
        // Update button states
        updateStopwatchButtons(true);
        updateStopwatchStatus('Running');
        
        // Start interval
        stopwatchInterval = setInterval(() => {
            stopwatchTime = Date.now() - stopwatchStartTime;
            updateStopwatchDisplay();
        }, 10); // Update every 10ms for smooth display
        
        console.log('▶️ Stopwatch started');
    }
}

/**
 * Stop stopwatch
 */
function stopStopwatch() {
    if (stopwatchRunning) {
        stopwatchRunning = false;
        
        if (stopwatchInterval) {
            clearInterval(stopwatchInterval);
            stopwatchInterval = null;
        }
        
        // Update button states
        updateStopwatchButtons(false);
        updateStopwatchStatus('Stopped');
        
        console.log('⏸️ Stopwatch stopped');
    }
}

/**
 * Reset stopwatch
 */
function resetStopwatch() {
    stopwatchRunning = false;
    stopwatchTime = 0;
    lapCounter = 0;
    
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }
    
    // Update button states
    updateStopwatchButtons(false);
    updateStopwatchStatus('Ready to start');
    
    // Clear lap times
    const lapContainer = document.getElementById('lap-times');
    if (lapContainer) {
        lapContainer.innerHTML = '';
    }
    
    // Update display
    updateStopwatchDisplay();
    
    console.log('🔄 Stopwatch reset');
}

/**
 * Record a lap time
 */
function recordLap() {
    if (stopwatchRunning) {
        lapCounter++;
        const lapTime = formatTimeWithCentiseconds(stopwatchTime);
        const lapContainer = document.getElementById('lap-times');
        
        if (lapContainer) {
            const lapItem = document.createElement('div');
            lapItem.className = 'lap-item';
            lapItem.innerHTML = `
                <span class="lap-number">Lap ${lapCounter}</span>
                <span class="lap-time">${lapTime}</span>
            `;
            
            // Add to top of list (most recent first)
            lapContainer.insertBefore(lapItem, lapContainer.firstChild);
            
            // Limit to 10 laps for performance
            while (lapContainer.children.length > 10) {
                lapContainer.removeChild(lapContainer.lastChild);
            }
        }
        
        console.log(`🏁 Lap ${lapCounter} recorded: ${lapTime}`);
    }
}

/**
 * Update stopwatch display
 */
function updateStopwatchDisplay() {
    const display = document.getElementById('stopwatch-display');
    if (display) {
        display.textContent = formatTimeWithCentiseconds(stopwatchTime);
    }
}

/**
 * Update stopwatch button states
 * @param {boolean} running - Whether stopwatch is running
 */
function updateStopwatchButtons(running) {
    const startBtn = document.getElementById('stopwatch-start');
    const stopBtn = document.getElementById('stopwatch-stop');
    const lapBtn = document.getElementById('lap-btn');
    
    if (startBtn) startBtn.disabled = running;
    if (stopBtn) stopBtn.disabled = !running;
    if (lapBtn) lapBtn.disabled = !running;
}

/**
 * Update stopwatch status
 * @param {string} status - Status message
 */
function updateStopwatchStatus(status) {
    const statusElement = document.getElementById('stopwatch-status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// ==================== TIMER FUNCTIONS ==================== 
/**
 * Start timer
 */
function startTimer() {
    if (!timerRunning) {
        // Get timer duration from inputs if not already set
        if (timerTime === 0) {
            const hours = parseInt(document.getElementById('timer-hour').value) || 0;
            const minutes = parseInt(document.getElementById('timer-minute').value) || 0;
            const seconds = parseInt(document.getElementById('timer-second').value) || 0;
            
            timerTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
            timerOriginalTime = timerTime;
        }
        
        if (timerTime > 0) {
            timerRunning = true;
            
            // Update button states
            updateTimerButtons(true, false);
            updateTimerStatus('Running');
            
            // Start countdown
            timerInterval = setInterval(() => {
                timerTime -= 1000;
                updateTimerDisplay();
                
                // Check if timer finished
                if (timerTime <= 0) {
                    timerFinished();
                }
            }, 1000);
            
            console.log('⏱️ Timer started');
        } else {
            updateTimerStatus('Please set a valid duration');
        }
    }
}

/**
 * Pause timer
 */
function pauseTimer() {
    if (timerRunning) {
        timerRunning = false;
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Update button states
        updateTimerButtons(false, true);
        updateTimerStatus('Paused');
        
        console.log('⏸️ Timer paused');
    }
}

/**
 * Reset timer
 */
function resetTimer() {
    timerRunning = false;
    timerTime = 0;
    timerOriginalTime = 0;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Update button states
    updateTimerButtons(false, false);
    updateTimerStatus('Set countdown duration');
    
    // Update display
    updateTimerDisplay();
    
    console.log('🔄 Timer reset');
}

/**
 * Handle timer completion
 */
function timerFinished() {
    console.log('⏰ TIMER FINISHED!');
    
    timerRunning = false;
    timerTime = 0;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Update button states
    updateTimerButtons(false, false);
    updateTimerStatus('🎉 Time\'s up!');
    
    // Update display
    updateTimerDisplay();
    
    // Vibrate if supported
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
    }
    
    // Flash the screen
    document.body.style.animation = 'pulse 1s 3';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 3000);
    
    // Play notification sound (you can add audio here)
    // const audio = new Audio('timer-sound.mp3');
    // audio.play();
    
    // Show notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Finished!', {
            body: 'Your countdown has completed.',
            icon: '/favicon.ico'
        });
    }
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (display) {
        display.textContent = formatTime(Math.max(0, timerTime));
    }
}

/**
 * Update timer button states
 * @param {boolean} running - Whether timer is running
 * @param {boolean} paused - Whether timer is paused
 */
function updateTimerButtons(running, paused) {
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    
    if (startBtn) startBtn.disabled = running;
    if (pauseBtn) pauseBtn.disabled = !running;
}

/**
 * Update timer status
 * @param {string} status - Status message
 */
function updateTimerStatus(status) {
    const statusElement = document.getElementById('timer-status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// ==================== UTILITY FUNCTIONS ==================== 
/**
 * Format milliseconds to HH:MM:SS with centiseconds for stopwatch
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(Math.abs(milliseconds) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format time with centiseconds for stopwatch
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string with centiseconds
 */
function formatTimeWithCentiseconds(milliseconds) {
    const totalCentiseconds = Math.floor(Math.abs(milliseconds) / 10);
    const centiseconds = totalCentiseconds % 100;
    const totalSeconds = Math.floor(totalCentiseconds / 100);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
}

/**
 * Request notification permission
 */
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('📱 Notification permission:', permission);
        });
    }
}

/**
 * Prevent default touch behaviors for better mobile experience
 */
function preventDefaultTouchBehaviors() {
    // Prevent pull-to-refresh
    document.body.addEventListener('touchstart', e => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.body.addEventListener('touchend', e => {
        if (e.touches.length > 0) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.body.addEventListener('touchend', e => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

/**
 * Handles the click on the "Auto Locate" button.
 * This function is now the single point of entry for geolocation.
 */
function handleAutoLocate() {
  // First, check if geolocation is even supported by the browser.
  if (!navigator.geolocation) {
    displayWeatherError('Geolocation is not supported by your browser.');
    console.warn('Geolocation not supported.');
    return;
  }

  // FIX: Added a rate-limit check consistent with the manual city search.
  // This prevents spamming the API if the user clicks multiple times.
  const now = Date.now();
  if (now - lastWeatherFetch < 10000) {
      displayWeatherError('Please wait before fetching weather again.');
      return;
  }
  // We don't set lastWeatherFetch here, but in the actual fetch function to ensure it only updates on a successful attempt.

  // Show a loading state to the user immediately.
  displayWeatherLoading();
  console.log('Attempting to get user location...');

  // Call the Geolocation API.
  navigator.geolocation.getCurrentPosition(
    // SUCCESS CALLBACK
    (position) => {
      console.log('📍 Geolocation successful:', position.coords);
      const { latitude, longitude } = position.coords;
      // Pass the coordinates to the weather fetching function.
      fetchWeatherByCoordinates(latitude, longitude);
    },
    // ERROR CALLBACK
    (error) => {
      console.error('❌ Geolocation error:', error);
      let errorMessage = 'An unknown error occurred.';
      
      // FIX: Provide clear, user-friendly messages for each specific error code.
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable it in your browser or OS settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable. Please check your network or GPS.';
          break;
        case error.TIMEOUT:
          errorMessage = 'The request to get user location timed out. Please try again.';
          break;
      }
      displayWeatherError(errorMessage);
    },
    // OPTIONS OBJECT
    {
      enableHighAccuracy: true, // Request a more precise location.
      // FIX: Increased timeout to 30 seconds for better reliability on slow networks.
      timeout: 30000, 
      maximumAge: 0 // Don't use a cached position.
    }
  );
}

/**
 * Setup input validation for time inputs
 */
function setupInputValidation() {
    // Alarm inputs
    const alarmHour = document.getElementById('alarm-hour');
    const alarmMinute = document.getElementById('alarm-minute');
    
    if (alarmHour) {
        alarmHour.addEventListener('input', e => {
            const value = parseInt(e.target.value);
            if (value < 0) e.target.value = 0;
            if (value > 23) e.target.value = 23;
        });
    }
    
    if (alarmMinute) {
        alarmMinute.addEventListener('input', e => {
            const value = parseInt(e.target.value);
            if (value < 0) e.target.value = 0;
            if (value > 59) e.target.value = 59;
        });
    }
    
    // Timer inputs
    const timerHour = document.getElementById('timer-hour');
    const timerMinute = document.getElementById('timer-minute');
    const timerSecond = document.getElementById('timer-second');
    
    if (timerHour) {
        timerHour.addEventListener('input', e => {
            const value = parseInt(e.target.value);
            if (value < 0) e.target.value = 0;
            if (value > 23) e.target.value = 23;
        });
    }
    
    if (timerMinute) {
        timerMinute.addEventListener('input', e => {
            const value = parseInt(e.target.value);
            if (value < 0) e.target.value = 0;
            if (value > 59) e.target.value = 59;
        });
    }
    
    if (timerSecond) {
        timerSecond.addEventListener('input', e => {
            const value = parseInt(e.target.value);
            if (value < 0) e.target.value = 0;
            if (value > 59) e.target.value = 59;
        });
    }
    
    // City input
    const cityInput = document.getElementById('city-input');
    if (cityInput) {
        cityInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                fetchCurrentWeather();
            }
        });
    }
}

// ==================== WEATHER HELPER FUNCTIONS ==================== 
/**
 * Get weather icon emoji based on condition
 * @param {string} condition - Weather condition
 * @param {string} icon - Weather icon code from API
 * @returns {string} Emoji representation
 */
function getWeatherEmoji(condition, icon) {
    const weatherEmojis = {
        'Clear': icon && icon.includes('n') ? '🌙' : '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Haze': '🌫️',
        'Dust': '💨',
        'Sand': '💨',
        'Ash': '🌋',
        'Squall': '💨',
        'Tornado': '🌪️'
    };
    
    return weatherEmojis[condition] || '🌤️';
}

/**
 * Refresh weather data if it's older than 10 minutes
 */
function refreshWeatherIfNeeded() {
    if (currentWeatherData) {
        const now = Date.now();
        const weatherAge = now - lastWeatherFetch;
        
        // Refresh if data is older than 10 minutes
        if (weatherAge > 600000) {
            const cityInput = document.getElementById('city-input');
            if (cityInput && cityInput.value) {
                console.log('🔄 Refreshing weather data');
                fetchWeather(cityInput.value);
            }
        }
    }
}

// ==================== AUTO INITIALIZATION ==================== 
// New function to handle the geolocation request for weather
function autoLocateWeatherOnLoad() {
  console.log('🌍 Attempting to auto-locate weather...');
  // Check if the current mode is 'weather' and then call the auto-locate function
  // to fetch weather based on the user's location.
  if (currentMode === 'weather') {
    requestGeolocationPermission();
  }
}

/**
 * Handle screen orientation changes
 */
function handleOrientationChange() {
    // A small delay helps prevent rapid re-runs during device movement
    clearTimeout(orientationTimeout);
    orientationTimeout = setTimeout(() => {
        const orientation = screen.orientation.type;
        currentOrientation = orientation;
        const targetSectionId = orientationMap[orientation];

        // Hide all sections, then show the correct one
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            targetSection.style.display = 'flex';
            currentMode = targetSection.id.replace('-section', '');
            console.log('✅ Current mode:', currentMode);
        }

        // Update the orientation debug display
        const orientationDebug = document.getElementById('current-orientation');
        if (orientationDebug) {
            orientationDebug.textContent = orientation;
        }

        // NEW: If the new orientation is the weather mode, trigger the auto-locate function.
        if (currentMode === 'weather') {
          autoLocateWeatherOnLoad();
        }

    }, 300); // 300ms debounce
}

// Function to call a single time at startup
function initializeClockApp() {
    // We don't need a separate call for orientation, as it will be called below by the
    // event listener and the initial call onDOMContentLoaded will trigger it.
    console.log('🚀 Clock app components initialized');
    
    // Initialize displays
    updateCurrentTime();
    updateStopwatchDisplay();
    updateTimerDisplay();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Setup mobile optimizations
    preventDefaultTouchBehaviors();
    
    // Setup input validation
    setupInputValidation();

    // FIX: Removed the old, complex event listener from the bottom of the file.
    // Attach the new, clean handler directly to the button on initialization.
    const autoLocateBtn = document.getElementById('auto-locate-btn');
    if (autoLocateBtn) {
        autoLocateBtn.addEventListener('click', handleAutoLocate);
    }
    
    console.log('✅ Clock app initialization complete');

    // ADDED: Call the orientation handler once at startup to set the initial mode
    handleOrientationChange();

    // Start fetching the current time every second
    setInterval(updateCurrentTime, 1000);
}
// Initialize when DOM is ready (backup in case it's not called from HTML)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeClockApp);
} else {
    // DOM already loaded
    initializeClockApp();
}

// Export functions for use in HTML (if needed)
if (typeof window !== 'undefined') {
    // Make functions globally available
    window.updateCurrentTime = updateCurrentTime;
    window.setAlarm = setAlarm;
    window.toggleAlarm = toggleAlarm;
    window.clearAlarm = clearAlarm;
    window.startStopwatch = startStopwatch;
    window.stopStopwatch = stopStopwatch;
    window.resetStopwatch = resetStopwatch;
    window.recordLap = recordLap;
    window.startTimer = startTimer;
    window.pauseTimer = pauseTimer;
    window.resetTimer = resetTimer;
    window.fetchWeather = fetchWeather;
    window.fetchWeatherByCoordinates = fetchWeatherByCoordinates;
}