# OctoPrint External Temperature Reader Plugin

This plugin reads chamber temperature from a WirelessTag API and displays it in OctoPrint's interface.

## Features

### Core Functionality
- Fetches temperature data from WirelessTag API endpoints
- Works independently of printer connection status
- Real-time temperature updates via WebSocket
- Configurable polling interval (10-300 seconds) with immediate effect on change
- Support for custom XML temperature paths
- Clean separation of UUID and base URL configuration
- Persistent temperature history across page refreshes (clears on server restart)
- Server-side history storage with automatic 24-hour cleanup

### Temperature Display
- **Navbar Display**: Shows current chamber temperature in the top bar with thermometer icon
- **Dedicated Tab**: Full-featured "Chamber Temp" tab with professional temperature monitoring interface

### Chamber Temperature Tab Features
- **Interactive Temperature Chart**
  - Real-time updating graph with orange theme
  - Adaptive Y-axis scaling for better visualization (no fixed zero baseline)
  - Hover tooltips showing exact time and temperature
  - Auto-scrolling option to follow latest data
  - Time range controls (10 min to 24 hours)
  - Stores up to 24 hours of temperature history
  - History persists across page refreshes

- **Statistics Dashboard**
  - Large current temperature display
  - Min/Max/Average temperature calculations
  - Data point counter
  - Connection status indicator
  - Last update timestamp

- **Data Management**
  - Clear History button to reset all data
  - Export to CSV for data analysis
  - Automatic data trimming after 24 hours

## Building the Plugin

### Development Setup

1. **Clone the repository**:
```bash
git clone https://github.com/mike-enker/octoprint-external-temp.git
cd octoprint-external-temp
```

2. **Create a virtual environment** (recommended):
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install development dependencies**:
```bash
pip install -r requirements.txt
```

4. **Install plugin in development mode**:
```bash
pip install -e .
```

### Building for Distribution

1. **Build the distribution package**:
```bash
python setup.py sdist
```

This creates a distribution file in the `dist/` directory:
- `OctoPrint-ExternalTempReader-1.0.0.tar.gz` - Source distribution

2. **Clean build artifacts** (optional):
```bash
rm -rf build/ dist/ *.egg-info/
```

## Installation

### Method 1: Install from Distribution Package

```bash
pip install dist/OctoPrint-ExternalTempReader-1.0.0.tar.gz
```

### Method 2: Install via OctoPrint Plugin Manager

1. Open OctoPrint web interface
2. Go to Settings → Plugin Manager
3. Click "Get More..." → "...from URL"
4. Enter: `https://github.com/mike-enker/octoprint-external-temp/archive/main.zip`
5. Click Install

### Method 3: Upload Distribution File

1. Build the plugin as described above
2. In OctoPrint, go to Settings → Plugin Manager
3. Click "Get More..." → "...from an uploaded file"
4. Select the `.tar.gz` file from `dist/`
5. Click Install

## Configuration

1. Navigate to OctoPrint Settings → External Temp Reader
2. Configure the following settings:
   - **WirelessTag UUID**: Your sensor's UUID (e.g., `111aaab3-e991-43c7-b9a1-f999b0999f99`)
   - **API Base URL**: Usually the default is fine (`https://my.wirelesstag.net/ethLogShared.asmx/GetLatestTemperatureRawDataByUUID`)
   - **Polling Interval**: How often to fetch temperature (10-300 seconds, default 60) - changes take effect immediately
   - **XML Temperature Path**: Leave default for WirelessTag API

### Getting Your WirelessTag UUID

1. Log into your WirelessTag account at https://my.wirelesstag.net
2. Navigate to your tag settings
3. Enable "Share" for the tag you want to monitor
4. Copy the UUID from the sharing URL
5. Enter just the UUID in the plugin settings

## How It Works

