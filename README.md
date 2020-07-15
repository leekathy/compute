# Compute
**A simple market-making app by leekathy\
Live here: <http://computemm.herokuapp.com>**\
\
A responsive single page application with a vanilla Javascript frontend and a REST API backend created with Node.js (Express). MongoDB used for data storage and retrieval.\
Supports player signup (incl. salted, hashed passwords), login, stats updates, leaderboards, and contributions to the prompts database. Each game iteration lasts 90 seconds and may be consecutively played.

## Game description
Each iteration of the game has a single prompt (trivia) with a juxtaposed game log and lasts 90 seconds (unlimited rounds). \
During each round, the user submits a bid-ask spread, and the computer responds by selling 1 unit at the bid price, buying at the ask price, or doing neither. In the game log, bid and ask history, change in user's position and cash, and accumulated position and cash are recorded.\
\
To simulate varying risk preferences, the computer considers, against the input bid-ask spread, a generated normal RV with mean and standard deviation of the prompt's true value and (true_value * difficulty_adjustment), respectively. Let this be P, the stock price valuation by the computer in this particular round. The computer will sell 1 unit at the bid price if P < bid, buy 1 unit at the ask price if P > ask, or refuse to trade if neither.\
To simulate competing bid-ask spreads, after each round in which the user has successfully bought for < true value or sold for > true value, the difficulty is adjusted to force a tighter market.\
After 90 seconds, the accumulated position (bonus if negligible) is liquidated, and the player wins upon realizing a net profit.
## Build instructions
After navigating to the project directory, execute the following in the command line:
```
npm install
npm run setup
npm start
```
