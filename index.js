const cp = require('child_process');
const { start } = require('repl');


try {
  // INITIAL SETUP
  // URL for JMX Exporter agent download
  const JMXInstallerWindows =
    'curl --output JMXFILE.jar https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.13.0/jmx_prometheus_javaagent-0.13.0.jar';
  const JMXInstallerLinux =
    'sudo wget https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.13.0/jmx_prometheus_javaagent-0.13.0.jar';

  // Create directory and download JMX Exporter Agent
  const currentWorkDir = { cwd: '..' };
  // cp.execSync(`mkdir JMXFOLDER`, currentWorkDir);
  currentWorkDir.cwd = '../JMXFOLDER';
  cp.execSync(JMXInstallerWindows, currentWorkDir);

  // Find Kafka path and copy JMX Exporter file into libs dir
  // const kafkaServerDir = cp.execSync(
  //   'find /Users/shahprose/Desktop -type d -iname "kafka_2.13-2.7.0-test*"'
  // );
  const kafkaServerDir = cp.execSync('find /home -type d -iname "kafka_2.13-2.7.0*"');
  // const kafkaServerDir = cp.execSync('find /c/Users/ching/Desktop -type d -iname "kafka-server*"');
  const kafkaServerStr = kafkaServerDir.toString();

  const returned = kafkaServerStr.replace(/\n/g,'');
  console.log('returned from path Resolver: ', returned);
  const kafkaLibsDir = `${returned}/libs/`;
  cp.execSync('cp JMXFILE.jar ' + kafkaLibsDir, currentWorkDir);

  // CHECKS:
  // Java path, kafka.service, kafka path

  // CONFIGURE EXPORTER
  // Copy kafka-2_0_0.yml file onto config dir
  const kafkaConfigDir = `${returned}/config/`;
  const kafkaServerStart = `${returned}/bin/`;
  cp.execSync(`cp kafka-2_0_0.yml ${kafkaConfigDir}`);

  // Remove and replace existing kafka-server-start.sh file
  // Check later to see if this can just be appended
  cp.execSync(`rm ${kafkaServerStart}kafka-server-start.sh`);
  cp.execSync(`cp kafka-server-start.sh ${kafkaServerStart}`);
  cp.execSync(`sudo chmod +x kafka-server-start.sh`);

  const serverPropertiesPath = `${kafkaConfigDir}server.properties`;
  const kafkaServerStartPath = `${kafkaServerStart}kafka-server-start.sh`;
  const kafkaServerStopPath = `${kafkaServerStart}kafka-server-stop.sh`;
  const jmxExporterPath = `${kafkaLibsDir}JMXFILE.jar`;
  const kafkaYmlPath = `${kafkaConfigDir}kafka-2_0_0.yml`;

  console.log('JMX Exporter path: ', jmxExporterPath);
  console.log('kafka yml path: ', kafkaYmlPath);
  console.log('server.properties path: ', serverPropertiesPath);
  console.log('kafka-server-start.sh path: ', kafkaServerStartPath);
  console.log('kafka-server-stop.sh path: ', kafkaServerStopPath);

  // IMPORTANT: Creating kafka.service file with correct paths
  cp.execSync(`echo "[Service]" > kafka.service`);
  cp.execSync(`echo "Type=simple" >> kafka.service`);

  let quotes = '"';
  // Path to Java
  cp.execSync(
    `echo 'Environment=${quotes}JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64${quotes}' >> kafka.service`
  );
  cp.execSync(`echo "##Add the line below" >> kafka.service`);
  cp.execSync(
    `echo 'Environment=${quotes}KAFKA_OPTS=-javaagent:${jmxExporterPath}=7075:${kafkaYmlPath}${quotes}' >> kafka.service`
  );
  cp.execSync(
    `echo "ExecStart=${kafkaServerStartPath} ${serverPropertiesPath}" >> kafka.service`
  );
  cp.execSync(`echo "ExecStop=${kafkaServerStopPath}" >> kafka.service`);
  cp.execSync(`echo "Restart=on-abnormal" >> kafka.service`);

  
  // CONFIGURE SYSTEMD
  // CHECK FOR SYSTEMD
  const checkSystemDKafka = cp.execSync('find /etc/systemd/system -type f -iname "kafka.service"')
  const systemDPathString = checkSystemDKafka.toString();
  console.log(systemDPathString);
  const resolvedSystemDPath = systemDPathString.replace(/\n/g,'');
  console.log('returned ', resolvedSystemDPath);
  cp.execSync(`sudo rm ${resolvedSystemDPath}`);
  console.log('sucessfully removed original kafka.service file.');
  cp.execSync(`sudo cp kafka.service ${resolvedSystemDPath}`);

  // check if daemon reload and restart are both possible from this cwd
  console.log('new kafka.service file copied onto ~/systemd/system/. Beginning daemon-reload');
  cp.execSync('systemctl daemon-reload');
  cp.execSync('systemctl restart kafka');

  cp.execSync('systemctl start kafka');
  cp.execSync('systemctl start zookeeper');
  console.log('JMX Exporter has been installed and configured. You may now go to localhost:7075 to check metrics');
  console.log(`If localhost:7075 doesn't work, open up the firewall that port.`)

} catch (err) {
  console.log('err', err);
}
