// ==================== ENHANCED CLOCK APP WITH ORIENTATION SUPPORT ====================

// ==================== GLOBAL STATE ====================
let currentMode = "alarm";
let currentOrientation = "portrait-primary";
let orientationTimeout = null;

// Map orientations to sections
const orientationMap = {
  "portrait-primary": "alarm-section", // Portrait upright → Alarm
  "landscape-primary": "stopwatch-section", // Landscape right → Stopwatch
  "portrait-secondary": "timer-section", // Portrait upside down → Timer
  "landscape-secondary": "weather-section", // Landscape left → Weather
};

// ==================== PORTRAIT-PRIMARY: ALARM CLOCK FUNCTIONS ====================
// State variables for alarm
let alarmTime = null;
let alarmEnabled = false;
let alarmTimeout = null;

/**
 * Update current time display
 */
function updateCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timeString = `${hours}:${minutes}:${seconds}`;

  const timeDisplay = document.getElementById("current-time");
  if (timeDisplay) {
    timeDisplay.textContent = timeString;
  }

  // Check alarm
  if (alarmEnabled && alarmTime) {
    const [alarmHour, alarmMinute] = alarmTime.split(":").map(Number);
    if (
      now.getHours() === alarmHour &&
      now.getMinutes() === alarmMinute &&
      now.getSeconds() === 0
    ) {
      triggerAlarm();
    }
  }
}

/**
 * Set alarm time
 */
function setAlarm() {
  const hourInput = document.getElementById("alarm-hour");
  const minuteInput = document.getElementById("alarm-minute");
  const statusText = document.getElementById("alarm-status");

  const hour = hourInput.value;
  const minute = minuteInput.value;

  if (hour !== "" && minute !== "") {
    alarmTime = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
    alarmEnabled = true;
    statusText.textContent = `Alarm set for ${alarmTime}`;
    document.getElementById("alarm-toggle").classList.add("active");
    console.log("🔔 Alarm set:", alarmTime);
  } else {
    statusText.textContent = "Please set a valid time";
  }
}

/**
 * Toggle alarm on/off
 */
function toggleAlarm() {
  const toggleSwitch = document.getElementById("alarm-toggle");
  const statusText = document.getElementById("alarm-status");

  if (alarmEnabled) {
    alarmEnabled = false;
    toggleSwitch.classList.remove("active");
    if (alarmTime) {
      statusText.textContent = `Alarm set for ${alarmTime} (off)`;
    } else {
      statusText.textContent = "No alarm set";
    }
    console.log("🔇 Alarm disabled");
  } else {
    if (alarmTime) {
      alarmEnabled = true;
      toggleSwitch.classList.add("active");
      statusText.textContent = `Alarm set for ${alarmTime} (on)`;
      console.log("🔔 Alarm enabled");
    } else {
      statusText.textContent = "Set an alarm time first";
    }
  }
}

/**
 * Clear alarm
 */
function clearAlarm() {
  alarmTime = null;
  alarmEnabled = false;
  const statusText = document.getElementById("alarm-status");
  statusText.textContent = "No alarm set";
  document.getElementById("alarm-toggle").classList.remove("active");
  console.log("❌ Alarm cleared");
}

/**
 * Trigger alarm notification
 */
function triggerAlarm() {
  console.log("🚨 Alarm triggered!");

  // Try to play alarm sound
  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGT2Oy9diMFl2z0"
    );
    audio.play();
  } catch (e) {
    console.log("Could not play audio:", e);
  }

  const alarmModal = document.createElement("div");
  alarmModal.classList.add("alarm-modal");
  alarmModal.innerHTML = `
        <div class="alarm-modal-content">
            <h3>⏰ Alarm!</h3>
            <p>It's ${alarmTime}!</p>
            <button onclick="dismissAlarm()">Dismiss</button>
        </div>
    `;
  document.body.appendChild(alarmModal);

  clearAlarm();
}

