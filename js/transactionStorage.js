// TRANSACTION STORAGE - Manages persistent transaction data

// Transaction Storage Manager
const TransactionStorage = {
   // Get all transactions from localStorage
   getAllTransactions() {
      const stored = localStorage.getItem('transactions');
      return stored ? JSON.parse(stored) : [];
   },

   // Save a new transaction
   saveTransaction(transaction) {
      const transactions = this.getAllTransactions();
      transactions.unshift(transaction); // Add to beginning (newest first)
      localStorage.setItem('transactions', JSON.stringify(transactions));
   },

   // Save multiple transactions at once
   saveMultipleTransactions(newTransactions) {
      const transactions = this.getAllTransactions();
      newTransactions.forEach(t => transactions.unshift(t));
      localStorage.setItem('transactions', JSON.stringify(transactions));
   },

   // Clear all transactions (for testing)
   clearAllTransactions() {
      localStorage.removeItem('transactions');
   }
};

// Make it globally available
window.TransactionStorage = TransactionStorage;