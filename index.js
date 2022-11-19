import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";

const validacaoSchema = joi.object({
    email: joi.string().required().email(),
    name: joi.string().required(),
})

const transactionSchema = joi.object({
    value: joi.number().required(),
    description: joi.string().required().min(3),
    type: joi.string().valid("entrada", "saida").required()
})

const app = express()
dotenv.config()
app.use(cors())
app.use(express.json())

const mongoClient = new MongoClient(process.env.MONGO_URI)

try {
    await mongoClient.connect()
    console.log("MongoDb Conectado")
} catch (err) {
    console.log(err)
}

const db = mongoClient.db("myWallet");
const collectionUser = db.collection("user")
const collectionTransaction = db.collection("transaction")

app.post("/login", async (req, res) => {
    const { email } = req.body
    const { password } = req.headers
    console.log(password)


    const validation = validacaoSchema.validate({ email }, { abortEarly: false })

    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message)
        res.status(422).send(erros)
        return;
    }

    try {
        const user = await collectionUser.findOne({ email })
        console.log(user)

        if (user != null) {
            if (user.password === password) {
                res.send({
                    id: user._id.toString(),
                    name: user.name
                })

            } else {
                res.status(401).send("Não autotizado")
            }
        } else {
            res.status(404).send("Esse usuário não existe. Faça seu cadastro")
        }


    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

})

app.post("/usuarios", async (req, res) => {
    const { name, email, password, confirmedPassword } = req.body

    const validation = validacaoSchema.validate({ email, name }, { abortEarly: false })

    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message)
        res.status(422).send(erros)
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

        await collectionUser.insertOne({ name, email, password })
        res.sendStatus(201)


    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }




})

app.post("/transaction", async (req, res) => {
    const { value, description, type } = req.body
    const { id } = req.headers
  

    const validation = transactionSchema.validate({ value, description, type }, { abortEarly: false })

    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message)
        res.status(422).send(erros)
        return;
    }

    try {
        const user = await collectionUser.findOne({ _id: ObjectId(id) })
        if (!user) {
            res.send("usuario n existe")
            return;
        }

        const transaction = {
            userId: id,
            value: req.body.value,
            description: req.body.description,
            type: req.body.type,
            date: (dayjs().format('DD/MM'))
        }
        await collectionTransaction.insertOne(transaction)
        res.status(201).send("cadastrado com sucesso")

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

app.get("/transaction", async (req, res) => {
    const { id } = req.headers

    try {
        const transactions = await collectionTransaction.find({userId:id}).toArray()
        res.send(transactions)
       
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

})

app.listen(5000, console.log("Server running in port: 5000"))

