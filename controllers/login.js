const {User} = require('../database')
const { compareSync } = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config()

const loginController = {
    login: async (req, res) => {
        const { username, password } = req.body;
        const user = await User.findOne({
            where: {username, password},
        })
        if (!user) return res.status(401).send('Username or password incorrect')
        const accessToken = jwt.sign({
            id: user.toJSON().id,
            username: user.toJSON().username
        }, process.env.ACCESS_TOKEN)
        res.status(200).send(accessToken)
    },
    adminLogin: async (req, res) => {
        const { username, password } = req.body;
        if(username === process.env.USERNAME && password === process.env.PASSWORD){
            const payload = {
                role: "admin"
            }
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN)
            res.status(200).send(accessToken)
        }
        else {
            res.status(401).send('Username or password incorrect')
        }
    },
}

module.exports = loginController