/**
 * Dismiss alarm modal
 */
function dismissAlarm() {
  const modal = document.querySelector(".alarm-modal");
  if (modal) {
    modal.remove();
  }
}

// ==================== LANDSCAPE-PRIMARY: STOPWATCH FUNCTIONS ====================
// State variables for stopwatch
let stopwatchRunning = false;
let stopwatchTime = 0;
let stopwatchInterval = null;
let lapCounter = 0;
let stopwatchStartTime = 0;

/**
 * Update stopwatch display
 */
function updateStopwatchDisplay() {
  const display = document.getElementById("stopwatch-display");
  if (display) {
    const ms = stopwatchTime;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");
    const formattedMilliseconds = String(milliseconds)
      .padStart(3, "0")
      .substring(0, 3);

    display.textContent = `${formattedMinutes}:${formattedSeconds}:${formattedMilliseconds}`;
  }
}

/**
 * Start stopwatch
 */
function startStopwatch() {
  if (!stopwatchRunning) {
    stopwatchRunning = true;
    stopwatchStartTime = Date.now() - stopwatchTime;
    stopwatchInterval = setInterval(() => {
      stopwatchTime = Date.now() - stopwatchStartTime;
      updateStopwatchDisplay();
    }, 10);

    document.getElementById("stopwatch-start").disabled = true;
    document.getElementById("stopwatch-stop").disabled = false;
    document.getElementById("lap-btn").disabled = false;
    document.getElementById("stopwatch-status").textContent =
      "Stopwatch running...";
    console.log("▶️ Stopwatch started");
  }
}

/**
 * Stop stopwatch
 */
function stopStopwatch() {
  if (stopwatchRunning) {
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);

    document.getElementById("stopwatch-start").disabled = false;
    document.getElementById("stopwatch-stop").disabled = true;
    document.getElementById("lap-btn").disabled = true;
    document.getElementById("stopwatch-status").textContent =
      "Stopwatch stopped";
    console.log("⏸️ Stopwatch stopped");
  }
}

/**
 * Reset stopwatch
 */
function resetStopwatch() {
  stopStopwatch();
  stopwatchTime = 0;
  lapCounter = 0;
  updateStopwatchDisplay();
  document.getElementById("lap-times").innerHTML = "";
  document.getElementById("stopwatch-status").textContent = "Ready to start";
  console.log("🔄 Stopwatch reset");
}

/**
 * Record lap time
 */
function recordLap() {
  if (stopwatchRunning) {
    lapCounter++;
    const lapTime = document.getElementById("stopwatch-display").textContent;
    const lapContainer = document.getElementById("lap-times");
    const lapEntry = document.createElement("div");
    lapEntry.className = "lap-entry";
    lapEntry.innerHTML = `<span>Lap ${lapCounter}:</span><span>${lapTime}</span>`;
    lapContainer.prepend(lapEntry);
    console.log("🏁 Lap recorded:", lapTime);
  }
}

// ==================== PORTRAIT-SECONDARY: TIMER FUNCTIONS ====================
// State variables for timer
let timerRunning = false;
let timerTime = 0;
let timerInterval = null;
let timerOriginalTime = 0;

/**
 * Update timer display
 */
