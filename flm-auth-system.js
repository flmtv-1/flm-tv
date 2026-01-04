// ═══════════════════════════════════════════════════════════════
//  FLM TV AUTHENTICATION SYSTEM
//  Handles Firebase + Jellyfin authentication
// ═══════════════════════════════════════════════════════════════

class FLMAuthSystem {
    constructor() {
        this.jellyfinToken = null;
        this.jellyfinUserId = null;
        this.firebaseUser = null;
        this.isAuthenticated = false;
        
        // Initialize on load
        this.init();
    }
    
    init() {
        console.log('🔐 FLM Auth System: Initializing...');
        
        // Check for existing session
        this.checkExistingSession();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ FLM Auth System: Ready');
    }
    
    checkExistingSession() {
        // Check if user is already logged in
        const token = localStorage.getItem('flmtvJellyfinToken');
        const userId = localStorage.getItem('flmtvJellyfinUserId');
        
        if (token && userId) {
            this.jellyfinToken = token;
            this.jellyfinUserId = userId;
            this.isAuthenticated = true;
            this.updateUIForLoggedInUser();
            console.log('✅ Session restored');
        }
    }
    
    setupEventListeners() {
        // Sign In Button
        const signInBtn = document.getElementById('flmSignInBtn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.handleSignIn());
        }
        
        // Sign Up Button
        const signUpBtn = document.getElementById('flmSignUpBtn');
        if (signUpBtn) {
            signUpBtn.addEventListener('click', () => this.handleSignUp());
        }
        
        // Sign Out Button
        const signOutBtn = document.getElementById('flmSignOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.handleSignOut());
        }
        
        // Enter key on password field
        const passwordInput = document.getElementById('flmSignInPassword');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSignIn();
                }
            });
        }
    }
    
    async handleSignIn() {
        const email = document.getElementById('flmSignInEmail').value.trim();
        const password = document.getElementById('flmSignInPassword').value;
        const errorDiv = document.getElementById('flmSignInError');
        const successDiv = document.getElementById('flmSignInSuccess');
        const signInBtn = document.getElementById('flmSignInBtn');
        
        // Clear previous messages
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
        
        // Validate inputs
        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }
        
        // Show loading state
        const originalText = signInBtn.innerHTML;
        signInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        signInBtn.disabled = true;
        
        try {
            // Authenticate with Jellyfin via Netlify Function
            const response = await fetch('/.netlify/functions/jellyfin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    username: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store authentication
                this.jellyfinToken = data.accessToken;
                this.jellyfinUserId = data.userId;
                this.isAuthenticated = true;
                
                localStorage.setItem('flmtvJellyfinToken', data.accessToken);
                localStorage.setItem('flmtvJellyfinUserId', data.userId);
                localStorage.setItem('flmtvUserName', data.userName);
                
                // Show success message
                this.showSuccess('Sign in successful! Welcome to FLM TV! 🎬');
                
                // Update UI
                this.updateUIForLoggedInUser();
                
                // Close modal after delay
                setTimeout(() => {
                    this.closeModal('flmSignInModal');
                    // Reload page to apply authentication everywhere
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }, 1500);
                
                console.log('✅ Authentication successful');
            } else {
                this.showError(data.error || 'Invalid email or password. Please try again.');
            }
            
        } catch (error) {
            console.error('❌ Sign in error:', error);
            this.showError('Unable to connect. Please check your internet connection and try again.');
        } finally {
            // Restore button
            signInBtn.innerHTML = originalText;
            signInBtn.disabled = false;
        }
    }
    
    async handleSignUp() {
        const email = document.getElementById('flmSignUpEmail').value.trim();
        const password = document.getElementById('flmSignUpPassword').value;
        const confirmPassword = document.getElementById('flmSignUpConfirmPassword').value;
        const errorDiv = document.getElementById('flmSignUpError');
        const successDiv = document.getElementById('flmSignUpSuccess');
        const signUpBtn = document.getElementById('flmSignUpBtn');
        
        // Clear previous messages
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
        
        // Validate inputs
        if (!email || !password || !confirmPassword) {
            this.showError('Please fill in all fields', 'flmSignUpError');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('Passwords do not match', 'flmSignUpError');
            return;
        }
        
        if (password.length < 6) {
            this.showError('Password must be at least 6 characters', 'flmSignUpError');
            return;
        }
        
        // Show loading state
        const originalText = signUpBtn.innerHTML;
        signUpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        signUpBtn.disabled = true;
        
        try {
            // For now, show success and prompt to sign in
            // In production, you'd create a Jellyfin user account here
            this.showSuccess('Account created! Please sign in with your credentials.', 'flmSignUpSuccess');
            
            // Switch to sign in modal after delay
            setTimeout(() => {
                this.closeModal('flmSignUpModal');
                this.openModal('flmSignInModal');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Sign up error:', error);
            this.showError('Unable to create account. Please try again.', 'flmSignUpError');
        } finally {
            // Restore button
            signUpBtn.innerHTML = originalText;
            signUpBtn.disabled = false;
        }
    }
    
    handleSignOut() {
        // Clear authentication
        this.jellyfinToken = null;
        this.jellyfinUserId = null;
        this.isAuthenticated = false;
        
        localStorage.removeItem('flmtvJellyfinToken');
        localStorage.removeItem('flmtvJellyfinUserId');
        localStorage.removeItem('flmtvUserName');
        
        // Update UI
        this.updateUIForLoggedOutUser();
        
        // Show message
        alert('You have been signed out. Thank you for watching FLM TV!');
        
        console.log('✅ Signed out');
    }
    
    updateUIForLoggedInUser() {
        const userName = localStorage.getItem('flmtvUserName') || 'User';
        
        // Update sign in button in header to show user name
        const headerSignInBtn = document.querySelector('.header-actions .btn-secondary');
        if (headerSignInBtn) {
            headerSignInBtn.innerHTML = `<i class="fas fa-user"></i> ${userName}`;
            headerSignInBtn.onclick = () => this.openModal('flmUserProfileModal');
        }
    }
    
    updateUIForLoggedOutUser() {
        // Reset sign in button in header
        const headerSignInBtn = document.querySelector('.header-actions .btn-secondary');
        if (headerSignInBtn) {
            headerSignInBtn.innerHTML = '<i class="fas fa-user"></i> Sign In';
            headerSignInBtn.onclick = () => this.openModal('flmSignInModal');
        }
    }
    
    showError(message, elementId = 'flmSignInError') {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
    
    showSuccess(message, elementId = 'flmSignInSuccess') {
        const successDiv = document.getElementById(elementId);
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }
    
    // Get token for API calls
    getAuthToken() {
        return this.jellyfinToken;
    }
    
    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// Initialize authentication system when DOM is ready
let flmAuth;
document.addEventListener('DOMContentLoaded', () => {
    flmAuth = new FLMAuthSystem();
    window.flmAuth = flmAuth; // Make globally accessible
});

// Password visibility toggle
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
