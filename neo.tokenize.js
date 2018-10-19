// neo.tokenize.js
// Douglas Crockford
// 2018-09-24

// Public Domain

/*property
    alphameric, column_nr, column_to, comment, exec, freeze, fromCodePoint, id,
    isArray, lastIndex, length, line_nr, make, normalize, number, parse,
    readonly, replace, slice, split, string, text
*/

import big_float from "./big_float.js";

const rx_unicode_escapement = /\\u\{([0-9A-F]{4,6})\}/g;

// 'rx_crfl' matches linefeed, carriage return, and carriage return linefeed.
// We are still messing with device codes for mid 20th Century electromechanical
// teletype machines.

const rx_crlf = /\n|\r\n?/;

// 'rx_token' matches a Neo token: comment, name, number, string, punctuator.

const rx_token = /(\u0020+)|(#.*)|([a-zA-Z](?:\u0020[a-zA-Z]|[0-9a-zA-Z])*\??)|(-?\d+(?:\.\d+)?(?:e\-?\d+)?)|("(?:[^"\\]|\\(?:[nr"\\]|u\{[0-9A-F]{4,6}\}))*")|(\.(?:\.\.)?|\/\\?|\\\/?|>>?|<<?|\[\]?|\{\}?|[()}\].,:?!;~≈=≠≤≥&|+\-*%ƒ$@\^_'`])/y;

//. Capture Group
//.     [1]  Whitespace
//.     [2]  Comment
//.     [3]  Alphameric
//.     [4]  Number
//.     [5]  String
//.     [6]  Punctuator

export default Object.freeze(function tokenize(source, comment = false) {

// 'tokenize' takes a source and produces from it an array of token objects.
// If the 'source' is not an array, then it is split into lines at the carriage
// return/linefeed. If 'comment' is true then comments are included as token
// objects. The parser does not want to see comments, but a software tool might.

    const lines = (
        Array.isArray(source)
        ? source
        : source.split(rx_crlf)
    );
    let line_nr = 0;
    let line = lines[0];
    rx_token.lastIndex = 0;

    return function token_generator() {
        if (line === undefined) {
            return;
        }
        let column_nr = rx_token.lastIndex;
        if (column_nr >= line.length) {
            rx_token.lastIndex = 0;
            line_nr += 1;
            line = lines[line_nr];
            return (
                line === undefined
                ? undefined
                : token_generator()
            );
        }
        let captives = rx_token.exec(line);

// Nothing matched.

        if (!captives) {
            return {
                id: "(error)",
                line_nr,
                column_nr,
                string: line.slice(column_nr)
            };
        }

// Whitespace matched.

        if (captives[1]) {
            return token_generator();
        }

// A comment matched.

        if (captives[2]) {
            return (
                comment
                ? {
                    id: "(comment)",
                    comment: captives[2],
                    line_nr,
                    column_nr,
                    column_to: rx_token.lastIndex
                }
                : token_generator()
            );
        }

// A name matched.

        if (captives[3]) {
            return {
                id: captives[3],
                alphameric: true,
                line_nr,
                column_nr,
                column_to: rx_token.lastIndex
            };
        }

// A number literal matched.

        if (captives[4]) {
            return {
                id: "(number)",
                readonly: true,
                number: big_float.normalize(big_float.make(captives[4])),
                text: captives[4],
                line_nr,
                column_nr,
                column_to: rx_token.lastIndex
            };
        }

// A text literal matched.

        if (captives[5]) {

// We use '.replace' to convert '\u{xxxxxx}' to a codepoint
// and 'JSON.parse' to process the remaining escapes and remove the quotes.

            return {
                id: "(text)",
                readonly: true,
                text: JSON.parse(captives[5].replace(
                    rx_unicode_escapement,
                    function (ignore, code) {
                        return String.fromCodePoint(parseInt(code, 16));
                    }
                )),
                line_nr,
                column_nr,
                column_to: rx_token.lastIndex
            };
        }

// A punctuator matched.

        if (captives[6]) {
            return {
                id: captives[6],
                line_nr,
                column_nr,
                column_to: rx_token.lastIndex
            };
        }
    };
});

