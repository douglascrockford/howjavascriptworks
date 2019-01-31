// big_float.js
// Douglas Crockford
// 2018-11-18

// You can access the big decimal floating point object in your module
// by importing it.

//      import big_float from "./big_float.js";

//      big_float.eq(
//          big_float.add(
//              big_float.make("0.1"),
//              big_float.make("0.2")
//          ),
//          big_float.make("0.3")
//      )                           // true

/*jslint bitwise */

/*property
    abs, abs_lt, add, coefficient, create, div, divrem, eq, exponent, fraction,
    freeze, integer, isFinite, isSafeInteger, is_big_float, is_big_integer,
    is_negative, is_positive, is_zero, length, lt, make, match, mul, neg,
    normalize, number, power, repeat, scientific, sign, signum, slice, string,
    sub, ten, two, zero
*/

import big_integer from "./big_integer.js";

function is_big_float(big) {
    return (
        typeof big === "object"
        && big_integer.is_big_integer(big.coefficient)
        && Number.isSafeInteger(big.exponent)
    );
}

function is_negative(big) {
    return big_integer.is_negative(big.coefficient);
}

function is_positive(big) {
    return big_integer.is_positive(big.coefficient);
}

function is_zero(big) {
    return big_integer.is_zero(big.coefficient);
}

const zero = Object.create(null);
zero.coefficient = big_integer.zero;
zero.exponent = 0;
Object.freeze(zero);

function make_big_float(coefficient, exponent) {
    if (big_integer.is_zero(coefficient)) {
        return zero;
    }
    const new_big_float = Object.create(null);
    new_big_float.coefficient = coefficient;
    new_big_float.exponent = exponent;
    return Object.freeze(new_big_float);
}

const big_integer_ten_million = big_integer.make(10000000);

function number(a) {
    return (
        is_big_float(a)
        ? (
            a.exponent === 0
            ? big_integer.number(a.coefficient)
            : big_integer.number(a.coefficient) * (10 ** a.exponent)
        )
        : (
            typeof a === "number"
            ? a
            : (
                big_integer.is_big_integer(a)
                ? big_integer.number(a)
                : Number(a)
            )
        )
    );
}

function neg(a) {
    return make_big_float(big_integer.neg(a.coefficient), a.exponent);
}

function abs(a) {
    return (
        is_negative(a)
        ? neg(a)
        : a
    );
}

function conform_op(op) {
    return function (a, b) {
        const differential = b.exponent - a.exponent;
        return (
            differential === 0
            ? make_big_float(op(a.coefficient, b.coefficient), a.exponent)
            : (
                differential < 0
                ? make_big_float(
                    op(
                        big_integer.mul(
                            a.coefficient,
                            big_integer.power(big_integer.ten, -differential)
                        ),
                        b.coefficient
                    ),
                    b.exponent
                )
                : make_big_float(
                    op(
                        a.coefficient,
                        big_integer.mul(
                            b.coefficient,
                            big_integer.power(big_integer.ten, differential)
                        )
                    ),
                    a.exponent
                )
            )
        );
    };
}

const add = conform_op(big_integer.add);
const sub = conform_op(big_integer.sub);

function eq(comparahend, comparator) {
    return comparahend === comparator || is_zero(sub(comparahend, comparator));
}

function lt(comparahend, comparator) {
    return is_negative(sub(comparahend, comparator));
}

function mul(multiplicand, multiplier) {
    return make_big_float(
        big_integer.mul(multiplicand.coefficient, multiplier.coefficient),
        multiplicand.exponent + multiplier.exponent
    );
}

