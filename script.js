// YGGtorrent Regex Generator for Autobrr
// Application state
let currentContentType = 'serie-tv';
let selectedFilters = {
    quality: [],
    language: [],
    source: [],
    codec: [],
    seasonEpisode: [],
    releaseGroup: false,
    yearMin: null,
    yearMax: null,
    seasonMin: null,
    seasonMax: null,
    specificGroup: ''
};

// YGGtorrent pattern database
const yggPatterns = {
    'serie-tv': {
        examples: [
            'The.Institute.2025.S01E05.MULTi.1080p.WEB.H264-LUCKY',
            'All.Rise.S01E16.Prise.d.otage.MULTi.1080p.WEB.H264-THESYNDICATE',
            'Secret.Story.S13E57.Zone.Secrete.10.FRENCH.1080p.WEB.H264-BTT'
        ],
        basePattern: '.*\\.S\\d{2}E\\d{2}\\..*'
    },
    'animation-serie': {
        examples: [
            'Witch.Watch.S01E16.MULTi.1080p.WEB-DL.x264-T3KASHi',
            'My.Dress-Up.Darling.S02E05.VOSTFR.1080p.WEBRiP.x265-ARONA'
        ],
        basePattern: '.*\\.S\\d{2}E\\d{2}\\..*'
    },
    'film': {
        examples: [
            'Dans.Ma.Peau.2002.VOF.Bluray.Remux.2160p.HEVC.HDR10.DV.DTS-HDMA.ZatNik07',
            'MK.Ultra.2022.VOSTFR.1080p.WEB.AC3.5.1.x264-NOTAG'
        ],
        basePattern: '.*\\.(19|20)\\d{2}\\..*'
    },
    'documentaire': {
        examples: [
            'Les.100.lieux.qu.il.faut.voir.S12E05.03.08.2025.DOC.FRENCH.AD.1080p.WEB.H264-THESYNDICATE',
            'la.vie.en.fluo.-.briller.pour.survivre.2023.FRENCH.1080p.WEB.X265'
        ],
        basePattern: '.*(DOC|documentaire|2023|2024|2025).*'
    },
    'emission-tv': {
        examples: [
            'Secret.Story.S13E57.Zone.Secrete.10.FRENCH.1080p.WEB.H264-BTT',
            'Fort.Boyard.S36E05.Association.Gregory.Lemarchal.02.08.2025.FRENCH.1080p.WEB.H264-THESYNDICATE'
        ],
        basePattern: '.*\\.(S\\d{2}E\\d{2}|\\d{2}\\.\\d{2}\\.\\d{4}).*'
    },
    'sport': {
        examples: [
            'WWE.SUMMERSLAM.SATURDAY.2025.WEB.VF.1080p.H264',
            'Formule.1.S2025E75.Grand.Prix.Hongrie.Essais.qualificatifs.02.08.2025.FRENCH.1080p.WEB.DDP.x264-THESYNDICATE'
        ],
        basePattern: '.*(WWE|Formule|Football|Tennis|NBA|NHL).*'
    },
    'presse': {
        examples: [
            'Pack Journaux italiens du 3 août 2025 PDF - IT',
            'Femme.actuelle.N.2132.02.Août.2025.pdf.fr-G11'
        ],
        basePattern: '.*(PDF|Magazine|Journal).*'
    },
    'app-mobile': {
        examples: [
            '[Android] Waze Magical Unicorn v5.9.90.901 Mod [APK]'
        ],
        basePattern: '.*\\[Android\\].*\\[APK\\].*'
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initContentTypeSelector();
    initFilterControls();
    initTester();
    initExportControls();
    updateSeriesVisibility();
    generateRegex();
});

// Navigation between sections
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.dataset.target;
            
            // Update active navigation
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(target).classList.add('active');
        });
    });
}

