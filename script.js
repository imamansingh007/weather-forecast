const apiKey = '39d1baed128e656bc56581192d627e59';

const bodyBg = document.getElementById('body-bg');
const cityInput = document.getElementById('cityInput');
const voiceBtn = document.getElementById('voiceBtn');
const locBtn = document.getElementById('locBtn');
const overlay = document.querySelector('.overlay');
const weatherFx = document.getElementById('weatherFx');
const loader = document.getElementById('loader');
const dashboard = document.getElementById('dashboard');
const toastContainer = document.getElementById('toastContainer');
const unitToggle = document.getElementById('unitToggle');
const themeToggle = document.getElementById('themeToggle');

let unit = 'metric';       // metric = °C, imperial = °F
let lastData = null;       // cache last successful current-weather payload
let lastForecast = null;
let thunderInterval = null;

/* ============================================================
   1. CLOCK & DATE
============================================================ */
function updateDateTime() {
    const now = new Date();
    document.getElementById('liveTime').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('liveDate').innerText = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateDateTime, 1000);
updateDateTime();

/* ============================================================
   2. TOASTS (replaces alert())
============================================================ */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/* ============================================================
   3. LOADER
============================================================ */
function setLoading(isLoading) {
    loader.classList.toggle('active', isLoading);
    dashboard.classList.toggle('refreshing', isLoading);
}

/* ============================================================
   4. BACKGROUND IMAGE (per condition)
============================================================ */
function setBackground(weather, isNight) {
    let imageUrl = "";
    const w = weather.toLowerCase();

    if (w.includes("clear")) {
        imageUrl = isNight
            ? "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?auto=format&fit=crop&w=1600&q=80"
            : "https://images.unsplash.com/photo-1506588345361-5e12b7840845?auto=format&fit=crop&w=1600&q=80";
    }
    else if (w.includes("cloud")) imageUrl = "https://images.unsplash.com/photo-1483977399921-6cf3832f7c4e?auto=format&fit=crop&w=1600&q=80";
    else if (w.includes("thunderstorm")) imageUrl = "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1600&q=80";
    else if (w.includes("rain") || w.includes("drizzle")) imageUrl = "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1600&q=80";
    else if (w.includes("snow")) imageUrl = "https://images.unsplash.com/photo-1478265409131-1f65c88f965c?auto=format&fit=crop&w=1600&q=80";
    else if (w.includes("mist") || w.includes("haze") || w.includes("fog")) imageUrl = "https://images.unsplash.com/photo-1485236715598-c8879a632a81?auto=format&fit=crop&w=1600&q=80";
    else imageUrl = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80";

    bodyBg.style.backgroundImage = `url('${imageUrl}')`;
}

/* ============================================================
   5. WEATHER FX — sun rays / monsoon rain / snow / clouds / fog
============================================================ */
function clearWeatherFx() {
    weatherFx.innerHTML = '';
    if (thunderInterval) { clearInterval(thunderInterval); thunderInterval = null; }
}

function randRange(min, max) { return Math.random() * (max - min) + min; }

function renderSun() {
    const glow = document.createElement('div');
    glow.className = 'sun-glow';
    const rays = document.createElement('div');
    rays.className = 'sun-rays';
    weatherFx.appendChild(glow);
    weatherFx.appendChild(rays);

    // floating light particles rising through the scene
    for (let i = 0; i < 14; i++) {
        const p = document.createElement('div');
        p.className = 'light-particle';
        p.style.left = `${randRange(0, 100)}%`;
        p.style.animationDuration = `${randRange(6, 12)}s`;
        p.style.animationDelay = `${randRange(0, 8)}s`;
        weatherFx.appendChild(p);
    }
}

function renderClouds(count = 4) {
    for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.className = 'cloud';
        const w = randRange(120, 220);
        c.style.width = `${w}px`;
        c.style.height = `${w * 0.32}px`;
        c.style.top = `${randRange(5, 45)}%`;
        c.style.opacity = randRange(0.35, 0.8);
        c.style.animationDuration = `${randRange(35, 70)}s`;
        c.style.animationDelay = `-${randRange(0, 40)}s`;
        weatherFx.appendChild(c);
    }
}

/**
 * Rain / monsoon effect. `intensity`: 'light' | 'moderate' | 'heavy' (monsoon)
 */
