// HISTORY PAGE - Load all transactions and inventory changes

document.addEventListener("DOMContentLoaded", () => {
   
   const historyTable = document.querySelector(".history-log-table tbody");
   
   if (historyTable) {
      // Load all transactions from localStorage
      function loadAllTransactions() {
         const transactions = TransactionStorage.getAllTransactions();
         
         historyTable.innerHTML = '';
         
         if (transactions.length === 0) {
            historyTable.innerHTML = `
               <tr>
                  <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                     No transaction history yet
                  </td>
               </tr>
            `;
            return;
         }
         
         transactions.forEach(transaction => {
            const timestamp = new Date(transaction.timestamp);
            const formattedTimestamp = timestamp.toLocaleDateString("en-US", {
               month: "short",
               day: "numeric",
               year: "numeric"
            }).replace(",", "") + " – " + timestamp.toLocaleTimeString("en-US", {
               hour: "2-digit",
               minute: "2-digit",
               hour12: true
            });
            
            // Determine action type and details
            let action = "Sale completed";
            let details = `${transaction.item}, Quantity: ${transaction.quantity}, Total: ₱${transaction.total}`;
            
            // Check if this is an inventory change
            if (transaction.action) {
               switch(transaction.action) {
                  case 'added':
                     action = 'Product added';
                     break;
                  case 'updated':
                     action = 'Stock update';
                     break;
                  case 'deleted':
                     action = 'Product deleted';
                     break;
               }
               details = transaction.details || details;
            }
            
            const row = `
               <tr>
                  <td>${formattedTimestamp}</td>
                  <td>System</td>
                  <td>${action}</td>
                  <td>${details}</td>
               </tr>
            `;
            
            historyTable.insertAdjacentHTML('beforeend', row);
         });
      }
      
      // Load transactions on page load
      loadAllTransactions();
   }
   
});