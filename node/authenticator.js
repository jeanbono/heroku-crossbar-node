var autobahn = require('autobahn');


// A poor man's user database.
//
var USERDB = {
    // A user with an unsalted password
    'backend1': {
        'secret': 'secret123',
        'role': 'anonymous'
    },
    // A user with a salted password
    'authenticator1': {
        'secret': 'secret123',
        'role': 'anonymous'
    }
};


// This is our custom authenticator procedure that we register
// under URI "com.example.authenticate", and that will be called
// by Crossbar.io to authenticate other WAMP session (e.g. browser frontends)
//
function authenticate (args) {
    var realm = args[0];
    var authid = args[1];
    var details = args[2];

    console.log("authenticate called:", realm, authid, details);

    if (USERDB[authid] !== undefined) {
        return USERDB[authid];
    } else {
        throw "no such user";
    }
}


// This challenge callback will authenticate our custom authenticator above _itself_
//
function onchallenge (session, method, extra) {

    console.log("onchallenge", method, extra);

    if (method === "wampcra") {

        console.log("authenticating via '" + method + "' and challenge '" + extra.challenge + "'");

        return autobahn.auth_cra.sign(process.argv[5], extra.challenge);

    } else {
        throw "don't know how to authenticate using '" + method + "'";
    }
}


var connection = new autobahn.Connection({
    url: process.argv[2],
    realm: process.argv[3],

    // The following authentication information is for authenticating the
    // custom authenticator component _itself_
    //
    authid: process.argv[4],
    authmethods: ["wampcra"],
    onchallenge: onchallenge
});


connection.onopen = function (session) {

    console.log("custom authenticator connected");
    session.register('com.example.authenticate', authenticate).then(
        function () {
            console.log("Ok, custom WAMP-CRA authenticator procedure registered");
        },
        function (err) {
            console.log("Uups, could not register custom WAMP-CRA authenticator", err);
        }
    );
};


connection.onclose = function (reason, details) {
    console.log("Connection lost:", reason, details);
}


connection.open();