import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  collection, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  addDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';
import { UserProfile, LiveRoom, PostMoment, ChatMessage, AppEvent, UserReport, NotificationItem, AppRelease } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigData);

// Auth instance
export const auth = getAuth(app);

// Firestore instance with the provisioned databaseId and forced long-polling
// to prevent proxy buffering, sandbox websocket dropouts, and connection errors
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true
}, firebaseConfigData.firestoreDatabaseId || '(default)');

// Validate connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection check: client operating in offline mode.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Storage instance with the provisioned storageBucket
export const storage = getStorage(app, firebaseConfigData.storageBucket || undefined);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  } catch (err: any) {
    const isUserDismissal = err?.code === 'auth/popup-closed-by-user' || 
                            err?.code === 'auth/cancelled-popup-request' ||
                            err?.message?.includes('popup-closed-by-user');
    if (!isUserDismissal) {
      console.warn("Google sign in notice:", err?.message || err);
    }
    throw err;
  }
};

/**
 * Securely load or create user profile in Firestore (/users/{userId})
 */
export const syncUserProfileWithFirestore = async (firebaseUser: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<UserProfile> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userEmail = firebaseUser.email?.toLowerCase().trim() || '';
  const isAdmin = userEmail === 'wajaht265374@gmail.com';

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const loadedProfile: UserProfile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        username: data.username || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'StarUser'),
        displayName: data.displayName || firebaseUser.displayName || 'Star User',
        email: firebaseUser.email || data.email || '',
        avatar: firebaseUser.photoURL || data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        bio: data.bio || 'Living the StarLive vibes 🌟 Music, Live streams & Good Friends.',
        country: data.country || 'Global',
        countryFlag: data.countryFlag || '🌐',
        coins: typeof data.coins === 'number' ? data.coins : 12000,
        diamonds: typeof data.diamonds === 'number' ? data.diamonds : 0,
        level: typeof data.level === 'number' ? data.level : 1,
        role: isAdmin ? 'admin' : 'user',
        followersCount: typeof data.followersCount === 'number' ? data.followersCount : 0,
        followingCount: typeof data.followingCount === 'number' ? data.followingCount : 0,
        badges: Array.isArray(data.badges) ? data.badges : ['Star Explorer'],
        isVerified: data.isVerified ?? true,
        createdAt: data.createdAt || new Date().toISOString()
      };

      if (isAdmin && data.role !== 'admin') {
        await updateDoc(userRef, { role: 'admin' }).catch(() => {});
      } else if (!isAdmin && data.role === 'admin') {
        await updateDoc(userRef, { role: 'user' }).catch(() => {});
      }
      return loadedProfile;
    }
  } catch (err) {
    console.warn("Could not read user profile from firestore:", err);
  }

  // Create newly registered profile in Firestore
  const generatedUsername = firebaseUser.email ? firebaseUser.email.split('@')[0] : `user_${firebaseUser.uid.substring(0, 6)}`;
  const newProfile: UserProfile = {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    username: generatedUsername,
    displayName: firebaseUser.displayName || 'Star User',
    email: firebaseUser.email || '',
    avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    bio: 'Living the StarLive vibes 🌟 Music, Live streams & Good Friends.',
    country: 'Global',
    countryFlag: '🌐',
    coins: 12000, // 12,000 Welcome Coins
    diamonds: 0,
    level: 1,
    role: isAdmin ? 'admin' : 'user',
    followersCount: 0,
    followingCount: 0,
    badges: ['Star Explorer', 'Google Verified'],
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(userRef, {
      ...newProfile,
      usernameLower: generatedUsername.toLowerCase()
    });
  } catch (err) {
    console.warn("Could not save new user profile to firestore:", err);
  }

  return newProfile;
};

export const findEmailByUsername = async (username: string): Promise<string | null> => {
  const clean = username.trim();
  if (!clean) return null;
  try {
    const q1 = query(collection(db, 'users'), where('username', '==', clean));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const email = snap1.docs[0].data().email;
      if (email) return email;
    }
    const q2 = query(collection(db, 'users'), where('usernameLower', '==', clean.toLowerCase()));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const email = snap2.docs[0].data().email;
      if (email) return email;
    }
  } catch (err) {
    console.warn("Could not find user by username:", err);
  }
  return null;
};

export const signInWithEmail = async (email: string, pass: string) => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (err: any) {
    console.warn("Firebase Auth signInWithEmail note:", err?.code || err?.message);
    throw err;
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (err: any) {
    console.warn("Firebase Auth registerWithEmail note:", err?.code || err?.message);
    throw err;
  }
};

