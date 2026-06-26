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
        setupHomePage();
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

    if (page === "carrinho") {
        await setupCarrinhoPage();
    }
});

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

async function getCart() {
    const session = getSession();
    if (!session) {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
    }
    try {
        const response = await fetch(`${API_BASE}/carrinho?email=${encodeURIComponent(session.email)}`);
        if (!response.ok) throw new Error("Erro ao obter carrinho da API");
        return await response.json();
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

function showMessage(message) {
    alert(message);
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

// ===============================
// Proteção de páginas
// ===============================

function protectPage() {
    const page = document.body.dataset.page;

    const publicPages = [
        "home",
        "login",
        "catalogo",
        "lojas",
        "loja",
        "mapa",
        "mapas",
        "privacidade",
        "termos",
        "contato"
    ];

    if (publicPages.includes(page)) return;

    const session = getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    if (page === "admin" && session.role !== "admin") {
        showMessage("Acesso permitido apenas para administradores.");
        window.location.href = "dashboard.html";
        return;
    }

    if ((page === "dashboard" || page === "cadastro") && session.role !== "admin" && session.role !== "comerciante") {
        showMessage("Acesso permitido apenas para comerciantes ou administradores.");
        window.location.href = "login.html";
    }
}

// ===============================
// Funções globais
// ===============================

async function setupGlobalLinks() {
    await updateCartCount();
    setupActiveMenu();
    setupUserInfo();
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

    let organizations = await getOrganizations();

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
        const storeImages = {
            "green-valley": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
            "sourdough-loft": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
            "bloom-stem": "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=900&q=80"
        };
        const imageUrl = storeImages[org.slug_loja] || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80";

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
                        ${escapeHTML(org.localizacao || "Sem localização")}
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

function setupHomePage() {
    const searchInput = document.getElementById("searchInput");
    const categoryButtons = document.querySelectorAll(".category-btn");
    const storeCards = document.querySelectorAll(".store-card");
    const emptyMessage = document.getElementById("emptyMessage");

    let selectedCategory = "todas";

    function filterStores() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
        let visibleCount = 0;

        storeCards.forEach(card => {
            const name = card.dataset.name ? card.dataset.name.toLowerCase() : "";
            const category = card.dataset.category || "";

            const matchesSearch = name.includes(searchTerm);
            const matchesCategory = selectedCategory === "todas" || selectedCategory === category;

            if (matchesSearch && matchesCategory) {
                card.classList.remove("hidden");
                visibleCount++;
            } else {
                card.classList.add("hidden");
            }
        });

        if (!emptyMessage) return;

        if (visibleCount === 0) {
            emptyMessage.classList.remove("hidden");
        } else {
            emptyMessage.classList.add("hidden");
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterStores);
    }

    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectedCategory = button.dataset.category;

            categoryButtons.forEach(btn => {
                btn.classList.remove("active", "bg-emerald-600", "text-white", "border-emerald-600");
                btn.classList.add("bg-white", "text-slate-600", "border-slate-200");
            });

            button.classList.add("active", "bg-emerald-600", "text-white", "border-emerald-600");
            button.classList.remove("bg-white", "text-slate-600", "border-slate-200");

            filterStores();
        });
    });
}

// ===============================
// Login - login.html
// ===============================

function setupLoginPage() {
    const loginForm = document.getElementById("loginForm");
    const roleButtons = document.querySelectorAll("[data-role-option]");

    let selectedRole = "usuario";

    const activeRoleButton = document.querySelector("[data-role-option].active");

    if (activeRoleButton) {
        selectedRole = activeRoleButton.dataset.roleOption;
    }

    roleButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectedRole = button.dataset.roleOption;

            roleButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
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

        const requestedRole = selectedRole === "usuario" ? "comerciante" : selectedRole;

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
            
            const redirect = session.role === "admin" ? "admin.html" : "dashboard.html";
            window.location.href = redirect;
        } catch (e) {
            showMessage("Erro ao conectar ao servidor de autenticação.");
            console.error(e);
        }
    });
}

// ===============================
// Catálogo - catalogo.html
// ===============================

async function setupCatalogoPage() {
    await renderCatalogo();
}

