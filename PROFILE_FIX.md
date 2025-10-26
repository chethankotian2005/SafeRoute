# Profile Upload & User Document Fix

## Issues Fixed

### 1. **User Document Error** ✅
**Error**: `No document to update: projects/saferoute-2d2ad/databases/(default)/documents/users/lJNzK5iwovXzEPknuhGrY4ZVuQm1`

**Root Cause**: The user document didn't exist in Firestore when trying to update it.

**Solution**: Modified `updateUserDocument()` in `firebaseService.js` to:
- Check if document exists first
- If exists → use `updateDoc()`
- If doesn't exist → use `setDoc()` to create it

```javascript
// Before
await updateDoc(userRef, updates); // Fails if document doesn't exist

// After
const userSnap = await getDoc(userRef);
if (userSnap.exists()) {
  await updateDoc(userRef, updates);
} else {
  await setDoc(userRef, updates); // Creates new document
}
```

### 2. **Storage Permission Error** ⚠️
**Error**: `Firebase Storage: User does not have permission to access 'profile_pictures/...'`

**Root Cause**: Firebase Storage rules may not be deployed or authentication issue.

**Solution Steps**:

## Deployment Instructions

### Step 1: Deploy Firebase Rules
You need to deploy your Firestore and Storage rules to Firebase:

```powershell
# Deploy all rules
firebase deploy --only firestore:rules,storage:rules
```

If you don't have Firebase CLI installed:
```powershell
npm install -g firebase-cli
firebase login
firebase use saferoute-2d2ad
firebase deploy --only firestore:rules,storage:rules
```

### Step 2: Verify Authentication
Make sure the user is properly authenticated:

```javascript
// In EditProfileScreen, the user should be logged in
const user = auth.currentUser;
console.log('User ID:', user?.uid);
console.log('User email:', user?.email);
```

### Step 3: Test the Fix

1. **Log out and log in again** to refresh authentication
2. Navigate to Profile → Edit Profile
3. Try uploading a profile picture
4. Update your name/bio/phone
5. Save profile

**Expected Logs**:
```
✅ User ID: lJNzK5iwovXzEPknuhGrY4ZVuQm1
✅ Uploading to: profile_pictures/lJNzK5iwovXzEPknuhGrY4ZVuQm1/profile.jpg
✅ Upload complete: https://...
✅ Profile updated successfully
```

## Storage Rules Verification

Your `storage.rules` file should look like this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isValidSize() {
      return request.resource.size < 5 * 1024 * 1024;
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    match /profile_pictures/{userId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() 
        && request.auth.uid == userId 
        && isValidSize() 
        && isImage();
    }
  }
}
```

## Firestore Rules Verification

Your `firestore.rules` should have:

```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update, delete: if isOwner(userId);
}
```

## Troubleshooting

### If Still Getting Storage Error:

1. **Check Firebase Console**:
   - Go to Firebase Console → Storage → Rules
   - Verify rules are deployed (check timestamp)

2. **Check Authentication**:
   ```javascript
   // Add to EditProfileScreen before saveProfile()
   console.log('Auth state:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
   console.log('User UID:', auth.currentUser?.uid);
   ```

3. **Temporary Fix (for testing only)**:
   In Firebase Console → Storage → Rules, temporarily set:
   ```javascript
   allow read, write: if request.auth != null;
   ```
   **⚠️ CHANGE THIS BACK after testing!**

### If Document Still Not Creating:

Check if user document was created during signup:

```javascript
// In SignupScreen, after creating user:
await createUserDocument(user.uid, {
  email: user.email,
  displayName: name || user.email.split('@')[0],
  createdAt: new Date(),
});
```

## Quick Deploy Command

```powershell
# From SafeRoute directory
firebase deploy --only firestore:rules,storage:rules
```

## Testing Checklist

- [ ] Firebase rules deployed successfully
- [ ] User is authenticated (check logs)
- [ ] User document exists or is created
- [ ] Profile picture uploads successfully
- [ ] Profile data saves correctly
- [ ] No errors in console

---

**Note**: The user document fix is already applied. You just need to deploy the Firebase rules!
