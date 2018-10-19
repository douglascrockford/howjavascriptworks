// include.js
// 2018-09-26

const rx_include = /@include\u0020"([^"@]+)"/;

//. Capturing groups:
//.  [0] The whole '@include' expression
//.  [1] The key

export default Object.freeze(function include(
    callback,
    string,
    get_inclusion,
    max_depth = 4
) {

// The 'include' function replaces '@include' expressions in a string with
// other strings. If there are no '@include' expressions, then the original
// string is the result.

// The 'include' function takes these parameters:

//       callback(result)
//           The 'callback' function is given the processed 'result' string.

//       string
//           A string that may contain zero or more '@include' expressions.

//                       @include "key"

//           There is a space between the '@include' and the opening of the
//           key. Each '@include' expression is replaced with the inclusion
//           associated with the key if possible. A key (which could be a
//           filename) is wrapped in parens.

//       get_inclusion(callback, key)
//           Your 'get_inclusion' function takes a key string and eventually
//           passes the resulting inclusion string to 'callback('inclusion')'.
//           Your 'get_inclusion' function could access a file system,
//           database, source control system, content manager, or JSON Object.

//           If inclusions are coming from files, and if the environment is
//           Node.js, then your 'get_inclusion' function could look like this:

//           function my_little_get_inclusion(callback, key) {
//               return (
//                   (key[0] >= "a" && key[0] <= "z")
//                   ? fs.readFile(key, "utf8", function (ignore, data) {
//                       return callback(data);
//                   })
//                   : callback()
//               );
//           }


//       max_depth
//           An inclusion may contain more '@include' expressions. 'max_depth'
//           limits the depth to prevent infinite include loops.

// The 'include' function does not need direct access to or knowledge of
// the file system or the database or anything else because that capability
// is passed in as your 'get_inclusion' function. That makes the 'include'
// function versatile and trustworthy.

// Nothing is returned. The result is communicated eventually through the
// 'callback'.

    let object_of_matching;
    let result = "";

// The 'minion' and its assistants do all of the work. The main 'minion'
// searches for '@include' expressions and calls the 'get_inclusion' function
// with its findings. The 'assistant_minion' makes a recursive call to
// 'include' to process the inclusion. The 'junior_assistant_minion' appends
// the processed inclusion to the result.

    function minion() {

// If there is no more string to scan, deliver the result.

        if (string === "") {
            return callback(result);
        }

// Try matching the regular expression against the remaining string.

        object_of_matching = rx_include.exec(string);

// If there is no match, then our work is done.

        if (!object_of_matching) {
            return callback(result + string);
        }

// The characters to the left of the expression are part of the result.
// Remove that scanned material from the string.

        result += string.slice(0, object_of_matching.index);
        string = string.slice(
            object_of_matching.index + object_of_matching[0].length
        );

// Call the 'get_inclusion' function to obtain the replacement string,
// passing the 'assistant_minion' and the key.

        return get_inclusion(
            assistant_minion,
            object_of_matching[1]
        );
    }

    function junior_assistant_minion(processed_inclusion) {

// Take the inclusion that was processed by 'include' and append it to the
// result. Then call 'minion' to begin the search for the next '@include'
// expression.

        result += processed_inclusion;
        return minion();
    }

    function assistant_minion(inclusion) {

// If 'get_inclusion' did not deliver a string, then add the '@include'
// expression to the result, effectively leaving that part of the string
// unchanged.

        if (typeof inclusion !== "string") {
            result += object_of_matching[0];
            return minion();
        }

// The inclusion might contain its own '@include' expressions, so we call
// 'include' to process those, passing the 'junior_assistant_minion' that adds
// the processed inclusion to the result. The 'max_depth' is reduced to guard
// against infinte recursion.

        return include(
            junior_assistant_minion,
            inclusion,
            get_inclusion,
            max_depth - 1
        );
    }

// Those are the minions. Now back to 'include'.
// If we are out of our depth, then call the 'callback'.

    if (max_depth <= 0) {
        callback(string);
    } else {

// The 'include' function makes the three minion functions
// and calls the main 'minion'.

        minion();
    }
});
