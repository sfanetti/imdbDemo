import Component from "../Component.js";

const IMAGE_UNAVAILABLE = 'N/A';
export default class ListMovieItem extends Component {
    static identifier = 'list-movie-item';
    static _rawTemplate;
    static _css;

    set rawTemplate(rawTemplate) {
        ListMovieItem._rawTemplate = rawTemplate;
    }
    get rawTemplate() {
        return ListMovieItem._rawTemplate;
    }

    set css(css) {
        ListMovieItem._css = css;
    }
    get css() {
        return ListMovieItem._css;
    }
    get identifier () {
        return ListMovieItem.identifier;
    }

    _elements = {};
    _eagerLoading = false;

    constructor(model) {
        super();
        this._model = model;
    }

    set eager (value) {
        this._eagerLoading = value;
    }

    set model (value) {
        this._model = value;
        this.requestUpdateTemplate();
    }

    get model() {
        return this._model;
    }

    updateImage() {
        const imageEl = this.getChildBySelector('img');
        if (imageEl) {
            imageEl.setAttribute('loading', this._eagerLoading ? 'eager' : 'lazy');
            imageEl.setAttribute('alt', this._model.title);

            const cleanup = () => {
                imageEl.onload = null;
                imageEl.onerror = null;
            }
            imageEl.onload = () => {
                imageEl.classList.add('loaded');
                cleanup();
            }
            imageEl.onerror = () => {
                imageEl.classList.add('error');
                cleanup();
            }
        }
    }

    updateTemplate() {
        super.updateTemplate();
        this.updateImage();
    }

    didMount() {
        this.updateTemplate();
    }
}