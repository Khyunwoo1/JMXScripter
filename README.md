# JMXScripter
Script to download and configure JMX exporter onto your Kafka instance

# Getting Started
- Git clone this thing.
- Type "node index.js" onto your terminal.

# Caveats
- Works for Linux/Ubuntu and Mac OS. Sorry, Windows.
- Will override these existing files:
  - kafka-server-start.sh
  - kafka.service
  Make sure to save any customizations elsewhere before running this script.
- Assumes your Java file is in the /usr/lib/jvm directory. If it's not, best you move it there until this get's updated.

# But Most Importantly
Remember to have fun.

Also, it gets the JMX Exporter from here: https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/
and the kafka-2_0_0.yml file from here: https://github.com/prometheus/jmx_exporter/tree/master/example_configs
