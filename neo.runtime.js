// neo.runtime.js
// Douglas Crockford
// 2018-10-22

/*property
    abs, add, and, array, assert_boolean, assign, bitand, bitdown, bitmask,
    bitor, bitup, bitxor, boolean_, cat, cats, char, code, codePointAt,
    coefficient, create, default, delete, div, eq, exponent, fail, fill,
    forEach, fraction, freeze, fromCodePoint, function_, ge, get, gt, integer,
    integer_, isArray, isFrozen, isSafeInteger, is_big_float, join, keys, le,
    length, lt, make, map, mask, max, min, mul, ne, neg, normalize, not, number,
    number_, or, push, record, record_, reduce, resolve, set, shift_down,
    shift_up, slice, split, stone, string, sub, ternary, text, text_, wun, xor
*/

import big_float from "./big_float.js";
import big_integer from "./big_integer.js";

function fail(what = "fail") {
    throw new Error(what);
}

let weakmap_of_weakmaps = new WeakMap();

function get(container, key) {
    try {
        if (Array.isArray(container) || typeof container === "string") {
            const element_nr = big_float.number(key);
            return (
                Number.isSafeInteger(element_nr)
                ? container[(
                    element_nr >= 0
                    ? element_nr
                    : container.length + element_nr
                )]
                : undefined
            );
        }
        if (typeof container === "object") {
            if (big_float.is_big_float(key)) {
                key = big_float.string(key);
            }
            return (
                typeof key === "string"
                ? container[key]
                : weakmap_of_weakmaps.get(container).get(key)
            );
        }
        if (typeof container === "function") {
            return function (...rest) {
                return container(key, rest);
            };
        }
    } catch (ignore) {
    }
}

function set(container, key, value) {
    if (Object.isFrozen(container)) {
        return fail("set");
    }
    if (Array.isArray(container)) {

// Arrays use only big float for keys.

        let element_nr = big_float.number(key);
        if (!Number.isSafeInteger(element_nr)) {
            return fail("set");
        }

// Negative indexes are aliases, so that '[-1]' sets the last element.

        if (element_nr < 0) {
            element_nr = container.length + element_nr;
        }

// The key must be in the allocated range of the array.

        if (element_nr < 0 || element_nr >= container.length) {
            return fail("set");
        }
        container[element_nr] = value;
    } else {
        if (big_float.is_big_float(key)) {
            key = big_float.string(key);
        }

// If the key is a string, then it is an object update.

        if (typeof key === "string") {
            if (value === undefined) {
                delete container[key];
            } else {
                container[key] = value;
            }
        } else {

// Otherwise, this is a weakmap update.
// There will be a weakmap associated with each record with object keys.
// Note that 'typeof key !== "object"' is 'false' when 'key' is an array.

            if (typeof key !== "object") {
                return fail("set");
            }
            let weakmap = weakmap_of_weakmaps.get(container);

// If there is not yet a weakmap associated with this container, then make wun.

            if (weakmap === undefined) {
                if (value === undefined) {
                    return;
                }
                weakmap = new WeakMap();
                weakmap_of_weakmaps.set(container, weakmap);
            }

// Update the weakmap.

            if (value === undefined) {
                weakmap.delete(key);
            } else {
                weakmap.set(key, value);
            }
        }
    }
}

function array(zeroth, wunth, ...rest) {

// The 'array' function does the work of 'new Array', array'.fill',
// array'.slice', 'Object.keys', string'.split', and more.

    if (big_float.is_big_float(zeroth)) {
        const dimension = big_float.number(zeroth);
        if (!Number.isSafeInteger(dimension) || dimension < 0) {
            return fail("array");
        }
        let newness = new Array(dimension);
        return (
            (wunth === undefined || dimension === 0)
            ? newness
            : (
                typeof wunth === "function"
                ? newness.map(wunth)
                : newness.fill(wunth)
            )
        );
    }
    if (Array.isArray(zeroth)) {
        if (typeof wunth === "function") {
            return zeroth.map(wunth);
        }
        return zeroth.slice(big_float.number(wunth), big_float.number(rest[0]));
    }
    if (typeof zeroth === "object") {
        return Object.keys(zeroth);
    }
    if (typeof zeroth === "string") {
        return zeroth.split(wunth || "");
    }
    return fail("array");
}

