from .ExternalTempReaderPlugin import ExternalTempReaderPlugin

def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = ExternalTempReaderPlugin()
    
    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.comm.protocol.temperatures.received": __plugin_implementation__.inject_chamber_temperature
    }
    
    # Log that hooks are registered
    import logging
    logger = logging.getLogger("octoprint.plugins.external_temp_reader")
    logger.info("External Temp Reader plugin loaded with temperature hook registered")

__plugin_name__ = "External Temp Reader"
__plugin_pythoncompat__ = ">=2.7,<4"
__plugin_version__ = "1.0.0"
__plugin_description__ = "Reads chamber temperature from WirelessTag API"
