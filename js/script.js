// ===============================
// LocalMarket / Hub Gestão - script geral
// Um único JS alimentando todas as páginas
// ===============================

const STORAGE_KEYS = {
    session: "userSession",
    items: "items",
    cart: "cart",
    favorites: "favorites",
    organizations: "organizations"
};

// ===============================
// Usuários permitidos
// ===============================

const USERS = [
    {
        email: "admin@localmarket.com.br",
        password: "admin123",
        role: "admin",
        name: "Administrador LocalMarket",
        storeSlug: null,
        redirect: "admin.html"
    },
    {
        email: "green@valley.com.br",
        password: "green123",
        role: "comerciante",
        name: "Green Valley Orgânicos",
        storeSlug: "green-valley",
        redirect: "dashboard.html"
    },
    {
        email: "pao@loft.com.br",
        password: "pao123",
        role: "comerciante",
        name: "The Sourdough Loft",
        storeSlug: "sourdough-loft",
        redirect: "dashboard.html"
    },
    {
        email: "bloom@stem.com.br",
        password: "bloom123",
        role: "comerciante",
        name: "Bloom & Stem",
        storeSlug: "bloom-stem",
        redirect: "dashboard.html"
    }
];

// ===============================
// Dados iniciais
// ===============================

const DEFAULT_ITEMS = [
    {
        id: "ITEM-001",
        ownerSlug: "green-valley",
        storeName: "Green Valley Orgânicos",
        name: "Cesta Orgânica",
        category: "Produto",
        description: "Cesta com produtos frescos selecionados.",
        price: 79.9,
        quantity: 18,
        status: "Ativo",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
        featured: true,
        createdAt: "2026-05-01"
    },
    {
        id: "ITEM-002",
        ownerSlug: "sourdough-loft",
        storeName: "The Sourdough Loft",
        name: "Pão Artesanal",
        category: "Produto",
        description: "Pão de fermentação natural produzido artesanalmente.",
        price: 22.5,
        quantity: 12,
        status: "Ativo",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
        featured: true,
        createdAt: "2026-05-02"
    },
    {
        id: "ITEM-003",
        ownerSlug: "bloom-stem",
        storeName: "Bloom & Stem",
        name: "Arranjo Floral",
        category: "Produto",
        description: "Arranjo decorativo com flores naturais.",
        price: 65,
        quantity: 6,
        status: "Ativo",
        image: "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=900&q=80",
        featured: true,
        createdAt: "2026-05-03"
    },
    {
        id: "ITEM-004",
        ownerSlug: "green-valley",
        storeName: "Green Valley Orgânicos",
        name: "Suco Natural",
        category: "Produto",
        description: "Suco natural feito com frutas frescas.",
        price: 14.9,
        quantity: 4,
        status: "Baixo estoque",
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80",
        featured: false,
        createdAt: "2026-05-04"
    }
];

const DEFAULT_ORGANIZATIONS = [
    {
        id: "ORG-001",
        name: "Green Valley Orgânicos",
        category: "Orgânicos",
        location: "Centro da cidade",
        status: "Ativo",
        storeSlug: "green-valley",
        createdAt: "2026-01-10"
    },
    {
        id: "ORG-002",
        name: "The Sourdough Loft",
        category: "Padaria",
        location: "Bairro histórico",
        status: "Ativo",
        storeSlug: "sourdough-loft",
        createdAt: "2026-02-05"
    },
    {
        id: "ORG-003",
        name: "Bloom & Stem",
        category: "Flores",
        location: "Jardim Leste",
        status: "Ativo",
        storeSlug: "bloom-stem",
        createdAt: "2026-03-12"
    }
];

