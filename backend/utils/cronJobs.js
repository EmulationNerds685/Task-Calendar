import cron from "node-cron";
import Task from "../models/Task.js";

const startCronJobs = () => {
  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await Task.updateMany(
        {
          dueDate: { $lt: today },
          status: { $nin: ["Completed", "Overdue"] }
        },
        { $set: { status: "Overdue" } }
      );

      console.log(`Cron: marked ${result.modifiedCount} tasks as Overdue`);
    } catch (error) {
      console.error("Cron job failed:", error.message);
    }
  });

  console.log("Cron jobs started");
};

export default startCronJobs;