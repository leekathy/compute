/* FILE: exceptions.js
 * Author: leekathy
 * This file contains 2 custom exception classes, UsernameException and PasswordException, 
 * that are child classes of the Error class.
 */

/* Custom exception for error in username */
export class UsernameException extends Error {
    constructor(message) {
        super(message);
        this.name = "UsernameException";
    }
}

/* Custom exception for error in password */
export class PasswordException extends Error {
    constructor(message) {
        super(message);
        this.name = "PasswordException";
    }
}
