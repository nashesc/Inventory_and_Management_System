// Handles user creation, authentication, and role-based access
class AccountManager {
   constructor() {
      this.storageKey = 'userAccounts';
      this.sessionKey = 'currentUser';
      this.initializeSuperAdmin();
   }

   initializeSuperAdmin() {
      const accounts = this.getAllAccounts();
      
      const superAdminExists = accounts.some(acc => acc.isSuper === true);
      
      if (!superAdminExists) {
         const superAdmin = {
            id: this.generateId(),
            username: 'jonasEscanilla',
            password: 'admin123',
            role: 'Super Admin',
            status: 'active',
            createdBy: 'System',
            createdAt: new Date().toISOString(),
            isSuper: true
         };
         this.saveAccount(superAdmin);
         console.log('Super Admin account created/restored');
      }
   }

   generateId() {
      return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
   }

   getAllAccounts() {
      const accounts = localStorage.getItem(this.storageKey);
      return accounts ? JSON.parse(accounts) : [];
   }

   saveAccount(account) {
      const accounts = this.getAllAccounts();
      accounts.push(account);
      localStorage.setItem(this.storageKey, JSON.stringify(accounts));
   }

   updateAccounts(accounts) {
      localStorage.setItem(this.storageKey, JSON.stringify(accounts));
   }

   createAccount(username, password, role, createdBy) {
      const accounts = this.getAllAccounts();
      
      if (accounts.some(acc => acc.username === username)) {
         return { success: false, message: 'Username already exists' };
      }

      const creator = this.getCurrentUser();
      const status = creator && creator.isSuper ? 'active' : 'pending';

      const newAccount = {
         id: this.generateId(),
         username: username,
         password: password,
         role: role,
         status: status,
         createdBy: createdBy,
         createdAt: new Date().toISOString(),
         isSuper: false
      };

      this.saveAccount(newAccount);
      return { 
         success: true, 
         message: status === 'active' ? 'Account created successfully' : 'Account created. Awaiting Super Admin approval.',
         needsApproval: status === 'pending'
      };
   }

   // Login validation
   login(username, password) {
      const accounts = this.getAllAccounts();
      const account = accounts.find(acc => 
         acc.username === username && 
         acc.password === password &&
         acc.status === 'active'
      );

      if (account) {
         sessionStorage.setItem(this.sessionKey, JSON.stringify(account));
         
         if (typeof TransactionStorage !== 'undefined') {
            const loginLog = {
               timestamp: new Date().toISOString(),
               user: account.username,
               action: 'Logged in',
               details: `${account.username} logged in.`
            };
            TransactionStorage.saveTransaction(loginLog);
         }
         
         return { success: true, user: account };
      }

      const pendingAccount = accounts.find(acc => 
         acc.username === username && 
         acc.password === password &&
         acc.status === 'pending'
      );

      if (pendingAccount) {
         return { success: false, message: 'Account is pending Super Admin approval' };
      }

      return { success: false, message: 'Invalid username or password' };
   }

   getCurrentUser() {
      const user = sessionStorage.getItem(this.sessionKey);
      return user ? JSON.parse(user) : null;
   }

   logout() {
      sessionStorage.removeItem(this.sessionKey);
   }

   approveAccount(accountId) {
      const accounts = this.getAllAccounts();
      const accountIndex = accounts.findIndex(acc => acc.id === accountId);
      
      if (accountIndex !== -1) {
         accounts[accountIndex].status = 'active';
         accounts[accountIndex].approvedAt = new Date().toISOString();
         this.updateAccounts(accounts);
         return { success: true, message: 'Account approved successfully' };
      }
      
      return { success: false, message: 'Account not found' };
   }

   // Reject/Delete account - WITH SUPER ADMIN PROTECTION
   deleteAccount(accountId) {
      const accounts = this.getAllAccounts();
      
      const accountToDelete = accounts.find(acc => acc.id === accountId);
      
      if (!accountToDelete) {
         return { success: false, message: 'Account not found' };
      }
      
      if (accountToDelete.isSuper === true) {
         console.error('Attempted to delete Super Admin - BLOCKED');
         return { success: false, message: 'Cannot delete Super Admin account' };
      }
      
      const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
      
      const superAdminStillExists = filteredAccounts.some(acc => acc.isSuper === true);
      if (!superAdminStillExists) {
         console.error('CRITICAL: Super Admin would be deleted - OPERATION CANCELLED');
         return { success: false, message: 'Operation cancelled: Would remove Super Admin' };
      }
      
      this.updateAccounts(filteredAccounts);
      return { success: true, message: 'Account deleted successfully' };
   }

