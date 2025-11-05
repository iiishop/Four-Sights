const svg = d3.select("#mapSvg"),
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

// --- Line chart setup ---
const lineSvg = d3.select("#lineChart"),
      lineWidth = +lineSvg.attr("width"),
      lineHeight = +lineSvg.attr("height"),
      margin = {top: 20, right: 150, bottom: 50, left: 60},
      chartWidth = lineWidth - margin.left - margin.right,
      chartHeight = lineHeight - margin.top - margin.bottom;

const lineG = lineSvg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleTime().range([0, chartWidth]);
const yScale = d3.scaleLinear().range([chartHeight, 0]);
const boroughColor = d3.scaleOrdinal(d3.schemeCategory10).domain(londonBoroughs);

const lineGenerator = d3.line()
    .x(d => xScale(d.parsedDate))
    .y(d => yScale(d.AveragePrice));

function formatMonthYear(date){
  const monthNames = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// --- Load TopoJSON ---
d3.json("data/london_topo.json").then(topo => {
  const objectName = Object.keys(topo.objects)[0];
  let geojson = topojson.feature(topo, topo.objects[objectName]);
  geojson.features = geojson.features.filter(d => londonBoroughs.includes(d.properties.NAME.trim()));

  const projection = d3.geoMercator()
      .center([-0.1, 51.49])
      .scale(50000)
      .translate([width/2, height/2]);

  const path = d3.geoPath().projection(projection);

  const boroughPaths = svg.append("g")
      .attr("class", "boroughs")
      .selectAll("path")
      .data(geojson.features)
      .enter().append("path")
        .attr("d", path)
        .attr("fill", "#ccc")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

  d3.csv("data/london_house_data.csv").then(data => {
    data.forEach(d => {
      d.AveragePrice = d.AveragePrice ? +d.AveragePrice : null;
      d["1m%Change"] = d["1m%Change"] ? +d["1m%Change"] : null;
      d["12m%Change"] = d["12m%Change"] ? +d["12m%Change"] : null;
      if(d.Date){
        const [day, month, year] = d.Date.split("/").map(Number);
        d.parsedDate = new Date(year < 50 ? 2000 + year : 1900 + year, month - 1, day);
      }
    });

    const uniqueDates = Array.from(new Set(data.map(d => d.parsedDate))).filter(d => d).sort((a,b)=>a-b);

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

    const boroughData = d3.groups(data.filter(d => d.AveragePrice), d => d.RegionName.trim());

    xScale.domain(d3.extent(uniqueDates));
    yScale.domain([0, d3.max(data, d => d.AveragePrice)]);

    // Axes
    lineG.append("g").attr("class","x-axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")))
        .selectAll("text").attr("transform","rotate(-45)").style("text-anchor","end");

    lineG.append("g").attr("class","y-axis").call(d3.axisLeft(yScale));

    // Draw lines
    const linePaths = lineG.selectAll("path.line")
      .data(boroughData)
      .enter().append("path")
        .attr("class","line")
        .attr("fill","none")
        .attr("stroke", d => boroughColor(d[0]))
        .attr("stroke-width",2)
        .attr("data-borough", d => d[0])
        .attr("d", d => lineGenerator(d[1].sort((a,b)=>a.parsedDate-b.parsedDate)));

    const priceExtent = d3.extent(data, d => d.AveragePrice);
    if(!priceExtent[0] || !priceExtent[1] || priceExtent[0]===priceExtent[1]) priceExtent[1]=priceExtent[0]+1;
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain(priceExtent);

    // Legend
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient").attr("id","legend-gradient");
    linearGradient.append("stop").attr("offset","0%").attr("stop-color",colorScale(priceExtent[0]));
    linearGradient.append("stop").attr("offset","100%").attr("stop-color",colorScale(priceExtent[1]));
    svg.append("rect").attr("x",50).attr("y",50).attr("width",200).attr("height",10).style("fill","url(#legend-gradient)").style("stroke","#000");
    svg.append("text").attr("x",50).attr("y",45).attr("text-anchor","start").attr("font-size","10px").text(Math.round(priceExtent[0]));
    svg.append("text").attr("x",250).attr("y",45).attr("text-anchor","end").attr("font-size","10px").text(Math.round(priceExtent[1]));

    // Map update
    let currentMapByRegion;
    function updateMap(dateStr){
      currentMapByRegion = priceByDate.get(dateStr);
      dateLabel.text(dateStr);
      boroughPaths.transition().duration(500).attr("fill", d => {
        const regionData = currentMapByRegion ? currentMapByRegion.get(d.properties.NAME.trim()) : null;
        return regionData?.price ? colorScale(regionData.price) : "#ccc";
      });
    }

    function highlight(borough){
      boroughPaths.attr("fill", d => {
        const regionData = currentMapByRegion ? currentMapByRegion.get(d.properties.NAME.trim()) : null;
        return d.properties.NAME.trim()===borough ? "#ff7f0e" : regionData?.price ? colorScale(regionData.price) : "#ccc";
      });
      linePaths.attr("stroke-width", d=>d[0]===borough?4:1.5).attr("opacity", d=>d[0]===borough?1:0.3);
    }
    function resetHighlight(){
      boroughPaths.attr("fill", d => {
        const regionData = currentMapByRegion ? currentMapByRegion.get(d.properties.NAME.trim()) : null;
        return regionData?.price ? colorScale(regionData.price) : "#ccc";
      });
      linePaths.attr("stroke-width", 2).attr("opacity", 1);
    }

    boroughPaths.on("mouseover",(event,d)=>highlight(d.properties.NAME.trim()))
                .on("mouseout",resetHighlight);
    linePaths.on("mouseover",(event,d)=>highlight(d[0]))
             .on("mouseout",resetHighlight);

    // Map tooltip
    boroughPaths.on("mouseover.tooltip", function(event,d){
      const region = d.properties.NAME.trim();
      const regionData = currentMapByRegion ? currentMapByRegion.get(region) : null;
      tooltip.transition().duration(200).style("opacity",0.9);
      tooltip.html(`<strong>${region}</strong><br>📅 ${dateLabel.text()}<br>🏠 Avg Price: ${regionData?.price?"£"+d3.format(",")(regionData.price):"No data"}<br>📈 1m change: ${regionData?.change1m!=null?regionData.change1m.toFixed(1)+"%":"No data"}<br>📈 12m change: ${regionData?.change12m!=null?regionData.change12m.toFixed(1)+"%":"No data"}`)
        .style("left",(event.pageX+10)+"px")
        .style("top",(event.pageY-28)+"px");
    }).on("mousemove.tooltip", function(event){
      tooltip.style("left",(event.pageX+10)+"px").style("top",(event.pageY-28)+"px");
    }).on("mouseout.tooltip", function(){ tooltip.transition().duration(200).style("opacity",0); });

    // Chart tooltip
    const chartTooltip = d3.select("body").append("div").attr("class","tooltip").style("opacity",0).style("position","absolute");
    boroughData.forEach(([borough, values])=>{
      lineG.selectAll(`.circle-${borough.replace(/\s/g,"")}`)
        .data(values)
        .enter()
        .append("circle")
        .attr("class",`circle-${borough.replace(/\s/g,"")}`)
        .attr("cx", d=>xScale(d.parsedDate))
        .attr("cy", d=>yScale(d.AveragePrice))
        .attr("r",5)
        .attr("fill","transparent")
        .attr("pointer-events","all")
        .on("mouseover", function(event,d){
          highlight(borough);
          chartTooltip.transition().duration(200).style("opacity",0.9);
          chartTooltip.html(`<strong>${borough}</strong><br>📅 ${formatMonthYear(d.parsedDate)}<br>🏠 Avg Price: £${d3.format(",")(d.AveragePrice)}<br>📈 1m change: ${d["1m%Change"]!=null?d["1m%Change"].toFixed(1)+"%":"No data"}<br>📈 12m change: ${d["12m%Change"]!=null?d["12m%Change"].toFixed(1)+"%":"No data"}`)
            .style("left",(event.pageX+10)+"px")
            .style("top",(event.pageY-28)+"px");
        })
        .on("mousemove", function(event){ chartTooltip.style("left",(event.pageX+10)+"px").style("top",(event.pageY-28)+"px"); })
        .on("mouseout", function(){ resetHighlight(); chartTooltip.transition().duration(200).style("opacity",0); });
    });

    updateMap(dates[0]);
    slider.on("input", function(){ updateMap(dates[this.value]); });

    let intervalId=null;
    playPauseBtn.on("click", function(){
      if(intervalId){ clearInterval(intervalId); intervalId=null; playPauseBtn.text("Play"); }
      else{
        playPauseBtn.text("Pause");
        intervalId=setInterval(()=>{
          let currentValue=+slider.property("value");
          let nextValue=currentValue+1;
          if(nextValue>+slider.attr("max")) nextValue=0;
          slider.property("value",nextValue);
          updateMap(dates[nextValue]);
        },200);
      }
    });

  }).catch(err=>console.error("CSV load error:",err));
}).catch(err=>console.error("TopoJSON load error:",err));
