/**
 * FennecView Loader - Modular ES6 version
 * Setup boot sequence using static ES6 imports.
 */

import FennecView from './FennecView'

export async function initFennecView() {
    // Start the application flow
    FennecView.start();
    
    // Add window resize listener
    window.addEventListener('resize', () => FennecView.onWindowResize());
    
    // Initial resize trigger
    setTimeout(() => {
        FennecView.onWindowResize();
        FennecView.centerWorld();
    }, 100);
}
