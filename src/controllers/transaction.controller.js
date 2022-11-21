import dayjs from "dayjs";
import { collectionTransaction, transactionSchema, collectionUser, db } from "../index.js"

export async function postTransaction(req, res) {
    const { value, description, type } = req.body
    const { authorization } = req.headers
    const token = authorization?.replace("Bearer ", "")
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
            userId: session.userId,
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

}

export async function getTransaction(req, res) {
    const { authorization } = req.headers
    const token = authorization?.replace("Bearer ", "")

    try {
        const sessions = await db.collection("sessions").findOne({ token })
        
        if (!sessions) {
            res.sendStatus(401);
            return;
        }

        const transactions = await collectionTransaction.find({ userId: sessions.userId }).toArray()

        let total = 0
        transactions.forEach((transaction) => {
            total = total + transaction.value
        })

        res.send({
            transactions: transactions,
            total: total
        })
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

}