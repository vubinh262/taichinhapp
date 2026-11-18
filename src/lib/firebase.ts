import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import cfg from '../../firebase-config.json';

/**
 * Các tên miền đang chạy trên Firebase Hosting của dự án.
 * Khi app mở từ một trong các tên miền này, đăng nhập Google dùng chính tên miền đó (authDomain),
 * nên chạy được cả trong app iPhone "Thêm vào Màn hình chính".
 */
export const hostingDomains: string[] = [
  `${cfg.projectId}.web.app`,
  `${cfg.projectId}.firebaseapp.com`,
  ...((cfg as { hostingDomains?: string[] }).hostingDomains || []),
];

const here = typeof location !== 'undefined' ? location.hostname : '';
export const isOnHosting = hostingDomains.includes(here);

export const firebaseConfig = {
  apiKey: cfg.apiKey,
  authDomain: isOnHosting ? here : cfg.authDomain,
  projectId: cfg.projectId,
  storageBucket: cfg.storageBucket,
  messagingSenderId: cfg.messagingSenderId,
  appId: cfg.appId,
  measurementId: cfg.measurementId,
};

export const firestoreDatabaseId = cfg.firestoreDatabaseId || '(default)';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db =
  firestoreDatabaseId && firestoreDatabaseId !== '(default)' ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or network status.');
    }
  }
}
testConnection();
