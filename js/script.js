// ===============================
// LocalMarket / Hub Gestão - script geral adaptado para API Postgres
// Um único JS alimentando todas as páginas
// ===============================

const API_BASE = "http://localhost:8000/api";

const STORAGE_KEYS = {
    session: "userSession",
    cart: "cart",
    favorites: "favorites"
};

let activeCoupon = null;

// ===============================
// Autenticação: injeta o token JWT em toda chamada à API
// ===============================
const _originalFetch = window.fetch.bind(window);
window.fetch = function (resource, options = {}) {
    try {
        const isApiCall = typeof resource === "string" && resource.startsWith(API_BASE);
        if (isApiCall) {
            const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
            if (session && session.token) {
                options = {
                    ...options,
                    headers: {
                        ...(options.headers || {}),
                        Authorization: `Bearer ${session.token}`
                    }
                };
            }
        }
    } catch (e) {
        // se algo falhar, segue a requisição sem o token
    }
    return _originalFetch(resource, options);
};

// ===============================
// Inicialização
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
    initStorage();
    await setupGlobalLinks();
    setupLogoutGlobal();
    setupMobileMenu();
    protectPage();

    const page = document.body.dataset.page;

    if (page === "home") {
        await setupHomePage();
    }

    if (page === "login") {
        setupLoginPage();
    }

    if (page === "catalogo") {
        await setupCatalogoPage();
    }

    if (page === "dashboard") {
        await setupDashboardPage();
    }

    if (page === "cadastro") {
        await setupCadastroPage();
    }

    if (page === "admin") {
        await setupAdminPage();
    }

    if (page === "loja") {
        await setupLojaPage();
    }

    if (page === "mapa") {
        await setupMapaPage();
    }

    if (page === "carrinho") {
        await setupCarrinhoPage();
    }

    if (page === "register") {
        await setupRegisterPage();
    }

    if (page === "pedidos") {
        await setupPedidosPage();
    }

    if (page === "ofertas") {
        await setupOfertasPage();
    }

    if (page === "perfil") {
        await setupPerfilPage();
    }
});

// Preenche o endereco automaticamente ao digitar o CEP (API ViaCEP).
function setupCepAutofill(cepInput, enderecoInput) {
    if (!cepInput || !enderecoInput) return;

    cepInput.addEventListener("blur", async () => {
        const rawCep = cepInput.value.replace(/\D/g, "");
        if (rawCep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
            const data = await response.json();
            if (data.erro) {
                showMessage("CEP nao encontrado. Confira o numero informado.", "warning");
                return;
            }
            const address = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`]
                .filter(Boolean)
                .join(", ");
            if (address) enderecoInput.value = address;
        } catch (e) {
            console.error(e);
            showMessage("Nao foi possivel consultar o CEP agora.", "warning");
        }
    });
}

// ===============================
// Storage e utilidades
// ===============================

function initStorage() {
    // Mantemos inicialização do cart e favorites local apenas para visitantes
    if (!localStorage.getItem(STORAGE_KEYS.cart)) {
        localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.favorites)) {
        localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([]));
    }
}

function getSession() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
}

function normalizeCartItems(items) {
    return (items || []).map(item => {
        const quantity = Number(item?.quantity ?? item?.quantidade ?? 1);
        return {
            ...item,
            id: item?.id ?? item?.produto_id,
            quantity,
            quantidade: quantity
        };
    }).filter(item => item.id);
}

function saveSession(user) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
}

def_session = null;

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem("localmarket_session");
}

// Chamadas API para obter Produtos e Lojas

async function getItems(slugDono = null) {
    let url = `${API_BASE}/produtos`;
    if (slugDono) {
        url += `?slug_dono=${encodeURIComponent(slugDono)}`;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao obter produtos da API");
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getOrganizations() {
    try {
        const response = await fetch(`${API_BASE}/lojas`);
        if (!response.ok) throw new Error("Erro ao obter lojas da API");
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getCategorias(tipo = null) {
    let url = `${API_BASE}/categorias`;
    if (tipo) {
        url += `?tipo=${encodeURIComponent(tipo)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao obter categorias da API");
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function createCategoria(tipo, nome) {
    const response = await fetch(`${API_BASE}/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, nome })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Nao foi possivel criar a categoria.");
    }

    return response.json();
}

async function updateCategoria(id, tipo, nome) {
    const response = await fetch(`${API_BASE}/categorias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, nome })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Nao foi possivel atualizar a categoria.");
    }

    return response.json();
}

function fillCategorySelect(select, categorias, { placeholder = "Selecione uma categoria", allowNewOption = false, selectedValue = "" } = {}) {
    if (!select) return;

    const normalizedSelected = selectedValue || "";
    const categoryNames = categorias.map(categoria => categoria.nome);
    const uniqueNames = [...new Set(categoryNames)];

    if (normalizedSelected && !uniqueNames.includes(normalizedSelected)) {
        uniqueNames.push(normalizedSelected);
    }

    select.innerHTML = `
        <option value="">${escapeHTML(placeholder)}</option>
        ${uniqueNames.map(nome => `
            <option value="${escapeHTML(nome)}" ${nome === normalizedSelected ? "selected" : ""}>
                ${escapeHTML(nome)}
            </option>
        `).join("")}
        ${allowNewOption ? `<option value="__new__">+ Nova categoria</option>` : ""}
    `;
}

function normalizeTextKey(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function getStoreImageUrl(store) {
    if (store?.imagem && store.imagem.trim()) {
        return store.imagem.trim();
    }

    const storeImages = {
        "green-valley": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
        "sourdough-loft": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
        "bloom-stem": "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=900&q=80"
    };

    return storeImages[store?.slug_loja] || makePlaceholder(store?.nome || "Loja");
}

function getVisibleStores(stores) {
    return (stores || []).filter(store => normalizeTextKey(store?.status) !== "inativo");
}

function buildStoreAddressLabel(store) {
    const parts = [store?.localizacao, store?.cep].filter(Boolean);
    return parts.length ? parts.join(" - ") : "Endereco nao informado";
}

function formatStoreMapQuery(store) {
    // Prioriza o endereco completo + CEP para um pino exato no mapa.
    // O CEP no Brasil aponta para a rua/quadra, deixando a localizacao bem precisa.
    const address = [store?.localizacao, store?.cep].filter(Boolean).join(", ");
    if (address) {
        return `${address}, Brasil`;
    }
    // Sem endereco cadastrado: cai para o nome da loja como referencia.
    return [store?.nome, "Brasil"].filter(Boolean).join(", ");
}

async function getCart() {
    const session = getSession();

    

    if (false && !session) {
        showMessage("VocÃª precisa estar logado para finalizar o pedido.", "warning");
        window.location.href = "login.html?next=carrinho.html";
        return;
    }

    if (false && session.role !== "cliente") {
        showMessage("AÃ§Ã£o nÃ£o permitida para este tipo de usuÃ¡rio. Apenas clientes podem finalizar compras.", "warning");
        return;
    }
    if (!session) {
        return normalizeCartItems(JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]"));
    }
    try {
        const response = await fetch(`${API_BASE}/carrinho?email=${encodeURIComponent(session.email)}`);
        if (!response.ok) throw new Error("Erro ao obter carrinho da API");
        const data = await response.json();
        return normalizeCartItems(data);
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function saveCart(cart) {
    const session = getSession();
    if (!session) {
        localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
        await updateCartCount();
        return;
    }
    // No backend, o carrinho é atualizado item por item.
    // Esta função é usada para limpar ou atualizar itens específicos.
    await updateCartCount();
}

async function getFavorites() {
    const session = getSession();
    if (!session) {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || "[]");
    }
    try {
        const response = await fetch(`${API_BASE}/favoritos?email=${encodeURIComponent(session.email)}`);
        if (!response.ok) throw new Error("Erro ao obter favoritos da API");
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getUsuarios(role = null) {
    let url = `${API_BASE}/usuarios`;
    if (role) {
        url += `?role=${encodeURIComponent(role)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao obter usuários da API");
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

function showMessage(message, type = "info", duration = 3200) {
    if (!message) return;

    const icons = {
        success: "check_circle",
        error: "error",
        warning: "warning",
        info: "info"
    };

    const titles = {
        success: "Sucesso",
        error: "Atencao",
        warning: "Aviso",
        info: "Informacao"
    };

    const host = ensureToastHost();
    const toast = document.createElement("div");
    toast.className = `app-toast app-toast-${type}`;
    toast.innerHTML = `
        <div class="app-toast-icon">
            <span class="material-symbols-outlined">${icons[type] || icons.info}</span>
        </div>
        <div class="app-toast-body">
            <strong>${titles[type] || titles.info}</strong>
            <p>${escapeHTML(message)}</p>
        </div>
    `;

    host.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("is-visible");
    });

    const removeToast = () => {
        toast.classList.remove("is-visible");
        window.setTimeout(() => toast.remove(), 220);
    };

    window.setTimeout(removeToast, duration);
    toast.addEventListener("click", removeToast, { once: true });
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("pt-BR");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[char]));
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function makePlaceholder(text) {
    const safeText = String(text || "Item").slice(0, 18);

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
            <defs>
                <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                    <stop stop-color="#0f766e"/>
                    <stop offset="1" stop-color="#99f6e4"/>
                </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#g)"/>
            <circle cx="650" cy="90" r="140" fill="rgba(255,255,255,.18)"/>
            <circle cx="120" cy="520" r="180" fill="rgba(255,255,255,.12)"/>
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                font-family="Arial" font-size="54" font-weight="800" fill="white">${safeText}</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getStatusByQuantity(quantity, selectedStatus) {
    const qty = Number(quantity || 0);

    if (selectedStatus === "Rascunho") return "Rascunho";
    if (qty <= 0) return "Indisponível";
    if (qty <= 5) return "Baixo estoque";

    return "Ativo";
}

function getStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (value.includes("ativo")) return "status-ativo";
    if (value.includes("baixo")) return "status-baixo";
    if (value.includes("pendente")) return "status-pendente";
    if (value.includes("rascunho")) return "status-rascunho";
    if (value.includes("indispon")) return "status-indisponivel";

    return "status-indisponivel";
}

function createEmptyTableState({ colspan, icon, title, description, actionLabel = "", actionHref = "" }) {
    const action = actionLabel && actionHref
        ? `<a href="${actionHref}" class="table-empty-action">${escapeHTML(actionLabel)}</a>`
        : "";

    return `
        <tr>
            <td colspan="${colspan}" class="table-empty-cell">
                <div class="table-empty-state">
                    <span class="material-symbols-outlined table-empty-icon">${escapeHTML(icon)}</span>
                    <h3>${escapeHTML(title)}</h3>
                    <p>${escapeHTML(description)}</p>
                    ${action}
                </div>
            </td>
        </tr>
    `;
}

const ORDER_STATUS_FLOW = ["Pendente", "Em separacao", "Enviado", "Entregue"];

function getOrderStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (value.includes("entreg")) return "status-ativo";
    if (value.includes("envi")) return "status-baixo";
    if (value.includes("separ")) return "status-pendente";
    if (value.includes("pend")) return "status-rascunho";

    return "status-indisponivel";
}

function renderOrderStatusTimeline(status) {
    const currentIndex = Math.max(0, ORDER_STATUS_FLOW.indexOf(status));

    return `
        <div class="order-timeline">
            ${ORDER_STATUS_FLOW.map((step, index) => `
                <div class="order-step ${index <= currentIndex ? "is-complete" : ""}">
                    <span class="order-step-dot"></span>
                    <span class="order-step-label">${escapeHTML(step)}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function renderOrderStatusOptions(selectedStatus) {
    return ORDER_STATUS_FLOW.map(status => `
        <option value="${escapeHTML(status)}" ${status === selectedStatus ? "selected" : ""}>
            ${escapeHTML(status)}
        </option>
    `).join("");
}

async function updateOrderStatus(orderId, newStatus) {
    const session = getSession();
    if (!session) return false;

    try {
        const response = await fetch(`${API_BASE}/pedidos/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                atualizado_por: session.email,
                status: newStatus
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            showMessage(err.detail || "Nao foi possivel atualizar o status do pedido.", "error");
            return false;
        }

        showMessage("Status do pedido atualizado com sucesso.", "success");
        return true;
    } catch (e) {
        console.error(e);
        showMessage("Erro ao atualizar o status do pedido.", "error");
        return false;
    }
}

// ===============================
// Proteção de páginas
// ===============================

function protectPage() {
    const page = document.body.dataset.page;
    const session = getSession();

    // O administrador acessa APENAS a área administrativa (admin.html).
    // Catálogo, produtos, cadastro e pedidos pertencem a cada lojista.
    const blockedForAdmin = ["dashboard", "cadastro", "catalogo", "pedidos"];
    if (session && session.role === "admin" && blockedForAdmin.includes(page)) {
        showMessage("O administrador acessa apenas a área administrativa.", "warning");
        window.location.href = "admin.html";
        return;
    }

    const publicPages = [
        "home",
        "login",
        "register",
        "catalogo",
        "lojas",
        "loja",
        "mapa",
        "mapas",
        "ofertas",
        "privacidade",
        "termos",
        "contato"
    ];

    if (publicPages.includes(page)) return;

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    // Área administrativa: exclusiva do admin.
    if (page === "admin" && session.role !== "admin") {
        showMessage("Acesso permitido apenas para administradores.", "warning");
        window.location.href = "dashboard.html";
        return;
    }

    // Painel do lojista: exclusivo do comerciante (o admin já foi barrado acima).
    if ((page === "dashboard" || page === "cadastro") && session.role !== "comerciante") {
        showMessage("Acesso permitido apenas para comerciantes.", "warning");
        window.location.href = "login.html";
    }
}

// ===============================
// Funções globais
// ===============================

async function setupGlobalLinks() {
    await updateCartCount();
    setupActiveMenu();
    setupRoleNav();
    setupUserInfo();
    setupSidebarProfileLink();
}

// Nas paginas internas (com sidebar), injeta um link "Meu Perfil" acima do botao Sair.
function setupSidebarProfileLink() {
    const session = getSession();
    if (!session) return;

    document.querySelectorAll(".sidebar-footer").forEach(footer => {
        if (footer.querySelector("[data-perfil-link]")) return;

        const link = document.createElement("a");
        link.href = "perfil.html";
        link.setAttribute("data-perfil-link", "");
        link.className = "btn btn-outline-secondary w-100 mb-2 d-flex align-items-center justify-content-center gap-1";
        link.innerHTML = `<span class="material-symbols-outlined">account_circle</span> Meu Perfil`;

        const logoutBtn = footer.querySelector("[data-logout]");
        if (logoutBtn) {
            footer.insertBefore(link, logoutBtn);
        } else {
            footer.appendChild(link);
        }
    });
}

function setupRoleNav() {
    const session = getSession();
    if (!session) return;

    const hideNav = navValues => navValues.forEach(nav => {
        document.querySelectorAll(`[data-nav="${nav}"]`).forEach(el => {
            el.style.display = "none";
        });
    });

    if (session.role === "admin") {
        // Admin: só a área administrativa. Esconde produtos/catálogo/pedidos.
        hideNav(["dashboard", "cadastro", "catalogo", "pedidos"]);
        // O logo do painel aponta para dashboard; para o admin, leva à área dele.
        document.querySelectorAll("a.brand").forEach(el => {
            el.setAttribute("href", "admin.html");
        });
    } else if (session.role === "comerciante") {
        // Lojista: esconde o link da Administração.
        hideNav(["admin"]);
    }
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const closeMobileMenu = document.getElementById("closeMobileMenu");
    const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

    if (!mobileMenuBtn || !mobileMenuOverlay) return;

    mobileMenuBtn.addEventListener("click", () => {
        mobileMenuOverlay.classList.remove("hidden");
        mobileMenuOverlay.style.display = "block";
        document.body.style.overflow = "hidden"; // Prevent scrolling
    });

    const closeMenu = () => {
        mobileMenuOverlay.classList.add("hidden");
        mobileMenuOverlay.style.display = "none";
        document.body.style.overflow = ""; // Restore scrolling
    };

    if (closeMobileMenu) {
        closeMobileMenu.addEventListener("click", closeMenu);
    }

    mobileMenuOverlay.addEventListener("click", (e) => {
        if (e.target === mobileMenuOverlay) {
            closeMenu();
        }
    });

    // Close menu when clicking on a link
    const mobileLinks = mobileMenuOverlay.querySelectorAll("nav a");
    mobileLinks.forEach(link => {
        link.addEventListener("click", closeMenu);
    });
}

function setupLogoutGlobal() {
    const logoutButtons = document.querySelectorAll("[data-logout]");

    logoutButtons.forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            clearSession();
            window.location.href = "index.html";
        });
    });
}

async function updateCartCount() {
    const cartCount = document.querySelector("[data-cart-count]");
    const cartBadges = document.querySelectorAll("[data-cart-badge]");
    const savedCart = await getCart();

    const totalItems = savedCart.reduce((sum, item) => {
        return sum + Number(item.quantity || 1);
    }, 0);

    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    cartBadges.forEach(badge => {
        if (totalItems > 0) {
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }
    });
}

function setupActiveMenu() {
    const page = document.body.dataset.page;

    document.querySelectorAll("[data-nav]").forEach(link => {
        if (link.dataset.nav === page) {
            link.classList.add("active");
        }
    });
}

function setupUserInfo() {
    const session = getSession();

    document.querySelectorAll("[data-user-name]").forEach(element => {
        element.textContent = session ? session.name : "Visitante";
    });

    document.querySelectorAll("[data-user-role]").forEach(element => {
        element.textContent = session ? session.role : "visitante";
    });

    // Injeta o menu do usuário logado (cliente, lojista ou admin) nas páginas públicas
    if (session) {
        injectUserMenu(session);
    }
}

function getUserMenuConfig(session) {
    const role = session.role;
    if (role === "admin") {
        return { roleLabel: "Administrador", panelHref: "admin.html", panelLabel: "Painel", ordersLabel: "Pedidos", showOrders: false };
    }
    if (role === "comerciante") {
        return { roleLabel: "Lojista", panelHref: "dashboard.html", panelLabel: "Painel", ordersLabel: "Pedidos", showOrders: true };
    }
    return { roleLabel: "Cliente", panelHref: null, panelLabel: null, ordersLabel: "Meus Pedidos", showOrders: true };
}

function injectUserMenu(session) {
    const menu = getUserMenuConfig(session);
    // ===== DESKTOP: substitui o botão "Entrar" pelo dropdown do cliente =====
    const loginLinks = document.querySelectorAll("a[href='login.html']");
    loginLinks.forEach(link => {
        // Só atua em links que claramente são de "Entrar" (não links genéricos)
        const isAuthBtn = (
            link.textContent.trim().toLowerCase().includes("entrar") ||
            link.querySelector("span.material-symbols-outlined")?.textContent?.trim() === "person" ||
            link.querySelector("span.material-symbols-outlined")?.textContent?.trim() === "account_circle"
        );
        if (!isAuthBtn) return;

        // Evita duplicação
        if (link.parentElement?.querySelector(".client-menu-wrapper")) return;

        const initials = session.name
            ? session.name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
            : "?";

        const wrapper = document.createElement("div");
        wrapper.className = "client-menu-wrapper";
        wrapper.innerHTML = `
            <button class="client-menu-trigger" id="clientMenuTrigger" type="button" aria-haspopup="true" aria-expanded="false">
                <span class="client-menu-avatar">${escapeHTML(initials)}</span>
                <span class="client-menu-name">${escapeHTML(session.name || "Cliente")}</span>
                <span class="material-symbols-outlined client-menu-chevron">expand_more</span>
            </button>
            <div class="client-dropdown" role="menu" id="clientDropdown">
                <div class="client-dropdown-header">
                    <span>Logado como ${escapeHTML(menu.roleLabel)}</span>
                    <strong>${escapeHTML(session.name || menu.roleLabel)}</strong>
                </div>
                ${menu.panelHref ? `
                <a href="${menu.panelHref}" class="client-dropdown-item" role="menuitem" id="clientMenuPanel">
                    <span class="material-symbols-outlined">dashboard</span>
                    ${escapeHTML(menu.panelLabel)}
                </a>
                ` : ""}
                <a href="perfil.html" class="client-dropdown-item" role="menuitem" id="clientMenuPerfil">
                    <span class="material-symbols-outlined">account_circle</span>
                    Meu Perfil
                </a>
                ${menu.showOrders ? `
                <a href="pedidos.html" class="client-dropdown-item" role="menuitem" id="clientMenuPedidos">
                    <span class="material-symbols-outlined">receipt_long</span>
                    ${escapeHTML(menu.ordersLabel)}
                </a>
                ` : ""}
                <div class="client-dropdown-divider"></div>
                <button class="client-dropdown-item is-danger" role="menuitem" id="clientMenuLogout" type="button" data-logout>
                    <span class="material-symbols-outlined">logout</span>
                    Sair
                </button>
            </div>
        `;

        link.replaceWith(wrapper);

        // Toggle dropdown ao clicar no trigger
        const trigger = wrapper.querySelector(".client-menu-trigger");
        const dropdown = wrapper.querySelector(".client-dropdown");

        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.toggle("is-open");
            trigger.setAttribute("aria-expanded", String(isOpen));
        });

        // Fechar ao clicar fora
        document.addEventListener("click", (e) => {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove("is-open");
                trigger.setAttribute("aria-expanded", "false");
            }
        }, { capture: true });

        // Fechar ao pressionar Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                wrapper.classList.remove("is-open");
                trigger.setAttribute("aria-expanded", "false");
            }
        });

        // Ação de logout
        const logoutBtn = wrapper.querySelector("[data-logout]");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                clearSession();
                window.location.href = "index.html";
            });
        }
    });

    // ===== MOBILE: injeta seção do cliente no menu lateral =====
    const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
    if (!mobileMenuOverlay) return;

    const mobileNav = mobileMenuOverlay.querySelector("nav");
    if (!mobileNav) return;

    // Evita duplicação
    if (mobileNav.querySelector(".mobile-client-section")) return;

    const mobileSection = document.createElement("div");
    mobileSection.className = "mobile-client-section";
    mobileSection.innerHTML = `
        <span class="mobile-client-label">Minha conta (${escapeHTML(menu.roleLabel)})</span>
        ${menu.panelHref ? `
        <a href="${menu.panelHref}" class="mobile-client-link" id="mobileMenuPanel">
            <span class="material-symbols-outlined">dashboard</span>
            ${escapeHTML(menu.panelLabel)}
        </a>
        ` : ""}
        <a href="perfil.html" class="mobile-client-link" id="mobileMenuPerfil">
            <span class="material-symbols-outlined">account_circle</span>
            Meu Perfil
        </a>
        ${menu.showOrders ? `
        <a href="pedidos.html" class="mobile-client-link" id="mobileMenuPedidos">
            <span class="material-symbols-outlined">receipt_long</span>
            ${escapeHTML(menu.ordersLabel)}
        </a>
        ` : ""}
        <button class="mobile-client-link is-danger" type="button" data-logout-mobile id="mobileMenuLogout">
            <span class="material-symbols-outlined">logout</span>
            Sair
        </button>
    `;

    mobileNav.appendChild(mobileSection);

    const mobileLogoutBtn = mobileSection.querySelector("[data-logout-mobile]");
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            clearSession();
            window.location.href = "index.html";
        });
    }
}

