/* FILE: app.js
 * Author: leekathy
 * This file contains the App class, which implements COMPUTE. 
 * Player login, leaderboard display, prompt contributions, and repeated game attempts are supported. 
 * See ind modules for more details.
 * Player stats and game prompts are stored in a REST API for update and retrieval.
 */

import Game from "./game.js";
import Player from "./player.js";
import { UsernameException, PasswordException } from "./exceptions.js";
import Prompt from "./prompt.js";
import Leaderboard from "./leaderboard.js";

class App {
    
    constructor() {
        this._player = null;
        
        this._welcome = null;
        this._instructions = null;
        this._login = null;
        this._signup = null;
        this._loadForm = null;
        this._formButtons = null;

        this._leaderboard = null;
        this._contributionParent = null;
        this._contribution = null;

        this._statsNode = null;
        this._promptParent = null;
        this._logParent = null;
        
        // Bind event handlers
        this._toSignup = this._toSignup.bind(this); 
        this._toLogin = this._toLogin.bind(this);
        this._onSignup = this._onSignup.bind(this);
        this._onLogin = this._onLogin.bind(this);
        this._onLogout = this._onLogout.bind(this);
        this._onStart = this._onStart.bind(this);
        this._addContr = this._addContr.bind(this);
    }
    
    /* FUNCTION: setup
     * ---------------
     * This function sets up the web app, and allows for login, signup, and leaderboard display.
     */
    async setup() {
        // Set up instance variables.
        this._welcome = document.querySelector("#welcome");
        this._instructions = document.querySelector("#instructions");
        this._contributionParent = document.querySelector("#contributionParent");
        this._contribution = document.querySelector("#contributionForm");
        this._loadForm = document.querySelector(".loadForm");
        this._formButtons = document.querySelector(".buttonContainer");
        this._promptParent = document.querySelector("#promptParent");
        this._logParent = document.querySelector("#logParent");

        // Set up login/signup buttons.
        this._login = document.querySelector("#login");
        this._login.addEventListener("click", this._toLogin);
        this._signup = document.querySelector("#signup");
        this._signup.addEventListener("click", this._toSignup);

        // Set up leaderboard.
        this._leaderboard = document.querySelector("#leaderboardParent");
        let topPlayers = await Leaderboard.loadTop(4);
        topPlayers.create(this._leaderboard);
    }

    /* FUNCTION: _toInstructions
     * -------------------------
     * This function hides the initial overview page (including the leaderboard) and reveals the instructions page.
     * The logout button, player's stats, and contribution form are displayed. The start button allows for game initiation.
     */
    _toInstructions() {
        this._leaderboard.remove();
        this._welcome.remove();
        this._setupLogout();

        // Display player stats in header.
        this._statsNode = document.createElement("h2");
        this._statsNode.classList.add("stats");
        this._statsNode.textContent = `${this._player.username}: ${this._player.points} points | ` +
                                      `${this._player.numWins} won | ${this._player.winRatio} win:loss ratio`;
        document.querySelector("h2").replaceWith(this._statsNode);

        // Display start message.
        this._instructions.classList.remove("hidden");
        let wrapper = document.createElement("div");
        wrapper.id = "start";
        let startButton = document.createElement("button");
        startButton.type = "button";
        startButton.textContent = "I'M READY";
        startButton.addEventListener("click", this._onStart);
        wrapper.appendChild(startButton);
        this._instructions.appendChild(wrapper)

        // Set up contribution form.
        this._contributionParent.classList.remove("hidden");
        this._contribution.addEventListener("submit", this._addContr);
    }
    
    /* FUNCTION: _setupLogout
     * ----------------------
     * This function replaces the signup/login form with the logout button.
     */
    _setupLogout() {
        this._switchFromForm();
        let logoutButton = document.createElement("button");
        logoutButton.type = "button";
        logoutButton.textContent = "logout (or refresh)";
        logoutButton.addEventListener("click", this._onLogout);
        this._formButtons.appendChild(logoutButton);
    }

    /* FUNCTION: _switchToForm
     * ----------------------
     * This function hides the signup/login buttons and reveals the signup/login form.
     */
    _switchToForm() {
        this._formButtons.classList.add("hidden");
        this._login.remove();
        this._signup.remove();
        this._loadForm.classList.remove("hidden");
        this._loadForm.username.focus();
    }

