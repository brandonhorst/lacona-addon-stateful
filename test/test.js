var chai = require('chai');
var stream = require('stream');

var lacona = require('lacona');
var Stateful = require('..');

var expect = chai.expect;

var grammar = {
	phrases: [{
		name: 'test',
		root: 'test'
	}]
};

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

	beforeEach(function () {
		parser = new lacona.Parser({sentences: ['test']}).understand(grammar);
		stateful = new Stateful();
	});

	it('emits insert for first occurrence of data' , function (done) {
		function callback(data) {
			expect(data).to.have.length(1);
			expect(data[0].event).to.equal('insert');
			expect(data[0].data.suggestion.words[0].string).to.equal('test');
			done();
		}

		toStream(['t'])
			.pipe(parser)
			.pipe(stateful)
			.pipe(toArray(callback));
	});

	it('does not emit multiple events if parsed before handling' , function (done) {
		function callback(data) {
			expect(data).to.have.length(2);
			expect(data[0].event).to.equal('insert');
			expect(data[1].event).to.equal('update');
			expect(data[0].data.suggestion.words[0].string).to.equal('test');
			expect(data[1].data.suggestion.words[0].string).to.equal('test');
			done();
		}

		toStream(['t', 'te'])
			.pipe(parser)
			.pipe(stateful)
			.pipe(toArray(callback));
	});

	it('does not emit events if none are valid' , function (done) {
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
