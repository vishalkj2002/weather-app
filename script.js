const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-button");
const apiKey = "886aff4cc90de20838c4e24c3ed9923e";
const weatherInfoSection = document.querySelector(".weather-info");
const notFoundSection = document.querySelector(".not-found");
const searchCitySection = document.querySelector(".search-city");
const countryTxt = document.querySelector(".country-txt");
const tempTxt = document.querySelector(".temp-txt");
const conditionTxt = document.querySelector(".condition-txt");
const humidityValueTxt = document.querySelector(".humidity-value-txt");
const windValueTxt = document.querySelector(".wind-value-txt");
const weatherSummaryImg = document.querySelector(".weather-summary-img");
const currentDateTxt = document.querySelector(".current-date-txt");
const forecastItemsContainer = document.querySelector(
  ".forecast-items-container"
);

searchButton.addEventListener("click", () => {
  if (cityInput.value.trim() !== "") {
    updateWeatherInfo(cityInput.value);
    cityInput.value = "";
    cityInput.blur();
  }
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && cityInput.value.trim() !== "") {
    updateWeatherInfo(cityInput.value);
    cityInput.value = "";
    cityInput.blur();
  }
});

async function getFetchData(endPoint, city) {
  const apiURL = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
  const response = await fetch(apiURL);
  return response.json();
}

function getWeatherIcon(id) {
  if (id <= 232) return "thunderstorm.svg";
  if (id <= 321) return "drizzle.svg";
  if (id <= 531) return "rain.svg";
  if (id <= 622) return "snow.svg";
  if (id <= 781) return "atmosphere.svg";
  if (id <= 800) return "clear.svg";
  return "clouds.svg";
}

function getCurrentDate() {
  const currentDate = new Date();
  const options = {
    weekday: "short",
    day: "2-digit",
    month: "short",
  };
  return currentDate.toLocaleDateString("en-GB", options);
}

async function updateWeatherInfo(city) {
  try {
    const weatherData = await getFetchData("weather", city);
    if (weatherData.cod !== 200) {
      showDisplaySection(notFoundSection);
      return;
    }

    const {
      name: country,
      main: { temp, humidity },
      weather: [{ id, main }],
      wind: { speed },
    } = weatherData;

    // Update current weather
    countryTxt.textContent = country;
    tempTxt.textContent = `${Math.round(temp)}°C`;
    humidityValueTxt.textContent = `${humidity}%`;
    conditionTxt.textContent = main;
    windValueTxt.textContent = `${speed}M/s`;
    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;

    // Update forecast
    await updateForecastsInfo(city);
    showDisplaySection(weatherInfoSection);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    showDisplaySection(notFoundSection);
  }
}

async function updateForecastsInfo(city) {
  try {
    const forecastData = await getFetchData("forecast", city);
    if (!forecastData.list) return;

    forecastItemsContainer.innerHTML = "";
    const dailyForecasts = new Map(); // Use Map to store one forecast per day

    // Get today's date without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process forecast data
    forecastData.list.forEach((forecast) => {
      const forecastDate = new Date(forecast.dt * 1000);
      forecastDate.setHours(0, 0, 0, 0);

      // Skip today's forecast
      if (forecastDate.getTime() === today.getTime()) return;

      // Use date as key to avoid duplicates
      const dateKey = forecastDate.toDateString();

      // Take the noon forecast or update existing one if closer to noon
      if (!dailyForecasts.has(dateKey)) {
        dailyForecasts.set(dateKey, forecast);
      } else {
        const existingForecast = dailyForecasts.get(dateKey);
        const existingHour = new Date(existingForecast.dt * 1000).getHours();
        const currentHour = forecastDate.getHours();

        // If this forecast is closer to noon (12:00), use it instead
        if (Math.abs(12 - currentHour) < Math.abs(12 - existingHour)) {
          dailyForecasts.set(dateKey, forecast);
        }
      }
    });

    // Take first 5 days
    const fiveDayForecast = Array.from(dailyForecasts.values()).slice(0, 5);

    // Create forecast elements
    fiveDayForecast.forEach((forecast) => {
      const date = new Date(forecast.dt * 1000);
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });

      const forecastItem = `
        <div class="forecast-item">
          <h5 class="forecast-item-date regular-txt">${formattedDate}</h5>
          <img src="assets/weather/${getWeatherIcon(forecast.weather[0].id)}"
               class="forecast-item-img"
               alt="${forecast.weather[0].description}">
          <h5 class="forecast-item-temp">${Math.round(
            forecast.main.temp
          )}°C</h5>
        </div>
      `;
      forecastItemsContainer.insertAdjacentHTML("beforeend", forecastItem);
    });
  } catch (error) {
    console.error("Error updating forecast:", error);
  }
}

function showDisplaySection(section) {
  [weatherInfoSection, searchCitySection, notFoundSection].forEach(
    (section) => (section.style.display = "none")
  );
  section.style.display = "flex";
}

// Initial section display
showDisplaySection(searchCitySection);
