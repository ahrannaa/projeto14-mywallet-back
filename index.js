import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";

const emailsSchema = joi.object({
    email: joi.string().required().email()
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
const collectionTransaction = db.collection("transactions")

app.post("/login", async (req, res) => {
    const { email } = req.body
    const { password } = req.headers
    console.log(password)
   

    const validation = emailsSchema.validate({ email }, { abortEarly: false })

    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message)
        res.status(422).send(erros)
        return;
    }

    try {
        const user = await collectionUser.findOne({email})    
         console.log(user)

        if (user != null) {
            if (user.password === password) {
                res.send({
                    id: user. _id.toString(),
                    name: user.name})

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


app.listen(5000, console.log("Server running in port: 5000"))

