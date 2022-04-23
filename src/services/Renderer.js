export default class Renderer {
    static _running = false;
    static _componentList = new Set();
    static _instance;
    static get instance() {
        if (!Renderer._instance) {
            Renderer._instance = new Renderer();
        }
        return Renderer._instance;
    }

    addComponent(component) {
        Renderer._componentList.add(component);
    }

    step () {
        Renderer._componentList.forEach(component => {
            if (component.isDirty) {
                component.willUnmount();
                component.unmount();
            }
            component.mount();
        });

        if (Renderer._running) {
            window.requestAnimationFrame(this.step.bind(this));
        }
    }

    start() {
        if (!Renderer._running) {
            Renderer._running = true;
            window.requestAnimationFrame(this.step.bind(this));
        }
    }

    stop() {
        if (Renderer._running) {
            Renderer._running = false;
        }
    }

    tearDown() {
        this.stop();
        Renderer._componentList.forEach(component => {
            component.willUnmount();
            component.unmount();
        });
    }
}