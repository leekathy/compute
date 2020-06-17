/* FILE: game.js
 * Author: leekathy
 * This file contains the Game class, which implements COMPUTE's main game component (prompt and game log).
 * Each iteration of the game has a single prompt and lasts 90 seconds (unlimited rounds). During each round, the user submits 
 * a bid-ask spread, and the computer responds by selling 1 unit at the bid price, buying at the ask price, or doing neither.
 * ----
 * To simulate varying risk preferences, the computer considers, against the input bid-ask spread, 
 * a generated normal RV with mean and standard deviation of the prompt's true value and (true value * adjust), respectively. 
 * The value of adjust begins at 0.15, but to simulate competing bid-ask spreads, after each round in which the user has
 * successfully bought for < true value or sold for > true value, the value of adjust adjusts downward to force a tighter market.
 * ----
 * In the game log, bid and ask history, change in user's position and cash, and accumulated position and cash are recorded.
 */

import apiRequest from "./api.js";
import Player from "./player.js";
import Prompt from "./prompt.js";
import randNorm from "./randNorm.js";

const NUM_UNITS = 1; // Number of units bought/sold by the computer in each round.
const ADJUST = 0.5; // Sets initial difficulty.
const ADJUST_DOWN = 0.9; // Increases difficulty upon user profit.

let timer;

export default class Game {
    
    constructor(username) {
        this._username = username;
        this._promptParent = null;
        this._logParent = null;
        this._statsNode = null;

        this._prompt = null;
        this._answer = null;
        this._adjust = ADJUST;
        this._form = null;

        this._log = null;
        this._header = null;
        this._headings = ["BID", "ASK", "\u0394POS", "\u21D2NET", "\u0394$", "\u21D2NET"];
        
        // Temporarily track current iteration of game (reset after each).
        this._netPos = 0;
        this._netCash = 0;
        this._tradeStatus = 0;

        // Bind Event handlers.
        this._onSubmit = this._onSubmit.bind(this);
        this._onRestart = this._onRestart.bind(this);
        this._concludeGame = this._concludeGame.bind(this);
    }

    /* FUNCTION: setup
     * ---------------
     * Parameters:
     *     promptParent - DOM node to append with prompt and user bid-spread input form
     *     logParent    - DOM node to append with game log
     *     statsNode    - DOM node containing player stats
     * This function sets up the prompt and game log.
     */
    setup(promptParent, logParent, statsNode) {
        this._promptParent = promptParent;
        this._logParent = logParent;
        this._setupPrompt();
        this._setupLog();
        this._statsNode = statsNode;

        // Start timer for first game.
        timer = setTimeout(this._concludeGame, 90000);
    }
    
    /* FUNCTION: _setupPrompt
     * ----------------------
     * This function sets up the prompt and user bid-spread input form.
     */
    async _setupPrompt() {
        this._form = document.createElement("form");
        this._form.classList.add("spreadContainer");
        
        this._prompt = document.createElement("p");
        this._prompt.classList.add("prompt");
        let randPrompt = await Prompt.getRand();
        this._prompt.textContent = randPrompt.question;
        this._answer = randPrompt.answer;
        
        let inputBid = this._inputHelper("bid");
        let inputAsk = this._inputHelper("ask");
        let dashContainer = document.createElement("div");
        let dash = document.createElement("span");
        dash.textContent = "-";
        dashContainer.append(dash);

        let submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "submit";
        submitButton.classList.add("spread");
        submitButton.addEventListener("click", this._onSubmit);

        this._form.append(inputBid, dashContainer, inputAsk, submitButton);
        this._promptParent.append(this._prompt, this._form);
    }

    /* FUNCTION: _inputHelper
     * ----------------------
     * Parameter: 
     *     name - name for name and placeholder attribute
     * This helper function creates and returns an input node for the user's bid-ask spread.
     */
    _inputHelper(name) {
        let inputNode = document.createElement("input");
        inputNode.name = name;
        inputNode.placeholder = name;
        inputNode.classList.add("spread");
        return inputNode;
    }
    
