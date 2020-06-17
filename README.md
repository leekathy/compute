# Compute
**A simple market-making app by leekathy\
Live here: <http://computemm.herokuapp.com>**\
\
A responsive single page application with a vanilla Javascript frontend and a REST API backend created with Node.js (Express). MongoDB used for data storage and retrieval.\
Supports player signup (incl. salted, hashed passwords), login, stats updates, leaderboards, and contributions to the prompts database. Each game iteration lasts 90 seconds and may be consecutively played.
## Build instructions
After navigating to the project directory, execute the following in the command line:
```
npm install
npm run setup
npm start
```