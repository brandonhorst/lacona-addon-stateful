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
  if (option.id > this.latestParseId) {
    this.latestParseId = option.id;
  }
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

    if (cachedData) {
      cachedData.touchedBy = option.id;

      this.push({
        event: 'update',
        id: cachedData.id,
        data: option.data
      });

    } else {
      this.latestStateId++;

      this.currentList[serialized] = {
        id: this.latestStateId,
        touchedBy: option.id
      };

      this.push({
        event: 'insert',
        id: this.latestStateId,
        data: option.data
      });
    }
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