// ===============================
// Página da Loja - loja.html
// ===============================

async function setupLojaPage() {
    const params = new URLSearchParams(window.location.search);
    const storeSlug = params.get("loja");
    const lojaTitle = document.getElementById("lojaTitle");

    if (!storeSlug) {
        const storeNameHeader = document.getElementById("storeNameHeader");
        const storeDescHeader = document.getElementById("storeDescHeader");

        if (storeNameHeader) {
            storeNameHeader.textContent = "Nossas Lojas";
        }
        if (storeDescHeader) {
            storeDescHeader.textContent = "Explore todas as lojas parceiras e descubra os melhores produtos da sua região.";
        }
        if (lojaTitle) {
            lojaTitle.textContent = "Lojas Disponíveis";
        }

        await renderAllStores();
        return;
    }

    // Busca dinâmica nas lojas cadastradas
    const organizations = await getOrganizations();
    const storeOrg = organizations.find(o => o.slug_loja === storeSlug);

    const storeNameHeader = document.getElementById("storeNameHeader");
    const storeDescHeader = document.getElementById("storeDescHeader");

    if (storeNameHeader) {
        storeNameHeader.textContent = storeOrg ? storeOrg.nome : "Loja Parceira";
    }
    if (storeDescHeader && storeOrg) {
        storeDescHeader.textContent = `Categoria: ${storeOrg.categoria} | Localização: ${storeOrg.localizacao}`;
    }
    if (lojaTitle) {
        lojaTitle.textContent = "Nossos Produtos";
    }

    await renderLojaItems(storeSlug);
}

