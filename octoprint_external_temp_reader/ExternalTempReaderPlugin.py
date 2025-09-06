import threading
import time
from xml.etree import ElementTree as ET

import requests
from octoprint.plugin import SettingsPlugin, StartupPlugin, ShutdownPlugin, TemplatePlugin, AssetPlugin


class ExternalTempReaderPlugin(SettingsPlugin, TemplatePlugin, AssetPlugin, StartupPlugin, ShutdownPlugin):
    def __init__(self):
        super().__init__()
        self.polling_thread = None
        self.stop_polling = False
        self.base_url = None
        self.tag_uuid = None
        self.polling_interval = 10
        self.xml_temp_path = None  # XPath-like path for XML parsing
        self.current_chamber_temp = None

    def on_after_startup(self):
        self._logger.info("ExternalTempReader plugin loaded. Loading configuration...")
        self.load_configuration()
        self.start_polling_thread()
    
    def on_settings_save(self, data):
        """Handle settings save and apply changes immediately."""
        # Get the old interval before saving
        old_interval = self.polling_interval
        
        # Save the settings using the parent class method
        super().on_settings_save(data)
        
        # Reload configuration with new values
        self.load_configuration()
        
        # Check if polling interval changed
        if old_interval != self.polling_interval:
            self._logger.info(f"Polling interval changed from {old_interval}s to {self.polling_interval}s, restarting polling thread")
            # Restart the polling thread with new interval
            self.restart_polling_thread()
        
        # Check if URL or UUID changed
        if 'tag_uuid' in data or 'base_url' in data:
            self._logger.info("API configuration changed, next poll will use new settings")

    def on_shutdown(self):
        self._logger.info("ExternalTempReader plugin unloaded. Stopping polling thread...")
        self.stop_polling_thread()

    def on_enable(self):
        """Called when the plugin is enabled (from the Plugin Manager UI)."""
        self._logger.info("ExternalTempReader plugin enabled. Starting polling...")
        self.start_polling_thread()

    def on_disable(self):
        """Called when the plugin is disabled (from the Plugin Manager UI)."""
        self._logger.info("ExternalTempReader plugin disabled. Stopping polling...")
        self.stop_polling_thread()

    def load_configuration(self):
        """Load configuration from plugin settings."""
        self.base_url = self._settings.get(["base_url"]) or "https://my.wirelesstag.net/ethLogShared.asmx/GetLatestTemperatureRawDataByUUID"
        self.tag_uuid = self._settings.get(["tag_uuid"])
        # Use getInt for integer conversion with default value
        self.polling_interval = self._settings.getInt(["polling_interval"]) or 60
        self.xml_temp_path = self._settings.get(["xml_temp_path"]) or "./temperature"
        self._logger.info(f"Loaded configuration: Base URL={self.base_url}, UUID={self.tag_uuid}, Interval={self.polling_interval}s, Path={self.xml_temp_path}")

    def start_polling_thread(self):
        """Start the polling thread to fetch external temperature."""
        if not self.polling_thread:
            self.stop_polling = False
            self.polling_thread = threading.Thread(target=self.poll_external_temp)
            self.polling_thread.daemon = True
            self.polling_thread.start()

    def poll_external_temp(self):
        """Fetch temperature data from the external API periodically."""
        while not self.stop_polling:
            if self.tag_uuid and self.base_url:
                try:
                    # Construct the full URL from base URL and UUID
                    full_url = f"{self.base_url}?uuid={self.tag_uuid}"
                    response = requests.get(full_url, timeout=5)
                    response.raise_for_status()
                    temp = self.parse_temperature_from_xml(response.text)
                    if temp is not None:
                        self.current_chamber_temp = temp
                        self._logger.info(f"Chamber temperature updated: {temp:.2f}°C")
                        
                        # Send temperature update to frontend
                        self._send_temperature_update(temp)
                except Exception as e:
                    self._logger.error(f"Failed to fetch or parse temperature: {e}")
            elif not self.tag_uuid:
                self._logger.debug("No UUID configured, skipping temperature fetch")
            time.sleep(self.polling_interval)

    def parse_temperature_from_xml(self, xml_string):
        """Parse the temperature value from the XML string."""
        try:
            root = ET.fromstring(xml_string)
            # Handle namespace in WirelessTag XML response
            namespaces = {'ns': 'http://mytaglist.com/ethLogShared'}
            
            # Try with namespace first (WirelessTag API format)
            temp_element = root.find('.//ns:temp_degC', namespaces)
            if temp_element is None:
                # Fallback to configured path without namespace
                temp_element = root.find(self.xml_temp_path)
            
            if temp_element is not None:
                temp_celsius = float(temp_element.text)
                self._logger.info(f"Successfully parsed temperature from XML: {temp_celsius:.2f}°C")
                return temp_celsius
            else:
                self._logger.error(f"Temperature element not found in XML")
                self._logger.debug(f"XML content: {xml_string[:500]}...")  # Log first 500 chars of XML
        except ET.ParseError as e:
            self._logger.error(f"Error parsing XML: {e}")
        except ValueError as e:
            self._logger.error(f"Error converting temperature to float: {e}")
        return None

    def inject_chamber_temperature(self, comm, parsed_temps):
        """Hook to inject chamber temperature into the temperature data."""
        if self.current_chamber_temp is not None:
            # Add chamber temperature to the parsed temperatures
            # Format is (actual, target) tuple
            parsed_temps["C"] = (self.current_chamber_temp, None)
            self._logger.debug(f"Injected chamber temperature: {self.current_chamber_temp}°C")
        return parsed_temps

    def stop_polling_thread(self):
        """Stop the polling thread."""
        self.stop_polling = True
        if self.polling_thread:
            self.polling_thread.join(timeout=5)  # Wait max 5 seconds
            self.polling_thread = None
    
    def restart_polling_thread(self):
        """Restart the polling thread with new settings."""
        self._logger.info("Restarting temperature polling thread...")
        self.stop_polling_thread()
        # Small delay to ensure thread is fully stopped
        time.sleep(0.5)
        self.start_polling_thread()
        self._logger.info("Temperature polling thread restarted with new settings")

    def get_settings_defaults(self):
        """Default plugin settings."""
        return {
            "base_url": "https://my.wirelesstag.net/ethLogShared.asmx/GetLatestTemperatureRawDataByUUID",
            "tag_uuid": "",  # User must provide their WirelessTag UUID
            "polling_interval": 60,
            "xml_temp_path": "./temperature"
        }

    def get_template_configs(self):
        return [
            {
                "type": "settings",
                "custom_bindings": False,
                "template": "external_temp_reader_settings.jinja2"
            },
            {
                "type": "navbar",
                "custom_bindings": False,
                "template": "external_temp_reader_navbar.jinja2"
            },
            {
                "type": "tab",
                "name": "Chamber Temp",
                "template": "external_temp_reader_tab.jinja2",
                "custom_bindings": False
            }
        ]
    
    def get_assets(self):
        return {
            "js": ["js/external_temp_reader.js"],
            "css": ["css/external_temp_reader.css"]
        }
    
    def _send_temperature_update(self, temperature):
        """Send temperature update to the frontend via plugin message."""
        try:
            self._plugin_manager.send_plugin_message(
                self._identifier,
                {
                    "type": "temperature_update",
                    "chamber_temp": temperature
                }
            )
            self._logger.debug(f"Sent temperature update to frontend: {temperature:.2f}°C")
        except Exception as e:
            self._logger.error(f"Failed to send temperature update to frontend: {e}")
