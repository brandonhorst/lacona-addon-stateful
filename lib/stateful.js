/*
Exports one function, `setAutomaticMode`. When `setAutomaticMode` is passed a Lacona object, it does 2 things:

1. `use`s a middleware that adds a fullString property, which is just the full text of the match, suggestion, and completion combined
2. `intercept`s the `data` and `end` events and throws `insert`, `update`, and `delete` instead.

`insert` will be thrown whenever this parse contains an option with a fullString not in the previous parse.
`update` will be called if it does, and `delete` will be called on `end` if a previously `insert`ed
option was not `update`d.

`insert` and `update` are passed an integer id for the result as well as the new inputOption.
`delete` is just passed the integer id.

For implementation details, currentList is an object that looks like: `{fullString: {id: Number, touched: Boolean}}`.

On `data`, we go through, and check to see if the inputOption.fullString is in `currentList`. If so, we `update` it.
If not, we `insert` it. Either way, we set `touched = true`.

On `end`, we loop through everything, throw `delete`s for every thing that was not `touched`,
and set `touched = false` for everything else for the next loop around.
*/


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

//function handleData
// handle lacona `data` event
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

//function handleData
// handle lacona `end` event
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