async function renderAllStores() {
    const grid = document.getElementById("lojaGrid");
    const emptyMessage = document.getElementById("emptyLojaMessage");

    if (!grid) return;

    let organizations = getVisibleStores(await getOrganizations());

    if (organizations.length === 0) {
        if (emptyMessage) {
            emptyMessage.classList.remove("hidden");
            const h3 = emptyMessage.querySelector("h3");
            const p = emptyMessage.querySelector("p");
            if (h3) h3.textContent = "Nenhuma loja disponível";
            if (p) p.textContent = "Ainda não temos lojas parceiras cadastradas.";
        }
        grid.innerHTML = "";
        return;
    }

    if (emptyMessage) emptyMessage.classList.add("hidden");

    grid.innerHTML = organizations.map(org => {
        const imageUrl = getStoreImageUrl(org);

        return `
            <article class="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-full">
                <div class="aspect-square relative overflow-hidden bg-slate-100 flex-shrink-0 border-b border-slate-100 flex items-center justify-center">
                     <img class="w-full h-full object-cover" src="${imageUrl}" alt="${escapeHTML(org.nome)}">
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <span class="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded w-fit mb-2 uppercase tracking-wider">
                        ${escapeHTML(org.categoria || "Geral")}
                    </span>
                    <h3 class="text-xl font-extrabold text-slate-900 mb-1">${escapeHTML(org.nome)}</h3>
                    <p class="text-sm font-semibold text-slate-500 mb-3 flex-grow flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">location_on</span>
                        ${escapeHTML(buildStoreAddressLabel(org))}
                    </p>
                    <div class="mt-auto pt-2">
                        <a href="loja.html?loja=${escapeHTML(org.slug_loja)}" class="block w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all text-center shadow-sm">
                            Visitar loja
                        </a>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

async function setupMapaPage() {
    const params = new URLSearchParams(window.location.search);
    const selectedSlug = params.get("loja");
    const searchInput = document.getElementById("searchInput");
    const storeList = document.getElementById("mapStoreList");
    const mapFrame = document.getElementById("mapFrame");
    const selectedStoreName = document.getElementById("selectedMapStoreName");
    const selectedStoreCategory = document.getElementById("selectedMapStoreCategory");
    const selectedStoreAddress = document.getElementById("selectedMapStoreAddress");
    const selectedStoreLink = document.getElementById("selectedMapStoreLink");

    if (!storeList || !mapFrame) return;

    let organizations = getVisibleStores(await getOrganizations());

    function updateMap(store) {
        const query = formatStoreMapQuery(store);
        if (!query) return;
        mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
        if (selectedStoreName) selectedStoreName.textContent = store?.nome || "Loja selecionada";
        if (selectedStoreCategory) selectedStoreCategory.textContent = store?.categoria || "Sem categoria";
        if (selectedStoreAddress) selectedStoreAddress.textContent = buildStoreAddressLabel(store);
        if (selectedStoreLink) {
            selectedStoreLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        }
    }

    function render() {
        const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
        let filteredStores = organizations;

        if (term) {
            filteredStores = organizations.filter(store => {
                const text = `${store.nome} ${store.categoria || ""} ${store.localizacao || ""} ${store.cep || ""}`.toLowerCase();
                return text.includes(term);
            });
        }

        if (filteredStores.length === 0) {
            storeList.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhuma loja encontrada</h3>
                    <p>Ajuste a busca para visualizar as lojas cadastradas no mapa.</p>
                </div>
            `;
            if (selectedStoreName) selectedStoreName.textContent = "Nenhuma loja encontrada";
            if (selectedStoreCategory) selectedStoreCategory.textContent = "Categoria";
            if (selectedStoreAddress) selectedStoreAddress.textContent = "Tente ajustar a busca para localizar uma loja.";
            return;
        }

        storeList.innerHTML = filteredStores.map(store => `
            <article class="store-card border border-slate-200 rounded-2xl p-4">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h4 class="font-extrabold text-slate-900">${escapeHTML(store.nome)}</h4>
                        <p class="text-sm text-emerald-700 font-semibold">${escapeHTML(store.categoria || "Sem categoria")}</p>
                    </div>
                </div>
                <p class="text-sm text-slate-600 mt-3 flex items-start gap-1">
                    <span class="material-symbols-outlined text-base text-emerald-600">location_on</span>
                    <span>${escapeHTML(buildStoreAddressLabel(store))}</span>
                </p>
                <p class="text-xs text-slate-500 mt-1">CEP: ${escapeHTML(store.cep || "Nao informado")}</p>
                <div class="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" data-map-store="${escapeHTML(store.id)}"
                        class="inline-flex items-center justify-center gap-1 w-full py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all">
                        <span class="material-symbols-outlined text-base">location_on</span>
                        Ver no mapa
                    </button>
                    <a href="loja.html?loja=${encodeURIComponent(store.slug_loja)}"
                        class="inline-flex items-center justify-center gap-1 w-full py-2 px-3 bg-slate-100 text-slate-900 rounded-lg text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all">
                        Visitar loja
                    </a>
                </div>
            </article>
        `).join("");

        storeList.querySelectorAll("[data-map-store]").forEach(button => {
            button.addEventListener("click", () => {
                const storeId = button.dataset.mapStore;
                const store = filteredStores.find(item => item.id === storeId);
                if (store) {
                    updateMap(store);
                }
            });
        });

        const selectedStore = selectedSlug
            ? filteredStores.find(store => store.slug_loja === selectedSlug)
            : filteredStores[0];

        if (selectedStore) {
            updateMap(selectedStore);
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", render);
    }

    render();
}

async function renderLojaItems(storeSlug) {
    const grid = document.getElementById("lojaGrid");
    const emptyMessage = document.getElementById("emptyLojaMessage");

    if (!grid) return;

    let items = await getItems(storeSlug);
    items = items.filter(item => {
        return item.status === "Ativo" || item.status === "Baixo estoque" || item.status === "Baixo volume";
    });

    if (items.length === 0) {
        if (emptyMessage) emptyMessage.classList.remove("hidden");
        grid.innerHTML = "";
        return;
    }

    if (emptyMessage) emptyMessage.classList.add("hidden");

    grid.innerHTML = items.map(item => {
        return `
            <article class="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-full">
                <div class="aspect-square relative overflow-hidden bg-white flex-shrink-0 border-b border-slate-100">
                    <img class="w-full h-full object-contain p-4 mix-blend-multiply" src="${escapeHTML(item.imagem || makePlaceholder(item.nome))}" alt="${escapeHTML(item.nome)}">
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit mb-2">
                        ${escapeHTML(item.categoria)}
                    </span>
                    <h3 class="text-lg font-extrabold text-slate-900 mb-1">${escapeHTML(item.nome)}</h3>
                    <p class="text-sm text-slate-500 mb-3 flex-grow line-clamp-2">${escapeHTML(item.descricao || "Sem descrição.")}</p>
                    <div class="mt-auto">
                        <strong class="text-xl text-slate-900 block mb-3">${formatCurrency(item.preco)}</strong>
                        <button class="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700 transition" data-add-cart="${escapeHTML(item.id)}">
                            Comprar
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    setupCatalogActions();
}

// ===============================
// Página inicial - index.html
// ===============================

async function setupHomePage() {
    const searchInput = document.getElementById("searchInput");
    const categoryFilters = document.getElementById("homeCategoryFilters");
    const storesGrid = document.getElementById("storesGrid");
    const emptyMessage = document.getElementById("emptyMessage");

    if (!storesGrid || !categoryFilters) return;

    let selectedCategory = "todas";
    const [organizationsResponse, categoriesResponse] = await Promise.all([
        getOrganizations(),
        getCategorias("loja")
    ]);
    const organizations = getVisibleStores(organizationsResponse);

    function getAvailableCategories() {
        const names = [
            ...categoriesResponse.map(category => category.nome),
            ...organizations.map(store => store.categoria).filter(Boolean)
        ];
        return [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }

    function renderCategoryButtons() {
        const categories = getAvailableCategories();
        categoryFilters.innerHTML = `
            <button
                class="category-btn ${selectedCategory === "todas" ? "active bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"} px-5 py-2 rounded-full font-bold text-sm shadow-sm border hover:border-emerald-500 hover:text-emerald-500 transition-all whitespace-nowrap"
                data-category="todas">
                Todas as lojas
            </button>
            ${categories.map(category => `
                <button
                    class="category-btn ${normalizeTextKey(selectedCategory) === normalizeTextKey(category) ? "active bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"} px-5 py-2 rounded-full font-bold text-sm shadow-sm border hover:border-emerald-500 hover:text-emerald-500 transition-all whitespace-nowrap"
                    data-category="${escapeHTML(category)}">
                    ${escapeHTML(category)}
                </button>
            `).join("")}
        `;
    }

    function renderStoreCard(store) {
        const category = store.categoria || "Sem categoria";
        const imageUrl = getStoreImageUrl(store);

        return `
            <article class="store-card bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-full">
                <div class="aspect-square relative overflow-hidden bg-slate-100">
                    <img class="w-full h-full object-cover" alt="${escapeHTML(store.nome)}" src="${escapeHTML(imageUrl)}" />
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <div class="flex items-start justify-between gap-3 mb-2">
                        <h3 class="text-lg font-extrabold text-slate-900">${escapeHTML(store.nome)}</h3>
                        <span class="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                            ${escapeHTML(category)}
                        </span>
                    </div>
                    <p class="text-xs font-semibold text-slate-500 mb-4 flex items-start gap-1 flex-grow">
                        <span class="material-symbols-outlined text-sm">location_on</span>
                        <span>${escapeHTML(buildStoreAddressLabel(store))}</span>
                    </p>
                    <div class="mt-auto grid grid-cols-2 gap-2">
                        <a href="loja.html?loja=${encodeURIComponent(store.slug_loja)}"
                            class="block w-full py-2 bg-slate-100 text-slate-900 rounded-lg text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all text-center">
                            Visitar loja
                        </a>
                        <a href="mapa.html?loja=${encodeURIComponent(store.slug_loja)}"
                            class="block w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all text-center">
                            Ver mapa
                        </a>
                    </div>
                </div>
            </article>
        `;
    }

    function filterStores() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const filteredStores = organizations.filter(store => {
            const text = `${store.nome} ${store.categoria || ""} ${store.localizacao || ""} ${store.cep || ""}`.toLowerCase();
            const matchesSearch = text.includes(searchTerm);
            const matchesCategory = selectedCategory === "todas"
                || normalizeTextKey(store.categoria) === normalizeTextKey(selectedCategory);
            return matchesSearch && matchesCategory;
        });

        storesGrid.innerHTML = filteredStores.map(renderStoreCard).join("");

        if (!emptyMessage) return;
        if (filteredStores.length === 0) {
            emptyMessage.classList.remove("hidden");
        } else {
            emptyMessage.classList.add("hidden");
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterStores);
    }

    categoryFilters.addEventListener("click", event => {
        const button = event.target.closest("[data-category]");
        if (!button) return;
        selectedCategory = button.dataset.category;
        renderCategoryButtons();
        filterStores();
    });

    renderCategoryButtons();
    filterStores();
}

// ===============================
// Login - login.html
// ===============================

// ===============================
// Ofertas - ofertas.html
// (mostra os produtos marcados como "destaque")
// ===============================

async function setupOfertasPage() {
    const grid = document.getElementById("offersGrid");
    const emptyMessage = document.getElementById("emptyOffers");
    const searchInput = document.getElementById("searchInput");
    const categoryFilters = document.getElementById("offersCategoryFilters");

    if (!grid) return;

    let selectedCategory = "todas";

    // Apenas produtos em destaque e disponiveis para o cliente
    const allItems = await getItems();
    const offers = allItems.filter(item => {
        const disponivel = item.status === "Ativo" || item.status === "Baixo estoque" || item.status === "Baixo volume";
        return item.destaque && disponivel;
    });

    function getAvailableCategories() {
        return [...new Set(offers.map(item => item.categoria).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "pt-BR"));
    }

    function renderCategoryButtons() {
        if (!categoryFilters) return;

        const categories = getAvailableCategories();
        const baseClass = "category-btn px-5 py-2 rounded-full font-bold text-sm shadow-sm border hover:border-emerald-500 hover:text-emerald-500 transition-all whitespace-nowrap";
        const activeClass = "active bg-emerald-600 text-white border-emerald-600";
        const inactiveClass = "bg-white text-slate-600 border-slate-200";

        categoryFilters.innerHTML = `
            <button class="${baseClass} ${selectedCategory === "todas" ? activeClass : inactiveClass}" data-category="todas">
                Todas as ofertas
            </button>
            ${categories.map(category => `
                <button class="${baseClass} ${normalizeTextKey(selectedCategory) === normalizeTextKey(category) ? activeClass : inactiveClass}" data-category="${escapeHTML(category)}">
                    ${escapeHTML(category)}
                </button>
            `).join("")}
        `;
    }

    function renderOffers() {
        const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

        const filtered = offers.filter(item => {
            const text = `${item.nome} ${item.categoria} ${item.descricao || ""} ${item.nome_loja || ""}`.toLowerCase();
            const matchesSearch = text.includes(term);
            const matchesCategory = selectedCategory === "todas"
                || normalizeTextKey(item.categoria) === normalizeTextKey(selectedCategory);
            return matchesSearch && matchesCategory;
        });

        if (filtered.length === 0) {
            grid.innerHTML = "";
            if (emptyMessage) emptyMessage.classList.remove("hidden");
            return;
        }

        if (emptyMessage) emptyMessage.classList.add("hidden");

        grid.innerHTML = filtered.map(item => `
            <article class="store-card bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-full">
                <div class="aspect-square relative overflow-hidden bg-white flex-shrink-0 border-b border-slate-100">
                    <img class="w-full h-full object-contain p-4 mix-blend-multiply" src="${escapeHTML(item.imagem || makePlaceholder(item.nome))}" alt="${escapeHTML(item.nome)}">
                    <span class="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 px-2 py-1 rounded-full">
                        <span class="material-symbols-outlined text-sm">local_offer</span>
                        Oferta
                    </span>
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit mb-2">
                        ${escapeHTML(item.categoria)}
                    </span>
                    <h3 class="text-lg font-extrabold text-slate-900 mb-1">${escapeHTML(item.nome)}</h3>
                    <p class="text-xs font-semibold text-slate-500 mb-1">${escapeHTML(item.nome_loja || "LocalMarket")}</p>
                    <p class="text-sm text-slate-500 mb-3 flex-grow line-clamp-2">${escapeHTML(item.descricao || "Sem descrição.")}</p>
                    <div class="mt-auto">
                        <strong class="text-xl text-slate-900 block mb-3">${formatCurrency(item.preco)}</strong>
                        <button class="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700 transition" data-add-cart="${escapeHTML(item.id)}">
                            Adicionar ao carrinho
                        </button>
                    </div>
                </div>
            </article>
        `).join("");

        setupCatalogActions();
    }

    if (searchInput) {
        searchInput.addEventListener("input", renderOffers);
    }

    if (categoryFilters) {
        categoryFilters.addEventListener("click", event => {
            const button = event.target.closest("[data-category]");
            if (!button) return;
            selectedCategory = button.dataset.category;
            renderCategoryButtons();
            renderOffers();
        });
    }

    renderCategoryButtons();
    renderOffers();
}

// ===============================
// Perfil - perfil.html
// ===============================

async function setupPerfilPage() {
    const form = document.getElementById("perfilForm");
    const session = getSession();

    if (!session) {
        window.location.href = "login.html?next=perfil.html";
        return;
    }
    if (!form) return;

    const backLink = document.getElementById("perfilBackLink");
    const roleLabel = document.getElementById("perfilRoleLabel");
    if (backLink) {
        backLink.href = session.role === "admin" ? "admin.html"
            : session.role === "comerciante" ? "dashboard.html" : "index.html";
    }

    const fields = {
        nome: document.getElementById("perfilNome"),
        email: document.getElementById("perfilEmail"),
        telefone: document.getElementById("perfilTelefone"),
        cep: document.getElementById("perfilCep"),
        endereco: document.getElementById("perfilEndereco"),
        lojaSection: document.getElementById("perfilLojaSection"),
        lojaNome: document.getElementById("perfilLojaNome"),
        lojaCep: document.getElementById("perfilLojaCep"),
        lojaEndereco: document.getElementById("perfilLojaEndereco"),
        senhaAtual: document.getElementById("perfilSenhaAtual"),
        senhaNova: document.getElementById("perfilSenhaNova")
    };

    setupCepAutofill(fields.cep, fields.endereco);
    setupCepAutofill(fields.lojaCep, fields.lojaEndereco);

    try {
        const res = await fetch(`${API_BASE}/perfil`);
        if (!res.ok) throw new Error("Falha ao carregar perfil");
        const data = await res.json();

        if (fields.nome) fields.nome.value = data.nome || "";
        if (fields.email) fields.email.value = data.email || "";
        if (fields.telefone) fields.telefone.value = data.telefone || "";
        if (fields.cep) fields.cep.value = data.cep || "";
        if (fields.endereco) fields.endereco.value = data.endereco || "";

        if (roleLabel) {
            roleLabel.textContent = data.funcao === "comerciante" ? "Conta de lojista"
                : data.funcao === "admin" ? "Conta de administrador" : "Conta de cliente";
        }

        if (data.funcao === "comerciante" && data.loja) {
            if (fields.lojaSection) fields.lojaSection.classList.remove("hidden");
            if (fields.lojaNome) fields.lojaNome.value = data.loja.nome || "";
            if (fields.lojaCep) fields.lojaCep.value = data.loja.cep || "";
            if (fields.lojaEndereco) fields.lojaEndereco.value = data.loja.localizacao || "";
        }
    } catch (e) {
        console.error(e);
        showMessage("Nao foi possivel carregar seu perfil. Faca login novamente.", "error");
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const nome = fields.nome?.value.trim();
        if (!nome) {
            showMessage("Informe seu nome.");
            return;
        }

        const senhaNova = fields.senhaNova?.value.trim();
        const senhaAtual = fields.senhaAtual?.value.trim();
        if (senhaNova && !senhaAtual) {
            showMessage("Digite a senha atual para trocar a senha.", "warning");
            return;
        }

        const payload = {
            nome,
            telefone: fields.telefone?.value.trim() || null,
            cep: fields.cep?.value.trim() || null,
            endereco: fields.endereco?.value.trim() || null
        };

        if (fields.lojaSection && !fields.lojaSection.classList.contains("hidden")) {
            payload.loja_nome = fields.lojaNome?.value.trim() || null;
            payload.loja_cep = fields.lojaCep?.value.trim() || null;
            payload.loja_localizacao = fields.lojaEndereco?.value.trim() || null;
        }

        if (senhaNova) {
            payload.senha_atual = senhaAtual;
            payload.senha_nova = senhaNova;
        }

        try {
            const res = await fetch(`${API_BASE}/perfil`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                showMessage(err.detail || "Nao foi possivel salvar o perfil.", "error");
                return;
            }

            // Atualiza o nome exibido na sessao local.
            saveSession({ ...session, name: nome });

            if (fields.senhaAtual) fields.senhaAtual.value = "";
            if (fields.senhaNova) fields.senhaNova.value = "";
            showMessage("Perfil atualizado com sucesso.", "success");
        } catch (e) {
            console.error(e);
            showMessage("Erro ao conectar ao servidor.", "error");
        }
    });
}

async function mergeGuestCartIntoBackend(session) {
    // Ao logar/cadastrar, leva o carrinho que o visitante montou (localStorage)
    // para o carrinho do usuario no backend, para nao perder os itens.
    if (!session || session.role !== "cliente") return;

    let guestCart = [];
    try {
        guestCart = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
    } catch (e) {
        guestCart = [];
    }
    if (!Array.isArray(guestCart) || guestCart.length === 0) return;

    // Quantidades ja existentes no backend, para somar em vez de sobrescrever
    const backendQty = {};
    try {
        const response = await fetch(`${API_BASE}/carrinho?email=${encodeURIComponent(session.email)}`);
        if (response.ok) {
            const data = await response.json();
            (data || []).forEach(item => {
                const id = item.id ?? item.produto_id;
                if (id) backendQty[id] = Number(item.quantidade ?? item.quantity ?? 0);
            });
        }
    } catch (e) {
        console.error(e);
    }

    for (const item of guestCart) {
        const id = item.id ?? item.produto_id;
        const qty = Number(item.quantity ?? item.quantidade ?? 1);
        if (!id || qty <= 0) continue;

        const novaQtd = (backendQty[id] || 0) + qty;
        try {
            await fetch(`${API_BASE}/carrinho`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario_email: session.email, produto_id: id, quantidade: novaQtd })
            });
        } catch (e) {
            console.error(e);
        }
    }

    // Visitante migrado: limpa o carrinho local para evitar duplicar
    localStorage.removeItem(STORAGE_KEYS.cart);
    await updateCartCount();
}

function setupLoginPage() {
    const loginForm = document.getElementById("loginForm");
    const roleButtons = document.querySelectorAll("[data-role-option]");

    let selectedRole = "cliente";

    const activeRoleButton = document.querySelector("[data-role-option].active");

    if (activeRoleButton) {
        selectedRole = activeRoleButton.dataset.roleOption;
    }

    // Mostra o "Cadastre-se" só para cliente/comerciante (admin não faz auto-cadastro),
    // e leva o papel escolhido para a página de cadastro.
    function updateSignupLink(role) {
        const prompt = document.getElementById("signupPrompt");
        const link = document.getElementById("signupLink");
        if (!prompt) return;

        if (role === "admin") {
            prompt.style.display = "none";
        } else {
            prompt.style.display = "";
            if (link) link.setAttribute("href", `register.html?role=${role}`);
        }
    }

    updateSignupLink(selectedRole);

    roleButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectedRole = button.dataset.roleOption;

            roleButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            updateSignupLink(selectedRole);
        });
    });

    if (!loginForm) return;

    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("email")?.value.trim().toLowerCase();
        const password = document.getElementById("password")?.value.trim();

        if (!email) {
            showMessage("Digite seu e-mail.");
            return;
        }

        if (!password) {
            showMessage("Digite sua senha.");
            return;
        }

        const requestedRole = selectedRole;
        const nextPage = getQueryParam("next");

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role: requestedRole })
            });

            if (!response.ok) {
                const err = await response.json();
                showMessage(err.detail || "E-mail ou senha incorretos.");
                return;
            }

            const session = await response.json();
            saveSession(session);
            await mergeGuestCartIntoBackend(session);

            if (nextPage) {
                window.location.href = nextPage;
                return;
            }

            const redirect = session.role === "admin" ? "admin.html" : session.role === "comerciante" ? "dashboard.html" : "carrinho.html";
            window.location.href = redirect;
        } catch (e) {
            showMessage("Erro ao conectar ao servidor de autenticação.");
            console.error(e);
        }
    });
}

async function setupRegisterPage() {
    const registerForm = document.getElementById("registerForm");
    if (!registerForm) return;

    // Papel vindo da tela de login (register.html?role=comerciante). Só cliente ou comerciante.
    const role = (getQueryParam("role") || "cliente").toLowerCase() === "comerciante"
        ? "comerciante"
        : "cliente";

    const storeField = document.getElementById("storeNameField");
    const storeInput = document.getElementById("storeName");

    if (role === "comerciante") {
        if (storeField) storeField.classList.remove("hidden");

        const titleEl = document.getElementById("registerTitle");
        const subtitleEl = document.getElementById("registerSubtitle");
        const introEl = document.getElementById("registerIntro");

        if (titleEl) titleEl.textContent = "Cadastro de Lojista";
        if (subtitleEl) subtitleEl.textContent = "Informe seus dados e o nome da sua loja.";
        if (introEl) introEl.textContent = "Crie sua conta de comerciante para gerenciar sua loja e seus produtos.";

        setupCepAutofill(document.getElementById("storeCep"), document.getElementById("storeEndereco"));
    }

    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("name")?.value.trim();
        const email = document.getElementById("email")?.value.trim().toLowerCase();
        const password = document.getElementById("password")?.value.trim();
        const storeName = storeInput?.value.trim();
        const nextPage = getQueryParam("next");

        if (!name) {
            showMessage("Digite seu nome.");
            return;
        }

        if (!email) {
            showMessage("Digite seu e-mail.");
            return;
        }

        if (!password) {
            showMessage("Digite sua senha.");
            return;
        }

        if (role === "comerciante" && !storeName) {
            showMessage("Digite o nome da sua loja.");
            return;
        }

        const payload = { name, email, password, role };
        if (role === "comerciante") {
            payload.store_name = storeName;
            payload.cep = document.getElementById("storeCep")?.value.trim() || null;
            payload.localizacao = document.getElementById("storeEndereco")?.value.trim() || null;
        }

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                showMessage(err.detail || "Erro ao cadastrar.");
                return;
            }

            const session = await response.json();
            saveSession(session);
            await mergeGuestCartIntoBackend(session);

            if (session.role === "comerciante") {
                window.location.href = "dashboard.html";
            } else {
                window.location.href = nextPage || "carrinho.html";
            }
        } catch (e) {
            showMessage("Erro ao conectar ao servidor de cadastro.");
            console.error(e);
        }
    });
}

async function setupPedidosPage() {
    const session = getSession();
    if (!session) {
        window.location.href = "login.html?next=pedidos.html";
        return;
    }

    const canManageOrders = session.role === "admin" || session.role === "comerciante";

    // ── Ativa o layout correto ──────────────────────────────────────────────
    const layoutCliente = document.getElementById("layoutCliente");
    const layoutPainel  = document.getElementById("layoutPainel");

    if (layoutCliente && layoutPainel) {
        if (canManageOrders) {
            layoutPainel.style.display  = "flex";
            layoutCliente.style.display = "none";

            // Esconde o link "Administração" para comerciantes (não admin)
            const adminNavLink = document.getElementById("adminNavLink");
            if (adminNavLink && session.role !== "admin") {
                adminNavLink.style.display = "none";
            }
        } else {
            layoutCliente.style.display = "flex";
            layoutPainel.style.display  = "none";
        }
    }

    // ── Seleciona elementos do layout ativo ────────────────────────────────
    const activeLayout = canManageOrders ? layoutPainel : layoutCliente;
    const table   = activeLayout ? activeLayout.querySelector("#pedidoTable")  : document.getElementById("pedidoTable");
    const details = activeLayout ? activeLayout.querySelector("#orderDetails") : document.getElementById("orderDetails");

    if (details) {
        details.classList.add("hidden");
        details.style.display = "none";
    }

    try {
        const response = await fetch(`${API_BASE}/pedidos?email=${encodeURIComponent(session.email)}`);
        if (!response.ok) throw new Error("Erro ao buscar pedidos.");
        const pedidos = await response.json();

        if (!table) return;

        if (pedidos.length === 0) {
            table.innerHTML = createEmptyTableState({
                colspan: 6,
                icon: "receipt_long",
                title: "Nenhum pedido encontrado",
                description: canManageOrders
                    ? "Os pedidos aparecerao aqui assim que os clientes concluirem compras."
                    : "Quando voce finalizar sua primeira compra, ela aparecera nesta lista.",
                actionLabel: canManageOrders ? "Ver catalogo" : "Explorar produtos",
                actionHref: canManageOrders ? "catalogo.html" : "loja.html"
            });
            return;
        }

        table.innerHTML = pedidos.map(pedido => `
            <tr>
                <td class="px-4 py-3">${pedido.id}</td>
                <td class="px-4 py-3">${escapeHTML(pedido.usuario_email)}</td>
                <td class="px-4 py-3">
                    <span class="badge-status ${getOrderStatusClass(pedido.status)}">
                        ${escapeHTML(pedido.status)}
                    </span>
                </td>
                <td class="px-4 py-3">${formatCurrency(pedido.total)}</td>
                <td class="px-4 py-3">${formatDate(pedido.criado_em)}</td>
                <td class="px-4 py-3 text-end">
                    <div class="order-actions">
                        <button class="btn btn-sm btn-outline-secondary" data-view-order="${pedido.id}">Ver detalhes</button>
                        ${canManageOrders ? `
                            <select class="form-select form-select-sm order-status-select" data-order-status="${pedido.id}">
                                ${renderOrderStatusOptions(pedido.status)}
                            </select>
                            <button class="btn btn-sm btn-primary" data-save-order-status="${pedido.id}">Atualizar</button>
                        ` : ""}
                    </div>
                </td>
            </tr>
        `).join("");

        table.querySelectorAll("[data-view-order]").forEach(button => {
            button.addEventListener("click", async () => {
                const pedidoId = button.dataset.viewOrder;
                if (!pedidoId) return;

                try {
                    const res = await fetch(`${API_BASE}/pedidos/${pedidoId}`);
                    if (!res.ok) throw new Error("Erro ao buscar detalhes do pedido.");
                    const pedido = await res.json();

                    if (!details) return;
                    details.innerHTML = `
                        <h3 class="mb-3">Pedido #${pedido.id}</h3>
                        <p><strong>Cliente:</strong> ${escapeHTML(pedido.usuario_email)}</p>
                        <p>
                            <strong>Status:</strong>
                            <span class="badge-status ${getOrderStatusClass(pedido.status)}">
                                ${escapeHTML(pedido.status)}
                            </span>
                        </p>
                        <p><strong>Total:</strong> ${formatCurrency(pedido.total)}</p>
                        <p><strong>Data:</strong> ${formatDate(pedido.criado_em)}</p>
                        <div class="mt-4">
                            <h4 class="mb-2">Acompanhamento</h4>
                            ${renderOrderStatusTimeline(pedido.status)}
                        </div>
                        <div class="mt-4">
                            <h4 class="mb-2">Itens</h4>
                            <ul class="list-group">
                                ${pedido.itens.map(item => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        ${escapeHTML(item.produto_id)} x${item.quantidade}
                                        <span>${formatCurrency(item.preco_unitario)}</span>
                                    </li>
                                `).join("")}
                            </ul>
                        </div>
                    `;
                    details.classList.remove("hidden");
                    details.style.display = "";
                    details.scrollIntoView({ behavior: "smooth", block: "start" });
                } catch (e) {
                    console.error(e);
                    showMessage("Erro ao exibir os detalhes do pedido.", "error");
                }
            });
        });

        table.querySelectorAll("[data-save-order-status]").forEach(button => {
            button.addEventListener("click", async () => {
                const orderId = button.dataset.saveOrderStatus;
                const select = table.querySelector(`[data-order-status="${orderId}"]`);
                if (!orderId || !select) return;

                const updated = await updateOrderStatus(orderId, select.value);
                if (updated) {
                    await setupPedidosPage();
                }
            });
        });

    } catch (e) {
        console.error(e);
        if (table) {
            table.innerHTML = createEmptyTableState({
                colspan: 6,
                icon: "cloud_off",
                title: "Nao foi possivel carregar os pedidos",
                description: "Verifique se o backend esta ativo e tente novamente em instantes."
            });
        }
    }
}