// Content type selection
function initContentTypeSelector() {
    const contentButtons = document.querySelectorAll('.content-btn');
    
    contentButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active content type
            contentButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update current content type
            currentContentType = button.dataset.type;
            updateSeriesVisibility();
            generateRegex();
            loadContentExamples();
        });
    });
}

// Show/hide series-specific controls
function updateSeriesVisibility() {
    const seriesControls = document.querySelectorAll('.series-only');
    const isSeriesType = currentContentType.includes('serie') || currentContentType === 'animation-serie' || currentContentType === 'emission-tv';
    
    seriesControls.forEach(control => {
        control.style.display = isSeriesType ? 'block' : 'none';
    });
}

// Initialize filter controls
function initFilterControls() {
    // Checkbox filters
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });
    
    // Number inputs
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('input', handleFilterChange);
    });
    
    // Text inputs
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => {
        if (input.id === 'specificGroup') {
            input.addEventListener('input', handleFilterChange);
        }
    });
}

// Handle filter changes
function handleFilterChange() {
    updateSelectedFilters();
    generateRegex();
}

// Update selected filters from form
function updateSelectedFilters() {
    // Reset filters
    selectedFilters = {
        quality: [],
        language: [],
        source: [],
        codec: [],
        seasonEpisode: [],
        releaseGroup: false,
        yearMin: null,
        yearMax: null,
        seasonMin: null,
        seasonMax: null,
        specificGroup: ''
    };
    
    // Collect checkbox values
    ['quality', 'language', 'source', 'codec', 'season-episode'].forEach(filterType => {
        const checkboxes = document.querySelectorAll(`input[name="${filterType}"]:checked`);
        const key = filterType.replace('-', '') === 'seasonepisode' ? 'seasonEpisode' : filterType.replace('-', '');
        selectedFilters[key] = Array.from(checkboxes).map(cb => cb.value);
    });
    
    // Release group
    const releaseGroupCheckbox = document.querySelector('input[name="release-group"]:checked');
    selectedFilters.releaseGroup = !!releaseGroupCheckbox;
    
    // Year range
    selectedFilters.yearMin = document.getElementById('yearMin')?.value || null;
    selectedFilters.yearMax = document.getElementById('yearMax')?.value || null;
    
    // Season range
    selectedFilters.seasonMin = document.getElementById('seasonMin')?.value || null;
    selectedFilters.seasonMax = document.getElementById('seasonMax')?.value || null;
    
    // Specific group
    selectedFilters.specificGroup = document.getElementById('specificGroup')?.value || '';
}

