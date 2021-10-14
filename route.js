const express = require('express')
const router = express.Router()
const userController = require('./controllers/user')
const teamController = require('./controllers/team')
const playerController = require('./controllers/player')
const loginController = require('./controllers/login')
const matchController = require('./controllers/match')
const squadController = require('./controllers/squad')
const pointsController = require('./controllers/points')
const roundsController = require('./controllers/rounds')


// Login
router.post("/login", loginController.login)
router.post("/admin-login", loginController.adminLogin)

// Users
router.get("/users", userController.all)
router.get("/users/:id", userController.show)
router.post("/users", userController.create)
router.put("/user-update", userController.update)
router.delete("/users/:id", userController.delete)

// Teams
router.get("/teams", teamController.all)
router.get("/teams/:id", teamController.show)
router.post("/teams", teamController.create)
router.put("/team-update", teamController.update)
router.delete("/teams/:id", teamController.delete)

// Players
router.get("/players", playerController.all)
router.get("/players/:id", playerController.show)
router.post("/players", playerController.create)
router.put("/player-update", playerController.update)
router.delete("/players/:id", playerController.delete)

// Matches
router.get("/matches", matchController.all)
router.get("/matches/:id", matchController.show)
router.post("/matches", matchController.create)
router.put("/match-update", matchController.update)
router.delete("/matches/:id", matchController.delete)

// Squads
router.get("/squads", squadController.all)
router.get("/squads/:id", squadController.show)
router.post("/squads", squadController.create)
router.delete("/squads/:id", squadController.delete)

// rounds
router.get("/rounds", roundsController.all)
router.get("/rounds/:id", roundsController.show)
router.post("/rounds", roundsController.create)
router.put("/round-update", roundsController.update)
router.delete("/rounds/:id", roundsController.delete)


// Points

router.post("/start-points-calculation", pointsController.pointCalculation)




module.exports = router

