const jwt = require("jsonwebtoken");
require('dotenv').config()
const {User} = require('../database')

async function Auth(req, res, next) {
    if (req.url !== "/login" && req.url !== "/admin-login" && req.url !== "/register") {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1]
	        try {
	            const {id, role} = jwt.verify(token, jsb_root)
              if(role === 'admin') {
                req.user = {role: "admin"};
                next()
                return
              }
              const user = await User.findByPk(id)
              if (user) req.user = user.toJSON()
              else return res.status(401).send()
            }
            catch (e) {
	            return res.status(401).send()
            }
            next()
        } else res.status(401).send()
    } else next()
}

module.exports = Auth