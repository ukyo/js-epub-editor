$(function () {
    var origin = location.protocol + '//' + location.host,
        previewWindow,
        previewButton = $("#preview"),
        saveButton = $('#save'),
        exportButton = $("#export"),
        helpButton = $("#help"),
        openNewFileButton = $('#new-file'),
        openFileButton = $('#open'),
        saveDialog = $("#modal-save-as"),
        fileOpenDialog = $("#modal-open-file"),
        exportDialog = $("#modal-export"),
        helpDialog = $("#modal-help"),
        filenameLabel = $("#filename"),
        isSavedLabel = $('#is-saved'),
        isSaved = true;

    editor = ace.edit('editor');
    editor.getSession().setMode('ace/mode/markdown');
    
    shortcut.add('Ctrl+S', trySave);
    shortcut.add('Ctrl+Shift+S', showSaveDialog);
    shortcut.add('Ctrl+O', showFileOpenDialog);
    shortcut.add('Ctrl+Shift+O', openNewFile);

    openNewFileButton.click(openNewFile);
    openFileButton.click(showFileOpenDialog);
    saveButton.click(trySave);
    previewButton.click(function(e) {
        previewWindow = window.open('./view.html', '', 'width=800,height=600');
    });

    window.addEventListener('message', function (e) {
        if (e.origin !== origin) return;
        if (e.data === 'ready') send({preview: editor.getValue()});
    }, false);

    $("#modal-save-as .ok").click(function () {
        var filenameInput = $("#filename-input");
        var filename = filenameInput.val();
        if (filename !== '') {
            filenameLabel.text(filename);
            save(filename);
            saveDialog.modal('hide');
            filenameInput.val('');
        } else {
            alert('Filename is required!');
        }
    });

    $('#modal-export .ok').click(exportToEpub);


    document.querySelector('.ace_sb').addEventListener('scroll', function () {
        send({scroll: (this.scrollTop / this.scrollHeight)});
    }, false);

    var timer;
    editor.getSession().on('change', function() {
        isSaved = false;
        isSavedLabel.text('*');

        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            send({preview: editor.getValue()});
        }, 750);
    });
    

    var templates = {};
    var filenames = ['nav.xhtml', 'package.opf', 'body.xhtml', 'cover.xhtml'];

    filenames.forEach(function (filename, i) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'epub_resouce/' + filename);
        xhr.onloadend = function (e) {
            templates[filename] = xhr.responseText;
        };
        xhr.send();
    });

    function trySave () {
        if (filenameLabel.text() !== 'New file') {
            save(filenameLabel.text());
        } else{
            showSaveDialog();
        }
    }

    function save (filename) {
        localStorage['ePubMD_' + filename] = editor.getValue();
        isSavedLabel.text('');
        isSaved = true;
    }

    function open (filename) {
        editor.setValue(localStorage['ePubMD_' + filename]);
        editor.clearSelection();
        isSavedLabel.text('');
        isSaved = true;
    }

    function openNewFile () {
        if (!isSaved && !confirm('The current file is not saved. If you open a new file, it will be deleted.')) return;
        editor.setValue('');
        filenameLabel.text('New file');
        isSaved = true;
        isSavedLabel.text('');
    }

    function showSaveDialog () {
        saveDialog.modal('show');
        $("#filename-input").focus();
    }

    function showFileOpenDialog () {
        var filenames = Object.keys(localStorage);
        var ul = fileOpenDialog.find('ul');
        var selectedFilename = '';

        ul.empty();
        filenames.forEach(function (filename, i) {
            if(!/^ePubMD_.*/.test(filename)) return;
            var li = $('<li class="open-item">' + filename.substring(7) + '</li>');
            ul.append(li);
        });
        $('.open-item').click(function () {
            if (!isSaved && !confirm('The current file is not saved. If you open a new file, it will be deleted.')) return;
            var filename = $(this).text();
            open(filename);
            filenameLabel.text(filename);
            fileOpenDialog.modal('hide');
        });
            fileOpenDialog.modal('show');
    }

    function send (message) {
        if(previewWindow) previewWindow.postMessage(message, origin);
    }

    function exportToEpub () {
        var navView, packageView, bodyView, coverImage, language,
            author, direction, tree, title, date, ext,
            modified = '',
            items = [],
            itemrefs = [];

        title = $('#title-input').val();
        if (title === '') {
            alert('title is required.');
            return;
        }
        author = $('#author-input').val();
        language = $('#language-input').val();
        direction = $('[name="direction"]:checked').val();
        try {
            coverImage = $('#cover-input').get(0).files[0];
            ext = coverImage.type.split('/')[1];
        } catch (e) {
            coverImage = null;
        }
        

        tree = markdown.toHTML5Tree(editor.getValue(), 'GFM', {theme: 'ace-tm'});
        markdown.setIndices(tree);

        navView = {
            title: title,
            toc: markdown.getNavigation(tree, 'body.xhtml').innerHTML
        };

        date = new Date();
        modified += date.getUTCFullYear();
        modified += '-' + (date.getUTCMonth() < 10 ? '0' : '') + date.getUTCMonth();
        modified += '-' + (date.getUTCDate() < 10 ? '0' : '') + date.getUTCDate();
        modified += 'T' + (date.getUTCHours() < 10 ? '0' : '') + date.getUTCHours();
        modified += ':'  + (date.getUTCMinutes() < 10 ? '0' : '') + date.getUTCMinutes();
        modified += ':'  + (date.getUTCSeconds() < 10 ? '0' : '') + date.getUTCSeconds() + 'Z';

        if (coverImage) {
            items.push({
                id: 'cover.xhtml',
                href: 'cover.xhtml',
                'media-type': 'application/xhtml+xml'
            });
            items.push({
                id: 'cover.' + ext,
                href: 'cover.' + ext,
                'media-type': coverImage.type,
                properties: 'cover-image'
            });
            itemrefs.push({idref: 'cover.xhtml'});
        }

        items.push(
            {
                id: 'style.css', 
                href: 'style.css',
                'media-type': 'text/css'
            },
            {
                id: 'nav.xhtml',
                href: 'nav.xhtml',
                'media-type': 'application/xhtml+xml',
                properties: 'nav'
            },
            {
                id: 'body.xhtml',
                href: 'body.xhtml',
                'media-type': 'application/xhtml+xml'
            });
        itemrefs.push({idref: 'body.xhtml'});

        packageView = {
            title: title,
            uuid: uuid.v4(),
            lang: language,
            author: author,
            modified: modified,
            items: items,
            itemrefs: itemrefs,
            'page-progression-direction': direction
        };

        var elem = document.createElement('p');
        elem.innerHTML = markdown.renderJsonML(tree);
        var codes = elem.querySelectorAll('pre[class^=lang]');
        [].forEach.call(codes, function(v) {
            var code = v.querySelector('code');
            var lang = v.getAttribute('class').match(/lang-([a-zA-Z+]*)/)[1] || 'javascript';
            if(lang === 'c' || lang === 'cpp') lang = 'c_cpp';
            var node = ace.highlight(code.innerHTML, 'ace/mode/' + lang, 'ace-tm');
            v.innerHTML = node.innerHTML;
        });

        bodyView = {
            title: title,
            body: elem.innerHTML.replace(/&nbsp?;/g, '&#160;')
        };

        var files = [
            {name: 'mimetype', str: 'application/epub+zip', level: 0},
            {name: 'META-INF', dir: [
                {name: 'container.xml', url: 'epub_resouce/container.xml', level: 0}
            ]},
            {name: 'style.css', url: 'epub_resouce/style.css'},
            {name: 'nav.xhtml', str: Mustache.render(templates['nav.xhtml'], navView)},
            {name: 'package.opf', str: Mustache.render(templates['package.opf'], packageView)},
            {name: 'body.xhtml', str: Mustache.render(templates['body.xhtml'], bodyView)}
        ];

        if(coverImage) {
            var fileReader = new FileReader();
            var coverView = {
                ext: ext,
                title: title
            };

            fileReader.onloadend = function (e) {
                files.push({name: 'cover.' + ext, buffer: fileReader.result});
                files.push({name: 'cover.xhtml', str: Mustache.render(templates['cover.xhtml'], coverView)});
                exec();
            };
            fileReader.readAsArrayBuffer(coverImage);
        } else {
            exec();
        }

        function exec () {
            jz.zip.pack({
                files: files,
                complete: function (packed) {
                    var blob = new Blob([packed]);
                    var url = (window.URL || window.webkitURL).createObjectURL(blob);
                    var a = document.createElement('a');
                    a.download = title + '.epub';
                    a.href = url;

                    var e = document.createEvent("MouseEvent");
                    e.initEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                    a.dispatchEvent(e); 
                }
            });
        }
    }
});