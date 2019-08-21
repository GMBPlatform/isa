module.exports.ConsoleOption = {
  format: [
    "[{{title}}] [{{timestamp}}] [in {{file}}:{{line}}] {{message}}", //default format
    {
      log: "[{{title}}]   [{{timestamp}}] [in {{file}}:{{line}}] {{message}}",
      debug: "[{{title}}] [{{timestamp}}] [in {{file}}:{{line}}] {{message}}",
      info: "[{{title}}]  [{{timestamp}}] [in {{file}}:{{line}}] {{message}}",
      warn: "[{{title}}]  [{{timestamp}}] [in {{file}}:{{line}}] {{message}}",
      error: "[{{title}}] [{{timestamp}}] [in {{file}}:{{line}}] {{message}}" // error format
    }
  ],
  dateformat: "yyyy.mm.dd HH:MM:ss.L",
  preprocess: function (data) {
    data.title = data.title.toUpperCase();
  }
};

module.exports.scaPort = process.env.SCA2CLI_Port1;

module.exports.ISconnection = {
  port : parseInt(process.env.ISA2IS_Cli),
  host : process.env.ISServer
}

module.exports.instruction = {
  updateRRList : '00',
  startBlockGen : '21'
}

module.exports.path = {
  rr_net : "../NNA/conf/rr_net.json",
  rr_subnet : "../NNA/conf/rr_subnet.json",
  nn_node : "../NNA/conf/node.json",
  cn_node : "../CN/conf/node.json"
}
