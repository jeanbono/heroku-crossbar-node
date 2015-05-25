var autobahn = require('autobahn');

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
    }
);

connection.onopen = function (session) {

    // SUBSCRIBE to a topic and receive events
    //
    function onhello(args) {
        var msg = args[0];
        console.log("event for 'onhello' received: " + msg);
    }

    session.subscribe('com.example.onhello', onhello).then(
        function (sub) {
            console.log("subscribed to topic 'onhello'");
        },
        function (err) {
            console.log("failed to subscribed: " + err);
        }
    );


    // REGISTER a procedure for remote calling
    //
    function add2(args) {
        var x = args[0];
        var y = args[1];
        console.log("add2() called with " + x + " and " + y);
        return x + y;
    }

    session.register('com.example.add2', add2).then(
        function (reg) {
            console.log("procedure add2() registered");
        },
        function (err) {
            console.log("failed to register procedure: " + err);
        }
    );


    // PUBLISH and CALL every second .. forever
    //
    var counter = 0;
    setInterval(function () {

        // PUBLISH an event
        //
        session.publish('com.example.oncounter', [counter]);
        console.log("published to 'oncounter' with counter " + counter);

        // CALL a remote procedure
        //
        session.call('com.example.mul2', [counter, 3]).then(
            function (res) {
                console.log("mul2() called with result: " + res);
            },
            function (err) {
                if (err.error !== 'wamp.error.no_such_procedure') {
                    console.log('call of mul2() failed: ' + err);
                }
            }
        );

        counter += 1;
    }, 1000);
};

connection.open();
