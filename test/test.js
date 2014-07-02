var chai = require('chai');
var expect = chai.expectl
var lacona = require('lacona');
var sinon = require('sinon');
var stateful = require('../lib/stateful');
var schema;

chai.use(require('sinon-chai'));

schema = {
	root: 'test',
	run: ''
};


describe('lacona-stateful', function () {
	var parser;

	beforeEach(function () {
		parser = new lacona.Parser();
		stateful(parser);
	});

	it('emits insert for first occurrence of data' , function () {
		var handleInsert = sinon.spy(function (id, data) {
			expect(data.suggestion.words[0].string).to.equal('test');
		});

		var handleUpdate = sinon.spy();

		parser
		.understand(schema)
		.on('insert', handleInsert)
		.on('update', handleUpdate)
		.parse('t');

		expect(handleInsert).to.have.been.called.once;
		expect(handleUpdate).to.not.have.been.called;
	});

	it('emits update for subsequent data with the same string' , function () {
		var handleInsert = sinon.spy(function (id, data) {
			expect(data.suggestion.words[0].string).to.equal('test');
		});

		var handleUpdate = sinon.spy(function (id, data) {
			expect(data.suggestion.words[0].string).to.equal('test');
		});

		parser
		.understand(schema)
		.on('insert', handleInsert)
		.on('update', handleUpdate)
		.parse('t')
		.parse('te');

		expect(handleInsert).to.have.been.called.once;
		expect(handleUpdate).to.have.been.called.once;
		expect(handleInsert.firstCall.args[0]).to.equal(handleUpdate.firstCall.args[0]);
	});

	it('emits delete when the parse is no longer valid' , function () {
		var handleInsert = sinon.spy(function (id, data) {
			expect(data.suggestion.words[0].string).to.equal('test');
		});

		var handleDelete = sinon.spy();

		parser
		.understand(schema)
		.on('insert', handleInsert)
		.on('delete', handleDelete)
		.parse('t')
		.parse('tx');

		expect(handleInsert).to.have.been.called.once;
		expect(handleDelete).to.have.been.called.once;
		expect(handleInsert.firstCall.args[0]).to.equal(handleDelete.firstCall.args[0]);
	});


});
