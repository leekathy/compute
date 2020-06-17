/* FILE: randNorm.js
 * Author: leekathy
 * This file ontains the randNorm function, which generates a normal RV of the desired mean and standard deviation.
 * Adapted from the implementation of normal_distribution in the GNU C++ Library.
 */

/* FUNCTION: randNorm
 * ------------------
 * Parameters:
 *     mean - mean of desired normal distr
 *     sd   - standard dev of desired normal distr
 * This function uses the Marsaglia polar method to generate a normal RV.
 */
const randNorm = (mean, sd) => {
    let x;
    let y;
    let s;
    do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        s = x * x + y * y;
    } while (s === 0 || s >= 1.0);
    return mean + sd * y * Math.sqrt(-2 * Math.log(s) / s);
}

export default randNorm;
