const width = 700;
const height = 700;
const margin = {top: 120, right: 150, bottom: 120, left: 150}; // Increased margins for long labels

// Categories and their corresponding labels
//const categories = ["Technology", "System", "People", "Process", "Influence"];
const categories = ["FE & UX Architecture", "BE & System Design", "Data & Performance Engineering", "Distirbuted Systems", "System and Infrastructure"];


// const categoryLevels = [
//     ["Adopts", "Specializes", "Evangelizes", "Masters", "Creates"],  // Technology
//     ["Enhances", "Designs", "Owns", "Evolves", "Leads"],             // System
//     ["Leans", "Supports", "Mentors", "Coordinates", "Manages"],      // People
//     ["Follows", "Enforces", "Challenges", "Adjusts", "Defines"],     // Process
//     ["Sub-system", "Teams", "Multiple Teams", "Company", "Community"] // Influence
// ];

// "Learning", "Applying", "Expert", "Mentoring", "Teaching"

const categoryLevels = [
    ["Learning", "Applying", "Expert", "Mentoring", "Teaching"],  // FE & UX Architecture
    ["Learning", "Applying", "Expert", "Mentoring", "Teaching"],             // BE & System Design
    ["Learning", "Applying", "Expert", "Mentoring", "Teaching"],      // Data & Performance Engineering
    ["Learning", "Applying", "Expert", "Mentoring", "Teaching"],     // Distirbuted Systems
    ["Learning", "Applying", "Expert", "Mentoring", "Teaching"] // System and Infrastructure
];

// Radar chart options
const radarChartOptions = {
    w: width,
    h: height,
    margin: margin,
    maxValue: 5,  // Max level is 5
    levels: 5,    // Number of levels (1-5)
    roundStrokes: false,  // Set to false for straight edges (pentagon shape)
    color: d3.scaleOrdinal(d3.schemeCategory10)  // Color scheme for radar
};

// Global visibility state tracking
let visibilityState = {};

// Load CSV data
d3.csv("your-data.csv").then(function(data) {
    // Render the editable table at the top
    renderTable(data);

    // Parse the data into radar chart format
    const radarData = data.map(d => ({
        name: d.Name,  // Get the person's name
        values: categories.map(category => ({
            axis: category, 
            value: +d[category]  // Convert the category value to number
        }))
    }));

    // Initialize combined data array
    let combinedData = [];

    // Create individual charts for each person
    radarData.forEach((individualData, i) => {
        const color = radarChartOptions.color(i); // Get a color for each individual
        console.log(`${individualData.name} - ${color}`)

        // Create a div to hold the name and chart
        const chartContainer = d3.select("body").append("div")
            .attr("id", `individual-chart-${i}`)
            .style("margin-bottom", "50px")
            .style("text-align", "center")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center");

        // Append the person's name above the chart and apply the corresponding color
        chartContainer.append("h2")
            .text(individualData.name)
            .style("text-align", "center")  // Center the person's name
            .style("color", color)  // Assign color to the person's name
            .style("margin-bottom", "10px");  // Add space between the name and the chart

        // Render the radar chart with the corresponding color for the fill and draggable points
        RadarChart(chartContainer, [individualData.values], radarChartOptions, color, individualData.name);

        // Add this person's data to the combined dataset
        // combinedData.push(individualData.values);
        combinedData.push({name: individualData.name, datavalue: individualData.values, color, id: `person-${i}`});
        
        // Initialize visibility state for this person
        visibilityState[`person-${i}`] = true;
    });

    const combinedContainer = d3.select("#combinedRadarChart")


    // Create combined radar chart for all individuals at the top (without filling color)
    RadarCombinedChart(combinedContainer, combinedData, Object.assign({}, radarChartOptions, {
        fillOpacity: 0,  // Disable color filling
        color: d3.scaleOrdinal(d3.schemeCategory10)  // Use different color for each person
    }));

    // Create legend for the combined chart
    createLegend(combinedData);
});

