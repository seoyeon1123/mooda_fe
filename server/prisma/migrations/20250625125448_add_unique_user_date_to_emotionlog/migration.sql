/*
  Warnings:

  - A unique constraint covering the columns `[user_id,date]` on the table `emotion_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "emotion_logs_user_id_date_key" ON "emotion_logs"("user_id", "date");