function number(a, b) {
    return (
        typeof a === "string"
        ? big_float.make(a, b)
        : (
            typeof a === "boolean"
            ? big_float.make(Number(a))
            : (
                big_float.is_big_float(a)
                ? a
                : undefined
            )
        )
    );
}

function record(zeroth, wunth) {
    const newness = Object.create(null);
    if (zeroth === undefined) {
        return newness;
    }
    if (Array.isArray(zeroth)) {
        if (wunth === undefined) {
            wunth = true;
        }
        zeroth.forEach(function (element, element_nr) {
            set(
                newness,
                element,
                (
                    Array.isArray(wunth)
                    ? wunth[element_nr]
                    : (
                        typeof wunth === "function"
                        ? wunth(element)
                        : wunth
                    )
                )
            );
        });
        return newness;
    }
    if (typeof zeroth === "object") {
        if (wunth === undefined) {
            return Object.assign(newness, zeroth);
        }
        if (typeof wunth === "object") {
            return Object.assign(newness, zeroth, wunth);
        }
        if (Array.isArray(wunth)) {
            wunth.forEach(function (key) {
                let value = zeroth[key];
                if (value !== undefined) {
                    newness[key] = value;
                }
            });
            return newness;
        }
    }
    return fail("record");
}

function text(zeroth, wunth, twoth) {
    if (typeof zeroth === "string") {
        return (zeroth.slice(big_float.number(wunth), big_float.number(twoth)));
    }
    if (big_float.is_big_float(zeroth)) {
        return big_float.string(zeroth, wunth);
    }
    if (Array.isArray(zeroth)) {
        let separator = wunth;
        if (typeof wunth !== "string") {
            if (wunth !== undefined) {
                return fail("string");
            }
            separator = "";
        }
        return zeroth.join(separator);
    }
    if (typeof zeroth === "boolean") {
        return String(zeroth);
    }
}

// 'stone' is a deep freeze.

function stone(object) {
    if (!Object.isFrozen(object)) {
        object = Object.freeze(object);
        if (typeof object === "object") {
            if (Array.isArray(object)) {
                object.forEach(stone);
            } else {
                Object.keys(object).forEach(function (key) {
                    stone(object[key]);
                });
            }
        }
    }
    return object;
}

function boolean_(any) {
    return typeof any === "boolean";
}

function function_(any) {
    return typeof any === "function";
}

function integer_(any) {
    return (
        big_float.is_big_float(any)
        && big_float.normalize(any).exponent === 0
    );
}

function number_(any) {
    return big_float.is_big_float(any);
}

function record_(any) {
    return (
        any !== null
        && typeof any === "object"
        && !big_float.is_big_float(any)
    );
}

function text_(any) {
    return typeof any === "string";
}

function assert_boolean(boolean) {
    return (
        typeof boolean === "boolean"
        ? boolean
        : fail("boolean")
    );
}

function and(zeroth, wunth) {
    return assert_boolean(zeroth) && assert_boolean(wunth);
}

function or(zeroth, wunth) {
    return assert_boolean(zeroth) || assert_boolean(wunth);
}

function not(boolean) {
    return !assert_boolean(boolean);
}

function ternary(zeroth, wunth, twoth) {
    return (
        assert_boolean(zeroth)
        ? wunth
        : twoth
    );
}

function default_function(zeroth, wunth) {
    return (
        zeroth === undefined
        ? wunth
        : zeroth
    );
}

function eq(zeroth, wunth) {
    return zeroth === wunth || (
        big_float.is_big_float(zeroth)
        && big_float.is_big_float(wunth)
        && big_float.eq(zeroth, wunth)
    );
}

function lt(zeroth, wunth) {
    return (
        zeroth === undefined
        ? false
        : (
            wunth === undefined
            ? true
            : (
                (
                    big_float.is_big_float(zeroth)
                    && big_float.is_big_float(wunth)
                )
                ? big_float.lt(zeroth, wunth)
                : (
                    (typeof zeroth === typeof wunth && (
                        typeof zeroth === "string"
                        || typeof zeroth === "number"
                    ))
                    ? zeroth < wunth
                    : fail("lt")
                )
            )
        )
    );
}

function ge(zeroth, wunth) {
    return !lt(zeroth, wunth);
}

