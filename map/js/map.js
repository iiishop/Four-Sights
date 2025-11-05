// --- Setup ---
const svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

const tooltip = d3.select(".tooltip");
const slider = d3.select("#dateSlider");
const dateLabel = d3.select("#dateLabel");
const playPauseBtn = d3.select("#playPauseBtn");

const londonBoroughs = [
  "Barking and Dagenham","Barnet","Bexley","Brent","Bromley","Camden",
  "Croydon","Ealing","Enfield","Greenwich","Hackney","Hammersmith and Fulham",
  "Haringey","Harrow","Havering","Hillingdon","Hounslow","Islington","Kensington and Chelsea",
  "Kingston upon Thames","Lambeth","Lewisham","Merton","Newham","Redbridge",
  "Richmond upon Thames","Southwark","Sutton","Tower Hamlets","Waltham Forest","Westminster",
  "Wandsworth", "City of London"
];

// --- Helper: format Date object as "July 2025" ---
function formatMonthYear(date){
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// --- Load TopoJSON ---
d3.json("data/london_topo.json").then(topo => {
  const objectName = Object.keys(topo.objects)[0];
  let geojson = topojson.feature(topo, topo.objects[objectName]);

  geojson.features = geojson.features.filter(d => 
    londonBoroughs.includes(d.properties.NAME.trim())
  );

  const projection = d3.geoMercator()
      .center([-0.1, 51.49])
      .scale(50000)
      .translate([width/2, height/2]);

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
      .attr("stroke-width", 1);

  // --- Load CSV ---
  d3.csv("data/london_house_data.csv").then(data => {

    // Parse CSV
    data.forEach(d => {
      d.AveragePrice = d.AveragePrice ? +d.AveragePrice : null;
      d["1m%Change"] = d["1m%Change"] ? +d["1m%Change"] : null;
      d["12m%Change"] = d["12m%Change"] ? +d["12m%Change"] : null;

      if (d.Date) {
        const [day, month, year] = d.Date.split("/").map(Number);
        d.parsedDate = new Date(year < 50 ? 2000 + year : 1900 + year, month - 1, day);
      }
    });

    // --- Unique dates ---
    const uniqueDates = Array.from(new Set(data.map(d => d.parsedDate)))
                             .filter(d => d)
                             .sort((a,b) => a-b);

    // --- Map data by formatted date ---
    const priceByDate = new Map();
    uniqueDates.forEach(dateObj => {
      const dateStr = formatMonthYear(dateObj);
      const filtered = data.filter(d => d.parsedDate.getTime() === dateObj.getTime());
      const mapByRegion = new Map();
      filtered.forEach(d => mapByRegion.set(d.RegionName.trim(), {
        price: d.AveragePrice,
        change1m: d["1m%Change"],
        change12m: d["12m%Change"]
      }));
      priceByDate.set(dateStr, mapByRegion);
    });

    const dates = Array.from(priceByDate.keys());
    slider.attr("max", dates.length - 1);
    dateLabel.text(dates[0]);

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

    // --- Update function ---
    let currentMapByRegion;
    function updateMap(dateStr){
      currentMapByRegion = priceByDate.get(dateStr);
      dateLabel.text(dateStr);

      boroughPaths
        .transition().duration(500)
        .attr("fill", d => {
          const regionData = currentMapByRegion ? currentMapByRegion.get(d.properties.NAME.trim()) : null;
          return regionData?.price ? colorScale(regionData.price) : "#ccc";
        });
    }

    // --- Tooltip ---
    boroughPaths
      .on("mouseover", function(event, d){
        const region = d.properties.NAME.trim();
        const regionData = currentMapByRegion ? currentMapByRegion.get(region) : null;
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`
          <strong>${region}</strong><br>
          📅 ${dateLabel.text()}<br>
          🏠 Avg Price: ${regionData?.price ? "£" + d3.format(",")(regionData.price) : "No data"}<br>
          📈 1m change: ${regionData?.change1m != null ? regionData.change1m.toFixed(1) + "%" : "No data"}<br>
          📈 12m change: ${regionData?.change12m != null ? regionData.change12m.toFixed(1) + "%" : "No data"}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event){
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(){
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // --- Initial render ---
    updateMap(dates[0]);

    // --- Slider interaction ---
    slider.on("input", function(){
      const dateStr = dates[this.value];
      updateMap(dateStr);
    });

    // --- Play/Pause Animation ---
    let intervalId = null;
    playPauseBtn.on("click", function(){
      if (intervalId){
        clearInterval(intervalId);
        intervalId = null;
        playPauseBtn.text("Play");
      } else {
        playPauseBtn.text("Pause");
        intervalId = setInterval(() => {
          let currentValue = +slider.property("value");
          let nextValue = currentValue + 1;
          if (nextValue > +slider.attr("max")) nextValue = 0;
          slider.property("value", nextValue);
          const dateStr = dates[nextValue];
          updateMap(dateStr);
        }, 100); // 10x faster
      }
    });

  }).catch(err => console.error("CSV load error:", err));

}).catch(err => console.error("TopoJSON load error:", err));
