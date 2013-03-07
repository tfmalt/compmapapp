
(function (exports) {

	function RadarGraph() {
		console.log("inside radargraph");
	};

	RadarGraph.prototype.constructor = function () {
		console.log("Constructor got called");
	};

	exports.RadarGraph = RadarGraph;
})(typeof exports === 'undefined' ? this : exports);