document.addEventListener("DOMContentLoaded", () => {
   
   const historyTable = document.querySelector(".history-log-table tbody");
   const dateInput = document.querySelector(".date-input");
   const searchInput = document.querySelector(".search-box input");
   const searchBtn = document.querySelector(".search-btn");
   
   // Track if date has been manually selected
   let dateSelected = false;
   
   if (historyTable) {
      // Function to highlight matching text
      function highlightText(text, searchTerm) {
         if (!searchTerm || searchTerm.trim() === '') {
            return text;
         }
         
         const regex = new RegExp(`(${searchTerm})`, 'gi');
         return text.replace(regex, 
            '<mark style="background-color: #7674f8; padding: 2px 4px; border-radius: 3px; font-weight: 600;">$1</mark>');
      }
      
      // Function to check if transaction matches search term
      function matchesSearch(transaction, searchTerm) {
         if (!searchTerm || searchTerm.trim() === '') {
            return true;
         }
         
         const term = searchTerm.toLowerCase();
         const itemName = (transaction.item || '').toLowerCase();
         const action = (transaction.action || 'sale completed').toLowerCase();
         const details = (transaction.details || '').toLowerCase();
         const timestamp = new Date(transaction.timestamp).toLocaleDateString().toLowerCase();
         
         return itemName.includes(term) || 
                action.includes(term) || 
                details.includes(term) ||
                timestamp.includes(term);
      }
      
      // Load all transactions from localStorage
      function loadAllTransactions(filterDate = null, searchTerm = null) {
         let transactions = TransactionStorage.getAllTransactions();
         
         // Only filter by date if it was actually selected by user
         if (filterDate && dateSelected) {
            transactions = transactions.filter(transaction => {
               const transactionDate = new Date(transaction.timestamp).toDateString();
               const selectedDate = new Date(filterDate).toDateString();
               return transactionDate === selectedDate;
            });
         }
         
         // Filter by search term
         if (searchTerm && searchTerm.trim() !== '') {
            transactions = transactions.filter(transaction => matchesSearch(transaction, searchTerm));
         }
         
         // Clear only tbody content
         historyTable.innerHTML = '';
         
         if (transactions.length === 0) {
            historyTable.innerHTML = `
               <tr>
                  <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                     No transaction history ${(filterDate && dateSelected) ? 'for this date' : searchTerm ? 'matching your search' : 'yet'}
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
            }).replace(",", "") + " - " + timestamp.toLocaleTimeString("en-US", {
               hour: "2-digit",
               minute: "2-digit",
               hour12: true
            });
            
            // Determine action type and details
            let action = "Sale completed";
            let details = `${transaction.item}, Quantity: ${transaction.quantity}, Total: ₱${transaction.total}`;
            
            // Check if this is a special action (inventory change, login/logout, etc.)
            if (transaction.action) {
               switch(transaction.action.toLowerCase()) {
                  case 'added':
                     action = 'Product added';
                     details = transaction.details || details;
                     break;
                  case 'updated':
                     action = 'Stock update';
                     details = transaction.details || details;
                     break;
                  case 'deleted':
                     action = 'Product deleted';
                     details = transaction.details || details;
                     break;
                  case 'logged in':
                     action = 'Logged in';
                     details = transaction.details || details;
                     break;
                  case 'logged out':
                     action = 'Logged out';
                     details = transaction.details || details;
                     break;
                  default:
                     // If it has an action but doesn't match any case, use the action as-is
                     action = transaction.action;
                     details = transaction.details || details;
                     break;
               }
            }
            
            // Apply highlighting if search term exists
            const highlightedTimestamp = highlightText(formattedTimestamp, searchTerm);
            const highlightedAction = highlightText(action, searchTerm);
            const highlightedDetails = highlightText(details, searchTerm);
            
            const row = document.createElement('tr');
            row.innerHTML = `
               <td>${highlightedTimestamp}</td>
               <td>${transaction.user || 'System'}</td>
               <td>${highlightedAction}</td>
               <td>${highlightedDetails}</td>
            `;
            
            historyTable.appendChild(row);
         });
      }
      
      // Date filter event listener - only activates when user selects a date
      if (dateInput) {
         dateInput.addEventListener('change', (e) => {
            if (e.target.value) {
               dateSelected = true; // Mark that date has been selected
               const selectedDate = e.target.value;
               const searchTerm = searchInput ? searchInput.value : null;
               loadAllTransactions(selectedDate, searchTerm);
            } else {
               // If date is cleared, reset the filter
               dateSelected = false;
               const searchTerm = searchInput ? searchInput.value : null;
               loadAllTransactions(null, searchTerm);
            }
         });
      }
      
      // Real-time search as user types
      if (searchInput) {
         searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            const selectedDate = (dateInput && dateSelected) ? dateInput.value : null;
            loadAllTransactions(selectedDate, searchTerm);
         });
         
         // Also support Enter key
         searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
               const searchTerm = searchInput.value;
               const selectedDate = (dateInput && dateSelected) ? dateInput.value : null;
               loadAllTransactions(selectedDate, searchTerm);
            }
         });
      }
      
      // Search button click
      if (searchBtn) {
         searchBtn.addEventListener('click', () => {
            const searchTerm = searchInput ? searchInput.value : null;
            const selectedDate = (dateInput && dateSelected) ? dateInput.value : null;
            loadAllTransactions(selectedDate, searchTerm);
         });
      }
      
      // Load all transactions on page load
      loadAllTransactions();
   }
   
});