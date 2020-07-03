var express = require("express")
var SocketServer = require("ws").Server

var password = process.env.CHATPASSWORD

try {
    password = require("./chatpassword.js")
} catch (err) {
    password = process.env.CHATPASSWORD
}

const app = express();
const port = process.env.PORT || 8881;

app.use(express.static("site"));

app.get('/*', (req, res) => {
    res.sendFile("index.html", {
        root: __dirname
    })
})

var ccId = "";

var server = app.listen(port);

var wss = new SocketServer({
    server
});

var messages = [];
var clientIds = [];

wss.on("connection", (ws) => {
    ws.msgCount1 = 0;
    ws.msgCount5 = 0;

    ws.isAdmin = false;

    ws.lastTimeSent = (new Date)

    //console.log(ws)

    console.log("[Server] A client was connected.")

    ws.clientName = "client"
    ws.hasLoggedIn = false;

    var id;
    for (b = false; b === false;) {
        id = getRandomInt(10000);
        if (clientIds.includes(id) === false) {
            b = true;
        }
    }
    ws.clientId = id;
    clientIds.push(id);
    //console.log(clientIds)

    ws.on("close", () => {
        clientIds.splice(clientIds.indexOf(ws.clientId), 1)
        console.log(`[Server] ${ws.clientName} disconnected.`);
        //console.log(clientIds)
    })

    ws.on("message", (message) => {

        if (message.length > 249) {
            autoModKick(ws, false, "sending too big of a message.")
        }

        if (ws.lastTimeSent.toLocaleString() == (new Date).toLocaleString()) {
            ws.msgCount1++;
        } else {
            ws.msgCount1 = 0;
        }

        /*if ((ws.lastTimeSent.getTime() - (new Date).getTime()) <= 5000) {
            ws.msgCount5++;
        } else {
            ws.msgCount5 = 0;
        }

        if (ws.msgCount5 >= 12) {
            autoModKick(ws)
        }*/

        if (ws.msgCount1 >= 4) {
            autoModKick(ws, false, "SENDING MESSAGES TO FAST!")
        }

        //console.log(ws.msgCount1, ws.msgCount5)

        ws.lastTimeSent = (new Date)

        message = message.split(">").join("&gt;").split("<").join("&lt;")

        if (message.split(",")[0] === "username") {
            var components = message.split(',');

            ws.clientName = [components.shift(), components.join(',')][1]; //message.split(",")[1];
            ws.hasLoggedIn = true

            console.log(`[Server] New user! ${ws.clientName}`)
        } else if (message.split(",")[0] === "getmsgs") {
            console.log(`[Server] ${ws.clientName} requested for message history`, messages)
            ws.send("msgs:" + messages.toString())
        } else if (message.split(",")[0] === "sendmsg") {

            var components = message.split(',');

            var newMsg = [components.shift(), components.join(',')][1] //message.split(",")[1]

            console.log(`[Server] Received message from ${ws.clientName}: %s`, newMsg)

            newMsg = newMsg.split(">").join("&gt;").split("<").join("&lt;").split("\\n").join("<br>")

            /*var cName = "";
            var close = "<br>"
            if (ws.clientId !== ccId) {
                cName = "<p>" + ws.clientName + ": "// ":<br>";
                //close = "<br><br>"
            }*/

            var cName = ws.clientName + ": "

            //console.log([ws.clientId, ccId, cName, ws.clientName])

            ccId = parseInt(ws.clientId.toString());

            var msgText = `<b id="${ws.clientId} ${getRandomInt(1000000)}">${cName}</b>${newMsg}`;

            wss.broadcast("msg:" + msgText)
            //ws.send("msg:" + msgText)
            messages.push(msgText)

        } else if (message.split(",")[0] === "setAdmin") {
            if (message.split(",")[1] === password) {
                ws.isAdmin = true;
                ws.send("isAdmin");
            } else {
                ws.send("notAdmin");
            }
        } else if (message === "clear" && ws.isAdmin /*message.split(",")[0] === "clear" && message.split(",")[1] === password*/ ) {
            messages = []

            console.log(`[Server] ${ws.clientName} cleared the chat at ${(new Date).toLocaleString()}`)

            wss.broadcast("clear:" + ws.clientName)
        } else if (message.split(",")[0] === "kick" && ws.isAdmin) {
            var cId = parseInt(message.split(",")[1]);

            kickReason = message.replace("kick," + cId + ",", "")

            wss.getClientById(cId, function (client) {
                client.send(`kick:You have been kicked from the chat by ${ws.clientName}.\nReason: ${kickReason}`);
                console.log(`[Server] ${ws.clientName} kicked ${client.clientName} at ${(new Date).toLocaleString()}`)
                client.close();
            })
        }
    })
})

wss.broadcast = function broadcast(msg) {
    wss.clients.forEach(function each(client) {
        if (client.hasLoggedIn) {
            client.send(msg);
        }
    });
};

wss.getClientById = function getClientById(id, callback = () => {}) {
    wss.clients.forEach(function each(client) {
        if (client.clientId === id) {
            callback(client)
        };
    });
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function autoModKick(ws, kickMod, reason) {
    if (kickMod || ws.isAdmin === false) {
        ws.send(`kick:Auto Mod: You have been kicked from the chat, ${ws.clientName}.\nReason: ${reason}`);
        console.log(`[Server] Auto Mod kicked ${ws.clientName} at ${(new Date).toLocaleString()} for ${reason}`)
        ws.close();
    }
}