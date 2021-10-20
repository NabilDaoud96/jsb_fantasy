const { User, Squad } = require('../database');
const { Op } = require('sequelize')
const jwt = require("jsonwebtoken");

async function all(req, res) {
    const result = (await User.findAll({
        include: [{ model: Squad, as: 'squads' }]
    })).map(i => i.toJSON());
    res.status(200).send(result)
}

async function show(req, res) {
    const result = (await User.findByPk(req.params.id)).toJSON()
    res.status(200).send(result)
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

        if (teamExists) return res.status(400).json({
            success: false,
            errorMessage: "Cette equipe existe déjà",
            field: 'team'
        });


        let user = await User.create(req.body)
        const accessToken = jwt.sign({
            id: user.toJSON().id,
            username: user.toJSON().username
        }, process.env.ACCESS_TOKEN)
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
    const usernameExists = await User.findOne({
        where: {
            id: {
                [Op.not]: req.body.id },
            username: req.body.username
        }
    })

    if (usernameExists) return res.status(400).json({
        success: false,
        errorMessage: "Ce nom d'utilisateur existe déjà",
        field: 'username'
    });


    const fullNameExists = await User.findOne({
        where: {
            id: {
                [Op.not]: req.body.id },
            fullName: req.body.fullName
        }
    })

    if (fullNameExists) return res.status(400).json({
        success: false,
        errorMessage: "Nom existe déjà",
        field: 'fullName'
    });

    await User.update(req.body, { where: { id: req.body.id } });

    res.status(204).send()
}

async function deleteUser(req, res) {
    const user = await User.findByPk(req.params.id)
    await user.destroy()
    res.status(204).send()
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
    delete: deleteUser
}