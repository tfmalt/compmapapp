/**
 * Object Literal controller for the competency map web app
 */
var app = {
    key:    "0Ar3jAHeUoighdDY1OGd0TGJjaFFHdDR5REl4aHRBbEE",
    people: undefined,
    graphsize: { 
        image: { width: '222px', height: '222px' },
        box:   { 'max-width': '238px'}
    },
    teams:  {},

    EventManager: $({}),

    init: function () {
        console.log("Doing app init", this);

        this.EventManager.on("gotdata",                this.parseSpreadsheet);
        this.EventManager.on("parsedataDone",          this.generateGraphs);
        this.EventManager.on("profile-drag-start",     this.handleProfileDragStart);
        this.EventManager.on("profile-drag-stop",      this.handleProfileDragStop);
        this.EventManager.on("profile-drop-activated", this.handleDropActivated);
        this.EventManager.on("profile-drop-dropped",   this.handleProfileDropped);
        this.EventManager.on("profile-drop-over",      this.handleProfileDropOver);
        this.EventManager.on("profile-drop-out",       this.handleProfileDropOut);
        this.EventManager.on("title-change-done",      this.handleTitleChange);

        $('.title-box span').on('click',      app.toggleImagebox);
        $('.team-box-title span').on('click', app.handleTitleClick);
        $('.team-box-title #resize').on('click', this.handleBoxResize);
    },

    handleBoxResize: function (event) {
        console.log("got resize: ", event);
        var $box = $(event.currentTarget).parents('.team-box');
        var big   = { 
            image: { 
                width:  '512px',
                height: '512px'
            },
            box: {
                'max-width': '528px'
            }
        };
        var small = {
            image: {
                width: '222px',
                height: '222px'
            },
            box: {
                'max-width': '238px'
            }
        };

        var size = $box.width() < 400 ? big : small;
        app.graphsize = size;
        console.log("what is box: ", $box.width(), $box);

        $box.css(size.box);
        $box.find('.drag-here-placeholder').css(size.image);
        $box.find('.team-graph-box img').css(size.image);
    },

    handleTitleClick: function (event) {
        console.log("Title got clicked: ", event);

        var $title  = $(event.currentTarget.parentElement);
        var $target = $(event.currentTarget);

        var text = $target.text();

        var $input = $('<input type="text" value="' + text + '">')
            .on('keyup', function (event) {
                if (event.keyCode == 13) {
                    app.EventManager.trigger('title-change-done', event.currentTarget);
                }
            });

        $target.remove();
        $title.append($input);
    },

    handleTitleChange: function (event, target) {
        console.log("got title change: ", event, target.value);
        var text   = target.value;
        var $title = $(target.parentElement);
        var $box   = $(target.parentElement.parentElement);

        var oldid = $box.attr('id');
        var id    = text.toLowerCase().replace(" ", "-");
        var span  = $('<span>' + text + '</span>').append('<i class="icon-pencil"></i>');
        
        app.teams[id] = app.teams[oldid];
        
        $(target).remove();
        $title.append(span);
        $box.attr('id', id);
        span.on('click', app.handleTitleClick);
    },

    setupMenubar: function () {
        var structure = {
            'Home': '/',
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

        // Setup droppable area
        $('.team-box .drag-here-placeholder').droppable({
            accept:      ".compmap-img",
            activeClass: "ui-drop-highlight",
            hoverClass:  "ui-drop-hover",
            drop: function (e, ui) {
                app.EventManager.trigger("profile-drop-dropped", {
                    ui:     ui,
                    target: $(this),
                    data:   data
                });
            }
        });
    },

    handleDropActivated: function (event, args) {
        console.log("got drop activated: ", event, "args:", args);
    },

    /**
     * Event handler for when a profile graph is dropped on a target
     * able to deal with it
     */
    handleProfileDropped: function (event, args) {
        console.log("got profile dropped: ", event, "args:", args);

        var who    = args.ui.helper.context.id;
        var target = args.target;
        var $box   = target.parents('.team-box');
        var name   = $box.attr('id');
        var $icon  = $(args.ui.helper.context).clone().attr('id', name+'-clone').removeClass();
        // No graph object already in teams: this is a new graph and
        // must be dealt with.
        
        if (typeof app.teams[name] === 'undefined') {
            app.teams[name] = new RadarGraph({
                title: "",
                colors: ['FF9900']
            });
        }

        target.remove();
        
        // $('.team-boxes .new-team-box .compmap-img-team').remove();

        var set = _.pluck(args.data[who], 'Experience');
        var url = app.teams[name].addDataset(set).addColors('FF9900').getUrl();

        var img = $('<img id="' + name + '">');
        img.attr('src', url);

        img.droppable({
            accept: '.compmap-img',
            activeClass: 'ui-state-highlight',
            hoverClass: 'ui-drop-hover',
            drop: function (e, ui) {
                app.EventManager.trigger("profile-drop-dropped", {
                    ui: ui,
                    target: $(this),
                    data: args.data
                });
            }
        });

        img.css(app.graphsize.image);
        $box.css(app.graphsize.box);
        // thumb.css({ width: '100px', height: '100px' });
        $box.find('.team-graph-box').append(img);
        $box.find('.team-icon-box').append($icon);
    },

    handleProfileDropOver: function (event, args) {
        console.log("got profile drop over: ", event, "args:", args);
    },

    handleProfileDropOut: function (event, args) {
        console.log("got profile drop out: ", event, "args:", args);
    },

    handleProfileDragStart: function (event, data) {
        data.el.addClass('ui-draggable-original');
    },

    handleProfileDragStop: function (event, args) {
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