function renderRain(intensity = 'moderate', withThunder = false) {
    const counts = { light: 45, moderate: 90, heavy: 160 };
    const speeds = { light: [0.9, 1.4], moderate: [0.55, 0.95], heavy: [0.35, 0.6] };
    const dropCount = counts[intensity] || 90;
    const [minS, maxS] = speeds[intensity] || speeds.moderate;

    if (intensity === 'heavy') {
        const tint = document.createElement('div');
        tint.className = 'monsoon-tint';
        weatherFx.appendChild(tint);
    }

    for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = `${randRange(0, 100)}%`;
        drop.style.height = `${randRange(14, intensity === 'heavy' ? 34 : 24)}px`;
        drop.style.animationDuration = `${randRange(minS, maxS)}s`;
        drop.style.animationDelay = `-${randRange(0, 2)}s`;
        drop.style.opacity = randRange(0.4, 0.9);
        weatherFx.appendChild(drop);
    }

    // ground splashes
    const splashCount = intensity === 'heavy' ? 18 : 8;
    for (let i = 0; i < splashCount; i++) {
        const s = document.createElement('div');
        s.className = 'splash';
        s.style.left = `${randRange(0, 100)}%`;
        s.style.animationDuration = `${randRange(0.6, 1.4)}s`;
        s.style.animationDelay = `${randRange(0, 2)}s`;
        weatherFx.appendChild(s);
    }

    const flash = document.createElement('div');
    flash.className = 'lightning-flash';
    flash.id = 'lightningFlash';
    weatherFx.appendChild(flash);

    if (withThunder) {
        thunderInterval = setInterval(() => {
            flash.classList.remove('flash');
            void flash.offsetWidth; // restart animation
            flash.classList.add('flash');
        }, randRange(4000, 9000));
    }
}

function renderSnow(count = 60) {
    const chars = ['❄', '❅', '❆'];
    for (let i = 0; i < count; i++) {
        const f = document.createElement('div');
        f.className = 'snowflake';
        f.textContent = chars[Math.floor(randRange(0, chars.length))];
        f.style.left = `${randRange(0, 100)}%`;
        f.style.fontSize = `${randRange(10, 22)}px`;
        f.style.animationDuration = `${randRange(6, 14)}s`;
        f.style.animationDelay = `-${randRange(0, 10)}s`;
        f.style.opacity = randRange(0.5, 1);
        weatherFx.appendChild(f);
    }
}

function renderFog(layers = 3) {
    for (let i = 0; i < layers; i++) {
        const f = document.createElement('div');
        f.className = 'fog-layer';
        f.style.top = `${randRange(15, 80)}%`;
        f.style.animationDuration = `${randRange(14, 26)}s`;
        f.style.opacity = randRange(0.3, 0.6);
        weatherFx.appendChild(f);
    }
}

/**
 * Decide which effect(s) to show based on OpenWeatherMap condition data.
 * Adds a "monsoon" style heavy-rain + thunder treatment whenever the
 * description signals heavy/extreme rain or an active thunderstorm.
 */
function updateWeatherFx(weatherArr, sys, dtNow) {
    clearWeatherFx();
    const main = weatherArr[0].main.toLowerCase();
    const desc = weatherArr[0].description.toLowerCase();

    const isNight = sys && sys.sunrise && sys.sunset
        ? (dtNow < sys.sunrise || dtNow > sys.sunset)
        : false;

    const isMonsoon = desc.includes('heavy') || desc.includes('extreme') || desc.includes('violent') || main.includes('thunderstorm');

    if (main.includes('thunderstorm')) {
        renderClouds(3);
        renderRain('heavy', true);
    } else if (main.includes('drizzle')) {
        renderClouds(3);
        renderRain('light', false);
    } else if (main.includes('rain')) {
        renderClouds(isMonsoon ? 4 : 2);
        renderRain(isMonsoon ? 'heavy' : 'moderate', isMonsoon);
    } else if (main.includes('snow')) {
        renderClouds(2);
        renderSnow();
    } else if (main.includes('mist') || main.includes('haze') || main.includes('fog') || main.includes('smoke')) {
        renderFog();
    } else if (main.includes('clear')) {
        if (!isNight) renderSun();
    } else if (main.includes('cloud')) {
        renderClouds(desc.includes('overcast') ? 6 : 4);
        if (!isNight && !desc.includes('overcast')) renderSun(); // sun peeking through
    }

    return isNight;
}

/* ============================================================
   6. THEME TOGGLE
============================================================ */
themeToggle.onclick = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.querySelector('i').className = newTheme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
};

/* ============================================================
   7. UNIT TOGGLE (°C / °F)
============================================================ */
unitToggle.onclick = () => {
    unit = unit === 'metric' ? 'imperial' : 'metric';
    unitToggle.innerText = unit === 'metric' ? '°C' : '°F';
    if (lastData && lastForecast) {
        updateUI(lastData, lastForecast);
    } else if (cityInput.value) {
        fetchWeather(cityInput.value);
    }
};

