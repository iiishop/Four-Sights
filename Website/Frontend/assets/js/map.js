// IMPORTANT: Full category switching, Sales Volume support, UI control, dynamic legend, rank chart, line chart, and insight updates

// API Configuration
const API_BASE = 'http://localhost:3000/api/data';

const svg = d3.select("#mapSvg");
// Use viewBox dimensions for consistent scaling
const width = 800;
const height = 600;

const tooltip = d3.select(".tooltip");
const slider = d3.select("#dateSlider");
const dateLabel = d3.select("#dateLabel");
const playPauseBtn = d3.select("#playPauseBtn");
const formatComma = d3.format(","); // adds thousands separator

const categorySelect = d3.select("#categorySelect"); // hidden select remains

const CATEGORY_META = [
    { key: "Average", label: "Average", icon: "ri-bar-chart-2-line" },
    { key: "Detached", label: "Detached", icon: "ri-home-4-line" },
    { key: "SemiDetached", label: "Semi-Detached", icon: "ri-community-line" },
    { key: "Terraced", label: "Terraced", icon: "ri-home-3-line" },
    { key: "Flat", label: "Flat", icon: "ri-building-2-line" },
    { key: "Cash", label: "Cash", icon: "ri-money-pound-circle-line" },
    { key: "Mortgage", label: "Mortgage", icon: "ri-bank-card-line" },
    { key: "SalesVolume", label: "Sales Volume", icon: "ri-bar-chart-box-line" }
];

const CATEGORY_INSIGHTS = {
    "Average": `
Housing affordability continues to be one of London's biggest challenges, with average prices rising steadily across nearly all boroughs. 
Central boroughs such as Kensington & Chelsea, Westminster, and Camden lead significantly due to a combination of international demand and luxury property development. 
Outer areas like Barking & Dagenham or Croydon, while relatively affordable, are also experiencing upward prices driven by regeneration projects, expansion of transport nodes, and urban spillover. 
The London Plan aims to deliver more affordable homes and address imbalances, but housing supply still lags behind demand, contributing to structural inequalities.
  `,

    "Detached": `
Detached homes represent some of the rarest and highest-value properties in London, usually found in the more suburban boroughs such as Bromley, Barnet, and Richmond upon Thames. 
These homes are popular with wealthier households seeking privacy and space, yet they also reflect socio-spatial inequality in London's housing fabric as they are often unaffordable for average residents. 
Greenbelt preservation and planning restrictions maintain their scarcity, but also limit redevelopment opportunities in low-density areas, creating policy tension with London's need for denser housing stock.
  `,

    "SemiDetached": `
Semi-detached homes are a mainstay of suburban life in London and offer a compromise between privacy and affordability.
They dominate in boroughs like Harrow, Ealing, and Redbridge, and have seen price growth driven by demand from young families.
Urban policies now encourage densification in suburban areas, including converting large plots or extending homes to increase housing capacity. 
However, resistance from long-term residents and green space advocates makes such policies highly contested.
  `,

    "Terraced": `
Terraced housing is deeply rooted in London's Victorian and Edwardian urban form, especially in places like Hackney, Southwark, and Islington. 
Once considered outdated, these buildings have undergone significant renovation and have become symbols of gentrification and creative-class urbanism. 
Terraced homes near transit corridors continue to appreciate as London embraces "15-minute city" policies, but this reinforces displacement risks for lower-income groups in revitalized areas.
  `,

    "Flat": `
Flats are the dominant new-build form in London's growth hubs, aligned with dense urban living and transport-oriented development. 
Regeneration schemes in Stratford, Elephant & Castle, and Wembley are reshaping the skyline with vertical living options. 
However, issues around cladding safety, building quality, and affordability continue to raise questions about the sustainability and equity of this model, especially in the private rental market.
  `,

    "Cash": `
Cash purchases are prevalent in high-value and central locations like Westminster and Kensington, highlighting the role of London as an international capital market. 
This trend reflects global wealth flows and political stability rather than the underlying housing needs of London's population. 
Government policy — such as higher stamp duty on second homes, and upcoming reforms under the Economic Crime Bill — aims to increase transparency and temper speculative real estate investment.
  `,

    "Mortgage": `
Mortgage-driven purchases dominate in outer boroughs where prices remain within reach of working families. 
Rising interest rates and stagnant wages post-pandemic have put pressure on this market, slowing activity among first-time buyers. 
Government support schemes like shared ownership aim to bridge the affordability gap, but long-term solutions require wage growth and increased social housing provision.
  `,

    "SalesVolume": `
Sales volumes mirror confidence in the market and broader economic conditions. 
Boroughs like Wandsworth and Barnet consistently record high volumes due to diverse housing stock and strong connectivity. 
Changes in buyer behavior — driven by remote work, immigration, and capital flows — are reshaping London's property demand map, with more people considering outer London areas or commuter belts.
  `
};