// ===============================
// Catálogo - catalogo.html
// ===============================
async function setupCatalogoPage() {
    await renderCatalogo();
}

function isManagerSession(session = getSession()) {
    return Boolean(session && (session.role === "admin" || session.role === "comerciante"));
}

function updateCatalogModeUI(isManagementView) {
    const description = document.getElementById("catalogDescription") || document.querySelector(".topbar p");
    const badge = document.getElementById("catalogModeBadge") || document.querySelector(".cart-pill");

    if (description) {
        description.textContent = isManagementView
            ? "Gerencie os produtos da sua loja, revise status e edite os cadastros."
            : "VisualizaÃ§Ã£o pÃºblica dos registros ativos.";
    }

    if (badge) {
        if (isManagementView) {
            badge.innerHTML = `
                <span class="material-symbols-outlined">edit_square</span>
                Modo gestÃ£o
            `;
        } else {
            badge.innerHTML = `
                <span class="material-symbols-outlined">shopping_cart</span>
                Lista: <strong data-cart-count>0</strong>
            `;
        }
    }
}

async function renderCatalogo() {
    const grid = document.getElementById("catalogGrid");
    const searchInput = document.getElementById("catalogSearch");
    const categorySelect = document.getElementById("catalogCategory");
    const sortSelect = document.getElementById("catalogSort");
    const session = getSession();
    const managementView = isManagerSession(session);

    if (!grid) return;

    updateCatalogModeUI(managementView);
    await updateCartCount();

    const itemsList = managementView
        ? await getVisibleItemsForCurrentUser()
        : await getItems();

    function loadCategories() {
        if (!categorySelect) return;

        const categories = [...new Set(itemsList.map(item => item.categoria))];

        categorySelect.innerHTML = `
            <option value="Todos">Todas as categorias</option>
            ${categories.map(category => `
                <option value="${escapeHTML(category)}">${escapeHTML(category)}</option>
            `).join("")}
        `;
    }

    async function render() {
        let items = managementView
            ? await getVisibleItemsForCurrentUser()
            : await getItems();

        if (!managementView) {
            items = items.filter(item => {
                return item.status === "Ativo" ||
                    item.status === "Baixo estoque" ||
                    item.status === "Baixo volume";
            });
        }

        const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const selectedCategory = categorySelect ? categorySelect.value : "Todos";
        const sort = sortSelect ? sortSelect.value : "recent";

        if (term) {
            items = items.filter(item => {
                const text = `${item.nome} ${item.categoria} ${item.descricao} ${item.nome_loja || ""}`.toLowerCase();
                return text.includes(term);
            });
        }

        if (selectedCategory !== "Todos") {
            items = items.filter(item => item.categoria === selectedCategory);
        }

        if (sort === "name") {
            items.sort((a, b) => a.nome.localeCompare(b.nome));
        }

        if (sort === "priceAsc") {
            items.sort((a, b) => Number(a.preco) - Number(b.preco));
        }

        if (sort === "priceDesc") {
            items.sort((a, b) => Number(b.preco) - Number(a.preco));
        }

        if (sort === "recent") {
            items.sort((a, b) => new Date(b.data_criacao || b.createdAt) - new Date(a.data_criacao || a.createdAt));
        }

        const favorites = managementView ? [] : await getFavorites();

        grid.innerHTML = items.map(item => {
            const isFavorite = favorites.includes(item.id);

            return `
                <article class="catalog-card">
                    <img src="${escapeHTML(item.imagem || makePlaceholder(item.nome))}" alt="${escapeHTML(item.nome)}">

                    <div class="catalog-card-body">
                        <span class="badge text-bg-light">${escapeHTML(item.categoria)}</span>

                        <h3>${escapeHTML(item.nome)}</h3>

                        <p>${escapeHTML(item.descricao || "Sem descrição.")}</p>

                        <small class="text-muted">${escapeHTML(item.nome_loja || "LocalMarket")}</small>

                        <strong>${formatCurrency(item.preco)}</strong>

                        <small class="text-muted">${Number(item.quantidade || 0)} disponíveis</small>

                        <div class="catalog-card-footer">
                            <button class="btn btn-primary flex-fill" data-add-cart="${escapeHTML(item.id)}">
                                <span class="material-symbols-outlined">add_shopping_cart</span>
                                Adicionar
                            </button>

                            <button class="btn btn-outline-secondary" data-favorite="${escapeHTML(item.id)}">
                                <span class="material-symbols-outlined">
                                    ${isFavorite ? "favorite" : "favorite_border"}
                                </span>
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");

        if (managementView) {
            const cards = grid.querySelectorAll(".catalog-card");

            cards.forEach((card, index) => {
                const item = items[index];
                const footer = card.querySelector(".catalog-card-footer");
                if (!item || !footer) return;

                const statusBadge = document.createElement("span");
                statusBadge.className = `badge-status ${getStatusClass(item.status)}`;
                statusBadge.textContent = item.status;
                footer.before(statusBadge);

                footer.innerHTML = `
                    <a href="cadastro.html?id=${encodeURIComponent(item.id)}" class="btn btn-primary flex-fill">
                        <span class="material-symbols-outlined">edit</span>
                        Editar produto
                    </a>
                `;
            });
        }

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum item encontrado</h3>
                    <p>${managementView
                        ? "Nenhum produto da sua loja corresponde aos filtros aplicados."
                        : "Ajuste os filtros ou explore outras categorias para encontrar mais produtos."}</p>
                </div>
            `;
        }

        if (!managementView) {
            setupCatalogActions();
        }
    }

    loadCategories();

    if (searchInput) {
        searchInput.addEventListener("input", render);
    }

    if (categorySelect) {
        categorySelect.addEventListener("change", render);
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", render);
    }

    await render();
}

function setupCatalogActions() {
    document.querySelectorAll("[data-add-cart]").forEach(button => {
        button.onclick = async () => {
            const itemId = button.dataset.addCart;
            const session = getSession();
            
            if (!session) {
                // Visitante
                let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
                let existing = cart.find(item => item.id === itemId);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    cart.push({ id: itemId, quantity: 1, addedAt: new Date().toISOString() });
                }
                localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
                await updateCartCount();
                showMessage("Item adicionado ao carrinho.", "success");
                return;
            }

            try {
                // Obter carrinho do usuário do backend
                let cart = await getCart();
                let existing = cart.find(item => item.id === itemId);
                let newQty = existing ? existing.quantity + 1 : 1;

                const response = await fetch(`${API_BASE}/carrinho`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ usuario_email: session.email, produto_id: itemId, quantidade: newQty })
                });

                if (response.ok) {
                    await updateCartCount();
                    showMessage("Item adicionado ao carrinho.", "success");
                }
            } catch (e) {
                console.error(e);
            }
        };
    });

    document.querySelectorAll("[data-favorite]").forEach(button => {
        button.onclick = async () => {
            const itemId = button.dataset.favorite;
            const session = getSession();

            if (!session) {
                // Visitante local
                let favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || "[]");
                if (favorites.includes(itemId)) {
                    favorites = favorites.filter(id => id !== itemId);
                } else {
                    favorites.push(itemId);
                }
                localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
                await renderCatalogo();
                return;
            }

            try {
                await fetch(`${API_BASE}/favoritos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ usuario_email: session.email, produto_id: itemId })
                });
                await renderCatalogo();
            } catch (e) {
                console.error(e);
            }
        };
    });
}

// ===============================
// Dashboard - dashboard.html
// ===============================

async function setupDashboardPage() {
    await renderDashboardItems();
    await renderCupons();
}

async function getVisibleItemsForCurrentUser() {
    const session = getSession();
    if (!session) return [];

    let items = await getItems();

    if (session.role === "admin") {
        return items;
    }

    return items.filter(item => {
        return !item.slug_dono || item.slug_dono === session.storeSlug;
    });
}

async function renderDashboardItems() {
    const table = document.getElementById("dashboardTable");
    const searchInput = document.getElementById("dashboardSearch");
    const exportButton = document.getElementById("exportItems");

    if (!table) return;

    async function render() {
        const session = getSession();
        const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

        let items = await getVisibleItemsForCurrentUser();

        if (term) {
            items = items.filter(item => {
                const text = `${item.nome} ${item.categoria} ${item.status}`.toLowerCase();
                return text.includes(term);
            });
        }

        table.innerHTML = items.map(item => {
            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(item.nome)}</strong>
                        <br>
                        <small class="text-muted">${escapeHTML(item.id)}</small>
                    </td>

                    <td>${escapeHTML(item.categoria)}</td>

                    <td>${formatCurrency(item.preco)}</td>

                    <td>${Number(item.quantidade || 0)}</td>

                    <td>
                        <span class="badge-status ${getStatusClass(item.status)}">
                            ${escapeHTML(item.status)}
                        </span>
                    </td>

                    <td class="text-end">
                        <a href="cadastro.html?id=${encodeURIComponent(item.id)}" class="btn btn-sm btn-outline-secondary">
                            Editar
                        </a>

                        <button class="btn btn-sm btn-outline-danger" data-delete-item="${escapeHTML(item.id)}">
                            Excluir
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        if (items.length === 0) {
            table.innerHTML = createEmptyTableState({
                colspan: 6,
                icon: "inventory_2",
                title: "Nenhum registro encontrado",
                description: "Cadastre seu primeiro item ou ajuste a busca para visualizar os produtos.",
                actionLabel: "Cadastrar item",
                actionHref: "cadastro.html"
            });
        }

        await updateDashboardMetrics();

        document.querySelectorAll("[data-delete-item]").forEach(button => {
            button.addEventListener("click", async () => {
                const id = button.dataset.deleteItem;

                if (!confirm("Deseja excluir este item?")) return;

                try {
                    const response = await fetch(`${API_BASE}/produtos/${id}`, {
                        method: "DELETE"
                    });
                    if (response.ok) {
                        showMessage("Item excluído.", "success");
                        await render();
                    } else {
                        showMessage("Erro ao excluir item do banco.", "error");
                    }
                } catch (e) {
                    console.error(e);
                }
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", render);
    }

    if (exportButton) {
        exportButton.addEventListener("click", async () => {
            exportCSV("registros.csv", await getVisibleItemsForCurrentUser());
        });
    }
    
    const importFakeStoreBtn = document.getElementById("importFakeStore");
    if (importFakeStoreBtn) {
        importFakeStoreBtn.addEventListener("click", async () => {
            await importFromFakeStore();
            await render();
        });
    }

    await render();
}

async function importFromFakeStore() {
    const session = getSession();
    if (!session) return;
    
    const importBtn = document.getElementById("importFakeStore");
    if (importBtn) {
        importBtn.disabled = true;
        importBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Importando...';
    }

    try {
        const response = await fetch("https://fakestoreapi.com/products");
        const products = await response.json();
        
        let addedCount = 0;
        
        for (const prod of products) {
            const userSlug = session.role === "admin" ? "admin" : session.storeSlug;
            const newId = `FS-${userSlug}-${prod.id}`;
            
            // Verificar existência no backend
            let exists = false;
            try {
                const check = await fetch(`${API_BASE}/produtos/${newId}`);
                exists = check.ok;
            } catch (e) {}

            if (!exists) {
                const itemData = {
                    id: newId,
                    slug_dono: userSlug,
                    nome_loja: session.name,
                    nome: prod.title,
                    categoria: prod.category,
                    descricao: prod.description,
                    preco: prod.price,
                    quantidade: 10,
                    status: "Rascunho",
                    imagem: prod.image,
                    destaque: false
                };

                const saveRes = await fetch(`${API_BASE}/produtos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(itemData)
                });
                if (saveRes.ok) addedCount++;
            }
        }
        
        showMessage(addedCount > 0 ? `${addedCount} produtos importados como Rascunho com sucesso!` : "Nenhum produto novo para importar.");
    } catch (error) {
        showMessage("Erro ao importar produtos da Fake Store API.");
        console.error(error);
    } finally {
        if (importBtn) {
            importBtn.disabled = false;
            importBtn.innerHTML = '<span class="material-symbols-outlined">cloud_download</span> Importar Fake Store';
        }
    }
}

