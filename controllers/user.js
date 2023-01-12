const { User, Squad } = require('../database');
const { Op } = require('sequelize')
const jwt = require("jsonwebtoken");

async function all(req, res) {
    try{
        const result = (await User.findAll({
            order: [['id', 'DESC']],
        })).map(i => i.toJSON());
        res.status(200).send(result)
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            errorMessage: 'Unknown server error while listing users',
            errorMessageKey: 'SERVER_ERROR'
        });
    }
}

async function show(req, res) {
    try{
        const result = (await User.findByPk(req.params.id, {
            attributes: {exclude: ['password']}
        })).toJSON()
        res.status(200).send(result)
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            errorMessage: 'Unknown server error while getting user',
            errorMessageKey: 'SERVER_ERROR'
        });
    }
}


async function auth(req, res) {
    try{
        const user = (await User.findByPk(req.user?.id, {
            attributes: {exclude: ['password']}
        })).toJSON()
        console.log(1111, {user: req.user})
        let squadNumber = await Squad.count({
            where:{
                userId: req.user?.id
            }
        })
        console.log(11111, {squadNumber})
        res.status(200).send({...user, squadNumber})
    }catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            errorMessage: 'Unknown server error while auth user',
            errorMessageKey: 'SERVER_ERROR'
        });
    }
}

async function create(req, res) {

    try {

        if (!validateEmail(req.body.email)) return res.status(400).json({
            success: false,
            errorMessage: "Email invalide",
            field: 'email'
        });

        const emailExists = await User.findOne({
            where: { email: req.body.email }
        })

        if (emailExists) return res.status(400).json({
            success: false,
            errorMessage: "Cet email existe déjà",
            field: 'email'
        });


        const teamExists = await User.findOne({
            where: { team: req.body.team }
        })

        if (teamExists) return res.status(400).json({
            success: false,
            errorMessage: "Cette equipe existe déjà",
            field: 'team'
        });

        let user = await User.create(req.body)
        const accessToken = jwt.sign({
            id: user.toJSON().id,
            username: user.toJSON().username
        }, jsb_root)
        res.status(200).send(accessToken)
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            errorMessage: 'Unknown server error while creating user',
            errorMessageKey: 'SERVER_ERROR'
        });
    }
}

async function update(req, res) {
    try{
        if (!validateEmail(req.body.email)) return res.status(400).json({
            success: false,
            errorMessage: "Email invalide",
            field: 'email'
        });

        const emailExists = await User.findOne({
            where: {
                id: {[Op.not]: req.body.id},
                email: req.body.email
            }
        })

        if (emailExists) return res.status(400).json({
            success: false,
            errorMessage: "Cet email existe déjà",
            field: 'email'
        });


        const teamExists = await User.findOne({
            where: {
                id: {[Op.not]: req.body.id},
                team: req.body.team
            }
        })

        if (teamExists) return res.status(400).json({
            success: false,
            errorMessage: "Cette equipe existe déjà",
            field: 'team'
        });

        const user = await User.findByPk(req.body.id)
        if (req.user.role === 'admin') await user.update(req.body);
        else await user.update({...user.toJSON(), team: req.body.team});

        res.status(204).send()
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            errorMessage: 'Unknown server error while updating user',
            errorMessageKey: 'SERVER_ERROR'
        });
    }
}

async function deleteUser(req, res) {
    try{
        const user = await User.findByPk(req.params.id)
        await user.destroy()
        res.status(204).send()
    }catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            errorMessage: 'Unknown server error while deleting user',
            errorMessageKey: 'SERVER_ERROR'
        });
    }
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

module.exports = {
    all,
    show,
    create,
    update,
    delete: deleteUser,
    auth
}