function updateTimerDisplay() {
  const display = document.getElementById("timer-display");
  if (display) {
    const totalSeconds = Math.floor(timerTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    display.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
}

/**
 * Start timer countdown
 */
function startTimer() {
  if (timerRunning) return;

  const hourInput = document.getElementById("timer-hour");
  const minuteInput = document.getElementById("timer-minute");
  const secondInput = document.getElementById("timer-second");
  const statusText = document.getElementById("timer-status");

  const hours = parseInt(hourInput.value) || 0;
  const minutes = parseInt(minuteInput.value) || 0;
  const seconds = parseInt(secondInput.value) || 0;

  if (timerTime === 0) {
    timerOriginalTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
    timerTime = timerOriginalTime;
    if (timerTime === 0) {
      statusText.textContent = "Please set a time > 0";
      return;
    }
  }

  timerRunning = true;
  statusText.textContent = "Timer running...";

  document.getElementById("timer-start").disabled = true;
  document.getElementById("timer-pause").disabled = false;
  document.getElementById("timer-reset").disabled = false;

  timerInterval = setInterval(() => {
    timerTime -= 1000;
    if (timerTime < 0) {
      timerTime = 0;
      clearInterval(timerInterval);
      timerRunning = false;
      statusText.textContent = "Time's up!";
      updateTimerDisplay();
      triggerAlarm();
    }
    updateTimerDisplay();
  }, 1000);
  console.log("▶️ Timer started");
}

/**
 * Pause timer
 */
function pauseTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById("timer-start").disabled = false;
    document.getElementById("timer-pause").disabled = true;
    document.getElementById("timer-status").textContent = "Timer paused";
    console.log("⏸️ Timer paused");
  }
}

/**
 * Reset timer
 */
function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerTime = 0;
  updateTimerDisplay();

  document.getElementById("timer-start").disabled = false;
  document.getElementById("timer-pause").disabled = true;
  document.getElementById("timer-reset").disabled = true;
  document.getElementById("timer-status").textContent =
    "Set countdown duration";
  console.log("🔄 Timer reset");
}

// ==================== LANDSCAPE-SECONDARY: WEATHER FUNCTIONS ====================
// State variables for weather
let lastWeatherFetch = 0;
let currentWeatherData = null;
let weatherInitialized = false;

// OpenWeatherMap API Configuration
const API_KEY = "cac2742bc47b7e2b506f0ae1f92d40ec";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Weather emoji mapping
 */
const weatherEmojis = {
  Clear: "☀️",
  Clouds: "☁️",
  Rain: "🌧️",
  Drizzle: "🌦️",
  Thunderstorm: "⛈️",
  Snow: "🌨️",
  Mist: "🌫️",
  Fog: "🌫️",
  Haze: "🌫️",
  Dust: "💨",
  Sand: "💨",
  Ash: "💨",
  Squall: "💨",
  Tornado: "🌪️",
};

/**
 * Display weather loading state - FIXED to always show loading UI
 */