    /* FUNCTION: _setupLog
     * -------------------
     * This function sets up the game log header and populates it with the necessary heading names.
     */
    _setupLog() {
        this._header = document.createElement("div");
        this._header.classList.add("logContainer");

        for (let name of this._headings) {
            let headingContainer = document.createElement("div");
            let heading = document.createElement("span");
            heading.textContent = name;

            // To improve readability.
            if (name === "BID") {
                headingContainer.classList.add("boughtResult");
            }
            if (name === "ASK") {
                headingContainer.classList.add("soldResult");
            }

            headingContainer.appendChild(heading);
            this._header.appendChild(headingContainer);
        }

        let wrapper = document.createElement("div");
        let title = document.createElement("h3");
        title.textContent = "Game Log";
        wrapper.appendChild(title);
        wrapper.classList.add("gamelog");

        this._log = document.createElement("div");
        this._log.classList.add("overflow");

        this._logParent.append(wrapper, this._header, this._log);
    }

    /* FUNCTION: _makeDecision
     * -----------------------
     * Parameters:
     *     bid - user input for bid price
     *     ask - user input for ask price
     * This function takes in the user's bid and ask prices and decides upon the computer's response.
     * A normal RV is generated, and if buying or selling with respect to that value is favorable, 
     * position and cash values are adjusted accordingly. The log is updated.
     * Relevant instance vars are also updated for the next round.
     */
    _makeDecision(bid, ask) {
        let preference = randNorm(this._answer, this._answer * this._adjust);

        let changePos;
        let changeCash;
        if (ask < preference && ask !== 0) { // Computer buys from user.
            changePos = -NUM_UNITS;
            changeCash = ask;
            this._tradeStatus = 1;
        } else if (bid > preference && bid !== 0) { // Computer sells to user.
            changePos = NUM_UNITS;
            changeCash = -bid;
            this._tradeStatus = 1;
        } else { // Computer does nothing.
            changePos = 0;
            changeCash = 0;
        }
        this._addLog(bid, ask, changePos, changeCash);

        // Update adjust instance variable as necessary.
        this._updateInstance(bid, ask, changePos);
    }
    
    /* FUNCTION: _updateInstance
     * -------------------------
     * Parameters: 
     *     bid       - user input for bid price
     *     ask       - user input for ask price
     *     changePos - change in user's position according to computer's response
     * This helper function updates the adjust instance variable to increase difficulty for the next round
     * if the user has netted profit.
     */
    _updateInstance(bid, ask, changePos) {
        if (bid < this._answer && changePos === 1 || ask > this._answer && changePos === -1) {
            this._adjust = Math.max(this._adjust * ADJUST_DOWN, 0.1);
        }
    }

     /* FUNCTION: _addLog
      * -----------------
      * Parameters:
      *     bid        - user input for bid price
      *     ask        - user input for ask price
      *     changePos  - change in user's position according to computer reponse
      *     changeCash - change in user's cash according to computer response
      * This function adds a log for the round given the values for each heading.
      */
    _addLog(bid, ask, changePos, changeCash) {
        let log = document.createElement("div");
        log.classList.add("logContainer");
        log.classList.add("temp");

        let bidContainer = this._textHelper(bid, "log");
        let askContainer = this._textHelper(ask, "log");
        // For clarity, prepends '+' to changePos and changeCash if positive.
        let signedChangePos = (changePos < 0 ? "" : "+") + changePos;
        let signedChangeCash = (changeCash < 0 ? "" : "+") + changeCash;
        let changePosCont = this._textHelper(signedChangePos, "log");
        let changeCashCont = this._textHelper(signedChangeCash, "log");
        this._netPos += changePos;
        this._netCash += changeCash;
        let netPosCont = this._textHelper(this._netPos, "log");
        let netCashCont = this._textHelper(this._netCash, "log");

        // To improve readability.
        if (changePos > 0) {
            bidContainer.classList.add("bought");
            changePosCont.classList.add("boughtResult");
            changeCashCont.classList.add("boughtResult");
            
        }
        if (changePos < 0) {
            askContainer.classList.add("sold");
            changePosCont.classList.add("soldResult");
            changeCashCont.classList.add("soldResult");
        }

        log.append(bidContainer, askContainer, changePosCont, netPosCont, changeCashCont, netCashCont);
        this._log.appendChild(log);
        this._log.scrollTop = this._log.scrollHeight; // Scroll down to show latest logs.
    }
    
    /* FUNCTION: _concludeGame
     * -----------------------
     * This function handles game conclusion and provides the option to play again through a restart button.
     * The player's stats are appropriately updated and a relevant game-end message is displayed.
     */
    _concludeGame() {
        this._form.reset();
        this._prompt.classList.add("hidden");
        this._form.classList.add("hidden");

        this._updatePlayer();
        
        // Option to play again.
        let wrapper = document.createElement("div");
        wrapper.id = "restart";
        let restartButton = document.createElement("button");
        restartButton.type = "button";
        restartButton.textContent = "PLAY AGAIN";
        restartButton.addEventListener("click", this._onRestart);
        wrapper.appendChild(restartButton);
        this._promptParent.appendChild(wrapper);
    }