function RadarCombinedChart(container, data, options) {
    const cfg = {
        w: options.w || 700,
        h: options.h || 700,
        margin: options.margin || {top: 120, right: 200, bottom: 120, left: 200},  // Increased margins for long labels
        levels: options.levels || 5,              // Number of concentric circles
        maxValue: options.maxValue || 5,          // Max value for the data
        labelFactor: 1.35,                        // Distance of the labels from the axes (increased)
        wrapWidth: 80,                            // Width to wrap the labels (increased)
        opacityArea: 0.1,                         // Light opacity for fill
        dotRadius: 8,                             // Radius for the circles
        strokeWidth: 2,                           // Width of the stroke around the lines
        roundStrokes: options.roundStrokes || false,  // Ensure straight edges (pentagon shape)
    };

    const allAxis = data[0].datavalue.map(i => i.axis);  // Categories
    const total = allAxis.length;  // Number of axes (pentagon shape)
    const radius = Math.min(cfg.w / 2, cfg.h / 2);
    const angleSlice = Math.PI * 2 / total;  // Create slices for the pentagon

    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, cfg.maxValue]);

    // Create the SVG container
    const svg = container.append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .style("overflow", "visible")  // Ensure no clipping
        .append("g")
        .attr("transform", `translate(${cfg.w / 2 + cfg.margin.left}, ${cfg.h / 2 + cfg.margin.top})`);

    // Circular grid (Level Guides)
    for (let level = 0; level < cfg.levels; level++) {
        const levelFactor = radius * ((level + 1) / cfg.levels);

        // Draw the circular grid lines
        svg.selectAll(".levels")
            .data([1])
            .enter()
            .append("polygon")
            .attr("points", () => {
                let points = '';
                for (let i = 0; i < total; i++) {
                    const x = levelFactor * Math.cos(angleSlice * i - Math.PI / 2);
                    const y = levelFactor * Math.sin(angleSlice * i - Math.PI / 2);
                    points += `${x},${y} `;
                }
                return points;
            })
            .style("stroke", "gray")
            .style("fill", "none")
            .style("stroke-dasharray", "2,2");
    }

    // Category level labels (Adopts, Enhances, etc.)
    for (let level = 0; level < cfg.levels; level++) {
        svg.selectAll(".level-labels")
            .data(categoryLevels)
            .enter()
            .append("text")
            .attr("x", (d, i) => rScale(level + 1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => rScale(level + 1) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("font-size", "10px")
            .style("fill", "gray")
            .text(d => d[level]);
    }

    // Draw category labels (before radar paths and circles)
    const axis = svg.selectAll(".axis")
        .data(allAxis)
        .enter().append("g")
        .attr("class", "axis");

    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(cfg.maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(cfg.maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("stroke", "black")
        .attr("stroke-width", "2px");

    // Category labels (names of the axes)
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .each(function(d) {
            const text = d3.select(this);
            const words = d.split(/\s+/);
            if (words.length > 2) {
                // For long labels, split into multiple lines
                text.text(null);
                words.forEach((word, i) => {
                    if (i === 0) {
                        text.append("tspan")
                            .attr("x", text.attr("x"))
                            .attr("dy", "-0.3em")
                            .text(word);
                    } else if (i === 1) {
                        text.append("tspan")
                            .attr("x", text.attr("x"))
                            .attr("dy", "1.1em")
                            .text(word);
                    } else {
                        text.append("tspan")
                            .attr("x", text.attr("x"))
                            .attr("dy", "1.1em")
                            .text(word);
                    }
                });
            } else {
                text.text(d);
            }
        });

    // Radar line (connect data points with straight lines for each person)
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)  // Ensures the path is closed
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    // Draw radar paths for each person
    data.forEach((personData, index) => {
        const color = personData.color;

        // Radar line group
        const radarWrapper = svg.append("g")
            .attr("class", "radarWrapper")
            .attr("id", `combined-${personData.id}`);

        radarWrapper
            .selectAll(".radarArea")
            .data([personData.datavalue])
            .enter().append("path")
            .attr("class", "radarArea")
            .attr("d", radarLine)
            .style("stroke-width", `${cfg.strokeWidth}px`)
            .style("stroke", color)
            .style("fill", color)
            .style("fill-opacity", cfg.opacityArea);

        // Add circles and initials at each axis point for this person with drag behavior
        personData.datavalue.forEach((d, i) => {
            const initialPos = {
                x: rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2),
                y: rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2)
            };

            const circle = radarWrapper.append("circle")
                .attr("class", "radarCircle")
                .attr("cx", initialPos.x)
                .attr("cy", initialPos.y)
                .attr("r", cfg.dotRadius)
                .style("fill", color)
                .style("fill-opacity", 0.8)
                .call(d3.drag().on("drag", function(event) {
                    // Restrict drag to the axis
                    const newValue = Math.min(cfg.maxValue, Math.max(0, rScale.invert(Math.sqrt(event.x ** 2 + event.y ** 2))));
                    const newX = rScale(newValue) * Math.cos(angleSlice * i - Math.PI / 2);
                    const newY = rScale(newValue) * Math.sin(angleSlice * i - Math.PI / 2);

                    d3.select(this).attr("cx", newX).attr("cy", newY);

                    // Move initials with the circle
                    initials.attr("x", newX).attr("y", newY);

                    // Update the data value dynamically
                    d.value = newValue;
                    
                    // Update the radar path in the combined chart
                    const radarLine = d3.lineRadial()
                        .curve(d3.curveLinearClosed)
                        .radius(d => rScale(d.value))
                        .angle((d, i) => i * angleSlice);
                    
                    radarWrapper.select("path").attr("d", radarLine);
                    
                    // Update the table and individual chart
                    updateTableFromCombinedChart(d.axis, newValue, personData.name);
                }));

            const initials = radarWrapper.append("text")
                .attr("x", initialPos.x)
                .attr("y", initialPos.y)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("fill", "#fff")
                .text(getInitials(personData.name));
        });
    });

    // Helper function to get initials from a person's name
    function getInitials(name) {
        return name.split(' ').map(d => d[0]).join('');
    }
}

