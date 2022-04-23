import Component from "../Component.js";
export const API_STORAGE_KEY = 'omdb-api-key';
export const SET_API_KEY = 'Settings.setApiKey';

export default class AppSettings extends Component {
    static identifier = 'app-settings';
    static _rawTemplate;
    static _css;

    set rawTemplate(rawTemplate) {
        AppSettings._rawTemplate = rawTemplate;
    }
    get rawTemplate() {
        return AppSettings._rawTemplate;
    }

    set css(css) {
        AppSettings._css = css;
    }
    get css() {
        return AppSettings._css;
    }

    get identifier () {
        return AppSettings.identifier;
    }

    constructor() {
        super();
        this._apiKey = localStorage.getItem(API_STORAGE_KEY) || '';
        this._locked = !!this._apiKey;

        this.requestUpdateTemplate();
    }

    _apiKey = '';
    _locked = '';
    _meta = { page: 1, pages: 1};

    set meta(meta) {
        this._meta = meta;
    }

    onSetApiKey(event) {
        const apiKey = event.target.value.trim();

        if (apiKey) {
            this._apiKey = apiKey;
        }
    }

    onLockApiKey() {
        if (!this._locked) {
            localStorage.setItem(API_STORAGE_KEY, this._apiKey);
            this.dispatchEvent(new CustomEvent(SET_API_KEY, {detail: { apiKey: this._apiKey }}));
        }
        this._locked = !this._locked;
        this.requestUpdateTemplate();
    }

    updateTemplate(){
        super.updateTemplate();
        const keyContainer = this.getChildBySelector('.api-key-container');
        const lockButton = this.getChildBySelector('.btn-lock');
        const lockObject = this.getChildBySelector('button > object');
        const input = this.getChildBySelector('input');

        if (input && this._apiKey) {
            input.value = this._apiKey;
        }

        if (this._locked) {
            if (keyContainer) keyContainer.classList.add('is-locked');

            if (input) {
                input.classList.add('is-locked');
                input.setAttribute('disabled', true);
            } 

            if (lockButton) lockButton.classList.add('is-locked');
            if (lockObject) lockObject.setAttribute('data', '/assets/icons/lock.svg');
        } else {
            if (keyContainer) keyContainer.classList.remove('is-locked');
            if (input) {
                input.classList.remove('is-locked');
                input.removeAttribute('disabled');
            }
            if (lockButton) lockButton.classList.remove('is-locked');
            if (lockObject) lockObject.setAttribute('data', '/assets/icons/unlock.svg');
        }
    }

    didMount () {
        this.requestUpdateTemplate();
        this.addBoundEventMapping('change', 'input', this.onSetApiKey);
        this.addBoundEventMapping('input', 'input', this.onSetApiKey);
        this.addBoundEventMapping('click', `.btn-lock`, this.onLockApiKey);

        this.addBoundEventMapping('click', `.btn-previous`, this.onPreviousPage);
        this.addBoundEventMapping('click', `.btn-next`, this.onNextPage);

        this.addBoundEventMapping('submit', `form`, this.onSubmit);

    }
}