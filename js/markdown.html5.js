// Released under MIT license
// Copyright (c) 2012 Syu Kato <ukyo.web@gmail.com>
markdown.toHTML5 = function(source, dialect, options) {
    var tree = this.toHTML5Tree(source, dialect, options);
    return this.renderJsonML(tree);
};

markdown.toHTML5Tree = function(source, dialect, options) {
    return (function to5(tree, level) {
        var i, m,
            indices = [],
            hx = 'h' + level,
            n = tree.length,
            blocks = [];
        
        if(!n) return [];
        
        function set(start, end) {
            blocks.push(['section', ['h1', tree[start][1]]].concat(to5(tree.slice(start + 1, end), level + 1)));
        }
        
        for(i = 0; i < n && hx !== tree[i][0]; ++i) blocks.push(tree[i]);
        for(i = 0; i < n; ++i) if(hx === tree[i][0]) indices.push(i);
        for(i = 0, m = indices.length - 1; i < m; ++i) set(indices[i], indices[i + 1]);
        if(indices.length) set(indices[m], n);
        
        return blocks;
    })(this.toHTMLTree(source, dialect, options), 1);
};

markdown.highlightCode = function(tree, theme) {
    
    if(tree[0] === 'pre') {
        var lang = tree[1]['class'].match(/lang-([a-zA-Z+]*)/)[1] || 'javascript',
            code = tree[2][1],
            dummy = document.createElement('p'),
            lines = [],
            result = ['ol', {'class': theme + ' source-code'}],
            editor;
            
        function createLine() {
            return ['li', {'class': 'ace_line'}];
        }
        
        function createToken(obj) {
            if(obj.type === 'text') return ['span', obj.value];
            return [
                'span',
                {'class': obj.type.split('.').map(function(v){return 'ace_' + v}).join(' ')},
                obj.value
            ];
        }
        
        dummy.textContent = code;
        editor = ace.edit(dummy);
        editor.getSession().setMode('ace/mode/' + lang);
        for(var i = 0, n = code.split('\n').length; i < n; ++i) {
            lines[i] = editor.getSession().getTokens(i);
        }
        
        lines.forEach(function(v) {
            var line = createLine();
            v.forEach(function(v) {
                line.push(createToken(v));
            });
            result.push(line);
        });
        
        tree[2][1] = result;
    }
    
    for(var i = 0, n = tree.length; i < n; ++i) {
        if(Array.isArray(tree[i])) markdown.highlightCode(tree[i], theme);
    }
    
    
};
