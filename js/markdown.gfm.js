(function(Markdown) {

Markdown.dialects.GFM = Markdown.subclassDialect(Markdown.dialects.Gruber);

Markdown.dialects.GFM.block.code_syntax_highlighting = function(block, next) {
    var ret = [],
        startRe = /^```(.*)\n?((.|\n)*)/,
        endRe = /(.|\n)*```\n?$/,
        m = block.match(startRe),
        lang, code, lineRe, isEnd;
    
    if(!block.match(startRe)) return undefined;

    lang = m[1];
    code = m[2];
    lineRe = new RegExp('^(?:' + (code.match(/(\s*)/)[1] || '') + ')(.*)\\n?');
    
    block_search:
    do {
        
        if(isEnd = endRe.test(code)) code = code.substring(0, code.length - 3);
        
        
        var b = this.loop_re_over_block(lineRe, code, function(m) {ret.push(m[1])});
        
        if(b.length) ret.push(b);

        if(next.length && !isEnd) {
            ret.push ( block.trailing.replace(/[^\n]/g, '').substring(2) );
            block = next.shift();
            code = block.valueOf();
        } else {
            break block_search;
        }
        
    } while(!isEnd);
    
    return [['code_block', {'class': 'lang-' + lang}, ret.join('\n')]];
};

Markdown.buildBlockOrder(Markdown.dialects.GFM.block);
Markdown.buildInlinePatterns(Markdown.dialects.GFM.inline);

})(markdown.Markdown);
