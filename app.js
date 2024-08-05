const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkUsername = `
    SELECT * 
    FROM user
    WHERE username = '${username}';
    `;
  let dbRes = await database.get(checkUsername);
  if (dbRes === undefined) {
    const createUser = `
    INSERT INTO user(username,name,password,gender,location) 
    VALUES (
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
    )`;

    if (password.length <= 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const dbRes = await database.run(createUser);
      res.status(200);
      res.send("User created successfully");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

//API 2

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const checkUsername = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await database.get(checkUsername);
  if (dbUser == undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const getUserDetails = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await database.get(getUserDetails);
  const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatch === false) {
    res.status(400);
    res.send("Invalid current password");
  } else {
    const changedPassword = await bcrypt.hash(newPassword, 10);
    if (newPassword.length <= 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const updateDetails = `UPDATE user SET password='${changedPassword}' WHERE username='${username}'`;
      const dbRes = await database.run(updateDetails);
      res.send("Password updated");
    }
  }
});

module.exports = app;
