$(function() {
    function ExternalTempReaderViewModel(parameters) {
        var self = this;
        
        self.settings = parameters[0];
        self.temperature = ko.observable("--");
        self.lastUpdate = ko.observable("");
        
        self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin !== "external_temp_reader") {
                return;
            }
            
            if (data.type === "temperature_update") {
                if (data.chamber_temp !== null && data.chamber_temp !== undefined) {
                    self.temperature(data.chamber_temp.toFixed(1) + "°C");
                    self.lastUpdate(new Date().toLocaleTimeString());
                    
                    // Also try to update the temperature graph if it exists
                    if (OctoPrint && OctoPrint.coreui && OctoPrint.coreui.viewmodels.temperatureViewModel) {
                        // Try to inject into the temperature view model
                        var tempViewModel = OctoPrint.coreui.viewmodels.temperatureViewModel;
                        if (tempViewModel.temperatures && !tempViewModel.temperatures.chamber) {
                            tempViewModel.temperatures.chamber = {
                                actual: ko.observable(data.chamber_temp),
                                target: ko.observable(null)
                            };
                        } else if (tempViewModel.temperatures && tempViewModel.temperatures.chamber) {
                            tempViewModel.temperatures.chamber.actual(data.chamber_temp);
                        }
                        
                        // Log for debugging
                        console.log("External Temp Reader: Updated chamber temperature to " + data.chamber_temp.toFixed(1) + "°C");
                    }
                }
            }
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: ExternalTempReaderViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#navbar_plugin_external_temp_reader", "#tab_plugin_external_temp_reader"]
    });
});