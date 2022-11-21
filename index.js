import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import bcrypt from "bcrypt"
import { v4 as uuidV4 } from "uuid"

const validacaoSchema = joi.object({
    email: joi.string().required().email(),
    name: joi.string().required(),
    password: joi.string().required(),
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
    const { email, password } = req.body
    const token = uuidV4()

    try {
        const user = await collectionUser.findOne({ email })
        if (!user) {
            return res.status(401).send("Não autotizado")
        }

        const passwordOk = bcrypt.compareSync(password, user.password)
        if (!passwordOk) {
            return res.status(401).send("Não autorizado")
        }

        const tokenExist = await db.collection("sessions").findOne({ userId: user._id })
        if (!tokenExist) {
            await db.collection("sessions").insertOne({
                token,
                userId: user._id
            })
            res.send({ token })
        }
        res.send({ token: tokenExist.token })


    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

})

app.post("/usuarios", async (req, res) => {
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

})

app.post("/transaction", async (req, res) => { 
    const { value, description, type } = req.body
    const { authorization } = req.headers
    const token = authorization?.replace("Bearer ","")
    console.log(token)

   const validation = transactionSchema.validate({ value, description, type }, { abortEarly: false })

    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message)
        res.status(422).send(erros)
        return;
    }

    try {
        const session = await db.collection("sessions").findOne({ token })
      
        if (!session) {
            res.send("usuario n existe")
            return;
        }
        const transaction = {
            userId:session.userId,
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
    const { authorization } = req.headers
    const token = authorization?.replace("Bearer ", "")

    if (!token) {
        return res.sendStatus(401);
    }
    
    try {
        const sessions = await db.collection("sessions").findOne({ token })
        const transactions = await collectionTransaction.find({ userId: sessions.userId }).toArray()
        
        let total = 0
        transactions.forEach((transaction)=> {
            total = total + transaction.value
        })

        res.send({
            Transactions:transactions,
             Total: total
        })



        

    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

})

app.listen(5000, console.log("Server running in port: 5000"))

