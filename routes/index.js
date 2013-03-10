

exports.index = function (req, res) {
    res.send("hello index");
    console.log("dumping req to test; ", req);
};

exports.login = function (req, res) {
    //res.send("hello login");
    console.log("req flash: ", req.flash());
    res.render('login', {});
};