function displayWeatherLoading() {
  // Immediately set top compact display to loading state
  const tempEl = document.getElementById("weather-temp");
  const condEl = document.getElementById("weather-condition");
  const detailsEl = document.getElementById("weather-details");
  const iconEl = document.getElementById("weather-icon");

  if (tempEl) tempEl.textContent = "--°C";
  if (condEl) condEl.textContent = "Fetching weather data...";
  if (detailsEl) detailsEl.textContent = "";
  if (iconEl) iconEl.textContent = "🌤️";

  // Main weather container: spinner + message
  const weatherDiv = document.getElementById("weather");
  if (weatherDiv) {
    weatherDiv.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p>Loading weather information...</p>
      </div>
    `;
  }

  console.log("🔄 Weather loading state displayed");
}

/**
 * Display weather error state - only called on actual errors
 */
function displayWeatherError(message = "Failed to fetch weather data") {
  const tempEl = document.getElementById("weather-temp");
  const condEl = document.getElementById("weather-condition");
  const detailsEl = document.getElementById("weather-details");
  const iconEl = document.getElementById("weather-icon");

  if (tempEl) tempEl.textContent = "N/A";
  if (condEl) condEl.textContent = message;
  if (detailsEl) detailsEl.textContent = "";
  if (iconEl) iconEl.textContent = "❌";

  const weatherDiv = document.getElementById("weather");
  if (weatherDiv) {
    weatherDiv.innerHTML = `
      <div class="error-state">
        <p>${message}</p>
        <button onclick="retryWeatherFetch()" class="retry-btn">Retry</button>
      </div>
    `;
  }

  console.log("❌ Weather error state displayed:", message);
}

/**
 * Display weather data - successful state
 */
function displayWeatherData(data) {
  // Defensive check
  if (!data || !data.main) {
    displayWeatherError("Invalid weather data");
    return;
  }

  const headEl = document.getElementById("location");
  const tempEl = document.getElementById("weather-temp");
  const condEl = document.getElementById("weather-condition");
  const detailsEl = document.getElementById("weather-details");
  const iconEl = document.getElementById("weather-icon");

  const tempC = Math.round(data.main.temp);
  const condition =
    data.weather && data.weather[0] && data.weather[0].main
      ? data.weather[0].main
      : "Unknown";
  const description =
    data.weather && data.weather[0] && data.weather[0].description
      ? data.weather[0].description
      : "";

  if (headEl) headEl.textContent = data.name || "Unknown Location";
  if (tempEl) tempEl.textContent = `${tempC}°C`;
  if (condEl) condEl.textContent = condition;
  if (detailsEl)
    detailsEl.textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
  if (iconEl) iconEl.textContent = weatherEmojis[condition] || "🌤️";

  const weatherDiv = document.getElementById("weather");
  if (weatherDiv) {
    // Detailed card layout
    weatherDiv.innerHTML = `
        <div class="weather-card-main">
          <div class="weather-card-temp">${tempC}°C</div>
          <div class="weather-card-cond">${condition} ${
      weatherEmojis[condition]
    }</div>
        </div>
        <div class="weather-card-details">
          <p>Humidity: ${data.main.humidity}%</p>
          <p>Wind: ${data.wind ? data.wind.speed + " m/s" : "N/A"}</p>
          <p>Pressure: ${data.main.pressure} hPa</p>
          <p>Visibility: ${data.visibility / 1000} Km</p>
          <p class="weather-timestamp">Updated: ${new Date().toLocaleTimeString()}</p>
        </div>
    `;
  }

  console.log("✅ Weather data displayed successfully");
}

/**
 * Fetch weather by city name - improved error handling
 */
async function fetchWeather(cityName) {
  if (!cityName || typeof cityName !== "string") {
    displayWeatherError("Please provide a valid city name");
    return null;
  }

  // Rate limiting check
  const now = Date.now();
  if (now - lastWeatherFetch < 10000) {
    displayWeatherError("Please wait 10 seconds before fetching weather again");
    return null;
  }
  lastWeatherFetch = now;

  // Always show loading state first
  displayWeatherLoading();

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(
      cityName
    )}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage;
      switch (response.status) {
        case 401:
          errorMessage = "Invalid API key";
          break;
        case 404:
          errorMessage = "City not found";
          break;
        case 429:
          errorMessage = "Rate limit exceeded";
          break;
        default:
          errorMessage = `Error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const weatherData = await response.json();

    // Process the data for consistent display
    const processedData = {
      main: {
        temp: weatherData.main.temp,
        humidity: weatherData.main.humidity,
        feels_like: weatherData.main.feels_like,
        pressure: weatherData.main.pressure,
      },
      weather: weatherData.weather,
      name: weatherData.name,
      wind: weatherData.wind,
      sys: weatherData.sys,
      visibility: weatherData.visibility,
    };

    currentWeatherData = processedData;
    displayWeatherData(processedData);
    console.log("✅ Weather fetched for city:", cityName);
    return processedData;
  } catch (error) {
    console.error("❌ Weather fetch error:", error);
    displayWeatherError(error.message);
    return null;
  }
}

/**
 * Fetch weather by coordinates - improved error handling
 */
