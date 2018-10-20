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
