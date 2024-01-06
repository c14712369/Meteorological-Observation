const WeatherApiKey = 'CWA-A263E370-A500-49FE-A5FB-2604A4935915';
const AirApiKey = '778d19dc-1492-45ee-8f6b-9c68a551fed1';
const citySelect = document.getElementById('citySelect');
const weatherInfo = document.getElementById('weather-info');
const alertsinfo = document.getElementById('alerts-info');
const suninfo = document.getElementById('sun-info');
const aqiInfo = document.getElementById('aqi-Info');

window.onload = async function () {
    await initCityOptions(); // 初始化城市下拉選單
};

async function initCityOptions() {

    try {
        const apiUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${WeatherApiKey}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        const cities = data.records.location;

        cities.forEach(city => {
            const option = document.createElement('option');
            option.textContent = city.locationName;
            citySelect.appendChild(option);
        });

    } catch (error) {
        console.log(error);
        alert('初始化城市資訊時發生錯誤');
    }
}

const baseWeatherUrl = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';
const baseAqiUrl = 'https://data.moenv.gov.tw/api/v2/aqx_p_02';

async function fetchData(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        return await response.json();
    } catch (error) {
        console.error(error);
        throw new Error('An error occurred while fetching data.');
    }
}

function generateWeatherUrl(cityName) {
    return `${baseWeatherUrl}/F-C0032-001?Authorization=${WeatherApiKey}&locationName=${cityName}`;
}

function generateWarningUrl(cityName) {
    return `${baseWeatherUrl}/W-C0033-001?Authorization=${WeatherApiKey}&locationName=${cityName}`;
}

function generateSunsetUrl(cityName) {
    const currentDate = getCurrentDateFormatted();
    return `${baseWeatherUrl}/A-B0062-001?Authorization=${WeatherApiKey}&CountyName=${cityName}&Date=${currentDate}`;
}

function generateAqiUrl() {
    return `${baseAqiUrl}?language=zh&api_key=778d19dc-1492-45ee-8f6b-9c68a551fed1`;
}

async function showInfo() {
    const cityName = citySelect.value;
    await Promise.all([
        getWeather(cityName),
        getWarning(cityName),
        getSunset(cityName),
        getAQI(cityName)
    ]);
}

async function getWeather(cityName) {
    const data = await fetchData(generateWeatherUrl(cityName));
    const location = data.records.location;
    const weatherElement = location[0].weatherElement;

    weatherInfo.innerHTML = weatherElement[0].time.map(data => `
        <p>${data.startTime}至${data.endTime}<br>天氣為：${data.parameter.parameterName}</p>
    `).join('');
}

async function getWarning(cityName) {
    const data = await fetchData(generateWarningUrl(cityName));
    const hazards = data.records.location[0].hazardConditions.hazards;

    alertsinfo.innerHTML = hazards.length > 0 ?
        hazards.map(data => `<p>${cityName}目前有${data}危險！</p>`).join('') :
        `<p>目前無任何警報<p/>`;
}

async function getSunset(cityName) {
    const data = await fetchData(generateSunsetUrl(cityName));
    const time = data.records.locations.location[0].time[0];

    suninfo.innerHTML = `<p>今日日出時間：${time.SunRiseTime}<br>今日日落時間：${time.SunSetTime}</p>`;
}

async function getAQI(cityName) {
    const data = await fetchData(generateAqiUrl());
    const dataInfo = data.records.filter(e => e.county == cityName);
    let num;

    if (dataInfo.length >= 2) {
        const max = dataInfo.reduce((maxRecord, record) => {
            const currentPM25 = parseFloat(record['pm25']);
            return isNaN(currentPM25) || currentPM25 <= maxRecord['pm25'] ? maxRecord : record;
        }, dataInfo[0]);
        
        num = max.pm25;
        aqiInfo.innerHTML = `<p>今日空氣懸浮微粒：${max.pm25}<p/>`;
    } else {
        num = dataInfo.pm25
        aqiInfo.innerHTML = `<p>今日空氣懸浮微粒：${dataInfo.pm25}<p/>`;
    }

    aqiInfo.innerHTML += num > 35 ? `<p>空氣不良，出門請戴口罩！<p/>` : `<p>空氣正常，請安心出門！<p/>`;
}




function getCurrentDateFormatted() {
    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // 加1是因为月份从0开始，padStart用于补零
    const day = currentDate.getDate().toString().padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    return formattedDate;
}