async function renderCatalogo() {
    const grid = document.getElementById("catalogGrid");
    const searchInput = document.getElementById("catalogSearch");
    const categorySelect = document.getElementById("catalogCategory");
    const sortSelect = document.getElementById("catalogSort");

    if (!grid) return;

    const itemsList = await getItems();

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
        let items = await getItems();
        items = items.filter(item => {
            return item.status === "Ativo" ||
                item.status === "Baixo estoque" ||
                item.status === "Baixo volume";
        });

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

        const favorites = await getFavorites();

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

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum item encontrado</h3>
                    <p>Tente alterar a busca ou cadastre um novo registro.</p>
                </div>
            `;
        }

        setupCatalogActions();
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
                showMessage("Item adicionado à lista.");
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
                    showMessage("Item adicionado à lista.");
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
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Nenhum registro encontrado.
                    </td>
                </tr>
            `;
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
                        showMessage("Item excluído.");
                        await render();
                    } else {
                        showMessage("Erro ao excluir item do banco.");
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
        if (fields.category) fields.category.value = editingItem.categoria;
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

    setupPreview(fields);

    const clearButton = document.getElementById("clearForm");

    if (clearButton) {
        clearButton.addEventListener("click", () => {
            form.reset();

            if (fields.id) {
                fields.id.value = "";
            }

            setupPreview(fields);
        });
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const name = fields.name?.value.trim();

        if (!name) {
            showMessage("Digite o nome do item.");
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
            categoria: fields.category?.value || "Produto",
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

async function renderAdmin() {
    const table = document.getElementById("adminTable");
    const addButton = document.getElementById("addOrganization");
    const exportButton = document.getElementById("exportOrganizations");

    if (!table) return;

    async function render() {
        const organizations = await getOrganizations();
        const allItems = await getItems();

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

        table.innerHTML = organizations.map(org => {
            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(org.nome)}</strong>
                        <br>
                        <small class="text-muted">${escapeHTML(org.id)}</small>
                    </td>

                    <td>${escapeHTML(org.categoria)}</td>

                    <td>${escapeHTML(org.localizacao)}</td>

                    <td>
                        <span class="badge-status ${getStatusClass(org.status)}">
                            ${escapeHTML(org.status)}
                        </span>
                    </td>

                    <td>${formatDate(org.data_criacao)}</td>

                    <td class="text-end">
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
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Nenhuma unidade cadastrada.
                    </td>
                </tr>
            `;
        }

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
        addButton.onclick = async () => {
            const name = prompt("Nome da nova unidade:");

            if (!name) return;

            try {
                const response = await fetch(`${API_BASE}/lojas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nome: name })
                });
                if (response.ok) {
                    await render();
                }
            } catch (e) {
                console.error(e);
            }
        };
    }

    if (exportButton) {
        exportButton.onclick = async () => {
            exportCSV("administracao.csv", await getOrganizations());
        };
    }

    await render();
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
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            const session = getSession();
            if (!session) {
                showMessage("Você precisa estar logado para finalizar o pedido.");
                window.location.href = "login.html";
                return;
            }

            await imprimirCupom();
        };
    }
}

async function imprimirCupom() {
    const cart = await getCart();
    const allItems = await getItems();
    const session = getSession();

    if (cart.length === 0) {
        showMessage("Seu carrinho está vazio.");
        return;
    }

    let subtotal = 0;
    const itemsHtml = cart.map(cartItem => {
        const item = allItems.find(i => i.id === cartItem.id);
        if (!item) return "";
        const total = item.preco * cartItem.quantity;
        subtotal += total;
        return `
            <tr>
                <td style="padding: 5px 0;">${item.nome} (x${cartItem.quantity})</td>
                <td style="padding: 5px 0; text-align: right;">${formatCurrency(item.preco)}</td>
                <td style="padding: 5px 0; text-align: right;">${formatCurrency(total)}</td>
            </tr>
        `;
    }).join("");

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
            <div class="total">
                <span style="float: left;">TOTAL:</span>
                <span style="float: right;">${formatCurrency(subtotal)}</span>
                <div style="clear: both;"></div>
            </div>
            <div class="divider"></div>
            <div class="text-center" style="margin-top: 20px;">
                <p>Apresente este cupom na loja para retirar seus produtos.</p>
                <p>#${Math.floor(Math.random() * 1000000)}</p>
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
    await renderCarrinho();
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

    list.innerHTML = cart.map((cartItem) => {
        const item = allItems.find(i => i.id === cartItem.id);
        if (!item) return "";

        const itemTotal = Number(item.preco) * Number(cartItem.quantity);
        subtotal += itemTotal;

        return `
            <div class="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
                <img src="${escapeHTML(item.imagem || makePlaceholder(item.nome))}" class="w-20 h-20 object-cover rounded-lg">
                <div class="flex-grow">
                    <h3 class="font-bold text-slate-900">${escapeHTML(item.nome)}</h3>
                    <p class="text-sm text-slate-500">${escapeHTML(item.nome_loja || "Loja")}</p>
                    <div class="text-emerald-700 font-extrabold mt-1">${formatCurrency(item.preco)}</div>
                </div>
                <div class="flex items-center gap-3">
                    <button class="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600" onclick="updateCartQuantity('${cartItem.id}', -1)">-</button>
                    <span class="font-bold w-4 text-center">${cartItem.quantity}</span>
                    <button class="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600" onclick="updateCartQuantity('${cartItem.id}', 1)">+</button>
                </div>
            </div>
        `;
    }).join("");

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = formatCurrency(subtotal);
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