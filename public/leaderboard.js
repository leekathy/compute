/* FILE: leaderboard.js
 * Author: leekathy
 * This file contains the Leaderboard class, which handles the points and win ratio leaderboards.
 */

import apiRequest from "./api.js";

export default class Leaderboard {
    
    constructor(data) {
        [ this._pointsLeaders, this._ratioLeaders ] = data;
        this._numToRank = null;
    }

    /* FUNCTION: loadTop
     * -----------------
     * Parameter:
     *     numToRank - number of players to rank
     * This function returns a Leaderboard for the desired number (or all if not enough)
     * of top players (points, win ratio).
     */
    static async loadTop(numToRank) {
        this._numToRank = numToRank;
        let [status, data] = await apiRequest("GET", `/leaderboard?num=${this._numToRank}`);
        return new Leaderboard(data);
    }

    /* FUNCTION: create
     * ----------------
     * Parameter:
     *     leaderboardParent - DOM element to append leaderboard
     * This function creates and appends a leaderboard for points and win ratios.
     */
    create(leaderboardParent) {//up to numToRankmany
        let leaderboard = document.createElement("div");
        leaderboard.classList.add("leaderboard");
        let title = document.createElement("h3");
        title.textContent = "Leaderboard";
        leaderboard.appendChild(title);
        leaderboardParent.appendChild(leaderboard);

        this._addRankAttr(leaderboardParent, "points", this._pointsLeaders);
        this._addRankAttr(leaderboardParent, "win ratio", this._ratioLeaders);
    }

    /* FUNCTION: _addRankAttr
     * ----------------------
     * Parameters:
     *     leaderboardParent - DOM element to append leaderboard
     *     rankAttr          - attribute to rank by
     *     playerList        - list of top players for that rank attribute
     * This function creates and appends top players for a single rank attribute.
     */
    _addRankAttr(leaderboardParent, rankAttr, playerList) {
        let headings = this._leaderHelper("position", "username", rankAttr);
        headings.classList.add("rankHeadings");
        leaderboardParent.appendChild(headings);

        let count = 0;
        for (let leader of playerList) {
            console.log(leader);
            if (count === this._numToRank) {
                break;
            }
            
            let rank;
            if (count === 0) {
                rank = "\u00A0\uD83E\uDD47";
            } else if (count === 1) {
                rank = "\u00A0\uD83E\uDD48";
            } else if (count === 2) {
                rank = "\u00A0\uD83E\uDD49";
            } else {
                rank = `${count + 1}`;
            }
            leaderboardParent.appendChild(this._leaderHelper(rank, leader[0], leader[1]));
            count++;    
        }
    }

    /* FUNCTION: _leaderHelper
     * -----------------------
     * Parameters: 
     *     position - position of player for given rank attribute
     *     username - username of top player
     *     rankAttr - attribute used to rank
     * This helper function creates and returns a wrapper node for a given top player.
     */
    _leaderHelper(position, username, rankAttr) {
        let wrapper = document.createElement("div");
        wrapper.classList.add("leaderCont");
        
        let positionContainer = this._textHelper(position);
        positionContainer.classList.add("position");
        let usernameContainer = this._textHelper(username);
        let rankAttrContainer = this._textHelper(rankAttr);
        rankAttrContainer.classList.add("rankAttr");
        
        wrapper.append(positionContainer, usernameContainer, rankAttrContainer);
        return wrapper;
    }

    /* FUNCTION: _textHelper
     * ---------------------
     * Parameter:
     *     text - text to add as content
     * This helper function creates and returns a wrapper node for a text entry.
     */
    _textHelper(text) {
        let wrapper = document.createElement("div");
        let textElem = document.createElement("span");
        textElem.textContent = text;
        wrapper.appendChild(textElem);
        return wrapper;
    }
};
