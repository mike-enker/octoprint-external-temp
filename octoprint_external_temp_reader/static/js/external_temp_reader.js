$(function() {
    function ExternalTempReaderViewModel(parameters) {
        var self = this;
        
        self.settings = parameters[0];
        
        // Navbar display
        self.temperature = ko.observable("--");
        self.lastUpdate = ko.observable("Never");
        
        // Statistics
        self.minTemp = ko.observable("--");
        self.maxTemp = ko.observable("--");
        self.avgTemp = ko.observable("--");
        self.dataPointCount = ko.observable(0);
        self.connectionStatus = ko.observable("Initializing");
        
        // Chart settings
        self.autoScroll = ko.observable(true);
        self.timeRange = ko.observable(60); // minutes
        
        // Data storage
        self.temperatureHistory = [];
        self.maxDataPoints = 2880; // 24 hours at 30-second intervals
        self.chart = null;
        
        // Handle temperature updates from plugin
        self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin !== "external_temp_reader") {
                return;
            }
            
            if (data.type === "temperature_update") {
                if (data.chamber_temp !== null && data.chamber_temp !== undefined) {
                    self.updateTemperature(data.chamber_temp);
                }
            }
        };
        
        self.updateTemperature = function(temp) {
            var now = new Date();
            var timestamp = now.getTime();
            
            // Update display
            self.temperature(temp.toFixed(1) + "°C");
            self.lastUpdate(now.toLocaleTimeString());
            self.connectionStatus("Connected");
            
            // Add to history
            self.temperatureHistory.push({
                time: timestamp,
                temperature: temp
            });
            
            // Trim history if too long
            if (self.temperatureHistory.length > self.maxDataPoints) {
                self.temperatureHistory = self.temperatureHistory.slice(-self.maxDataPoints);
            }
            
            // Update statistics
            self.updateStatistics();
            
            // Update chart
            self.updateChart();
            
            // Update data point count
            self.dataPointCount(self.temperatureHistory.length);
            
            console.log("External Temp Reader: Updated chamber temperature to " + temp.toFixed(1) + "°C");
        };
        
        self.updateStatistics = function() {
            if (self.temperatureHistory.length === 0) return;
            
            var temps = self.temperatureHistory.map(function(point) { return point.temperature; });
            var min = Math.min.apply(null, temps);
            var max = Math.max.apply(null, temps);
            var sum = temps.reduce(function(a, b) { return a + b; }, 0);
            var avg = sum / temps.length;
            
            self.minTemp(min.toFixed(1) + "°C");
            self.maxTemp(max.toFixed(1) + "°C");
            self.avgTemp(avg.toFixed(1) + "°C");
        };
        
        self.updateChart = function() {
            if (!self.chart) return;
            
            var now = new Date().getTime();
            var rangeMs = self.timeRange() * 60 * 1000;
            var minTime = now - rangeMs;
            
            // Filter data for time range
            var filteredData = self.temperatureHistory.filter(function(point) {
                return point.time >= minTime;
            });
            
            // Convert to Flot format
            var chartData = filteredData.map(function(point) {
                return [point.time, point.temperature];
            });
            
            // Update chart
            self.chart.setData([{
                label: "Chamber Temperature",
                data: chartData,
                color: "#FF8C00",
                lines: { show: true, fill: true, fillColor: { colors: [{ opacity: 0.1 }, { opacity: 0.3 }] } },
                points: { show: false }
            }]);
            
            // Update axes if auto-scroll is on
            if (self.autoScroll()) {
                var xaxis = self.chart.getAxes().xaxis;
                xaxis.options.min = minTime;
                xaxis.options.max = now;
            }
            
            self.chart.setupGrid();
            self.chart.draw();
        };
        
        self.initializeChart = function() {
            // Check if Flot is available
            if (!$.plot) {
                console.error("External Temp Reader: Flot library not available!");
                return;
            }
            
            var chartElement = $("#chamber-temperature-chart");
            if (chartElement.length === 0) {
                console.error("External Temp Reader: Chart element not found!");
                return;
            }
            
            console.log("External Temp Reader: Creating chart with Flot");
            
            var options = {
                series: {
                    lines: {
                        show: true,
                        lineWidth: 2,
                        fill: true
                    },
                    points: {
                        show: false
                    },
                    shadowSize: 1
                },
                grid: {
                    hoverable: true,
                    clickable: false,
                    borderWidth: 1,
                    borderColor: "#ddd",
                    backgroundColor: { colors: ["#fff", "#f9f9f9"] }
                },
                xaxis: {
                    mode: "time",
                    timeformat: "%H:%M",
                    timezone: "browser",
                    tickColor: "#ddd"
                },
                yaxis: {
                    tickColor: "#ddd",
                    tickFormatter: function(val) {
                        return val.toFixed(1) + "°C";
                    }
                },
                legend: {
                    position: "nw",
                    backgroundColor: "transparent"
                }
            };
            
            // Initialize with empty data
            var initialData = [{
                label: "Chamber Temperature",
                data: [],
                color: "#FF8C00",
                lines: { show: true, fill: true, fillColor: { colors: [{ opacity: 0.1 }, { opacity: 0.3 }] } }
            }];
            
            try {
                self.chart = $.plot(chartElement, initialData, options);
                console.log("External Temp Reader: Chart initialized successfully");
            } catch (e) {
                console.error("External Temp Reader: Failed to initialize chart:", e);
            }
            
            // Add hover tooltip
            $("#chamber-temperature-chart").bind("plothover", function (event, pos, item) {
                if (item) {
                    var date = new Date(item.datapoint[0]);
                    var temp = item.datapoint[1];
                    
                    $("#tooltip").remove();
                    var tooltip = $('<div id="tooltip" class="tooltip-inner">')
                        .text(date.toLocaleTimeString() + ": " + temp.toFixed(1) + "°C")
                        .css({
                            position: 'absolute',
                            display: 'none',
                            top: item.pageY - 28,
                            left: item.pageX + 5,
                            border: '1px solid #666',
                            padding: '2px 5px',
                            'background-color': '#fff',
                            'border-radius': '3px',
                            'font-size': '12px',
                            'z-index': 1000
                        }).appendTo("body").fadeIn(200);
                } else {
                    $("#tooltip").remove();
                }
            });
        };
        
        self.setTimeRange = function(minutes) {
            self.timeRange(minutes);
            self.updateChart();
            
            // Update button states
            $(".chart-controls .btn-group .btn").removeClass("active");
            event.target.classList.add("active");
        };
        
        self.clearHistory = function() {
            if (confirm("Are you sure you want to clear all temperature history?")) {
                self.temperatureHistory = [];
                self.updateStatistics();
                self.updateChart();
                self.dataPointCount(0);
                self.minTemp("--");
                self.maxTemp("--");
                self.avgTemp("--");
            }
        };
        
        self.exportData = function() {
            if (self.temperatureHistory.length === 0) {
                alert("No data to export");
                return;
            }
            
            var csv = "Timestamp,Temperature (°C)\n";
            self.temperatureHistory.forEach(function(point) {
                var date = new Date(point.time);
                csv += date.toISOString() + "," + point.temperature.toFixed(2) + "\n";
            });
            
            var blob = new Blob([csv], { type: 'text/csv' });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'chamber_temperature_' + new Date().toISOString().split('T')[0] + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        };
        
        self.onAfterBinding = function() {
            // Wait for tab to be visible and Flot to be available
            setTimeout(function() {
                // Check if we're on the tab and Flot is available
                if ($("#chamber-temperature-chart").length > 0) {
                    console.log("External Temp Reader: Initializing chart");
                    self.initializeChart();
                    
                    // Set up periodic chart updates (every 5 seconds)
                    setInterval(function() {
                        if (self.temperatureHistory.length > 0) {
                            self.updateChart();
                        }
                    }, 5000);
                } else {
                    console.warn("External Temp Reader: Chart container not found, retrying...");
                    // Retry after a delay
                    setTimeout(arguments.callee, 1000);
                }
            }, 1000);
        };
        
        self.onTabChange = function(current, previous) {
            // Initialize or redraw chart when tab becomes visible
            if (current === "#tab_plugin_external_temp_reader") {
                console.log("External Temp Reader: Tab activated");
                setTimeout(function() {
                    if (!self.chart) {
                        console.log("External Temp Reader: Chart not initialized, initializing now");
                        self.initializeChart();
                    } else {
                        console.log("External Temp Reader: Updating existing chart");
                        self.updateChart();
                    }
                }, 200);
            }
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: ExternalTempReaderViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#navbar_plugin_external_temp_reader", "#tab_plugin_external_temp_reader"]
    });
});