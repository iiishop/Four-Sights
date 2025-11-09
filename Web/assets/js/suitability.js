// Suitability Map for "Find your ideal neighborhoods"
// This script uses housing data to calculate borough suitability based on user preferences

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
    let housingData = {};
    let colorScale;
    let boroughMetrics = {};

    function normalizeValue(value, min, max, invert = false) {
        const normalized = ((value - min) / (max - min)) * 100;
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

            const ranges = {
                commute: { min: Math.min(...commuteValues), max: Math.max(...commuteValues) },
                waiting: { min: Math.min(...waitingValues), max: Math.max(...waitingValues) },
                green: { min: Math.min(...greenValues), max: Math.max(...greenValues) },
                emissions: { min: Math.min(...emissionsValues), max: Math.max(...emissionsValues) },
                school: { min: Math.min(...schoolValues), max: Math.max(...schoolValues) },
                restaurant: { min: Math.min(...restaurantValues), max: Math.max(...restaurantValues) },
                broadband: { min: Math.min(...broadbandValues), max: Math.max(...broadbandValues) },
                density: { min: Math.min(...densityValues), max: Math.max(...densityValues) },
                income: { min: Math.min(...incomeValues), max: Math.max(...incomeValues) },
                pay: { min: Math.min(...payValues), max: Math.max(...payValues) },
                happiness: { min: Math.min(...happinessValues), max: Math.max(...happinessValues) },
                supermarket: { min: Math.min(...supermarketValues), max: Math.max(...supermarketValues) }
            };

            statsData.forEach(borough => {
                const name = borough['Area name'];
                londonBoroughs.push(name);

                boroughMetrics[name] = {
                    commute: normalizeValue(borough.average_time_to_employment_centre_in_minutes, ranges.commute.min, ranges.commute.max, true),
                    transport: normalizeValue(borough.average_waiting_time_in_minutes, ranges.waiting.min, ranges.waiting.max, true),
                    parks: normalizeValue(borough.percent_green_plus_blue_area, ranges.green.min, ranges.green.max),
                    air: normalizeValue(borough.Greenhouse_gas_emissions_per_capita, ranges.emissions.min, ranges.emissions.max, true),
                    school: normalizeValue(borough.percent_school_outstanding, ranges.school.min, ranges.school.max),
                    diversity: normalizeValue(borough['number_of_restaurant_cafe,pub'], ranges.restaurant.min, ranges.restaurant.max),
                    broadband: normalizeValue(borough.percent_coverage_broadband, ranges.broadband.min, ranges.broadband.max),
                    density: normalizeValue(borough.density_per_kilometer, ranges.density.min, ranges.density.max),
                    income: normalizeValue(borough.gross_disposable_household_income, ranges.income.min, ranges.income.max),
                    pay: normalizeValue(borough.gross_median_weekly_pay, ranges.pay.min, ranges.pay.max),
                    happiness: normalizeValue(borough.happiness_index, ranges.happiness.min, ranges.happiness.max),
                    supermarket: normalizeValue(borough.supermarket_per_1000, ranges.supermarket.min, ranges.supermarket.max)
                };
            });

            return true;
        } catch (error) {
            console.error('Error loading stats data:', error);
            return false;
        }
    }

    // Calculate suitability score for a borough based on user preferences
    function calculateSuitability(borough, preferences) {
        const metrics = boroughMetrics[borough];
        if (!metrics) return 0;

        const commuteScore = Math.abs(100 - preferences.commute - metrics.commute);
        const transportScore = 100 - Math.abs(preferences.transport - metrics.transport);
        const parksScore = 100 - Math.abs(preferences.parks - metrics.parks);
        const airScore = 100 - Math.abs(preferences.air - metrics.air);
        const schoolScore = 100 - Math.abs(preferences.school - metrics.school);
        const diversityScore = 100 - Math.abs(preferences.diversity - metrics.diversity);
        const broadbandScore = 100 - Math.abs(preferences.broadband - metrics.broadband);
        const densityScore = 100 - Math.abs(preferences.density - metrics.density);
        const incomeScore = 100 - Math.abs(preferences.income - metrics.income);
        const payScore = 100 - Math.abs(preferences.pay - metrics.pay);
        const happinessScore = 100 - Math.abs(preferences.happiness - metrics.happiness);
        const supermarketScore = 100 - Math.abs(preferences.supermarket - metrics.supermarket);

        // Average all scores (equal weighting for all 12 metrics)
        const totalScore = (
            commuteScore + transportScore + parksScore + airScore +
            schoolScore + diversityScore + broadbandScore + densityScore +
            incomeScore + payScore + happinessScore + supermarketScore
        ) / 12;
        return Math.max(0, Math.min(100, totalScore));
    }

    // Get current user preferences from sliders
    function getPreferences() {
        return {
            commute: sliders.commute ? 100 - (parseFloat(sliders.commute.value) / 60 * 100) : 50,
            transport: sliders.transport ? parseFloat(sliders.transport.value) : 70,
            parks: sliders.parks ? parseFloat(sliders.parks.value) : 80,
            air: sliders.air ? parseFloat(sliders.air.value) : 60,
            school: sliders.school ? (parseFloat(sliders.school.value) - 1) / 4 * 100 : 75,
            diversity: sliders.diversity ? parseFloat(sliders.diversity.value) : 90,
            broadband: sliders.broadband ? parseFloat(sliders.broadband.value) : 90,
            density: sliders.density ? parseFloat(sliders.density.value) : 50,
            income: sliders.income ? parseFloat(sliders.income.value) : 60,
            pay: sliders.pay ? parseFloat(sliders.pay.value) : 60,
            happiness: sliders.happiness ? parseFloat(sliders.happiness.value) : 75,
            supermarket: sliders.supermarket ? parseFloat(sliders.supermarket.value) : 50
        };
    }

    // Update map colors based on suitability scores
    function updateSuitabilityMap() {
        const preferences = getPreferences();
        const scores = {};

        londonBoroughs.forEach(borough => {
            scores[borough] = calculateSuitability(borough, preferences);
        });

        // Update color scale
        const maxScore = Math.max(...Object.values(scores));
        const minScore = Math.min(...Object.values(scores));
        colorScale = d3.scaleSequential(d3.interpolateGreens)
            .domain([minScore, maxScore]);

        // Update borough colors immediately without transition
        if (boroughPaths) {
            boroughPaths.attr("fill", d => {
                const borough = d.properties.NAME.trim();
                const score = scores[borough];
                return score ? colorScale(score) : "#ccc";
            });
        }
    }

    async function initializeMap() {
        const statsLoaded = await loadStatsData();
        if (!statsLoaded) {
            alert("Failed to load statistics data. Please ensure the backend server is running.");
            return;
        }

        d3.json(`${API_BASE}/map/geojson`).then(topo => {
            const objectName = Object.keys(topo.objects)[0];
            let geojson = topojson.feature(topo, topo.objects[objectName]);
            geojson.features = geojson.features.filter(d =>
                londonBoroughs.includes(d.properties.NAME.trim())
            );

            // Set up projection with manual centering
            const projection = d3.geoMercator()
                .center([-0.1, 51.5])  // London center coordinates
                .scale(42000)           // Adjusted scale for better fit
                .translate([400, 250]); // Center in viewBox (800/2, 500/2)
            const path = d3.geoPath().projection(projection);

            // Draw boroughs
            boroughPaths = svg.append("g")
                .attr("class", "suitability-boroughs")
                .selectAll("path")
                .data(geojson.features)
                .enter().append("path")
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

                    d3.select(this)
                        .attr("stroke", "#333")
                        .attr("stroke-width", 2.5);

                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`
            <strong>${borough}</strong><br>
            <strong>Suitability Score: ${score.toFixed(1)}/100</strong><br>
            <hr style="margin: 5px 0; border-color: rgba(255,255,255,0.3);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
              <div>Commute: ${metrics.commute.toFixed(0)}</div>
              <div>Transport: ${metrics.transport.toFixed(0)}</div>
              <div>Parks: ${metrics.parks.toFixed(0)}</div>
              <div>Air Quality: ${metrics.air.toFixed(0)}</div>
              <div>Schools: ${metrics.school.toFixed(0)}</div>
              <div>Diversity: ${metrics.diversity.toFixed(0)}</div>
              <div>Broadband: ${metrics.broadband.toFixed(0)}</div>
              <div>Density: ${metrics.density.toFixed(0)}</div>
              <div>Income: ${metrics.income.toFixed(0)}</div>
              <div>Pay: ${metrics.pay.toFixed(0)}</div>
              <div>Happiness: ${metrics.happiness.toFixed(0)}</div>
              <div>Supermarket: ${metrics.supermarket.toFixed(0)}</div>
            </div>
          `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 1.5);

                    tooltip.transition().duration(200).style("opacity", 0);
                });

            // Add legend
            const legendWidth = 200;
            const legendHeight = 15;
            const legendX = 50;
            const legendY = 30;

            const defs = svg.append("defs");
            const gradient = defs.append("linearGradient")
                .attr("id", "suitability-gradient")
                .attr("x1", "0%").attr("x2", "100%");

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", d3.interpolateGreens(0));

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", d3.interpolateGreens(1));

            const legendG = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${legendX},${legendY})`);

            legendG.append("text")
                .attr("x", 0)
                .attr("y", -5)
                .attr("font-size", "12px")
                .attr("font-weight", "600")
                .text("Suitability Score");

            legendG.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#suitability-gradient)")
                .style("stroke", "#666")
                .style("stroke-width", 1);

            legendG.append("text")
                .attr("class", "legend-min")
                .attr("x", 0)
                .attr("y", legendHeight + 15)
                .attr("font-size", "10px")
                .text("Lower Match");

            legendG.append("text")
                .attr("class", "legend-max")
                .attr("x", legendWidth)
                .attr("y", legendHeight + 15)
                .attr("text-anchor", "end")
                .attr("font-size", "10px")
                .text("Better Match");

            // Initial update
            updateSuitabilityMap();

            // Add event listeners to all sliders
            Object.values(sliders).forEach(slider => {
                if (slider) {
                    slider.addEventListener('input', updateSuitabilityMap);
                }
            });

        })
            .catch(err => {
                console.error("Error loading TopoJSON:", err);
                alert("Failed to load map data for suitability analysis. Please ensure the backend server is running.");
            });
    }

    initializeMap();

})();
