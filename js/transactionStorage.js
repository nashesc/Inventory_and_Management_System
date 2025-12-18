// TRANSACTION STORAGE - Manages persistent transaction data

// Transaction Storage Manager
const TransactionStorage = {
   // Get all transactions from localStorage
   getAllTransactions() {
      const stored = localStorage.getItem('transactions');
      return stored ? JSON.parse(stored) : [];
   },

   // Save a new transaction (with automatic user tracking)
   saveTransaction(transaction) {
      const transactions = this.getAllTransactions();
      
      // Automatically add current user if not specified
      if (!transaction.user) {
         const currentUser = accountManager.getCurrentUser();
         transaction.user = currentUser ? currentUser.username : 'System';
      }
      
      transactions.unshift(transaction); // Add to beginning (newest first)
      localStorage.setItem('transactions', JSON.stringify(transactions));
   },
   
   // Save multiple transactions at once
   saveMultipleTransactions(newTransactions) {
      const transactions = this.getAllTransactions();
      const currentUser = accountManager.getCurrentUser();
      const username = currentUser ? currentUser.username : 'System';
      
      newTransactions.forEach(t => {
         // Add user to each transaction if not specified
         if (!t.user) {
            t.user = username;
         }
         transactions.unshift(t);
      });
      localStorage.setItem('transactions', JSON.stringify(transactions));
   },

   // Clear all transactions (for testing)
   clearAllTransactions() {
      localStorage.removeItem('transactions');
   }
};

// Make it globally available
window.TransactionStorage = TransactionStorage;