function gt(zeroth, wunth) {
    return lt(wunth, zeroth);
}

function le(zeroth, wunth) {
    return !lt(wunth, zeroth);
}

function ne(zeroth, wunth) {
    return !eq(wunth, zeroth);
}

function add(a, b) {
    return (
        (big_float.is_big_float(a) && big_float.is_big_float(b))
        ? big_float.add(a, b)
        : undefined
    );
}

function sub(a, b) {
    return (
        (big_float.is_big_float(a) && big_float.is_big_float(b))
        ? big_float.sub(a, b)
        : undefined
    );
}

function mul(a, b) {
    return (
        (big_float.is_big_float(a) && big_float.is_big_float(b))
        ? big_float.mul(a, b)
        : undefined
    );
}

function div(a, b) {
    return (
        (big_float.is_big_float(a) && big_float.is_big_float(b))
        ? big_float.div(a, b)
        : undefined
    );
}

function max(a, b) {
    return (
        lt(b, a)
        ? a
        : b
    );
}

function min(a, b) {
    return (
        lt(a, b)
        ? a
        : b
    );
}

function abs(a) {
    return (
        big_float.is_big_float(a)
        ? big_float.abs(a)
        : undefined
    );
}

function fraction(a) {
    return (
        big_float.is_big_float(a)
        ? big_float.fraction(a)
        : undefined
    );
}

function integer(a) {
    return (
        big_float.is_big_float(a)
        ? big_float.integer(a)
        : undefined
    );
}

function neg(a) {
    return (
        big_float.is_big_float(a)
        ? big_float.neg(a)
        : undefined
    );
}

function bitand(a, b) {
    return big_float.make(
        big_integer.and(
            big_float.integer(a).coefficient,
            big_float.integer(b).coefficient
        ),
        big_integer.wun
    );
}

function bitdown(a, nr_bits) {
    return big_float.make(
        big_integer.shift_down(
            big_float.integer(a).coefficient,
            big_float.number(nr_bits)
        ),
        big_integer.wun
    );
}

function bitmask(nr_bits) {
    return big_float.make(big_integer.mask(big_float.number(nr_bits)));
}

function bitor(a, b) {
    return big_float.make(
        big_integer.or(
            big_float.integer(a).coefficient,
            big_float.integer(b).coefficient
        ),
        big_integer.wun
    );
}

function bitup(a, nr_bits) {
    return big_float.make(
        big_integer.shift_up(
            big_float.integer(a).coefficient,
            big_float.number(nr_bits)
        ),
        big_integer.wun
    );
}

function bitxor(a, b) {
    return big_float.make(
        big_integer.xor(
            big_float.integer(a).coefficient,
            big_float.integer(b).coefficient
        ),
        big_integer.wun
    );
}

function resolve(value, ...rest) {
    return (
        typeof value === "function"
        ? value(...rest)
        : value
    );
}

function cat(zeroth, wunth) {
    zeroth = text(zeroth);
    wunth = text(wunth);
    if (typeof zeroth === "string" && typeof wunth === "string") {
        return zeroth + wunth;
    }
}

function cats(zeroth, wunth) {
    zeroth = text(zeroth);
    wunth = text(wunth);
    if (typeof zeroth === "string" && typeof wunth === "string") {
        return (
            zeroth === ""
            ? wunth
            : (
                wunth === ""
                ? zeroth
                : zeroth + " " + wunth
            )
        );
    }
}

function char(any) {
    return String.fromCodePoint(big_float.number(any));
}

function code(any) {
    return big_float.make(any.codePointAt(0));
}

function length(linear) {
    return (
        (Array.isArray(linear) || typeof linear === "string")
        ? big_float.make(linear.length)
        : undefined
    );
}

export default stone({
    abs,
    add,
    and,
    array,
    assert_boolean,
    bitand,
    bitdown,
    bitmask,
    bitor,
    bitup,
    bitxor,
    boolean_,
    cat,
    cats,
    char,
    code,
    default: default_function,
    div,
    eq,
    fail,
    fraction,
    function_,
    ge,
    get,
    gt,
    integer,
    integer_,
    le,
    length,
    max,
    min,
    mul,
    ne,
    neg,
    not,
    number,
    number_,
    or,
    record,
    record_,
    resolve,
    set,
    stone,
    sub,
    ternary,
    text,
    text_
});