// Generate regex based on current filters
function generateRegex() {
    let regexParts = ['^'];
    let explanation = [];
    
    // Start with base pattern for content type
    const contentPattern = yggPatterns[currentContentType];
    if (contentPattern) {
        regexParts.push('.*');
        
        // Add year pattern for films
        if (currentContentType === 'film') {
            if (selectedFilters.yearMin || selectedFilters.yearMax) {
                const yearPattern = buildYearPattern();
                if (yearPattern) {
                    regexParts.push(yearPattern);
                    explanation.push(`Année: ${yearPattern}`);
                }
            } else {
                regexParts.push('\\.(19|20)\\d{2}\\.');
                explanation.push('Année: format standard (1900-2099)');
            }
        }
        
        // Add season/episode pattern for series
        if (currentContentType.includes('serie') || currentContentType === 'animation-serie' || currentContentType === 'emission-tv') {
            const seasonPattern = buildSeasonEpisodePattern();
            if (seasonPattern) {
                regexParts.push(seasonPattern);
                explanation.push(`Saison/Épisode: ${seasonPattern}`);
            }
        }
        
        regexParts.push('.*');
        
        // Add language filter
        if (selectedFilters.language.length > 0) {
            const langPattern = `(${selectedFilters.language.join('|')})`;
            regexParts.push(langPattern);
            explanation.push(`Langue: ${selectedFilters.language.join(', ')}`);
            regexParts.push('.*');
        }
        
        // Add quality filter
        if (selectedFilters.quality.length > 0) {
            const qualityPattern = `(${selectedFilters.quality.join('|')})`;
            regexParts.push(qualityPattern);
            explanation.push(`Qualité: ${selectedFilters.quality.join(', ')}`);
            regexParts.push('.*');
        }
        
        // Add source filter
        if (selectedFilters.source.length > 0) {
            const sourcePattern = `(${selectedFilters.source.map(s => s.replace('Ray', '[Rr]ay')).join('|')})`;
            regexParts.push(sourcePattern);
            explanation.push(`Source: ${selectedFilters.source.join(', ')}`);
            regexParts.push('.*');
        }
        
        // Add codec filter
        if (selectedFilters.codec.length > 0) {
            const codecPattern = `(${selectedFilters.codec.join('|')})`;
            regexParts.push(codecPattern);
            explanation.push(`Codec: ${selectedFilters.codec.join(', ')}`);
            regexParts.push('.*');
        }
        
        // Add release group pattern
        if (selectedFilters.releaseGroup) {
            if (selectedFilters.specificGroup) {
                regexParts.push(`-${selectedFilters.specificGroup}`);
                explanation.push(`Release Group: ${selectedFilters.specificGroup}`);
            } else {
                regexParts.push('-[A-Za-z0-9]+');
                explanation.push('Release Group: capture automatique');
            }
        }
    }
    
    regexParts.push('$');
    
    // Clean up regex (remove multiple .* sequences)
    let regex = regexParts.join('').replace(/\.\*\.\*/g, '.*');
    
    // Update UI
    const regexElement = document.getElementById('generatedRegex');
    const explanationElement = document.getElementById('regexExplanation');
    
    if (regexElement) {
        regexElement.textContent = regex;
    }
    
    if (explanationElement) {
        explanationElement.innerHTML = 
            explanation.length > 0 ? explanation.map(e => `• ${e}`).join('<br>') : 'Regex de base pour tous les contenus';
    }
    
    // Update tester if regex is being used there
    const testRegexInput = document.getElementById('testRegex');
    if (testRegexInput && testRegexInput.value === '') {
        testRegexInput.value = regex;
    }
}

// Build year pattern
function buildYearPattern() {
    const min = selectedFilters.yearMin;
    const max = selectedFilters.yearMax;
    
    if (min && max) {
        if (min === max) {
            return `\\.${min}\\.`;
        } else {
            // For range, create a more complex pattern
            return `\\.(${min}|${max}|[0-9]{4})\\.`;
        }
    } else if (min) {
        return `\\.(${min}|[0-9]{4})\\.`;
    } else if (max) {
        return `\\.(${max}|[0-9]{4})\\.`;
    }
    
    return null;
}

// Build season/episode pattern
function buildSeasonEpisodePattern() {
    if (selectedFilters.seasonEpisode.includes('strict')) {
        if (selectedFilters.seasonMin || selectedFilters.seasonMax) {
            const min = selectedFilters.seasonMin || '01';
            const max = selectedFilters.seasonMax || '99';
            return `\\.S[${min.padStart(2, '0')[0]}-${max.padStart(2, '0')[0]}][0-9]E\\d{2}\\.`;
        } else {
            return '\\.S\\d{2}E\\d{2}\\.';
        }
    } else if (selectedFilters.seasonEpisode.includes('flexible')) {
        return '\\.(S\\d{2}E\\d{2}|\\d{2}x\\d{2})\\.';
    }
    
    return '\\.S\\d{2}E\\d{2}\\.';
}

// Initialize tester functionality
function initTester() {
    const testRegexInput = document.getElementById('testRegex');
    const useGeneratedBtn = document.getElementById('useGeneratedRegex');
    const addExampleBtn = document.getElementById('addExample');
    
    if (useGeneratedBtn) {
        useGeneratedBtn.addEventListener('click', () => {
            const generatedRegex = document.getElementById('generatedRegex').textContent;
            testRegexInput.value = generatedRegex;
            runTests();
        });
    }
    
    if (addExampleBtn) {
        addExampleBtn.addEventListener('click', addNewExample);
    }
    
    if (testRegexInput) {
        testRegexInput.addEventListener('input', runTests);
    }
    
    // Load examples for current content type
    loadContentExamples();
}

