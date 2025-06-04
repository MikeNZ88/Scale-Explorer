// Debug script to check modal functionality
console.log('🔍 Debug script loaded');

function debugModal() {
    console.log('🧪 Starting modal debug...');
    
    const modal = document.getElementById('scaleDiagramModal');
    const container = document.getElementById('scaleDiagramContainer');
    
    console.log('📦 Modal element:', modal);
    console.log('📦 Container element:', container);
    
    if (modal) {
        console.log('🎨 Modal computed styles:', {
            display: getComputedStyle(modal).display,
            position: getComputedStyle(modal).position,
            zIndex: getComputedStyle(modal).zIndex,
            background: getComputedStyle(modal).backgroundColor,
            width: getComputedStyle(modal).width,
            height: getComputedStyle(modal).height,
            visibility: getComputedStyle(modal).visibility,
            opacity: getComputedStyle(modal).opacity
        });
        
        console.log('📏 Modal dimensions:', {
            clientWidth: modal.clientWidth,
            clientHeight: modal.clientHeight,
            offsetWidth: modal.offsetWidth,
            offsetHeight: modal.offsetHeight,
            scrollWidth: modal.scrollWidth,
            scrollHeight: modal.scrollHeight
        });
        
        console.log('📍 Modal position:', {
            offsetLeft: modal.offsetLeft,
            offsetTop: modal.offsetTop,
            getBoundingClientRect: modal.getBoundingClientRect()
        });
    }
    
    if (container) {
        console.log('📦 Container innerHTML length:', container.innerHTML.length);
        console.log('📦 Container children count:', container.children.length);
        console.log('📦 Container content preview:', container.innerHTML.substring(0, 200) + '...');
    }
}

function forceShowModal() {
    console.log('🔨 Force showing modal...');
    const modal = document.getElementById('scaleDiagramModal');
    if (modal) {
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.zIndex = '99999';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        console.log('✅ Modal styles forced');
    }
}

function testFretboardDirect() {
    console.log('🎸 Testing fretboard directly...');
    
    const testContainer = document.createElement('div');
    testContainer.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50px;
        width: 500px;
        height: 300px;
        background: white;
        border: 2px solid red;
        z-index: 99999;
        padding: 20px;
    `;
    document.body.appendChild(testContainer);
    
    try {
        if (typeof Fretboard !== 'undefined') {
            console.log('✅ Fretboard class available');
            
            const fretboard = new Fretboard({
                el: testContainer,
                frets: 12,
                strings: 6
            });
            
            const testDots = [
                { string: 6, fret: 3, note: 'C', className: 'dot-root' },
                { string: 5, fret: 5, note: 'D', className: 'dot-note' },
                { string: 4, fret: 5, note: 'Eb', className: 'dot-note' }
            ];
            
            fretboard.setDots(testDots).render();
            console.log('✅ Test fretboard rendered');
            
            // Remove after 5 seconds
            setTimeout(() => {
                document.body.removeChild(testContainer);
                console.log('🗑️ Test fretboard removed');
            }, 5000);
            
        } else {
            console.log('❌ Fretboard class not available');
            testContainer.innerHTML = '<h3>Fretboard class not found!</h3>';
        }
    } catch (error) {
        console.error('❌ Error testing fretboard:', error);
        testContainer.innerHTML = `<h3>Error: ${error.message}</h3>`;
    }
}

// Make functions available globally
window.debugModal = debugModal;
window.forceShowModal = forceShowModal;
window.testFretboardDirect = testFretboardDirect;

console.log('🎯 Debug functions loaded. Try:');
console.log('- debugModal() - Check modal state');
console.log('- forceShowModal() - Force modal to show');
console.log('- testFretboardDirect() - Test fretboard outside modal'); 