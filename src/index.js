import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import bcrypt from "bcrypt"
import { v4 as uuidV4 } from "uuid"
import{postTransaction, getTransaction,} from "./controllers/transaction.controller.js"
import{postLogin, postUsuario} from "./controllers/usuario.controller.js"

export const validacaoSchema = joi.object({
    email: joi.string().required().email(),
    name: joi.string().required(),
    password: joi.string().required(),
})

export const transactionSchema = joi.object({
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

export const db = mongoClient.db("myWallet");
export const collectionUser = db.collection("user")
export const collectionTransaction = db.collection("transaction")

app.post("/login", postLogin )

app.post("/usuarios", postUsuario)

app.post("/transaction", postTransaction)

app.get("/transaction", getTransaction)

app.listen(5000, console.log("Server running in port: 5000"))

