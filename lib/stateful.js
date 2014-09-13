

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

(function () {
  var intercept = require('events-intercept');
  var currentList = {};
  var parserId = 0;
  var currentIds = [];

  //function textMiddleware
  // take an option, add a _fullString property, which is just a string representation
  // of all words concatenated together. For use with lacona.use()
  function textMiddleware(option, done) {
    var allWords = option.match.concat(option.suggestion.words, option.completion);
    var i, l, word;
    var fullString = '';

    for (l = allWords.length, i = 0; i < l; i++) {
      word = allWords[i];
      fullString += word.string;
    }

    option._fullString = fullString;

    done();
  }

  //function handleDataClosure
  // return a function that will handle lacona `data` event for a given parserId
  function handleDataClosure(parserId) {

    function handleData(option, done) {
      var cachedData = currentList[parserId][option._fullString];

      if (cachedData) {
        cachedData.touched = true;
        delete option._fullString;
        this.emit('update', cachedData.id, option);

      } else {
        currentIds[parserId] += 1;
        currentList[parserId][option._fullString] = {
          id: currentIds[parserId],
          touched: true
        };

        delete option._fullString;
        this.emit('insert', currentIds[parserId], option);
      } 
    }

    return handleData;
  }

  //function handleDataClosure
  // return a function that will handle lacona `end` event for a given parserId
  function handleEndClosure(parserId) {

    function handleEnd(done) {
      var thisList = currentList[parserId];
      var key, value;

      for (key in thisList) {
        if (thisList.hasOwnProperty(key)) {
          value = thisList[key];

          if (value.touched) {
            value.touched = false;

          } else {
            delete currentList[parserId][key];
            this.emit('delete', value.id);
          }
        }
      }
    }

    return handleEnd;
  }

  function setAutomaticMode(lacona) {
    lacona.use(textMiddleware);
    intercept.patch(lacona);

    currentIds[parserId] = 0;
    currentList[parserId] = {};

    lacona
      .intercept('data', handleDataClosure(parserId))
      .intercept('end', handleEndClosure(parserId));

    parserId += 1;
  }

  module.exports = setAutomaticMode;
})();