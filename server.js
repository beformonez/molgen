const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", socket => {
  console.log("User connected", socket.id);

  socket.on("move", data => {
    socket.broadcast.emit("playerMove", { id: socket.id, ...data });
  });

  socket.on("disconnect", () => {
    io.emit("playerDisconnect", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Server running on port", PORT));