async function updateDashboardMetrics() {
    const items = await getVisibleItemsForCurrentUser();

    const total = items.length;

    const active = items.filter(item => {
        return item.status === "Ativo";
    }).length;

    const low = items.filter(item => {
        return item.status === "Baixo estoque" || item.status === "Baixo volume";
    }).length;

    const totalValue = items.reduce((sum, item) => {
        return sum + Number(item.preco || 0) * Number(item.quantidade || 0);
    }, 0);

    const metricTotal = document.getElementById("metricTotal");
    const metricActive = document.getElementById("metricActive");
    const metricLow = document.getElementById("metricLow");
    const metricValue = document.getElementById("metricValue");

    if (metricTotal) metricTotal.textContent = total;
    if (metricActive) metricActive.textContent = active;
    if (metricLow) metricLow.textContent = low;
    if (metricValue) metricValue.textContent = formatCurrency(totalValue);
}

// ===============================
// Cadastro - cadastro.html
// ===============================

async function setupCadastroPage() {
    const form = document.getElementById("itemForm");
    const categoryModalElement = document.getElementById("categoryModal");
    const categoryForm = document.getElementById("categoryForm");
    const openCategoryModalButton = document.getElementById("openCategoryModal");
    const newCategoryName = document.getElementById("newCategoryName");
    const productCategoryList = document.getElementById("productCategoryList");

    if (!form) return;

    const session = getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("id");

    const fields = {
        id: document.getElementById("itemId"),
        name: document.getElementById("itemName"),
        category: document.getElementById("itemCategory"),
        description: document.getElementById("itemDescription"),
        price: document.getElementById("itemPrice"),
        quantity: document.getElementById("itemQuantity"),
        status: document.getElementById("itemStatus"),
        image: document.getElementById("itemImage"),
        featured: document.getElementById("itemFeatured")
    };

    const categoryModal = categoryModalElement && window.bootstrap
        ? new window.bootstrap.Modal(categoryModalElement)
        : null;

    async function loadProductCategories(selectedValue = "") {
        const categories = await getCategorias("produto");
        fillCategorySelect(fields.category, categories, {
            placeholder: "Selecione uma categoria",
            selectedValue: selectedValue || editingItem?.categoria || ""
        });
    }

    async function renderProductCategoryManager() {
        if (!productCategoryList) return;

        const categories = await getCategorias("produto");
        if (categories.length === 0) {
            productCategoryList.innerHTML = `<div class="list-group-item text-muted small">Nenhuma categoria cadastrada.</div>`;
            return;
        }

        productCategoryList.innerHTML = categories.map(category => `
            <div class="list-group-item d-flex justify-content-between align-items-center gap-3">
                <div>
                    <strong>${escapeHTML(category.nome)}</strong>
                    <div class="text-muted small">Criada em ${formatDate(category.data_criacao)}</div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-edit-product-category="${category.id}" data-category-name="${escapeHTML(category.nome)}">
                    Renomear
                </button>
            </div>
        `).join("");

        productCategoryList.querySelectorAll("[data-edit-product-category]").forEach(button => {
            button.addEventListener("click", async () => {
                const currentName = button.dataset.categoryName || "";
                const nextName = window.prompt("Digite o novo nome da categoria:", currentName);
                if (!nextName || nextName.trim() === currentName) return;

                try {
                    const updated = await updateCategoria(button.dataset.editProductCategory, "produto", nextName.trim());
                    const selectedValue = fields.category?.value === currentName ? updated.nome : fields.category?.value;
                    await loadProductCategories(selectedValue || "");
                    await renderProductCategoryManager();
                    setupPreview(fields);
                    showMessage("Categoria atualizada com sucesso.", "success");
                } catch (e) {
                    showMessage(e.message || "Nao foi possivel atualizar a categoria.", "error");
                }
            });
        });
    }

    let editingItem = null;
    if (editId) {
        try {
            const res = await fetch(`${API_BASE}/produtos/${editId}`);
            if (res.ok) {
                editingItem = await res.json();
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (editingItem) {
        if (session.role !== "admin" && editingItem.slug_dono && editingItem.slug_dono !== session.storeSlug) {
            showMessage("Você não tem permissão para editar este item.");
            window.location.href = "dashboard.html";
            return;
        }

        if (fields.id) fields.id.value = editingItem.id;
        if (fields.name) fields.name.value = editingItem.nome;
        if (fields.description) fields.description.value = editingItem.descricao;
        if (fields.price) fields.price.value = editingItem.preco;
        if (fields.quantity) fields.quantity.value = editingItem.quantidade;
        if (fields.status) fields.status.value = editingItem.status;
        if (fields.image) fields.image.value = editingItem.imagem || "";
        if (fields.featured) fields.featured.checked = Boolean(editingItem.destaque);

        const formTitle = document.getElementById("formTitle");

        if (formTitle) {
            formTitle.textContent = "Editar registro";
        }
    }

    await loadProductCategories(editingItem?.categoria || "");
    await renderProductCategoryManager();

    setupPreview(fields);

    const clearButton = document.getElementById("clearForm");

    if (clearButton) {
        clearButton.addEventListener("click", async () => {
            form.reset();

            if (fields.id) {
                fields.id.value = "";
            }

            await loadProductCategories();

            setupPreview(fields);
        });
    }

    if (openCategoryModalButton) {
        openCategoryModalButton.addEventListener("click", async () => {
            if (newCategoryName) newCategoryName.value = "";
            await renderProductCategoryManager();
            if (categoryModal) categoryModal.show();
        });
    }

    if (categoryForm) {
        categoryForm.addEventListener("submit", async event => {
            event.preventDefault();
            const categoryName = newCategoryName?.value.trim();

            if (!categoryName) {
                showMessage("Digite o nome da nova categoria.", "warning");
                return;
            }

            try {
                const created = await createCategoria("produto", categoryName);
                await loadProductCategories(created.nome);
                await renderProductCategoryManager();
                categoryForm.reset();
                setupPreview(fields);
                showMessage("Categoria criada com sucesso.", "success");
            } catch (e) {
                showMessage(e.message || "Nao foi possivel criar a categoria.", "error");
            }
        });
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const name = fields.name?.value.trim();

        if (!name) {
            showMessage("Digite o nome do item.");
            return;
        }

        const selectedCategory = fields.category?.value.trim();
        if (!selectedCategory) {
            showMessage("Selecione uma categoria para o produto.", "warning");
            return;
        }

        const id = fields.id?.value || `ITEM-${Date.now()}`;
        const quantity = Number(fields.quantity?.value || 0);

        const slug_dono = editingItem
            ? editingItem.slug_dono
            : session.role === "admin"
                ? "admin"
                : session.storeSlug;

        const nome_loja = editingItem
            ? editingItem.nome_loja
            : session.name;

        const item = {
            id,
            slug_dono,
            nome_loja,
            nome: name,
            categoria: selectedCategory,
            descricao: fields.description?.value.trim() || "",
            preco: Number(fields.price?.value || 0),
            quantidade: quantity,
            status: getStatusByQuantity(quantity, fields.status?.value),
            imagem: fields.image?.value.trim() || makePlaceholder(name),
            destaque: fields.featured ? fields.featured.checked : false
        };

        const url = editingItem ? `${API_BASE}/produtos/${id}` : `${API_BASE}/produtos`;
        const method = editingItem ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item)
            });

            if (response.ok) {
                showMessage("Item salvo com sucesso.");
                window.location.href = "dashboard.html";
            } else {
                showMessage("Erro ao salvar o produto.");
            }
        } catch (e) {
            showMessage("Erro ao conectar com o banco de dados.");
            console.error(e);
        }
    });
}

