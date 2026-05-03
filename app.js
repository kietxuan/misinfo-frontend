
const API_BASE_URL = 'https://project-advanced-db.onrender.com/api/network';
let network = null;

const btnLoadGraph = document.getElementById('btn-load-graph');
const btnSearch = document.getElementById('btn-search');
const btnLongestChain = document.getElementById('btn-longest-chain'); // Khai báo nút mới
const canvasContainer = document.getElementById('network-canvas');
const depthSlider = document.getElementById('depth-slider');
const depthValueDisplay = document.getElementById('depth-value');
const inputPostId = document.getElementById('post-id-input');
const searchInput = document.getElementById('search-input');

// Panels
const topSpreadersList = document.getElementById('top-spreaders-list');
const topHashtagsList = document.getElementById('top-hashtags-list');
const topDomainsList = document.getElementById('top-domains-list');
const pageRankList = document.getElementById('pagerank-list');

depthSlider.addEventListener('input', (e) => {
    depthValueDisplay.innerText = `F${e.target.value}`;
});

async function fetchAndRenderList(endpoint, element, formatHTML) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const result = await response.json();
        element.innerHTML = '';
        result.data.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = formatHTML(item, index);
            if (item.post_id) {
                li.addEventListener('click', () => {
                    inputPostId.value = item.post_id;
                    btnLoadGraph.click();
                });
            }
            element.appendChild(li);
        });
    } catch (error) {
        element.innerHTML = '<li>Lỗi tải dữ liệu</li>';
    }
}

function loadAllDashboards() {
    // 1. Tải Top Spreaders[cite: 1]
    fetchAndRenderList('/top-spreaders', topSpreadersList, (item, i) => `
        <div class="ranking-info"><span class="ranking-account">#${i + 1} ${item.account}</span><span class="ranking-post">ID: ${item.post_id}</span></div>
        <span class="badge-danger">${item.infected_nodes}</span>
    `);
         
    // 2. Tải Top Hashtags[cite: 1]
    fetchAndRenderList('/top-hashtags', topHashtagsList, (item) => `
        <div class="ranking-info"><span class="ranking-account">${item.hashtag}</span></div>
        <span class="badge-danger" style="background:#3b82f6;">${item.count}</span>
    `);

    // 3. Tải Top Domains[cite: 1]
    fetchAndRenderList('/top-domains', topDomainsList, (item) => `
        <div class="ranking-info"><span class="ranking-account">${item.domain}</span></div>
        <span class="badge-danger" style="background:#8b5cf6;">${item.count}</span>
    `);

    // Đưa đoạn này vào trong hàm loadAllDashboards():
    fetchAndRenderList('/pagerank', pageRankList, (item, i) => `
        <div class="ranking-info"><span class="ranking-account">#${i + 1} ${item.username}</span></div>
        <span class="badge-danger" style="background:#a855f7;">PR: ${item.score}</span>
    `);
}

async function renderGraph(apiUrl) {
    canvasContainer.innerHTML = '<div class="empty-state"><i class="fa-solid fa-satellite-dish fa-beat"></i><p>Đang quét Neo4j Aura Cloud...</p></div>';
         
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const data = await response.json();

        if (!data.nodes || data.nodes.length === 0) throw new Error("Không tìm thấy dữ liệu.");

        const visNodes = new vis.DataSet(data.nodes);
        const visEdges = new vis.DataSet(data.edges);

        const options = {
            groups: {
                Root: { color: { background: '#ef4444', border: '#b91c1c' }, size: 25, font: { color: '#ffffff', bold: true } },
                Post: { color: { background: '#3b82f6', border: '#2563eb' }, size: 15 },
                Highlight: { color: { background: '#facc15', border: '#ca8a04' }, size: 30, font: { color: '#000000', bold: true } }
            },
            edges: { width: 2, color: { color: '#cbd5e1' }, arrows: { to: { enabled: true, scaleFactor: 0.6 } } },
            physics: { barnesHut: { gravitationalConstant: -3000 }, stabilization: { iterations: 200 } },
            interaction: { hover: true, navigationButtons: true }
        };

        canvasContainer.innerHTML = '';
         
        if (network !== null) network.destroy();
        network = new vis.Network(canvasContainer, { nodes: visNodes, edges: visEdges }, options);
    } catch (error) {
        canvasContainer.innerHTML = `<div class="empty-state" style="color: #ef4444;"><p><strong>Lỗi!</strong><br>${error.message}</p></div>`;
    }
}

// Bấm Vẽ cây lan truyền
btnLoadGraph.addEventListener('click', () => {
    const rootPostId = inputPostId.value.trim();
    let url = `${API_BASE_URL}/trace?depth_limit=${depthSlider.value}`;
    if (rootPostId) url += `&root_post_id=${rootPostId}`;
    renderGraph(url);
});

// Bấm Kiếm Full-Text
btnSearch.addEventListener('click', () => {
    const keyword = searchInput.value.trim();
    if (!keyword) return alert("Vui lòng nhập từ khóa (VD: ufo, sầu riêng)");
    renderGraph(`${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}`);
});

// Bấm Truy vết chuỗi dài nhất (Tính năng mới)
btnLongestChain.addEventListener('click', () => {
    renderGraph(`${API_BASE_URL}/longest-chain`);
});

document.addEventListener('DOMContentLoaded', loadAllDashboards);

