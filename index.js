// cd Documents/krunkeringame/socialserver

var express = require("express")
var SocketServer = require("ws").Server

const app = express();
const port = process.env.PORT || 8881;

app.use(express.static("site"));

app.get('/', (req, res) => {
    res.sendFile("index.html", {
        root: __dirname
    })
})

var server = app.listen(port);

var wss = new SocketServer({
    server
});

var messages = []

wss.on("connection", (ws) => {
    console.log("[Server] A client was connected.")

    ws.clientName = "client"
    ws.hasLoggedIn = false;

    ws.on("close", () => console.log(`[Server] ${ws.clientName} disconnected.`))

    ws.on("message", (message) => {

        if (message.split(",")[0] === "username") {
            ws.clientName = message.split(",")[1];
            ws.hasLoggedIn = true

            console.log(`[Server] New user! ${ws.clientName}`)
        } else if (message.split(",")[0] === "getmsgs") {
            console.log(`[Server] ${ws.clientName} requested for message history`, messages)
            ws.send("msgs:" + messages.toString())
        } else if (message.split(",")[0] === "sendmsg") {

            var newMsg = message.split(",")[1]

            console.log(`[Server] Received message from ${ws.clientName}: %s`, newMsg)

            var msgText = `<b>${ws.clientName}</b>: ${newMsg}`;

            wss.broadcast("msg:" + msgText)
            messages.push(msgText)

        } else if (message.split(",")[0] === "clear" && message.split(",")[1] === process.env.PORT) {
            messages = []

            console.log(`[Server] ${ws.clientName} cleared the chat at ${(new Date).toLocaleString()}`)

            wss.broadcast("clear:" + ws.clientName)
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