const { User, Squad } = require('../database');
const { Op } = require('sequelize')
const jwt = require("jsonwebtoken");

async function all(req, res) {
    const result = (await User.findAll({})).map(i => i.toJSON());
    res.status(200).send(result)
}

async function show(req, res) {
    const result = (await User.findByPk(req.params.id, {
        attributes: {exclude: ['password']}
    })).toJSON()
    res.status(200).send(result)
}


async function auth(req, res) {
    const user = (await User.findByPk(req.user?.id, {
        attributes: {exclude: ['password']}
    })).toJSON()
    let squadNumber = await Squad.count({
        userId: req.user?.id
    })
    res.status(200).send({...user, squadNumber})
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
    if (!validateEmail(req.body.email)) return res.status(400).json({
        success: false,
        errorMessage: "Email invalide",
        field: 'email'
    });

    const emailExists = await User.findOne({
        where: {
            id: { [Op.not]: req.body.id },
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
            id: { [Op.not]: req.body.id },
            team: req.body.team
        }
    })

    if (teamExists) return res.status(400).json({
        success: false,
        errorMessage: "Cette equipe existe déjà",
        field: 'team'
    });

    const user = await User.findByPk(req.body.id)
    if(req.user.role === 'admin') await user.update(req.body);
    else await user.update({...user.toJSON(), team: req.body.team});

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
    delete: deleteUser,
    auth
}