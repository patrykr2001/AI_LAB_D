const currentApi = 'https://api.openweathermap.org/data/2.5/weather';
const forecast5Api = 'https://api.openweathermap.org/data/2.5/forecast';
const apiKey = 'api-key'; //get from openweathermap.org

document.addEventListener('DOMContentLoaded', function () {
  const searchButton = document.getElementById('searchButton');
  searchButton.addEventListener('click', onSearchButtonClick);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByGeolocation(latitude, longitude);
      fetchForecastByGeolocation(latitude, longitude);
    });
  } else {
    alert('Geolocation is not supported by this browser.');
  }
});

function onSearchButtonClick() {
  const city = document.getElementById('cityInput').value;
  fetchWeatherByCity(city);
  fetchForecastByCity(city);
}

function fetchWeatherByCity(city) {
  const url = `${currentApi}?q=${city}&units=metric&lang=pl&appid=${apiKey}`;
  fetchAndParseCurrentWeatherData(url);
}

function fetchWeatherByGeolocation(lat, lon) {
  const url = `${currentApi}?lat=${lat}&lon=${lon}&units=metric&lang=pl&appid=${apiKey}`;
  fetchAndParseCurrentWeatherData(url);
}

function fetchForecastByCity(city) {
  const url = `${forecast5Api}?q=${city}&units=metric&lang=pl&appid=${apiKey}`;
  fetchAndParseForecastData(url);
}

function fetchForecastByGeolocation(lat, lon) {
  const url = `${forecast5Api}?lat=${lat}&lon=${lon}&units=metric&lang=pl&appid=${apiKey}`;
  fetchAndParseForecastData(url);
}

function fetchAndParseCurrentWeatherData(url) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      const data = JSON.parse(xhr.responseText);
      const cityName = data.name;
      const feelsLike = roundToHalfDegree(data.main.feels_like);
      const temperature = roundToHalfDegree(data.main.temp);
      const minTemperature = roundToHalfDegree(data.main.temp_min);
      const maxTemperature = roundToHalfDegree(data.main.temp_max);
      const weatherMain = data.weather[0].main;
      const weatherIcon = data.weather[0].icon;
      const weatherDescription = data.weather[0].description;
      const humidity = data.main.humidity;
      const pressure = data.main.pressure;
      const windSpeed = data.wind.speed;
      const windGust = data.wind.gust;

      const iconUrl = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;

      document.getElementById('weather-title').textContent = `📍${cityName}`;
      document.getElementById('weather-info').innerHTML = `
                <h2 style="card-text"><img src="${iconUrl}" alt="${weatherMain}">${temperature}°C</h2>
                <p style="card-text">${weatherDescription}</p>
                <p style="card-text">Temperatura odczuwalna: ${feelsLike}°C</p>
                <p style="card-text">Od ${minTemperature}°C do ${maxTemperature}°C</p>
                <p style="card-text">wilgotność ${humidity}%, ciśnienie ${pressure} hPa</p>
                <p style="card-text">wiatr ${windSpeed} m/s, w porywach do ${windGust} m/s</p>
            `;
    } else {
      console.error('Error fetching weather data:', xhr.statusText);
    }
  };

  xhr.onerror = function () {
    console.error('Request error');
  };

  xhr.send();
}

function fetchAndParseForecastData(url) {
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      let forecastContainer = document.getElementById('forecast-today');
      forecastContainer.innerHTML = ''; // Clear previous forecast

      const today = new Date().getDate();
      let hourlyCount = 0;
      const dailyForecasts = {};

      data.list.forEach((forecast) => {
        const dateTime = new Date(forecast.dt * 1000);
        const day = dateTime.getDate();
        const temperature = roundToHalfDegree(forecast.main.temp);
        const minTemperature = roundToHalfDegree(forecast.main.temp_min);
        const maxTemperature = roundToHalfDegree(forecast.main.temp_max);
        const weatherDescription = forecast.weather[0].description;
        const weatherIcon = forecast.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;

        if (!dailyForecasts[day]) {
          dailyForecasts[day] = {
            dateTime,
            temperature,
            minTemperature,
            maxTemperature,
            weatherDescription,
            weatherIcon,
          };
        } else {
          dailyForecasts[day].minTemperature = Math.min(
            dailyForecasts[day].minTemperature,
            minTemperature,
          );
          dailyForecasts[day].maxTemperature = Math.max(
            dailyForecasts[day].maxTemperature,
            maxTemperature,
          );
        }

        if (day === today && hourlyCount < 8) {
          // Display hourly forecast for today
          const forecastElement = document.createElement('div');
          forecastElement.className = 'col-xs-6 col-sm-4 col-md-3 col-lg-2';
          forecastElement.innerHTML = `
            <div class="card text-center">
              <div class="card-body">
                <h3 class="card-title">${getFormattedHour(dateTime)}</h3>
                <img src="${iconUrl}" alt="${weatherDescription}">
                <p class="card-text">${temperature}°C</p>
                <p class="card-text">${weatherDescription}</p>
              </div>
            </div>
          `;
          forecastContainer.appendChild(forecastElement);
          hourlyCount++;
        }
      });

      forecastContainer = document.getElementById('forecast-week');

      // Display daily forecast for subsequent days
      Object.values(dailyForecasts).forEach((forecast) => {
        const forecastElement = document.createElement('div');
        forecastElement.className = 'col-md-4 col-lg-3';
        forecastElement.innerHTML = `
          <div class="card text-center">
          <div class="card-header"><h3 class="card-title" style="text-transform: capitalize">${getDayDescription(forecast.dateTime)}</h3></div>
            <div class="card-body">
              <img src="https://openweathermap.org/img/wn/${forecast.weatherIcon}@2x.png" alt="${forecast.weatherDescription}">
              <p class="card-text">Od ${forecast.minTemperature}°C do ${forecast.maxTemperature}°C</p>
              <p class="card-text">${forecast.weatherDescription}</p>
            </div>
          </div>
        `;
        forecastContainer.appendChild(forecastElement);
      });
    })
    .catch((error) => console.error('Error fetching forecast data:', error));
}

function roundToHalfDegree(temp) {
  return Math.round(temp * 2) / 2;
}

function getDayDescription(date) {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return 'dziś';
  } else {
    return date.toLocaleDateString('pl-PL', { weekday: 'long' });
  }
}

function getFormattedHour(date) {
  const hours = date.getHours();
  return hours < 10 ? `0${hours}` : `${hours}`;
}
