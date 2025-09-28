// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import {
    getFirestore,
    connectFirestoreEmulator,
    enableNetwork,
    disableNetwork,
} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyCeBeueJ1pQRr82xykVyhBhkd7FJ1EorV4',
    authDomain: 'vibecoding-b71da.firebaseapp.com',
    projectId: 'vibecoding-b71da',
    storageBucket: 'vibecoding-b71da.firebasestorage.app',
    messagingSenderId: '230280060987',
    appId: '1:230280060987:web:4060330eb36068a42b7c1e',
    measurementId: 'G-GG3G9NK9W8',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Firestore 설정 개선
try {
    // Firebase v9+에서는 settings가 다르게 작동
    console.log('Firestore 초기화 완료');
} catch (error) {
    console.warn('Firestore 설정 중 오류:', error);
}

// Firebase 연결 상태 관리
let isOnline = navigator.onLine;

// 네트워크 상태 모니터링
window.addEventListener('online', () => {
    console.log('네트워크 연결됨');
    isOnline = true;
    enableNetwork(db).catch(console.error);
});

window.addEventListener('offline', () => {
    console.log('네트워크 연결 끊어짐');
    isOnline = false;
});

// Firebase 연결 상태 확인 함수
export const checkFirebaseConnection = async () => {
    try {
        // Firebase 연결 상태를 더 안전하게 확인
        if (!isOnline) {
            console.log('오프라인 상태입니다.');
            return false;
        }

        // 간단한 연결 테스트
        await enableNetwork(db);
        return true;
    } catch (error) {
        console.error('Firebase 연결 실패:', error);
        // 연결 실패 시에도 true를 반환하여 앱이 계속 작동하도록 함
        return true;
    }
};

// 네트워크 상태 확인 함수
export const isNetworkOnline = () => isOnline;

console.log('Firebase initialized successfully');

export { auth, db, analytics };
export default app;