function setupPreview(fields) {
    const previewImage = document.getElementById("previewImage");
    const previewName = document.getElementById("previewName");
    const previewCategory = document.getElementById("previewCategory");
    const previewDescription = document.getElementById("previewDescription");
    const previewPrice = document.getElementById("previewPrice");
    const previewQuantity = document.getElementById("previewQuantity");

    function updatePreview() {
        const name = fields.name?.value.trim() || "Nome do registro";
        const category = fields.category?.value || "Categoria";
        const description = fields.description?.value.trim() || "A descrição aparecerá aqui em tempo real.";
        const price = fields.price?.value || 0;
        const quantity = fields.quantity?.value || 0;
        const image = fields.image?.value.trim() || makePlaceholder(name);

        if (previewImage) previewImage.src = image;
        if (previewName) previewName.textContent = name;
        if (previewCategory) previewCategory.textContent = category;
        if (previewDescription) previewDescription.textContent = description;
        if (previewPrice) previewPrice.textContent = formatCurrency(price);
        if (previewQuantity) previewQuantity.textContent = `${quantity} unidades`;
    }

    Object.values(fields).forEach(field => {
        if (!field) return;

        field.addEventListener("input", updatePreview);
        field.addEventListener("change", updatePreview);
    });

    updatePreview();
}

// ===============================
// Admin - admin.html
// ===============================

async function setupAdminPage() {
    await renderAdmin();
}

