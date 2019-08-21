const os = require("os");
const public_ip = require('public-ip');
const iplocation = require("iplocation").default;

function getValueFromWord(word) {
  let firstQuoteIndex = word.indexOf('"');
  let lastQuoteIndex = word.lastIndexOf('"');
  return word.substring(firstQuoteIndex + 1, lastQuoteIndex);
}

function unifyStorageSizeUnit(size) {
  let indexOfUnit = size.length - 1;
  let unit = size[indexOfUnit];
  let sizeBeforeChange = size.substring(0, indexOfUnit);
  if (unit == "G") {
    return parseFloat(sizeBeforeChange);
  } else if (unit == "T") {
    return parseFloat(sizeBeforeChange * 1024);
  } else if (unit == "M") {
    return parseFloat(sizeBeforeChange / 1024);
  }
}

module.exports.hypervisor = function(response){
  for (var i = 0; i < response.split(os.EOL).length; i++) {
    if (response.split(os.EOL)[i].match("vendor") == "vendor") {
      CheckVirtual1 = "VirtualMachine";
    } else {
      CheckVirtual1 = null;
    }
  }
  return(CheckVirtual1);
}

module.exports.virtualization = function(response){
  for (var i = 0; i < response.split(os.EOL).length; i++) {
    if (response.split(os.EOL)[i].match("Virtualization") == "Virtualization") {
      CheckVirtual2 = "VirtualMachine";
    } else {
      CheckVirtual2 = null;
    }
  }
  return(CheckVirtual2);
}

module.exports.networkSize = function(response){
  let lanArray = new Array();
  for (var i = 0; i < response.split(os.EOL).length - 1; i++) {
    let size;
    size = response.split(os.EOL)[i].slice(13, -5);
    lanArray.push(size);
  }
  return(lanArray);
}

module.exports.cpuCnt = function(response){
  let count = 0;
  for (var i = 0; i < response.split(os.EOL).length; i++) {
    if (response.split(os.EOL)[i].match("CPU") == "CPU") {
      count++;
    }
  }
  return(count);
}

module.exports.memoryInfo = function(response){
  let check1 = false;
  let check2 = false;
  let DDR4Cnt = 0;
  let MemorySpeed = 0;
  let memorySizeArray = new Array();
  for (var i = 0; i < response.split(os.EOL).length; i++) {
    if (
      response.split(os.EOL)[i].match("Size") == "Size" &&
      response.split(os.EOL)[i].match("Size: No Module Installed") == null &&
      check2 == false
    ) {
      check1 = true;
      let MemorySize = response.split(os.EOL)[i].slice(7, -1);
      memorySizeArray.push(MemorySize);
    } else if (
      response.split(os.EOL)[i].match("Type: DDR4") == "Type: DDR4" &&
      check1 == true &&
      check2 == false
    ) {
      DDR4Cnt++;
      check1 = false;
      check2 = true;
    } else if (
      response.split(os.EOL)[i].match("Configured Clock Speed") ==
      "Configured Clock Speed" &&
      check1 == false &&
      check2 == true &&
      response.split(os.EOL)[i].match("Configured Clock Speed: Unknown") == null
    ) {
      check2 = false;
      MemorySpeed =
      MemorySpeed + Number(response.split(os.EOL)[i].slice(25, 29));
    }
  }
  return({capacity : memorySizeArray, speed : MemorySpeed, count : DDR4Cnt})
}

module.exports.storageInfo = function(response){
  let storageArray = response.split(os.EOL);
  let ssdCnt = 0;
  let hddCnt = 0;
  let nvmeCnt = 0;

  let ssdSize = 0;
  let hddSize = 0;
  let nvmeSize = 0;
  let tmpSize = 0;

  let aJsonArray = new Array();
  for (var i = 0; i < response.split(os.EOL).length; i++) {
    if (response.split(os.EOL)[i].match("disk") == "disk") {
      let lineOfString = response.split(os.EOL)[i];
      var inJson = new Object();
      let wordArray = lineOfString.split(" ");
      inJson.ROTA = getValueFromWord(wordArray[1]);
      inJson.NAME = getValueFromWord(wordArray[3]);
      inJson.SIZE = unifyStorageSizeUnit(
        getValueFromWord(wordArray[4])
      ).toString();
      aJsonArray.push(inJson);
    }
  }
  for (var i = 0; i < aJsonArray.length; i++) {
    if (aJsonArray[i].NAME.match("nvme") == "nvme") {
      nvmeCnt++;
      nvmeSize += parseFloat(aJsonArray[i].SIZE);
    } else if (
      inJson.ROTA == "1" &&
      !(aJsonArray[i].NAME.match("nvme") == "nvme")
    ) {
      hddCnt++;
      hddSize += parseFloat(aJsonArray[i].SIZE);
    } else if (
      inJson.ROTA == "0" &&
      !(aJsonArray[i].NAME.match("nvme") == "nvme")
    ) {
      ssdCnt++;
      ssdSize += parseFloat(aJsonArray[i].SIZE);
    }
  }
  return({ssdcount : ssdCnt, hddcount : hddCnt, nvmecount : nvmeCnt, ssdCapacity : ssdSize, hddCapacity : hddSize, nvmeCapacity : nvmeSize});
}

module.exports.GPSInfo = async function() {
  let global_ip = await public_ip.v4();
    await iplocation(global_ip, [], async (error, res) => {
    let latitude = res.latitude;
    let longitude = res.longitude;
    let change_latitude1 = Math.floor(latitude);
    let change_latitude2 = Math.floor((latitude - change_latitude1)*100);
    let change_longitude1 = Math.floor(longitude);
    let change_longitude2 = Math.floor((longitude - change_longitude1) * 100);
    let p2paddr = "0x" + change_latitude1.toString(16) + change_latitude2.toString(16) + change_longitude1.toString(16) + change_longitude2.toString(16);
    let ret = ({result : res, P2PAddr : p2paddr});
  });
  return ret
}




























