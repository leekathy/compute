/* FILE: player.js
 * Author: leekathy
 * This file contains the Player class, which handles account creation and login through username 
 * and password and the update of player stats.
 */

import apiRequest from "./api.js";
import { UsernameException, PasswordException } from "./exceptions.js";

export default class Player {

    constructor(data) {
        this.username = data.username;
        this.salt = data.salt;
        this.hashedPassword = data.hashedPassword;
        this.points = data.points;
        this.numWins = data.numWins;
        this.numPlayed = data.numPlayed;
        this.winRatio = data.winRatio;
    }

    /* FUNCTION: isTaken
     * -----------------
     * Parameter:
     *     username - username to check if taken
     * This function returns true if the username is already taken and false otherwise.
     */
    static async isTaken(username) {
        let [, data] = await apiRequest("GET", "/players");
        for (let taken of data.players) {
            if (taken === username) {
                return true;
            }
        }
        
        return false;
    }

    /* FUNCTION: create
     * ----------------
     * Parameters:
     *     username - username of Player to create (assumed to be well-formed)
     *     password - password of Player to create (assumed to be well-formed)
     * This function creates and returns a new Player.
     */
    static async create(username, password) {
        let [status, data] = await apiRequest("POST", "/players", { username: username, password: password });
        
        if (status !== 200) {
            throw new UsernameException("Username already taken.");
        }
        
        return new Player(data);
    }
    
    /* FUNCTION: validate
     * ------------------
     * Parameters:
     *     username - username of Player to load (assumed to be well-formed)
     *     password - user input password (assumed to be well-formed)
     * This function returns an existing Player if the password is correct.
     */
    static async validate(username, password) {
        let [status, data] = await apiRequest("POST", `/players/${username}`, { password: password });

        if (status === 404) {
            throw new UsernameException("A player with this username does not exist");
        }   
        if (status !== 200) {
            throw new PasswordException("Incorrect password.");
        }
        
        return new Player(data);
    }

    /* FUNCTION: loadStats
     * -------------------
     * Parameter:
     *     username - username to look up stats of
     * This function returns an Object containing the Player's current points, number of wins, 
     * number of games played, and win ratio.
     */    
    static async loadStats(username) {
        let [status, data] = await apiRequest("GET", `/players/${username}`);
        
        if (status !== 200) {
            throw new UsernameException("A player with this username does not exist");
        }

        return data;
    }

    /* FUNCTION: updateStats
     * ---------------------
     * Parameter:
     *     username - username to update stats of
     * This function updates the player's stats in the backend.
     */
    static async updateStats(username, points, numWins, numPlayed, winRatio) {
        let [status,] = await apiRequest("PATCH", "/players/" + username,
                                         { points: points, numWins: numWins, numPlayed: numPlayed, winRatio: winRatio });
        
        if (status !== 200) {
            throw new UsernameException("A player with this username does not exist");
        }                                     
    }
}
