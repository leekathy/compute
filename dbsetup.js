// FILE: dbsetup.js
// Author: leekathy
// This is a script file to initialize Compute's Mongo DB.
// Use "npm run setup" during the build process.

use compute
db.players.insertOne({ "username" : "sample1", "salt" : "xrFphrATk/Y=", "hashedPassword" : "CuwAbnd5OdRHyeRtxk1Ooz7sIAsWRJwSi8L3QRFE2rY=", "points" : 500, "numWins" : 0, "numPlayed" : 0, "winRatio" : 0 })
db.players.insertOne({ "username" : "sample2", "salt" : "L3v4aiMlfL0=", "hashedPassword" : "rzYK+QIX4dOlzeEeMCdBddmUeHCkZDvX0pGqwW3Vecc=", "points" : 500, "numWins" : 0, "numPlayed" : 0, "winRatio" : 0 })
db.players.insertOne({ "username" : "sample3", "salt" : "sfHvpyVmxMM=", "hashedPassword" : "MzDkScnVXE/4XKTbFIjehT8Ibd7WYQsd4GDRbUfGxNI=", "points" : 500, "numWins" : 0, "numPlayed" : 0, "winRatio" : 0 })
db.prompts.insertOne({ "id" : 0, "contributor" : "sample1", "question" : "Number of windows in Empire State Building?", "answer" : 6514 })
db.prompts.insertOne({ "id" : 1, "contributor" : "sample2", "question" : "Population of USA (2019)?", "answer" : 328200000 })
db.prompts.insertOne({ "id" : 2, "contributor" : "sample3", "question" : "Number of Stanford undergrads (Fall 2019)?", "answer" : 6994 })