The plugin:
1. Polls the WirelessTag API at the configured interval
2. Parses the XML response to extract temperature in Celsius
3. Stores temperature history on the server (up to 24 hours)
4. Sends temperature updates to the frontend via WebSocket
5. Displays the chamber temperature in the navbar (top bar)
6. Works independently of printer connection status
7. Loads historical data when the page is refreshed
8. Automatically applies setting changes without requiring restart

## Where Temperature is Displayed

### 1. Navbar (Top Bar)
- Shows "Chamber: XX.X°C" with a thermometer icon
- Always visible for quick temperature monitoring
- Updates in real-time as new data arrives

### 2. Chamber Temp Tab
- Dedicated tab in OctoPrint's main interface
- Professional temperature monitoring dashboard
- Interactive chart with historical data
- Statistics and data management tools
- No interference with printer temperature displays

### 3. System Logs
- Temperature updates are logged for debugging
- Access via Settings → Logs
- Filter by "external_temp_reader" for plugin-specific logs

## Troubleshooting

### Plugin doesn't appear in Plugin Manager
- Ensure the plugin files are properly installed
- Check OctoPrint logs for loading errors
- Verify Python compatibility (requires Python 2.7+ or 3.x)

### No temperature readings
- Verify your UUID is entered correctly
- Check that the tag's sharing is enabled in WirelessTag
- Look in OctoPrint logs (Settings → Logs) for error messages
- Test the API URL directly in a browser to ensure it returns XML data

### Temperature shows as 0 or incorrect
- Ensure your WirelessTag is reporting data
- Check the XML path configuration if using a custom format
- Verify the tag's battery level and signal strength

### Temperature not showing in navbar
- Clear browser cache and refresh (Ctrl+F5 or Cmd+Shift+R)
- Check browser console (F12) for JavaScript errors
- Verify the plugin's JavaScript file loaded correctly

### Chamber Temp tab chart not displaying
- Open browser console (F12 → Console)
- Click on the "Chamber Temp" tab
- Look for "External Temp Reader:" messages
- Check for "Chart initialized successfully" or error messages
- Clear browser cache if chart container is missing
- Ensure JavaScript is enabled in your browser

## Recent Improvements

### Version 1.0.0 Features
- **Persistent History**: Temperature history now persists across page refreshes (stored server-side)
- **Adaptive Chart Scaling**: Y-axis automatically adjusts to show relevant temperature range
- **Dynamic Settings**: Polling interval changes take effect immediately without restart
- **Improved Tooltips**: Chart tooltips properly display time and temperature on hover
- **API Endpoint**: Added REST API endpoint for fetching temperature history
- **Automatic Cleanup**: Old temperature data (>24 hours) is automatically removed

## Plugin API

The plugin provides a REST API endpoint for accessing temperature data:

### GET `/api/plugin/external_temp_reader`

Returns the current temperature and historical data.

**Response:**
```json
{
  "history": [
    {"time": 1725650400000, "temperature": 22.5},
    {"time": 1725650460000, "temperature": 22.6}
  ],
  "current_temp": 22.6
}
```

- `history`: Array of temperature readings with timestamps (milliseconds since epoch)
- `current_temp`: Most recent temperature reading in Celsius

## API Response Format

The plugin expects XML responses in this format from WirelessTag:
```xml
<?xml version="1.0" encoding="utf-8"?>
<TemperatureDataPoint xmlns="http://mytaglist.com/ethLogShared">
  <time>2025-09-06T15:38:19-04:00</time>
  <temp_degC>22.487756347656251</temp_degC>
  <cap>76.46612548828125</cap>
  <lux>0</lux>
  <battery_volts>3.1466694920952931</battery_volts>
</TemperatureDataPoint>
```

## Deployment

### Publishing to PyPI (Optional)

1. **Build the distribution**:
```bash
python setup.py sdist bdist_wheel
```

2. **Upload to PyPI**:
```bash
twine upload dist/*
```

### Publishing to OctoPrint Plugin Repository

