/*
  Warnings:

  - Added the required column `user_name` to the `emotion_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "emotion_logs" ADD COLUMN     "user_name" TEXT NOT NULL;
