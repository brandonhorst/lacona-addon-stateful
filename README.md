lacona-addon-stateful
================

[![Build Status](https://img.shields.io/travis/lacona/lacona-addon-stateful.svg?style=flat)](https://travis-ci.org/lacona/lacona-addon-stateful)
[![Coverage Status](https://img.shields.io/coveralls/lacona/lacona-addon-stateful.svg?style=flat)](https://coveralls.io/r/lacona/lacona-addon-stateful)
[![npm](http://img.shields.io/npm/v/lacona-addon-stateful.svg?style=flat)]()

This library works with the [lacona](https://github.com/brandonhorst/lacona) parser.

Typically, the lacona parser simply emits data for each parse as quickly as possible. Each parse is completely independent of all other parses.

However, for GUIs, it may be useful to keep track of state between parses, to correctly interpret keystrokes, handle animations, and more.

This module implements this stateful behavior, by means of a `Transform` stream.

##Example

	var lacona = require('lacona');
	var Stateful = require('lacona-addon-stateful');

	var parser = new lacona.Parser();
	//configure the parser if need be

	var stateful = new Stateful(parser);

##Docs

StatefulParser is an `Transform` stream that should be piped the output of `lacona.Parser`. It emits objects in the form

```js
{
	id: id,
	event: eventName,
	data: data
}
```

Where `event` will be either `'insert'`, `'update'`, or `'delete'`. For `'insert'` and `'update'`, an `OutputOption` will be provided as the `data` property.

StatefulParser is useful for interactive parsing sessions. Because inserts, updates, and deletes are provided independently, order can be maintained between requests and interfaces can be managed properly.

##Development

While a separate package, lacona-stateful is a fundamental component of the [lacona](https://github.com/lacona/lacona) framework, and will be supported in the same way.