   hasPermission(permission) {
      const user = this.getCurrentUser();
      if (!user) return false;

      const permissions = {
         'Super Admin': ['all'],
         'Admin': ['view_history', 'view_settings', 'create_account', 'edit_inventory'],
         'Staff': ['view_inventory', 'view_transaction']
      };

      const userPermissions = permissions[user.role] || [];
      return userPermissions.includes('all') || userPermissions.includes(permission);
   }

   isSuperAdmin() {
      const user = this.getCurrentUser();
      return user && user.isSuper === true;
   }

   getAccountsByStatus(status) {
      return this.getAllAccounts().filter(acc => acc.status === status);
   }

   getActiveAccounts() {
      return this.getAllAccounts().filter(acc => acc.status === 'active');
   }
}

const accountManager = new AccountManager();

// Apply role-based restrictions when page loads
document.addEventListener('DOMContentLoaded', () => {
   const currentUser = accountManager.getCurrentUser();
   
   if (!currentUser && !window.location.pathname.includes('login.html')) {
      window.location.href = './login.html';
      return;
   }

   if (currentUser) {
      applyRoleRestrictions(currentUser);
      updateProfileDisplay(currentUser);
   }
});

// Apply UI restrictions based on user role
function applyRoleRestrictions(user) {
   if (user.role === 'Staff') {
      const historyNav = document.querySelector('.history');
      if (historyNav) {
         historyNav.style.display = 'none';
      }

      // Disable edit buttons in Settings page
      if (document.body.classList.contains('body-settings')) {
         const generalSettings = document.querySelector('.general-settings');
         if (generalSettings) {
            const dropdowns = generalSettings.querySelectorAll('.dropdown-btn');
            dropdowns.forEach(btn => {
               btn.disabled = true;
               btn.style.opacity = '0.5';
               btn.style.cursor = 'not-allowed';
            });
         }

         const accountSettings = document.querySelector('.account-settings');
         if (accountSettings) {
            const buttons = accountSettings.querySelector('.buttons');
            if (buttons) buttons.style.display = 'none';
            
            const inputs = accountSettings.querySelectorAll('input');
            inputs.forEach(input => input.disabled = true);
         }

         const dataManage = document.querySelector('.data-manage-settings');
         if (dataManage) {
            dataManage.style.display = 'none';
         }

         const storeInfo = document.querySelector('.store-info-settings');
         if (storeInfo) {
            const buttons = storeInfo.querySelector('.buttons');
            if (buttons) buttons.style.display = 'none';
         }
      }

      if (document.body.classList.contains('body-inventory')) {
         const editButtons = document.querySelectorAll('.edit-button');
         editButtons.forEach(btn => btn.style.display = 'none');
      }
   }

   if (user.role === 'Staff') {
      const createAccountBtn = document.querySelector('.create-account-btn');
      if (createAccountBtn) {
         createAccountBtn.style.display = 'none';
      }
   }
}

// Update profile display with current user info
function updateProfileDisplay(user) {
   const profileName = document.querySelectorAll('.profile-name');
   const profileRole = document.querySelectorAll('.profile-role');
   
   profileName.forEach(el => {
      el.textContent = user.username;
   });
   
   profileRole.forEach(el => {
      el.textContent = user.role;
   });
}

// Logout 
document.addEventListener('DOMContentLoaded', () => {
   const logoutLink = document.querySelector('.nav-logout');
   if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
         e.preventDefault();
         
         const currentUser = accountManager.getCurrentUser();
         if (currentUser && typeof TransactionStorage !== 'undefined') {
            const logoutLog = {
               timestamp: new Date().toISOString(),
               user: currentUser.username,
               action: 'Logged out',
               details: `${currentUser.username} logged out.`
            };
            TransactionStorage.saveTransaction(logoutLog);
         }
         
         accountManager.logout();
         window.location.href = './login.html';
      });
   }
});