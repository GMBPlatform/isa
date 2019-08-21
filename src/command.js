const exec = require("child_process").exec;

module.exports.Commands = {
  Hypervisor : "lscpu | grep Hypervisor",
  Virtualization : "hostnamectl | grep 'Virtualization'",
  NetworkSize : "lshw -C network | grep 'size' | grep -v 'resources'",
  CpuCnt : "dmidecode -t processor | grep 'Socket Designation'",
  MemoryInfo : "dmidecode -t 17",
  storageInfo : "lsblk -P -d -o rm,rota,group,name,size | grep disk",
  javaPid : "pgrep -a java",
  processKill : "kill -9 ",
  nodePid : "pgrep -a node",
  runNna : "cd ../NNA && java -jar gmb_node_java.jar",
  runSca : "cd ../SCA && node main.js",
  runCn : "cd ../CN && java -jar gmb_node_java.jar"
}

module.exports.CLI = function(str, callback){
  exec(str, function(error, stdout, stderr) {
    if (error !== null){
      //logger.error("exec error : " + error);
    }
    return callback(stdout);
  });
}