/* RadarChart function */
function RadarChart(container, data, options, color, personName) {
    console.log(`options: ${options.color}`)
    console.log(`color : ${color}`)
    const cfg = {
        w: options.w || 700,
        h: options.h || 700,
        margin: options.margin || {top: 120, right: 150, bottom: 120, left: 150},  // Increased margins for long labels
        levels: options.levels || 5,              // Number of concentric circles
        maxValue: options.maxValue || 5,          // Max value for the data
        labelFactor: 1.35,                        // Distance of the labels from the axes (increased)
        wrapWidth: 80,                            // Width to wrap the labels (increased)
        opacityArea: 0.35,                        // Opacity of the filled area
        dotRadius: 6,                             // Increased radius of the dots for dragging
        strokeWidth: 2,                           // Width of the stroke around the filled area
        roundStrokes: options.roundStrokes || false,  // Ensure straight edges (pentagon shape)
        color: color || d3.scaleOrdinal(d3.schemeCategory10)  // Color for the radar
    };

    const allAxis = data[0].map(i => i.axis);  // Categories
    const total = allAxis.length;  // Number of axes (pentagon shape)
    const radius = Math.min(cfg.w / 2, cfg.h / 2);
    const angleSlice = Math.PI * 2 / total;  // Create 5 slices for a pentagon

    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, cfg.maxValue]);

        console.log(data)
    const svg = container.append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .append("g")
        .attr("transform", `translate(${cfg.w / 2 + cfg.margin.left}, ${cfg.h / 2 + cfg.margin.top})`);

    // Circular grid (Level Guides)
    for (let level = 0; level < cfg.levels; level++) {
        const levelFactor = radius * ((level + 1) / cfg.levels);

        svg.selectAll(".levels")
            .data([1])
            .enter()
            .append("polygon")
            .attr("points", () => {
                let points = '';
                for (let i = 0; i < total; i++) {
                    const x = levelFactor * Math.cos(angleSlice * i - Math.PI / 2);
                    const y = levelFactor * Math.sin(angleSlice * i - Math.PI / 2);
                    points += `${x},${y} `;
                }
                return points;
            })
            .style("stroke", "gray")
            .style("fill", "none")
            .style("stroke-dasharray", "2,2");
    }

    // Category level labels (Adopts, Enhances, etc.)
    for (let level = 0; level < cfg.levels; level++) {
        svg.selectAll(".level-labels")
            .data(categoryLevels)
            .enter()
            .append("text")
            .attr("x", (d, i) => rScale(level + 1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => rScale(level + 1) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("font-size", "10px")
            .style("fill", "gray")
            .text(d => d[level]);
    }

    // Axes (for each category)
    const axis = svg.selectAll(".axis")
        .data(allAxis)
        .enter().append("g")
        .attr("class", "axis");

    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(cfg.maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(cfg.maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("stroke", "black")
        .attr("stroke-width", "2px");

    // Axis labels (Category labels) - move slightly outward from the axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .each(function(d) {
            const text = d3.select(this);
            const words = d.split(/\s+/);
            if (words.length > 2) {
                // For long labels, split into multiple lines
                text.text(null);
                words.forEach((word, i) => {
                    if (i === 0) {
                        text.append("tspan")
                            .attr("x", text.attr("x"))
                            .attr("dy", "-0.3em")
                            .text(word);
                    } else if (i === 1) {
                        text.append("tspan")
                            .attr("x", text.attr("x"))
                            .attr("dy", "1.1em")
                            .text(word);
                    } else {
                        text.append("tspan")
                            .attr("x", text.attr("x"))
                            .attr("dy", "1.1em")
                            .text(word);
                    }
                });
            } else {
                text.text(d);
            }
        });

    // Radar line (connect data points with straight lines for pentagon) and close the path
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)  // Ensures the path is closed
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    // Draw the radar path
    const radarWrapper = svg.append("g").attr("class", "radarWrapper");

    const path = radarWrapper.selectAll(".radarArea")
        .data(data)
        .enter().append("path")
        .attr("class", "radarArea")
        .attr("d", radarLine)
        .style("fill", cfg.color)
        .style("fill-opacity", cfg.opacityArea)
        .style("stroke-width", `${cfg.strokeWidth}px`)
        .style("stroke", cfg.color);

    // Draggable points for interaction
    const drag = d3.drag()
        .on("drag", function (event, d) {
            // Get the angle of the axis to constrain dragging along it
            const index = data[0].indexOf(d);
            const angle = angleSlice * index - Math.PI / 2;

            // Constrain the dragging along the axis
            const newValue = Math.max(0, Math.min(cfg.maxValue, rScale.invert(Math.sqrt(event.x * event.x + event.y * event.y))));
            d.value = newValue;

            // Update the radar chart and the dragged point position
            path.attr("d", radarLine);
            d3.select(this)
                .attr("cx", rScale(d.value) * Math.cos(angle))
                .attr("cy", rScale(d.value) * Math.sin(angle));
            
            // Update the table value and combined chart
            updateTableFromChart(d.axis, newValue, personName);
        });

    const points = radarWrapper.selectAll(".radarCircle")
        .data(data[0])  // Bind to data
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", cfg.color)
        .style("fill-opacity", 0.8)
        .call(drag);  // Enable dragging for the points
}

