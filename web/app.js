const LOCAL_URL = 'http://localhost:7071/api/TrimixBlend';
const PROD_URL  = 'https://gasblender-tcif7s.azurewebsites.net/api/TrimixBlend';

let debounceTimer;

function initPopovers() {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(function (el) {
        var existing = bootstrap.Popover.getInstance(el);
        if (existing) existing.dispose();
        new bootstrap.Popover(el);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    ['start_bar','start_o2','start_he','finish_bar','finish_o2','finish_he','helium_bar','helium_o2','helium_he']
        .forEach(function (id) {
            var el = document.getElementById(id);
            el.addEventListener('input', function () { updateGasBar(id); });
            el.addEventListener('blur',  function () { clearTimeout(debounceTimer); calculate(); });
            el.addEventListener('change', function () {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(calculate, 50);
            });
        });
    document.getElementById('bm_depth').addEventListener('input', updateBestMix);
    document.getElementById('bm_ppo2').addEventListener('input',  updateBestMix);

    updateBestMix();
    initPopovers();
    calculate();
});

function updateGasBar(fieldId) {
    var prefix = fieldId.replace(/_(bar|o2|he)$/, '');
    var o2 = Math.max(0, Math.min(100, parseInt(document.getElementById(prefix + '_o2').value) || 0));
    var he = Math.max(0, Math.min(100 - o2, parseInt(document.getElementById(prefix + '_he').value) || 0));
    var n2 = Math.max(0, 100 - o2 - he);
    document.getElementById(prefix + '_o2bar').style.width = o2 + '%';
    document.getElementById(prefix + '_hebar').style.width  = he + '%';
    document.getElementById(prefix + '_n2bar').style.width  = n2 + '%';
    document.getElementById(prefix + '_o2pct').textContent  = o2;
    document.getElementById(prefix + '_hepct').textContent  = he;
    document.getElementById(prefix + '_n2pct').textContent  = n2;
}

function calculate() {
    var errorEl   = document.getElementById('error');
    var resultEl  = document.getElementById('result');
    var loadingEl = document.getElementById('loading');

    errorEl.classList.add('d-none');
    errorEl.textContent = '';
    resultEl.innerHTML  = '';
    loadingEl.classList.remove('d-none');

    var int = function (id) { return parseInt(document.getElementById(id).value, 10); };
    var payload = JSON.stringify({
        start_bar:  int('start_bar'),  start_o2:   int('start_o2'),  start_he:   int('start_he'),
        finish_bar: int('finish_bar'), finish_o2:  int('finish_o2'), finish_he:  int('finish_he'),
        helium_bar: int('helium_bar'), helium_o2:  int('helium_o2'), helium_he:  int('helium_he'),
    });

    var h   = window.location.hostname;
    var url = (h === 'localhost' || h === '127.0.0.1' || h === '') ? LOCAL_URL : PROD_URL;

    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
        .then(function (res) {
            if (!res.ok) return res.text().then(function (t) { throw new Error(t || res.statusText); });
            return res.json();
        })
        .then(function (data) {
            loadingEl.classList.add('d-none');
            resultEl.innerHTML = '';
            resultEl.appendChild(buildFillSequence(data.steps));
            resultEl.appendChild(buildAnalysis(data.analysis));
            initPopovers();
        })
        .catch(function (err) {
            loadingEl.classList.add('d-none');
            errorEl.textContent = err.message;
            errorEl.classList.remove('d-none');
        });
}

var _bmO2 = 0, _bmHe = 0;
var BM_DEPTHS = [6,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,120];

function updateBestMix() {
    var depth = BM_DEPTHS[parseInt(document.getElementById('bm_depth').value)];
    var ppo2  = parseFloat(document.getElementById('bm_ppo2').value);
    document.getElementById('bm_depth_val').textContent = depth;
    document.getElementById('bm_ppo2_val').textContent  = ppo2.toFixed(1);

    var pAbs  = depth / 10 + 1;
    var fO2   = Math.min(ppo2 / pAbs, 1.0);
    var densityLimit = document.getElementById('bm_density_upper').checked ? 6.3 : 5.2;
    var targetMM = densityLimit * 22.4 / pAbs;
    var fHe  = (28 + 4 * fO2 - targetMM) / 24;
    fHe = Math.max(0, Math.min(fHe, 1 - fO2));

    _bmO2 = Math.round(fO2 * 100);
    _bmHe = Math.round(fHe * 100);

    document.getElementById('bm_mix').textContent = _bmHe > 0 ? _bmO2 + '/' + _bmHe : _bmO2 + '%';

    var n2      = 100 - _bmO2 - _bmHe;
    var mm      = (_bmO2 * 32 + n2 * 28 + _bmHe * 4) / 100;
    var density = Math.round(mm / 22.4 * pAbs * 100) / 100;
    var endM    = Math.round(((pAbs * (1 - _bmHe / 100)) - 1) * 10 * 10) / 10;
    document.getElementById('bm_stats').textContent = 'Density ' + density + ' g/L · END ' + endM + ' m';
}

function applyBestMix() {
    document.getElementById('finish_bar').value = 232;
    document.getElementById('finish_o2').value  = _bmO2;
    document.getElementById('finish_he').value  = _bmHe;
    updateGasBar('finish_o2');
    calculate();
}

function setTarget(o2, he) {
    document.getElementById('finish_bar').value = 232;
    document.getElementById('finish_o2').value  = o2;
    document.getElementById('finish_he').value  = he;
    updateGasBar('finish_o2');
    calculate();
}

function makeHeading(text) {
    var d = document.createElement('div');
    d.className = 'mb-1';
    var s = document.createElement('span');
    s.className = 'result-heading';
    s.textContent = text;
    d.appendChild(s);
    return d;
}

function buildFillSequence(steps) {
    var frag    = document.createDocumentFragment();
    var tplStep = document.getElementById('tpl-step');

    frag.appendChild(makeHeading('Fill Sequence'));

    var list = document.createElement('div');
    list.className = 'd-flex flex-column gap-2 mb-4';

    steps.forEach(function (step, i) {
        var diff  = Math.round((step.result_gas.bar - step.start_gas.bar) * 100) / 100;
        var sign  = diff >= 0 ? '+' : '';
        var node  = tplStep.content.cloneNode(true);
        node.querySelector('.step-num').textContent        = i + 1;
        node.querySelector('.step-name').textContent       = 'Add ' + step.name;
        node.querySelector('.step-bar-start').textContent  = step.start_gas.bar;
        node.querySelector('.step-bar-end').textContent    = step.result_gas.bar;
        node.querySelector('.step-bar-finish').textContent = step.result_gas.bar;
        var delta = node.querySelector('.step-finish-delta');
        delta.textContent = '(' + sign + diff + ')';
        delta.classList.add(diff >= 0 ? 'delta-pos' : 'delta-neg');
        node.querySelector('.step-result-mix').textContent = 'mix: ' + step.result_gas.o2 + '/' + step.result_gas.he;
        list.appendChild(node);
    });

    frag.appendChild(list);
    return frag;
}

function buildAnalysis(a) {
    var tplCard = document.getElementById('tpl-analysis-card');
    var tplRow  = document.getElementById('tpl-analysis-row');
    var frag    = document.createDocumentFragment();

    frag.appendChild(makeHeading('Gas Analysis'));

    var row = document.createElement('div');
    row.className = 'row g-3 mb-4';

    [
        { title: 'Max Operating Depths', popTitle: 'Max Operating Depth',       popContent: 'The deepest you can use this mix before oxygen partial pressure becomes toxic. ppO₂ 1.4 bar is the standard working limit; 1.6 bar is the hard ceiling for short exposures only. Never exceed 1.6 bar ppO₂.',                                                               rows: [['ppO₂ 1.2 (CCR)', a.mod_1_2], ['ppO₂ 1.4', a.mod_1_4], ['ppO₂ 1.6', a.mod_1_6]] },
        { title: 'Gas Density Limits',   popTitle: 'Gas Density',               popContent: 'Dense gas is harder to breathe at depth, increasing work of breathing and the risk of CO₂ retention. BSAC recommends staying below 5.2 g/L; 6.3 g/L is the absolute upper limit. <a href="https://www.bsac.com/advice-and-support/technical-diving/gas-density-tables/" target="_blank" rel="noopener">BSAC guidance ↗</a>', popHtml: true, rows: [['Recommended (5.2 g/L)', a.density_max_depth], ['Upper limit (6.3 g/L)', a.density_limit_depth]] },
        { title: 'Narcotic Depth (END)', popTitle: 'Equivalent Narcotic Depth', popContent: 'The depth at which breathing air would produce the same narcotic effect. Helium has negligible narcotic potency compared to nitrogen, so trimix significantly reduces narcosis. BSAC recommends keeping END below 30 m; 40 m is the upper accepted limit.',                rows: [['Recommended (END 30 m)', a.end_30_depth], ['Upper limit (END 40 m)', a.end_40_depth]] },
    ].forEach(function (c) {
        var col = tplCard.content.cloneNode(true);
        col.querySelector('.card-title-text').textContent = c.title;
        var btn = col.querySelector('.info-btn');
        btn.setAttribute('data-bs-toggle',    'popover');
        btn.setAttribute('data-bs-trigger',   'focus');
        btn.setAttribute('data-bs-placement', 'auto');
        btn.setAttribute('data-bs-title',     c.popTitle);
        btn.setAttribute('data-bs-content',   c.popContent);
        if (c.popHtml) btn.setAttribute('data-bs-html', 'true');
        var body = col.querySelector('.card-body');
        c.rows.forEach(function (r) {
            var rNode = tplRow.content.cloneNode(true);
            rNode.querySelector('.analysis-label').textContent = r[0];
            rNode.querySelector('.analysis-depth').textContent = r[1] + ' m';
            body.appendChild(rNode);
        });
        row.appendChild(col);
    });

    frag.appendChild(row);
    return frag;
}
