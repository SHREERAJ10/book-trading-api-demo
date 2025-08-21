-- CreateTable
CREATE TABLE "public"."Book" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Book',
    "author" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);
