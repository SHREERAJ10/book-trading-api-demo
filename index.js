import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z, ZodError } from "zod";

const Schema = z.object({
    name: z.string().max(60),
    author: z.string().min(3).max(30),
    quantity: z.int().positive().max(100),
    price: z.number().int().nonnegative()
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
        res.status(500).json({ "Error": "server error" });
    }
});

app.get("/books/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        await idFormat.parseAsync(id);
        const bookData = await prisma.book.findUnique({
            where: {
                id: id
            }
        });
        if (bookData != null) {
            res.json(bookData);
        }
        else {
            res.status(404).json({ "Error": "data not found!" });
        }
    }
    catch (err) {
        if (err instanceof ZodError) {
            res.status(400).json({ "Error": "invalid id: must be a positive integer!" });
        }
        else {
            res.status(500).json({ "Error": "server error" });
        }
    }
}
);

app.post("/books", async (req, res) => {
    try {
        const bookData = req.body;
        await Schema.parseAsync(bookData);
        await prisma.book.create({
            data: {
                name: bookData.name,
                author: bookData.author,
                quantity: bookData.quantity,
                price: bookData.price
            }
        });
        res.json({ "Message": "Data successfully Added" });
    }
    catch (err) {
        if (err instanceof ZodError) {
            res.status(400).json({ "Error": "invalid form of data!" });
        }
        else {
            res.status(500).json({ "Error": "server error" });
        }
    }
});

app.post("/books/:id/purchase", async (req, res) => {
    try {
        const bookId = Number(req.params.id);
        await idFormat.parseAsync(bookId);
        const booksQuantity = req.body;
        await quantityInputFormat.parseAsync(booksQuantity);
        const bookToBuy = await prisma.book.findUnique({
            where: {
                id: bookId
            }
        });

        if (bookToBuy != null) {
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

                res.json({
                    "Message": "Book Successfully Purchased",
                    "Book-Details": {
                        "title": bookToBuy.name,
                        "author": bookToBuy.author,
                        "price": bookToBuy.price,
                        "quantity": booksQuantity.quantity
                    }
                });
            }
            else {
                res.status(400).json({ "Error": "Requested quantity exceeds stock" })
            }
        }
        else {
            res.status(404).json({ "Error": "Data not Found!" });
        }
    }
    catch (err) {
        if (err instanceof ZodError) {
            res.status(400).json({ "Error": "invalid input" });
        }
        else {
            res.status(500).json({ "Error": "server error" });
        }
    }
}
);

app.delete("/books/:id", async (req, res) => {
    try {
        const bookId = Number(req.params.id);
        await idFormat.parseAsync(bookId);
        const deletedBook = await prisma.book.delete({
            where: {
                id: bookId
            }
        });
        res.json({ "Message": "Book Data Successfully Deleted!", "Deleted-Book": deletedBook });
    }
    catch (err) {
        if (err instanceof ZodError) {
            res.status(400).json({ "Error": "invalid id: must be positive integer!" })
        }
        else {
            res.status(404).json({ "Error": "Record Not Found!" });
        }
    }
}
);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});