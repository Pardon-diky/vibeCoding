import React from 'react';

interface PoliticalGuidelineModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PoliticalGuidelineModal: React.FC<PoliticalGuidelineModalProps> = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 'var(--space-4)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-8)',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-xl)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-6)',
                        paddingBottom: 'var(--space-4)',
                        borderBottom: '1px solid var(--gray-200)',
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: 'var(--gray-900)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                        }}
                    >
                        🧠 정치성향 분석 가이드라인
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: 'var(--gray-500)',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            transition: 'all var(--transition-normal)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                                'var(--gray-100)';
                            e.currentTarget.style.color = 'var(--gray-700)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                'transparent';
                            e.currentTarget.style.color = 'var(--gray-500)';
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* 내용 */}
                <div style={{ lineHeight: '1.6' }}>
                    <div
                        style={{
                            backgroundColor: 'var(--blue-50)',
                            border: '1px solid var(--blue-200)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                            marginBottom: 'var(--space-6)',
                        }}
                    >
                        <h3
                            style={{
                                margin: '0 0 var(--space-2) 0',
                                color: 'var(--blue-900)',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                            }}
                        >
                            ⚠️ 중요 안내
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                color: 'var(--blue-800)',
                                fontSize: '0.9rem',
                            }}
                        >
                            본 정치성향 분석은{' '}
                            <strong>AI 기반 자동 분석</strong>에 의한 것이며,
                            개인의 특정 정치적 의도나 편향은 전혀 없습니다.
                            순수하게 뉴스 기사의 내용과 톤을 분석하여 객관적인
                            분류를 제공합니다.
                        </p>
                    </div>

                    <h3
                        style={{
                            margin: '0 0 var(--space-4) 0',
                            color: 'var(--gray-900)',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                        }}
                    >
                        📋 분석 가이드라인
                    </h3>

                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <h4
                            style={{
                                margin: '0 0 var(--space-3) 0',
                                color: 'var(--primary-700)',
                                fontSize: '1rem',
                                fontWeight: '600',
                            }}
                        >
                            🏛️ 정치성향 분류 기준
                        </h4>
                        <div
                            style={{
                                display: 'grid',
                                gap: 'var(--space-3)',
                                marginBottom: 'var(--space-4)',
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: 'var(--red-50)',
                                    border: '1px solid var(--red-200)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-3)',
                                }}
                            >
                                <strong style={{ color: 'var(--red-700)' }}>
                                    🔴 진보 (Progressive)
                                </strong>
                                <p
                                    style={{
                                        margin: 'var(--space-1) 0 0 0',
                                        fontSize: '0.9rem',
                                        color: 'var(--red-600)',
                                    }}
                                >
                                    사회적 변화, 평등, 진보적 정책을 지지하는
                                    내용
                                </p>
                            </div>
                            <div
                                style={{
                                    backgroundColor: 'var(--blue-50)',
                                    border: '1px solid var(--blue-200)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-3)',
                                }}
                            >
                                <strong style={{ color: 'var(--blue-700)' }}>
                                    🔵 보수 (Conservative)
                                </strong>
                                <p
                                    style={{
                                        margin: 'var(--space-1) 0 0 0',
                                        fontSize: '0.9rem',
                                        color: 'var(--blue-600)',
                                    }}
                                >
                                    전통적 가치, 안정성, 보수적 정책을 지지하는
                                    내용
                                </p>
                            </div>
                            <div
                                style={{
                                    backgroundColor: 'var(--gray-50)',
                                    border: '1px solid var(--gray-200)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-3)',
                                }}
                            >
                                <strong style={{ color: 'var(--gray-700)' }}>
                                    ⚪ 중립 (Neutral)
                                </strong>
                                <p
                                    style={{
                                        margin: 'var(--space-1) 0 0 0',
                                        fontSize: '0.9rem',
                                        color: 'var(--gray-600)',
                                    }}
                                >
                                    객관적 사실 전달, 균형잡힌 시각의 내용
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <h4
                            style={{
                                margin: '0 0 var(--space-3) 0',
                                color: 'var(--primary-700)',
                                fontSize: '1rem',
                                fontWeight: '600',
                            }}
                        >
                            🤖 AI 분석 방법론
                        </h4>
                        <ul
                            style={{
                                margin: 0,
                                paddingLeft: 'var(--space-6)',
                                color: 'var(--gray-700)',
                            }}
                        >
                            <li style={{ marginBottom: 'var(--space-2)' }}>
                                <strong>키워드 분석:</strong> 정치적 성향을
                                나타내는 단어와 표현 패턴 분석
                            </li>
                            <li style={{ marginBottom: 'var(--space-2)' }}>
                                <strong>톤 분석:</strong> 기사의 전체적인 톤과
                                어조 분석
                            </li>
                            <li style={{ marginBottom: 'var(--space-2)' }}>
                                <strong>내용 분석:</strong> 정책, 인물, 사건에
                                대한 서술 방식 분석
                            </li>
                            <li style={{ marginBottom: 'var(--space-2)' }}>
                                <strong>출처 분석:</strong> 언론사의 일반적인
                                편향성 고려
                            </li>
                        </ul>
                    </div>

                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <h4
                            style={{
                                margin: '0 0 var(--space-3) 0',
                                color: 'var(--primary-700)',
                                fontSize: '1rem',
                                fontWeight: '600',
                            }}
                        >
                            📊 신뢰도 및 한계
                        </h4>
                        <div
                            style={{
                                backgroundColor: 'var(--yellow-50)',
                                border: '1px solid var(--yellow-200)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-4)',
                            }}
                        >
                            <ul
                                style={{
                                    margin: 0,
                                    paddingLeft: 'var(--space-6)',
                                    color: 'var(--yellow-800)',
                                }}
                            >
                                <li style={{ marginBottom: 'var(--space-2)' }}>
                                    AI 분석의 정확도는 약{' '}
                                    <strong>85-90%</strong>로 추정됩니다
                                </li>
                                <li style={{ marginBottom: 'var(--space-2)' }}>
                                    복잡한 정치적 맥락이나 미묘한 뉘앙스는 놓칠
                                    수 있습니다
                                </li>
                                <li style={{ marginBottom: 'var(--space-2)' }}>
                                    분석 결과는 <strong>참고용</strong>이며,
                                    절대적 기준이 아닙니다
                                </li>
                                <li style={{ marginBottom: 'var(--space-2)' }}>
                                    지속적인 학습을 통해 분석 정확도가
                                    개선됩니다
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div
                        style={{
                            backgroundColor: 'var(--green-50)',
                            border: '1px solid var(--green-200)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                            textAlign: 'center',
                        }}
                    >
                        <h4
                            style={{
                                margin: '0 0 var(--space-2) 0',
                                color: 'var(--green-800)',
                                fontSize: '1rem',
                                fontWeight: '600',
                            }}
                        >
                            🎯 교육 목적
                        </h4>
                        <p
                            style={{
                                margin: 0,
                                color: 'var(--green-700)',
                                fontSize: '0.9rem',
                            }}
                        >
                            이 분석 도구는 학생들이{' '}
                            <strong>미디어 리터러시</strong>와
                            <strong>객관적 사고</strong>를 기를 수 있도록 돕는
                            교육용 프로젝트입니다.
                        </p>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: 'var(--space-6)',
                        paddingTop: 'var(--space-4)',
                        borderTop: '1px solid var(--gray-200)',
                    }}
                >
                    <button
                        onClick={onClose}
                        className="btn btn-primary"
                        style={{
                            padding: 'var(--space-3) var(--space-6)',
                            fontSize: '1rem',
                        }}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PoliticalGuidelineModal;