/* Function to create legend for the combined chart */
function createLegend(data) {
    // Create legend container - insert it before the combined chart
    const legendContainer = d3.select("body")
        .insert("div", "#combinedRadarChart")
        .attr("class", "legend-container")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("margin", "20px 0")
        .style("padding", "15px")
        .style("background-color", "#f8f9fa")
        .style("border-radius", "8px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

    // Add legend title
    legendContainer.append("div")
        .style("width", "100%")
        .style("text-align", "center")
        .style("margin-bottom", "5px")
        .style("font-weight", "bold")
        .style("font-size", "16px")
        .style("color", "#555")
        .text("Legend");

    // Add instruction text
    legendContainer.append("div")
        .style("width", "100%")
        .style("text-align", "center")
        .style("margin-bottom", "10px")
        .style("font-size", "12px")
        .style("color", "#777")
        .style("font-style", "italic")
        .text("Click on names to show/hide charts");

    // Create legend items container
    const legendItemsContainer = legendContainer.append("div")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("flex-wrap", "wrap");

    // Create legend items
    const legendItems = legendItemsContainer.selectAll(".legend-item")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin", "5px 15px")
        .style("font-size", "14px")
        .style("font-weight", "500");

    // Add color circles
    legendItems.append("div")
        .attr("class", "legend-color-circle")
        .style("width", "16px")
        .style("height", "16px")
        .style("border-radius", "50%")
        .style("background-color", d => d.color)
        .style("margin-right", "8px")
        .style("border", "2px solid #fff")
        .style("box-shadow", "0 1px 3px rgba(0,0,0,0.3)");

    // Add names
    legendItems.append("span")
        .text(d => d.name)
        .style("color", "#333");

    // Add click handlers to legend items
    legendItems
        .style("cursor", "pointer")
        .attr("title", "Click to show/hide this person's charts")
        .on("click", function(event, d) {
            togglePersonVisibility(d.id);
            updateLegendAppearance();
        });
}

/* Function to toggle person visibility in both charts */
function togglePersonVisibility(personId) {
    // Toggle visibility state
    visibilityState[personId] = !visibilityState[personId];
    
    // Toggle combined chart visibility
    const combinedElement = d3.select(`#combined-${personId}`);
    if (visibilityState[personId]) {
        combinedElement.style("display", "block");
    } else {
        combinedElement.style("display", "none");
    }
    
    // Toggle individual chart visibility
    const individualChartId = personId.replace('person-', 'individual-chart-');
    const individualElement = d3.select(`#${individualChartId}`);
    if (visibilityState[personId]) {
        individualElement.style("display", "flex");
    } else {
        individualElement.style("display", "none");
    }
}

/* Function to update legend appearance based on visibility state */
function updateLegendAppearance() {
    d3.selectAll(".legend-item")
        .style("opacity", function(d) {
            return visibilityState[d.id] ? 1 : 0.3;
        })
        .style("text-decoration", function(d) {
            return visibilityState[d.id] ? "none" : "line-through";
        });
    
    // Also update the color circles opacity
    d3.selectAll(".legend-color-circle")
        .style("opacity", function(d) {
            return visibilityState[d.id] ? 1 : 0.3;
        });
}



// Add table to the top of the page
function renderTable(data) {
    // Create table container with styling
    const tableContainer = d3.select("body")
        .insert("div", "h1")
        .attr("id", "table-container")
        .style("margin", "20px auto 40px auto")
        .style("max-width", "1200px")
        .style("overflow-x", "auto");

    // Add table title
    tableContainer.append("h2")
        .text("Editable Data Table")
        .style("text-align", "center")
        .style("margin-bottom", "10px")
        .style("color", "#333");

    // Add instruction text
    tableContainer.append("p")
        .text("Edit the values in the table below to see real-time updates in the charts")
        .style("text-align", "center")
        .style("margin-bottom", "15px")
        .style("color", "#666")
        .style("font-size", "14px");

    // Create the table and headers
    const table = tableContainer.append("table")
        .attr("border", 1)
        .style("width", "100%")
        .style("border-collapse", "collapse")
        .style("margin-bottom", "20px")
        .style("background-color", "#fff")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

    const header = table.append("thead").append("tr")
        .style("background-color", "#f8f9fa")
        .style("font-weight", "bold");
    
    header.append("th")
        .text("Name")
        .style("padding", "12px")
        .style("border", "1px solid #ddd")
        .style("text-align", "left");
    
    categories.forEach(category => {
        header.append("th")
            .text(category)
            .style("padding", "12px")
            .style("border", "1px solid #ddd")
            .style("text-align", "center")
            .style("min-width", "120px");
    });

    // Create table body
    const tbody = table.append("tbody");

    // Fill the table with data from CSV
    data.forEach((d, i) => {
        const row = tbody.append("tr")
            .style("border-bottom", "1px solid #eee");
        
        // Name column (non-editable)
        row.append("td")
            .text(d.Name)
            .style("padding", "12px")
            .style("border", "1px solid #ddd")
            .style("font-weight", "500")
            .style("background-color", "#f8f9fa");
        
        // Category columns (editable)
        categories.forEach(category => {
            const cell = row.append("td")
                .attr("contenteditable", true)
                .style("padding", "12px")
                .style("border", "1px solid #ddd")
                .style("text-align", "center")
                .style("cursor", "text")
                .style("background-color", "#fff")
                .text(d[category]);

            // Add styling for editable cells
            cell.on("blur", function() {
                d3.select(this).style("background-color", "#fff");
            });

            // Add listener to handle updates when cell is edited
            cell.on("input", function() {
                const newValue = +this.textContent;
                if (!isNaN(newValue) && newValue >= 0 && newValue <= 5) {
                    d[category] = newValue;
                    d3.select(this).style("border-color", "#ddd");
                    updateChartsFromTable();
                } else {
                    // Show error state
                    d3.select(this).style("border-color", "#f44336");
                    
                    // Reset to previous value after a short delay
                    setTimeout(() => {
                        this.textContent = d[category];
                        d3.select(this).style("border-color", "#ddd");
                    }, 1000);
                }
            });
            
            // Add validation hint on focus
            cell.on("focus", function() {
                d3.select(this)
                    .style("background-color", "#e3f2fd")
                    .attr("title", "Enter a value between 0 and 5");
            });
        });
    });

    // Add save button
    const saveButton = tableContainer.append("button")
        .text("Save Changes to CSV")
        .style("display", "block")
        .style("margin", "20px auto")
        .style("padding", "12px 24px")
        .style("font-size", "16px")
        .style("background-color", "#4CAF50")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "4px")
        .style("cursor", "pointer")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)");

    saveButton.on("click", function() {
        saveToOriginalCSV(data);
    });

    // Add hover effect to save button
    saveButton.on("mouseover", function() {
        d3.select(this).style("background-color", "#45a049");
    });

    saveButton.on("mouseout", function() {
        d3.select(this).style("background-color", "#4CAF50");
    });
}

