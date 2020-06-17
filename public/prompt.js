/* FILE: Prompt.js
 * Author: leekathy
 * This file contains the Prompt class. The methods allow for the retrieval of a random prompt and
 * the addition of a user input prompt to the database of prompts.
 */

import apiRequest from "./api.js";

export default class Prompt {
    
    constructor(data) {
        this.contributor = data.contributor;
        this.question = data.question;
        this.answer = data.answer;
    }

    /* FUNCTION: getRand
     * -----------------
     * This function retrieves a random prompt.
     */
    static async getRand() {
        let [status, data] = await apiRequest("GET", "/prompts");
        
        if (status !== 200) {
            throw new Error("Failed to retrieve a prompt.");
        }
        
        return new Prompt(data);
    }

    /* FUNCTION: getRand
     * -----------------
     * This function adds a user input prompt into the database of prompts.
     */
    static async addPrompt(contributor, question, answer) {
        let [status,] = await apiRequest("POST", "/prompts",
                                         { contributor: contributor, question: question, answer: answer });
        
        if (status !== 200) {
            throw new Error("Failed to add it :(");
        }
    }
}
