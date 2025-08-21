import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z, ZodError } from "zod";

const Schema = z.object({
    name: z.string().max(60),
    author: z.string().min(3).max(30),
    quantity: z.number().int().positive().max(100),
    price: z.number().nonnegative()
});

const quantityInputFormat = z.object({
    quantity: z.number().int().positive().max(100)
});

const idFormat = z.number().int().positive();

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

app.get("/books", async (req, res) => {
    try {
        const data = await prisma.book.findMany({
            select: {
                id: true,
                name: true,
                author: true
            }
        });
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({"success":false , "error": "server error" });
    }
});

app.get("/books/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const bookId = await idFormat.parseAsync(id);
        const bookData = await prisma.book.findUnique({
            where: {
                id: bookId
            }
        });
        if (bookData != null) { //if book is available in the DB
            res.json(bookData);
        }
        else {
            res.status(404).json({"success":false , "error": "data not found!" });
        }
    }
    catch (err) {
        console.log(err);
        if (err instanceof ZodError) {
            res.status(400).json({"success":false , "error": "invalid id: must be a positive integer!" });
        }
        else {
            res.status(500).json({"success":false , "error": "server error" });
        }
    }
}
);

app.post("/books", async (req, res) => {
    try {
        const data = req.body;
        const bookData = await Schema.parseAsync(data);
        await prisma.book.create({
            data: {
                name: bookData.name,
                author: bookData.author,
                quantity: bookData.quantity,
                price: bookData.price
            }
        });
        res.status(201).json({"success":true , "message": "data successfully added!" });
    }
    catch (err) {
        console.log(err);
        if (err instanceof ZodError) {
            res.status(400).json({"success":false , "error": "invalid form of data!" });
        }
        else {
            res.status(500).json({"success":false , "error": "server error" });
        }
    }
});

app.post("/books/:id/purchase", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const bookId = await idFormat.parseAsync(id);
        const quantityData = req.body;
        const booksQuantity = await quantityInputFormat.parseAsync(quantityData);
        const bookToBuy = await prisma.book.findUnique({
            where: {
                id: bookId
            }
        });

        if (bookToBuy != null) { //if book is available in DB
            if (booksQuantity.quantity <= bookToBuy.quantity) {
                const updatedBookData = await prisma.book.update({
                    where: {
                        id: bookId
                    },
                    data: {
                        quantity: bookToBuy.quantity - booksQuantity.quantity
                    }
                });

                if (updatedBookData.quantity == 0) {
                    await prisma.book.delete({
                        where: {
                            id: bookId
                        }
                    })
                }

                res.status(200).json({
                    "success":true,
                    "message": "Book Successfully Purchased",
                    "purchaseDetails": {
                        "title": bookToBuy.name,
                        "author": bookToBuy.author,
                        "price": bookToBuy.price,
                        "quantity": booksQuantity.quantity
                    }
                });
            }
            else {
                res.status(400).json({"success":false ,"error": "Requested quantity exceeds stock" })
            }
        }
        else {
            res.status(404).json({"success":false ,"error": "Data not Found!" });
        }
    }
    catch (err) {
        console.log(err);
        if (err instanceof ZodError) {
            res.status(400).json({"success":false ,"error": "invalid input" });
        }
        else {
            res.status(500).json({"success":false ,"error": "server error" });
        }
    }
}
);

app.patch("/books/:id", async(req, res)=>{
    try{
        const id = Number(req.params.id);
        const bookId = await idFormat.parseAsync(id);
        const data = req.body;
        const partialSchema = Schema.partial();
        const updatedData = await partialSchema.parseAsync(data);
        const updatedBookData = await prisma.book.update({
            where:{
                id: bookId
            },
            data:updatedData
        });
        res.status(200).json({"success":true, "message":"data updated successfully", "updatedData":updatedBookData});
    }
    catch (err){
        console.log(err);
        if(err instanceof ZodError){
            res.status(400).json({"success":false,"error":"invalid form of data"})
        }
        else if(err.code == "P2025"){
            res.status(404).json({"success":false,"error":"Record Not Found!"});
        }
        else{
            res.status(500).json({"success":false,"error":"server error"});
        }
    }
});

app.delete("/books/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const bookId = await idFormat.parseAsync(id);
        const deletedBook = await prisma.book.delete({
            where: {
                id: bookId
            }
        });
        res.status(200).json({"success":true ,"message": "book data deleted successfully!", "deletedBook": deletedBook });
    }
    catch (err) {
        console.log(err);
        if (err instanceof ZodError) {
            res.status(400).json({"success":false ,"error": "invalid id: must be positive integer!" })
        }
        else if(err.code == "P2025") {
            res.status(404).json({"success":false ,"error": "Record Not Found!" });
        }
        else{
            res.status(500).json({"success":false ,"error": "server error" })
        }
    }
}
);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});