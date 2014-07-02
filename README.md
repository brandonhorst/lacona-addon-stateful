lacona-stateful
================

This library works with the [lacona parser](https://github.com/brandonhorst/lacona).

Typically, the parser works much like a typical node stream, emitting 3 events: `data`, `end`, and `error`. Each parse is completely independent of all other parses.

However, for GUIs, it may be useful to keep track of state between parses, to correctly interpret keystrokes or handle animations, and more.

This module implements this stateful behavior.

##Usage

	var lacona = require('lacona'),
		parser = new lacona.Parser(),
		stateful = require('lacona-stateful');

	stateful(parser);

This makes use of [`events-intercept`](https://github.com/brandonhorst/events-intercept), hijacking the standard events and calling the following instead:

* `insert` is called when a new `OutputOption` is available
* `update` is called when a previously `insert`ed `OutputOption` should be replaced
* `delete` is called when a previously `insert`ed `OutputOption` should be removed

`insert` and `update` are passed a `Number` id and an `OutputOption` representing the new option.

`delete` is just passed the `Number` id.

If an error happened at any point, `error` will be emitted and passed an `Error`. If this happens, the state will be reset and all events for the next parse will be `insert`s.

Automatic mode is useful for interactive parsing sessions. Because inserts, updates, and deletes are provided independently, order can be maintained between requests and interfaces can be managed properly.

##Development

While a separate package, lacona-stateful is a fundamental component of the [lacona](https://github.com/brandonhorst/lacona) framework, and will be supported in the same way.