const londonBoroughs = [
    "Barking and Dagenham", "Barnet", "Bexley", "Brent", "Bromley", "Camden",
    "Croydon", "Ealing", "Enfield", "Greenwich", "Hackney", "Hammersmith and Fulham",
    "Haringey", "Harrow", "Havering", "Hillingdon", "Hounslow", "Islington", "Kensington and Chelsea",
    "Kingston upon Thames", "Lambeth", "Lewisham", "Merton", "Newham", "Redbridge",
    "Richmond upon Thames", "Southwark", "Sutton", "Tower Hamlets", "Waltham Forest", "Westminster",
    "Wandsworth", "City of London"
];

let currentCategory = "Average";

function getCategoryFields(category) {
    if (category === "Average") {
        return ["AveragePrice", "1m%Change", "12m%Change"];
    }
    if (category === "SalesVolume") {
        return ["SalesVolume", null, null];
    }
    return [`${category}Price`, `${category}1m%Change`, `${category}12m%Change`];
}

function updateInsight() {
    const insightKey = currentCategory || "General";
    d3.select("#insightText").text(CATEGORY_INSIGHTS[insightKey]);
}

function createCategoryButtons() {
    const wrap = d3.select("#categoryContainer");
    wrap.selectAll("*").remove();

    wrap.selectAll(".category-btn")
        .data(CATEGORY_META)
        .enter()
        .append("button")
        .attr("type", "button")
        .attr("class", d => `category-btn${d.key === currentCategory ? " active" : ""}`)
        .attr("data-category", d => d.key)
        .html(d => `<i class="${d.icon}" aria-hidden="true"></i><span>${d.label}</span>`)
        .on("click", function (e, d) {
            currentCategory = d.key;
            d3.selectAll(".category-btn").classed("active", false);
            d3.select(this).classed("active", true);

            categorySelect.property("value", currentCategory);
            categorySelect.dispatch("change");
            updateInsight();
        });
}
createCategoryButtons();

// Line Chart Setup
const lineSvg = d3.select("#lineChart");
// Use viewBox dimensions instead of actual rendered size
const lineWidth = 800;
const lineHeight = 450;
const margin = { top: 30, right: 80, bottom: 60, left: 80 };
const chartWidth = lineWidth - margin.left - margin.right;
const chartHeight = lineHeight - margin.top - margin.bottom;

const lineG = lineSvg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleTime().range([0, chartWidth]);
const yScale = d3.scaleLinear().range([chartHeight, 0]);
const boroughColor = d3.scaleOrdinal(d3.schemeCategory10).domain(londonBoroughs);

const lineGenerator = d3.line()
    .x(d => xScale(d.parsedDate))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);

