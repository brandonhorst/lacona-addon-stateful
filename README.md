lacona-addon-stateful
================

[![Build Status](https://img.shields.io/travis/lacona/lacona-addon-stateful.svg?style=flat)](https://travis-ci.org/lacona/lacona-addon-stateful)
[![Coverage Status](https://img.shields.io/coveralls/lacona/lacona-addon-stateful.svg?style=flat)](https://coveralls.io/r/lacona/lacona-addon-stateful)
[![npm](http://img.shields.io/npm/v/lacona-addon-stateful.svg?style=flat)]()

This library works with the [lacona](https://github.com/brandonhorst/lacona) parser.

Typically, the parser works much like a typical node readable stream, emitting 3 events: `data`, `end`, and `error`. Each parse is completely independent of all other parses.

However, for GUIs, it may be useful to keep track of state between parses, to correctly interpret keystrokes, handle animations, and more.

This module implements this stateful behavior.

##Example

	var lacona = require('lacona');
	var StatefulParser = require('lacona-addon-stateful');

	var parser = new lacona.Parser();
	//configure the parser if need be

	var statefulParser = new StatefulParser(parser);

##Docs

StatefulParser is an EventEmitter that can emit four events:

* `start` is called when a parse is started
* `insert` is called when a new `OutputOption` is available
* `update` is called when a previously `insert`ed `OutputOption` should be replaced
* `delete` is called when a previously `insert`ed `OutputOption` should be removed
* `end` is called when a parse completes
* `error` is called when the parser reports an error. Even if this happens, you can still trust the other `insert`, `update`, and `delete`

`insert` and `update` are passed a `Number` id and an `OutputOption` representing the new option.

`delete` is just passed the `Number` id.

StatefulParser is useful for interactive parsing sessions. Because inserts, updates, and deletes are provided independently, order can be maintained between requests and interfaces can be managed properly.

##Development

While a separate package, lacona-stateful is a fundamental component of the [lacona](https://github.com/brandonhorst/lacona) framework, and will be supported in the same way.
