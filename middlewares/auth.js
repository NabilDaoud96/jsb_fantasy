const jwt = require("jsonwebtoken");
require('dotenv').config()
const {User} = require('../database')

async function Auth(req, res, next) {
    return next()
    if (req.url !== "/login") {
        if (req.headers.authorization) {    
            const token = req.headers.authorization.split(' ')[1]
	        try {
	            const {id} = jwt.verify(token, process.env.ACCESS_TOKEN)
                const user = await User.findByPk(id)
                if (user) req.user = user
                else {
                    return res.status(401).send()
                } 
            } 
            catch (e) {
	            return res.status(401).send()
            }
            next()
        }
        else res.status(401).send()
    }
    else next()
}

module.exports = Auth