// Use Firebase Admin SDK to bypass security rules
const admin = require('firebase-admin');

// Path to your service account key
const serviceAccount = require('../scripts/kokorowole.json'); // You need to download this

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://projecttimesheet-6110e.firebaseio.com"
});

const db = admin.firestore();

async function generateInviteCode() {
  try {
    // Generate a random code
    const code = 'ADMIN' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const inviteCode = {
      code: code,
      generatedBy: 'system',
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiresAt,
      isUsed: false,
      maxUses: 1,
      usedBy: null,
      usedAt: null
    };
    
    const docRef = await db.collection('admin_invite_codes').add(inviteCode);
    
    console.log('✅ Admin invite code generated successfully!');
    console.log('Code:', code);
    console.log('Expires:', expiresAt.toLocaleDateString());
    console.log('Document ID:', docRef.id);
    
    return { code, expiresAt };
  } catch (error) {
    console.error('❌ Error generating invite code:', error);
    throw error;
  }
}

// Run the function
generateInviteCode().catch(console.error);