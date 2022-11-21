import { v4 as uuidV4 } from "uuid"
import bcrypt from "bcrypt"
import{collectionUser,  collectionTransaction, validacaoSchema, db } from "../index.js"

export async function postLogin (req, res){
    const { email, password } = req.body
    const token = uuidV4()

    try {
        const user = await collectionUser.findOne({ email })
        if (!user) {
            res.status(401).send("Não autotizado")
            return;
        }

        const passwordOk = bcrypt.compareSync(password, user.password)
        if (!passwordOk) {
            res.status(401).send("Não autorizado")
            return
        }

        const tokenExist = await db.collection("sessions").findOne({ userId: user._id })
        if (!tokenExist) {
            await db.collection("sessions").insertOne({
                token,
                userId: user._id
            })
            res.send({ token, name: user.name })
            return;
        }
        res.send({ token: tokenExist.token, name: user.name })


    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

}

export async function postUsuario (req, res){
    const { name, email, password, confirmedPassword } = req.body

    const validation = validacaoSchema.validate({ email, name, password }, { abortEarly: false })

    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message)
        res.status(400).send(erros)
        return;
    }

    try {
        const user = await collectionUser.findOne({ email })

        if (user != null) {
            res.status(409).send("email já cadastrado!")
            return;
        }

        if (password != confirmedPassword) {
            res.status(400).send("senhas diferentes")
            return;
        }
        const hashPassword = bcrypt.hashSync(password, 10)
        console.log(hashPassword)

        await collectionUser.insertOne({ name, email, password: hashPassword })
        res.sendStatus(201)



    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

}