// Helper function to get initials from a person's name
function getInitials(name) {
    return name.split(' ').map(d => d[0]).join('');
}

// Function to update table from individual chart drag
function updateTableFromChart(categoryAxis, newValue, personName) {
    // Find the table row for this person
    const tableRows = d3.selectAll("#table-container tbody tr");
    
    tableRows.each(function() {
        const row = d3.select(this);
        const nameCell = row.select("td:first-child");
        
        if (nameCell.text() === personName) {
            // Find the correct category column
            const categoryIndex = categories.indexOf(categoryAxis);
            if (categoryIndex !== -1) {
                // Update the table cell
                const editableCells = row.selectAll("td[contenteditable='true']");
                const targetCell = d3.select(editableCells.nodes()[categoryIndex]);
                targetCell.text(Math.round(newValue * 100) / 100); // Round to 2 decimal places
                
                // Add visual feedback for the update
                targetCell.style("background-color", "#4CAF50")
                    .style("color", "white")
                    .transition()
                    .duration(500)
                    .style("background-color", "#fff")
                    .style("color", "#333");
                
                // Update the combined chart for this person
                updateCombinedChartFromDrag(personName, categoryAxis, newValue);
            }
        }
    });
}

// Function to update combined chart when individual chart is dragged
function updateCombinedChartFromDrag(personName, categoryAxis, newValue) {
    // Find the person's data in the combined chart
    const combinedChartSvg = d3.select("#combinedRadarChart svg");
    
    // Find all radar wrappers and update the one for this person
    combinedChartSvg.selectAll(".radarWrapper").each(function() {
        const wrapper = d3.select(this);
        const wrapperData = wrapper.datum();
        
        // Check if this wrapper belongs to the person (by checking initials in circles)
        const circles = wrapper.selectAll("circle");
        const textElements = wrapper.selectAll("text");
        
        if (textElements.size() > 0) {
            const initials = textElements.text();
            const expectedInitials = getInitials(personName);
            
            if (initials === expectedInitials) {
                // Update the data value
                const categoryIndex = categories.indexOf(categoryAxis);
                if (categoryIndex !== -1) {
                    // Update the radar path
                    const radarData = categories.map((category, i) => {
                        if (i === categoryIndex) {
                            return { axis: category, value: newValue };
                        }
                        // Get current value from the circle position
                        const circle = d3.select(circles.nodes()[i]);
                        const cx = +circle.attr("cx");
                        const cy = +circle.attr("cy");
                        const radius = Math.sqrt(cx * cx + cy * cy);
                        const rScale = d3.scaleLinear().range([0, Math.min(300, 300)]).domain([0, 5]);
                        const currentValue = rScale.invert(radius);
                        return { axis: category, value: currentValue };
                    });
                    
                    // Update the path
                    const radarLine = d3.lineRadial()
                        .curve(d3.curveLinearClosed)
                        .radius(d => {
                            const rScale = d3.scaleLinear().range([0, Math.min(300, 300)]).domain([0, 5]);
                            return rScale(d.value);
                        })
                        .angle((d, i) => i * (Math.PI * 2 / categories.length));
                    
                    wrapper.select("path").datum(radarData).attr("d", radarLine);
                    
                    // Update the circle position
                    const angleSlice = Math.PI * 2 / categories.length;
                    const rScale = d3.scaleLinear().range([0, Math.min(300, 300)]).domain([0, 5]);
                    const newX = rScale(newValue) * Math.cos(angleSlice * categoryIndex - Math.PI / 2);
                    const newY = rScale(newValue) * Math.sin(angleSlice * categoryIndex - Math.PI / 2);
                    
                    d3.select(circles.nodes()[categoryIndex])
                        .attr("cx", newX)
                        .attr("cy", newY);
                    
                    // Update the text position
                    d3.select(textElements.nodes()[categoryIndex])
                        .attr("x", newX)
                        .attr("y", newY);
                }
            }
        }
    });
}