1. Fork the [OctoPrint Plugin Repository](https://github.com/OctoPrint/plugins.octoprint.org)
2. Create a new file `_plugins/external_temp_reader.md` with plugin details
3. Submit a pull request

### Creating a GitHub Release

1. **Tag the release**:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

2. **Create release on GitHub**:
   - Go to your repository's Releases page
   - Click "Create a new release"
   - Select the tag you created
   - Upload the `.tar.gz` and `.whl` files from `dist/`
   - Add release notes

## Project Structure

```
octoprint-external-temp/
├── .gitignore                      # Git ignore file
├── .venv/                          # Virtual environment (not in git)
├── MANIFEST.in                     # Package manifest
├── README.md                       # This file
├── requirements.txt                # Development dependencies
├── setup.py                        # Package setup script
├── dist/                          # Built distributions (not in git)
└── octoprint_external_temp_reader/ # Plugin package
    ├── __init__.py                # Plugin initialization & hooks
    ├── ExternalTempReaderPlugin.py # Main plugin code
    ├── static/                    # Static assets
    │   ├── css/
    │   │   └── external_temp_reader.css     # Styling for tab and navbar
    │   └── js/
    │       └── external_temp_reader.js      # Chart logic and UI updates
    └── templates/                 # Jinja2 templates
        ├── external_temp_reader_navbar.jinja2   # Navbar temperature display
        ├── external_temp_reader_settings.jinja2 # Settings page
        └── external_temp_reader_tab.jinja2      # Chamber temp tab
```

## Usage Guide

### Initial Setup
1. Install the plugin and restart OctoPrint
2. Navigate to Settings → External Temp Reader
3. Enter your WirelessTag UUID
4. Save settings and refresh the page

### Using the Chamber Temp Tab
1. Click on the "Chamber Temp" tab in OctoPrint
2. Temperature data will begin populating the chart
3. Use time range buttons to zoom in/out (10 min - 24 hours)
4. Enable "Auto-scroll" to keep the latest data in view
5. Hover over the chart to see exact temperature values
6. Export data as CSV for external analysis

### Monitoring Temperature
- **Quick View**: Check navbar for current temperature
- **Detailed View**: Use Chamber Temp tab for full history
- **Statistics**: Monitor Min/Max/Average on the dashboard
- **Data Export**: Download CSV for spreadsheet analysis

## Development Tips

1. **Watch logs during development**:
```bash
tail -f ~/.octoprint/logs/octoprint.log | grep external_temp_reader
```

2. **Test changes without reinstalling**:
   - Install in development mode (`pip install -e .`)
   - Changes to Python files require OctoPrint restart
   - Changes to JS/CSS/templates require browser cache clear (Ctrl+F5)

3. **Debug JavaScript**:
   - Open browser console (F12)
   - Look for "External Temp Reader:" messages
   - Check for chart initialization logs

4. **Debug Chart Issues**:
   - Verify Flot library is loaded: `$.plot` in console
   - Check chart container exists: `$("#chamber-temperature-chart").length`
   - Look for JavaScript errors in console

5. **Version bumping**:
   - Update version in `setup.py`
   - Update version in `octoprint_external_temp_reader/__init__.py`
   - Tag the release in git

## Technical Details

### API Integration
- Uses WirelessTag's public API endpoint for shared tags
- Polls data at configurable intervals (default: 60 seconds)
- Parses XML response with namespace handling
- Extracts temperature from `temp_degC` field

### Frontend Architecture
- KnockoutJS for data binding (OctoPrint standard)
- Flot library for chart rendering
- WebSocket for real-time updates
- Custom CSS for consistent theming

### Data Storage
- In-memory storage of temperature history
- Maximum 2,880 data points (24 hours at 30-second intervals)
- Automatic cleanup of old data
- No database required

## License

Apache 2.0

## Author

Mike (githubuser@terasec.com)

## Acknowledgments

- OctoPrint community for plugin development resources
- WirelessTag for providing public API access
- Flot charts library for visualization