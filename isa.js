const net = require("net");
const os = require("os");
const fs = require("fs");
const exec = require("child_process").exec;
const events = require("events");
const public_ip = require('public-ip');
const iplocation = require("iplocation").default;
const config = require('./config/config.js');
const logger = require('tracer').colorConsole(config.ConsoleOption);

const cli = require('./src/command.js');
const hwinfo = require('./src/HWinfo.js');

var aJson = new Object();

main();
function writeData(socket, data) {
  socket.write(data);
}

async function main(){
  await cli.CLI(cli.Commands.Hypervisor, function(response) {
    aJson.virtualChecking1 = hwinfo.hypervisor(response);
    logger.debug("first virtual checking : " + hwinfo.hypervisor(response));
  });

  //virtual checking2
  await cli.CLI(cli.Commands.Virtualization, function(response) {
    aJson.virtualChecking2 = hwinfo.virtualization(response);
    logger.debug("second virtual checking : " + hwinfo.virtualization(response));
  });

  //Check Lan
  await cli.CLI(cli.Commands.NetworkSize, function(response) {
    aJson.CheckLanSize = hwinfo.networkSize(response);
    logger.debug("check lan size : " + hwinfo.networkSize(response));
  });

  //Cpu Model
  let CpuModel = await os.cpus()[0].model;
  aJson.CpuModel = CpuModel;

  //Cpu Count
  await cli.CLI(cli.Commands.CpuCnt, function(response) {
    aJson.CpuCnt = hwinfo.cpuCnt(response);
    logger.debug("cpu count : " + hwinfo.cpuCnt(response));
  });

  //Memory Info
  await cli.CLI(cli.Commands.MemoryInfo, function(response) {
    const memInfo = hwinfo.memoryInfo(response);
    aJson.MemorySize = memInfo.capacity;
    aJson.MemorySpeed = memInfo.speed;
    aJson.Memorycount = memInfo.count;
    logger.debug("memory size : " + memInfo.capacity);
    logger.debug("memory speed : " + memInfo.speed);
    logger.debug("memory count : " + memInfo.count);
  });

  //storage Info
  await cli.CLI(cli.Commands.storageInfo, function(response) {
    const storageInfo = hwinfo.storageInfo(response);

    aJson.SSD = storageInfo.ssdcount;
    aJson.HDD = storageInfo.hddcount;
    aJson.nvme = storageInfo.nvmecount;
    aJson.SSDSize = storageInfo.ssdCapacity;
    aJson.HDDSize = storageInfo.hddCapacity;
    aJson.nvmeSize = storageInfo.nvmeCapacity;

    //logger.debug("ssd count : " + storageInfo.ssdcount);
    //logger.debug("hdd count : " + storageInfo.hddcount);
    //logger.debug("nvme count : " + storageInfo.nvmecount);
    //logger.debug("ssd size : " + storageInfo.ssdCapacity);
    //logger.debug("hdd size : " + storageInfo.hddCapacity);
    //logger.debug("memory size : " + storageInfo.nvmeCapacity);
  });

  //get GPS info
  let gps = new Object();
  async function getGpsFromIp(){
    let global_ip = await public_ip.v4();
    await iplocation(global_ip, [], (error, res) => {
      let latitude = res.latitude;
      let longitude = res.longitude;
      let change_latitude1 = Math.floor(latitude);
      let change_latitude2 = Math.floor((latitude - change_latitude1)*100);
      let change_longitude1 = Math.floor(longitude);
      let change_longitude2 = Math.floor((longitude - change_longitude1) * 100);
      let p2paddr = "0x" + change_latitude1.toString(16) + change_latitude2.toString(16) + change_longitude1.toString(16) + change_longitude2.toString(16);
      aJson.GPS = res;
      aJson.P2PADDR = p2paddr;
      logger.debug("location info : " + res);
      logger.debug("p2paddr : " + p2paddr);
    });
  }
  getGpsFromIp();

  //get PORT info
  aJson.PORT = config.scaPort;
}

let isNn = false;