/* ============================================================
   8. ANIMATED TEMPERATURE COUNTER
============================================================ */
function animateNumber(el, from, to, duration = 700) {
    const start = performance.now();
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(from + (to - from) * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* ============================================================
   9. FETCH + RENDER
============================================================ */
async function fetchWeather(city) {
    if (!city) return;
    setLoading(true);
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${unit}&appid=${apiKey}`);
        const data = await res.json();

        if (data.cod == 404 || data.cod === "404") {
            showToast('City not found. Try another name.', 'error');
            setLoading(false);
            return;
        }

        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${unit}&appid=${apiKey}`);
        const forecastData = await forecastRes.json();

        lastData = data;
        lastForecast = forecastData;
        updateUI(data, forecastData);
    } catch (e) {
        console.error("Error fetching weather:", e);
        showToast('Something went wrong reaching the weather service.', 'error');
    } finally {
        setLoading(false);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    setLoading(true);
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`);
        const data = await res.json();

        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`);
        const forecastData = await forecastRes.json();

        lastData = data;
        lastForecast = forecastData;
        cityInput.value = data.name || '';
        updateUI(data, forecastData);
    } catch (e) {
        console.error("Error fetching weather by location:", e);
        showToast('Could not get weather for your location.', 'error');
    } finally {
        setLoading(false);
    }
}

function formatTime(unixSeconds, timezoneOffsetSeconds) {
    const d = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
    return d.toISOString().substring(11, 16);
}

function updateUI(current, forecast) {
    const prevTemp = parseInt(document.getElementById('tempValue').textContent, 10) || 0;
    const unitSymbol = unit === 'metric' ? 'C' : 'F';
    const speedUnit = unit === 'metric' ? 'km/h' : 'mph';

    document.getElementById('cityName').innerHTML = `<i class="fa-solid fa-location-arrow"></i> ${current.name}${current.sys && current.sys.country ? ', ' + current.sys.country : ''}`;
    animateNumber(document.getElementById('tempValue'), prevTemp, Math.round(current.main.temp));
    document.getElementById('unitLabel').textContent = unitSymbol;
    document.getElementById('weatherDesc').innerText = current.weather[0].description;
    document.getElementById('feelsLike').innerText = `Feels like ${Math.round(current.main.feels_like)}°${unitSymbol}`;
    document.getElementById('humidityValue').innerText = `${current.main.humidity}%`;
    document.getElementById('windValue').innerText = `${Math.round(current.wind.speed * (unit === 'metric' ? 3.6 : 1))} ${speedUnit}`;
    document.getElementById('pressureValue').innerText = `${current.main.pressure} hPa`;
    document.getElementById('visValue').innerText = current.visibility != null ? `${(current.visibility / 1000).toFixed(1)} km` : '--';
    document.getElementById('mainIcon').src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;

    if (current.sys && current.sys.sunrise && current.sys.sunset) {
        document.getElementById('sunTimes').innerHTML =
            `<i class="fa-solid fa-sun"></i> ${formatTime(current.sys.sunrise, current.timezone)} &nbsp; <i class="fa-solid fa-moon"></i> ${formatTime(current.sys.sunset, current.timezone)}`;
    }

    const isNight = updateWeatherFx(current.weather, current.sys, current.dt);
    setBackground(current.weather[0].main, isNight);

    const forecastCards = document.getElementById('forecastCards');
    forecastCards.innerHTML = '';
    let cardIndex = 0;
    for (let i = 7; i < forecast.list.length; i += 8) {
        const day = forecast.list[i];
        const date = new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' });
        const card = document.createElement('div');
        card.className = 'f-card';
        card.style.animationDelay = `${cardIndex * 0.08}s`;
        card.innerHTML = `
            <p class="f-day">${date}</p>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
            <p><strong>${Math.round(day.main.temp)}°${unitSymbol}</strong></p>`;
        forecastCards.appendChild(card);
        cardIndex++;
    }
}

/* ============================================================
   10. SEARCH / GEOLOCATION / VOICE
============================================================ */
document.getElementById('searchBtn').onclick = () => fetchWeather(cityInput.value.trim());
cityInput.onkeypress = (e) => { if (e.key === "Enter") fetchWeather(cityInput.value.trim()); };

locBtn.onclick = () => {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by this browser.', 'error');
        return;
    }
    locBtn.classList.add('recording');
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            locBtn.classList.remove('recording');
            fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
            locBtn.classList.remove('recording');
            showToast('Location access denied.', 'error');
        }
    );
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    voiceBtn.onclick = () => {
        recognition.start();
        voiceBtn.classList.add('recording');
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        cityInput.value = transcript;
        fetchWeather(transcript);
        voiceBtn.classList.remove('recording');
    };
    recognition.onerror = () => voiceBtn.classList.remove('recording');
    recognition.onend = () => voiceBtn.classList.remove('recording');
} else {
    voiceBtn.style.display = 'none';
}

/* ============================================================
   11. INITIAL LOAD
============================================================ */
window.onload = () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.querySelector('i').className = savedTheme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';

    fetchWeather('Delhi'); // Default city
};
