/**
 * Object Literal controller for the competency map web app
 */
var app = {
    key:    "0Ar3jAHeUoighdDY1OGd0TGJjaFFHdDR5REl4aHRBbEE",
    people: undefined,
    
    EventManager: $({}),

    init: function () {
        console.log("Doing app init", this);

        this.EventManager.on("gotdata",                app.parseSpreadsheet);
        this.EventManager.on("parsedataDone",          app.generateGraphs);
        this.EventManager.on("profile-drag-start",     app.handleProfileDragStart);
        this.EventManager.on("profile-drag-stop",      app.handleProfileDragStop);
        this.EventManager.on("profile-drop-activated", app.handleDropActivated);
        this.EventManager.on("profile-drop-dropped",   app.handleProfileDropped);
        this.EventManager.on("profile-drop-over",      app.handleProfileDropOver);
        this.EventManager.on("profile-drop-out",       app.handleProfileDropOut);

        $('.title-box span').on('click', app.toggleImagebox);

        this.getData();
    },

    setupMenubar: function () {
        var structure = {
            'Home': 'index.html',
            'the Form': 'theform.html',
            'the Report': 'thereport.html'
        };

        var bar   = $('.compmap-navbar ul.nav');
        var active = $(location).attr("pathname").split("/").pop();
        _.each(structure, function(value, key) {
            var item = $('<li><a href="' + value + '">' + key + '</a></li>');

            if (value === active) {
                item.addClass("active");
            }

            bar.append(item);
        });
    },

    getData: function () {
        var url = this._getDocUri();
        $.get(url, function (data) {
            // console.log("got data with jquery get: ");
            //app.data = data;
            app.EventManager.trigger("gotdata", data);
        });
    },

    parseSpreadsheet: function (event, data) {
        // console.log("gotdata handle spreadsheet: ", this);
        // console.log("extra debug: ", data);

        var cells = data.feed.entry;
        var rows  = app._getRows(cells);
        var map   = app._buildMap(rows);

        app.people = map;

        app.EventManager.trigger("parsedataDone", map);        
    },
    generateGraphs: function (event, data) {
        console.log("generate graphs call: ", data);
        var everyone = $('#everyone'); 

        _.each(data, function(object, name) {
            var rg = new RadarGraph({title: name});
            rg.addDataset(_.pluck(object, 'Experience'));
            rg.addDataset(_.pluck(object, 'Knowledge'));
            rg.addDataset(_.pluck(object, 'Motivation'));

            var url = rg.getUrl();
            var img = $('<img src="' + url + '" id="' + name + '">')
                .addClass('compmap-img');
            everyone.append(img);
        });

        $('#everyone img').draggable({
            containment     : 'document',
            appendTo: 'body',
            // scroll: false,
            helper: 'clone',
            start: function (e, ui) {
                app.EventManager.trigger("profile-drag-start", {
                    ui: ui, 
                    el: $(this)
                });
            },
            stop: function (e, ui) {
                app.EventManager.trigger("profile-drag-stop", {
                    ui: ui,
                    el: $(this)
                });
            }
        });

        $('.imagebox .new-team-box .drag-here-placeholder').droppable({
            accept:      ".compmap-img",
            activeClass: "ui-state-highlight",
            hoverClass:  "drop-hover",
            activate: function (e, ui) {
                app.EventManager.trigger("profile-drop-activated", {
                    ui: ui,
                    el: $(this)
                });
            },
            drop: function (e, ui) {
                app.EventManager.trigger("profile-drop-dropped", {
                    ui: ui,
                    data: data
                });
            },
            over: function (e, ui) {
                app.EventManager.trigger("profile-drop-over", {
                    ui: ui,
                    el: $(this)
                });
            },
            out: function (e, ui) {
                app.EventManager.trigger("profile-drop-out", {
                    ui: ui,
                    el: $(this)
                });
            }
        });
    },

    handleDropActivated: function (event, args) {
        console.log("got drop activated: ", event, "args:", args);
    },

    handleProfileDropped: function (event, args) {
        console.log("got profile dropped: ", event, "args:", args);
        var img  = args.ui.helper.context;
        var data = args.data;
        var name = img.id;
        var set  = _.pluck(args.data[img.id], 'Experience'); 
        var rg = new RadarGraph({title: "Team Name"});

        rg.addDataset(set);
        var url = rg.getUrl();

        console.log("image debug: ", data, name, url);
        var img = $('<img src="' + url + '" id="' + "teamname" + '">')
                .addClass('compmap-img compmap-img-team');

        $('.team-boxes .new-team-box').prepend(img);
    },

    handleProfileDropOver: function (event, args) {
        console.log("got profile drop over: ", event, "args:", args);
    },

    handleProfileDropOut: function (event, args) {
        console.log("got profile drop out: ", event, "args:", args);
    },

    handleProfileDragStart: function (event, data) {
        console.log("got drag start ", event, "data: ", data);
        data.el.addClass('ui-draggable-original');
    },

    handleProfileDragStop: function (event, args) {
        console.log("got drag stop ", event, "args: ", args);
        args.el.removeClass('ui-draggable-original');
    },

    toggleImagebox: function (event) {
        var element_id = $(this).data('target');
        console.log("toggleImagebox: ", event, "target: ", element_id);

        if ($(this).text() === "Show") {
            $(element_id).collapse('show');
            $(this).text("Hide");
        } else if ($(this).text() === "Hide") {
            $(element_id).collapse('hide');
            $(this).text("Show");
        }
    },

    _getRows: function (cells) {
        var matrix = [];

        _.each(cells, function(obj) {
            var res   = obj.id.$t.match(/R(\d+)C(\d+)$/);
            var value = obj.content.$t;
            var match = value.match(/^(\d):/);

            if (match) value = match[1];    
            if (matrix === undefined) matrix = [];
            if (matrix[res[1]] === undefined) matrix[res[1]] = [];

            matrix[res[1]][res[2]] = value;

        }, matrix); 

        return matrix;       
    },

    _getCategories: function (row) {
        var cats = {};
        _.each(row, function(value, key) {
            if (key < 3) return;

            var match = value.match(/^(.*) \[(.*)\]/);
            cats[key] = [match[1], match[2]];
        }, cats);

        return cats;
    },

    _buildMap: function (rows) {
        var map  = {};
        var cats = app._getCategories(rows[1]);

        _.each(rows, function (row, id) {
            if (id === 1) return;
            map[row[2]] = app._parseRow(row, cats);
        }, map);

        return map;
    },

    _parseRow: function (row, cats) {
        var parsed = {};
        
        _.each(row, function (value, id) {
            if (id < 3) return;
            if (parsed[cats[id][0]] === undefined) parsed[cats[id][0]] = {};

            parsed[cats[id][0]][cats[id][1]] = value;
        }, parsed);

        return parsed;
    },

    _getDocUri: function () {
        var url = "https://spreadsheets.google.com/feeds/cells/"
        + this.key 
        + "/od6/public/basic?alt=json";
        return url;
    }

};