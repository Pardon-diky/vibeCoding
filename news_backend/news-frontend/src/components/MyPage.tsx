import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface MyPageProps {
    user: User;
    onLogout: () => void;
    onGoHome: () => void;
}

interface UserData {
    name?: string;
    nickname?: string;
    political_leaning_score?: number;
    politicalScore?: number;
    activityPoliticalScore?: number;
    scrappedNews?: any[];
    createdAt?: any;
    updatedAt?: any;
}

const MyPage: React.FC<MyPageProps> = ({ user, onLogout, onGoHome }) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        politicalScore: 50,
    });

    // 정치 성향 색상 반환 함수
    const getPoliticalColor = (score: number): string => {
        if (score <= 45) return '#ef4444'; // 보수 - 빨강
        if (score >= 56) return '#3b82f6'; // 진보 - 파랑
        return '#6b7280'; // 중립 - 회색
    };

    // 정치 성향 텍스트 반환 함수
    const getPoliticalAffiliationFromScore = (score: number): string => {
        if (score <= 45) return '보수';
        if (score >= 56) return '진보';
        return '중립';
    };

    // 사용자 데이터 가져오기
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    setFormData({
                        name: data.name || '',
                        nickname: data.nickname || '',
                        politicalScore:
                            data.political_leaning_score ||
                            data.politicalScore ||
                            50,
                    });
                }
            } catch (error) {
                console.error('사용자 데이터 가져오기 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user.uid]);

    // 프로필 업데이트
    const handleUpdateProfile = async () => {
        try {
            await setDoc(
                doc(db, 'users', user.uid),
                {
                    ...userData,
                    name: formData.name,
                    nickname: formData.nickname,
                    political_leaning_score: formData.politicalScore,
                    politicalScore: formData.politicalScore,
                    updatedAt: new Date(),
                },
                { merge: true }
            );

            setUserData((prev) => ({
                ...prev,
                name: formData.name,
                nickname: formData.nickname,
                political_leaning_score: formData.politicalScore,
                politicalScore: formData.politicalScore,
            }));

            setEditing(false);
            alert('프로필이 업데이트되었습니다.');
        } catch (error) {
            console.error('프로필 업데이트 실패:', error);
            alert('프로필 업데이트에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
                    <p className="text-gray-600 text-lg">로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* 상단 네비게이션 */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onGoHome}
                            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        >
                            <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            뒤로가기
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* 메인 프로필 카드 */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                    {/* 프로필 헤더 */}
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center space-x-6">
                                {/* 프로필 사진 */}
                                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 border-white/30">
                                    {userData?.nickname
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                        userData?.name
                                            ?.charAt(0)
                                            ?.toUpperCase() ||
                                        user?.email?.charAt(0)?.toUpperCase() ||
                                        'U'}
                                </div>

                                {/* 사용자 정보 */}
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold mb-2">
                                        {userData?.nickname ||
                                            userData?.name ||
                                            user?.email?.split('@')[0] ||
                                            '사용자'}
                                    </h1>
                                    <p className="text-blue-100 text-lg mb-4">
                                        {user?.email}
                                    </p>

                                    {/* 상태 표시 */}
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-blue-100">
                                                온라인
                                            </span>
                                        </div>
                                        <div className="text-blue-100">
                                            가입일:{' '}
                                            {userData?.createdAt
                                                ? new Date(
                                                      userData.createdAt
                                                          .seconds * 1000
                                                  ).toLocaleDateString('ko-KR')
                                                : '알 수 없음'}
                                        </div>
                                    </div>
                                </div>

                                {/* 편집 버튼 */}
                                <button
                                    onClick={() => setEditing(true)}
                                    className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-medium border border-white/30"
                                >
                                    ✏️ 프로필 편집
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 정치성향 분석 섹션 */}
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                            정치성향 분석
                        </h2>

                        {/* 두 개의 원형 차트 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
                            {/* 프로필 지수 */}
                            <div className="text-center">
                                <div className="relative w-40 h-40 mx-auto mb-6">
                                    <svg
                                        className="w-40 h-40 transform -rotate-90"
                                        viewBox="0 0 36 36"
                                    >
                                        <path
                                            className="text-gray-200"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="transition-all duration-1000"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            fill="none"
                                            strokeDasharray={`${
                                                (userData?.political_leaning_score ||
                                                    userData?.politicalScore ||
                                                    50) * 0.314
                                            }, 100`}
                                            style={{
                                                color: getPoliticalColor(
                                                    userData?.political_leaning_score ||
                                                        userData?.politicalScore ||
                                                        50
                                                ),
                                            }}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div
                                                className="text-3xl font-bold"
                                                style={{
                                                    color: getPoliticalColor(
                                                        userData?.political_leaning_score ||
                                                            userData?.politicalScore ||
                                                            50
                                                    ),
                                                }}
                                            >
                                                {userData?.political_leaning_score ||
                                                    userData?.politicalScore ||
                                                    50}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                점
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    프로필 지수
                                </h3>
                                <div
                                    className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                                    style={{
                                        color: getPoliticalColor(
                                            userData?.political_leaning_score ||
                                                userData?.politicalScore ||
                                                50
                                        ),
                                        backgroundColor:
                                            getPoliticalColor(
                                                userData?.political_leaning_score ||
                                                    userData?.politicalScore ||
                                                    50
                                            ) + '20',
                                    }}
                                >
                                    {getPoliticalAffiliationFromScore(
                                        userData?.political_leaning_score ||
                                            userData?.politicalScore ||
                                            50
                                    )}
                                </div>
                            </div>

                            {/* 활동 지수 */}
                            <div className="text-center">
                                <div className="relative w-40 h-40 mx-auto mb-6">
                                    <svg
                                        className="w-40 h-40 transform -rotate-90"
                                        viewBox="0 0 36 36"
                                    >
                                        <path
                                            className="text-gray-200"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="transition-all duration-1000"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            fill="none"
                                            strokeDasharray={`${
                                                (userData?.activityPoliticalScore ||
                                                    50) * 0.314
                                            }, 100`}
                                            style={{
                                                color: getPoliticalColor(
                                                    userData?.activityPoliticalScore ||
                                                        50
                                                ),
                                            }}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div
                                                className="text-3xl font-bold"
                                                style={{
                                                    color: getPoliticalColor(
                                                        userData?.activityPoliticalScore ||
                                                            50
                                                    ),
                                                }}
                                            >
                                                {userData?.activityPoliticalScore ||
                                                    50}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                점
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    활동 지수
                                </h3>
                                <div
                                    className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                                    style={{
                                        color: getPoliticalColor(
                                            userData?.activityPoliticalScore ||
                                                50
                                        ),
                                        backgroundColor:
                                            getPoliticalColor(
                                                userData?.activityPoliticalScore ||
                                                    50
                                            ) + '20',
                                    }}
                                >
                                    {getPoliticalAffiliationFromScore(
                                        userData?.activityPoliticalScore || 50
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 범례 */}
                        <div className="flex justify-center space-x-8 text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                <span>보수 (0-45)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                                <span>중립 (46-55)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                                <span>진보 (56-100)</span>
                            </div>
                        </div>
                    </div>

                    {/* 통계 섹션 */}
                    <div className="bg-gray-50 p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
                            활동 통계
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
                                <div className="text-3xl font-bold text-blue-600 mb-2">
                                    {userData?.scrappedNews?.length || 0}
                                </div>
                                <div className="text-gray-600">
                                    스크랩한 뉴스
                                </div>
                            </div>
                            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
                                <div className="text-3xl font-bold text-purple-600 mb-2">
                                    {userData?.political_leaning_score ||
                                        userData?.politicalScore ||
                                        50}
                                </div>
                                <div className="text-gray-600">프로필 점수</div>
                            </div>
                            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
                                <div className="text-3xl font-bold text-green-600 mb-2">
                                    {userData?.activityPoliticalScore || 50}
                                </div>
                                <div className="text-gray-600">활동 점수</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 프로필 수정 모달 */}
                {editing && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">
                                    프로필 수정
                                </h3>
                                <button
                                    onClick={() => setEditing(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        이름
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="이름을 입력하세요"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        닉네임
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nickname}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                nickname: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="닉네임을 입력하세요"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        정치 성향 지수:{' '}
                                        {formData.politicalScore}점
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.politicalScore}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                politicalScore: Number(
                                                    e.target.value
                                                ),
                                            }))
                                        }
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #ef4444 0%, #6b7280 50%, #3b82f6 100%)`,
                                        }}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span className="text-red-500">
                                            0 (보수)
                                        </span>
                                        <span className="text-gray-500">
                                            50 (중립)
                                        </span>
                                        <span className="text-blue-500">
                                            100 (진보)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex space-x-4 pt-4">
                                    <button
                                        onClick={handleUpdateProfile}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        저장하기
                                    </button>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPage;