function div(dividend, divisor, precision = -4) {
    if (is_zero(dividend)) {
        return zero;
    }
    if (is_zero(divisor)) {
        return undefined;
    }
    let {coefficient, exponent} = dividend;
    exponent -= divisor.exponent;

// Scale the coefficient to the desired precision.

    if (typeof precision !== "number") {
        precision = number(precision);
    }
    if (exponent > precision) {
        coefficient = big_integer.mul(
            coefficient,
            big_integer.power(big_integer.ten, exponent - precision)
        );
        exponent = precision;
    }
    let remainder;
    [coefficient, remainder] = big_integer.divrem(
        coefficient,
        divisor.coefficient
    );

// Round the result if necessary.

    if (!big_integer.abs_lt(
        big_integer.add(remainder, remainder),
        divisor.coefficient
    )) {
        coefficient = big_integer.add(
            coefficient,
            big_integer.signum(dividend.coefficient)
        );
    }
    return make_big_float(coefficient, exponent);
}

function normalize(a) {
    let {coefficient, exponent} = a;
    if (coefficient.length < 2) {
        return zero;
    }

// If the exponent is zero, it is already normal.

    if (exponent !== 0) {

// If the exponent is positive, multiply the coefficient by '10 **' exponent.

        if (exponent > 0) {
            coefficient = big_integer.mul(
                coefficient,
                big_integer.power(big_integer.ten, exponent)
            );
            exponent = 0;
        } else {
            let quotient;
            let remainder;

// While the exponent is negative, if the coefficient is divisible by ten,
// then we do the division and add '1' to the exponent.

// To help this go a little faster, we first try units of ten million,
// reducing 7 zeros at a time.

            while (exponent <= -7 && (coefficient[1] & 127) === 0) {
                [quotient, remainder] = big_integer.divrem(
                    coefficient,
                    big_integer_ten_million
                );
                if (remainder !== big_integer.zero) {
                    break;
                }
                coefficient = quotient;
                exponent += 7;
            }
            while (exponent < 0 && (coefficient[1] & 1) === 0) {
                [quotient, remainder] = big_integer.divrem(
                    coefficient,
                    big_integer.ten
                );
                if (remainder !== big_integer.zero) {
                    break;
                }
                coefficient = quotient;
                exponent += 1;
            }
        }
    }
    return make_big_float(coefficient, exponent);
}

function integer(a) {

// The integer function is like the normalize function except that it throws
// away significance. It discards the digits after the decimal point.

    let {coefficient, exponent} = a;
    if (coefficient.length < 2) {
        return zero;
    }

// If the exponent is zero, it is already an integer.

    if (exponent === 0) {
        return a;
    }

// If the exponent is positive,
// multiply the coefficient by 10 ** exponent.

    if (exponent > 0) {
        return make_big_float(
            big_integer.mul(
                coefficient,
                big_integer.power(big_integer.ten, exponent)
            ),
            0
        );
    }

// If the exponent is negative, divide the coefficient by 10 ** -exponent.
// This truncates the unnecessary bits. This might be a zero result.

    return make_big_float(
        big_integer.div(
            coefficient,
            big_integer.power(big_integer.ten, -exponent)
        ),
        0
    );
}

function fraction(a) {
    return sub(a, integer(a));
}

function deconstruct(number) {

// This function deconstructs a number, reducing it to its components:
// a sign, an integer coefficient, and an exponent, such that

//  '      number = sign * coefficient * (2 ** exponent)'

    let sign = 1;
    let coefficient = number;
    let exponent = 0;

// Remove the sign from the coefficient.

    if (coefficient < 0) {
        coefficient = -coefficient;
        sign = -1;
    }

    if (Number.isFinite(number) && number !== 0) {

// Reduce the coefficient: We can obtain the exponent by dividing the number by
// two until it goes to zero. We add the number of divisions to -1128, which is
// the exponent of 'Number.MIN_VALUE' minus the number of bits in the
// significand minus the bonus bit.

        exponent = -1128;
        let reduction = coefficient;
        while (reduction !== 0) {

// This loop is guaranteed to reach zero. Each division will decrement the
// exponent of the reduction. When the exponent is so small that it can not
// be decremented, then the internal subnormal significand will be shifted
// right instead. Ultimately, all of the bits will be shifted out.

            exponent += 1;
            reduction /= 2;
        }

// Reduce the exponent: When the exponent is zero, the number can be viewed
// as an integer. If the exponent is not zero, then adjust to correct the
// coefficient.

        reduction = exponent;
        while (reduction > 0) {
            coefficient /= 2;
            reduction -= 1;
        }
        while (reduction < 0) {
            coefficient *= 2;
            reduction += 1;
        }
    }

// Return an object containing the three components and the original number.

    return {
        sign,
        coefficient,
        exponent,
        number
    };
}

