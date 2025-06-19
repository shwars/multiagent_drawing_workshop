class ExhibitApp {
    constructor() {
        this.items = [];
        this.currentItemIndex = 0;
        this.currentView = 'file-selection';
        this.typingSpeed = 15; // ms per character
        this.readyTextDelay = 3000; // 3 seconds after typing
        this.agentColors = {};
        this.agentColorPalette = [
            '#4a9eff', // blue
            '#ff9900', // orange
            '#00ff00', // green
            '#ff4a4a', // red
            '#b266ff', // purple
            '#ffd700', // gold
            '#00e6e6', // cyan
            '#ff66cc', // pink
            '#cccccc', // gray
        ];
        this.nextColorIdx = 0;

        // DOM elements
        this.views = {
            'file-selection': document.getElementById('file-selection-view'),
            'exhibit': document.getElementById('exhibit-view')
        };
        this.originalImage = document.getElementById('original-image');
        this.dialogContainer = document.getElementById('dialog-text-container');
        this.finalImage = document.getElementById('final-image');
        this.explicationText = document.getElementById('explication-text');
        this.directoryInput = document.getElementById('directory-input');
        this.imageMeta = document.getElementById('image-meta');

        this.init();
    }

    init() {
        this.directoryInput.addEventListener('change', (e) => this.handleDirectorySelect(e));
    }

    async handleDirectorySelect(event) {
        const files = Array.from(event.target.files);
        const items = new Map();

        // Group files by their base name
        files.forEach(file => {
            const name = file.name;
            if (name.endsWith('_yart.png')) {
                const baseName = name.replace('_yart.png', '');
                if (!items.has(baseName)) {
                    items.set(baseName, {
                        concept: baseName,
                        files: new Map()
                    });
                }
                items.get(baseName).files.set('original', file);
            } else if (name.endsWith('_dialog.txt')) {
                const baseName = name.replace('_dialog.txt', '');
                if (!items.has(baseName)) {
                    items.set(baseName, {
                        concept: baseName,
                        files: new Map()
                    });
                }
                items.get(baseName).files.set('dialog', file);
            } else if (name.endsWith('_multiagent.png')) {
                const baseName = name.replace('_multiagent.png', '');
                if (!items.has(baseName)) {
                    items.set(baseName, {
                        concept: baseName,
                        files: new Map()
                    });
                }
                items.get(baseName).files.set('final', file);
            } else if (name.endsWith('_explication.txt')) {
                const baseName = name.replace('_explication.txt', '');
                if (!items.has(baseName)) {
                    items.set(baseName, {
                        concept: baseName,
                        files: new Map()
                    });
                }
                items.get(baseName).files.set('explication', file);
            } else if (name.endsWith('.json')) {
                const baseName = name.replace('.json', '');
                if (!items.has(baseName)) {
                    items.set(baseName, {
                        concept: baseName,
                        files: new Map()
                    });
                }
                items.get(baseName).files.set('meta', file);
            }
        });

        // Convert to array and filter out incomplete items
        this.items = Array.from(items.values())
            .filter(item => 
                item.files.has('original') && 
                item.files.has('dialog') && 
                item.files.has('final')
            );

        if (this.items.length > 0) {
            this.showView('exhibit');
            this.showCurrentItem();
        } else {
            alert('No complete exhibit items found. Please make sure all required files are present.');
        }
    }

    async showCurrentItem() {
        const item = this.items[this.currentItemIndex];
        if (!item) return;

        // Clear previous dialog and meta
        this.dialogContainer.innerHTML = '';
        this.imageMeta.innerHTML = '';

        // Load and display images
        this.originalImage.src = URL.createObjectURL(item.files.get('original'));
        this.finalImage.src = URL.createObjectURL(item.files.get('final'));

        // Load and display meta if available
        if (item.files.has('meta')) {
            try {
                const metaFile = item.files.get('meta');
                const metaText = await metaFile.text();
                const meta = JSON.parse(metaText);
                this.imageMeta.innerHTML = `
                    <div class="meta-title">${meta.title || ''}</div>
                    <div class="meta-concept">${meta.concept || ''}</div>
                    <div class="meta-author">${meta.author || ''}</div>
                `;
            } catch (e) {
                this.imageMeta.innerHTML = '';
            }
        }

        // Start dialog typing
        await this.showDialog(item);
    }

    async showView(viewName) {
        // Add exiting class to current view
        const currentView = Object.values(this.views).find(view => view.classList.contains('active'));
        if (currentView) {
            currentView.classList.add('exiting');
        }

        // Show new view after a small delay to allow exit animation to start
        setTimeout(() => {
            if (currentView) {
                currentView.classList.remove('active');
                currentView.classList.remove('exiting');
            }
            Object.values(this.views).forEach(view => view.classList.remove('active'));
            this.views[viewName].classList.add('active');
        }, 500);
    }

    async showDialog(item) {
        try {
            const dialogFile = item.files.get('dialog');
            let text = await dialogFile.text();
            text = text.replace(/\r/g, ''); // Remove all \r
            const lines = text.split('\n').filter(line => line.trim());

            for (const line of lines) {
                const lineElement = document.createElement('div');
                lineElement.className = 'dialog-line';
                this.dialogContainer.appendChild(lineElement);

                let speaker = '';
                let content = line;
                let isStatus = false;

                // Detect agent name as everything before first ':' (no spaces)
                const match = line.match(/^([^\s:]+):\s*(.*)$/);
                if (match) {
                    speaker = match[1] + ':';
                    content = match[2];
                } else if (line === 'ГОТОВО') {
                    speaker = '';
                    content = 'ГОТОВО';
                    isStatus = true;
                } else {
                    speaker = '';
                    content = line;
                }

                // Assign color to agent if not already assigned
                let speakerClass = '';
                let speakerStyle = '';
                if (speaker && !isStatus) {
                    if (!this.agentColors[speaker]) {
                        this.agentColors[speaker] = this.agentColorPalette[this.nextColorIdx % this.agentColorPalette.length];
                        this.nextColorIdx++;
                    }
                    speakerStyle = `color: ${this.agentColors[speaker]}`;
                } else if (isStatus) {
                    speakerStyle = 'color: #00ff00; font-weight: bold;';
                }

                const speakerSpan = document.createElement('span');
                speakerSpan.className = 'dialog-line-speaker';
                if (speakerStyle) speakerSpan.setAttribute('style', speakerStyle);
                speakerSpan.textContent = speaker;
                lineElement.appendChild(speakerSpan);

                if (content) {
                    const contentSpan = document.createElement('span');
                    contentSpan.className = 'content';
                    lineElement.appendChild(contentSpan);

                    await this.typeText(contentSpan, content);
                }
                
                lineElement.classList.add('visible');

                // Only scroll if overflow appears
                const dialogBox = this.dialogContainer.parentElement;
                if (dialogBox.scrollHeight > dialogBox.clientHeight) {
                    dialogBox.scrollTop = dialogBox.scrollHeight;
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Wait after dialog is complete
            await new Promise(resolve => setTimeout(resolve, this.readyTextDelay));

            // Show explication view (final image + explication only)
            await this.showExplication(item);
        } catch (error) {
            console.error('Error loading dialog:', error);
        }
    }

    async showExplication(item) {
        // Hide original-image-container and dialog-container, show explication-container in right-section
        const rightSection = document.querySelector('.right-section');
        const originalImageContainer = document.querySelector('.original-image-container');
        const dialogContainer = document.querySelector('.dialog-container');
        const explicationContainer = document.getElementById('explication-container');
        const explicationText = document.getElementById('explication-text');
        if (originalImageContainer) originalImageContainer.style.display = 'none';
        if (dialogContainer) dialogContainer.style.display = 'none';
        if (explicationContainer) explicationContainer.style.display = '';

        // Load and display explication
        if (item.files.has('explication')) {
            try {
                const explicationFile = item.files.get('explication');
                const text = await explicationFile.text();
                explicationText.innerHTML = this.formatMarkdown ? this.formatMarkdown(text) : text;
            } catch (error) {
                explicationText.textContent = '';
            }
        } else {
            explicationText.textContent = '';
        }

        // Wait 10 seconds, then show next item
        setTimeout(() => {
            // Restore original-image-container and dialog-container, hide explication
            if (originalImageContainer) originalImageContainer.style.display = '';
            if (dialogContainer) dialogContainer.style.display = '';
            if (explicationContainer) explicationContainer.style.display = 'none';
            this.currentItemIndex = (this.currentItemIndex + 1) % this.items.length;
            this.showCurrentItem();
        }, 10000);
    }

    async typeText(element, text) {
        element.classList.add('typing');
        element.textContent = '';
        
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            const delay = Math.random() * 5 + this.typingSpeed;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        element.classList.remove('typing');
    }

    formatMarkdown(text) {
        // Basic markdown formatting
        return text
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\s*[-*+]\s+(.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^(?!<[h|u|b|p|li])(.*$)/gm, '<p>$1</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<\/p>\s*<p>/g, '</p><p>');
    }
}

// Initialize the app
new ExhibitApp(); 