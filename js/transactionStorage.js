// Manages persistent transaction data
const TransactionStorage = {
   getAllTransactions() {
      const stored = localStorage.getItem('transactions');
      return stored ? JSON.parse(stored) : [];
   },

   saveTransaction(transaction) {
      const transactions = this.getAllTransactions();
      
      if (!transaction.user) {
         const currentUser = accountManager.getCurrentUser();
         transaction.user = currentUser ? currentUser.username : 'System';
      }
      
      transactions.unshift(transaction); 
      localStorage.setItem('transactions', JSON.stringify(transactions));
   },
   
   saveMultipleTransactions(newTransactions) {
      const transactions = this.getAllTransactions();
      const currentUser = accountManager.getCurrentUser();
      const username = currentUser ? currentUser.username : 'System';
      
      newTransactions.forEach(t => {
         if (!t.user) {
            t.user = username;
         }
         transactions.unshift(t);
      });
      localStorage.setItem('transactions', JSON.stringify(transactions));
   },

   clearAllTransactions() {
      localStorage.removeItem('transactions');
   }
};

window.TransactionStorage = TransactionStorage;