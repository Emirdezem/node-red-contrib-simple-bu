const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = function(RED) {
    function SimpleBu(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        
        this.on('input', function(msg) {
            // Configuration from GUI
            const url = config.url;
            const sn = config.sn;
            const type = config.type;
            
            // Buffer data
            var simpleBU = '';
            var now = Math.round(Date.now()/1000).toString();
            
            for (let i in msg.payload) {
                let object = msg.payload[i];
                simpleBU += msg.names[i] + ',' + (Math.round(object.value * 100000) / 100000).toString() + ',' + now + '\r\n'; //.toFixed(5)
            }

            // Setting Headers
            if (type !== undefined ){
                let headers = {
                    "Content-Type": "text/csv; charset=utf-8; header-absent",
                    "User-Agent":`TYPE:${type} SN:${sn}`
                }
                msg.headers = headers;
            }
            
            // HTTP Request
            axios.post(url, simpleBU, {
                headers: msg.headers,
                timeout: 5000  // Timeout for HTTP Request
            }).then((response) => {
                if (response.status === 200) {
                    node.send(msg);
                } else {
                    fs.writeFile(path.resolve(__dirname, 'buffer.txt'), simpleBU, function(err) {
                        if(err) {
                            return node.error("Error writing to buffer file: " + err);
                        }
                        node.send(msg);
                    });
                }
            }).catch((error) => {
                fs.writeFile(path.resolve(__dirname, 'buffer.txt'), simpleBU, function(err) {
                    if(err) {
                        return node.error("Error writing to buffer file: " + err);
                    }
                    node.send(msg);
                });
            });
        });
    }
    RED.nodes.registerType("simple-bu",SimpleBuNode);
}