// Function to update table from combined chart drag
function updateTableFromCombinedChart(categoryAxis, newValue, personName) {
    // Update the table value
    updateTableFromChart(categoryAxis, newValue, personName);
    
    // Update the individual chart for this person
    updateIndividualChartFromDrag(personName, categoryAxis, newValue);
}

// Function to update individual chart when combined chart is dragged
function updateIndividualChartFromDrag(personName, categoryAxis, newValue) {
    // Find the individual chart for this person
    const individualCharts = d3.selectAll("[id^='individual-chart-']");
    
    individualCharts.each(function() {
        const chartDiv = d3.select(this);
        const chartTitle = chartDiv.select("h2").text();
        
        if (chartTitle === personName) {
            // Find the SVG and update the specific data point
            const svg = chartDiv.select("svg");
            const categoryIndex = categories.indexOf(categoryAxis);
            
            if (categoryIndex !== -1) {
                // Update the circle position
                const circles = svg.selectAll(".radarCircle");
                const targetCircle = d3.select(circles.nodes()[categoryIndex]);
                
                // Calculate new position
                const angleSlice = Math.PI * 2 / categories.length;
                const radius = Math.min(300, 300); // Using the same radius as in the chart
                const rScale = d3.scaleLinear().range([0, radius]).domain([0, 5]);
                const newX = rScale(newValue) * Math.cos(angleSlice * categoryIndex - Math.PI / 2);
                const newY = rScale(newValue) * Math.sin(angleSlice * categoryIndex - Math.PI / 2);
                
                targetCircle.attr("cx", newX).attr("cy", newY);
                
                // Update the radar path
                const radarData = categories.map((category, i) => {
                    if (i === categoryIndex) {
                        return { axis: category, value: newValue };
                    }
                    // Get current value from other circles
                    const circle = d3.select(circles.nodes()[i]);
                    const cx = +circle.attr("cx");
                    const cy = +circle.attr("cy");
                    const radius = Math.sqrt(cx * cx + cy * cy);
                    const currentValue = rScale.invert(radius);
                    return { axis: category, value: currentValue };
                });
                
                // Update the path
                const radarLine = d3.lineRadial()
                    .curve(d3.curveLinearClosed)
                    .radius(d => rScale(d.value))
                    .angle((d, i) => i * angleSlice);
                
                svg.select(".radarArea").datum(radarData).attr("d", radarLine);
            }
        }
    });
}

