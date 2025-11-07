// Suitability Map for "Find your ideal neighborhoods"
// This script uses housing data to calculate borough suitability based on user preferences

(function () {
    // API Configuration
    const API_BASE = 'http://localhost:3000/api/data';

    const svg = d3.select(".suitability-map svg");
    const tooltip = d3.select(".suitability-tooltip");

    const londonBoroughs = [
        "Barking and Dagenham", "Barnet", "Bexley", "Brent", "Bromley", "Camden",
        "Croydon", "Ealing", "Enfield", "Greenwich", "Hackney", "Hammersmith and Fulham",
        "Haringey", "Harrow", "Havering", "Hillingdon", "Hounslow", "Islington", "Kensington and Chelsea",
        "Kingston upon Thames", "Lambeth", "Lewisham", "Merton", "Newham", "Redbridge",
        "Richmond upon Thames", "Southwark", "Sutton", "Tower Hamlets", "Waltham Forest", "Westminster",
        "Wandsworth", "City of London"
    ];

    // Get slider elements
    const sliders = {
        commute: document.getElementById('commuteSlider'),
        transport: document.getElementById('transportSlider'),
        parks: document.getElementById('parksSlider'),
        air: document.getElementById('airSlider'),
        school: document.getElementById('schoolSlider'),
        diversity: document.getElementById('diversitySlider')
    };

    let boroughPaths;
    let housingData = {};
    let colorScale;

    // Borough characteristics based on real data patterns
    // These scores are normalized 0-100 based on typical London characteristics
    const boroughMetrics = {
        "Barking and Dagenham": { commute: 45, transport: 65, parks: 60, air: 55, school: 60, diversity: 85 },
        "Barnet": { commute: 50, transport: 70, parks: 75, air: 70, school: 80, diversity: 75 },
        "Bexley": { commute: 55, transport: 60, parks: 80, air: 75, school: 70, diversity: 60 },
        "Brent": { commute: 40, transport: 75, parks: 65, air: 50, school: 65, diversity: 90 },
        "Bromley": { commute: 60, transport: 60, parks: 85, air: 80, school: 75, diversity: 65 },
        "Camden": { commute: 25, transport: 90, parks: 70, air: 45, school: 75, diversity: 85 },
        "Croydon": { commute: 45, transport: 75, parks: 70, air: 55, school: 65, diversity: 80 },
        "Ealing": { commute: 40, transport: 80, parks: 75, air: 60, school: 75, diversity: 85 },
        "Enfield": { commute: 55, transport: 65, parks: 75, air: 65, school: 70, diversity: 75 },
        "Greenwich": { commute: 35, transport: 80, parks: 80, air: 60, school: 70, diversity: 80 },
        "Hackney": { commute: 30, transport: 85, parks: 65, air: 50, school: 70, diversity: 90 },
        "Hammersmith and Fulham": { commute: 30, transport: 90, parks: 70, air: 55, school: 85, diversity: 80 },
        "Haringey": { commute: 35, transport: 80, parks: 75, air: 55, school: 65, diversity: 85 },
        "Harrow": { commute: 50, transport: 70, parks: 70, air: 70, school: 80, diversity: 80 },
        "Havering": { commute: 65, transport: 55, parks: 85, air: 80, school: 70, diversity: 60 },
        "Hillingdon": { commute: 55, transport: 65, parks: 75, air: 60, school: 70, diversity: 75 },
        "Hounslow": { commute: 45, transport: 75, parks: 70, air: 50, school: 65, diversity: 85 },
        "Islington": { commute: 25, transport: 90, parks: 60, air: 45, school: 75, diversity: 85 },
        "Kensington and Chelsea": { commute: 20, transport: 95, parks: 70, air: 50, school: 90, diversity: 75 },
        "Kingston upon Thames": { commute: 50, transport: 70, parks: 80, air: 75, school: 80, diversity: 70 },
        "Lambeth": { commute: 30, transport: 85, parks: 75, air: 50, school: 70, diversity: 90 },
        "Lewisham": { commute: 40, transport: 75, parks: 70, air: 55, school: 65, diversity: 85 },
        "Merton": { commute: 40, transport: 75, parks: 75, air: 65, school: 75, diversity: 75 },
        "Newham": { commute: 35, transport: 80, parks: 60, air: 50, school: 60, diversity: 95 },
        "Redbridge": { commute: 50, transport: 70, parks: 70, air: 65, school: 75, diversity: 80 },
        "Richmond upon Thames": { commute: 45, transport: 75, parks: 90, air: 85, school: 85, diversity: 65 },
        "Southwark": { commute: 25, transport: 90, parks: 75, air: 50, school: 70, diversity: 90 },
        "Sutton": { commute: 55, transport: 65, parks: 80, air: 75, school: 80, diversity: 70 },
        "Tower Hamlets": { commute: 25, transport: 90, parks: 65, air: 45, school: 65, diversity: 95 },
        "Waltham Forest": { commute: 40, transport: 75, parks: 70, air: 55, school: 65, diversity: 85 },
        "Westminster": { commute: 15, transport: 95, parks: 75, air: 40, school: 75, diversity: 85 },
        "Wandsworth": { commute: 30, transport: 85, parks: 80, air: 60, school: 80, diversity: 80 },
        "City of London": { commute: 10, transport: 100, parks: 50, air: 45, school: 70, diversity: 70 }
    };

    // Calculate suitability score for a borough based on user preferences
    function calculateSuitability(borough, preferences) {
        const metrics = boroughMetrics[borough];
        if (!metrics) return 0;

        // Inverse scoring for commute (lower is better, so we invert the preference)
        const commuteScore = Math.abs(100 - preferences.commute - metrics.commute);
        const transportScore = 100 - Math.abs(preferences.transport - metrics.transport);
        const parksScore = 100 - Math.abs(preferences.parks - metrics.parks);
        const airScore = 100 - Math.abs(preferences.air - metrics.air);
        const schoolScore = 100 - Math.abs(preferences.school - metrics.school);
        const diversityScore = 100 - Math.abs(preferences.diversity - metrics.diversity);

        // Average all scores (equal weighting)
        const totalScore = (commuteScore + transportScore + parksScore + airScore + schoolScore + diversityScore) / 6;
        return Math.max(0, Math.min(100, totalScore));
    }

    // Get current user preferences from sliders
    function getPreferences() {
        return {
            commute: sliders.commute ? 100 - (parseFloat(sliders.commute.value) / 60 * 100) : 50, // Normalize to 0-100, inverted
            transport: sliders.transport ? parseFloat(sliders.transport.value) : 70,
            parks: sliders.parks ? parseFloat(sliders.parks.value) : 80,
            air: sliders.air ? parseFloat(sliders.air.value) : 60,
            school: sliders.school ? (parseFloat(sliders.school.value) - 1) / 4 * 100 : 75, // Normalize 1-5 to 0-100
            diversity: sliders.diversity ? parseFloat(sliders.diversity.value) : 90
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

    // Load TopoJSON from backend API and set up map
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
            📍 Commute: ${metrics.commute}/100<br>
            🚇 Transport: ${metrics.transport}/100<br>
            🌳 Parks: ${metrics.parks}/100<br>
            🌤️ Air Quality: ${metrics.air}/100<br>
            🎓 Schools: ${metrics.school}/100<br>
            🌍 Diversity: ${metrics.diversity}/100
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

})();
