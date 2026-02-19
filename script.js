const apiKey = '39d1baed128e656bc56581192d627e59';
const bodyBg = document.getElementById('body-bg');
const cityInput = document.getElementById('cityInput');
const voiceBtn = document.getElementById('voiceBtn');
const overlay = document.querySelector('.overlay');

// 1. Clock & Date
function updateDateTime() {
    const now = new Date();
    document.getElementById('liveTime').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('liveDate').innerText = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(updateDateTime, 1000);
updateDateTime();

// 2. Powerful Background Logic
function setBackground(weather) {
    let imageUrl = "";
    const w = weather.toLowerCase();

    if (w.includes("clear")) imageUrl = "https://images.unsplash.com/photo-1506588345361-5e12b7840845?auto=format&fit=crop&w=1600&q=80";
    else if (w.includes("cloud")) imageUrl = "https://images.unsplash.com/photo-1483977399921-6cf3832f7c4e?auto=format&fit=crop&w=1600&q=80";
    else if (w.includes("rain") || w.includes("drizzle") || w.includes("thunderstorm")) imageUrl = "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1600&q=80";
    else if (w.includes("snow")) imageUrl = "https://images.unsplash.com/photo-1478265409131-1f65c88f965c?auto=format&fit=crop&w=1600&q=80";
    else if (w.includes("mist") || w.includes("haze") || w.includes("fog")) imageUrl = "https://images.unsplash.com/photo-1485236715598-c8879a632a81?auto=format&fit=crop&w=1600&q=80";
    else imageUrl = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80";

    bodyBg.style.backgroundImage = `url('${imageUrl}')`;
}

// 3. Theme Toggle Logic
const themeToggle = document.getElementById('themeToggle');
if(themeToggle) {
    themeToggle.onclick = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Dynamic Overlay Adjustment
        overlay.style.background = newTheme === 'light' ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.4)";
        themeToggle.querySelector('i').className = newTheme === 'light' ? "fa-solid fa-sun" : "fa-solid fa-moon";
    };
}

// 4. Weather Fetching
async function fetchWeather(city) {
    if (!city) return;
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
        const data = await res.json();
        
        if(data.cod === "404") return alert("City not found!");

        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
        const forecastData = await forecastRes.json();

        updateUI(data, forecastData);
        setBackground(data.weather[0].main); // This updates the image
    } catch (e) { console.error("Error fetching weather:", e); }
}

function updateUI(current, forecast) {
    document.getElementById('cityName').innerHTML = `<i class="fa-solid fa-location-arrow"></i> ${current.name}`;
    document.getElementById('mainTemp').innerText = `${Math.round(current.main.temp)}°C`;
    document.getElementById('weatherDesc').innerText = current.weather[0].description;
    document.getElementById('humidityValue').innerText = `${current.main.humidity}%`;
    document.getElementById('windValue').innerText = `${current.wind.speed} km/h`;
    document.getElementById('mainIcon').src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;

    const forecastCards = document.getElementById('forecastCards');
    forecastCards.innerHTML = '';
    // Next 5 days logic
    for (let i = 7; i < forecast.list.length; i += 8) {
        const day = forecast.list[i];
        const date = new Date(day.dt * 1000).toLocaleDateString('en', {weekday: 'short'});
        forecastCards.innerHTML += `
            <div class="f-card">
                <p>${date}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
                <p><strong>${Math.round(day.main.temp)}°C</strong></p>
            </div>`;
    }
}

// 5. Search & Initial Load
document.getElementById('searchBtn').onclick = () => fetchWeather(cityInput.value);
cityInput.onkeypress = (e) => { if(e.key === "Enter") fetchWeather(cityInput.value); };

window.onload = () => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    overlay.style.background = savedTheme === 'light' ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.4)";
    
    fetchWeather('Delhi'); // Default city
};

// 6. Voice Recognition
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
}