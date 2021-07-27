const { app } = require('electron')

app.whenReady().then(async () => {
  const {Server} = require("./server/server.js")
  const server = new Server();
  await server.load();
})