// Function to update all charts when table data changes
function updateChartsFromTable() {
    // Clear existing charts
    d3.selectAll("#combinedRadarChart").selectAll("*").remove();
    d3.selectAll("[id^='individual-chart-']").remove();
    d3.selectAll(".legend-container").remove();
    
    // Get current table data
    const tableData = [];
    d3.selectAll("#table-container tbody tr").each(function() {
        const row = d3.select(this);
        const name = row.select("td").text();
        const rowData = { Name: name };
        
        let cellIndex = 0;
        row.selectAll("td[contenteditable='true']").each(function() {
            const value = +d3.select(this).text();
            rowData[categories[cellIndex]] = value;
            cellIndex++;
        });
        
        tableData.push(rowData);
    });
    
    // Recreate charts with updated data
    recreateCharts(tableData);
}

// Function to recreate all charts with new data
function recreateCharts(data) {
    // Parse the data into radar chart format
    const radarData = data.map(d => ({
        name: d.Name,
        values: categories.map(category => ({
            axis: category, 
            value: +d[category]
        }))
    }));

    // Initialize combined data array
    let combinedData = [];

    // Create individual charts for each person
    radarData.forEach((individualData, i) => {
        const color = radarChartOptions.color(i);

        // Create a div to hold the name and chart
        const chartContainer = d3.select("body").append("div")
            .attr("id", `individual-chart-${i}`)
            .style("margin-bottom", "50px")
            .style("text-align", "center")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center");

        // Append the person's name above the chart
        chartContainer.append("h2")
            .text(individualData.name)
            .style("text-align", "center")
            .style("color", color)
            .style("margin-bottom", "10px");

                 // Render the radar chart
         RadarChart(chartContainer, [individualData.values], radarChartOptions, color, individualData.name);

        // Add this person's data to the combined dataset
        combinedData.push({name: individualData.name, datavalue: individualData.values, color, id: `person-${i}`});
        
        // Update visibility state for this person (maintain previous state if exists)
        if (visibilityState[`person-${i}`] === undefined) {
            visibilityState[`person-${i}`] = true;
        }
    });

    // Create combined radar chart
    const combinedContainer = d3.select("#combinedRadarChart");
    RadarCombinedChart(combinedContainer, combinedData, Object.assign({}, radarChartOptions, {
        fillOpacity: 0,
        color: d3.scaleOrdinal(d3.schemeCategory10)
    }));

    // Create legend
    createLegend(combinedData);
    
    // Apply current visibility states
    Object.keys(visibilityState).forEach(personId => {
        if (!visibilityState[personId]) {
            const combinedElement = d3.select(`#combined-${personId}`);
            combinedElement.style("display", "none");
            
            const individualChartId = personId.replace('person-', 'individual-chart-');
            const individualElement = d3.select(`#${individualChartId}`);
            individualElement.style("display", "none");
        }
    });
    
    // Update legend appearance
    updateLegendAppearance();
}

// Function to save changes to original CSV file
function saveToOriginalCSV(originalData) {
    // Get current data from the table instead of using original data
    const currentData = getCurrentTableData();
    
    // Convert current data to CSV format
    const header = ['Name', ...categories];
    const rows = currentData.map(d => [d.Name, ...categories.map(category => d[category])]);
    
    const csvContent = [header, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "your-data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    const saveButton = d3.select("#table-container button");
    const originalText = saveButton.text();
    saveButton.text("Saved!")
        .style("background-color", "#2196F3");
    
    setTimeout(() => {
        saveButton.text(originalText)
            .style("background-color", "#4CAF50");
    }, 2000);
}

// Function to get current data from the table
function getCurrentTableData() {
    const tableData = [];
    d3.selectAll("#table-container tbody tr").each(function() {
        const row = d3.select(this);
        const name = row.select("td:first-child").text();
        const rowData = { Name: name };
        
        let cellIndex = 0;
        row.selectAll("td[contenteditable='true']").each(function() {
            const value = +d3.select(this).text();
            rowData[categories[cellIndex]] = value;
            cellIndex++;
        });
        
        tableData.push(rowData);
    });
    
    return tableData;
}

