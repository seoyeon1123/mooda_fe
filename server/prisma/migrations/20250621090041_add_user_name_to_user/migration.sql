/*
  Warnings:

  - You are about to drop the column `user_name` on the `emotion_logs` table. All the data in the column will be lost.
  - Added the required column `user_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "emotion_logs" DROP COLUMN "user_name";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "user_name" TEXT NOT NULL;