function getConnection(connName) {
  var client = net.connect({
      port: config.ISconnection.port,
      host: config.ISconnection.host
    },
    function() {
      logger.info(connName + " Connected");
      logger.debug("local = %s : %s", this.localAddress, this.localPort);
      logger.debug("remote = %s : %s", this.remoteAddress, this.remotePort);
      this.setEncoding("utf8");
      this.on("data", async function(data) {
        let java_pid;
        cli.CLI(cli.Commands.javaPid, function(response) {
          for (var i = 0; i < response.split(os.EOL).length-1; i++) {
            let java_pid_total_info = response.split(os.EOL);
            let java_pid_info = java_pid_total_info[i].split(' ');
            if(java_pid_info[1] == 'java'){
              java_pid = java_pid_info[0];
              let process_java_kill = cli.Commands.processKill + java_pid;
              cli.CLI(process_java_kill, function(response) {
				logger.info("java process kill");
              });
            }
          }
        });

        let node_pid;
        cli.CLI(cli.Commands.nodePid, function(response) {
          for (var i = 0; i < response.split(os.EOL).length-1; i++) {
            let node_pid_total_info = response.split(os.EOL);
            let node_pid_info = node_pid_total_info[i].split(' ');
            if(node_pid_info[2] == 'main.js'){
              node_pid = node_pid_info[0];
              let process_node_kill = cli.Commands.processKill + node_pid;
              cli.CLI(process_node_kill, function(response) {
				logger.info("node process kill");
              });
            }
          }
        });

        var parseData = JSON.parse(data)
        var data1 = parseData.data1;
        var data2 = parseData.data2;
        var data3 = parseData.data3;
        var prr = parseData.prr;

        //NN
        if(data1 != null && data2 != null && data3 != null){
          fs.writeFileSync(config.path.rr_net, data1, "utf8");
          logger.info("write rr_net file complete");
          fs.writeFileSync(config.path.rr_subnet, data2, "utf8");
          logger.info("write rr_subnet file complete");
          fs.writeFileSync(config.path.nn_node, data3, "utf8");
          logger.info("write node file complete");

          setTimeout(async function() {
            cli.CLI(cli.Commands.runNna, function(response){
              logger.info("child process <gmb_node_java.jar>");
              logger.debug(response);
            });
          }, 500);

          setTimeout(async function() {
            cli.CLI(cli.Commands.runSca, function(response){
              logger.info("child process <gmb_node_java.jar>");
              logger.debug(response);
            });
          }, 3000);

          await setTimeout(async function() {
            await emiiter();
          }, 8000);
		      isNn = true;
        }
        //CN
        else if(data1 == undefined && data2 == undefined && data3 != null){
          fs.writeFileSync(config.path.cn_node, data3, "utf8");
          logger.info("write node file complete");
          setTimeout(function() {
            cli.CLI(cli.Commands.runCn, function(response){
              logger.info("child process <gmb_node_java.jar>");
              logger.debug(response);
            });
          }, 1000);
        }
      });

      this.on("end", function() {
        logger.warn(connName + " Client disconnected");
      });
      this.on("error", function(err) {
        logger.error("Socket Error : ", JSON.stringify(err));
      });
      this.on("timeout", function() {
        logger.warn("Socket Timed Out");
      });
      this.on("close", function() {
        logger.info("Socket Closed");
      });
    }
  );
  return client;
}
var eventEmitter;

async function emiiter(){
  eventEmitter = new events.EventEmitter();
  await eventEmitter.on('connection', connectHandler);
  await eventEmitter.emit('connection');
}

function getConnection1(connName) {
  if(isNn == true){
    var client1 = net.connect({
  	  port : parseInt(process.env.NNA2ISA_Srv),
  	  host : os.networkInterfaces().eno1[0].address,
  	  localAddress: os.networkInterfaces().eno1[0].address,
  	  localPort: parseInt(process.env.ISA2CLI_Srv)}
  	  , function() {
        logger.info(connName + " Connected");
        logger.debug("local = %s : %s", this.localAddress, this.localPort);
        logger.debug("remote = %s : %s", this.remoteAddress, this.remotePort);
        this.setEncoding("utf8");
        this.on("data", function(data) {
          console.log(data);
          console.log("Response : ", data);
        });
        this.on("end", function() {
          logger.warn(connName + " Client disconnected");
        });
        this.on("error", function(err) {
          logger.error("Socket Error : ", JSON.stringify(err));
        });
        this.on("timeout", function() {
          logger.warn("Socket Timed Out");
        });
        this.on("close", function() {
          logger.info("Socket Closed");
        });
      }
    );
    return client1;
 	}
}

var connectHandler = async function connected(){
  var Java = getConnection1("Java");
  const buf1 = Buffer.from(config.instruction.updateRRList, 'hex');
  const buf3 = Buffer.from(config.instruction.startBlockGen, 'hex');
  await setTimeout(async function() {
    await writeData(Java, buf1);

  }, 100);
  await setTimeout(async function() {
    await writeData(Java, buf3);
  }, 500);
}

var outJson = new Object();
outJson.HWInfo = aJson;

var Dwarves = getConnection("Dwarves");

setTimeout(function() {
  var jsonContent = JSON.stringify(outJson);
  writeData(Dwarves, jsonContent);
}, 5000);