// ===============================
// Inicialização
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    initStorage();
    setupGlobalLinks();
    setupLogoutGlobal();
    protectPage();

    const page = document.body.dataset.page;

    if (page === "home") {
        setupHomePage();
    }

    if (page === "login") {
        setupLoginPage();
    }

    if (page === "catalogo") {
        setupCatalogoPage();
    }

    if (page === "dashboard") {
        setupDashboardPage();
    }

    if (page === "cadastro") {
        setupCadastroPage();
    }

    if (page === "admin") {
        setupAdminPage();
    }

    if (page === "loja") {
        setupLojaPage();
    }
});

// ===============================
// Storage e utilidades
// ===============================

function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.items)) {
        localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(DEFAULT_ITEMS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.organizations)) {
        localStorage.setItem(STORAGE_KEYS.organizations, JSON.stringify(DEFAULT_ORGANIZATIONS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.cart)) {
        localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.favorites)) {
        localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([]));
    }
}

function getData(key, fallback = []) {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getSession() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
}

function saveSession(user) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
        email: user.email,
        role: user.role,
        name: user.name,
        storeSlug: user.storeSlug,
        loggedAt: new Date().toISOString()
    }));
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem("localmarket_session");
}

function getItems() {
    return getData(STORAGE_KEYS.items, DEFAULT_ITEMS);
}

function saveItems(items) {
    saveData(STORAGE_KEYS.items, items);
}

function getOrganizations() {
    return getData(STORAGE_KEYS.organizations, DEFAULT_ORGANIZATIONS);
}

function saveOrganizations(organizations) {
    saveData(STORAGE_KEYS.organizations, organizations);
}

function getCart() {
    return getData(STORAGE_KEYS.cart, []);
}

function saveCart(cart) {
    saveData(STORAGE_KEYS.cart, cart);
    updateCartCount();
}

function getFavorites() {
    return getData(STORAGE_KEYS.favorites, []);
}

