// Suitability Map for "Find your ideal neighborhoods"
// Uses housing data to calculate borough suitability based on user preferences

(function () {
    // API Configuration
    const API_BASE = 'http://localhost:3000/api/data';

    const svg = d3.select(".suitability-map svg");
    const tooltip = d3.select(".suitability-tooltip");

    let londonBoroughs = [];
    let statsData = null;

    // Get slider elements
    const sliders = {
        commute: document.getElementById('commuteSlider'),
        transport: document.getElementById('transportSlider'),
        parks: document.getElementById('parksSlider'),
        air: document.getElementById('airSlider'),
        school: document.getElementById('schoolSlider'),
        diversity: document.getElementById('diversitySlider'),
        broadband: document.getElementById('broadbandSlider'),
        density: document.getElementById('densitySlider'),
        income: document.getElementById('incomeSlider'),
        pay: document.getElementById('paySlider'),
        happiness: document.getElementById('happinessSlider'),
        supermarket: document.getElementById('supermarketSlider')
    };

    let boroughPaths;
    let colorScale;
    let boroughMetrics = {};

    // Formatting helpers
    const fmt = {
        percent: (v) => `${(+v).toFixed(1)}%`,
        minutes: (v) => `${(+v).toFixed(1)} min`,
        money: (v) => '£' + d3.format(",.0f")(v),
        count: (v) => d3.format(",")(v),
        density: (v) => d3.format(",")(v),
        tco2: (v) => (+v).toFixed(2),
        index10: (v) => (+v).toFixed(2),
        per1k: (v) => (+v).toFixed(1)
    };

    // Update left & right legends below sliders
    function annotateSliderEnds(sliderId, minVal, maxVal, formatFn) {
        const input = document.getElementById(sliderId);
        if (!input) return;
        const legendRow = input.parentElement.querySelector("div:last-of-type");
        if (!legendRow) return;

        const spans = legendRow.querySelectorAll("span");
        if (spans.length < 2) return;

        const leftSpan = spans[0];
        const rightSpan = spans[1];

        const leftBase = leftSpan.getAttribute("data-base") || leftSpan.textContent.trim();
        const rightBase = rightSpan.getAttribute("data-base") || rightSpan.textContent.trim();

        if (!leftSpan.getAttribute("data-base")) leftSpan.setAttribute("data-base", leftBase);
        if (!rightSpan.getAttribute("data-base")) rightSpan.setAttribute("data-base", rightBase);

        leftSpan.textContent = `${leftBase} (${formatFn(minVal)})`;
        rightSpan.textContent = `${rightBase} (${formatFn(maxVal)})`;
    }

    // Robust normalization using percentiles (less sensitive to outliers)
    function normalizeValue(value, values, invert = false) {
        values = values.filter(v => v != null && !isNaN(v)).sort((a, b) => a - b);
        const lowerIndex = Math.floor(values.length * 0.05);
        const upperIndex = Math.floor(values.length * 0.95);
        const lower = values[lowerIndex];
        const upper = values[upperIndex];
        const clamped = Math.min(Math.max(value, lower), upper);
        const normalized = ((clamped - lower) / (upper - lower)) * 100;
        return invert ? 100 - normalized : normalized;
    }

    async function loadStatsData() {
        try {
            const response = await fetch(`${API_BASE}/stats`);
            if (!response.ok) throw new Error('Failed to load stats data');
            const json = await response.json();
            statsData = json.data;

            const commuteValues = statsData.map(d => d.average_time_to_employment_centre_in_minutes);
            const waitingValues = statsData.map(d => d.average_waiting_time_in_minutes);
            const greenValues = statsData.map(d => d.percent_green_plus_blue_area);
            const emissionsValues = statsData.map(d => d.Greenhouse_gas_emissions_per_capita);
            const schoolValues = statsData.map(d => d.percent_school_outstanding);
            const restaurantValues = statsData.map(d => d['number_of_restaurant_cafe,pub']);
            const broadbandValues = statsData.map(d => d.percent_coverage_broadband);
            const densityValues = statsData.map(d => d.density_per_kilometer);
            const incomeValues = statsData.map(d => d.gross_disposable_household_income);
            const payValues = statsData.map(d => d.gross_median_weekly_pay);
            const happinessValues = statsData.map(d => d.happiness_index);
            const supermarketValues = statsData.map(d => d.supermarket_per_1000);

            statsData.forEach(borough => {
                const name = borough['Area name'];
                londonBoroughs.push(name);

                boroughMetrics[name] = {
                    commute: normalizeValue(borough.average_time_to_employment_centre_in_minutes, commuteValues, true),
                    transport: normalizeValue(borough.average_waiting_time_in_minutes, waitingValues, true),
                    parks: normalizeValue(borough.percent_green_plus_blue_area, greenValues),
                    air: normalizeValue(borough.Greenhouse_gas_emissions_per_capita, emissionsValues, true),
                    school: normalizeValue(borough.percent_school_outstanding, schoolValues),
                    diversity: normalizeValue(borough['number_of_restaurant_cafe,pub'], restaurantValues),
                    broadband: normalizeValue(borough.percent_coverage_broadband, broadbandValues),
                    density: normalizeValue(borough.density_per_kilometer, densityValues, true),
                    income: normalizeValue(borough.gross_disposable_household_income, incomeValues),
                    pay: normalizeValue(borough.gross_median_weekly_pay, payValues),
                    happiness: normalizeValue(borough.happiness_index, happinessValues),
                    supermarket: normalizeValue(borough.supermarket_per_1000, supermarketValues)
                };
            });

            // Update labels with real min/max
            annotateSliderEnds('commuteSlider', d3.max(commuteValues), d3.min(commuteValues), fmt.minutes);
            annotateSliderEnds('transportSlider', d3.max(waitingValues), d3.min(waitingValues), fmt.minutes);
            annotateSliderEnds('parksSlider', d3.min(greenValues), d3.max(greenValues), fmt.percent);
            annotateSliderEnds('airSlider', d3.max(emissionsValues), d3.min(emissionsValues), fmt.tco2);
            annotateSliderEnds('schoolSlider', d3.min(schoolValues), d3.max(schoolValues), fmt.percent);
            annotateSliderEnds('diversitySlider', d3.min(restaurantValues), d3.max(restaurantValues), fmt.count);
            annotateSliderEnds('broadbandSlider', d3.min(broadbandValues), d3.max(broadbandValues), fmt.percent);
            annotateSliderEnds('densitySlider', d3.max(densityValues), d3.min(densityValues), fmt.density);
            annotateSliderEnds('incomeSlider', d3.min(incomeValues), d3.max(incomeValues), fmt.money);
            annotateSliderEnds('paySlider', d3.min(payValues), d3.max(payValues), fmt.money);
            annotateSliderEnds('happinessSlider', d3.min(happinessValues), d3.max(happinessValues), fmt.index10);
            annotateSliderEnds('supermarketSlider', d3.min(supermarketValues), d3.max(supermarketValues), fmt.per1k);

                        function setSliderRange(id, minVal, maxVal, step = 1) {
              const slider = document.getElementById(id);
              if (slider) {
                slider.min = minVal;
                slider.max = maxVal;
                slider.step = step;
                slider.value = (minVal + maxVal) / 2;
              }
            }

            setSliderRange('commuteSlider', d3.min(commuteValues), d3.max(commuteValues), 0.1);
            setSliderRange('transportSlider', d3.min(waitingValues), d3.max(waitingValues), 0.1);
            setSliderRange('parksSlider', d3.min(greenValues), d3.max(greenValues), 0.1);
            setSliderRange('airSlider', d3.min(emissionsValues), d3.max(emissionsValues), 0.01);
            setSliderRange('schoolSlider', d3.min(schoolValues), d3.max(schoolValues), 0.1);
            setSliderRange('diversitySlider', d3.min(restaurantValues), d3.max(restaurantValues), 1);
            setSliderRange('broadbandSlider', d3.min(broadbandValues), d3.max(broadbandValues), 0.1);
            setSliderRange('densitySlider', d3.min(densityValues), d3.max(densityValues), 1);
            setSliderRange('incomeSlider', d3.min(incomeValues), d3.max(incomeValues), 10);
            setSliderRange('paySlider', d3.min(payValues), d3.max(payValues), 1);
            setSliderRange('happinessSlider', d3.min(happinessValues), d3.max(happinessValues), 0.01);
            setSliderRange('supermarketSlider', d3.min(supermarketValues), d3.max(supermarketValues), 0.1);

            // 🟢 Real-time value update
            const updateValueLabel = (id, value) => {
                const span = document.getElementById(id + 'Value');
                if (!span) return;
                let text = value;
                if (id === 'commute' || id === 'transport') text = fmt.minutes(value);
                else if (id === 'air') text = fmt.tco2(value);
                else if (id === 'income' || id === 'pay') text = fmt.money(value);
                else if (id === 'parks' || id === 'broadband' || id === 'school') text = fmt.percent(value);
                else if (id === 'density') text = fmt.density(value);
                else if (id === 'diversity') text = fmt.count(value);
                else if (id === 'supermarket') text = fmt.per1k(value);
                else if (id === 'happiness') text = fmt.index10(value);
                span.textContent = text;
            };

            Object.entries(sliders).forEach(([key, slider]) => {
                if (slider) {
                    updateValueLabel(key, slider.value);
                    slider.addEventListener("input", (e) => {
                        updateValueLabel(key, e.target.value);
                        updateSuitabilityMap();
                    });
                }
            });

            return true;
        } catch (error) {
            console.error('Error loading stats data:', error);
            return false;
        }
    }

    // Calculate suitability score
    function calculateSuitability(borough, preferences) {
        const metrics = boroughMetrics[borough];
        if (!metrics) return 0;
        const scores = Object.keys(metrics).map(k => 100 - Math.abs(preferences[k] - metrics[k]));
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return Math.max(0, Math.min(100, avg));
    }

// Get preferences from sliders
function getPreferences() {
    const values = {};

    // Helper to normalize any real value to 0–100 based on slider range
    const normalize = (slider, invert = false) => {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const norm = ((val - min) / (max - min)) * 100;
        return invert ? 100 - norm : norm;
    };

    // Normalize each slider according to whether "higher = better" or "lower = better"
    values.commute = sliders.commute ? normalize(sliders.commute, true) : 50;        // lower better
    values.transport = sliders.transport ? normalize(sliders.transport, true) : 70;  // lower better
    values.parks = sliders.parks ? normalize(sliders.parks) : 80;
    values.air = sliders.air ? normalize(sliders.air, true) : 60;                    // lower better
    values.school = sliders.school ? normalize(sliders.school) : 75;
    values.diversity = sliders.diversity ? normalize(sliders.diversity) : 90;
    values.broadband = sliders.broadband ? normalize(sliders.broadband) : 90;
    values.density = sliders.density ? normalize(sliders.density, true) : 50;        // lower better
    values.income = sliders.income ? normalize(sliders.income) : 60;
    values.pay = sliders.pay ? normalize(sliders.pay) : 60;
    values.happiness = sliders.happiness ? normalize(sliders.happiness) : 75;
    values.supermarket = sliders.supermarket ? normalize(sliders.supermarket) : 50;

    return values;
}


    // Update map colors
    function updateSuitabilityMap() {
        const preferences = getPreferences();
        const scores = {};
        londonBoroughs.forEach(borough => {
            scores[borough] = calculateSuitability(borough, preferences);
        });

        const maxScore = Math.max(...Object.values(scores));
        const minScore = Math.min(...Object.values(scores));
        colorScale = d3.scaleSequential(d3.interpolateGreens).domain([minScore, maxScore]);

        if (boroughPaths) {
            boroughPaths.attr("fill", d => {
                const borough = d.properties.NAME.trim();
                const score = scores[borough];
                return score ? colorScale(score) : "#ccc";
            });
        }
                // 🆕 Create an array of borough scores for recommendation
const boroughScores = Object.keys(scores).map(name => ({
    name,
    score: scores[name]
}));

// 🆕 Generate recommendation summary
generateRecommendation(preferences, boroughScores);
    }

    // Initialize map
    async function initializeMap() {
        const statsLoaded = await loadStatsData();
        if (!statsLoaded) {
            alert("Failed to load statistics data. Please ensure the backend server is running.");
            return;
        }

        d3.json(`${API_BASE}/map/geojson`).then(topo => {
            const objectName = Object.keys(topo.objects)[0];
            const geojson = topojson.feature(topo, topo.objects[objectName]);
            geojson.features = geojson.features.filter(d =>
                londonBoroughs.includes(d.properties.NAME.trim())
            );

            const projection = d3.geoMercator()
                .center([-0.1, 51.5])
                .scale(42000)
                .translate([400, 250]);

            const path = d3.geoPath().projection(projection);

            boroughPaths = svg.append("g")
                .attr("class", "suitability-boroughs")
                .selectAll("path")
                .data(geojson.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", "#ccc")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .style("cursor", "pointer")
                .on("mouseover", function (event, d) {
                    const borough = d.properties.NAME.trim();
                    const preferences = getPreferences();
                    const score = calculateSuitability(borough, preferences);
                    const metrics = boroughMetrics[borough];

                    d3.select(this).attr("stroke", "#333").attr("stroke-width", 2.5);
                    tooltip.transition().duration(200).style("opacity", 1);
                   const boroughData = statsData.find(b => b["Area name"] === borough);

tooltip.html(`
    <strong>${borough}</strong><br>
    <strong>Suitability Score: ${score.toFixed(1)}/100</strong><br>
    <hr style="margin: 5px 0;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
        <div>🕓 Commute: ${fmt.minutes(boroughData.average_time_to_employment_centre_in_minutes)} (score ${metrics.commute.toFixed(0)})</div>
        <div>🚌 Transport: ${fmt.minutes(boroughData.average_waiting_time_in_minutes)} (score ${metrics.transport.toFixed(0)})</div>
        <div>🌳 Parks: ${fmt.percent(boroughData.percent_green_plus_blue_area)} (score ${metrics.parks.toFixed(0)})</div>
        <div>🌫️ Emissions: ${fmt.tco2(boroughData.Greenhouse_gas_emissions_per_capita)} tCO₂e (score ${metrics.air.toFixed(0)})</div>
        <div>🎓 Schools: ${fmt.percent(boroughData.percent_school_outstanding)} (score ${metrics.school.toFixed(0)})</div>
        <div>🍽️ Restaurant: ${fmt.count(boroughData['number_of_restaurant_cafe,pub'])} (score ${metrics.diversity.toFixed(0)})</div>
        <div>🌐 Broadband: ${fmt.percent(boroughData.percent_coverage_broadband)} (score ${metrics.broadband.toFixed(0)})</div>
        <div>🏙️ Density: ${fmt.density(boroughData.density_per_kilometer)} /km² (score ${metrics.density.toFixed(0)})</div>
        <div>💷 Income: ${fmt.money(boroughData.gross_disposable_household_income)} (score ${metrics.income.toFixed(0)})</div>
        <div>💰 Pay: ${fmt.money(boroughData.gross_median_weekly_pay)} (score ${metrics.pay.toFixed(0)})</div>
        <div>😊 Happiness: ${fmt.index10(boroughData.happiness_index)} (score ${metrics.happiness.toFixed(0)})</div>
        <div>🛒 Shops: ${fmt.per1k(boroughData.supermarket_per_1000)} / 1k ppl (score ${metrics.supermarket.toFixed(0)})</div>
    </div>
`);


                    const [x, y] = d3.pointer(event, svg.node());
                    tooltip.style("left", (x + 20) + "px").style("top", (y + 20) + "px");
                })
                .on("mousemove", function (event) {
                    const [x, y] = d3.pointer(event, svg.node());
                    tooltip.style("left", (x + 20) + "px").style("top", (y + 20) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5);
                    tooltip.transition().duration(200).style("opacity", 0);
                });

            updateSuitabilityMap();
        }).catch(err => {
            console.error("Error loading TopoJSON:", err);
            alert("Failed to load map data for suitability analysis.");
        });
    }

    initializeMap();
       function generateRecommendation(preferences, boroughScores) {
  const recBox = document.getElementById("recommendationBox");
  const recText = document.getElementById("recommendationText");
  if (!recBox || !recText) return;

   const messages = [];

  // Accessibility & Connectivity
  if (preferences.commute < 40) messages.push("short commutes");
  if (preferences.transport > 60) messages.push("efficient public transport");
  if (preferences.broadband > 70) messages.push("strong broadband connectivity");

  // Environment & Liveability
  if (preferences.parks > 70) messages.push("abundant green space");
  if (preferences.air > 70) messages.push("cleaner air");
  if (preferences.density < 40) messages.push("low-density neighborhoods");

  // Community & Lifestyle
  if (preferences.school > 70) messages.push("great schools");
  if (preferences.diversity > 70) messages.push("vibrant dining and cultural options");
  if (preferences.supermarket > 70) messages.push("plenty of nearby shops");

  // Economic & Wellbeing
  if (preferences.income > 70) messages.push("wealthier communities");
  if (preferences.pay > 70) messages.push("higher earning potential");
  if (preferences.happiness > 70) messages.push("happier residents");
  // Pick top 3 boroughs (assuming boroughScores = [{name, score}, ...])
  const top3 = boroughScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(b => b.name);

  // Build narrative text
  const prefText =
    messages.length > 0
      ? `You prefer areas with ${messages.slice(0, 4).join(", ")}`
      : `You have a balanced mix of priorities`;

  recText.innerHTML = `🎯 ${prefText} — try <b>${top3.join(", ")}</b>.`;
  recBox.style.display = "block";
}

})();
