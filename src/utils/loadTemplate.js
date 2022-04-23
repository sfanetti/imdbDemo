import { createId } from './rand.js'

export async function loadTemplateFromPath(path) {
    return await fetch(`${location.origin}${path}`).then(response => response.text());
} 


export async function loadComponentTemplate(name, _rawTemplate, _css) {
    const id = `${name}-${createId()}`;
    const path = `/src/components/${name}/template.html`;
    const stylePath = `/src/components/${name}/style.css`;

    let rawTemplate = _rawTemplate || document.getElementById(name);
    let templateString = '';
    let css = _css || await loadTemplateFromPath(stylePath); 
    if (!rawTemplate) {
        templateString = await loadTemplateFromPath(path); 
        rawTemplate = document.getElementById(name);
        if (!rawTemplate) {
            const body = document.getElementsByTagName('body')[0];
            body.insertAdjacentHTML('afterbegin', templateString);
            rawTemplate = document.getElementById(name);
        }

    }
    if (rawTemplate) {
        const templateContent = rawTemplate.content;
        const template = templateContent.cloneNode(true);
        template.id = id;
        return {
            rawTemplate,
            template,
            css,
            id,
        };
    }

}