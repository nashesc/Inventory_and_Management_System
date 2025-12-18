document.addEventListener('DOMContentLoaded', () => {

   // ==================== CREATE ACCOUNT MODAL ====================
   const createAccountBtn = document.getElementById('createAccountBtn');
   const createAccountModal = document.getElementById('createAccountModal');
   const closeCreateModal = document.getElementById('closeCreateModal');
   const createAccountForm = document.getElementById('createAccountForm');

   if (createAccountBtn) {
      createAccountBtn.addEventListener('click', () => {

         createAccountModal.classList.add('show');
         createAccountForm.reset();
         document.getElementById('createFormMessage').textContent = '';
         document.getElementById('createFormMessage').className = 'form-message';
         
         const roleDropdown = document.getElementById('roleDropdown');
         if (roleDropdown) {
            const btn = roleDropdown.querySelector('.dropdown-btn');
            btn.querySelector('span').textContent = 'Select Role';
            btn.classList.remove('has-value');
            document.getElementById('accountRole').value = '';
         }
      });
   }

   if (closeCreateModal) {
      closeCreateModal.addEventListener('click', () => {
         createAccountModal.classList.remove('show');
         createAccountForm.reset();
         document.getElementById('createFormMessage').textContent = '';
      });
   }




   // ==================== CREATE ACCOUNT FORM SUBMISSION ====================
   if (createAccountForm) {
      createAccountForm.addEventListener('submit', (e) => {
         e.preventDefault();
         
         const username = document.getElementById('newUsername').value.trim();
         const password = document.getElementById('newPassword').value;
         const confirmPassword = document.getElementById('confirmPassword').value;
         const role = document.getElementById('accountRole').value;
         const messageEl = document.getElementById('createFormMessage');
         
         // Validation
         if (!username || !password || !confirmPassword || !role) {
            messageEl.textContent = 'Please fill in all fields';
            messageEl.className = 'form-message error';
            return;
         }
         
         if (password !== confirmPassword) {
            messageEl.textContent = 'Passwords do not match';
            messageEl.className = 'form-message error';
            return;
         }
         
         if (password.length < 6) {
            messageEl.textContent = 'Password must be at least 6 characters';
            messageEl.className = 'form-message error';
            return;
         }

         const currentUser = accountManager.getCurrentUser();
         const result = accountManager.createAccount(username, password, role, currentUser.username);
         
         if (result.success) {
            messageEl.textContent = result.message;
            messageEl.className = 'form-message success';
            
            setTimeout(() => {
               createAccountModal.classList.remove('show');
               createAccountForm.reset();
               messageEl.textContent = '';
               
               const roleDropdown = document.getElementById('roleDropdown');
               if (roleDropdown) {
                  const btn = roleDropdown.querySelector('.dropdown-btn');
                  btn.querySelector('span').textContent = 'Select Role';
                  btn.classList.remove('has-value');
                  document.getElementById('accountRole').value = '';
               }
            }, 2000);
         } else {
            messageEl.textContent = result.message;
            messageEl.className = 'form-message error';
         }
      });
   }



   // ==================== MONITOR ACCOUNTS MODAL ====================
   const monitorAccountsBtn = document.getElementById('monitorAccountsBtn');
   const monitorAccountsModal = document.getElementById('monitorAccountsModal');
   const closeMonitorModal = document.getElementById('closeMonitorModal');

   if (monitorAccountsBtn) {
      monitorAccountsBtn.addEventListener('click', () => {
         loadAccountsList();
         monitorAccountsModal.classList.add('show');
      });
   }

   if (closeMonitorModal) {
      closeMonitorModal.addEventListener('click', () => {
         monitorAccountsModal.classList.remove('show');
      });
   }



   // ==================== TAB SWITCHING ====================
   document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
         document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
         document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
         
         btn.classList.add('active');
         const tabName = btn.getAttribute('data-tab');
         document.getElementById(tabName + 'Tab').classList.add('active');
      });
   });


   
   // ==================== LOAD ACCOUNTS LIST ====================
   function loadAccountsList() {
      const activeAccounts = accountManager.getActiveAccounts();
      const pendingAccounts = accountManager.getAccountsByStatus('pending');
      const isSuperAdmin = accountManager.isSuperAdmin();


      // Load Active Accounts
      const activeList = document.getElementById('activeAccountsList');
      activeList.innerHTML = '';
      
      if (activeAccounts.length === 0) {
         activeList.innerHTML = '<p class="no-accounts">No active accounts</p>';
      } else {
         activeAccounts.forEach(account => {
            const accountCard = createAccountCard(account, 'active', isSuperAdmin);
            activeList.appendChild(accountCard);
         });
      }


      // Load Pending Accounts
      const pendingList = document.getElementById('pendingAccountsList');
      pendingList.innerHTML = '';
      
      if (!isSuperAdmin) {
         pendingList.innerHTML = '<p class="no-accounts">Only Super Admin can view pending accounts</p>';
      } else if (pendingAccounts.length === 0) {
         pendingList.innerHTML = '<p class="no-accounts">No pending accounts</p>';
      } else {
         pendingAccounts.forEach(account => {
            const accountCard = createAccountCard(account, 'pending', isSuperAdmin);
            pendingList.appendChild(accountCard);
         });
      }
   }



   // ==================== CREATE ACCOUNT CARD ====================
   function createAccountCard(account, status, isSuperAdmin) {
      const card = document.createElement('div');
      card.className = 'account-card';
      
      const createdDate = new Date(account.createdAt).toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric'
      });

      let buttonsHTML = '';
      if (status === 'pending' && isSuperAdmin) {
         buttonsHTML = `
            <button class="approve-btn" onclick="approveAccount('${account.id}')">
               <i class="bi bi-check-circle"></i> Approve
            </button>
            <button class="reject-btn" onclick="deleteAccountConfirm('${account.id}', '${account.username}')">
               <i class="bi bi-x-circle"></i> Reject
            </button>
         `;
      } else if (status === 'active' && !account.isSuper) {
         buttonsHTML = `
            <button class="delete-account-btn" onclick="deleteAccountConfirm('${account.id}', '${account.username}')">
               <i class="bi bi-trash"></i> Delete
            </button>
         `;
      }

      card.innerHTML = `
         <div class="account-card-header">
            <div class="account-icon">
               <i class="bi bi-person-circle"></i>
            </div>
            <div class="account-info">
               <h3>${account.username}</h3>
               <span class="role-badge ${account.role.toLowerCase().replace(' ', '-')}">${account.role}</span>
            </div>
         </div>
         <div class="account-details">
            <div class="detail-row">
               <span class="detail-label">Password:</span>
               <span class="detail-value">${account.password}</span>
            </div>
            <div class="detail-row">
               <span class="detail-label">Status:</span>
               <span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
            <div class="detail-row">
               <span class="detail-label">Created by:</span>
               <span class="detail-value">${account.createdBy}</span>
            </div>
            <div class="detail-row">
               <span class="detail-label">Created on:</span>
               <span class="detail-value">${createdDate}</span>
            </div>
         </div>
         <div class="account-actions">
            ${buttonsHTML}
         </div>
      `;
      
      return card;
   }


   // ==================== ACCOUNT ACTIONS ====================
   // Approve account
   window.approveAccount = function(accountId) {
      const result = accountManager.approveAccount(accountId);
      if (result.success) {
         alert(result.message);
         loadAccountsList();
      } else {
         alert(result.message);
      }
   };

   let accountToDelete = null;
   
   window.deleteAccountConfirm = function(accountId, username) {
      accountToDelete = accountId;
      document.getElementById('deleteAccountMessage').textContent = 
         `Are you sure you want to delete the account "${username}"?`;
      document.getElementById('deleteAccountModal').style.display = 'flex';
   };

   document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      if (accountToDelete) {
         const result = accountManager.deleteAccount(accountToDelete);
         if (result.success) {
            alert(result.message);
            loadAccountsList();
         }
      }
      document.getElementById('deleteAccountModal').style.display = 'none';
      accountToDelete = null;
   });

   document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
      document.getElementById('deleteAccountModal').style.display = 'none';
      accountToDelete = null;
   });



   window.addEventListener('click', (e) => {
      if (e.target === createAccountModal) {
         createAccountModal.classList.remove('show');
      }
      if (e.target === monitorAccountsModal) {
         monitorAccountsModal.classList.remove('show');
      }
   });

});