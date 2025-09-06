from setuptools import setup

plugin_identifier = "external_temp_reader"
plugin_package = "octoprint_external_temp_reader"
plugin_name = "OctoPrint-ExternalTempReader"
plugin_version = "1.0.0"
plugin_description = "An OctoPrint plugin to read chamber temperature from an external API."
plugin_author = "Mike"
plugin_author_email = "githubuser@terasec.com"
plugin_url = "https://github.com/mike-enker/octoprint-external-temp"
plugin_license = "Apache-2.0"

setup(
    name=f"{plugin_name}",
    version=plugin_version,
    description=plugin_description,
    author=plugin_author,
    author_email=plugin_author_email,
    url=plugin_url,
    license=plugin_license,
    packages=[plugin_package],
    package_data={
        plugin_package: ["templates/*.jinja2", "static/js/*.js"]
    },
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        # Add plugin dependencies here
        "requests"
    ],
    entry_points={
        "octoprint.plugin": [f"{plugin_identifier} = {plugin_package}"]
    },
)
