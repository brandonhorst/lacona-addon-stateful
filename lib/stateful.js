var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var fulltext = require('lacona-util-fulltext');

var StatefulParser = function StatefulParser(parser) {
  this.parser = parser;
  this.currentList = {};
  this.currentId = 0;

  parser
    .on('start', this.handleStart.bind(this))
    .on('data', this.handleData.bind(this))
    .on('end', this.handleEnd.bind(this))
    .on('error', this.handleError.bind(this));
};

inherits(StatefulParser, EventEmitter);

StatefulParser.prototype.handleStart = function handleStart() {
  this.emit('start');
};

StatefulParser.prototype.handleData = function handleData(option) {
  var fullString = fulltext(option);
  var cachedData = this.currentList[fullString];

  if (cachedData) {
    cachedData.touched = true;
    this.emit('update', cachedData.id, option);

  } else {
    this.currentId += 1;
    this.currentList[fullString] = {
      id: this.currentId,
      touched: true
    };

    this.emit('insert', this.currentId, option);
  }
};

StatefulParser.prototype.handleEnd = function handleEnd() {
  var thisList = this.currentList;
  var key, value;

  for (key in thisList) {
    value = thisList[key];

    if (value.touched) {
      value.touched = false;

    } else {
      delete this.currentList[key];
      this.emit('delete', value.id);
    }
  }
  this.emit('end');
};

StatefulParser.prototype.handleError = function handleError(err) {
  this.emit('error', err);
};

StatefulParser.prototype.parse = function parse(input) {
  return this.parser.parse(input);
};

module.exports = StatefulParser;