async function renderCupons() {
    const table = document.getElementById("cupomTable");
    const form = document.getElementById("cupomForm");

    if (!table) return;

    const session = getSession();
    if (!session) return;

    try {
        const cupons = await fetch(`${API_BASE}/cupons?email=${encodeURIComponent(session.email)}`).then(r => r.ok ? r.json() : []);
        table.innerHTML = cupons.length === 0 ? `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">Nenhum cupom criado ainda.</td>
            </tr>
        ` : cupons.map(cupom => `
            <tr>
                <td><strong>${escapeHTML(cupom.codigo)}</strong></td>
                <td>${escapeHTML(cupom.descricao || "-")}</td>
                <td>${escapeHTML(cupom.loja_slug || "Todos" )}${cupom.categoria ? ` / ${escapeHTML(cupom.categoria)}` : ""}</td>
                <td>${cupom.tipo === "percentual" ? `${cupom.valor}%` : formatCurrency(cupom.valor)}</td>
                <td>${cupom.ativo ? "Ativo" : "Inativo"}</td>
            </tr>
        `).join("");
    } catch (e) {
        console.error(e);
    }

    if (form) {
        form.onsubmit = async (event) => {
            event.preventDefault();
            const codigo = document.getElementById("cupomCodigo")?.value.trim().toUpperCase();
            const descricao = document.getElementById("cupomDescricao")?.value.trim();
            const tipo = document.getElementById("cupomTipo")?.value;
            const valor = Number(document.getElementById("cupomValor")?.value || 0);
            const lojaSlug = document.getElementById("cupomLoja")?.value.trim();
            const categoria = document.getElementById("cupomCategoria")?.value.trim();
            const ativo = document.getElementById("cupomAtivo")?.checked ?? true;

            if (!codigo || !valor) {
                showMessage("Preencha código e valor do cupom.");
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/cupons`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        codigo,
                        descricao,
                        tipo,
                        valor,
                        loja_slug: lojaSlug || null,
                        categoria: categoria || null,
                        ativo,
                        criado_por: session.email
                    })
                });

                if (response.ok) {
                    showMessage("Cupom criado com sucesso.", "success");
                    form.reset();
                    await renderCupons();
                } else {
                    const msg = await response.text();
                    showMessage(msg || "Erro ao criar cupom.");
                }
            } catch (e) {
                showMessage("Erro ao conectar com o banco de dados.");
                console.error(e);
            }
        };
    }
}

async function renderAdmin() {
    const table = document.getElementById("adminTable");
    const addButton = document.getElementById("addOrganization");
    const exportButton = document.getElementById("exportOrganizations");
    const storeForm = document.getElementById("storeForm");
    const storeModalElement = document.getElementById("storeModal");
    const storeCategoryModalElement = document.getElementById("storeCategoryModal");
    const storeCategoryForm = document.getElementById("storeCategoryForm");
    const openStoreCategoryModalButton = document.getElementById("openStoreCategoryModal");
    const newStoreCategoryName = document.getElementById("newStoreCategoryName");
    const storeCategoryList = document.getElementById("storeCategoryList");
    const storeModalTitle = document.getElementById("storeModalTitle");
    const storeSubmitButton = document.getElementById("storeSubmitButton");
    const tableHeadRow = document.querySelector("#adminTable")?.closest("table")?.querySelector("thead tr");

    if (!table) return;

    const storeFields = {
        id: document.getElementById("storeId"),
        name: document.getElementById("storeName"),
        category: document.getElementById("storeCategory"),
        location: document.getElementById("storeLocation"),
        cep: document.getElementById("storeCep"),
        image: document.getElementById("storeImage"),
        ownerName: document.getElementById("storeOwnerName"),
        ownerEmail: document.getElementById("storeOwnerEmail"),
        ownerPassword: document.getElementById("storeOwnerPassword"),
        ownerBirthDate: document.getElementById("storeOwnerBirthDate"),
        status: document.getElementById("storeStatus")
    };

    const storeModal = storeModalElement && window.bootstrap
        ? new window.bootstrap.Modal(storeModalElement)
        : null;
    const storeCategoryModal = storeCategoryModalElement && window.bootstrap
        ? new window.bootstrap.Modal(storeCategoryModalElement)
        : null;

    let organizationMap = new Map();

    async function loadStoreCategories(selectedValue = "") {
        const categories = await getCategorias("loja");
        fillCategorySelect(storeFields.category, categories, {
            placeholder: "Selecione uma categoria",
            selectedValue
        });
    }

    async function renderStoreCategoryManager() {
        if (!storeCategoryList) return;

        const categories = await getCategorias("loja");
        if (categories.length === 0) {
            storeCategoryList.innerHTML = `<div class="list-group-item text-muted small">Nenhuma categoria cadastrada.</div>`;
            return;
        }

        storeCategoryList.innerHTML = categories.map(category => `
            <div class="list-group-item d-flex justify-content-between align-items-center gap-3">
                <div>
                    <strong>${escapeHTML(category.nome)}</strong>
                    <div class="text-muted small">Criada em ${formatDate(category.data_criacao)}</div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-edit-store-category="${category.id}" data-category-name="${escapeHTML(category.nome)}">
                    Renomear
                </button>
            </div>
        `).join("");

        storeCategoryList.querySelectorAll("[data-edit-store-category]").forEach(button => {
            button.addEventListener("click", async () => {
                const currentName = button.dataset.categoryName || "";
                const nextName = window.prompt("Digite o novo nome da categoria da loja:", currentName);
                if (!nextName || nextName.trim() === currentName) return;

                try {
                    const updated = await updateCategoria(button.dataset.editStoreCategory, "loja", nextName.trim());
                    const selectedValue = storeFields.category?.value === currentName ? updated.nome : storeFields.category?.value;
                    await loadStoreCategories(selectedValue || "");
                    await renderStoreCategoryManager();
                    await render();
                    showMessage("Categoria da loja atualizada com sucesso.", "success");
                } catch (e) {
                    showMessage(e.message || "Nao foi possivel atualizar a categoria.", "error");
                }
            });
        });
    }

    async function openStoreForm(store = null) {
        if (!storeForm) return;

        if (storeFields.id) storeFields.id.value = store?.id || "";
        if (storeFields.name) storeFields.name.value = store?.nome || "";
        await loadStoreCategories(store?.categoria || "");
        if (storeFields.location) storeFields.location.value = store?.localizacao || "";
        if (storeFields.cep) storeFields.cep.value = store?.cep || "";
        if (storeFields.image) storeFields.image.value = store?.imagem || "";
        if (storeFields.ownerName) storeFields.ownerName.value = store?.nome_proprietario || "";
        if (storeFields.ownerEmail) storeFields.ownerEmail.value = store?.email_proprietario || "";
        if (storeFields.ownerPassword) storeFields.ownerPassword.value = "";
        if (storeFields.ownerBirthDate) {
            storeFields.ownerBirthDate.value = store?.data_nascimento_proprietario
                ? String(store.data_nascimento_proprietario).split("T")[0]
                : "";
        }
        if (storeFields.status) storeFields.status.value = store?.status || "Pendente";

        if (storeModalTitle) {
            storeModalTitle.textContent = store ? "Editar loja" : "Cadastrar loja";
        }
        if (storeSubmitButton) {
            storeSubmitButton.textContent = store ? "Salvar alteracoes" : "Salvar loja";
        }

        if (storeModal) {
            storeModal.show();
        }
    }

    async function render() {
        const organizations = await getOrganizations();
        const allItems = await getItems();
        organizationMap = new Map(organizations.map(org => [org.id, org]));

        if (tableHeadRow) {
            tableHeadRow.innerHTML = `
                <th>Loja</th>
                <th>Proprietario</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Data</th>
                <th class="text-end">Acoes</th>
            `;
        }

        const adminTotal = document.getElementById("adminTotal");
        const adminActive = document.getElementById("adminActive");
        const adminPending = document.getElementById("adminPending");
        const adminItems = document.getElementById("adminItems");

        if (adminTotal) adminTotal.textContent = organizations.length;

        if (adminActive) {
            adminActive.textContent = organizations.filter(org => org.status === "Ativo").length;
        }

        if (adminPending) {
            adminPending.textContent = organizations.filter(org => org.status === "Pendente").length;
        }

        if (adminItems) adminItems.textContent = allItems.length;

        const clients = await getUsuarios("cliente");
        const adminClients = document.getElementById("adminClients");
        const clienteTable = document.getElementById("clienteTable");

        if (adminClients) adminClients.textContent = clients.length;
        if (clienteTable) {
            if (clients.length === 0) {
                clienteTable.innerHTML = createEmptyTableState({
                    colspan: 4,
                    icon: "person_off",
                    title: "Nenhum cliente cadastrado",
                    description: "Os clientes aparecerao aqui assim que criarem uma conta na plataforma."
                });
            } else {
                clienteTable.innerHTML = clients.map(user => `
                    <tr>
                        <td>${escapeHTML(user.email)}</td>
                        <td>${escapeHTML(user.name)}</td>
                        <td>${formatDate(user.data_criacao)}</td>
                        <td class="text-end">${escapeHTML(user.funcao)}</td>
                    </tr>
                `).join("");
            }
        }

        table.innerHTML = organizations.map(org => {
            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(org.nome)}</strong>
                        <br>
                        <small class="text-muted">${escapeHTML(org.categoria || "Sem categoria")} • ${escapeHTML(org.localizacao || "Nao informado")}</small>
                    </td>

                    <td>
                        <strong>${escapeHTML(org.nome_proprietario || "Nao informado")}</strong>
                        <br>
                        <small class="text-muted">Nascimento: ${formatDate(org.data_nascimento_proprietario)}</small>
                    </td>

                    <td>
                        <strong>${escapeHTML(org.email_proprietario || "-")}</strong>
                        <br>
                        <small class="text-muted">Slug: ${escapeHTML(org.slug_loja || "-")}</small>
                    </td>

                    <td>
                        <span class="badge-status ${getStatusClass(org.status)}">
                            ${escapeHTML(org.status)}
                        </span>
                    </td>

                    <td>${formatDate(org.data_criacao)}</td>

                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary" data-edit-org="${escapeHTML(org.id)}">
                            Editar
                        </button>

                        <button class="btn btn-sm btn-outline-secondary" data-change-org="${escapeHTML(org.id)}">
                            Alterar status
                        </button>

                        <button class="btn btn-sm btn-outline-danger" data-delete-org="${escapeHTML(org.id)}">
                            Excluir
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        if (organizations.length === 0) {
            table.innerHTML = createEmptyTableState({
                colspan: 6,
                icon: "storefront",
                title: "Nenhuma loja cadastrada",
                description: "Cadastre a primeira loja para comecar a administracao."
            });
        }

        document.querySelectorAll("[data-edit-org]").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.dataset.editOrg;
                openStoreForm(organizationMap.get(id));
            });
        });

        document.querySelectorAll("[data-change-org]").forEach(button => {
            button.addEventListener("click", async () => {
                const id = button.dataset.changeOrg;
                try {
                    const response = await fetch(`${API_BASE}/lojas/${id}/status`, {
                        method: "PUT"
                    });
                    if (response.ok) {
                        await render();
                    }
                } catch (e) {
                    console.error(e);
                }
            });
        });

        document.querySelectorAll("[data-delete-org]").forEach(button => {
            button.addEventListener("click", async () => {
                const id = button.dataset.deleteOrg;

                if (!confirm("Deseja excluir esta unidade?")) return;

                try {
                    const response = await fetch(`${API_BASE}/lojas/${id}`, {
                        method: "DELETE"
                    });
                    if (response.ok) {
                        showMessage("Loja excluída.");
                        await render();
                    }
                } catch (e) {
                    console.error(e);
                }
            });
        });
    }

    if (addButton) {
        addButton.onclick = () => {
            openStoreForm();
        };
    }

    if (openStoreCategoryModalButton) {
        openStoreCategoryModalButton.onclick = async () => {
            if (newStoreCategoryName) newStoreCategoryName.value = "";
            await renderStoreCategoryManager();
            if (storeCategoryModal) storeCategoryModal.show();
        };
    }

    if (storeFields.cep) {
        storeFields.cep.addEventListener("blur", async () => {
            const rawCep = storeFields.cep.value.replace(/\D/g, "");
            if (rawCep.length !== 8) return;

            try {
                const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
                const data = await response.json();
                if (data.erro) {
                    showMessage("CEP nao encontrado. Confira o numero informado.", "warning");
                    return;
                }

                const address = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`]
                    .filter(Boolean)
                    .join(", ");

                if (storeFields.location && address) {
                    storeFields.location.value = address;
                }
            } catch (e) {
                console.error(e);
                showMessage("Nao foi possivel consultar o CEP agora.", "warning");
            }
        });
    }

    if (storeCategoryForm) {
        storeCategoryForm.onsubmit = async event => {
            event.preventDefault();
            const categoryName = newStoreCategoryName?.value.trim();
            if (!categoryName) {
                showMessage("Digite o nome da categoria da loja.", "warning");
                return;
            }

            try {
                const created = await createCategoria("loja", categoryName);
                await loadStoreCategories(created.nome);
                await renderStoreCategoryManager();
                storeCategoryForm.reset();
                showMessage("Categoria da loja criada com sucesso.", "success");
            } catch (e) {
                showMessage(e.message || "Nao foi possivel criar a categoria.", "error");
            }
        };
    }

    if (storeForm) {
        storeForm.onsubmit = async event => {
            event.preventDefault();

            const id = storeFields.id?.value.trim();
            const payload = {
                nome: storeFields.name?.value.trim(),
                categoria: storeFields.category?.value.trim(),
                localizacao: storeFields.location?.value.trim(),
                cep: storeFields.cep?.value.trim() || null,
                imagem: storeFields.image?.value.trim() || null,
                nome_proprietario: storeFields.ownerName?.value.trim(),
                email_proprietario: storeFields.ownerEmail?.value.trim(),
                senha_proprietario: storeFields.ownerPassword?.value.trim() || null,
                data_nascimento_proprietario: storeFields.ownerBirthDate?.value,
                status: storeFields.status?.value || "Pendente"
            };

            if (!payload.nome || !payload.categoria || !payload.localizacao || !payload.nome_proprietario || !payload.email_proprietario || !payload.data_nascimento_proprietario) {
                showMessage("Preencha todos os campos obrigatorios da loja e do proprietario.", "warning");
                return;
            }

            const isEditing = Boolean(id);
            if (!isEditing && !payload.senha_proprietario) {
                showMessage("Defina uma senha para criar o acesso do lojista.", "warning");
                return;
            }
            const url = isEditing ? `${API_BASE}/lojas/${id}` : `${API_BASE}/lojas`;
            const method = isEditing ? "PUT" : "POST";

            try {
                const response = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    showMessage(error.detail || "Nao foi possivel salvar a loja.", "error");
                    return;
                }

                showMessage(isEditing ? "Loja atualizada com sucesso." : "Loja cadastrada com sucesso.", "success");
                storeForm.reset();
                await loadStoreCategories();
                await renderStoreCategoryManager();
                if (storeModal) {
                    storeModal.hide();
                }
                await render();
            } catch (e) {
                console.error(e);
                showMessage("Erro ao conectar com o banco de dados.", "error");
            }
        };
    }

    if (exportButton) {
        exportButton.onclick = async () => {
            exportCSV("administracao.csv", await getOrganizations());
        };
    }

    await render();
    await loadStoreCategories();
    await renderStoreCategoryManager();
    await renderCupons();
}

