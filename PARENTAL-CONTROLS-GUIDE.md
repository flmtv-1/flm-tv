# FLM TV PARENTAL CONTROLS - IMPLEMENTATION GUIDE

## 📦 FILES CREATED

1. **parental-controls.html** - Settings page for parents
2. **parental-controls.js** - JavaScript library for PIN checks

## 🚀 HOW TO IMPLEMENT

### Step 1: Deploy Files

Upload these files to your website root:
- `parental-controls.html`
- `parental-controls.js`

### Step 2: Add Script to Pages

Add this line to the `<head>` section of these files:
- `home.html` (index.html)
- `movie-detail.html`
- `category-detail.html`

```html
<script src="parental-controls.js"></script>
```

### Step 3: Add PIN Check to Movie Player

In `movie-detail.html`, find where the movie loads (around line 1365) and add this BEFORE loading the iframe:

```javascript
// Get movie rating from Jellyfin
const movieRating = movieData.OfficialRating || 'NR';
const movieTitle = movieData.Name;

// Check if user can watch
const canWatch = await ParentalControls.canWatchContent(movieTitle, movieRating);

if (!canWatch) {
    alert('Access denied - Parental controls active');
    history.back();
    return;
}

// Continue loading iframe...
```

### Step 4: Filter Content on Home Page

In `home.html`, after fetching Jellyfin content, filter it:

```javascript
// After getting items from Jellyfin
const filteredItems = ParentalControls.filterContent(items, (item) => {
    return item.OfficialRating || 'NR';
});

// Display only filtered items
displayItems(filteredItems);
```

### Step 5: Add Link to Parental Controls

Add a link in your app's settings/menu:

```html
<a href="parental-controls.html">
    <i class="fas fa-shield-alt"></i> Parental Controls
</a>
```

## ✨ FEATURES

### 1. PIN Protection
- Set 4-digit PIN code
- Required to watch restricted content
- Secret question for recovery

### 2. Kids Mode
- Only shows G, PG, PG-13 content
- Hides all mature categories
- Toggle on/off with PIN

### 3. Rating Restrictions
- Set maximum rating (G, PG, PG-13, R, NC-17)
- Content above limit requires PIN
- Syncs with Jellyfin ratings

### 4. Category Filtering
- Hide specific categories
- Customizable per family
- Instant effect on home page

### 5. Jellyfin Integration
- Uses Jellyfin's OfficialRating field
- Respects Jellyfin's rating system
- Compatible with existing content

## 🎯 USAGE EXAMPLES

### Example 1: Check if Movie Can Play
```javascript
const allowed = await ParentalControls.canWatchContent("The Matrix", "R");
if (allowed) {
    // Play movie
} else {
    // Block and redirect
}
```

### Example 2: Filter Category Content
```javascript
const filtered = ParentalControls.filterContent(movies, (movie) => movie.OfficialRating);
```

### Example 3: Check Kids Mode
```javascript
if (ParentalControls.isKidsModeActive()) {
    // Show only kids content
}
```

### Example 4: Request PIN
```javascript
const hasAccess = await ParentalControls.requestPIN('Enter PIN to access settings');
if (hasAccess) {
    // Allow access
}
```

## 🔧 CUSTOMIZATION

### Change PIN Length
Edit `parental-controls.html` line 155 - add more input fields

### Add More Ratings
Edit `parental-controls.js` line 27 - add to ratings object

### Custom Categories
Edit `parental-controls.html` line 580 - modify categories array

## 📱 MOBILE FRIENDLY

- Responsive design
- Touch-friendly controls
- Works on all devices

## 🛡️ SECURITY

- PIN stored in localStorage (client-side only)
- No server-side authentication needed
- Can be bypassed by clearing browser data (intentional for ease of recovery)

## ⚙️ SETTINGS STORAGE

All settings stored in localStorage as:
```javascript
{
    pin: "1234",
    secretQuestion: "...",
    secretAnswer: "...",
    kidsMode: true,
    maxRating: "PG-13",
    hiddenCategories: ["horror", "thriller"]
}
```

## 🎨 BRANDING

Colors match FLM TV theme:
- Primary: #ffd700 (Gold)
- Secondary: #22c55e (Green)
- Danger: #ce1126 (Red)

## 📝 NOTES

- Requires FontAwesome for icons
- Works with existing Jellyfin integration
- No backend changes needed
- Easy to enable/disable per user

## 🚨 IMPORTANT

After implementing, test thoroughly:
1. Set PIN and try to watch R-rated content
2. Enable Kids Mode and verify only G/PG/PG-13 shows
3. Hide categories and check home page
4. Test PIN recovery with secret question
5. Test on mobile devices

## 📞 SUPPORT

For issues or questions, check:
- Browser console for errors
- localStorage for settings
- Jellyfin ratings in metadata
