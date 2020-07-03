var messages = document.getElementById("messages");
var input = document.getElementById("input");
var usernameInput = document.getElementById("usernameInput");
var adminDiv = document.getElementById("admin");
var sendMsgBtn = document.getElementById("sendMsgBtn");

var isAdmin = false;

var ranNum = 0;

usernameInput.value = localStorage.getItem('username');

var url = "";

if (new URL(document.URL).hostname == "localhost") {
    url = `ws://${(new URL(document.URL).host)}`
} else {
    url = `wss://${(new URL(document.URL).host)}`
}

var ws = new WebSocket(`${url}/ws`);

ws.onopen = () => {
    console.log('connected');
};

ws.onmessage = async function (event) {
    var message = event.data;

    var scrolled = (messages.scrollHeight - messages.scrollTop) - 25 <= messages.getBoundingClientRect()
        .height;

    if (message.slice(0, 5) == "msgs:") {
        var arr = message.slice(5).split(",");

        for (i in arr) {
            var elem = document.createElement("p");
            //elem.style.whiteSpace = "pre-line"
            elem.innerHTML = arr[i];
            try {
                var cIdTxt = elem.getElementsByTagName("b")[0].id
                //var cIds = cIdTxt.split(" ")//[0].toString();
                //var cId = cIds[0] //[0].toString();
                elem.getElementsByTagName("b")[0].id = "";
                elem.id = cIdTxt;
                //console.log([cIdTxt, elem.id])
                elem.addEventListener("mouseover", function () {
                    showUserOptions(this);
                })
                elem.addEventListener("mouseleave", function () {
                    closeUserOptions(this);
                })

                addMsgOptions(elem);
            } catch {

            }
            messages.appendChild(elem);
        }
    } else if (message.slice(0, 4) == "msg:") {
        var elem = document.createElement("p");
        //elem.style.whiteSpace = "pre-line"
        elem.innerHTML = message.slice(4);
        try {
            //var cId = elem.getElementsByTagName("b")[0].id.toString();
            var cIdTxt = elem.getElementsByTagName("b")[0].id
            elem.getElementsByTagName("b")[0].id = "";
            elem.id = cIdTxt;
            elem.addEventListener("mouseenter", function () {
                showUserOptions(this);
            })
            elem.addEventListener("mouseleave", function () {
                closeUserOptions(this);
            })

            addMsgOptions(elem);
        } catch (err) {
            //console.log(err)
        }
        messages.appendChild(elem);
    } else if (message.slice(0, 6) == "clear:") {
        messages.innerHTML = "<p>Chat Cleared by <b>" + message.slice(6) + "</b> at " + (new Date)
            .toLocaleString() + "</p>"
    } else if (message === "isAdmin") {
        isAdmin = true
        admin.style.display = "";
        document.getElementById("adminBtn").style.display = "none";

        var admCmds = document.getElementsByClassName("adminCmds");
        for (i = 0; i < admCmds.length; i++) {
            //console.log([admCmds[i], i, admCmds])
            admCmds[i].style.display = "initial"
        }
    } else if (message === "notAdmin") {
        alert("Incorrect Password!")
    } else if (message.slice(0, 5) == "kick:") {
        alert(message.slice(5))
        document.getElementById("sendMsgHolder").style.cursor = "not-allowed"
        document.getElementById("signedOutTxt").style.display = "inline";
        document.getElementById("messageHolder").style.display = "none";

    }

    if (scrolled) {
        messages.scroll(0, messages.scrollHeight)
    }
};

function sendMessage(message) {
    if (message.split(" ").join("").split("\n").join !== "") {
        ws.send("sendmsg," + message);
        input.value = ""
    }
}

function setUsername(username) {
    localStorage.setItem('username', username);
    ws.send("username," + username);
    document.getElementById("messageHolder").style.display = "initial";
    document.getElementById("signInHolder").innerHTML = `<p>Signed in as <b>${username}</b><i id="signedOutTxt" style="display:none"> (Kicked)</i></p>`;
    ws.send("getmsgs,");
}

function clearChat() {
    ws.send("clear");
}

function setAdmin(password) {
    ws.send("setAdmin," + password)
}

function showUserOptions(elem) {
    elem.style.backgroundColor = "rgba(0, 0, 0, 0.09)"
    document.getElementById(elem.id + "options").style.display = "initial"
}

function closeUserOptions(elem) {
    elem.style.backgroundColor = ""
    document.getElementById(elem.id + "options").style.display = "none"
}

function copyStr(str, elId) {
    var elem = document.createElement("textarea");
    elem.value = str;
    document.body.appendChild(elem);
    elem.select();
    elem.setSelectionRange(0, 99999);
    document.execCommand("copy");
    elem.remove()

    elem2 = document.getElementById(elId)

    if (elem2 !== undefined || elem2 !== null) {
        var oldMsg = elem2.innerText.toString()
        elem2.innerText = 'Copied';
        setTimeout(function () {
            elem2.innerText = oldMsg;
        }, 1000);
    }
}

function addMsgOptions(elem) {
    var cId = elem.id.split(" ")[0] //[0]
    var options = document.createElement("div");
    options.id = elem.id + "options"
    options.innerHTML = `

<button id="copyUserId${elem.id} ${/*ranNum.toString()*/""}" onclick="copyStr(${cId}, '${this.id}');">Copy User ID</button>

                        `
    options.innerHTML += `
                
<div style="display: none" id="${"admCmds" + elem.id}" class="adminCmds"><button onclick="kickUser(${cId}, prompt('Kick Reason'));">Kick User</button></div>
                
                `
    if (isAdmin) {
        setTimeout(() => {
            try {
                document.getElementById("admCmds" + elem.id).style.display = "initial";
            } catch (err) {
                console.log(err)
            }
        }, 1);
    }
    //ranNum++;
    options.style.display = "none";
    elem.appendChild(options)
}

function kickUser(userId, reason) {
    ws.send("kick," + userId + "," + reason)
}

function enterCheck() {
    if (event.key === "Enter" && event.shiftKey === false) {
        sendMsgBtn.click();
    }
}