function saveFavorites(favorites) {
    saveData(STORAGE_KEYS.favorites, favorites);
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

function setupGlobalLinks() {
    updateCartCount();
    setupActiveMenu();
    setupUserInfo();
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

function updateCartCount() {
    const cartCount = document.querySelector("[data-cart-count]");
    const savedCart = getCart();

    if (cartCount) {
        cartCount.textContent = savedCart.reduce((sum, item) => {
            return sum + Number(item.quantity || 1);
        }, 0);
    }
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

function setupLojaPage() {
    const params = new URLSearchParams(window.location.search);
    const storeSlug = params.get("loja");

    if (!storeSlug) {
        window.location.href = "index.html";
        return;
    }

    const storeUser = USERS.find(u => u.storeSlug === storeSlug);
    
    const storeNameHeader = document.getElementById("storeNameHeader");
    const storeDescHeader = document.getElementById("storeDescHeader");
    
    if (storeNameHeader) {
        storeNameHeader.textContent = storeUser ? storeUser.name : "Loja Parceira";
    }

    renderLojaItems(storeSlug);
}

function renderLojaItems(storeSlug) {
    const grid = document.getElementById("lojaGrid");
    const emptyMessage = document.getElementById("emptyLojaMessage");

    if (!grid) return;

    let items = getItems().filter(item => {
        return (item.ownerSlug === storeSlug) && 
               (item.status === "Ativo" || item.status === "Baixo estoque" || item.status === "Baixo volume");
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
                    <img class="w-full h-full object-contain p-4 mix-blend-multiply" src="${escapeHTML(item.image || makePlaceholder(item.name))}" alt="${escapeHTML(item.name)}">
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit mb-2">
                        ${escapeHTML(item.category)}
                    </span>
                    <h3 class="text-lg font-extrabold text-slate-900 mb-1">${escapeHTML(item.name)}</h3>
                    <p class="text-sm text-slate-500 mb-3 flex-grow line-clamp-2">${escapeHTML(item.description || "Sem descrição.")}</p>
                    <div class="mt-auto">
                        <strong class="text-xl text-slate-900 block mb-3">${formatCurrency(item.price)}</strong>
                        <button class="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700 transition" onclick="showMessage('Adicionado ao carrinho!')">
                            Comprar
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
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

    loginForm.addEventListener("submit", event => {
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

        const user = USERS.find(account => {
            return account.email === email &&
                account.password === password &&
                account.role === requestedRole;
        });

        if (!user) {
            showMessage("E-mail ou senha incorretos para este tipo de acesso.");
            return;
        }

        saveSession(user);
        window.location.href = user.redirect;
    });
}

// ===============================
// Catálogo - catalogo.html
// ===============================

function setupCatalogoPage() {
    renderCatalogo();
}

function renderCatalogo() {
    const grid = document.getElementById("catalogGrid");
    const searchInput = document.getElementById("catalogSearch");
    const categorySelect = document.getElementById("catalogCategory");
    const sortSelect = document.getElementById("catalogSort");

    if (!grid) return;

    function loadCategories() {
        if (!categorySelect) return;

        const categories = [...new Set(getItems().map(item => item.category))];

        categorySelect.innerHTML = `
            <option value="Todos">Todas as categorias</option>
            ${categories.map(category => `
                <option value="${escapeHTML(category)}">${escapeHTML(category)}</option>
            `).join("")}
        `;
    }

    function render() {
        let items = getItems().filter(item => {
            return item.status === "Ativo" ||
                item.status === "Baixo estoque" ||
                item.status === "Baixo volume";
        });

        const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const selectedCategory = categorySelect ? categorySelect.value : "Todos";
        const sort = sortSelect ? sortSelect.value : "recent";

        if (term) {
            items = items.filter(item => {
                const text = `${item.name} ${item.category} ${item.description} ${item.storeName || ""}`.toLowerCase();
                return text.includes(term);
            });
        }

        if (selectedCategory !== "Todos") {
            items = items.filter(item => item.category === selectedCategory);
        }

        if (sort === "name") {
            items.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (sort === "priceAsc") {
            items.sort((a, b) => Number(a.price) - Number(b.price));
        }

        if (sort === "priceDesc") {
            items.sort((a, b) => Number(b.price) - Number(a.price));
        }

        if (sort === "recent") {
            items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        const favorites = getFavorites();

        grid.innerHTML = items.map(item => {
            const isFavorite = favorites.includes(item.id);

            return `
                <article class="catalog-card">
                    <img src="${escapeHTML(item.image || makePlaceholder(item.name))}" alt="${escapeHTML(item.name)}">

                    <div class="catalog-card-body">
                        <span class="badge text-bg-light">${escapeHTML(item.category)}</span>

                        <h3>${escapeHTML(item.name)}</h3>

                        <p>${escapeHTML(item.description || "Sem descrição.")}</p>

                        <small class="text-muted">${escapeHTML(item.storeName || "LocalMarket")}</small>

                        <strong>${formatCurrency(item.price)}</strong>

                        <small class="text-muted">${Number(item.quantity || 0)} disponíveis</small>

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

    render();
}

function setupCatalogActions() {
    document.querySelectorAll("[data-add-cart]").forEach(button => {
        button.onclick = () => {
            const itemId = button.dataset.addCart;
            const cart = getCart();
            const existingItem = cart.find(item => item.id === itemId);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: itemId,
                    quantity: 1,
                    addedAt: new Date().toISOString()
                });
            }

            saveCart(cart);
            showMessage("Item adicionado à lista.");
        };
    });

    document.querySelectorAll("[data-favorite]").forEach(button => {
        button.onclick = () => {
            const itemId = button.dataset.favorite;
            let favorites = getFavorites();

            if (favorites.includes(itemId)) {
                favorites = favorites.filter(id => id !== itemId);
            } else {
                favorites.push(itemId);
            }

            saveFavorites(favorites);
            renderCatalogo();
        };
    });
}

// ===============================
// Dashboard - dashboard.html
// ===============================

function setupDashboardPage() {
    renderDashboardItems();
}

function getVisibleItemsForCurrentUser() {
    const session = getSession();
    const items = getItems();

    if (!session) return [];

    if (session.role === "admin") {
        return items;
    }

    return items.filter(item => {
        return !item.ownerSlug || item.ownerSlug === session.storeSlug;
    });
}

function renderDashboardItems() {
    const table = document.getElementById("dashboardTable");
    const searchInput = document.getElementById("dashboardSearch");
    const exportButton = document.getElementById("exportItems");

    if (!table) return;

    function render() {
        const session = getSession();
        const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

        let items = getVisibleItemsForCurrentUser();

        if (term) {
            items = items.filter(item => {
                const text = `${item.name} ${item.category} ${item.status}`.toLowerCase();
                return text.includes(term);
            });
        }

        table.innerHTML = items.map(item => {
            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(item.name)}</strong>
                        <br>
                        <small class="text-muted">${escapeHTML(item.id)}</small>
                    </td>

                    <td>${escapeHTML(item.category)}</td>

                    <td>${formatCurrency(item.price)}</td>

                    <td>${Number(item.quantity || 0)}</td>

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

        updateDashboardMetrics();

        document.querySelectorAll("[data-delete-item]").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.dataset.deleteItem;

                if (!confirm("Deseja excluir este item?")) return;

                const allItems = getItems();
                const item = allItems.find(current => current.id === id);

                if (!item) return;

                if (session.role !== "admin" && item.ownerSlug && item.ownerSlug !== session.storeSlug) {
                    showMessage("Você não tem permissão para excluir este item.");
                    return;
                }

                const updatedItems = allItems.filter(current => current.id !== id);

                saveItems(updatedItems);
                render();
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", render);
    }

    if (exportButton) {
        exportButton.addEventListener("click", () => {
            exportCSV("registros.csv", getVisibleItemsForCurrentUser());
        });
    }
    
    const importFakeStoreBtn = document.getElementById("importFakeStore");
    if (importFakeStoreBtn) {
        importFakeStoreBtn.addEventListener("click", importFromFakeStore);
    }

    render();
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
        
        const currentItems = getItems();
        let addedCount = 0;
        
        products.forEach(prod => {
            const newId = `FS-${prod.id}`;
            const exists = currentItems.some(i => i.id === newId);
            
            if (!exists) {
                currentItems.push({
                    id: newId,
                    ownerSlug: session.role === "admin" ? "admin" : session.storeSlug,
                    storeName: session.name,
                    name: prod.title,
                    category: prod.category,
                    description: prod.description,
                    price: prod.price,
                    quantity: 10,
                    status: "Rascunho", // Desativado por padrão
                    image: prod.image,
                    featured: false,
                    createdAt: new Date().toISOString()
                });
                addedCount++;
            }
        });
        
        saveItems(currentItems);
        showMessage(addedCount > 0 ? `${addedCount} produtos importados como Rascunho com sucesso!` : "Nenhum produto novo para importar.");
        
        renderDashboardItems(); // Re-render table
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

function updateDashboardMetrics() {
    const items = getVisibleItemsForCurrentUser();

    const total = items.length;

    const active = items.filter(item => {
        return item.status === "Ativo";
    }).length;

    const low = items.filter(item => {
        return item.status === "Baixo estoque" || item.status === "Baixo volume";
    }).length;

    const totalValue = items.reduce((sum, item) => {
        return sum + Number(item.price || 0) * Number(item.quantity || 0);
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

function setupCadastroPage() {
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

    const items = getItems();
    const editingItem = items.find(item => item.id === editId);

    if (editingItem) {
        if (session.role !== "admin" && editingItem.ownerSlug && editingItem.ownerSlug !== session.storeSlug) {
            showMessage("Você não tem permissão para editar este item.");
            window.location.href = "dashboard.html";
            return;
        }

        if (fields.id) fields.id.value = editingItem.id;
        if (fields.name) fields.name.value = editingItem.name;
        if (fields.category) fields.category.value = editingItem.category;
        if (fields.description) fields.description.value = editingItem.description;
        if (fields.price) fields.price.value = editingItem.price;
        if (fields.quantity) fields.quantity.value = editingItem.quantity;
        if (fields.status) fields.status.value = editingItem.status;
        if (fields.image) fields.image.value = editingItem.image || "";
        if (fields.featured) fields.featured.checked = Boolean(editingItem.featured);

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

    form.addEventListener("submit", event => {
        event.preventDefault();

        const name = fields.name?.value.trim();

        if (!name) {
            showMessage("Digite o nome do item.");
            return;
        }

        const id = fields.id?.value || `ITEM-${Date.now()}`;
        const quantity = Number(fields.quantity?.value || 0);

        const ownerSlug = editingItem
            ? editingItem.ownerSlug
            : session.role === "admin"
                ? "admin"
                : session.storeSlug;

        const storeName = editingItem
            ? editingItem.storeName
            : session.name;

        const item = {
            id,
            ownerSlug,
            storeName,
            name,
            category: fields.category?.value || "Produto",
            description: fields.description?.value.trim() || "",
            price: Number(fields.price?.value || 0),
            quantity,
            status: getStatusByQuantity(quantity, fields.status?.value),
            image: fields.image?.value.trim() || makePlaceholder(name),
            featured: fields.featured ? fields.featured.checked : false,
            createdAt: editingItem ? editingItem.createdAt : new Date().toISOString()
        };

        const currentItems = getItems();
        const exists = currentItems.some(current => current.id === id);

        const updatedItems = exists
            ? currentItems.map(current => current.id === id ? item : current)
            : [...currentItems, item];

        saveItems(updatedItems);

        showMessage("Item salvo com sucesso.");
        window.location.href = "dashboard.html";
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

function setupAdminPage() {
    renderAdmin();
}

function renderAdmin() {
    const table = document.getElementById("adminTable");
    const addButton = document.getElementById("addOrganization");
    const exportButton = document.getElementById("exportOrganizations");

    if (!table) return;

    function render() {
        const organizations = getOrganizations();

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

        if (adminItems) adminItems.textContent = getItems().length;

        table.innerHTML = organizations.map(org => {
            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(org.name)}</strong>
                        <br>
                        <small class="text-muted">${escapeHTML(org.id)}</small>
                    </td>

                    <td>${escapeHTML(org.category)}</td>

                    <td>${escapeHTML(org.location)}</td>

                    <td>
                        <span class="badge-status ${getStatusClass(org.status)}">
                            ${escapeHTML(org.status)}
                        </span>
                    </td>

                    <td>${formatDate(org.createdAt)}</td>

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
            button.addEventListener("click", () => {
                const id = button.dataset.changeOrg;

                const updated = getOrganizations().map(org => {
                    if (org.id !== id) return org;

                    return {
                        ...org,
                        status: org.status === "Ativo" ? "Pendente" : "Ativo"
                    };
                });

                saveOrganizations(updated);
                render();
            });
        });

        document.querySelectorAll("[data-delete-org]").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.dataset.deleteOrg;

                if (!confirm("Deseja excluir esta unidade?")) return;

                const updated = getOrganizations().filter(org => org.id !== id);

                saveOrganizations(updated);
                render();
            });
        });
    }

    if (addButton) {
        addButton.onclick = () => {
            const name = prompt("Nome da nova unidade:");

            if (!name) return;

            const newOrganization = {
                id: `ORG-${Date.now()}`,
                name,
                category: "Geral",
                location: "Não informado",
                status: "Pendente",
                storeSlug: name.toLowerCase().replace(/\s+/g, "-"),
                createdAt: new Date().toISOString()
            };

            saveOrganizations([...getOrganizations(), newOrganization]);
            render();
        };
    }

    if (exportButton) {
        exportButton.onclick = () => {
            exportCSV("administracao.csv", getOrganizations());
        };
    }

    render();
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