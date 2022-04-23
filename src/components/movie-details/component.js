import Component from "../Component.js";

export default class MovieDetails extends Component {
    static identifier = 'movie-details';
    static _rawTemplate;
    static _css;

    set rawTemplate(rawTemplate) {
        MovieDetails._rawTemplate = rawTemplate;
    }
    get rawTemplate() {
        return MovieDetails._rawTemplate;
    }

    set css(css) {
        MovieDetails._css = css;
    }
    get css() {
        return MovieDetails._css;
    }
    
    get identifier () {
        return MovieDetails.identifier;
    }

    get identifier () {
        return MovieDetails.identifier;
    }

    _model;
    _isLoading;
    _isError;

    set loading(value) {
        this._isLoading = value;
        this.classList.remove('hide');
        this.requestUpdateTemplate();
    }

    set error(value) {
        this._isError = value;
    }

    set model(model) {
        this._model = model;
        this.requestUpdateTemplate();

        const scrollContainer = this.getChildBySelector('.scroll-container');
        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        }
    }

    updateLoading() {
        const innerContainer = this.getChildBySelector('.inner-container');
        if (innerContainer) {
            if (this._isLoading) {
                innerContainer.classList.add('loading');
            } else {
                innerContainer.classList.remove('loading');
            }
        }

        const loadingContainer = this.getChildBySelector('.loading-icon-container');
        if (loadingContainer) {
            if (this._isLoading) {
                loadingContainer.classList.remove('hidden');
            } else {
                loadingContainer.classList.add('hidden');
            }
        }
    }

    updateTemplate() {
        super.updateTemplate();

        this.updateLoading();
    }

    onCloseClick() {
        this.classList.add('hide');
    }
    
    didMount() {
        const closeBtn = this.getChildBySelector('button.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', event => { this.onCloseClick(event)})
        }
    }
}