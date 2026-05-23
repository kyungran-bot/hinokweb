document.addEventListener('DOMContentLoaded', () => {
    // 요소 선택
    const customCursor = document.querySelector('.custom-cursor');
    const cursorTrail = document.querySelector('.cursor-trail');
    const pieces = document.querySelectorAll('.cursor-piece');
    const logo = document.querySelector('.logo');
    const bgm = document.getElementById('bgm');
    const scrollContainer = document.querySelector('.scroll-container');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let isMovingTimeout;

    // 초기 마우스 위치 강제 설정 (커서가 0,0에 박혀있는 것 방지)
    const updateCursorPosition = (x, y) => {
        document.documentElement.style.setProperty('--mouse-x', `${x}px`);
        document.documentElement.style.setProperty('--mouse-y', `${y}px`);
    };
    updateCursorPosition(mouseX, mouseY);

    // 조각 상태 초기화 (초반의 그 부드럽게 따라오는 감성 복구)
    const pieceStates = Array.from(pieces).map((el, i) => {
        const speeds = [0.3, 0.25, 0.2, 0.15, 0.12, 0.08]; 
        return { el, x: mouseX, y: mouseY, speed: speeds[i] || 0.08 };
    });

    let trailX = mouseX;
    let trailY = mouseY;

    // 1. 오디오 제어 로직 (최대한 자동 재생 시도)
    let audioStarted = false;
    const playAudio = () => {
        if (!audioStarted && bgm) {
            bgm.play().then(() => {
                audioStarted = true;
            }).catch(e => {
                // 브라우저 정책으로 차단된 경우 콘솔에 알림 (사용자 상호작용 필요)
                console.log("Autoplay blocked. Waiting for interaction.");
            });
        }
    };

    // 로드 시 즉시 시도
    playAudio();

    // 브라우저 차단을 대비하여 어떤 움직임이든 감지되면 재생 시도
    const interactionEvents = ['mousedown', 'touchstart', 'mousemove', 'keydown', 'scroll'];
    interactionEvents.forEach(event => {
        document.addEventListener(event, playAudio, { once: true });
    });

    // 스크롤 시 오디오 볼륨 제어 및 GNB 표시
    const globalNav = document.querySelector('.global-nav');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', () => {
            const scrollTop = scrollContainer.scrollTop;
            
            // 오디오 볼륨 제어 (bgm 요소가 있을 때만)
            if (bgm) {
                const windowHeight = window.innerHeight;
                let volume = 1 - (scrollTop / windowHeight);
                if (volume < 0) volume = 0;
                if (volume > 1) volume = 1;
                bgm.volume = volume;
            }

            // GNB 표시 제어 (globalNav 요소가 있을 때만)
            if (globalNav) {
                if (scrollTop > 100) {
                    globalNav.classList.add('scrolled');
                } else {
                    globalNav.classList.remove('scrolled');
                }
            }
        });
    }

    // GNB 드롭다운 토글 제어 (ID 기반의 정밀 타겟팅)
    document.addEventListener('click', (e) => {
        const trigger = document.getElementById('menu-trigger');
        const nav = document.querySelector('.global-nav');
        
        // 트리거나 트리거 내부 요소가 클릭되었는지 확인
        if (trigger && (e.target === trigger || trigger.contains(e.target))) {
            e.preventDefault();
            e.stopPropagation(); // 이 시점에만 중단
            if (nav) nav.classList.toggle('active');
        } else if (nav && !nav.contains(e.target)) {
            // 메뉴 외부 클릭 시 닫기
            nav.classList.remove('active');
        }
    });

    // 마우스 움직임 감지
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);

        if (cursorTrail) cursorTrail.classList.add('is-moving');
        
        clearTimeout(isMovingTimeout);
        isMovingTimeout = setTimeout(() => {
            if (cursorTrail) cursorTrail.classList.remove('is-moving');
        }, 150);
    });

    // 클릭 파동
    document.addEventListener('click', (e) => {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 2000);
    });

    // 애니메이션 루프
    function animate() {
        // 조각들이 유연하게 따라오도록 로직 복구 (간격은 좁게 유지)
        pieceStates.forEach(state => {
            state.x += (mouseX - state.x) * state.speed;
            state.y += (mouseY - state.y) * state.speed;
            state.el.style.left = `${state.x}px`;
            state.el.style.top = `${state.y}px`;
        });

        trailX += (mouseX - trailX) * 0.4;
        trailY += (mouseY - trailY) * 0.4;
        if (cursorTrail) {
            cursorTrail.style.left = `${trailX}px`;
            cursorTrail.style.top = `${trailY}px`;
        }

        requestAnimationFrame(animate);
    }
    animate();

    // 로고 호버 인터랙션
    if (logo && customCursor) {
        logo.addEventListener('mouseenter', () => customCursor.classList.add('expanded'));
        logo.addEventListener('mouseleave', () => customCursor.classList.remove('expanded'));
    }

    // 브랜드 페이지 헤더 및 기타 인터랙티브 링크 호버 인터랙션
    const interactiveElements = document.querySelectorAll('.brand-header, .back-link, .brand-website, .dropdown-item');
    interactiveElements.forEach(el => {
        if (customCursor) {
            el.addEventListener('mouseenter', () => customCursor.classList.add('expanded'));
            el.addEventListener('mouseleave', () => customCursor.classList.remove('expanded'));
        }
    });

    // 작가 소개 페이지 (artist.html) 전용 휠(트랙패드 스와이프) 인터랙션 - 멀티 스텝
    const artistContainer = document.querySelector('.artist-scroll-container');
    if (artistContainer) {
        let artistStep = 0;
        let isScrolling = false;
        const maxStep = 3;

        window.addEventListener('wheel', (e) => {
            if (isScrolling) return; // 쿨다운 중이면 무시

            // 휠 감도(deltaY)를 체크하여 의도적인 스와이프만 감지
            if (Math.abs(e.deltaY) > 10) {
                if (e.deltaY > 0 && artistStep < maxStep) {
                    artistStep++;
                    updateArtistStep();
                } else if (e.deltaY < 0 && artistStep > 0) {
                    artistStep--;
                    updateArtistStep();
                }
            }
        }, { passive: true });

        function updateArtistStep() {
            isScrolling = true;
            // 기존 스텝 클래스 모두 제거
            document.body.classList.remove('artist-step-0', 'artist-step-1', 'artist-step-2', 'artist-step-3', 'scrolled-artist');
            // 새 스텝 클래스 추가
            document.body.classList.add(`artist-step-${artistStep}`);
            
            // 0.8초 쿨다운 (애니메이션 진행되는 동안 연속 스크롤 방지)
            setTimeout(() => {
                isScrolling = false;
            }, 800);
        }
        
        // 초기화
        document.body.classList.add('artist-step-0');
    }
});
