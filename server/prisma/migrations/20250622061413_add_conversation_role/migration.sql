/*
  Warnings:

  - Added the required column `role` to the `conversations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "role" TEXT NOT NULL;
