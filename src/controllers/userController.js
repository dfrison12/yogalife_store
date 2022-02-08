const db = require ("../database/models");
const Op = db.Sequelize.Op;
const  sequelize = db.sequelize

const fs = require('fs');
const path = require('path');
const bcryptjs = require('bcryptjs');
const { validationResult } = require('express-validator')

//Aqui tienen otra forma de llamar a cada uno de los modelos
const User = db.User;
const UserCategory = db.UserCategory;


const userController = {
    // - Login - Formulario - Mostrar  
    login: (req, res) => {
        res.render('login')
    },
    // - Register - Formulario - Mostrar
    register: (req, res) => {
        let promCategory = UserCategory.findAll()
        
        Promise
        .all([promCategory])
        .then(([allCategoriesUser]) => {
            return res.render(path.resolve(__dirname, '..', 'views',  'register'), {allCategoriesUser})})
        .catch(error => res.send(error))
    },

    // Procesar login
    loginProcces: (req,res) => {
        let userLogin = User.findOne({
            where: {
                email: req.body.email
            }
        })
        Promise
        .all([userLogin])
        .then((userLog) =>{
            let userToLogin = userLog[0].dataValues
            
            if(userToLogin.email == req.body.email) {
                let isOkPassword = bcryptjs.compareSync(req.body.password, userToLogin.password)
                if (isOkPassword){
                    delete userToLogin.password
                    req.session.userLogged = userToLogin
    
                    if (req.body.rememberUser){
                        res.cookie('userEmail', req.body.email, {maxAge: (1000 * 60) * 60})
                    }
                
                    return res.redirect("/")
                }
            }
            return res.render('login', {
                errors: {
                    email: {
                        msg: 'El usuario o contraseña son invalidos'
                    }
                }
            })
        })
        .catch(error => {
            return res.render ('login',{
                errors: {
                    email: {
                        msg: 'El usuario o contraseña son invalidos'
                    }
                }
            })})
        
    },

    profile: (req,res) => {
        
        let user = req.session.userLogged
        console.log(user)
        return res.render('userProfile',{user})
    },

    logout: (req, res) => {
        res.clearCookie('userEmail')
        req.session.destroy();
        return res.redirect('/');
    },

    // Register - Formuario - Enviar datos
    createUser: (req, res) => {
        const resultValidation = validationResult(req);
        if (resultValidation.errors.length > 0) {
            return res.render('register', {
                errors: resultValidation.mapped(),
                oldData: req.body
            });
        }

        let image
        console.log(req.files);
        if (req.files[0] != undefined) {
            image = req.files[0].filename
        } else {
            image = 'user-default.jpg'
        }


        
        /*let userdb1 = User.findOne({
            where: {
                email: req.body.email}
        })


        Promise
        .all([userdb1])
        .then((user1) =>{
            if (user1 > 0){
                res.render('register', {
                errors: {
                    email: {
                        msg: 'Este Email ya esta registrado'
                    }
                },
                oldData: req.body
            })
            }*/
            
         User.create({
                    email: req.body.email,
                    password: bcryptjs.hashSync(req.body.password),
                    full_name: req.body.fullname,
                    dni: req.body.dni,
                    user_category_id: req.body.user_category_id,
                    address: req.body.address,
                    avatar: image
        })
        .then (() => {
            return res.redirect('/user/login')
        })
        .catch(error => res.send(error))
        


        /*if (userInDB) {
            return res.render('register', {
                errors: {
                    email: {
                        msg: 'Este email ya esta registrado'
                    }
                },
                oldData: req.body
            });
        }


        let userToCreate = {
            ...req.body,
            password: bcryptjs.hashSync(req.body.password,12),
            image: image
        }

        User.create(userToCreate);
        return res.redirect('/user/login')

        /*let user = {
            id: usuario[usuario.length - 1].id + 1,
            name: req.body.name,
            lastname: req.body.lastname,
            birthDate: req.body.birthDate,
            email: req.body.email,
            password: req.body.password,
            passwordConfirmation: req.body.passwordConfirmation,
            image: image
        }
        usuario.push(user)
        fs.writeFileSync(userFilePath, JSON.stringify(usuario, null, ''))
        res.redirect('/')*/
    },

    //CONTROLLER - PARA BASE DE DATOS
    list: (req,res)=> {
        db.User.findAll({
            include:[{association:"user_categories"}]
        })
            .then(users =>{
                res.render("listadoUsuarios", {users:users})
            })
    }
}
module.exports = userController;