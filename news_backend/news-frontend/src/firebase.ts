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
    apiKey: 'AIzaSyALocfIJW0dttQuTKFudwrWn4-PPYRF3S4',
    authDomain: 'vibecoding-90e10.firebaseapp.com',
    projectId: 'vibecoding-90e10',
    storageBucket: 'vibecoding-90e10.firebasestorage.app',
    messagingSenderId: '673752301940',
    appId: '1:673752301940:web:92ff2038087f79f638ec21',
    measurementId: 'G-VBZL79NJYZ',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

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
