# OctoPrint External Temperature Reader Plugin

This plugin reads chamber temperature from a WirelessTag API and displays it in OctoPrint's interface.

## Features

- Fetches temperature data from WirelessTag API endpoints
- Displays chamber temperature in the OctoPrint navbar (top bar)
- Works independently of printer connection status
- Real-time temperature updates via WebSocket
- Configurable polling interval
- Support for custom XML temperature paths
- Clean separation of UUID and base URL configuration

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
python setup.py sdist bdist_wheel
```

This creates two files in the `dist/` directory:
- `OctoPrint-ExternalTempReader-1.0.0.tar.gz` - Source distribution
- `OctoPrint_ExternalTempReader-1.0.0-py2.py3-none-any.whl` - Wheel distribution

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
4. Select the `.tar.gz` or `.whl` file from `dist/`
5. Click Install

## Configuration

1. Navigate to OctoPrint Settings → External Temp Reader
2. Configure the following settings:
   - **WirelessTag UUID**: Your sensor's UUID (e.g., `5136d0e3-e226-43b2-b9a1-f843a0220f63`)
   - **API Base URL**: Usually the default is fine (`https://my.wirelesstag.net/ethLogShared.asmx/GetLatestTemperatureRawDataByUUID`)
   - **Polling Interval**: How often to fetch temperature (10-300 seconds, default 60)
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
3. Sends temperature updates to the frontend via WebSocket
4. Displays the chamber temperature in the navbar (top bar)
5. Works independently of printer connection status

## Where Temperature is Displayed

- **Navbar**: Shows "Chamber: XX.X°C" with a thermometer icon in the top bar
- **Logs**: Temperature updates are logged for debugging

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
- Clear browser cache and refresh
- Check browser console (F12) for JavaScript errors
- Verify the plugin's JavaScript file loaded correctly

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
    ├── __init__.py                # Plugin initialization
    ├── ExternalTempReaderPlugin.py # Main plugin code
    ├── static/                    # Static assets
    │   └── js/
    │       └── external_temp_reader.js
    └── templates/                 # Jinja2 templates
        ├── external_temp_reader_navbar.jinja2
        └── external_temp_reader_settings.jinja2
```

## Development Tips

1. **Watch logs during development**:
```bash
tail -f ~/.octoprint/logs/octoprint.log | grep external_temp_reader
```

2. **Test changes without reinstalling**:
   - Install in development mode (`pip install -e .`)
   - Changes to Python files require OctoPrint restart
   - Changes to JS/templates may require browser refresh

3. **Debug JavaScript**:
   - Open browser console (F12)
   - Look for "External Temp Reader:" messages

4. **Version bumping**:
   - Update version in `setup.py`
   - Update version in `octoprint_external_temp_reader/__init__.py`
   - Tag the release in git

## License

Apache 2.0

## Author

Mike (githubuser@terasec.com)