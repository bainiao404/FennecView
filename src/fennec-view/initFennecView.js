/**
 * FennecView Loader - Modular ES6 version
 * Setup boot sequence using static ES6 imports.
 */

import FennecView from './FennecView'

export async function initFennecView() {
    // Start the application flow
    FennecView.start();
    
    // Use ResizeObserver on app_canvas to handle initial layout and size changes robustly
    setTimeout(() => {
        const div = document.getElementById('app_canvas');
        if (div) {
            const observer = new ResizeObserver(() => {
                FennecView.onWindowResize();
            });
            observer.observe(div);
        }
    }, 50);
    
    // Initial resize trigger
    setTimeout(() => {
        FennecView.onWindowResize();
        FennecView.centerWorld();
    }, 100);
}
