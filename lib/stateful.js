var inherits = require('inherits');
var Transform = require('stream').Transform;

function Stateful(options) {
  Transform.call(this, {objectMode: true});

  this.latestId = -1;
  this.currentList = {};
  this.serializer = options.serializer;
}

inherits(Stateful, Transform);

Stateful.prototype.handleStart = function(option) {
  if (option.id > this.latestId) {
    this.latestId = option.id;
  }
};

Stateful.prototype.handleEnd = function(option) {
  if (this.latestId === option.id) {
    var key;

    for (key in this.currentList) {
      if (this.currentList[key].touchedBy < option.id) {
        delete this.currentList[key];

        this.push({
          event: 'delete',
          id: option.id
        });
      }
    }
  }
};

Stateful.prototype.handleData = function(option) {
  var serialized;
  var cachedData;

  if (this.latestId === option.id) {
    serialized = this.serializer(option.data);
    cachedData = this.currentList[serialized];

    if (cachedData) {
      cachedData.touchedBy = option.id;

      this.push({
        event: 'update',
        id: option.id,
        data: option.data
      });

    } else {
      this.currentList[serialized] = {touchedBy: option.id};

      this.push({
        event: 'insert',
        id: option.currentId,
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