    /* FUNCTION: _textHelper
     * ---------------------
     * Parameters: 
     *     value      - value for textContent attribute
     *     classToAdd - single class to add to node
     * This helper function creates and returns a wrapper node for a text entry.
     */
    _textHelper(value, classToAdd) {
        let wrapper = document.createElement("div");
        wrapper.classList.add(classToAdd);
        let entry = document.createElement("span");
        entry.textContent = value;
        wrapper.appendChild(entry);
        return wrapper;
    }

    /* FUNCTION: _updatePlayer
     * -----------------------
     * This function updates player stats in the backend and updates the stats header on the page.
     * It also displays the result of the game.
     */
    async _updatePlayer() {
        let player = await Player.loadStats(this._username);
        let [ points, bonus ] = this._calculatePoints(this._netPos);
        player.points = player.points + Math.round(points) + Math.round(bonus);
        player.numPlayed++;

        // Display message.
        let gameMessage;
        let pointsMessage;
        if (points > 0) {
            player.numWins++;
            gameMessage = "Congrats! \uD83D\uDCB0";
            pointsMessage = `+${Math.round(points)} points with +${Math.round(bonus)} bonus.`;
        } else {
            gameMessage = "Better luck next time. \uD83E\uDD27";
            pointsMessage = `${Math.round(points)} points with +${Math.round(bonus)} bonus.`;
        }
        player.winRatio = (player.numWins / player.numPlayed).toFixed(2);
        let message1 = this._textHelper(gameMessage, "message");
        let message2 = this._textHelper(pointsMessage, "message");
        this._promptParent.prepend(message1, message2);

        // Update stats header.
        let updatedStats = document.createElement("h2");
        updatedStats.textContent = `${this._username}: ${player.points} points | ` +
                                   `${player.numWins} won | ${player.winRatio} win:loss ratio`;
        this._statsNode.replaceWith(updatedStats);
        this._statsNode = updatedStats;

        // Update in backend.
        await Player.updateStats(this._username, player.points, player.numWins, player.numPlayed, player.winRatio);
    }

    /* FUNCTION: _calculatePoints
     * --------------------------
     * Parameter:
     *     netPos - final accumulated position
     * This helper function calculates the normalized point total (to adjust for differing scales of prompt answers) at game conclusion. 
     */
    _calculatePoints(netPos) {
        let netProfit = this._netCash + this._netPos * this._answer;
        let bonus = this._tradeStatus === 1 ? Math.max(0, 90 / Math.pow((Math.abs(this._netPos) + 1), 2))  : 0;
        return [ Math.max(netProfit * 100 / this._answer, -100), bonus ];
    }

    
    /* EVENT HANDLERS */

    /* FUNCTION: _onSubmit
     * -------------------
     * This event handler takes the user's input bid-ask spread and parses the bid and ask values as floats. 
     * It then calls on _makeDecision for the computer to consider the spread.
     */
    _onSubmit(event) {
        event.preventDefault();
        this._form.bid.focus();
        let bid = parseFloat(this._form.bid.value);
        let ask = parseFloat(this._form.ask.value);
        this._form.reset();

        // In case of invalid user input.
        if (isNaN(ask) || isNaN(bid) || ask < 0 || bid < 0 || ask < bid) {
            return;
        }

        this._makeDecision(bid, ask);
    }
    
    /* FUNCTION: _onRestart
     * --------------------
     * This event handler sets up a new iteration of the game with another random prompt.
     */
    async _onRestart(event) {
        this._prompt.classList.remove("hidden");
        this._form.classList.remove("hidden");     
        while (document.querySelector(".message")) {
            document.querySelector(".message").remove();
        }
        document.querySelector("#restart").remove();
        while (document.querySelector(".temp")) {
            document.querySelector(".temp").remove();
        }

        let newPrompt = await Prompt.getRand();
        this._prompt.textContent = newPrompt.question;
        this._answer = newPrompt.answer;

        // Reset temporary instance variables.
        this._netPos = 0;
        this._netCash = 0;
        this._tradeStatus = 0;
        
        this._form.bid.focus();
        // Restart timer.
        timer = setTimeout(this._concludeGame, 90000);
    }
}