function formatMonthYear(date) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Load TopoJSON from backend API
d3.json(`${API_BASE}/map/geojson`).then(topo => {
    const objectName = Object.keys(topo.objects)[0];
    let geojson = topojson.feature(topo, topo.objects[objectName]);
    geojson.features = geojson.features.filter(d => londonBoroughs.includes(d.properties.NAME.trim()));

    const projection = d3.geoMercator()
        .center([-0.1, 51.49])
        .scale(50000)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Create container group for zoom and pan
    const mapContainer = svg.append("g")
        .attr("class", "map-container");

    const boroughPaths = mapContainer.append("g")
        .attr("class", "boroughs")
        .selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "#ccc")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

    // Zoom behavior setup
    const initialTransform = d3.zoomIdentity;
    let currentZoom = 1;

    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
            mapContainer.attr("transform", event.transform);
            currentZoom = event.transform.k;
            updateZoomUI(currentZoom);

            // Adjust stroke width based on zoom level for better visibility
            boroughPaths.attr("stroke-width", 1 / currentZoom);
        });

    svg.call(zoom);

    // Double-click to reset zoom
    svg.on("dblclick.zoom", () => {
        svg.transition().duration(500).call(zoom.transform, initialTransform);
    });

    // Zoom control buttons
    const zoomInBtn = d3.select("#zoomInBtn");
    const zoomOutBtn = d3.select("#zoomOutBtn");
    const resetZoomBtn = d3.select("#resetZoomBtn");
    const zoomSlider = d3.select("#zoomSlider");
    const zoomLevel = d3.select("#zoomLevel");

    function updateZoomUI(scale) {
        zoomSlider.property("value", scale);
        zoomLevel.text(`${Math.round(scale * 100)}%`);
    }

    zoomInBtn.on("click", () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    });

    zoomOutBtn.on("click", () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    });

    resetZoomBtn.on("click", () => {
        svg.transition().duration(500).call(zoom.transform, initialTransform);
    });

    zoomSlider.on("input", function () {
        const scale = +this.value;
        svg.transition().duration(100).call(zoom.scaleTo, scale);
    });

    //== Legend Setup
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("x2", "100%")
        .attr("y1", "0%").attr("y2", "0%");
    gradient.append("stop").attr("class", "stop-min").attr("offset", "0%").attr("stop-color", "#f0f0f0");
    gradient.append("stop").attr("class", "stop-max").attr("offset", "100%").attr("stop-color", "#08306b");

    const legendG = svg.append("g").attr("id", "legendG").attr("transform", "translate(50,30)");
    legendG.append("text").attr("class", "legend-title")
        .attr("x", 0).attr("y", 0).attr("font-size", "11px").attr("font-weight", "600")
        .text("Legend");
    legendG.append("rect")
        .attr("class", "legend-bar")
        .attr("x", 0).attr("y", 10).attr("width", 220).attr("height", 10)
        .style("fill", "url(#legend-gradient)").style("stroke", "#000").style("stroke-width", 0.5);
    legendG.append("text").attr("class", "legend-min")
        .attr("x", 0).attr("y", 30).attr("font-size", "10px");
    legendG.append("text").attr("class", "legend-max")
        .attr("x", 220).attr("y", 30).attr("text-anchor", "end").attr("font-size", "10px");

    function updateLegend(domain, category) {
        const [minV, maxV] = domain;
        const isVolume = (category === "SalesVolume");
        const isPrice = !isVolume;

        const fmt = v => isPrice ? `£${formatComma(Math.round(v))}` : formatComma(Math.round(v));

        const mapScale = d3.scaleSequential(d3.interpolateBlues).domain([minV, maxV]);
        defs.select("#legend-gradient .stop-min").attr("stop-color", mapScale(minV));
        defs.select("#legend-gradient .stop-max").attr("stop-color", mapScale(maxV));

        legendG.select(".legend-title").text(isVolume ? "Legend — Sales Volume" : "Legend — Price");
        legendG.select(".legend-min").text(fmt(minV));
        legendG.select(".legend-max").text(fmt(maxV));
    }

    // Load CSV Data from backend API
    fetch(`${API_BASE}/housing/query`)
        .then(response => response.json())
        .then(result => {
            console.log('API Response:', result);
            const data = result.data;

            if (!data || data.length === 0) {
                throw new Error('No data received from API');
            }

            console.log('First data row:', data[0]);

            // Process data - convert numeric fields and parse dates
            data.forEach(d => {
                Object.keys(d).forEach(key => {
                    if (key.includes("Price") || key.includes("%Change") || key === "SalesVolume") {
                        const val = d[key];
                        d[key] = (val !== null && val !== undefined && val !== '') ? +val : null;
                    }
                });

                // Find the date field (handle BOM character)
                const dateField = Object.keys(d).find(key => key.includes('Date'));
                const dateValue = d[dateField];

                if (dateValue) {
                    // Backend may return original format (DD/MM/YY) or standardized (YYYY-MM-DD)
                    if (dateValue.includes('/')) {
                        // Parse DD/MM/YY format
                        const [day, month, year] = dateValue.split("/").map(Number);
                        const fullYear = year < 50 ? 2000 + year : 1900 + year;
                        d.parsedDate = new Date(fullYear, month - 1, day);
                    } else if (dateValue.includes('-')) {
                        // Parse YYYY-MM-DD format
                        const parts = dateValue.split("-");
                        if (parts.length === 3) {
                            const year = parseInt(parts[0]);
                            const month = parseInt(parts[1]) - 1;
                            const day = parseInt(parts[2]);
                            d.parsedDate = new Date(year, month, day);
                        }
                    }
                }
            });

            console.log('Processed first row:', data[0]);

            // Get the actual date field name (handle BOM in CSV)
            const dateField = Object.keys(data[0]).find(key => key.includes('Date')) || 'Date';
            console.log('Date field name:', dateField);

            const dateTimestamps = new Set();
            data.forEach(d => {
                if (d.parsedDate) {
                    dateTimestamps.add(d.parsedDate.getTime());
                }
            });
            const uniqueDates = Array.from(dateTimestamps)
                .sort((a, b) => a - b)
                .map(timestamp => new Date(timestamp));

            console.log('Unique dates count:', uniqueDates.length);
            console.log('First few dates:', uniqueDates.slice(0, 5).map(d => d.toString()));
            console.log('Last few dates:', uniqueDates.slice(-3).map(d => d.toString()));

            let priceByDate = new Map();
            function buildPriceByDate() {
                priceByDate.clear();
                uniqueDates.forEach(dateObj => {
                    const dateStr = formatMonthYear(dateObj);
                    const [priceField, change1mField, change12mField] = getCategoryFields(currentCategory);
                    const filtered = data.filter(d => d.parsedDate.getTime() === dateObj.getTime());
                    const mapByRegion = new Map();
                    filtered.forEach(d => mapByRegion.set(d.RegionName.trim(), {
                        price: d[priceField],
                        change1m: d[change1mField],
                        change12m: d[change12mField],
                        parsedDate: d.parsedDate
                    }));
                    priceByDate.set(dateStr, mapByRegion);
                });
            }

            buildPriceByDate();

            const dates = Array.from(priceByDate.keys());
            slider.attr("max", dates.length - 1);
            dateLabel.text(dates[0]);

            function getBoroughDataForCategory() {
                const [priceField] = getCategoryFields(currentCategory);
                return d3.groups(data.filter(d => d[priceField] != null), d => d.RegionName.trim());
            }
            let boroughData = getBoroughDataForCategory();

            xScale.domain(d3.extent(uniqueDates));

            function updateLineChartYScale() {
                const [priceField] = getCategoryFields(currentCategory);
                yScale.domain([0, d3.max(data, d => d[priceField]) || 1]);
                lineG.select(".y-axis").call(d3.axisLeft(yScale));
            }

            lineG.append("g").attr("class", "x-axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")))
                .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");

            lineG.append("g").attr("class", "y-axis");
            updateLineChartYScale();

            let linePaths = lineG.selectAll("path.line")
                .data(boroughData)
                .enter().append("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", d => boroughColor(d[0]))
                .attr("stroke-width", 2)
                .attr("data-borough", d => d[0])
                .attr("d", d => {
                    const [priceField] = getCategoryFields(currentCategory);
                    const series = d[1].sort((a, b) => a.parsedDate - b.parsedDate)
                        .map(p => ({ parsedDate: p.parsedDate, value: p[priceField] }));
                    return lineGenerator(series);
                });

            function updateLineChart() {
                const [priceField] = getCategoryFields(currentCategory);
                boroughData = getBoroughDataForCategory();
                yScale.domain([0, d3.max(data, d => d[priceField]) || 1]);
                lineG.select(".y-axis").call(d3.axisLeft(yScale));

                linePaths = lineG.selectAll("path.line")
                    .data(boroughData, d => d[0])
                    .join("path")
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", d => boroughColor(d[0]))
                    .attr("stroke-width", 2)
                    .attr("data-borough", d => d[0])
                    .attr("d", d => {
                        const series = d[1].sort((a, b) => a.parsedDate - b.parsedDate)
                            .map(p => ({ parsedDate: p.parsedDate, value: p[priceField] }));
                        return lineGenerator(series);
                    });
            }

            let currentMapByRegion;
            let currentMapColorScale = null;
            let isAnimating = false;

            function updateMap(dateStr, disableTransition = false) {
                currentMapByRegion = priceByDate.get(dateStr);

                if (!currentMapByRegion) {
                    console.error('No data found for date:', dateStr);
                    console.log('Available dates:', Array.from(priceByDate.keys()));
                    return;
                }

                dateLabel.text(dateStr);

                const values = Array.from(currentMapByRegion.values()).map(d => d.price).filter(d => d != null && isFinite(d));
                const mapExtent = values.length ? d3.extent(values) : [0, 1];

                const mapColorScale = d3.scaleSequential(d3.interpolateBlues).domain(mapExtent);
                currentMapColorScale = mapColorScale;

                const fillColor = d => {
                    const regionData = currentMapByRegion.get(d.properties.NAME.trim());
                    return regionData?.price != null ? mapColorScale(regionData.price) : "#ccc";
                };

                if (disableTransition) {
                    boroughPaths.attr("fill", fillColor);
                } else {
                    boroughPaths.transition().duration(500).attr("fill", fillColor);
                }

                updateLegend(mapExtent, currentCategory);
            }

            const chartTooltip = d3.select("body").append("div").attr("class", "tooltip")
                .style("opacity", 0).style("position", "absolute");

            function highlightAll(borough, event = null, d = null) {
                boroughPaths.attr("fill", m => {
                    const regionData = currentMapByRegion ? currentMapByRegion.get(m.properties.NAME.trim()) : null;
                    if (m.properties.NAME.trim() === borough) return "#ff7f0e";
                    return (regionData?.price != null && currentMapColorScale) ? currentMapColorScale(regionData.price) : "#ccc";
                });
                linePaths.attr("stroke-width", l => l[0] === borough ? 4 : 2)
                    .attr("opacity", l => l[0] === borough ? 1 : 0.3);
                rankG.selectAll(".rank-line").attr("stroke-width", r => r[0] === borough ? 3 : 1.5)
                    .attr("opacity", r => r[0] === borough ? 1 : 0.2);
                rankG.selectAll(".rank-dot").attr("r", r => r.borough === borough ? 6 : 4);

                if (event && d) {
                    const [priceField, change1mField, change12mField] = getCategoryFields(currentCategory);
                    chartTooltip.transition().duration(200).style("opacity", 0.9);

                    const value = d.price ?? d.value ?? null;
                    const c1 = d.change1m ?? (change1mField ? d[change1mField] : null);
                    const c12 = d.change12m ?? (change12mField ? d[change12mField] : null);
                    const when = d.parsedDate ? formatMonthYear(d.parsedDate) : (typeof d.date === "object" ? formatMonthYear(d.date) : dateLabel.text());

                    chartTooltip.html(
                        `<strong>${borough}</strong><br>
          Date: ${when}<br>
          ${currentCategory === "SalesVolume"
                            ? `Sales: ${value != null ? formatComma(value) : "N/A"}`
                            : `Price: ${value != null ? "£" + formatComma(value) : "N/A"}<br>
                 1m change: ${c1 != null ? (+c1).toFixed(1) + "%" : "No data"}<br>
                 12m change: ${c12 != null ? (+c12).toFixed(1) + "%" : "No data"}`
                        }`
                    );
                    chartTooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            }

            function resetAllHighlight() {
                boroughPaths.attr("fill", d => {
                    const regionData = currentMapByRegion ? currentMapByRegion.get(d.properties.NAME.trim()) : null;
                    return (regionData?.price != null && currentMapColorScale) ? currentMapColorScale(regionData.price) : "#ccc";
                });
                linePaths.attr("stroke-width", 2).attr("opacity", 1);
                rankG.selectAll(".rank-line").attr("stroke-width", 1.5).attr("opacity", 0.5);
                rankG.selectAll(".rank-dot").attr("r", 4);
                chartTooltip.transition().duration(200).style("opacity", 0);
            }

            boroughPaths.on("mouseover", (event, d) => {
                const borough = d.properties.NAME.trim();
                const regionData = currentMapByRegion.get(borough);
                highlightAll(borough, event, regionData);
            })
                .on("mousemove", (event) => chartTooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px"))
                .on("mouseout", resetAllHighlight);

            updateMap(dates[0]);

            slider.on("input", function () {
                updateMap(dates[this.value], !isAnimating);
                updateRankChart(dates[this.value]);
            });

            let intervalId = null;
            playPauseBtn.on("click", function () {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                    isAnimating = false;
                    playPauseBtn.text("Play");
                } else {
                    playPauseBtn.text("Pause");
                    isAnimating = true;
                    intervalId = setInterval(() => {
                        let currentValue = +slider.property("value");
                        let nextValue = currentValue + 1;
                        if (nextValue > +slider.attr("max")) nextValue = 0;
                        slider.property("value", nextValue);
                        updateMap(dates[nextValue], true);
                        updateRankChart(dates[nextValue]);
                    }, 100);
                }
            });

            // Rank Chart
            const rankSvg = d3.select("#rankChart");
            // Use viewBox dimensions instead of actual rendered size
            const rankWidth = 800;
            const rankHeight = 500;
            const rankMargin = { top: 50, right: 80, bottom: 60, left: 80 };
            const rankChartWidth = rankWidth - rankMargin.left - rankMargin.right;
            const rankChartHeight = rankHeight - rankMargin.top - rankMargin.bottom;

            const rankG = rankSvg.append("g")
                .attr("transform", `translate(${rankMargin.left},${rankMargin.top})`);



            const rankX = d3.scaleTime()
                .domain(d3.extent(uniqueDates))
                .range([0, rankChartWidth]);

            const rankY = d3.scaleLinear()
                .domain([1, londonBoroughs.length])
                .range([0, rankChartHeight]);

            rankG.append("g")
                .attr("transform", `translate(0,${rankChartHeight})`)
                .call(d3.axisBottom(rankX).ticks(Math.min(10, uniqueDates.length)).tickFormat(d3.timeFormat("%b %Y")))
                .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");

            rankG.append("g").call(d3.axisLeft(rankY).tickValues(d3.range(1, londonBoroughs.length + 1, 5)).tickFormat(d3.format("d")));

            const rankLine = d3.line()
                .x(d => rankX(d.date))
                .y(d => rankY(d.rank))
                .curve(d3.curveMonotoneX);

            function buildRankData() {
                const [priceField] = getCategoryFields(currentCategory);
                const dateStrs = uniqueDates.map(d => formatMonthYear(d));
                const rankOverTime = dateStrs.map((dateStr, idx) => {
                    const map = priceByDate.get(dateStr);
                    if (!map) return [];
                    const sorted = Array.from(map.entries())
                        .filter(([_, val]) => val.price != null)
                        .sort((a, b) => b[1].price - a[1].price)
                        .map(([borough, val], i) => ({ date: uniqueDates[idx], borough, rank: i + 1, price: val.price }));
                    return sorted;
                });

                return d3.rollup(
                    rankOverTime.flat(),
                    v => v.map(d => ({ date: d.date, rank: d.rank, price: d.price })),
                    d => d.borough
                );
            }

            let rankDataByBorough = buildRankData();

            rankG.selectAll(".rank-line")
                .data(rankDataByBorough)
                .join("path")
                .attr("class", "rank-line")
                .attr("fill", "none")
                .attr("stroke", ([borough]) => boroughColor(borough))
                .attr("stroke-width", 1.5)
                .attr("opacity", 0.5)
                .attr("d", ([, data]) => rankLine(data));

            function updateRankChart(currentDateStr) {
                const idx = dates.indexOf(currentDateStr);
                if (idx === -1) return;

                // Find the matching date object from uniqueDates
                // We need to ensure we're using the correct Date object that matches currentDateStr
                const dateObj = uniqueDates.find(d => formatMonthYear(d) === currentDateStr);
                if (!dateObj) {
                    console.warn('Date object not found for:', currentDateStr);
                    return;
                }

                const currentMap = priceByDate.get(currentDateStr);
                if (!currentMap) return;

                const rankData = Array.from(currentMap, ([borough, val]) => ({ borough, price: val.price }))
                    .filter(d => d.price != null)
                    .sort((a, b) => b.price - a.price)
                    .map((d, i) => ({ borough: d.borough, rank: i + 1, price: d.price }));

                const dots = rankG.selectAll(".rank-dot").data(rankData, d => d.borough);

                dots.exit().transition().duration(300).attr("r", 0).remove();

                dots.transition().duration(500)
                    .attr("cx", rankX(dateObj))
                    .attr("cy", d => rankY(d.rank));

                dots.enter()
                    .append("circle")
                    .attr("class", "rank-dot")
                    .attr("cx", rankX(dateObj))
                    .attr("cy", d => rankY(d.rank))
                    .attr("r", 0)
                    .attr("fill", d => boroughColor(d.borough))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1)
                    .on("mouseover", (event, d) => highlightAll(d.borough, event, d))
                    .on("mousemove", (event) => chartTooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px"))
                    .on("mouseout", resetAllHighlight)
                    .transition().duration(400).attr("r", 4);
            }

            updateRankChart(dates[0]);

            categorySelect.on("change", function () {
                currentCategory = this.value;
                buildPriceByDate();
                updateLineChart();
                updateMap(dates[+slider.property("value")]);

                rankDataByBorough = buildRankData();
                rankG.selectAll(".rank-line")
                    .data(rankDataByBorough)
                    .attr("d", ([, data]) => rankLine(data));
                updateRankChart(dates[+slider.property("value")]);

                updateInsight();
            });

        })
        .catch(err => {
            console.error("Housing data load error:", err);
            alert("Failed to load housing data. Please ensure the backend server is running.");
        });
})
    .catch(err => {
        console.error("TopoJSON load error:", err);
        alert("Failed to load map data. Please ensure the backend server is running.");
    });

// Initial insight update
updateInsight();

