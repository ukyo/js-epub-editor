(function(ace) {

/**
 * syntax highlight
 * @param {string} text
 * @param {string} mode
 * @param {string} theme
 * @return HTMLElement
 */
function highlight(text, mode, theme) {
    var dummy = document.createElement('p'),
        result = document.createElement('ol'),
        wrap = document.createElement('pre'),
        lines = [],
        editor;
        
    function createLine() {
        var line = document.createElement('li');
        line.setAttribute('class', 'ace_line');
        return line;
    }
    
    function createToken(obj) {
        var token = document.createElement('span');
        if(obj.type === 'text') {
            return document.createTextNode(obj.value);
        } else {
            token.setAttribute('class', obj.type.split('.').map(function(v){return 'ace_' + v}).join(' '));
            token.innerHTML = escapeHTML(obj.value);
        }
        return token;
    }
    
    function escapeHTML(s) {
        return s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/  /g, '&#160;&#160;');
    }
    
    //create a dummy element and set to editor.
    dummy.innerHTML = escapeHTML(text);
    editor = ace.edit(dummy);
    editor.getSession().setMode(mode);
    
    for(var i = 0, n = text.split('\n').length; i < n; ++i) {
        lines[i] = editor.getSession().getTokens(i);
    }
    
    //convert js objects to dom.
    lines.forEach(function(v) {
        if(!v) return;
        var line = createLine();
        v.forEach(function(v) {
            line.appendChild(createToken(v));
        });
        result.appendChild(line);
    });
    
    result.setAttribute('class', theme);
    wrap.appendChild(result);
    
    return wrap;
}

ace.highlight = highlight;

})(ace);
