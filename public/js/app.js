
var app = {
    key:    "0Ar3jAHeUoighdDY1OGd0TGJjaFFHdDR5REl4aHRBbEE",
    people: undefined,
    
    EventManager: $({}),

    init: function () {
        console.log("Doing app init", this);

        this.EventManager.on("gotdata", app.parseSpreadsheet);
        this.EventManager.on("parsedataDone", app.generateGraphs);
        this.EventManager.on("profile-drag-start", app.handleProfileDragStart);
        this.EventManager.on("profile-drag-stop", app.handleProfileDragStop);

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

    getChartUrl: function (name, object) {
        var base_uri = "//chart.googleapis.com/chart?";
        var labels = [
            ["Prod.Mgmt" , "Product Management"],
            ["Agile"     , "Agile Methodologies"],
            ["Analysis"  , "Analysis"],
            ["UX"        , "User Experience"],
            ["Frontend"  , "Frontend Development"],
            ["Backend"   , "Backend Development"],
            ["Operations", "Operations"],
            ["Usability" , "Usability Testing"],
            ["QA"        , "Testing and QA"]
        ];

        var size = {
            x: 546,
            y: 546
        };

        var colors = {
            'everyone': {
                'experience': 'FF9900',
                'knowledge':  '4444FF',
                'motivation': '00AA00'
            }
        };

        var label_text = "chxl=0:";
        var chart_data = "chd=t:";
        var first = object['Product Management'].Experience;
        _.each(labels, function(label) {
            label_text += "|" + label[0];
            chart_data += object[label[1]].Experience + ",";
        });
        chart_data += first;

        var req = {
            title:            "chtt=" + name,
            title_color_size: "chts=888888,15.5",
            labels:           label_text, 
            axes:             "chxr=0,0,6|1,0,6",
            legend_size_color: "chxs=1,00000000,60,0,lt,000000",
            chxt:             "chxt=x,y",
            size:             "chs=" + size.x + "x" + size.y,
            line_type:        "cht=rs",
            line_color:       "chco=" + colors.everyone.motivation,
            data_size:             "chds=0,6",
            data:              chart_data,
            line_size:        "chls=2",
            // chma:             "chma=0,0,0,0",
            area_fill:        "chm=B," + colors.everyone.motivation + "22,0,0,0"
        };

        var url = base_uri + _.values(req).join("&");
        return url;
    },

    generateGraphs: function (event, data) {
        console.log("generate graphs call: ", data);
        var everyone = $('#everyone'); 

        _.each(data, function(object, name) {
            var url = app.getChartUrl(name, object);
            var img = $('<img src="' + url + '" id="' + name + '">')
                .addClass('compmap-img');
            everyone.append(img);
        });

        $('#everyone img').draggable({
            containment     : 'document',
            appendTo: 'body',
            // scroll: false,
            helper: 'clone',
            start: function () {
                app.EventManager.trigger("profile-drag-start", $(this));
            },
            stop: function () {
                app.EventManager.trigger("profile-drag-stop", $(this));
            }
        });
    },

    handleProfileDragStart: function (event, elem) {
        console.log("got drag start ", event, "element: ", elem);
    },

    handleProfileDragStop: function (event, elem) {
        console.log("got drag stop ", event, "element: ", elem);
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