    /* FUNCTION: _switchFromForm
     * -------------------------
     * This function hides the signup/login form and sets up for the logout button.
     */
    _switchFromForm() {
        this._formButtons.classList.remove("hidden");
        this._loadForm.classList.add("hidden");
    }

    
    /* EVENT HANDLERS */

    /* FUNCTION: _toLogin
     * ------------------
     * This event handler responds to the user clicking on the log in button.
     * The signup/login choice are hidden, and the login form is revealed.
     */
    _toLogin(event) {
        this._switchToForm();
        this._loadForm.addEventListener("submit", this._onLogin);
    }
    
    /* FUNCTION: _onLogin
     * ------------------
     * This event handler responds to the user submitting the completed login form.
     * The input username and password are validated for existence and correctness.
     * Upon success, the login form is hidden and the instructions page is displayed.
     */
    async _onLogin(event) {
        event.preventDefault();
        let username = this._loadForm.username.value;
        let password = this._loadForm.password.value;
        
        try {
            this._player = await Player.validate(username, password);
        } catch (e) {
            console.log(typeof e);
            if (e instanceof UsernameException) { // A player with this username does not exist.
                this._loadForm.username.classList.add("error");
                setTimeout(() => this._loadForm.username.classList.remove("error"), 1000);
                this._loadForm.reset();
                this._loadForm.username.focus();
                return;
            } else { // Instance of PasswordException class. Password does not match.
                this._loadForm.password.classList.add("error");
                setTimeout(() => this._loadForm.password.classList.remove("error"), 1000);
                this._loadForm.password.value = "";
                this._loadForm.password.focus();
                return;
            }
        }

        this._toInstructions();
        this._loadForm.button.disabled = true;
    }
    
    /* FUNCTION: _toSignup
     * -------------------
     * This event handler responds to the user clicking on the sign up button.
     * The signup/login buttons are hidden, and the signup form is revealed.
     */
    _toSignup(event) {
        this._switchToForm();
        this._loadForm.addEventListener("submit", this._onSignup);
    }

    /* FUNCTION: _onSignup
     * -------------------
     * This event handler responds to the user submitting the completed signup form.
     * The input username is checked for availability.
     * Upon success, the signup form is hidden and the instructions page is displayed.
     */
    async _onSignup(event) {
        event.preventDefault();
        let username = this._loadForm.username.value;
        let password = this._loadForm.password.value;

        try {
            this._player = await Player.create(username, password);
        } catch (e) { // Instance of UsernameException class. Username already taken.
            this._loadForm.username.classList.add("error");
            setTimeout(() => this._loadForm.username.classList.remove("error"), 1000);
            this._loadForm.reset();
            this._loadForm.username.focus();
            return;
        }

        this._toInstructions();
        this._loadForm.button.disabled = true;
    }

    /* FUNCTION: _onLogout 
     * -------------------
     * This event handler responds to the user clicking on the logout button. 
     * The page is refreshed to reset page data.
     */
    _onLogout(event) {
        location.reload();
    }

    /* FUNCTION: _onStart
     * ------------------
     * This event handler responds to the user clicking on the start button. 
     * The instructions page and contribution form are hidden, and a new game is setup.
     */
    _onStart(event) {
        this._leaderboard.remove();
        this._instructions.classList.add("hidden");
        this._contributionParent.classList.add("hidden");

        this._promptParent.classList.remove("hidden");
        this._logParent.classList.remove("hidden");
        
        let game = new Game(this._player.username);
        game.setup(this._promptParent, this._logParent, this._statsNode);  
    }

    /* FUNCTION: _addContr
     * -------------------
     * This event handler responds to the user input contribution. 
     * The contribution info is updated in the backend.
     */
    async _addContr(event) {
        event.preventDefault();
        let question = this._contribution.question.value;
        let answer = parseFloat(this._contribution.answer.value);
        this._contribution.reset();
        this._contribution.question.focus();
        
        await Prompt.addPrompt(this._player.username, question, answer);
    }
}

let app = new App();
app.setup();
