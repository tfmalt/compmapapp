/**
 * A wrapper object for radar chart generation. Refactoring to this 
 * Object pattern is still only 70% done so some mess is included.
 * 
 * @author Thomas Malt <thomas@malt.no>
 */
(function () {
    var u;
    if (typeof module === 'object') {
        u = require('underscore');
    } else {
        if (typeof _ === 'undefined') {
            throw new TypeError("RardarGraph depends on underscore please include it");
        }
        u = _;
    } else {
    }

    var RadarGraph = function (args) {
        if (! u.isObject(args)) {
            throw new TypeError("an arguments object must be specified");
        }
        if (! u.isString(args.title)) {
            throw new TypeError("title must be set.");
        }

        this.base_uri = "//chart.googleapis.com/chart?";
        this.labels = [
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
        var defaults = {
            colors: ['FF9900','4444FF','00AA00'],
            size: { x: 546, y: 546 }
        };
        this.options  = args;

        this.title    = this.options.title;
        this.size     = this.options.size ? this.options.size : defaults.size;
        this.datasets = [];
        this.colors   = this.options.colors ? this.options.colors : defaults.colors;
    };

    RadarGraph.prototype.test = function () {
        return true;
    };

    RadarGraph.prototype.getDatasetsString = function () {
        if (! u.isArray(this.datasets)) {
            throw new TypeError('dataset is not an array. WTF.');
        }

        if (this.datasets.length < 1) {
            throw new TypeError('you must add at least one dataset to generate an url');
        }

        var chd = "chd=t:";
        u.each(this.datasets, function(set) {
            chd += set.join(",") + "|";
        });
        chd = chd.replace(/\|$/, "");
        return chd;
    };

    RadarGraph.prototype.getLabelsString = function () {
        var chxl = "chxl=0:";
        u.each(this.labels, function(label) {
            chxl += "|" + label[0];
        });
        return chxl;
    };

    RadarGraph.prototype.getSizeString = function () {
        var chs = "chs=" + this.size.x + "x" + this.size.y;
        return chs;
    };

    RadarGraph.prototype.getLineColorString = function () {
        if (this.colors.length < this.datasets.length) {
            throw new TypeError("number of colors must match number of datasets");
        }
        var chco = "chco=" + this.colors.join(",");
        return chco;
    };

    RadarGraph.prototype.getAreaColorString = function (opacity) {
        if (this.colors.length < this.datasets.length) {
            throw new TypeError("number of colors must match number of datasets");
        }

        var chm = "chm=";

        var counter = 0;
        u.each(this.colors, function (color) {
            var str = "B," + color + opacity + "," + counter +",0,0|";
            chm += str;
            counter += 1;
        });
        return chm.replace(/\|$/, "");
    };

    RadarGraph.prototype.getLineSizeString = function () {
        var chls = "chls=2";
        var counter = 1;
        while (counter < this.datasets.length) {
            chls += "|2";
            counter += 1;
        }
        return chls;
    };

    RadarGraph.prototype.getTitleString = function () {
        if (this.title.length == 0) return "";

        var chtt = "chtt=" + this.title;
        return chtt;
    }; 

    RadarGraph.prototype.getColorSizeString = function () {
        var chts = "chts=888888," + (this.title.length ? "25" : "0");
        return chts;
    };

    RadarGraph.prototype.getUrl = function () {
        var req = {
            title:             this.getTitleString(),
            title_color_size:  this.getColorSizeString(),
            labels:            this.getLabelsString(),
            axes:              "chxr=0,0,6|1,0,6",
            legend_size_color: "chxs=1,00000000,60,0,lt,000000",
            chxt:              "chxt=x,y",
            size:              this.getSizeString(),
            line_type:         "cht=rs",
            line_color:        this.getLineColorString(),
            data_size:         "chds=0,6",
            data:              this.getDatasetsString(),
            line_size:         this.getLineSizeString(),
            area_fill:         this.getAreaColorString(30)
        };

        var url = this.base_uri + u.values(req).join("&");
        return url;
    };

    /**
     * Adds a chart dataset to the list of sets to render
     * See google image chart API doc to understand what's going on.
     *
     * Returns self to enable chaining.
     *
     * @return this
     */
    RadarGraph.prototype.addDataset = function (set) {
        // do sanity checking.
        if(! u.isArray(set)) {
            throw new TypeError("Set must be an array");
        }

        if( set.length != (this.labels.length) ) {
            throw new TypeError("Length of set must match number of labels");
        }

        // Append first element last to make the circle add up.
        set.push(set[0]);
        this.datasets.push(set);
        return this;
    };

    RadarGraph.prototype.setColors = function (colors) {
        if (u.isString(colors)) {
            colors = [colors];
        }
        if (! u.isArray(colors)) {
            throw new TypeError('Input to function must be color string or array of color strings');
        }

        this.colors = colors;
        return this;
    };

    RadarGraph.prototype.addColors = function (colors) {
        if (u.isString(colors)) {
            colors = [colors];
        }
        if (! u.isArray(colors)) {
            throw new TypeError('Input to function must be color string or array of color strings');
        }

        this.colors = this.colors.concat(colors);
        return this;
    };

    // Make this both usable in a web browser and in node.
    if (typeof module === 'undefined') {
        this['RadarGraph'] = RadarGraph;
    } else {
        module.exports = RadarGraph;
    }

})();