export const publishApkLinkRelease = async (releaseData: {
  version: string;
  versionCode?: number;
  fileName?: string;
  fileSizeMb?: string | number;
  downloadUrl: string;
  changelog?: string;
  publishedBy?: string;
  minAndroidVersion?: string;
}): Promise<AppRelease> => {
  const releaseId = `release-${Date.now()}`;
  let sizeBytes = 28500000;
  if (typeof releaseData.fileSizeMb === 'number') {
    sizeBytes = Math.round(releaseData.fileSizeMb * 1024 * 1024);
  } else if (typeof releaseData.fileSizeMb === 'string') {
    const parsed = parseFloat(releaseData.fileSizeMb.replace(/[^\d.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      sizeBytes = Math.round(parsed * 1024 * 1024);
    }
  }

  const cleanVersion = releaseData.version.startsWith('v') ? releaseData.version : `v${releaseData.version}`;
  const cleanCode = releaseData.versionCode || parseInt(cleanVersion.replace(/\D/g, '') || '10300', 10) * 100;
  const fileName = releaseData.fileName || `StarLive_${cleanVersion}.apk`;

  const newRelease: AppRelease = {
    id: releaseId,
    version: cleanVersion,
    versionCode: cleanCode,
    fileName,
    fileSize: sizeBytes,
    downloadUrl: releaseData.downloadUrl.trim(),
    storagePath: `links/${fileName}`,
    changelog: releaseData.changelog || 'Performance improvements, live stream stability, and party room enhancements.',
    publishedAt: new Date().toISOString(),
    publishedBy: releaseData.publishedBy || 'wajaht265374@gmail.com',
    isActive: true,
    downloadsCount: 0,
    status: 'published',
    minAndroidVersion: releaseData.minAndroidVersion || 'Android 7.0+'
  };

  // 1. Mark previous active releases in Firestore as archived
  try {
    const existingReleasesSnapshot = await getDocs(collection(db, 'appReleases'));
    const archivePromises: Promise<any>[] = [];
    existingReleasesSnapshot.forEach((docSnap) => {
      if (docSnap.id !== 'active') {
        const data = docSnap.data();
        if (data.isActive) {
          archivePromises.push(
            updateDoc(doc(db, 'appReleases', docSnap.id), {
              isActive: false,
              status: 'archived'
            })
          );
        }
      }
    });
    await Promise.all(archivePromises);
  } catch (err) {
    console.warn("Could not archive existing releases:", err);
  }

  // 2. Save new release document
  try {
    await setDoc(doc(db, 'appReleases', releaseId), newRelease);
  } catch (err) {
    console.error("Failed to save new release to Firestore:", err);
  }

  // 3. Set active release document
  try {
    await setDoc(doc(db, 'appReleases', 'active'), {
      ...newRelease,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Failed to set active release document:", err);
  }

  return newRelease;
};

export const signInGuest = async () => {
  try {
    const res = await signInAnonymously(auth);
    return res.user;
  } catch (err) {
    console.warn("Anonymous sign in error:", err);
    throw err;
  }
};

export const logoutUser = async () => {
  return signOut(auth);
};

// ==========================================
// APK RELEASES & FIREBASE STORAGE OPERATIONS
// ==========================================

export const uploadApkFileToStorage = (
  file: File,
  version: string,
  onProgress?: (percent: number) => void
): Promise<{ downloadUrl: string; storagePath: string; fileName: string; fileSize: number }> => {
  return new Promise((resolve, reject) => {
    // Sanitize version and generate unique filename with timestamp
    const cleanVersion = version.replace(/[^a-zA-Z0-9._-]/g, '');
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const finalFileName = cleanOriginalName.endsWith('.apk')
      ? cleanOriginalName.replace('.apk', `_${cleanVersion}_${timestamp}.apk`)
      : `StarLive_${cleanVersion}_${timestamp}.apk`;

    const storagePath = `apks/${finalFileName}`;
    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: 'application/vnd.android.package-archive',
      cacheControl: 'no-cache, no-store, must-revalidate, max-age=0',
      customMetadata: {
        version: cleanVersion,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0 && onProgress) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        console.error("Firebase Storage APK upload failed:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileName: finalFileName,
            fileSize: file.size
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

export const publishNewApkRelease = async (
  releaseData: {
    version: string;
    versionCode: number;
    fileName: string;
    fileSize: number;
    downloadUrl: string;
    storagePath: string;
    changelog?: string;
    publishedBy?: string;
    minAndroidVersion?: string;
  }
): Promise<AppRelease> => {
  const releaseId = `release-${Date.now()}`;
  const newRelease: AppRelease = {
    id: releaseId,
    version: releaseData.version,
    versionCode: releaseData.versionCode,
    fileName: releaseData.fileName,
    fileSize: releaseData.fileSize,
    downloadUrl: releaseData.downloadUrl,
    storagePath: releaseData.storagePath,
    changelog: releaseData.changelog || 'Latest performance enhancements and bug fixes.',
    publishedAt: new Date().toISOString(),
    publishedBy: releaseData.publishedBy || 'admin',
    isActive: true,
    downloadsCount: 0,
    status: 'published',
    minAndroidVersion: releaseData.minAndroidVersion || 'Android 7.0 (Nougat) +'
  };

  // 1. Mark all previous releases in Firestore as archived/inactive
  try {
    const existingReleasesSnapshot = await getDocs(collection(db, 'appReleases'));
    const archivePromises: Promise<any>[] = [];
    existingReleasesSnapshot.forEach((docSnap) => {
      if (docSnap.id !== 'active') {
        const data = docSnap.data();
        if (data.isActive) {
          archivePromises.push(
            updateDoc(doc(db, 'appReleases', docSnap.id), {
              isActive: false,
              status: 'archived'
            })
          );
        }
      }
    });
    await Promise.all(archivePromises);
  } catch (err) {
    console.warn("Could not archive existing releases:", err);
  }

  // 2. Write the new release document in 'appReleases'
  try {
    await setDoc(doc(db, 'appReleases', releaseId), newRelease);
  } catch (err) {
    console.error("Failed to save new release to Firestore:", err);
  }

  // 3. Update the single 'appReleases/active' pointer document with latest active APK
  try {
    await setDoc(doc(db, 'appReleases', 'active'), {
      ...newRelease,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Failed to set active release document:", err);
  }

  return newRelease;
};

export const fetchActiveApkFromDb = async (): Promise<AppRelease | null> => {
  try {
    const activeDocSnap = await getDoc(doc(db, 'appReleases', 'active'));

    if (activeDocSnap && activeDocSnap.exists()) {
      const data = activeDocSnap.data();
      if (data && data.downloadUrl && data.version) {
        return {
          id: data.id || 'active',
          version: data.version,
          versionCode: data.versionCode || 100,
          fileName: data.fileName || `StarLive_${data.version}.apk`,
          fileSize: data.fileSize || 25000000,
          downloadUrl: data.downloadUrl,
          storagePath: data.storagePath || '',
          changelog: data.changelog || '',
          publishedAt: data.publishedAt || new Date().toISOString(),
          publishedBy: data.publishedBy || 'admin',
          isActive: true,
          downloadsCount: data.downloadsCount || 0,
          status: 'published',
          minAndroidVersion: data.minAndroidVersion || 'Android 7.0+'
        };
      }
    }

    // Fallback query if 'active' pointer is not populated yet
    const q = query(
      collection(db, 'appReleases'),
      where('isActive', '==', true)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const firstDoc = snap.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() } as AppRelease;
    }
  } catch (err) {
    console.error("Error fetching active APK from DB:", err);
  }
  return null;
};

export const triggerDirectApkDownload = async (release: AppRelease) => {
  if (!release.downloadUrl) {
    throw new Error("No download URL found for this release.");
  }

  // Prevent browser, CDN, and intermediate proxy caching by generating a dynamic cache-busting query
  const separator = release.downloadUrl.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  const cacheBustingUrl = `${release.downloadUrl}${separator}nocache=${timestamp}&v=${encodeURIComponent(release.version)}&nonce=${Math.random().toString(36).substring(2, 9)}`;

  // Create temporary invisible anchor and trigger browser download
  const downloadLink = document.createElement('a');
  downloadLink.href = cacheBustingUrl;
  downloadLink.setAttribute('download', release.fileName || `StarLive_${release.version}.apk`);
  downloadLink.setAttribute('target', '_blank');
  downloadLink.setAttribute('rel', 'noopener noreferrer');
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // Increment download count in Firestore
  try {
    if (release.id && release.id !== 'active') {
      await updateDoc(doc(db, 'appReleases', release.id), {
        downloadsCount: increment(1)
      });
    }
    await updateDoc(doc(db, 'appReleases', 'active'), {
      downloadsCount: increment(1)
    });
  } catch (e) {
    // Non-blocking metric increment
  }
};

