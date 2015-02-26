var chai = require('chai');
var stream = require('stream');

var lacona = require('lacona');
var phrase = require('lacona-phrase');
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
			var Test = phrase.createPhrase({
				describe: function () {
					return phrase.literal({text: 'test'});
				}
			});

			parser = new lacona.Parser();
			parser.sentences = [phrase.createElement(Test)];
			stateful = new Stateful({serializer: fulltext.all});
		});

		it('emits insert for first occurrence of data' , function (done) {
			function callback(data) {
				expect(data).to.have.length(1);

				expect(data[0].event).to.equal('insert');
				expect(fulltext.suggestion(data[0].data)).to.equal('test');

				done();
			}

			toStream(['t'])
				.pipe(parser)
				.pipe(stateful)
				.pipe(toArray(callback));
		});

		it('emits an update if the input changes' , function (done) {
			function callback(data) {
				expect(data).to.have.length(3);

				expect(data[0].event).to.equal('insert');
				expect(fulltext.all(data[0].data)).to.equal('test');

				expect(data[1].event).to.equal('delete');
				expect(data[1].id).to.equal(data[0].id);

				expect(data[2].event).to.equal('insert');
				expect(fulltext.all(data[2].data)).to.equal('test');
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
				expect(fulltext.all(data[0].data)).to.equal('test');

				expect(data[1].event).to.equal('delete');
				expect(data[1].id).to.equal(data[0].id);


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
			var Test = phrase.createPhrase({
				delay: function (input, data, done) {
					setTimeout(function () {
						data({text: 'test', value: 'test'});
						done();
					}, 0);
				},
				describe: function () {
					return phrase.value({compute: this.delay});
				}
			});

			parser = new lacona.Parser();
			parser.sentences = [phrase.createElement(Test)];
			stateful = new Stateful({serializer: fulltext.all});
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
				expect(data[0].data.suggestion[0].string).to.equal('te');

				done();
			}

			toStream(['t', 'te'])
				.pipe(parser)
				.pipe(stateful)
				.pipe(toArray(callback));
		});
	});

});
