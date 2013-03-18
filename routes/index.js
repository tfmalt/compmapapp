var u    = require('underscore');
// var jira = require('jira-api');

exports.index = function (req, res) {
    console.log("dumping user to test; ", req.user);
    var data = {
        user: req.user
    };

    res.render('index', data);
};

exports.login = function (req, res) {
    //res.send("hello login");
    var flash = req.flash();
    console.log("req flash: ", flash);

    var data = {
        user: { displayName: "" }
    };
    if (u.isArray(flash.error)) {
        data.errormsg = flash.error[0];
    }

    console.log("data: ", data);
    res.render('login', data);
};
