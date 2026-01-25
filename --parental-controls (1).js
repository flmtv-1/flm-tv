// ═══════════════════════════════════════════════════════════════
//  FLM TV - PARENTAL CONTROL SYSTEM
//  Include this file in all pages that need parental controls
// ═══════════════════════════════════════════════════════════════

const ParentalControls = {
    CONFIG_KEY: 'flmtv_parental_controls',
    
    // Get current settings
    getSettings() {
        return JSON.parse(localStorage.getItem(this.CONFIG_KEY) || '{}');
    },
    
    // Save settings
    saveSettings(settings) {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(settings));
    },
    
    // Check if PIN is set
    hasPIN() {
        const settings = this.getSettings();
        return !!settings.pin;
    },
    
    // Check if Kids Mode is active
    isKidsModeActive() {
        const settings = this.getSettings();
        return settings.kidsMode === true;
    },
    
    // Get maximum allowed rating
    getMaxRating() {
        const settings = this.getSettings();
        return settings.maxRating || 'R';
    },
    
    // Rating hierarchy (lower number = more restrictive)
    getRatingLevel(rating) {
        const ratings = {
            'G': 1,
            'PG': 2,
            'PG-13': 3,
            'R': 4,
            'NC-17': 5,
            'NR': 5, // Not Rated - treat as most restrictive
            'UNRATED': 5
        };
        return ratings[rating] || 5;
    },
    
    // Check if content rating is allowed
    isRatingAllowed(contentRating) {
        const settings = this.getSettings();
        
        // If Kids Mode is on, only allow G, PG, PG-13
        if (settings.kidsMode) {
            const allowedInKidsMode = ['G', 'PG', 'PG-13'];
            return allowedInKidsMode.includes(contentRating);
        }
        
        // Otherwise check against max rating
        const maxRating = settings.maxRating || 'R';
        const maxLevel = this.getRatingLevel(maxRating);
        const contentLevel = this.getRatingLevel(contentRating);
        
        return contentLevel <= maxLevel;
    },
    
    // Check if category is hidden
    isCategoryHidden(categoryId) {
        const settings = this.getSettings();
        return settings.hiddenCategories && settings.hiddenCategories.includes(categoryId);
    },
    
    // Prompt for PIN
    async requestPIN(message = 'Enter PIN to continue') {
        return new Promise((resolve) => {
            const settings = this.getSettings();
            
            if (!settings.pin) {
                // No PIN set, allow access
                resolve(true);
                return;
            }
            
            const enteredPin = prompt(message);
            
            if (enteredPin === null) {
                // User cancelled
                resolve(false);
                return;
            }
            
            if (enteredPin === settings.pin) {
                resolve(true);
            } else {
                alert('❌ Incorrect PIN');
                resolve(false);
            }
        });
    },
    
    // Show PIN dialog with custom UI
    showPINDialog(contentTitle, contentRating) {
        return new Promise((resolve) => {
            const settings = this.getSettings();
            
            if (!settings.pin) {
                resolve(true);
                return;
            }
            
            // Create modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: #1a1f2e;
                    padding: 2rem;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    border: 2px solid #ffd700;
                ">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                    <h2 style="color: #ffd700; margin-bottom: 0.5rem;">Restricted Content</h2>
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 1rem;">
                        "${contentTitle}" is rated ${contentRating}
                    </p>
                    <p style="color: rgba(255,255,255,0.9); margin-bottom: 1.5rem; font-weight: 600;">
                        Enter PIN to watch
                    </p>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem;">
                        <input type="password" maxlength="1" id="pinModal1" style="width: 50px; height: 50px; text-align: center; font-size: 1.5rem; background: #0a0f1a; border: 2px solid #444; border-radius: 8px; color: white;">
                        <input type="password" maxlength="1" id="pinModal2" style="width: 50px; height: 50px; text-align: center; font-size: 1.5rem; background: #0a0f1a; border: 2px solid #444; border-radius: 8px; color: white;">
                        <input type="password" maxlength="1" id="pinModal3" style="width: 50px; height: 50px; text-align: center; font-size: 1.5rem; background: #0a0f1a; border: 2px solid #444; border-radius: 8px; color: white;">
                        <input type="password" maxlength="1" id="pinModal4" style="width: 50px; height: 50px; text-align: center; font-size: 1.5rem; background: #0a0f1a; border: 2px solid #444; border-radius: 8px; color: white;">
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button id="pinSubmit" style="flex: 1; background: #22c55e; border: none; color: white; padding: 0.75rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                            Submit
                        </button>
                        <button id="pinCancel" style="flex: 1; background: #ce1126; border: none; color: white; padding: 0.75rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                    <p style="color: rgba(255,255,255,0.5); margin-top: 1rem; font-size: 0.85rem;">
                        <a href="parental-controls.html" style="color: #ffd700; text-decoration: none;">Forgot PIN?</a>
                    </p>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Focus first input
            document.getElementById('pinModal1').focus();
            
            // Auto-advance inputs
            ['pinModal1', 'pinModal2', 'pinModal3', 'pinModal4'].forEach((id, index) => {
                const input = document.getElementById(id);
                input.oninput = () => {
                    if (input.value.length === 1 && index < 3) {
                        document.getElementById(['pinModal1', 'pinModal2', 'pinModal3', 'pinModal4'][index + 1]).focus();
                    }
                };
            });
            
            // Submit button
            document.getElementById('pinSubmit').onclick = () => {
                const pin = 
                    document.getElementById('pinModal1').value +
                    document.getElementById('pinModal2').value +
                    document.getElementById('pinModal3').value +
                    document.getElementById('pinModal4').value;
                
                if (pin === settings.pin) {
                    document.body.removeChild(modal);
                    resolve(true);
                } else {
                    alert('❌ Incorrect PIN');
                    // Clear inputs
                    ['pinModal1', 'pinModal2', 'pinModal3', 'pinModal4'].forEach(id => {
                        document.getElementById(id).value = '';
                    });
                    document.getElementById('pinModal1').focus();
                }
            };
            
            // Cancel button
            document.getElementById('pinCancel').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };
            
            // Press Enter to submit
            modal.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('pinSubmit').click();
                }
            });
        });
    },
    
    // Check if content can be watched
    async canWatchContent(contentTitle, contentRating) {
        // Check if rating is allowed
        if (this.isRatingAllowed(contentRating)) {
            return true;
        }
        
        // Rating not allowed, request PIN
        return await this.showPINDialog(contentTitle, contentRating);
    },
    
    // Filter content list based on settings
    filterContent(contentArray, getRatingFunc) {
        const settings = this.getSettings();
        
        if (!settings.kidsMode && !settings.maxRating) {
            // No restrictions
            return contentArray;
        }
        
        return contentArray.filter(item => {
            const rating = getRatingFunc(item);
            return this.isRatingAllowed(rating);
        });
    },
    
    // Show Kids Mode indicator
    showKidsModeIndicator() {
        if (!this.isKidsModeActive()) return;
        
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #22c55e;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        indicator.innerHTML = `
            <i class="fas fa-child"></i>
            Kids Mode Active
        `;
        document.body.appendChild(indicator);
    }
};

// Auto-show Kids Mode indicator
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ParentalControls.showKidsModeIndicator();
    });
} else {
    ParentalControls.showKidsModeIndicator();
}

console.log('🛡️ Parental Controls loaded');
