/* FILE: index.js
 * Author: leekathy
 * This file implements the REST API backend for Compute using Node.js with Express. 
 * Data is stored and retrieved in a MongoDB database.
 */

"use strict";

const crypto = require("crypto");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const { MongoClient } = require("mongodb");
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost";

let api = express.Router();
let DATABASE_NAME = "compute";
let conn;
let db;
let Players;
let Prompts;

module.exports = async (app) => {
    app.set("json spaces", 2);

    conn = await MongoClient.connect(MONGODB_URL, { useUnifiedTopology: true });
    db = conn.db(DATABASE_NAME);
    Players = db.collection("players");
    Prompts = db.collection("prompts");
    
    app.use("/api", api);
};

/* Allow requests from any origin */
api.use(cors());
/* Parse request bodies as JSON */
api.use(bodyParser.json());

/* Confirms API running */
api.get("/", (req, res) => {
    res.json({ success: true });
});


/* FOR API REQUESTS RELEVANT TO PLAYER CLASS */

/* GET request: shows all player usernames */
api.get("/players", async (req, res) => {
    let players = await Players.find().toArray();
    players = players.map(player => player.username);
    res.json({ players: players });
});

/* POST request: adds new Player with provided username and salted, hashed password */
api.post("/players", async (req, res) => {
    let { username, password } = req.body;

    if (await Players.findOne({ username: username })) {
        res.status(400).json({ error: "Username already taken." });
        return;
    }

    let hash = crypto.createHash("sha256");
    let salt = crypto.randomBytes(8).toString("base64");
    let hashedPassword = hash.update(salt).update(password).digest("base64");
    await Players.insertOne({ username: username, salt: salt, hashedPassword: hashedPassword,
                              points: 500, numWins: 0, numPlayed: 0, winRatio: 0});
    
    let player = await Players.findOne({ username: username });
    res.json(player);
});

/* MIDDLEWARE: finds player */
api.use("/players/:username", async (req, res, next) => {
    let username = req.params.username;
    let player = await Players.findOne({ username: username });
    
    if (!(player)) {
        res.status(404).json({ error: "A player with this username does not exist." });
        return;
    }
    
    res.locals.player = player;
    next();
});

/* GET request: gets Player's stats */
api.get("/players/:username", async (req, res) => {
    let { points, numWins, numPlayed, winRatio } = res.locals.player;
    res.json({ points, numWins, numPlayed, winRatio });
});

/* FUNCTION: isCorrect
 * -------------------
 * Parameters:
 *     player   - Player with the user input username
 *     password - user input password
 * This function return true if the user input password matches that for the user input username 
 * and false otherwise.
 */
const isCorrectPassword = (player, password) => {
    let hash = crypto.createHash("sha256");
    hash.update(player.salt).update(password);
    return hash.digest("base64") === player.hashedPassword;
}

/* POST request: validates Player */
api.post("/players/:username", async (req, res) => {
    let player = res.locals.player;
    let password = req.body.password;

    if (!(isCorrectPassword(player, password))) {
        res.status(400).json({ error: "Incorrect password." });
        return;
    }
    
    res.json(player);
});

/* PATCH request: Updates player stats */
api.patch("/players/:username", async (req, res) => {
    let player = res.locals.player;
    let username = player.username;
    
    let newPoints = req.body.points;
    let newNumWins = req.body.numWins;
    let newNumPlayed = req.body.numPlayed;
    let newWinRatio = req.body.winRatio;
    player.points = newPoints;
    player.numWins = newNumWins;
    player.numPlayed = newNumPlayed;
    player.winRatio = newWinRatio;

    await Players.replaceOne({ username: username}, player);
    res.json({ success: true }); 
});


/* FOR API REQUESTS RELEVANT TO PROMPT CLASS */

/* GET request: Gets a random prompt */
api.get("/prompts", async(req, res) => {
    let total = await Prompts.countDocuments();
    let randId = randInRange(0, total);
    let prompt = await Prompts.findOne({ id: randId });
    res.json(prompt);
});

/* FUNCTION: randInRange
 * ---------------------
 * Parameters:
 *     min - lower bound
 *     max - upper bound
 * This function returns an integer in between the min (included) and max (not included).
 */
const randInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
}

/* POST request: Adds a user input prompt */
api.post("/prompts", async(req, res) => {
    let contributor = req.body.contributor;
    let question = req.body.question;
    let answer = req.body.answer;

    let total = await Prompts.countDocuments();
    let nextId;
    if (total === 0) {
        nextId = 0;
    } else {
        let lastInserted = await Prompts.findOne({}, { sort: {id: -1} });
        nextId = lastInserted.id + 1;
    }
    
    await Prompts.insertOne({ id: nextId, contributor: contributor, question: question, answer: answer });
    let prompt = await Prompts.findOne({ id: nextId });
    res.json(prompt);
});


/* FOR API REQUESTS RELEVANT TO LEADERBOARD CLASS */

/* GET request: gets the top specified number of players by points and by win ratio */
api.get("/leaderboard", async (req, res) => {
    let numToRank = parseInt(req.query.num);
    let cursorPoints = await Players.aggregate([ { $sort: { points: -1 } }, { $limit : numToRank } ]);
    let cursorRatio = await Players.aggregate([ { $sort: { winRatio: -1 } }, { $limit : numToRank } ]);
    
    let leadersPoints = [];
    let leadersRatio = [];
    await cursorPoints.forEach(topPlayer => leadersPoints.push([ topPlayer.username, topPlayer.points ]));
    await cursorRatio.forEach(topPlayer => leadersRatio.push([ topPlayer.username, topPlayer.winRatio ]));
    res.json([ leadersPoints, leadersRatio ]);
});
