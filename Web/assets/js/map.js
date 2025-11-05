// --- Setup ---
const svg = d3.select(".map-container svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

const tooltip = d3.select(".tooltip");
const slider = d3.select("#dateSlider");
const dateLabel = d3.select("#dateLabel");

const londonBoroughs = [
    "Barking and Dagenham", "Barnet", "Bexley", "Brent", "Bromley", "Camden",
    "Croydon", "Ealing", "Enfield", "Greenwich", "Hackney", "Hammersmith and Fulham",
    "Haringey", "Harrow", "Havering", "Hillingdon", "Hounslow", "Islington", "Kensington and Chelsea",
    "Kingston upon Thames", "Lambeth", "Lewisham", "Merton", "Newham", "Redbridge",
    "Richmond upon Thames", "Southwark", "Sutton", "Tower Hamlets", "Waltham Forest", "Westminster",
    "Wandsworth", "City of London"
];

// --- Load TopoJSON ---
d3.json("data/london_topo.json").then(topo => {
    const objectName = Object.keys(topo.objects)[0];
    let geojson = topojson.feature(topo, topo.objects[objectName]);

    console.log("All boroughs in TopoJSON:", geojson.features.map(d => d.properties.NAME));

    // --- Filter only boroughs in our list (trim spaces to avoid mismatch) ---
    geojson.features = geojson.features.filter(d =>
        londonBoroughs.some(b => b.trim() === d.properties.NAME.trim())
    );

    console.log("Filtered boroughs:", geojson.features.map(d => d.properties.NAME));

    const projection = d3.geoMercator()
        .center([-0.1, 51.49])
        .scale(50000)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // --- Draw Boroughs ---
    const boroughPaths = svg.append("g")
        .attr("class", "boroughs")
        .selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "#ccc")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
            console.log("hover", d.properties.NAME);  // debug log
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(d.properties.NAME)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 20) + "px");
            tooltip.style("border", "2px solid red");  // temporary visual check
        })
        .on("mousemove", function (event, d) {
            tooltip.style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(200).style("opacity", 0);
            tooltip.style("border", "none");  // remove temporary border
        });


    // --- Load CSV ---
    d3.csv("data/london_house_data.csv").then(data => {
        data.forEach(d => {
            d.AveragePrice = d.AveragePrice ? +d.AveragePrice : null;
            if (d.Date) {
                const [day, month, year] = d.Date.split("/").map(Number);
                d.parsedDate = new Date(year < 50 ? 2000 + year : 1900 + year, month - 1, day);
            }
        });

        const dates = Array.from(new Set(data.map(d => d.parsedDate)))
            .filter(d => d)
            .sort((a, b) => a - b)
            .map(d => {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = String(d.getFullYear()).slice(-2);
                return `${day}/${month}/${year}`;
            });

        slider.attr("max", dates.length - 1);
        dateLabel.text(dates[0]);

        // Map data by date and region
        const priceByDate = new Map();
        dates.forEach(date => {
            const filtered = data.filter(d => {
                const day = String(d.parsedDate.getDate()).padStart(2, '0');
                const month = String(d.parsedDate.getMonth() + 1).padStart(2, '0');
                const year = String(d.parsedDate.getFullYear()).slice(-2);
                return `${day}/${month}/${year}` === date;
            });
            const mapByRegion = new Map();
            filtered.forEach(d => mapByRegion.set(d.RegionName.trim(), d.AveragePrice));
            priceByDate.set(date, mapByRegion);
        });

        // --- Color Scale ---
        const priceExtent = d3.extent(data, d => d.AveragePrice);
        if (!priceExtent[0] || !priceExtent[1] || priceExtent[0] === priceExtent[1]) priceExtent[1] = priceExtent[0] + 1;
        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain(priceExtent);

        // --- Legend ---
        const legendWidth = 200, legendHeight = 10;
        const legendX = 50, legendY = 50;

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");
        linearGradient.append("stop").attr("offset", "0%").attr("stop-color", colorScale(priceExtent[0]));
        linearGradient.append("stop").attr("offset", "100%").attr("stop-color", colorScale(priceExtent[1]));

        svg.append("rect")
            .attr("x", legendX)
            .attr("y", legendY)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)")
            .style("stroke", "#000");

        svg.append("text")
            .attr("x", legendX)
            .attr("y", legendY - 5)
            .attr("text-anchor", "start")
            .attr("font-size", "10px")
            .text(Math.round(priceExtent[0]));

        svg.append("text")
            .attr("x", legendX + legendWidth)
            .attr("y", legendY - 5)
            .attr("text-anchor", "end")
            .attr("font-size", "10px")
            .text(Math.round(priceExtent[1]));

        // --- Update Function ---
        function updateMap(date) {
            dateLabel.text(date);
            const mapByRegion = priceByDate.get(date);
            boroughPaths.attr("fill", d => {
                const price = mapByRegion ? mapByRegion.get(d.properties.NAME.trim()) : null;
                return price ? colorScale(price) : "#ccc";
            });
        }

        updateMap(dates[0]);

        // --- Slider Interaction ---
        slider.on("input", function () {
            const date = dates[this.value];
            updateMap(date);
        });

    }).catch(err => console.error("CSV load error:", err));

}).catch(err => console.error("TopoJSON load error:", err));
