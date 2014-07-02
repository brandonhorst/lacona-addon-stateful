

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
	var _ = require('lodash'),
		intercept = require('events-intercept'),
		currentList = {},
		parserId = 0,
		currentIds = [],
		textMiddleware,
		setAutomaticMode;

	textMiddleware = function (option, done) {
		var allWords = option.match.concat(option.suggestion.words, option.completion);

		option._fullString = _.reduce(allWords, function (total, word) {
			return total + word.string;
		}, '');

		done();
	};
	handleDataClosure = function (parserId) {
		return function (option, done) {
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
		};
	};

	handleEndClosure = function (parserId) {
		return function (done) {
			_.each(currentList[parserId], function (value, key) {
				if (value.touched) {
					value.touched = false;
				} else {
					delete currentList[parserId][key];
					this.emit('delete', value.id);
				}
			}, this);
		};
	};

	setAutomaticMode = function (lacona) {
		lacona.use(textMiddleware);
		intercept.patch(lacona);

		currentIds[parserId] = 0;
		currentList[parserId] = {};

		lacona
		.intercept('data', handleDataClosure(parserId))
		.intercept('end', handleEndClosure(parserId));

		parserId += 1;
	};

	module.exports = setAutomaticMode;
})();