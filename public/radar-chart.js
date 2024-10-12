const width = 600;
const height = 600;
const margin = {top: 100, right: 100, bottom: 100, left: 100}; // Increased margins

// Categories and their corresponding labels
const categories = ["Technology", "System", "People", "Process", "Influence"];
const categoryLevels = [
    ["Adopts", "Specializes", "Evangelizes", "Masters", "Creates"],  // Technology
    ["Enhances", "Designs", "Owns", "Evolves", "Leads"],             // System
    ["Leans", "Supports", "Mentors", "Coordinates", "Manages"],      // People
    ["Follows", "Enforces", "Challenges", "Adjusts", "Defines"],     // Process
    ["Sub-system", "Teams", "Multiple Teams", "Company", "Community"] // Influence
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

// Load CSV data
d3.csv("your-data.csv").then(function(data) {
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
            .style("margin-bottom", "50px");

        // Append the person's name above the chart and apply the corresponding color
        chartContainer.append("h2")
            .text(individualData.name)
            .style("text-align", "center")  // Center the person's name
            .style("color", color)  // Assign color to the person's name
            .style("margin-bottom", "10px");  // Add space between the name and the chart

        // Render the radar chart with the corresponding color for the fill and draggable points
        RadarChart(chartContainer, [individualData.values], radarChartOptions, color);

        // Add this person's data to the combined dataset
        // combinedData.push(individualData.values);
        combinedData.push({name: individualData.name, datavalue: individualData.values, color});
    });

    const combinedContainer = d3.select("#combinedRadarChart")


    // Create combined radar chart for all individuals at the top (without filling color)
    RadarCombinedChart(combinedContainer, combinedData, Object.assign({}, radarChartOptions, {
        fillOpacity: 0,  // Disable color filling
        color: d3.scaleOrdinal(d3.schemeCategory10)  // Use different color for each person
    }));
    

    // Create a button for downloading the updated CSV
    d3.select("body").append("button")
        .text("Download Updated CSV")
        .style("display", "block")
        .style("margin", "20px auto")
        .on("click", () => downloadCSV(radarData));  // Call the download function on click
});

function RadarCombinedChart(container, data, options) {
    const cfg = {
        w: options.w || 600,
        h: options.h || 600,
        margin: options.margin || {top: 100, right: 200, bottom: 100, left: 100},  // Increased right margin for legend
        levels: options.levels || 5,              // Number of concentric circles
        maxValue: options.maxValue || 5,          // Max value for the data
        labelFactor: 1.25,                        // Distance of the labels from the axes
        wrapWidth: 60,                            // Width to wrap the labels
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
        .style("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d);  // Add the axis label (category name)

    // Radar line (connect data points with straight lines for each person)
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)  // Ensures the path is closed
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    // Draw radar paths for each person
    data.forEach((personData, index) => {
        const color = personData.color;

        // Radar line group
        const radarWrapper = svg.append("g").attr("class", "radarWrapper");

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

                    // Optionally, update the data value dynamically
                    d.value = newValue;
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
function RadarChart(container, data, options, color) {
    console.log(`options: ${options.color}`)
    console.log(`color : ${color}`)
    const cfg = {
        w: options.w || 600,
        h: options.h || 600,
        margin: options.margin || {top: 100, right: 100, bottom: 100, left: 100},  // Margins
        levels: options.levels || 5,              // Number of concentric circles
        maxValue: options.maxValue || 5,          // Max value for the data
        labelFactor: 1.25,                        // Distance of the labels from the axes
        wrapWidth: 60,                            // Width to wrap the labels
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
        .style("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d);  // Add the axis label (category name)

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

/* Function to download updated data as CSV */
function downloadCSV(data) {
    // Convert the updated radar data into CSV format
    const header = ['Name', ...categories];
    const rows = data.map(d => [d.name, ...d.values.map(val => val.value)]);

    // Build the CSV string
    const csvContent = [header, ...rows]
        .map(row => row.join(','))
        .join('\n');

    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a download link and trigger the download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "updated-data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add table to the top of the page
function renderTable(data) {
    const tableContainer = d3.select("body").append("div").attr("id", "table-container");

    // Create the table and headers
    const table = tableContainer.append("table").attr("border", 1).style("margin-bottom", "50px");
    const header = table.append("thead").append("tr");
    header.append("th").text("Name");  // First column: Name
    categories.forEach(category => header.append("th").text(category));  // Add category headers

    // Create table body
    const tbody = table.append("tbody");

    // Fill the table with data from CSV
    data.forEach((d, i) => {
        const row = tbody.append("tr");
        row.append("td").text(d.Name);  // Name column
        categories.forEach(category => {
            const cell = row.append("td")
                .attr("contenteditable", true)  // Make each cell editable
                .text(d[category]);

            // Add listener to handle updates when cell is edited
            cell.on("input", function () {
                // Update the radar data and charts when the user edits the table
                d[category] = +this.textContent;  // Update the value in the data
                updateRadarChart(i, d);  // Update radar chart for this user
            });
        });
    });
}

// Function to update radar chart for a given user index
function updateRadarChart(userIndex, updatedData) {
    const radarData = categories.map(category => ({
        axis: category,
        value: +updatedData[category]  // Convert the category value to number
    }));

    // Re-render the radar chart for this user
    const radarWrapper = d3.select(`#radar-chart-${userIndex}`);
    radarWrapper.select("path")
        .datum(radarData)
        .attr("d", radarLine);  // Update the radar chart line

    // Also update the radar circles for each axis
    radarWrapper.selectAll(".radarCircle")
        .data(radarData)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("r", cfg.dotRadius);
}