// ===============================
// Exportar CSV
// ===============================

function exportCSV(filename, rows) {
    if (!rows || rows.length === 0) {
        showMessage("Não há dados para exportar.");
        return;
    }

    const headers = Object.keys(rows[0]);

    const csv = [
        headers.join(";"),
        ...rows.map(row => {
            return headers.map(header => {
                const value = row[header] ?? "";
                return `"${String(value).replaceAll('"', '""')}"`;
            }).join(";");
        })
    ].join("\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    URL.revokeObjectURL(link.href);
}

// ===============================
// Carrinho - carrinho.html
// ===============================

async function setupCarrinhoPage() {
    await renderCarrinho();

    const checkoutBtn = document.getElementById("finalizarPedido");
    const couponBtn = document.getElementById("applyCouponBtn");
    const couponInput = document.getElementById("couponCode");

    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            const session = getSession();
            if (!session) {
                showMessage("Você precisa estar logado para finalizar o pedido.");
                window.location.href = "login.html?next=carrinho.html";
                return;
            }

            if (session.role !== "cliente") {
                showMessage("AÃ§Ã£o nÃ£o permitida para este tipo de usuÃ¡rio. FaÃ§a login com uma conta de cliente para finalizar a compra.", "warning");
                return;
            }

            await imprimirCupom();
        };
    }

    if (couponBtn && couponInput) {
        couponBtn.onclick = async () => {
            await applyCoupon();
        };

        couponInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await applyCoupon();
            }
        });
    }
}

async function applyCoupon() {
    const couponInput = document.getElementById("couponCode");
    const couponStatus = document.getElementById("couponStatus");
    const cart = await getCart();
    const session = getSession();

    if (!couponInput || cart.length === 0) {
        if (couponStatus) couponStatus.textContent = "Adicione produtos ao carrinho antes de usar um cupom.";
        return;
    }

    const codigo = couponInput.value.trim().toUpperCase();
    if (!codigo) {
        activeCoupon = null;
        if (couponStatus) couponStatus.textContent = "Nenhum cupom aplicado.";
        await renderCarrinho();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/cupons/validar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codigo,
                itens: cart.map(item => ({ produto_id: item.id, quantidade: item.quantity || item.quantidade || 1 }))
            })
        });

        const result = await response.json();
        if (!response.ok || !result.aplicavel) {
            activeCoupon = null;
            if (couponStatus) couponStatus.textContent = result.mensagem || "Cupom inválido para este carrinho.";
            await renderCarrinho();
            return;
        }

        activeCoupon = result;
        if (couponStatus) couponStatus.textContent = `${result.codigo} aplicado: ${result.desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} de desconto.`;
        await renderCarrinho();
    } catch (e) {
        console.error(e);
        if (couponStatus) couponStatus.textContent = "Não foi possível validar o cupom.";
    }
}

async function imprimirCupom() {
    const cart = await getCart();
    const allItems = await getItems();
    const session = getSession();

    if (!session) {
        showMessage("Voce precisa estar logado para finalizar o pedido.", "warning");
        window.location.href = "login.html?next=carrinho.html";
        return;
    }

    if (session.role !== "cliente") {
        showMessage("Acao nao permitida para este tipo de usuario. Apenas clientes podem finalizar compras.", "warning");
        return;
    }

    if (cart.length === 0) {
        showMessage("Seu carrinho está vazio.");
        return;
    }

    let subtotal = 0;
    let discount = 0;
    const itemsHtml = cart.map(cartItem => {
        const item = allItems.find(i => i.id === cartItem.id);
        if (!item) return "";
        const qty = Number(cartItem.quantity ?? cartItem.quantidade ?? 1);
        const total = Number(item.preco) * qty;
        subtotal += total;
        return `
            <tr>
                <td style="padding: 5px 0;">${item.nome} (x${qty})</td>
                <td style="padding: 5px 0; text-align: right;">${formatCurrency(item.preco)}</td>
                <td style="padding: 5px 0; text-align: right;">${formatCurrency(total)}</td>
            </tr>
        `;
    }).join("");

    if (activeCoupon && activeCoupon.aplicavel) {
        discount = activeCoupon.desconto;
    }

    const pedidoRes = await fetch(`${API_BASE}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            usuario_email: session.email,
            itens: cart.map(item => ({ produto_id: item.id, quantidade: item.quantity || item.quantidade || 1 })),
            total: subtotal,
            cupom_codigo: activeCoupon?.codigo || null
        })
    });

    if (!pedidoRes.ok) {
        const errText = await pedidoRes.text();
        showMessage(errText || "Não foi possível processar o pedido.");
        return;
    }

    const pedidoData = await pedidoRes.json();

    const totalComDesconto = Math.max(0, subtotal - discount);

    const couponWindow = window.open("", "_blank", "width=400,height=600");
    couponWindow.document.write(`
        <html>
        <head>
            <title>Cupom LocalMarket</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; padding: 20px; line-height: 1.2; }
                .text-center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                .total { font-weight: bold; font-size: 1.2em; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h2>LocalMarket</h2>
                <p>Obrigado pela preferência!</p>
            </div>
            <div class="divider"></div>
            <p><strong>Pedido:</strong> #${pedidoData.id}</p>
            <p><strong>Cliente:</strong> ${session.name}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
            <div class="divider"></div>
            <table>
                <thead>
                    <tr>
                        <th style="padding: 5px 0; text-align: left;">Produto</th>
                        <th style="padding: 5px 0; text-align: right;">Valor Unitário</th>
                        <th style="padding: 5px 0; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div class="divider"></div>
            <div>
                <span style="float: left;">Subtotal:</span>
                <span style="float: right;">${formatCurrency(subtotal)}</span>
                <div style="clear: both;"></div>
            </div>
            ${discount > 0 ? `
            <div>
                <span style="float: left;">Desconto${activeCoupon?.codigo ? ` (${activeCoupon.codigo})` : ""}:</span>
                <span style="float: right;">- ${formatCurrency(discount)}</span>
                <div style="clear: both;"></div>
            </div>
            ` : ""}
            <div class="divider"></div>
            <div class="total">
                <span style="float: left;">TOTAL:</span>
                <span style="float: right;">${formatCurrency(totalComDesconto)}</span>
                <div style="clear: both;"></div>
            </div>
            <div class="divider"></div>
            <div class="text-center" style="margin-top: 20px;">
                <p>Apresente este cupom na loja para retirar seus produtos.</p>
                <p>Pedido #${pedidoData.id}</p>
            </div>
            <script>
                window.onload = function() { 
                    window.print(); 
                    setTimeout(() => { window.close(); }, 500);
                };
            </script>
        </body>
        </html>
    `);
    couponWindow.document.close();
    
    // Limpar carrinho no backend e localmente
    try {
        await fetch(`${API_BASE}/carrinho/limpar?email=${encodeURIComponent(session.email)}`, {
            method: "POST"
        });
    } catch (e) {
        console.error(e);
    }
    
    localStorage.removeItem(STORAGE_KEYS.cart);
    activeCoupon = null;
    const couponInput = document.getElementById("couponCode");
    const couponStatus = document.getElementById("couponStatus");
    if (couponInput) couponInput.value = "";
    if (couponStatus) couponStatus.textContent = "Nenhum cupom aplicado.";
    await renderCarrinho();
    showMessage("Pedido criado com sucesso. Voce pode acompanhar o andamento na pagina de pedidos.", "success");
    window.setTimeout(() => {
        window.location.href = "pedidos.html";
    }, 900);
}

async function renderCarrinho() {
    const list = document.getElementById("cartItemsList");
    const emptyMsg = document.getElementById("emptyCart");
    const content = document.getElementById("cartContent");
    const subtotalEl = document.getElementById("subtotalValue");
    const totalEl = document.getElementById("totalValue");

    if (!list) return;

    const cart = await getCart();
    const allItems = await getItems();
    
    if (cart.length === 0) {
        if (content) content.classList.add("hidden");
        if (emptyMsg) emptyMsg.classList.remove("hidden");
        return;
    }

    if (content) content.classList.remove("hidden");
    if (emptyMsg) emptyMsg.classList.add("hidden");

    let subtotal = 0;
    const discount = activeCoupon && activeCoupon.aplicavel ? activeCoupon.desconto : 0;

    list.innerHTML = cart.map((cartItem) => {
        const item = allItems.find(i => i.id === cartItem.id);
        if (!item) return "";

        const qty = Number(cartItem.quantity ?? cartItem.quantidade ?? 1);
        const itemTotal = Number(item.preco) * qty;
        subtotal += itemTotal;

        return `
            <div class="flex flex-col md:flex-row md:items-center gap-4 p-4 border-b border-slate-100 last:border-0">
                <img src="${escapeHTML(item.imagem || makePlaceholder(item.nome))}" class="w-20 h-20 object-cover rounded-lg flex-shrink-0">
                <div class="flex-grow min-w-0">
                    <h3 class="font-bold text-slate-900">${escapeHTML(item.nome)}</h3>
                    <p class="text-sm text-slate-500">${escapeHTML(item.nome_loja || "Loja")}</p>
                    <div class="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span><strong>Unidades:</strong> ${qty}</span>
                        <span><strong>Preço:</strong> ${formatCurrency(item.preco)}</span>
                        <span><strong>Desconto:</strong> R$ 0,00</span>
                    </div>
                    <div class="text-emerald-700 font-extrabold mt-2">Subtotal: ${formatCurrency(itemTotal)}</div>
                </div>
                <div class="flex items-center gap-3 md:ml-auto">
                    <button class="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600" onclick="updateCartQuantity('${cartItem.id}', -1)">-</button>
                    <span class="font-bold min-w-5 text-center">${qty}</span>
                    <button class="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600" onclick="updateCartQuantity('${cartItem.id}', 1)">+</button>
                </div>
            </div>
        `;
    }).join("");

    const total = Math.max(0, subtotal - discount);
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = formatCurrency(total);

    const couponStatus = document.getElementById("couponStatus");
    if (couponStatus) {
        if (activeCoupon && activeCoupon.aplicavel) {
            couponStatus.textContent = `${activeCoupon.codigo} aplicado: ${formatCurrency(activeCoupon.desconto)} de desconto.`;
        } else if (activeCoupon) {
            couponStatus.textContent = activeCoupon.mensagem || "Cupom inválido para este carrinho.";
        } else {
            couponStatus.textContent = "Nenhum cupom aplicado.";
        }
    }

    await updateCartCount();
}

window.updateCartQuantity = async function(id, change) {
    const session = getSession();
    if (!session) {
        let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
        let item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
        }
        localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
        await renderCarrinho();
        return;
    }

    try {
        let cart = await getCart();
        let item = cart.find(i => i.id === id);
        if (item) {
            let newQty = item.quantity + change;
            const response = await fetch(`${API_BASE}/carrinho`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario_email: session.email, produto_id: id, quantidade: newQty })
            });
            if (response.ok) {
                await renderCarrinho();
            }
        }
    } catch (e) {
        console.error(e);
    }
};

// ===============================
// Lógica de Acessibilidade
// ===============================

window.toggleContrast = function() {
    document.body.classList.toggle('high-contrast');
    const isContrast = document.body.classList.contains('high-contrast');
    localStorage.setItem('accessibility_contrast', isContrast ? 'true' : 'false');
}

let currentFontSize = 100; 
window.changeFontSize = function(delta) {
    currentFontSize += delta * 10;
    
    // Limites para não quebrar o layout
    if (currentFontSize < 80) currentFontSize = 80;
    if (currentFontSize > 200) currentFontSize = 200;
    
    document.documentElement.style.fontSize = `${currentFontSize}%`;
}

// Carregar preferências ao abrir qualquer página
if (localStorage.getItem('accessibility_contrast') === 'true') {
    document.body.classList.add('high-contrast');
}

function ensureToastHost() {
    let host = document.getElementById("toastHost");

    if (host) return host;

    host = document.createElement("div");
    host.id = "toastHost";
    host.className = "toast-host";
    document.body.appendChild(host);

    return host;
}