const number_pattern = /^(-?\d+)(?:\.(\d*))?(?:e(-?\d+))?$/;

//. Capturing groups
//.      [1] int
//.      [2] frac
//.      [3] exp

function make(a, b) {

//.      (big_integer)
//.      (big_integer, exponent)
//.      (string)
//.      (string, radix)
//.      (number)

    if (big_integer.is_big_integer(a)) {
        return make_big_float(a, b || 0);
    }
    if (typeof a === "string") {
        if (Number.isSafeInteger(b)) {
            return make(big_integer.make(a, b), 0);
        }
        let parts = a.match(number_pattern);
        if (parts) {
            let frac = parts[2] || "";
            return make(
                big_integer.make(parts[1] + frac),
                (Number(parts[3]) || 0) - frac.length
            );
        }
    }

// If 'a' is a number, then we deconstruct it into its basis '2' exponent
// and coefficient, and then reconstruct as a precise big float.

    if (typeof a === "number" && Number.isFinite(a)) {
        if (a === 0) {
            return zero;
        }
        let {sign, coefficient, exponent} = deconstruct(a);
        if (sign < 0) {
            coefficient = -coefficient;
        }
        coefficient = big_integer.make(coefficient);

// If the exponent is negative, then we can divide by '2 ** abs(exponent)'.

        if (exponent < 0) {
            return normalize(div(
                make(coefficient, 0),
                make(big_integer.power(big_integer.two, -exponent), 0),
                b
            ));
        }

// If the exponent is greater than zero, then we can multiply the coefficient
// by '2 **' exponent.

        if (exponent > 0) {
            coefficient = big_integer.mul(
                coefficient,
                big_integer.power(big_integer.two, exponent)
            );
            exponent = 0;
        }
        return make(coefficient, exponent);
    }
    if (is_big_float(a)) {
        return a;
    }
}

function string(a, radix) {
    if (is_zero(a)) {
        return "0";
    }
    if (is_big_float(radix)) {
        radix = normalize(radix);
        return (
            (radix && radix.exponent === 0)
            ? big_integer.string(integer(a).coefficient, radix.coefficient)
            : undefined
        );
    }
    a = normalize(a);
    let s = big_integer.string(big_integer.abs(a.coefficient));
    if (a.exponent < 0) {
        let point = s.length + a.exponent;
        if (point <= 0) {
            s = "0".repeat(1 - point) + s;
            point = 1;
        }
        s = s.slice(0, point) + "." + s.slice(point);
    } else if (a.exponent > 0) {
        s += "0".repeat(a.exponent);
    }
    if (big_integer.is_negative(a.coefficient)) {
        s = "-" + s;
    }
    return s;
}

function scientific(a) {
    if (is_zero(a)) {
        return "0";
    }
    a = normalize(a);
    let s = big_integer.string(big_integer.abs(a.coefficient));
    let e = a.exponent + s.length - 1;
    if (s.length > 1) {
        s = s.slice(0, 1) + "." + s.slice(1);
    }
    if (e !== 0) {
        s += "e" + e;
    }
    if (big_integer.is_negative(a.coefficient)) {
        s = "-" + s;
    }
    return s;
}

export default Object.freeze({
    abs,
    add,
    div,
    eq,
    fraction,
    integer,
    is_big_float,
    is_negative,
    is_positive,
    is_zero,
    lt,
    make,
    mul,
    neg,
    normalize,
    number,
    scientific,
    string,
    sub,
    zero
});

