// ==================== ENHANCED CLOCK APP WITH ORIENTATION SUPPORT ==================== 

// ==================== GLOBAL STATE ==================== 
let currentMode = 'alarm';
let alarmTime = null;
let alarmEnabled = false;
let alarmTimeout = null;
let orientationTimeout = null;

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

// Map orientations to sections
const orientationMap = {
    'portrait-primary': 'alarm-section',       // Portrait upright → Alarm
    'landscape-primary': 'stopwatch-section',  // Landscape right → Stopwatch  
    'portrait-secondary': 'timer-section',     // Portrait upside down → Timer
    'landscape-secondary': 'weather-section'   // Landscape left → Weather
};


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
        currentWeatherData = processedData;
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
                <p><strong>🔧 Mock Data:</strong> Replace API_KEY in script.js with your OpenWeatherMap key.</p>
            </div>
        `;
    }
}


// ==================== UI AND USER INTERACTION FUNCTIONS ==================== 

// Alarm Functions
function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    const timeDisplay = document.getElementById('current-time');
    if (timeDisplay) {
        timeDisplay.textContent = timeString;
    }

    // Check alarm
    if (alarmEnabled && alarmTime) {
        const [alarmHour, alarmMinute] = alarmTime.split(':').map(Number);
        if (now.getHours() === alarmHour && now.getMinutes() === alarmMinute && now.getSeconds() === 0) {
            triggerAlarm();
        }
    }
}

function setAlarm() {
    const hourInput = document.getElementById('alarm-hour');
    const minuteInput = document.getElementById('alarm-minute');
    const statusText = document.getElementById('alarm-status');

    const hour = hourInput.value;
    const minute = minuteInput.value;

    if (hour !== '' && minute !== '') {
        alarmTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
        alarmEnabled = true;
        statusText.textContent = `Alarm set for ${alarmTime}`;
        document.getElementById('alarm-toggle').classList.add('active');
        console.log('🔔 Alarm set:', alarmTime);
    } else {
        statusText.textContent = 'Please set a valid time';
    }
}

function toggleAlarm() {
    const toggleSwitch = document.getElementById('alarm-toggle');
    const statusText = document.getElementById('alarm-status');
    
    if (alarmEnabled) {
        // Disable alarm
        alarmEnabled = false;
        toggleSwitch.classList.remove('active');
        if (alarmTime) {
            statusText.textContent = `Alarm set for ${alarmTime} (off)`;
        } else {
            statusText.textContent = 'No alarm set';
        }
        console.log('🔇 Alarm disabled');
    } else {
        // Enable alarm if a time is set
        if (alarmTime) {
            alarmEnabled = true;
            toggleSwitch.classList.add('active');
            statusText.textContent = `Alarm set for ${alarmTime} (on)`;
            console.log('🔔 Alarm enabled');
        } else {
            statusText.textContent = 'Set an alarm time first';
        }
    }
}

function clearAlarm() {
    alarmTime = null;
    alarmEnabled = false;
    const statusText = document.getElementById('alarm-status');
    statusText.textContent = 'No alarm set';
    document.getElementById('alarm-toggle').classList.remove('active');
    console.log('❌ Alarm cleared');
}

function triggerAlarm() {
    console.log('🚨 Alarm triggered!');
    // Use an audio element to play a sound instead of alert()
    const audio = new Audio('https://notificationsounds.com/storage/sounds/file-sounds/2908-chimes.mp3'); // Example sound
    audio.play();

    // Show a modal or a visual notification instead of alert()
    const alarmModal = document.createElement('div');
    alarmModal.classList.add('alarm-modal');
    alarmModal.innerHTML = `
        <div class="alarm-modal-content">
            <h3>Alarm!</h3>
            <p>It's ${alarmTime}!</p>
            <button onclick="dismissAlarm()">Dismiss</button>
        </div>
    `;
    document.body.appendChild(alarmModal);
    
    // Disable alarm after it triggers
    clearAlarm();
}

function dismissAlarm() {
    const modal = document.querySelector('.alarm-modal');
    if (modal) {
        modal.remove();
    }
}


// Stopwatch Functions
function updateStopwatchDisplay() {
    const display = document.getElementById('stopwatch-display');
    if (display) {
        const ms = stopwatchTime;
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = ms % 1000;
        
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        const formattedMilliseconds = String(milliseconds).padStart(3, '0').substring(0, 3);
        
        display.textContent = `${formattedMinutes}:${formattedSeconds}:${formattedMilliseconds}`;
    }
}

function startStopwatch() {
    if (!stopwatchRunning) {
        stopwatchRunning = true;
        stopwatchStartTime = Date.now() - stopwatchTime;
        stopwatchInterval = setInterval(() => {
            stopwatchTime = Date.now() - stopwatchStartTime;
            updateStopwatchDisplay();
        }, 10);
        
        document.getElementById('stopwatch-start').disabled = true;
        document.getElementById('stopwatch-stop').disabled = false;
        document.getElementById('lap-btn').disabled = false;
        document.getElementById('stopwatch-status').textContent = 'Stopwatch running...';
        console.log('▶️ Stopwatch started');
    }
}

function stopStopwatch() {
    if (stopwatchRunning) {
        stopwatchRunning = false;
        clearInterval(stopwatchInterval);
        
        document.getElementById('stopwatch-start').disabled = false;
        document.getElementById('stopwatch-stop').disabled = true;
        document.getElementById('lap-btn').disabled = true;
        document.getElementById('stopwatch-status').textContent = 'Stopwatch stopped';
        console.log('⏸️ Stopwatch stopped');
    }
}

function resetStopwatch() {
    stopStopwatch();
    stopwatchTime = 0;
    lapCounter = 0;
    updateStopwatchDisplay();
    document.getElementById('lap-times').innerHTML = '';
    document.getElementById('stopwatch-status').textContent = 'Ready to start';
    console.log('🔄 Stopwatch reset');
}

function recordLap() {
    if (stopwatchRunning) {
        lapCounter++;
        const lapTime = document.getElementById('stopwatch-display').textContent;
        const lapContainer = document.getElementById('lap-times');
        const lapEntry = document.createElement('div');
        lapEntry.className = 'lap-entry';
        lapEntry.innerHTML = `<span>Lap ${lapCounter}:</span><span>${lapTime}</span>`;
        lapContainer.prepend(lapEntry);
        console.log('🏁 Lap recorded:', lapTime);
    }
}


// Timer Functions
function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (display) {
        const totalSeconds = Math.floor(timerTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        
        display.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
}

function startTimer() {
    if (timerRunning) return;

    const hourInput = document.getElementById('timer-hour');
    const minuteInput = document.getElementById('timer-minute');
    const secondInput = document.getElementById('timer-second');
    const statusText = document.getElementById('timer-status');

    const hours = parseInt(hourInput.value) || 0;
    const minutes = parseInt(minuteInput.value) || 0;
    const seconds = parseInt(secondInput.value) || 0;

    if (timerTime === 0) {
        timerOriginalTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
        timerTime = timerOriginalTime;
        if (timerTime === 0) {
            statusText.textContent = 'Please set a time > 0';
            return;
        }
    }
    
    timerRunning = true;
    statusText.textContent = 'Timer running...';
    
    document.getElementById('timer-start').disabled = true;
    document.getElementById('timer-pause').disabled = false;
    document.getElementById('timer-reset').disabled = false;

    timerInterval = setInterval(() => {
        timerTime -= 1000;
        if (timerTime < 0) {
            timerTime = 0;
            clearInterval(timerInterval);
            timerRunning = false;
            statusText.textContent = 'Time\'s up!';
            updateTimerDisplay();
            triggerAlarm(); // Reuse alarm trigger for timer
        }
        updateTimerDisplay();
    }, 1000);
    console.log('▶️ Timer started');
}

function pauseTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('timer-start').disabled = false;
        document.getElementById('timer-pause').disabled = true;
        document.getElementById('timer-status').textContent = 'Timer paused';
        console.log('⏸️ Timer paused');
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerTime = 0;
    updateTimerDisplay();
    
    document.getElementById('timer-start').disabled = false;
    document.getElementById('timer-pause').disabled = true;
    document.getElementById('timer-reset').disabled = true;
    document.getElementById('timer-status').textContent = 'Set countdown duration';
    console.log('🔄 Timer reset');
}


// ==================== ORIENTATION-BASED APP LOGIC ==================== 
let currentOrientation = 'portrait-primary';

/**
 * Initialize the app when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Orientation Clock App Initialized');
    
    // Initialize all clock functions
    initializeApp();
    
    // Set initial orientation
    detectOrientation();
    
    // Add orientation change listeners
    setupOrientationListeners();
    
    // Start the main clock update loop
    startClockUpdates();
    
    // Initialize touch handling for buttons
    initializeTouchHandling();

    // ADDED: Event listener for the 'Get Weather' button
    const fetchWeatherBtn = document.getElementById('fetch-weather-btn');
    if (fetchWeatherBtn) {
        fetchWeatherBtn.addEventListener('click', fetchCurrentWeather);
    }
    
    // ADDED: Event listener for the 'Auto Locate' button
    const autoLocateBtn = document.getElementById('auto-locate-btn');
    if (autoLocateBtn) {
        autoLocateBtn.addEventListener('click', requestGeolocationPermission);
    }
});

/**
 * Initialize all app components
 */
function initializeApp() {
    // Initialize displays
    updateCurrentTime();
    updateStopwatchDisplay();
    updateTimerDisplay();
    
    // Hide all sections initially
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    console.log('✅ App components initialized');
}

/**
 * Setup orientation change listeners
 */
function setupOrientationListeners() {
    // Modern orientation API
    if (screen && screen.orientation) {
        screen.orientation.addEventListener('change', handleOrientationChange);
    }
    
    // Fallback for older browsers
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Additional fallback using resize
    window.addEventListener('resize', debounceOrientationCheck);
    
    console.log('📱 Orientation listeners setup complete');
}

/**
 * Handle orientation changes with debouncing
 */
function handleOrientationChange() {
    // Clear any existing timeout
    if (orientationTimeout) {
        clearTimeout(orientationTimeout);
    }
    
    // Debounce orientation changes to avoid rapid switching
    orientationTimeout = setTimeout(() => {
        detectOrientation();
    }, 100);
}

/**
 * Debounced orientation check for resize events
 */
function debounceOrientationCheck() {
    if (orientationTimeout) {
        clearTimeout(orientationTimeout);
    }
    
    orientationTimeout = setTimeout(() => {
        detectOrientation();
    }, 200);
}

/**
 * Detect current device orientation and switch sections
 */
function detectOrientation() {
    let newOrientation = 'portrait-primary';
    
    // Try modern Screen Orientation API first
    if (screen && screen.orientation) {
        newOrientation = screen.orientation.type;
    }
    // Fallback to window.orientation
    else if (typeof window.orientation !== 'undefined') {
        switch (window.orientation) {
            case 0:
                newOrientation = 'portrait-primary';
                break;
            case 90:
                newOrientation = 'landscape-primary';
                break;
            case 180:
                newOrientation = 'portrait-secondary';
                break;
            case -90:
            case 270:
                newOrientation = 'landscape-secondary';
                break;
        }
    }
    // Final fallback using window dimensions
    else {
        const width = window.innerWidth;
        const height = window.innerHeight;
        newOrientation = width > height ? 'landscape-primary' : 'portrait-primary';
    }
    
    // Only switch if orientation actually changed or if this is the initial load
    if (newOrientation !== currentOrientation || !document.querySelector('.section.active')) {
        console.log(`🔄 Orientation changed: ${currentOrientation} → ${newOrientation}`);
        currentOrientation = newOrientation;
        
        // Use the newOrientation to find the section to switch to.
        switchToSection(orientationMap[newOrientation]);
        updateOrientationDebug();
    }
}

/**
 * Switch to the appropriate section based on orientation
 * @param {string} sectionId - ID of the section to show
 */
function switchToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Initialize section-specific functionality
        initializeSectionFeatures(sectionId);
        
        // Update the global mode state
        currentMode = sectionId.replace('-section', '');
        
        console.log(`✨ Switched to: ${sectionId}`);
    }
}

/**
 * Initialize features specific to each section
 * @param {string} sectionId - ID of the active section
 */
function initializeSectionFeatures(sectionId) {
    switch (sectionId) {
        case 'alarm-section':
            updateCurrentTime();
            break;
            
        case 'stopwatch-section':
            updateStopwatchDisplay();
            break;
            
        case 'timer-section':
            updateTimerDisplay();
            break;
            
        case 'weather-section':
            // Automatically fetch weather on section load.
            console.log("Activating weather section, attempting to auto-locate.");
            requestGeolocationPermission();
            break;
    }
}

/**
 * Update orientation debug display
 */
function updateOrientationDebug() {
    const debugElement = document.getElementById('current-orientation');
    const sectionName = {
        'alarm-section': 'Alarm Clock (Portrait ↑)',
        'stopwatch-section': 'Stopwatch (Landscape →)',
        'timer-section': 'Timer (Portrait ↓)',
        'weather-section': 'Weather (Landscape ←)'
    };
    
    if (debugElement) {
        const currentSection = orientationMap[currentOrientation];
        debugElement.textContent = sectionName[currentSection] || currentOrientation;
    }
}

/**
 * Start the main clock update loop
 */
function startClockUpdates() {
    // Update every second
    setInterval(() => {
        updateCurrentTime();
    }, 1000);
    
    console.log('⏰ Clock updates started');
}

/**
 * Request geolocation permission and fetch weather by coordinates.
 */
function requestGeolocationPermission() {
    if (navigator.geolocation) {
        displayWeatherLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error("Geolocation error:", error);
                let message = "Geolocation failed. Please allow location access.";
                displayWeatherError(message);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        let message = "Geolocation is not supported by your browser.";
        displayWeatherError(message);
    }
}

/**
 * Fetch weather for the city entered in input
 */
function fetchCurrentWeather() {
    const cityInput = document.getElementById('city-input');
    const cityName = cityInput.value.trim();
    
    if (!cityName) {
        document.getElementById('weather-condition').textContent = 'Please enter a city name';
        return;
    }
    
    fetchWeather(cityName);
}

// Function to handle various touch behaviors and prevent unwanted defaults on mobile.
function initializeTouchHandling() {
    // Prevent double-tap-to-zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Prevent pinch-to-zoom
    document.addEventListener('gesturestart', function (event) {
        event.preventDefault();
    });
    document.addEventListener('gesturechange', function (event) {
        event.preventDefault();
    });
    document.addEventListener('gestureend', function (event) {
        event.preventDefault();
    });

    console.log('👌 Touch handling initialized');
}