// Add new example input
function addNewExample() {
    const container = document.querySelector('.examples-container');
    if (!container) return;
    
    const newExample = document.createElement('div');
    newExample.className = 'example-item';
    newExample.innerHTML = `
        <input type="text" class="torrent-name" placeholder="Entrez un nom de torrent...">
        <span class="match-result">❓</span>
        <button class="remove-example" onclick="this.parentElement.remove()">×</button>
    `;
    
    const newInput = newExample.querySelector('.torrent-name');
    newInput.addEventListener('input', runTests);
    
    container.appendChild(newExample);
}

// Load examples for current content type
function loadContentExamples() {
    const examples = yggPatterns[currentContentType]?.examples || [];
    const inputs = document.querySelectorAll('.torrent-name');
    
    inputs.forEach((input, index) => {
        if (examples[index]) {
            input.value = examples[index];
        }
    });
    
    setTimeout(runTests, 100);
}

// Run regex tests
function runTests() {
    const testRegexInput = document.getElementById('testRegex');
    const resultsDiv = document.getElementById('testResults');
    
    if (!testRegexInput || !resultsDiv) return;
    
    const testRegex = testRegexInput.value;
    const torrentInputs = document.querySelectorAll('.torrent-name');
    
    if (!testRegex) {
        resultsDiv.innerHTML = '<p>Entrez une regex pour tester...</p>';
        return;
    }
    
    let regex;
    try {
        regex = new RegExp(testRegex);
    } catch (e) {
        resultsDiv.innerHTML = `<p class="error">Regex invalide: ${e.message}</p>`;
        return;
    }
    
    let matches = 0;
    let total = 0;
    let results = [];
    
    torrentInputs.forEach(input => {
        if (input.value.trim()) {
            total++;
            const isMatch = regex.test(input.value);
            const resultSpan = input.parentElement.querySelector('.match-result');
            
            if (resultSpan) {
                if (isMatch) {
                    matches++;
                    resultSpan.textContent = '✅';
                    resultSpan.className = 'match-result match';
                } else {
                    resultSpan.textContent = '❌';
                    resultSpan.className = 'match-result no-match';
                }
            }
            
            results.push({
                name: input.value,
                match: isMatch
            });
        }
    });
    
    // Update results summary
    resultsDiv.innerHTML = `
        <div class="test-summary">
            <h4>Résultat: ${matches}/${total} correspondances</h4>
            <div class="match-percentage" style="width: ${total > 0 ? (matches/total)*100 : 0}%"></div>
        </div>
        <div class="detailed-results">
            ${results.map(r => `
                <div class="result-item ${r.match ? 'match' : 'no-match'}">
                    <span class="result-icon">${r.match ? '✅' : '❌'}</span>
                    <span class="result-name">${r.name}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Initialize export controls
function initExportControls() {
    const exportBtn = document.getElementById('exportAutobrr');
    const saveBtn = document.getElementById('savePreset');
    const loadBtn = document.getElementById('loadPreset');
    const copyBtn = document.getElementById('copyRegex');
    
    if (exportBtn) exportBtn.addEventListener('click', exportAutobrrConfig);
    if (saveBtn) saveBtn.addEventListener('click', savePreset);
    if (loadBtn) loadBtn.addEventListener('click', loadPreset);
    if (copyBtn) copyBtn.addEventListener('click', copyRegexToClipboard);
}

// Export configuration for Autobrr
function exportAutobrrConfig() {
    const regexElement = document.getElementById('generatedRegex');
    if (!regexElement) return;
    
    const regex = regexElement.textContent;
    const config = {
        name: `YGG_${currentContentType}_${Date.now()}`,
        enabled: true,
        priority: 10,
        filter: {
            shows: currentContentType.includes('serie') ? [regex] : [],
            movies: currentContentType === 'film' ? [regex] : [],
            releases: [regex]
        },
        indexers: ["ygg"]
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const dataUrl = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `autobrr_ygg_${currentContentType}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    showNotification('Configuration Autobrr exportée avec succès !');
}

// Save current preset
function savePreset() {
    const presetName = prompt('Nom du preset:', `${currentContentType}_${Date.now()}`);
    if (!presetName) return;
    
    const regexElement = document.getElementById('generatedRegex');
    if (!regexElement) return;
    
    const preset = {
        name: presetName,
        contentType: currentContentType,
        filters: selectedFilters,
        regex: regexElement.textContent,
        date: new Date().toISOString()
    };
    
    let presets = JSON.parse(localStorage.getItem('ygg_presets')) || [];
    presets.push(preset);
    localStorage.setItem('ygg_presets', JSON.stringify(presets));
    
    showNotification(`Preset "${presetName}" sauvegardé !`);
}

// Load preset
function loadPreset() {
    const presets = JSON.parse(localStorage.getItem('ygg_presets')) || [];
    if (presets.length === 0) {
        showNotification('Aucun preset sauvegardé', 'error');
        return;
    }
    
    const presetNames = presets.map((p, i) => `${i}: ${p.name} (${p.contentType})`);
    const selection = prompt(`Choisissez un preset:\n${presetNames.join('\n')}\n\nEntrez le numéro:`);
    
    if (selection === null) return;
    
    const index = parseInt(selection);
    if (isNaN(index) || index < 0 || index >= presets.length) {
        showNotification('Sélection invalide', 'error');
        return;
    }
    
    const preset = presets[index];
    
    // Load content type
    currentContentType = preset.contentType;
    const contentBtn = document.querySelector(`[data-type="${currentContentType}"]`);
    if (contentBtn) contentBtn.click();
    
    // Load filters
    selectedFilters = preset.filters;
    loadFiltersToUI();
    
    showNotification(`Preset "${preset.name}" chargé !`);
}

// Load filters to UI
function loadFiltersToUI() {
    // Clear all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Set checkboxes
    ['quality', 'language', 'source', 'codec', 'seasonEpisode'].forEach(filterType => {
        const values = selectedFilters[filterType] || [];
        const name = filterType === 'seasonEpisode' ? 'season-episode' : filterType;
        values.forEach(value => {
            const checkbox = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });
    });
    
    // Set release group
    const releaseGroupCb = document.querySelector('input[name="release-group"]');
    if (releaseGroupCb) releaseGroupCb.checked = selectedFilters.releaseGroup;
    
    // Set number inputs
    const yearMin = document.getElementById('yearMin');
    const yearMax = document.getElementById('yearMax');
    const seasonMin = document.getElementById('seasonMin');
    const seasonMax = document.getElementById('seasonMax');
    const specificGroup = document.getElementById('specificGroup');
    
    if (yearMin) yearMin.value = selectedFilters.yearMin || '';
    if (yearMax) yearMax.value = selectedFilters.yearMax || '';
    if (seasonMin) seasonMin.value = selectedFilters.seasonMin || '';
    if (seasonMax) seasonMax.value = selectedFilters.seasonMax || '';
    if (specificGroup) specificGroup.value = selectedFilters.specificGroup || '';
    
    generateRegex();
}

// Copy regex to clipboard
function copyRegexToClipboard() {
    const regexElement = document.getElementById('generatedRegex');
    if (!regexElement) return;
    
    const regex = regexElement.textContent;
    navigator.clipboard.writeText(regex).then(() => {
        showNotification('Regex copiée dans le presse-papier !');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = regex;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Regex copiée dans le presse-papier !');
    });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : '#4caf50'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);