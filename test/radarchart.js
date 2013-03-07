
var expect = require('chai').expect;
var RadarGraph = require('../public/js/radargraph');

describe('Testing RadarChart Object', function () {
    describe('bootstrapping', function () {
        it('should be true', function () {
            var res = true;
            expect(res).to.be.true;
        });
    });

    describe('object initialization', function () {
        var rg;
        try {
            rg = new RadarGraph();
        } catch (err) {
            it('expect TypeError with empty undefined params', function () {
                expect(err).to.be.an.instanceof(TypeError);
            });
            it('expect error message missing arguments object', function () {
                expect(err.message).to.match(/an arguments object must be/);
            });
        }
        try {
            rg = new RadarGraph({});
        } catch (err) {
            it('expect TypeError when empty params object', function () {
                expect(err).to.be.an.instanceof(TypeError);
            });
            it('expect error message title', function () {
                expect(err.message).to.match(/title must be set/);
            });
        }

        rg = new RadarGraph({
            title: 'Test Graph'
        });

        it('expect correct object with title', function () {
            expect(rg).to.be.an.instanceof(RadarGraph);
        });

        it('verify test function', function () {
            expect(rg.test()).to.be.true;
        });
    });

    describe('RadarGraph functions', function () {
        var rg = new RadarGraph({
            title: 'Test Chart'
        });

        it('expect labels string', function () {
            var str = rg.getLabelsString();
            expect(str).to.be.a('string');
            expect(str).to.match(/^chxl.*QA/);
        });

        it('expect getUrl to die without a dataset', function () {
            var url;
            try {
                url = rg.getUrl();
            } catch (err) {
                expect(err.message).to.match(/you must add.*dataset/);
            }
            expect(url).to.be.undefined;
        });

        it('expect addDataset with wrong length to die', function () {
            var self;
            try {
                self = rg.addDataset([1,3,3]);
            } catch (err) {
                expect(err.message).to.match(/Length of set must match/);
            }
            expect(self).to.be.undefined;
        });

        it('expect addDataset to return self', function () {
            var self = rg.addDataset([1,2,3,4,5,6,5,4,3]);
            expect(self).to.be.instanceof(RadarGraph);
        });
        it('expect length of datasets to be 1 after add', function () {
            expect(rg.datasets.length).to.equal(1);
        });

        it('expect datasetString to return correct', function () {
            expect(rg.getDatasetsString()).to.equal('chd=t:1,2,3,4,5,6,5,4,3,1');
        });

        it('expect geturl to return correct url', function () {
            var url = rg.getUrl();
            expect(url).to.be.a('string');
            expect(url).to.match(/chart.googleapis.com/);
            console.log(url);
        });

    });
});