async function fetchWeatherByCoordinates(lat, lon) {
  // Always show loading state first
  displayWeatherLoading();

  try {
    const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather service error: ${response.status}`);
    }

    const weatherData = await response.json();

    // Process the data for consistent display
    const processedData = {
      main: {
        temp: weatherData.main.temp,
        humidity: weatherData.main.humidity,
        feels_like: weatherData.main.feels_like,
        pressure: weatherData.main.pressure,
      },
      weather: weatherData.weather,
      name: weatherData.name,
      wind: weatherData.wind,
      sys: weatherData.sys,
      visibility: weatherData.visibility,
    };

    currentWeatherData = processedData;
    displayWeatherData(processedData);
    console.log("✅ Weather fetched by coordinates:", lat, lon);
    return processedData;
  } catch (error) {
    console.error("❌ Location weather error:", error);
    displayWeatherError("Failed to fetch weather for your location");
    return null;
  }
}

/**
 * Request geolocation permission and fetch weather - improved UX
 */
function requestGeolocationPermission() {
  if (!navigator.geolocation) {
    displayWeatherError("Geolocation not supported by this browser");
    return;
  }

  // Show loading UI immediately
  displayWeatherLoading();

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude: lat, longitude: lon } = position.coords;
      console.log("📍 Geolocation obtained:", lat, lon);
      fetchWeatherByCoordinates(lat, lon);
    },
    (error) => {
      console.warn("📍 Geolocation error:", error);
      let errorMessage;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
        default:
          errorMessage = "Unknown location error";
          break;
      }
      displayWeatherError(errorMessage);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 300000, // 5 minutes cache
    }
  );
}

/**
 * Fetch weather for city from input
 */
function fetchCurrentWeather() {
  const cityInput = document.getElementById("city-input");
  if (!cityInput) return;

  const cityName = cityInput.value.trim();
  if (!cityName) {
    displayWeatherError("Please enter a city name");
    return;
  }

  fetchWeather(cityName);
}

/**
 * Retry weather fetch - helper function for error state
 */
function retryWeatherFetch() {
  const cityInput = document.getElementById("city-input");
  const cityName = cityInput ? cityInput.value.trim() : "";

  if (cityName) {
    fetchWeather(cityName);
  } else {
    requestGeolocationPermission();
  }
}

/**
 * Initialize weather section - FIXED to always start with loading
 */
function initializeWeatherSection() {
  // Always start with loading state when entering weather section
  displayWeatherLoading();
  weatherInitialized = true;

  // Check if we have recent cached data (within 5 minutes)
  const cacheValidTime = 300000; // 5 minutes
  const hasRecentData =
    currentWeatherData && Date.now() - lastWeatherFetch < cacheValidTime;

  if (hasRecentData) {
    // Show cached data after brief loading display
    setTimeout(() => {
      displayWeatherData(currentWeatherData);
    }, 500);
    return;
  }

  // Try city input first, then geolocation
  const cityInput = document.getElementById("city-input");
  const cityName = cityInput ? cityInput.value.trim() : "";

  if (cityName) {
    // Small delay to show loading state briefly
    setTimeout(() => {
      fetchWeather(cityName);
    }, 300);
  } else {
    // Small delay to show loading state briefly
    setTimeout(() => {
      requestGeolocationPermission();
    }, 300);
  }

  console.log("🌤️ Weather section initialized");
}

// ==================== ORIENTATION DETECTION AND SWITCHING ====================

/**
 * Detect current device orientation
 */
function detectOrientation() {
  let newOrientation = "portrait-primary";

  // Try modern Screen Orientation API
  if (screen && screen.orientation) {
    newOrientation = screen.orientation.type;
  }
  // Fallback to window.orientation
  else if (typeof window.orientation !== "undefined") {
    switch (window.orientation) {
      case 0:
        newOrientation = "portrait-primary";
        break;
      case 90:
        newOrientation = "landscape-primary";
        break;
      case 180:
        newOrientation = "portrait-secondary";
        break;
      case -90:
      case 270:
        newOrientation = "landscape-secondary";
        break;
    }
  }
  // Final fallback using window dimensions
  else {
    const width = window.innerWidth;
    const height = window.innerHeight;
    newOrientation = width > height ? "landscape-primary" : "portrait-primary";
  }

  // Only switch if orientation changed or initial load
  if (
    newOrientation !== currentOrientation ||
    !document.querySelector(".section.active")
  ) {
    console.log(`🔄 Orientation: ${currentOrientation} → ${newOrientation}`);
    currentOrientation = newOrientation;
    switchToSection(orientationMap[newOrientation]);
    updateOrientationDebug();
  }
}

/**
 * Switch to appropriate section based on orientation
 */
function switchToSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");
    initializeSectionFeatures(sectionId);
    currentMode = sectionId.replace("-section", "");
    console.log(`✨ Switched to: ${sectionId}`);
  }
}

/**
 * Initialize section-specific features - FIXED weather initialization
 */
function initializeSectionFeatures(sectionId) {
  switch (sectionId) {
    case "alarm-section":
      updateCurrentTime();
      break;

    case "stopwatch-section":
      updateStopwatchDisplay();
      break;

    case "timer-section":
      updateTimerDisplay();
      break;

    case "weather-section":
      // Use the dedicated weather initialization function
      initializeWeatherSection();
      break;

    default:
      break;
  }
}

/**
 * Update orientation debug display
 */
function updateOrientationDebug() {
  const debugElement = document.getElementById("current-orientation");
  const sectionName = {
    "alarm-section": "Alarm Clock (Portrait ↑)",
    "stopwatch-section": "Stopwatch (Landscape →)",
    "timer-section": "Timer (Portrait ↓)",
    "weather-section": "Weather (Landscape ←)",
  };

  if (debugElement) {
    const currentSection = orientationMap[currentOrientation];
    debugElement.textContent =
      sectionName[currentSection] || currentOrientation;
  }
}

/**
 * Handle orientation changes with debouncing
 */
function handleOrientationChange() {
  if (orientationTimeout) {
    clearTimeout(orientationTimeout);
  }

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
 * Setup orientation change listeners
 */
function setupOrientationListeners() {
  // Modern orientation API
  if (screen && screen.orientation) {
    screen.orientation.addEventListener("change", handleOrientationChange);
  }

  // Fallback for older browsers
  window.addEventListener("orientationchange", handleOrientationChange);

  // Additional fallback using resize
  window.addEventListener("resize", debounceOrientationCheck);

  console.log("📱 Orientation listeners setup complete");
}

// ==================== APP INITIALIZATION ====================

/**
 * Initialize all app components
 */
function initializeApp() {
  // Initialize displays
  updateCurrentTime();
  updateStopwatchDisplay();
  updateTimerDisplay();

  // Hide all sections initially
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // Start clock updates
  setInterval(updateCurrentTime, 1000);

  console.log("✅ App components initialized");
}

/**
 * Initialize touch handling for mobile
 */
function initializeTouchHandling() {
  // Prevent double-tap-to-zoom
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    function (event) {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // Prevent pinch-to-zoom
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("gesturechange", (e) => e.preventDefault());
  document.addEventListener("gestureend", (e) => e.preventDefault());

  console.log("👆 Touch handling initialized");
}

/**
 * Main initialization when DOM is ready
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Orientation Clock App Starting...");

  // Initialize app components
  initializeApp();

  // Set initial orientation
  detectOrientation();

  // Setup orientation listeners
  setupOrientationListeners();

  // Initialize touch handling
  initializeTouchHandling();

  // Setup weather button listeners with improved UX
  const fetchWeatherBtn = document.getElementById("fetch-weather-btn");
  if (fetchWeatherBtn) {
    fetchWeatherBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fetchCurrentWeather();
    });
  }

  const autoLocateBtn = document.getElementById("auto-locate-btn");
  if (autoLocateBtn) {
    autoLocateBtn.addEventListener("click", (e) => {
      e.preventDefault();
      requestGeolocationPermission();
    });
  }

  console.log("✅ App initialization complete");
});
