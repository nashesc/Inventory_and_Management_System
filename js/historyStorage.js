// HISTORY STORAGE - Stores all activity logs in localStorage

const HistoryStorage = {
   KEY: "history_logs",

   // Get all logs
   getAllLogs() {
      const stored = localStorage.getItem(this.KEY);
      return stored ? JSON.parse(stored) : [];
   },

   // Add a new log
   addLog(action, details, user = "System") {
      const logs = this.getAllLogs();

      logs.unshift({
         timestamp: Date.now(),
         user,
         action,
         details
      });

      localStorage.setItem(this.KEY, JSON.stringify(logs));
   },

   // Clear (for debugging)
   clear() {
      localStorage.removeItem(this.KEY);
   }
};

window.HistoryStorage = HistoryStorage;
