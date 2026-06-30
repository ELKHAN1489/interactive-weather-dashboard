// 1. Твой API Ключ и базовый URL
const API_KEY = 'cd9e80739cd54436812160155263006';
const BASE_URL = 'https://api.weatherapi.com/v1';

// 2. Находим элементы интерфейса в DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');

const cityName = document.getElementById('cityName');
const weatherDesc = document.getElementById('weatherDesc');
const temperature = document.getElementById('temperature');
const mainIcon = document.getElementById('mainIcon');

const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const localTime = document.getElementById('localTime');
const bgOverlay = document.getElementById('bgOverlay');

let weatherChart = null; // Глобальная переменная для графика

// 3. Главная функция для получения данных с WeatherAPI
async function getWeatherData(query) {
    try {
        // Запрашиваем прогноз на 3 дня (forecast.json), чтобы построить график
        const response = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${query}&days=3&lang=ru`);
        
        if (!response.ok) {
            throw new Error('Город не найден');
        }

        const data = await response.json();
        updateUI(data); // Обновляем интерфейс данными
        updateChart(data.forecast.forecastday); // Строим график

    } catch (error) {
        alert(error.message);
        console.error('Ошибка при получении данных:', error);
    }
}

// 4. Функция обновления текстовых данных и фишек (фон, иконки)
function updateUI(data) {
    const current = data.current;
    const location = data.location;

    // Заполняем базовую инфу
    cityName.textContent = location.name;
    weatherDesc.textContent = current.condition.text;
    temperature.textContent = Math.round(current.temp_c);
    
    humidity.textContent = `${current.humidity} %`;
    windSpeed.textContent = `${Math.round(current.wind_kph)} км/ч`;
    
    // Вырезаем только время из строки "YYYY-MM-DD HH:MM"
    localTime.textContent = location.localtime.split(' ')[1];

    // --- ФИШКА ДЛЯ ПОРТФОЛИО: Динамический фон ---
    // WeatherAPI отдает коды погоды. Мы можем привязаться к тексту или коду
    const conditionText = current.condition.text.toLowerCase();
    changeDynamicBackground(conditionText);

    // Меняем иконку Boxicons в зависимости от погоды
    updateWeatherIcon(conditionText, current.is_day);
}

// 5. Логика динамического фона
function changeDynamicBackground(condition) {
    let bgUrl = '';

    if (condition.includes('дождь') || condition.includes('ливень')) {
        bgUrl = 'assets/rain.jpg'; // Локальный путь вместо внешней ссылки
    } else if (condition.includes('снег') || condition.includes('метель')) {
        bgUrl = 'assets/snow.jpg';
    } else if (condition.includes('ясно') || condition.includes('солнечно')) {
        bgUrl = 'assets/clear.jpg';
    } else {
        bgUrl = 'assets/cloudy.jpg'; 
    }

    bgOverlay.style.backgroundImage = `url('${bgUrl}')`;
}

// 6. Подбор иконок Boxicons
function updateWeatherIcon(condition, isDay) {
    mainIcon.className = 'bx '; // Сбрасываем классы

    if (condition.includes('ясно') || condition.includes('солнечно')) {
        mainIcon.classList.add(isDay ? 'bx-sun' : 'bx-moon');
    } else if (condition.includes('дождь') || condition.includes('ливень')) {
        mainIcon.classList.add('bx-cloud-rain');
    } else if (condition.includes('гроза')) {
        mainIcon.classList.add('bx-cloud-lightning');
    } else if (condition.includes('снег')) {
        mainIcon.classList.add('bx-snowflake');
    } else {
        mainIcon.classList.add('bx-cloud'); // Просто облачно
    }
}

// 7. --- ФИШКА ДЛЯ ПОРТФОЛИО: Отрисовка графика Chart.js ---
function updateChart(forecastDays) {
    const ctx = document.getElementById('weatherChart').getContext('2d');

    // Собираем данные: дни (или часы) и температуру
    const labels = forecastDays.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
    });
    const temps = forecastDays.map(day => day.day.avgtemp_c);

    // Если график уже существует, уничтожаем его перед созданием нового, чтобы не было багов
    if (weatherChart) {
        weatherChart.destroy();
    }

    // Создаем новый красивый неоновый график
    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Средняя температура (°C)',
                data: temps,
                borderColor: '#00d2ff',
                backgroundColor: 'rgba(0, 210, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4, // Делает линию плавной (кривая Безье)
                fill: true,
                pointBackgroundColor: '#fff',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Скрываем легенду, и так понятно
            },
            scales: {
                x: { ticks: { color: 'rgba(255, 255, 255, 0.7)' }, grid: { display: false } },
                y: { ticks: { color: 'rgba(255, 255, 255, 0.7)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            }
        }
    });
}

// 8. Логика определения геолокации пользователя
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const query = `${position.coords.latitude},${position.coords.longitude}`;
                getWeatherData(query);
            },
            () => {
                // Если запретил геолокацию, загружаем дефолтный город
                getWeatherData('Oskemen');
            }
        );
    } else {
        getWeatherData('Oskemen');
    }
}

// 9. Слушатели событий (Events)
searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') {
        getWeatherData(cityInput.value);
    }
});

cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && cityInput.value.trim() !== '') {
        getWeatherData(cityInput.value);
    }
});

geoBtn.addEventListener('click', getUserLocation);

// Стартовая инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', getUserLocation);

// Находим новый элемент списка подсказок в DOM
const suggestionsList = document.getElementById('suggestions');

// Слушаем ввод текста в инпут
cityInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();

    // Если введено меньше 2 символов, прячем список
    if (query.length < 2) {
        suggestionsList.style.display = 'none';
        return;
    }

    try {
        // Делаем поисковый запрос к API автодополнения
        const response = await fetch(`${BASE_URL}/search.json?key=${API_KEY}&q=${query}`);
        if (!response.ok) return;

        const cities = await response.json();

        // Если ничего не найдено, скрываем контейнер
        if (cities.length === 0) {
            suggestionsList.style.display = 'none';
            return;
        }

        // Очищаем старые результаты перед выводом новых
        suggestionsList.innerHTML = '';

        // Отрисовываем каждый найденный город
        cities.forEach(city => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            
            // Форматируем строку: Город, Регион (если есть), Страна
            const regionInfo = city.region ? `${city.region}, ` : '';
            div.textContent = `${city.name}, ${regionInfo}${city.country}`;

            // При клике на город из списка
            div.addEventListener('click', () => {
                cityInput.value = city.name; // Подставляем имя в инпут
                suggestionsList.style.display = 'none'; // Прячем список
                getWeatherData(city.name); // Загружаем погоду для выбранного города
            });

            suggestionsList.appendChild(div);
        });

        // Показываем список, когда он заполнился
        suggestionsList.style.display = 'block';

    } catch (error) {
        console.error('Ошибка автодополнения:', error);
    }
});

// Закрываем список подсказок, если пользователь кликнул в любое другое место экрана
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        suggestionsList.style.display = 'none';
    }
});