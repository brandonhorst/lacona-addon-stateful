var inherits = require('inherits');
var Transform = require('stream').Transform;

function Stateful(options) {
  Transform.call(this, {objectMode: true});

  this.latestParseId = -1;
  this.latestStateId = -1;
  this.currentList = {};
  this.serializer = options.serializer;
}

inherits(Stateful, Transform);

Stateful.prototype.handleStart = function(option) {
  this.latestParseId = option.id;
};

Stateful.prototype.handleEnd = function(option) {
  if (this.latestParseId === option.id) {
    var key;

    for (key in this.currentList) {
      if (this.currentList[key].touchedBy < option.id) {

        this.push({
          event: 'delete',
          id: this.currentList[key].id
        });

        delete this.currentList[key];
      }
    }
  }
};

Stateful.prototype.handleData = function(option) {
  var serialized;
  var cachedData;

  if (this.latestParseId === option.id) {
    serialized = this.serializer(option.data);
    cachedData = this.currentList[serialized];

    //increment the state Id
    this.latestStateId++;

    //if there is already data here, delete it
    if (cachedData) {
      this.push({
        event: 'delete',
        id: cachedData.id
      });
    }

    //add this to the list
    this.currentList[serialized] = {
      id: this.latestStateId,
      touchedBy: option.id
    };

    //send the new insert
    this.push({
      event: 'insert',
      id: this.latestStateId,
      data: option.data
    });
  }
};

Stateful.prototype._transform = function (option, encoding, callback) {
  switch (option.event) {
    case 'start':
      this.handleStart(option);
      break;
    case 'end':
      this.handleEnd(option);
      break;
    case 'data':
      this.handleData(option);
      break;
  }
  callback();
};

module.exports = Stateful;
