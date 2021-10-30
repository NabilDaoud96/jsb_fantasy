const {User} = require('../database')
const { compareSync } = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config()

const loginController = {
    login: async (req, res) => {
        try{
            const {email, password} = req.body;
            const user = await User.findOne({
                where: {email: email},
            })
            if (user && compareSync(password, user.password)) {
                const accessToken = jwt.sign({
                    id: user.toJSON().id,
                    email: user.toJSON().email,
                    role: 'user'
                }, process.env.ACCESS_TOKEN)
                res.status(200).send(accessToken)
            } else res.status(400).send('Username or password incorrect')
        }
        catch (e) {
            console.log(e)
            return res.status(500).json({
                success: false,
                errorMessage: 'Unknown server error while logging user',
                errorMessageKey: 'SERVER_ERROR'
            });
        }
    },
    adminLogin: async (req, res) => {
        try{
            const {username, password} = req.body;
            if (username === process.env.USERNAME && password === process.env.PASSWORD) {
                const payload = {
                    role: "admin"
                }
                const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN)
                res.status(200).send(accessToken)
            } else {
                res.status(401).send('Username or password incorrect')
            }
        }
        catch (e) {
            console.log(e)
            return res.status(500).json({
                success: false,
                errorMessage: 'Unknown server error while loggig admin',
                errorMessageKey: 'SERVER_ERROR'
            });
        }
    },
}

module.exports = loginController