var chai = require('chai');
var stream = require('stream');

var lacona = require('lacona');
var fulltext = require('lacona-util-fulltext');
var Stateful = require('..');

var expect = chai.expect;

function toStream(strings) {
	var newStream = new stream.Readable({objectMode: true});

	strings.forEach(function (string) {
		newStream.push(string);
	});
	newStream.push(null);

	return newStream;
}

function toArray(done) {
	var newStream = new stream.Writable({objectMode: true});
	var list = [];
	newStream.write = function(obj) {
		list.push(obj);
	};

	newStream.end = function() {
		done(list);
	};

	return newStream;
}

describe('lacona-addon-stateful', function () {
	var parser, stateful;

	describe('syncronous parse', function () {
		beforeEach(function () {
			var grammar = {
				phrases: [{
					name: 'test',
					root: 'test'
				}]
			};

			parser = new lacona.Parser({sentences: ['test']}).understand(grammar);
			stateful = new Stateful({serializer: fulltext});
		});

		it('emits insert for first occurrence of data' , function (done) {
			function callback(data) {
				expect(data).to.have.length(1);
				expect(data[0].event).to.equal('insert');
				expect(data[0].data.suggestion.words[0].string).to.equal('test');
				expect(data[0].id).to.equal(0);
				done();
			}

			toStream(['t'])
				.pipe(parser)
				.pipe(stateful)
				.pipe(toArray(callback));
		});

		it('emits an update if the input changes' , function (done) {
			function callback(data) {
				expect(data).to.have.length(2);
				expect(data[0].event).to.equal('insert');
				expect(data[1].event).to.equal('update');
				expect(data[0].data.suggestion.words[0].string).to.equal('test');
				expect(data[1].data.suggestion.words[0].string).to.equal('test');
				expect(data[0].id).to.equal(data[1].id);
				done();
			}

			toStream(['t', 'te'])
				.pipe(parser)
				.pipe(stateful)
				.pipe(toArray(callback));
		});

		it('emits a delete if a valid option goes away' , function (done) {
			function callback(data) {
				expect(data).to.have.length(2);
				expect(data[0].event).to.equal('insert');
				expect(data[1].event).to.equal('delete');
				expect(data[0].data.suggestion.words[0].string).to.equal('test');
				done();
			}

			toStream(['t', 'tx'])
				.pipe(parser)
				.pipe(stateful)
				.pipe(toArray(callback));
		});
	});

	describe('async parse', function () {
		beforeEach(function () {
			var grammar = {
				scope: {
					delay: function (input, data, done) {
						setTimeout(function () {
							data({display: 'test', value: 'test'});
							done();
						}, 0);
					}
				},
				phrases: [{
					name: 'test',
					root: {
						type: 'value',
						compute: 'delay'
					}
				}]
			};

			parser = new lacona.Parser({sentences: ['test']}).understand(grammar);
			stateful = new Stateful({serializer: fulltext});
		});

		it('does not emit anything if the most recent parse has no data', function (done) {
			function callback(data) {
				expect(data).to.have.length(0);
				done();
			}

			toStream(['t', 'tx'])
				.pipe(parser)
				.pipe(stateful)
				.pipe(toArray(callback));
		});

		it('only emits one event for async if the second comes before the first completes', function (done) {
			function callback(data) {
				expect(data).to.have.length(1);
				expect(data[0].event).to.equal('insert');
				expect(data[0].data.suggestion.charactersComplete).to.equal(2);
				done();
			}

			toStream(['t', 'te'])
				.pipe(parser)
				.pipe(stateful)
				.pipe(toArray(callback));
		});
	});

});
