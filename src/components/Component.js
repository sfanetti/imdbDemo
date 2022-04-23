import { loadComponentTemplate } from "../utils/loadTemplate.js";

export const MOUNTED = 'Component.mounted';
export const UNMOUNTED = 'Component.unmounted';
/**
 * Simple component base class
 */
export default class Component extends HTMLElement {
    static _identifier = 'component';
    static _rawTemplate;
    static _css;

    _id;
    _shadow;
    _template;

    _model = {};
    _isConnected = false;
    _hasHydrated = false;
    _eventIdFuncMappings = [];

    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        if (this.css) {
            const style = document.createElement('style');
            style.textContent = this.css;
            this._shadow.appendChild(style);
        }

        loadComponentTemplate(this.identifier, this.rawTemplate, this.css)
            .then(({ id, template, css, rawTemplate }) => {
                this.rawTemplate = rawTemplate;
                this.css = css;
                this._id = id;
                this._template = template;
                this.hydrate();
            });
    }

    set rawTemplate(rawTemplate) {
        Component._rawTemplate = rawTemplate;
    }
    get rawTemplate() {
        return Component._rawTemplate;
    }

    set css(css) {
        Component._css = css;
    }
    get css() {
        return Component._css;
    }

    get identifier() {
        // subclasses pass in their class identifier
    }

    get element() {
        if (this._shadow && this.id) {
            return this._shadow.querySelector(`#${this.id}`);
        }
    }

    get id() {
        return this._id;
    }

    async connectedCallback() {
        this.hydrate();
    }

    hydrate() {
        requestAnimationFrame(() => {
            if (!this._hasHydrated && this.identifier) {
                if (this.css && !this._shadow.querySelector('style')) {
                    const style = document.createElement('style');
                    style.textContent = this.css;
                    this._shadow.appendChild(style);
                }
                if (this.isConnected && this._template) {
                    this._hasHydrated = true;
                    this._shadow.appendChild(this._template);
                    this.offsetHeight;

                    requestAnimationFrame(() => {
                        this.didMount();
                        this.dispatchEvent(new CustomEvent(MOUNTED, { detail: this, bubbles: true }));
                    });
                }
            }
        });
    }

    deHydrate() {
        requestAnimationFrame(() => {
            this.removeBoundEventListeners();
            this.didUnmount();
            this.dispatchEvent(new CustomEvent(UNMOUNTED), { detail: { element: this } });
            this._hasHydrated = false;
            this._shadow.innerHTML = '';
        });
    }

    disconnectedCallback() {
        this.deHydrate();

    }

    attributeChangedCallback() {
    }

    getSelectorsFromModel(model) {
        return Object.keys(model).reduce((acc, key) => {
            acc[key] = `[data-bind=${key}]`;
            return acc;
        }, {});
    }

    getChildBySelector(selector) {
        try {
            return this._shadow.querySelector(selector);
        } catch (e) {
            console.log(`Could not find ${selector} in ${this.identifier}`);
        }
    }

    getChildrendBySelector(selector) {
        try {
            return Array.from(this._shadow.querySelectorAll(selector) || []);
        } catch (e) {
            console.log(`Could not find ${selector} in ${this.identifier}`);
        }
    }

    getSelectorMappedElements(selectorArray) {
        return selectorArray.reduce((acc, selector) => {
            const [, prop, attr] = selector.split('-');

            acc[prop] = this.getChildBySelector(selector);
            return acc;
        }, {});
    }

    updateTemplate() {
        const model = this._model
        if (this._hasHydrated && model) {
            const selectorMap = this.getSelectorsFromModel(model);
            Object.keys(selectorMap).forEach(key => {
                const selector = selectorMap[key];
                const value = model[key] || '';
                const defaultValue = model[`${key}Default`];
                if (selector) {
                    const elements = this.getChildrendBySelector(selector);
                    elements.forEach(element => {
                        if (element) {
                            if (element.tagName === 'IMG') {
                                if (defaultValue !== 'N/A') {
                                    const srcset = model['imageSrcSet'];
                                    if (srcset) {
                                        element.setAttribute('srcset', srcset);
                                    }
                                    element.classList.remove('no-image');
                                    element.setAttribute('src', defaultValue);
                                } else {
                                    element.classList.add('no-image');
                                    element.setAttribute('src', '/assets/icons/image-slash-duotone.svg');
                                }
                            } else {
                                element.innerHTML = value;
                            }
                        }
                    })
                }
            })
        }
    }

    requestUpdateTemplate() {
        requestAnimationFrame(() => {
            this.updateTemplate();
        })
    }

    didMount() {
        // set up event listeners and dom stuff
    }

    didUnmount() {
        // set up event listeners and dom stuff
    }


    /**
     * Adds bound events to listeners on elements specified by their id
     * @param {string} type 
     * @param {string} selector 
     * @param {function} listener 
     */
    addBoundEventMapping(type, selector, listener) {
        const key = `${type}-${selector}`;
        if (!this._eventIdFuncMappings[key]) {
            let boundListener;
            const el = this._shadow.querySelector(selector);
            if (el) {
                if (typeof listener === 'function') {
                    boundListener = listener.bind(this);
                    el.addEventListener(type, boundListener);
                }
                this._eventIdFuncMappings[key] = { type, selector, listener, boundListener };
            }
        }
    }
    removeBoundEventListeners() {
        Object.keys(this._eventIdFuncMappings).forEach(key => {
            const { type, selector, boundListener } = this._eventIdFuncMappings[key];
            const el = this._shadow.querySelector(selector);
            if (el) {
                el.removeEventListener(type, boundListener);
            }
            delete this._eventIdFuncMappings[key];
        });
    }
}